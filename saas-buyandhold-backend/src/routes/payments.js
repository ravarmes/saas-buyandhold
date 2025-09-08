const express = require('express');
const { User, Subscription } = require('../models');
const { authenticate } = require('../middleware/auth');
const mercadoPagoService = require('../services/MercadoPagoService');
const { payments } = require('../../config/environment');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * @route GET /api/payments/mercadopago-config
 * @desc Obter configurações do Mercado Pago baseadas no ambiente
 * @access Public
 */
router.get('/mercadopago-config', (req, res) => {
  try {
    const isTestEnvironment = process.env.NODE_ENV !== 'production';
    
    res.json({
      publicKey: payments.mercadoPago.publicKey,
      isTestEnvironment: isTestEnvironment,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Erro ao obter configurações do Mercado Pago', {
      error: error.message
    });
    
    res.status(500).json({
      error: 'Erro ao obter configurações de pagamento'
    });
  }
});

// Função para calcular CRC16 (necessário para PIX)
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Função para gerar código PIX válido seguindo padrão EMV
function generatePixCode({ pixKey, merchantName, merchantCity, amount, txId, userId }) {
  // Função auxiliar para formatar campo EMV
  const formatEMVField = (id, value) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  // Gerar identificador único para esta transação específica com mais entropia
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 12); // Mais caracteres aleatórios
  const userSuffix = userId ? userId.toString().slice(-4) : '0000'; // Últimos 4 dígitos do userId
  const uniqueTxId = txId || `${userSuffix}_${timestamp}_${randomSuffix}`;
  const truncatedTxId = uniqueTxId.substring(0, 25); // Máximo 25 caracteres

  // Campos obrigatórios do PIX
  let pixString = '';
  
  // 00 - Payload Format Indicator
  pixString += formatEMVField('00', '01');
  
  // 01 - Point of Initiation Method (12 = dinâmico)
  pixString += formatEMVField('01', '12');
  
  // 26 - Merchant Account Information
  let merchantAccount = '';
  merchantAccount += formatEMVField('00', 'BR.GOV.BCB.PIX');
  merchantAccount += formatEMVField('01', pixKey);
  // Sempre incluir o txId único
  merchantAccount += formatEMVField('02', truncatedTxId);
  pixString += formatEMVField('26', merchantAccount);
  
  // 52 - Merchant Category Code
  pixString += formatEMVField('52', '0000');
  
  // 53 - Transaction Currency (986 = BRL)
  pixString += formatEMVField('53', '986');
  
  // 54 - Transaction Amount
  if (amount && parseFloat(amount) > 0) {
    pixString += formatEMVField('54', amount);
  }
  
  // 58 - Country Code
  pixString += formatEMVField('58', 'BR');
  
  // 59 - Merchant Name
  const merchantNameFormatted = merchantName.substring(0, 25).toUpperCase();
  pixString += formatEMVField('59', merchantNameFormatted);
  
  // 60 - Merchant City
  const merchantCityFormatted = merchantCity.substring(0, 15).toUpperCase();
  pixString += formatEMVField('60', merchantCityFormatted);
  
  // 62 - Additional Data Field Template (garantir unicidade máxima)
  let additionalData = formatEMVField('05', truncatedTxId);
  // Adicionar timestamp completo e userId para garantir ainda mais unicidade
  const timestampStr = timestamp.toString();
  const userIdStr = userId ? userId.toString().slice(-6) : '000000'; // Últimos 6 dígitos do userId
  additionalData += formatEMVField('07', timestampStr.slice(-8)); // Últimos 8 dígitos do timestamp
  additionalData += formatEMVField('08', userIdStr); // ID do usuário
  pixString += formatEMVField('62', additionalData);
  
  // 63 - CRC16
  pixString += '6304';
  const crcValue = crc16(pixString);
  pixString += crcValue;
  
  return pixString;
}

/**
 * @route POST /api/payments/create
 * @desc Criar pagamento para upgrade premium
 * @access Private
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { paymentMethod, amount = 15.00 } = req.body;
    const userId = req.user.userId;

    const normalizedAmount = normalizeAmount(amount, 15.00);
    logger.info('[/api/payments/create] Amount recebido e normalizado', { rawAmount: amount, normalizedAmount });

    // Validar método de pagamento
    if (!['pix', 'credit_card'].includes(paymentMethod)) {
      return res.status(400).json({
        error: 'Método de pagamento inválido. Use "pix" ou "credit_card"'
      });
    }

    // Verificar se usuário já tem assinatura ativa
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingSubscription && existingSubscription.isActive()) {
      return res.status(400).json({
        error: 'Usuário já possui uma assinatura premium ativa'
      });
    }

    // Criar nova assinatura
    const subscription = await Subscription.create({
      userId,
      paymentMethod,
      amount: normalizedAmount,
      status: 'pending'
    });

    let paymentData = {};
    let paymentId = null;

    // Processamento de pagamento PIX
    if (paymentMethod === 'pix') {
      // Gerar ID único para o pagamento PIX
      paymentId = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Configurações PIX - podem ser personalizadas via variáveis de ambiente
      const { payments } = require('../../config/environment');
  const pixKey = payments.pix.key;
  const pixName = process.env.PIX_NAME || 'SEU NOME COMPLETO';
  const pixCity = process.env.PIX_CITY || 'SUA CIDADE';
      
      // Gerar código PIX válido seguindo padrão EMV
      const pixCode = generatePixCode({
        pixKey,
        merchantName: pixName,
        merchantCity: pixCity,
        amount: normalizedAmount.toFixed(2),
        txId: paymentId.substring(0, 25), // Máximo 25 caracteres
        userId: userId.toString()
      });
      
      paymentData = {
        qrCode: pixCode,
        pixKey: pixKey,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        instructions: `Escaneie o QR Code ou use a chave PIX (${pixKey}) para efetuar o pagamento de R$ ${normalizedAmount.toFixed(2)}`
      };
    } else if (paymentMethod === 'credit_card') {
      // Simular processamento de cartão de crédito
      paymentId = `CC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      paymentData = {
        redirectUrl: `https://gateway.exemplo.com/payment/${paymentId}`,
        instructions: 'Você será redirecionado para completar o pagamento'
      };
    }

    // Atualizar assinatura com dados do pagamento
    await subscription.update({
      paymentId,
      paymentData
    });

    res.status(201).json({
      message: 'Pagamento criado com sucesso',
      subscription: {
        id: subscription.id,
        paymentMethod: subscription.paymentMethod,
        amount: subscription.amount,
        status: subscription.status,
        paymentId,
        paymentData
      }
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/payments/create-mercadopago
 * @desc Criar pagamento PIX usando Mercado Pago
 * @access Private
 */
router.post('/create-mercadopago', authenticate, async (req, res) => {
  try {
    const { amount = 15.00 } = req.body;
    const userId = req.user.userId;

    const normalizedAmount = normalizeAmount(amount, 15.00);
    logger.info('[/api/payments/create-mercadopago] Amount recebido e normalizado', { rawAmount: amount, normalizedAmount });

    // Buscar dados do usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se usuário já tem assinatura ativa
    const existingActiveSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingActiveSubscription && existingActiveSubscription.isActive()) {
      return res.status(400).json({
        error: 'Usuário já possui uma assinatura premium ativa'
      });
    }

    // Cancelar assinaturas pendentes antigas do mesmo usuário
    await Subscription.update(
      { status: 'cancelled' },
      {
        where: {
          userId,
          status: 'pending',
          createdAt: {
            [require('sequelize').Op.lt]: new Date(Date.now() - 5 * 60 * 1000) // Mais de 5 minutos
          }
        }
      }
    );

    logger.info('Assinaturas pendentes antigas canceladas', { userId });

    // Verificar se deve usar Mercado Pago real ou PIX simulado
    const useRealMercadoPago = process.env.NODE_ENV === 'production' || process.env.USE_REAL_MERCADOPAGO === 'true';
    
    let pixPayment;
    let paymentId;

    if (useRealMercadoPago) {
      // Usar Mercado Pago real (produção)
      const paymentData = {
        amount: normalizedAmount,
        description: 'Upgrade para Premium - SaaS Buy & Hold',
        email: user.email,
        name: user.name || 'Cliente',
        cpf: user.cpf || undefined,
        userId: userId
      };

      pixPayment = await mercadoPagoService.createPixPayment(paymentData);

      if (!pixPayment.success) {
        return res.status(400).json({
          error: 'Erro ao criar pagamento PIX',
          details: pixPayment.error
        });
      }

      paymentId = pixPayment.paymentId;
    } else {
      // Usar PIX simulado (desenvolvimento) com códigos únicos
      paymentId = `PIX_DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pixKey = payments.pix.key;
    const pixName = process.env.PIX_NAME || 'SEU NOME';
    const pixCity = process.env.PIX_CITY || 'SUA CIDADE';
      
      // Gerar código PIX único usando nossa função personalizada
      const pixCode = generatePixCode({
        pixKey,
        merchantName: pixName,
        merchantCity: pixCity,
        amount: normalizedAmount.toFixed(2),
        txId: paymentId.substring(0, 25),
        userId: userId.toString()
      });
      
      pixPayment = {
        success: true,
        paymentId: paymentId,
        status: 'pending',
        qrCode: pixCode,
        qrCodeBase64: Buffer.from(pixCode).toString('base64'),
        pixCopyPaste: pixCode,
        expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        amount: normalizedAmount,
        description: 'Upgrade para Premium - SaaS Buy & Hold (Desenvolvimento)'
      };
    }

    // Criar registro de assinatura pendente
    const subscription = await Subscription.create({
      userId: userId,
      planType: 'premium',
      status: 'pending',
      paymentMethod: useRealMercadoPago ? 'pix_mercadopago' : 'pix_dev',
      paymentId: paymentId,
      amount: normalizedAmount,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    });

    logger.info(`Pagamento PIX ${useRealMercadoPago ? 'Mercado Pago' : 'Desenvolvimento'} criado`, {
      userId,
      subscriptionId: subscription.id,
      paymentId: paymentId,
      amount,
      useRealMercadoPago
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        amount: subscription.amount,
        paymentMethod: subscription.paymentMethod
      },
      payment: {
        id: pixPayment.paymentId,
        qrCode: pixPayment.qrCode,
        qrCodeBase64: pixPayment.qrCodeBase64,
        pixCopyPaste: pixPayment.pixCopyPaste,
        expirationDate: pixPayment.expirationDate,
        amount: pixPayment.amount,
        description: pixPayment.description
      }
    });

  } catch (error) {
    logger.error('Erro ao criar pagamento PIX Mercado Pago', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/payments/create-credit-card
 * @desc Criar pagamento por cartão de crédito usando Mercado Pago
 * @access Private
 */
router.post('/create-credit-card', authenticate, async (req, res) => {
  try {
    const { cardData, installments = 1, amount = 15.00 } = req.body;
    const userId = req.user.userId;

    const normalizedAmount = normalizeAmount(amount, 15.00);
    logger.info('[/api/payments/create-credit-card] Amount recebido e normalizado', { rawAmount: amount, normalizedAmount });

    // Validar dados obrigatórios
    if (!cardData || !cardData.token) {
      return res.status(400).json({
        error: 'Dados do cartão são obrigatórios'
      });
    }

    // Buscar dados do usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se usuário já tem assinatura ativa
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingSubscription && existingSubscription.isActive()) {
      return res.status(400).json({
        error: 'Usuário já possui uma assinatura premium ativa'
      });
    }

    // Verificar se deve usar Mercado Pago real ou simulado
    const useRealMercadoPago = process.env.NODE_ENV === 'production' || process.env.USE_REAL_MERCADOPAGO === 'true';
    
    let creditCardPayment;
    let paymentId;

    if (useRealMercadoPago) {
      // Usar Mercado Pago real (produção)
      const paymentData = {
        amount: parseFloat(amount),
        description: 'Upgrade para Premium - SaaS Buy & Hold',
        email: user.email,
        name: user.name || 'Cliente',
        cpf: user.cpf || undefined,
        userId: userId,
        cardData: cardData,
        installments: parseInt(installments)
      };

      creditCardPayment = await mercadoPagoService.createCreditCardPayment(paymentData);

      if (!creditCardPayment.success) {
        return res.status(400).json({
          error: 'Erro ao criar pagamento por cartão de crédito',
          details: creditCardPayment.error
        });
      }
      
      paymentId = creditCardPayment.paymentId;
    } else {
      // Simular pagamento por cartão (desenvolvimento)
      paymentId = `CC_DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Verificar se é um cartão de teste reprovado
      // O cartão 4000 0000 0000 0002 com nome 'OTHE' é um cartão de teste que deve ser rejeitado
      const cardholderName = cardData.cardholder?.name || '';
      const isRejectedTestCard = (
        // Verificar se é o cartão de teste reprovado específico pelo nome do portador
        cardholderName === 'OTHE' ||
        // Ou se o payment_method_id indica rejeição
        (cardData.payment_method_id && cardData.payment_method_id.includes('rejected'))
      );
      
      // Simular rejeição apenas para cartões de teste específicos
      const shouldReject = isRejectedTestCard;
      
      logger.info('Simulando pagamento por cartão de crédito', {
         userId,
         paymentId,
         cardData: { 
           payment_method_id: cardData.payment_method_id, 
           token: cardData.token ? 'present' : 'missing',
           cardholderName: cardholderName
         },
         shouldReject,
         isRejectedTestCard
       });
      
      if (shouldReject) {
        creditCardPayment = {
          success: true,
          paymentId: paymentId,
          status: 'rejected',
          statusDetail: 'cc_rejected_other_reason',
          amount: parseFloat(amount),
          installments: parseInt(installments),
          description: 'Upgrade para Premium - SaaS Buy & Hold (Desenvolvimento)',
          isApproved: false,
          dateCreated: new Date().toISOString(),
          dateApproved: null
        };
      } else {
        creditCardPayment = {
          success: true,
          paymentId: paymentId,
          status: 'approved',
          statusDetail: 'accredited',
          amount: parseFloat(amount),
          installments: parseInt(installments),
          description: 'Upgrade para Premium - SaaS Buy & Hold (Desenvolvimento)',
          isApproved: true,
          dateCreated: new Date().toISOString(),
          dateApproved: new Date().toISOString()
        };
      }
    }

    // Criar registro de assinatura
    const subscription = await Subscription.create({
      userId: userId,
      planType: 'premium',
      status: creditCardPayment.isApproved ? 'active' : 'pending',
      paymentMethod: useRealMercadoPago ? 'credit_card_mercadopago' : 'credit_card_dev',
      paymentId: paymentId,
      amount: parseFloat(amount),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    });

    // Se o pagamento foi aprovado imediatamente, atualizar usuário para premium
    if (creditCardPayment.isApproved) {
      await user.update({
        planType: 'premium',
        subscriptionId: subscription.id
      });

      logger.info('Pagamento por cartão de crédito aprovado e usuário atualizado para Premium', {
        userId,
        subscriptionId: subscription.id,
        paymentId,
        status: creditCardPayment.status
      });
    }

    logger.info(`Pagamento por cartão ${useRealMercadoPago ? 'Mercado Pago' : 'Desenvolvimento'} criado`, {
      userId,
      subscriptionId: subscription.id,
      paymentId: paymentId,
      amount,
      installments,
      useRealMercadoPago,
      isApproved: creditCardPayment.isApproved
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        amount: subscription.amount,
        paymentMethod: subscription.paymentMethod
      },
      payment: {
        id: creditCardPayment.paymentId,
        status: creditCardPayment.status,
        statusDetail: creditCardPayment.statusDetail,
        amount: creditCardPayment.amount,
        installments: creditCardPayment.installments,
        description: creditCardPayment.description,
        isApproved: creditCardPayment.isApproved,
        dateCreated: creditCardPayment.dateCreated,
        dateApproved: creditCardPayment.dateApproved
      }
    });

  } catch (error) {
    logger.error('Erro ao criar pagamento por cartão de crédito', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/payments/verify-mercadopago
 * @desc Verificar status do pagamento PIX no Mercado Pago
 * @access Private
 */
router.post('/verify-mercadopago', authenticate, async (req, res) => {
  try {
    const { subscriptionId, paymentId } = req.body;
    const userId = req.user.userId;

    logger.info('Iniciando verificação de pagamento PIX Mercado Pago', {
      userId,
      subscriptionId,
      paymentId,
      timestamp: new Date().toISOString()
    });

    // Log detalhado dos parâmetros recebidos
    logger.debug('Parâmetros da verificação', {
      body: req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    });

    // Buscar assinatura - priorizar busca por subscriptionId e userId
    // mas também verificar se o paymentId corresponde
    // Aceitar tanto pix_mercadopago quanto pix_dev (para desenvolvimento)
    let subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        userId: userId,
        paymentMethod: ['pix_mercadopago', 'pix_dev']
      }
    });

    logger.info('Primeira busca por subscriptionId', {
      userId,
      subscriptionId,
      found: !!subscription,
      subscriptionData: subscription ? {
        id: subscription.id,
        paymentId: subscription.paymentId,
        status: subscription.status,
        createdAt: subscription.createdAt
      } : null
    });

    // Se não encontrou por subscriptionId, buscar por paymentId e userId
    // (para casos onde o mesmo paymentId foi reutilizado)
    if (!subscription) {
      subscription = await Subscription.findOne({
        where: {
          paymentId: paymentId.toString(),
          userId: userId,
          paymentMethod: ['pix_mercadopago', 'pix_dev'],
          status: 'pending'
        },
        order: [['createdAt', 'DESC']] // Pegar a mais recente
      });
      
      logger.info('Segunda busca por paymentId', {
        userId,
        paymentId,
        found: !!subscription,
        subscriptionData: subscription ? {
          id: subscription.id,
          paymentId: subscription.paymentId,
          status: subscription.status,
          createdAt: subscription.createdAt
        } : null
      });
    }

    if (!subscription) {
      // Se não encontrou assinatura, verificar primeiro se o pagamento existe no Mercado Pago
      // para dar uma mensagem mais específica
      try {
        const paymentStatus = await mercadoPagoService.getPaymentStatus(paymentId);
        
        if (!paymentStatus.success && paymentStatus.errorType === 'not_found') {
          return res.status(404).json({
            error: 'Pagamento não encontrado',
            message: 'O pagamento PIX não foi encontrado no Mercado Pago. Isso pode acontecer quando você tenta verificar um pagamento que ainda não foi criado.',
            suggestion: 'Clique em "Simular Pagamento Aprovado" para testar o fluxo de pagamento ou crie um novo pagamento PIX.',
            paymentId: paymentId
          });
        }
      } catch (error) {
        logger.warn('Erro ao verificar pagamento no Mercado Pago durante busca de assinatura', {
          error: error.message,
          paymentId
        });
      }
      
      // Se chegou até aqui, o pagamento pode existir no Mercado Pago mas não temos assinatura
      // Buscar todas as assinaturas do usuário para debug
      const allUserSubscriptions = await Subscription.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      logger.error('Assinatura não encontrada - Debug info', {
        userId,
        subscriptionId,
        paymentId,
        allUserSubscriptions: allUserSubscriptions.map(sub => ({
          id: sub.id,
          paymentId: sub.paymentId,
          status: sub.status,
          createdAt: sub.createdAt
        }))
      });
      
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar se o paymentId da assinatura corresponde ao solicitado
    // Converter ambos para string para garantir comparação correta
    const subscriptionPaymentId = subscription.paymentId ? subscription.paymentId.toString() : '';
    const requestedPaymentId = paymentId ? paymentId.toString() : '';
    
    if (subscriptionPaymentId !== requestedPaymentId) {
      logger.warn('PaymentId não corresponde à assinatura', {
        userId,
        subscriptionId: subscription.id,
        subscriptionPaymentId: subscriptionPaymentId,
        requestedPaymentId: requestedPaymentId,
        originalSubscriptionPaymentId: subscription.paymentId,
        originalRequestedPaymentId: paymentId
      });
      return res.status(400).json({ 
        error: 'PaymentId não corresponde à assinatura encontrada' 
      });
    }

    // Verificar status no Mercado Pago
    const paymentStatus = await mercadoPagoService.getPaymentStatus(paymentId);

    if (!paymentStatus.success) {
      // Verificar se é erro de pagamento não encontrado
      if (paymentStatus.errorType === 'not_found') {
        return res.status(404).json({
          error: 'Pagamento não encontrado',
          message: 'O pagamento PIX não foi encontrado no Mercado Pago. Isso pode acontecer quando você tenta verificar um pagamento que ainda não foi criado.',
          suggestion: 'Clique em "Simular Pagamento Aprovado" para testar o fluxo de pagamento ou crie um novo pagamento PIX.',
          paymentId: paymentId
        });
      }
      
      return res.status(400).json({
        error: 'Erro ao verificar pagamento',
        details: paymentStatus.error,
        paymentId: paymentId
      });
    }

    logger.info('Status do pagamento verificado', {
      userId,
      paymentId,
      status: paymentStatus.status,
      statusDetail: paymentStatus.statusDetail
    });

    // Verificar se a assinatura já foi ativada
    if (subscription.status === 'active') {
      logger.info('Assinatura já está ativa', {
        userId,
        subscriptionId: subscription.id,
        paymentId
      });
      
      return res.json({
        success: true,
        payment: {
          id: paymentStatus.paymentId,
          status: paymentStatus.status,
          statusDetail: paymentStatus.statusDetail,
          amount: paymentStatus.amount,
          dateApproved: paymentStatus.dateApproved,
          isApproved: paymentStatus.status === 'approved'
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          planType: subscription.planType
        },
        message: 'Assinatura já está ativa'
      });
    }

    // Atualizar status da assinatura APENAS se aprovado e ainda pendente
    if (paymentStatus.status === 'approved' && subscription.status === 'pending') {
      await subscription.update({
        status: 'active'
      });

      // Atualizar usuário para premium
      await User.update(
        { 
          planType: 'premium',
          subscriptionStatus: 'active'
        },
        { where: { id: userId } }
      );

      logger.info('Pagamento PIX Mercado Pago confirmado e usuário atualizado para Premium', {
        userId,
        subscriptionId: subscription.id,
        paymentId,
        status: paymentStatus.status
      });
    } else if (paymentStatus.status !== 'approved') {
      logger.info('Pagamento ainda não aprovado', {
        userId,
        paymentId,
        status: paymentStatus.status,
        statusDetail: paymentStatus.statusDetail
      });
    }

    res.json({
      success: true,
      payment: {
        id: paymentStatus.paymentId,
        status: paymentStatus.status,
        statusDetail: paymentStatus.statusDetail,
        amount: paymentStatus.amount,
        dateApproved: paymentStatus.dateApproved,
        isApproved: paymentStatus.status === 'approved'
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.planType
      }
    });

  } catch (error) {
    logger.error('Erro ao verificar pagamento PIX Mercado Pago', {
      error: error.message,
      userId: req.user?.userId,
      subscriptionId: req.body?.subscriptionId,
      paymentId: req.body?.paymentId
    });

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/payments/verify-pix
 * @desc Verificar status do pagamento PIX
 * @access Private
 */
router.post('/verify-pix', authenticate, async (req, res) => {
  try {
    const { subscriptionId, paymentId } = req.body;
    const userId = req.user.userId;

    // Buscar assinatura
    const subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        userId,
        paymentId,
        status: 'pending'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Assinatura não encontrada ou já processada'
      });
    }

    // Simular verificação de pagamento PIX
    // Em produção, aqui seria feita uma consulta real ao banco/gateway de pagamento
    const paymentVerified = await verifyPixPayment(paymentId);
    
    if (paymentVerified) {
      // Ativar assinatura
      await subscription.activate();

      // Atualizar usuário para premium
      await User.update(
        {
          planType: 'premium',
          subscriptionStatus: 'active'
        },
        {
          where: { id: userId }
        }
      );

      res.json({
        message: 'Pagamento PIX confirmado! Assinatura ativada com sucesso.',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        },
        paymentVerified: true
      });
    } else {
      res.status(402).json({
        error: 'Pagamento PIX ainda não foi confirmado. Aguarde alguns minutos e tente novamente.',
        paymentVerified: false,
        instructions: 'Certifique-se de que o pagamento foi realizado usando a chave PIX ou código QR fornecido.'
      });
    }
  } catch (error) {
    console.error('PIX verification error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/payments/confirm
 * @desc Confirmar pagamento manualmente (apenas para demonstração)
 * @access Private
 */
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { subscriptionId, paymentId } = req.body;
    const userId = req.user.userId;

    // Buscar assinatura
    const subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        userId,
        paymentId,
        status: 'pending'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Assinatura não encontrada ou já processada'
      });
    }

    // Retornar erro informando que é necessário aguardar confirmação automática
    return res.status(400).json({
      error: 'Para ativar o plano Premium, é necessário que o pagamento PIX seja confirmado automaticamente pelo sistema bancário. Use o botão "Verificar Pagamento" para checar o status.',
      requiresRealPayment: true,
      suggestion: 'Clique em "Verificar Pagamento" após realizar o PIX'
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Função para verificar pagamento PIX
 * Agora faz verificação real usando o Mercado Pago
 */
async function verifyPixPayment(paymentId) {
  try {
    // Se o paymentId contém informações do Mercado Pago, extrair o ID real
    let realPaymentId = paymentId;
    
    // Se for um pagamento do Mercado Pago, verificar status real
    if (paymentId && paymentId.toString().length > 10) {
      const paymentStatus = await mercadoPagoService.getPaymentStatus(paymentId);
      return paymentStatus.success && paymentStatus.status === 'approved';
    }
    
    // Para outros tipos de PIX (simulados), retornar false por padrão
    // Em produção, aqui seria feita uma consulta real ao banco/gateway de pagamento
    return false;
  } catch (error) {
    logger.error('Erro ao verificar pagamento PIX', { error: error.message, paymentId });
    return false;
  }
}

/**
 * @route GET /api/payments/subscription
 * @desc Obter assinatura ativa do usuário
 * @access Private
 */
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Nenhuma assinatura ativa encontrada'
      });
    }

    // Verificar se a assinatura expirou
    if (subscription.isExpired()) {
      await subscription.expire();
      await User.update(
        {
          planType: 'free',
          subscriptionStatus: 'expired'
        },
        {
          where: { id: userId }
        }
      );

      return res.status(410).json({
        error: 'Assinatura expirada'
      });
    }

    res.json({
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        isActive: subscription.isActive()
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/payments/cancel
 * @desc Cancelar assinatura
 * @access Private
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Nenhuma assinatura ativa encontrada'
      });
    }

    // Cancelar assinatura
    await subscription.cancel();

    // Atualizar usuário para free
    await User.update(
      {
        planType: 'free',
        subscriptionStatus: 'cancelled'
      },
      {
        where: { id: userId }
      }
    );

    res.json({
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/payments/webhook/mercadopago
 * @desc Webhook do Mercado Pago para confirmação automática de pagamento PIX
 * @access Public
 */
router.post('/webhook/mercadopago', async (req, res) => {
  try {
    logger.info('Webhook Mercado Pago recebido', { body: req.body, query: req.query });

    // Mercado Pago envia notificações via query params ou body
    const notification = req.body || req.query;
    
    if (!notification.id) {
      return res.status(400).json({ error: 'ID da notificação não fornecido' });
    }

    // Processar notificação do Mercado Pago
    const webhookResult = await mercadoPagoService.processWebhookNotification(notification);

    if (!webhookResult.success) {
      return res.status(400).json({ error: 'Erro ao processar notificação' });
    }

    // Se for uma notificação de pagamento aprovado
    if (webhookResult.isApproved && webhookResult.externalReference) {
      // Buscar assinatura pelo external_reference ou paymentId
      const subscription = await Subscription.findOne({
        where: {
          paymentId: webhookResult.paymentId,
          status: 'pending',
          paymentMethod: 'pix_mercadopago'
        }
      });

      if (subscription) {
        // Ativar assinatura
        await subscription.update({
          status: 'active'
        });

        // Atualizar usuário para premium
        await User.update(
          { isPremium: true },
          { where: { id: subscription.userId } }
        );

        logger.info('Assinatura ativada via webhook Mercado Pago', {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          paymentId: webhookResult.paymentId
        });
      }
    }

    // Responder com status 200 para confirmar recebimento
    res.status(200).json({ 
      message: 'Webhook processado com sucesso',
      received: true 
    });

  } catch (error) {
    logger.error('Erro no webhook Mercado Pago', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      query: req.query
    });

    // Sempre responder com 200 para evitar reenvios desnecessários
    res.status(200).json({ 
      message: 'Webhook recebido com erro',
      error: error.message 
    });
  }
});

/**
 * @route POST /api/payments/webhook
 * @desc Webhook para confirmação automática de pagamento
 * @access Public (mas com validação de assinatura)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { paymentId, status, amount, paymentMethod, signature } = req.body;

    // Validar assinatura do webhook (em produção, usar chave secreta real)
    const expectedSignature = require('crypto')
      .createHmac('sha256', process.env.WEBHOOK_SECRET || 'webhook-secret-key')
      .update(JSON.stringify({ paymentId, status, amount, paymentMethod }))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Buscar assinatura pelo paymentId
    const subscription = await Subscription.findOne({
      where: {
        paymentId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Processar confirmação de pagamento
    if (status === 'approved' || status === 'paid') {
      // Ativar assinatura
      await subscription.activate();

      // Atualizar usuário para premium
      await User.update(
        {
          planType: 'premium',
          subscriptionStatus: 'active'
        },
        {
          where: { id: subscription.userId }
        }
      );

      console.log(`Pagamento confirmado via webhook: ${paymentId}`);
      
      res.json({ 
        message: 'Pagamento confirmado com sucesso',
        subscriptionId: subscription.id 
      });
    } else if (status === 'cancelled' || status === 'failed') {
      // Cancelar assinatura
      await subscription.update({ status: 'cancelled' });
      
      console.log(`Pagamento cancelado via webhook: ${paymentId}`);
      
      res.json({ 
        message: 'Pagamento cancelado',
        subscriptionId: subscription.id 
      });
    } else {
      res.json({ message: 'Status de pagamento não processado' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/payments/simulate-payment
 * @desc Simular aprovação de pagamento PIX para testes (apenas ambiente de desenvolvimento)
 * @access Private
 */
router.post('/simulate-payment', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const userId = req.user.userId;

    if (!paymentId) {
      return res.status(400).json({
        error: 'ID do pagamento é obrigatório'
      });
    }

    // Verificar se está em ambiente de desenvolvimento/sandbox
    const { isProduction } = require('../../config/environment');
  if (isProduction) {
      return res.status(403).json({
        error: 'Simulação de pagamento disponível apenas em ambiente de desenvolvimento'
      });
    }

    // Buscar a assinatura pelo paymentId
    // Converter paymentId para string para garantir compatibilidade
    const subscription = await Subscription.findOne({
      where: {
        paymentId: paymentId.toString(),
        userId: userId,
        status: 'pending'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Pagamento não encontrado ou já processado'
      });
    }

    // Simular aprovação do pagamento
    await subscription.update({
      status: 'active'
    });

    // Atualizar usuário para premium
    await User.update(
      { 
        planType: 'premium',
        subscriptionStatus: 'active'
      },
      { where: { id: userId } }
    );

    logger.info('Pagamento simulado como aprovado', {
      userId,
      subscriptionId: subscription.id,
      paymentId
    });

    res.json({
      success: true,
      message: 'Pagamento simulado como aprovado com sucesso!',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      }
    });

  } catch (error) {
    logger.error('Erro ao simular pagamento', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

// Função utilitária para normalizar valores monetários recebidos do cliente
// Garante ponto decimal, duas casas e evita valores inválidos/negativos
function normalizeAmount(input, defaultValue = 15.00) {
  const raw = String(input).trim();
  // Troca vírgula por ponto para suportar formatos pt-BR
  const normalizedStr = raw.replace(',', '.');
  const parsed = parseFloat(normalizedStr);
  if (!isFinite(parsed) || parsed <= 0) return defaultValue;
  // Arredonda para 2 casas decimais de forma estável
  return Math.round(parsed * 100) / 100;
}