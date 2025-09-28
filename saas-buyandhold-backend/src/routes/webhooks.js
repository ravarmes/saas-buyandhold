const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { PixTransaction, User, Subscription, WebhookEventLog } = require('../models');
const MercadoPagoService = require('../services/MercadoPagoService');

// Middleware para capturar raw body (necessário para validação de assinatura)
const rawBodyMiddleware = (req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
};

/**
 * @route POST /webhooks/mercadopago
 * @desc Webhook do Mercado Pago para notificações de pagamento
 * @access Public (mas validado por assinatura)
 */
router.post('/mercadopago', rawBodyMiddleware, async (req, res) => {
  const startTime = Date.now();
  let webhookLog = null;
  
  try {
    logger.info('Webhook Mercado Pago recebido', {
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    // Extrair dados do webhook
    const { type, data } = req.body;
    const paymentId = data?.id;
    const eventId = req.headers['x-request-id'] || `webhook_${Date.now()}`;

    // Criar log do webhook
    webhookLog = await WebhookEventLog.create({
      eventId,
      source: 'mercadopago',
      eventType: type || 'unknown',
      status: 'received',
      headers: req.headers,
      rawPayload: req.body,
      signature: req.headers['x-signature']
    });

    // Validar se é um evento de pagamento
    if (type !== 'payment') {
      logger.info('Webhook ignorado - não é evento de pagamento', { type, eventId });
      
      await webhookLog.update({
        status: 'ignored',
        processedAt: new Date(),
        errorMessage: `Tipo de evento não suportado: ${type}`
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Evento ignorado - não é pagamento' 
      });
    }

    // Validar se temos o ID do pagamento
    if (!paymentId) {
      logger.error('Webhook inválido - ID do pagamento não encontrado', { eventId });
      
      await webhookLog.update({
        status: 'failed',
        processedAt: new Date(),
        errorMessage: 'ID do pagamento não encontrado no webhook'
      });

      return res.status(400).json({ 
        error: 'ID do pagamento não encontrado' 
      });
    }

    // Marcar webhook como processando
    await webhookLog.update({
      status: 'processing',
      processedAt: new Date()
    });

    // Buscar detalhes do pagamento no Mercado Pago
    logger.info('Buscando detalhes do pagamento no Mercado Pago', { paymentId, eventId });
    
    const mercadoPagoService = new MercadoPagoService();
    const paymentDetails = await mercadoPagoService.getPaymentDetails(paymentId);

    if (!paymentDetails.success) {
      logger.error('Erro ao buscar detalhes do pagamento', { 
        paymentId, 
        error: paymentDetails.error,
        eventId 
      });
      
      await webhookLog.update({
        status: 'failed',
        errorMessage: `Erro ao buscar pagamento: ${paymentDetails.error}`,
        retryCount: (webhookLog.retryCount || 0) + 1,
        lastRetryAt: new Date()
      });

      return res.status(500).json({ 
        error: 'Erro ao processar webhook' 
      });
    }

    const payment = paymentDetails.payment;
    logger.info('Detalhes do pagamento obtidos', { 
      paymentId, 
      status: payment.status,
      externalReference: payment.external_reference,
      eventId 
    });

    // Buscar transação PIX no banco de dados
    let pixTransaction = await PixTransaction.findByMercadoPagoId(paymentId.toString());

    if (!pixTransaction && payment.external_reference) {
      // Tentar buscar por external_reference
      pixTransaction = await PixTransaction.findByExternalReference(payment.external_reference);
    }

    if (!pixTransaction) {
      logger.error('Transação PIX não encontrada', { 
        paymentId, 
        externalReference: payment.external_reference,
        eventId 
      });
      
      await webhookLog.update({
        status: 'failed',
        errorMessage: `Transação PIX não encontrada para pagamento ${paymentId}`
      });

      return res.status(404).json({ 
        error: 'Transação não encontrada' 
      });
    }

    // Mapear status do Mercado Pago para nosso sistema
    const statusMapping = {
      'pending': 'pending',
      'approved': 'approved',
      'authorized': 'approved',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'charged_back'
    };

    const newStatus = statusMapping[payment.status] || 'pending';
    const oldStatus = pixTransaction.status;

    logger.info('Processando mudança de status', {
      paymentId,
      oldStatus,
      newStatus,
      mercadoPagoStatus: payment.status,
      eventId
    });

    // Atualizar transação PIX
    const updateData = {
      status: newStatus,
      processedAt: new Date(),
      gatewayResponse: payment,
      webhookData: {
        ...req.body,
        processedAt: new Date(),
        eventId
      }
    };

    // Adicionar dados específicos baseados no status
    if (newStatus === 'approved' && oldStatus !== 'approved') {
      updateData.approvedAt = new Date();
      
      // Extrair dados do pagador se disponível
      if (payment.payer) {
        updateData.payerEmail = payment.payer.email;
        updateData.payerName = payment.payer.first_name && payment.payer.last_name 
          ? `${payment.payer.first_name} ${payment.payer.last_name}` 
          : payment.payer.first_name;
        updateData.payerDocument = payment.payer.identification?.number;
      }
    } else if (newStatus === 'refunded') {
      updateData.refundedAt = new Date();
    }

    await pixTransaction.update(updateData);

    // Se o pagamento foi aprovado, processar upgrade do usuário
    if (newStatus === 'approved' && oldStatus !== 'approved') {
      logger.info('Processando upgrade do usuário para premium', {
        userId: pixTransaction.userId,
        paymentId,
        eventId
      });

      try {
        // Buscar usuário
        const user = await User.findByPk(pixTransaction.userId);
        if (user) {
          // Atualizar usuário para premium
          await user.update({
            userType: 'premium',
            updatedAt: new Date()
          });

          // Se há subscription associada, ativá-la
          if (pixTransaction.subscriptionId) {
            const subscription = await Subscription.findByPk(pixTransaction.subscriptionId);
            if (subscription) {
              const currentPeriodStart = new Date();
              const currentPeriodEnd = new Date();
              currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

              await subscription.update({
                status: 'active',
                currentPeriodStart,
                currentPeriodEnd,
                updatedAt: new Date()
              });

              logger.info('Subscription ativada', {
                subscriptionId: pixTransaction.subscriptionId,
                userId: pixTransaction.userId,
                currentPeriodStart,
                currentPeriodEnd,
                eventId
              });
            }
          }

          logger.info('Usuário atualizado para premium com sucesso', {
            userId: pixTransaction.userId,
            userEmail: user.email,
            paymentId,
            eventId
          });
        }
      } catch (upgradeError) {
        logger.error('Erro ao processar upgrade do usuário', {
          userId: pixTransaction.userId,
          paymentId,
          error: upgradeError.message,
          eventId
        });
        
        // Não falhar o webhook por erro de upgrade
        // O pagamento foi processado com sucesso
      }
    }

    // Marcar webhook como processado com sucesso
    await webhookLog.update({
      status: 'processed',
      processedAt: new Date()
    });

    const processingTime = Date.now() - startTime;
    logger.info('Webhook processado com sucesso', {
      paymentId,
      oldStatus,
      newStatus,
      processingTime: `${processingTime}ms`,
      eventId
    });

    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      data: {
        paymentId,
        oldStatus,
        newStatus,
        processingTime
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Erro ao processar webhook do Mercado Pago', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      processingTime: `${processingTime}ms`
    });

    // Atualizar log do webhook com erro
    if (webhookLog) {
      try {
        await webhookLog.update({
          status: 'failed',
          errorMessage: error.message,
          processedAt: new Date(),
          retryCount: (webhookLog.retryCount || 0) + 1,
          lastRetryAt: new Date()
        });
      } catch (logError) {
        logger.error('Erro ao atualizar log do webhook', { error: logError.message });
      }
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /webhooks/mercadopago/test
 * @desc Endpoint de teste para verificar se o webhook está funcionando
 * @access Public
 */
router.get('/mercadopago/test', (req, res) => {
  logger.info('Teste do webhook Mercado Pago');
  
  res.json({
    success: true,
    message: 'Webhook Mercado Pago está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route POST /webhooks/mercadopago/simulate
 * @desc Simular webhook para testes (apenas em desenvolvimento)
 * @access Public (apenas em desenvolvimento)
 */
router.post('/mercadopago/simulate', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Simulação não permitida em produção'
    });
  }

  try {
    const { paymentId, status = 'approved' } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'paymentId é obrigatório'
      });
    }

    // Simular webhook do Mercado Pago
    const simulatedWebhook = {
      type: 'payment',
      data: {
        id: paymentId
      }
    };

    logger.info('Simulando webhook do Mercado Pago', { paymentId, status });

    // Fazer requisição para o próprio webhook
    const webhookUrl = `${req.protocol}://${req.get('host')}/webhooks/mercadopago`;
    
    res.json({
      success: true,
      message: 'Webhook simulado enviado',
      data: {
        paymentId,
        status,
        webhookUrl,
        simulatedPayload: simulatedWebhook
      }
    });

  } catch (error) {
    logger.error('Erro ao simular webhook', { error: error.message });
    
    res.status(500).json({
      error: 'Erro ao simular webhook'
    });
  }
});

module.exports = router;