const express = require('express');
const router = express.Router();
const MercadoPagoService = require('../services/MercadoPagoService');
const { User, Payment } = require('../models');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Instanciar o serviço do Mercado Pago
const mercadoPagoService = new MercadoPagoService();

/**
 * Rota para criar pagamento PIX
 * POST /api/payment/create-pix
 */
router.post('/create-pix', authenticate, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.id;

    // Validar dados de entrada
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor do pagamento é obrigatório e deve ser maior que zero'
      });
    }

    // Buscar dados do usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    logger.info('Criando pagamento PIX', {
      userId,
      amount,
      userEmail: user.email
    });

    // Criar pagamento PIX via Mercado Pago
    const paymentResult = await mercadoPagoService.createPixPayment({
      amount: parseFloat(amount),
      description: description || 'Upgrade para Premium - Buy and Hold SaaS',
      email: user.email,
      name: user.name || user.email.split('@')[0] || 'Cliente',
      cpf: user.cpf || undefined,
      userId: userId
    });

    if (!paymentResult.success) {
      logger.error('Erro ao criar pagamento PIX', {
        userId,
        error: paymentResult.error
      });
      
      return res.status(500).json({
        success: false,
        error: paymentResult.error || 'Erro interno do servidor'
      });
    }

    // Salvar pagamento no banco de dados
    const payment = await Payment.create({
      userId: userId,
      paymentId: paymentResult.paymentId,
      amount: parseFloat(amount),
      status: 'pending',
      paymentMethod: 'pix',
      provider: 'mercadopago',
      description: description || 'Upgrade para Premium - Buy and Hold SaaS',
      externalReference: paymentResult.externalReference,
      qrCode: paymentResult.qrCode,
      qrCodeBase64: paymentResult.qrCodeBase64,
      pixCopyPaste: paymentResult.pixCopyPaste,
      expiresAt: paymentResult.expirationDate,
      providerData: {
        mercadoPagoId: paymentResult.paymentId,
        qrCode: paymentResult.qrCode,
        qrCodeBase64: paymentResult.qrCodeBase64,
        pixCopyPaste: paymentResult.pixCopyPaste
      }
    });

    logger.info('Pagamento PIX criado com sucesso', {
      userId,
      paymentId: paymentResult.paymentId,
      amount
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        mercadoPagoId: paymentResult.paymentId,
        amount: parseFloat(amount),
        status: 'pending',
        qrCode: paymentResult.qrCode,
        qrCodeBase64: paymentResult.qrCodeBase64,
        pixCopyPaste: paymentResult.pixCopyPaste,
        expirationDate: paymentResult.expirationDate
      }
    });

  } catch (error) {
    logger.error('Erro interno ao criar pagamento PIX', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para verificar status do pagamento
 * GET /api/payment/status/:paymentId
 */
router.get('/status/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Buscar pagamento no banco de dados
    const payment = await Payment.findOne({
      where: {
        paymentId: paymentId,
        userId: userId
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pagamento não encontrado'
      });
    }

    // Verificar status no Mercado Pago
    const statusResult = await mercadoPagoService.getPaymentStatus(paymentId);

    if (statusResult.success) {
      // Atualizar status no banco se necessário
      if (payment.status !== statusResult.status) {
        payment.status = statusResult.status;
        payment.statusDetail = statusResult.statusDetail;
        
        if (statusResult.status === 'approved') {
          payment.approvedAt = new Date();
        }
        
        await payment.save();

        // Se pagamento foi aprovado, atualizar usuário para premium
        if (statusResult.status === 'approved' && !req.user.isPremium) {
          await User.update(
            {
              isPremium: true,
              premiumActivatedAt: new Date()
            },
            {
              where: { id: userId }
            }
          );

          logger.info('Usuário atualizado para premium', {
            userId,
            paymentId
          });
        }
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          mercadoPagoId: paymentId,
          status: statusResult.status,
          statusDetail: statusResult.statusDetail,
          amount: payment.amount,
          createdAt: payment.createdAt,
          approvedAt: payment.approvedAt
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: statusResult.error
      });
    }

  } catch (error) {
    logger.error('Erro ao verificar status do pagamento', {
      error: error.message,
      paymentId: req.params.paymentId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Webhook do Mercado Pago
 * POST /api/payment/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    logger.info('Webhook recebido do Mercado Pago', {
      body: req.body,
      headers: req.headers
    });

    const notification = req.body;

    // Processar notificação
    const result = await mercadoPagoService.processWebhookNotification(notification);

    if (result.success && result.paymentData) {
      const { paymentData } = result;

      // Buscar pagamento no banco de dados
      const payment = await Payment.findOne({
        where: {
          paymentId: paymentData.id.toString()
        }
      });

      if (payment) {
        const oldStatus = payment.status;
        
        // Atualizar status do pagamento
        payment.status = paymentData.status;
        payment.statusDetail = paymentData.status_detail;
        
        if (paymentData.status === 'approved' && !payment.approvedAt) {
          payment.approvedAt = new Date();
        }
        
        await payment.save();

        logger.info('Status do pagamento atualizado via webhook', {
          paymentId: paymentData.id,
          oldStatus,
          newStatus: paymentData.status,
          userId: payment.userId
        });

        // Se pagamento foi aprovado, atualizar usuário para premium
        if (paymentData.status === 'approved' && oldStatus !== 'approved') {
          const user = await User.findByPk(payment.userId);
          
          if (user && !user.isPremium) {
            user.isPremium = true;
            user.premiumActivatedAt = new Date();
            await user.save();

            logger.info('Usuário atualizado para premium via webhook', {
              userId: payment.userId,
              paymentId: paymentData.id
            });
          }
        }
      } else {
        logger.warn('Pagamento não encontrado no banco de dados', {
          paymentId: paymentData.id
        });
      }
    }

    // Sempre responder com 200 para o Mercado Pago
    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Erro ao processar webhook do Mercado Pago', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Mesmo com erro, responder 200 para evitar reenvios
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Rota para listar pagamentos do usuário
 * GET /api/payment/history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: { exclude: ['qrCodeBase64', 'pixCopyPaste'] } // Não retornar dados sensíveis
    });

    const total = await Payment.count({ where: { userId } });

    res.json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar histórico de pagamentos', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;