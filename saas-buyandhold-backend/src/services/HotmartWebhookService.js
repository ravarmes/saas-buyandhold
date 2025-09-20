const crypto = require('crypto');
const { User, Subscription, PaymentTransaction, WebhookEventLog } = require('../models');
const logger = require('../utils/logger');
const { payments } = require('../../config/environment');

class HotmartWebhookService {
  constructor() {
    this.webhookToken = process.env.HOTMART_WEBHOOK_TOKEN;
  }

  /**
   * Valida a assinatura HMAC do webhook da Hotmart
   * @param {Object} payload - Payload do webhook
   * @param {string} signature - Assinatura recebida no header
   * @returns {boolean} - True se válida
   */
  validateWebhookSignature(payload, signature) {
    if (!this.webhookToken) {
      logger.warn('Token do webhook Hotmart não configurado');
      return false;
    }

    try {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookToken)
        .update(payloadString)
        .digest('hex');

      // Hotmart pode enviar com prefixo 'sha256='
      const cleanSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(cleanSignature, 'hex')
      );
    } catch (error) {
      logger.error('Erro ao validar assinatura do webhook', { error: error.message });
      return false;
    }
  }

  /**
   * Verifica se o evento já foi processado (idempotência)
   * @param {string} eventId - ID único do evento
   * @param {string} eventType - Tipo do evento
   * @returns {Object} - Log do evento se existir
   */
  async checkEventIdempotency(eventId, eventType) {
    try {
      const existingEvent = await WebhookEventLog.findOne({
        where: {
          eventId: eventId,
          eventType: eventType,
          source: 'hotmart'
        }
      });

      return existingEvent;
    } catch (error) {
      logger.error('Erro ao verificar idempotência do evento', {
        eventId,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Registra o evento no log para auditoria e idempotência
   * @param {Object} eventData - Dados do evento
   * @returns {Object} - Log criado
   */
  async logWebhookEvent(eventData) {
    try {
      const eventLog = await WebhookEventLog.create({
        eventId: eventData.eventId,
        source: 'hotmart',
        eventType: eventData.eventType,
        status: 'received',
        headers: eventData.headers,
        rawPayload: eventData.payload,
        signature: eventData.signature,
        processedAt: null
      });

      return eventLog;
    } catch (error) {
      logger.error('Erro ao registrar evento do webhook', {
        eventId: eventData.eventId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Processa webhook da Hotmart com idempotência
   * @param {Object} payload - Payload do webhook
   * @param {Object} headers - Headers da requisição
   * @param {string} signature - Assinatura do webhook
   * @returns {Object} - Resultado do processamento
   */
  async processWebhook(payload, headers, signature) {
    let eventLog = null;
    
    try {
      // Extrair informações básicas do evento
      const eventType = payload.event || payload.type;
      const eventId = payload.id || payload.transaction?.id || `${eventType}_${Date.now()}`;
      
      logger.info('Processando webhook Hotmart', {
        eventId,
        eventType,
        timestamp: new Date().toISOString()
      });

      // Verificar idempotência
      const existingEvent = await this.checkEventIdempotency(eventId, eventType);
      if (existingEvent) {
        logger.info('Evento já processado (idempotência)', {
          eventId,
          eventType,
          previousStatus: existingEvent.status
        });
        
        return {
          success: true,
          message: 'Evento já processado anteriormente',
          duplicate: true
        };
      }

      // Registrar evento para auditoria
      eventLog = await this.logWebhookEvent({
        eventId,
        eventType,
        payload,
        headers,
        signature
      });

      // Marcar como processando
      await eventLog.markAsProcessing();

      // Processar evento baseado no tipo
      let result;
      switch (eventType) {
        case 'PURCHASE_APPROVED':
        case 'purchase_approved':
        case 'COMPRA_APROVADA':
          result = await this.handlePurchaseApproved(payload);
          break;
          
        case 'PURCHASE_CANCELED':
        case 'purchase_canceled':
        case 'COMPRA_CANCELADA':
          result = await this.handlePurchaseCanceled(payload);
          break;
          
        case 'PURCHASE_REFUNDED':
        case 'purchase_refunded':
        case 'COMPRA_REEMBOLSADA':
          result = await this.handlePurchaseRefunded(payload);
          break;
          
        case 'PURCHASE_CHARGEBACK':
        case 'purchase_chargeback':
        case 'COMPRA_CHARGEBACK':
          result = await this.handlePurchaseChargeback(payload);
          break;
          
        case 'SUBSCRIPTION_CANCELED':
        case 'subscription_canceled':
        case 'ASSINATURA_CANCELADA':
          result = await this.handleSubscriptionCanceled(payload);
          break;
          
        case 'SUBSCRIPTION_PAYMENT_SUCCESS':
        case 'subscription_payment_success':
        case 'subscription.payment_success':
        case 'ASSINATURA_PAGAMENTO_APROVADO':
          result = await this.handleSubscriptionPaymentSuccess(payload);
          break;
          
        default:
          logger.warn('Tipo de evento não reconhecido', { eventType, payload });
          result = {
            success: true,
            message: `Evento ${eventType} recebido mas não processado`
          };
      }

      // Marcar evento como processado
      await eventLog.markAsProcessed(result.success ? 'success' : 'failed', result.message);

      logger.info('Webhook processado com sucesso', {
        eventId,
        eventType,
        result: result.message
      });

      return result;

    } catch (error) {
      logger.error('Erro ao processar webhook Hotmart', {
        error: error.message,
        stack: error.stack,
        payload
      });

      // Marcar evento como falhou se foi criado
      if (eventLog) {
        await eventLog.markAsProcessed('failed', error.message);
      }

      throw error;
    }
  }

  /**
   * Processa evento de compra aprovada
   * @param {Object} payload - Dados do evento
   * @returns {Object} - Resultado do processamento
   */
  async handlePurchaseApproved(payload) {
    try {
      const { buyer, product, transaction, subscription } = payload.data || payload;
      
      if (!buyer?.email) {
        throw new Error('Email do comprador não encontrado no payload');
      }

      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: buyer.email }
      });

      if (!user) {
        logger.warn('Usuário não encontrado para compra aprovada', {
          email: buyer.email,
          transactionId: transaction?.id
        });
        
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Criar registro da transação
      const paymentTransaction = await PaymentTransaction.create({
        userId: user.id,
        hotmartTransactionId: transaction?.id || transaction?.transaction,
        eventType: 'PURCHASE_APPROVED',
        status: 'approved',
        paymentMethod: this.extractPaymentMethod(transaction),
        amount: transaction?.value || transaction?.amount || 15.00,
        currency: 'BRL',
        productId: product?.id,
        buyerEmail: buyer.email,
        transactionDate: new Date(transaction?.approval_date || transaction?.date || Date.now()),
        rawPayload: payload
      });

      // Buscar ou criar assinatura
      let userSubscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: ['active', 'pending']
        },
        order: [['createdAt', 'DESC']]
      });

      if (!userSubscription) {
        // Criar nova assinatura
        userSubscription = await Subscription.create({
          userId: user.id,
          planType: 'premium',
          status: 'active',
          paymentMethod: 'hotmart',
          amount: paymentTransaction.amount,
          currency: 'BRL',
          startDate: new Date(),
          paymentId: paymentTransaction.hotmartTransactionId,
          isRecurring: !!subscription?.id
        });
      }

      // Associar transação à assinatura
      await paymentTransaction.update({ subscriptionId: userSubscription.id });

      // Ativar assinatura para o mês atual
      await userSubscription.updateFromHotmartPayment({
        approvalDate: paymentTransaction.transactionDate,
        hotmartSubscriptionId: subscription?.id,
        subscriptionStartDate: subscription?.start_date,
        subscriptionEndDate: subscription?.end_date
      });

      // Atualizar usuário para premium
      await user.update({
        planType: 'premium',
        subscriptionStatus: 'active'
      });

      logger.info('Compra aprovada processada com sucesso', {
        userId: user.id,
        email: user.email,
        transactionId: paymentTransaction.hotmartTransactionId,
        subscriptionId: userSubscription.id
      });

      return {
        success: true,
        message: 'Compra aprovada processada com sucesso',
        userId: user.id,
        transactionId: paymentTransaction.id
      };

    } catch (error) {
      logger.error('Erro ao processar compra aprovada', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Processa evento de compra cancelada
   * @param {Object} payload - Dados do evento
   * @returns {Object} - Resultado do processamento
   */
  async handlePurchaseCanceled(payload) {
    try {
      const { buyer, transaction } = payload.data || payload;
      
      if (!buyer?.email) {
        throw new Error('Email do comprador não encontrado no payload');
      }

      // Buscar usuário
      const user = await User.findOne({
        where: { email: buyer.email }
      });

      if (!user) {
        return {
          success: true,
          message: 'Usuário não encontrado para cancelamento'
        };
      }

      // Registrar transação de cancelamento
      await PaymentTransaction.create({
        userId: user.id,
        hotmartTransactionId: transaction?.id || transaction?.transaction,
        eventType: 'PURCHASE_CANCELED',
        status: 'canceled',
        paymentMethod: this.extractPaymentMethod(transaction),
        amount: transaction?.value || transaction?.amount || 0,
        currency: 'BRL',
        buyerEmail: buyer.email,
        transactionDate: new Date(),
        rawPayload: payload
      });

      // Cancelar assinatura relacionada
      const subscription = await Subscription.findOne({
        where: {
          userId: user.id,
          paymentId: transaction?.id || transaction?.transaction,
          status: 'active'
        }
      });

      if (subscription) {
        await subscription.cancel();
        
        // Verificar se usuário tem outras assinaturas ativas
        const activeSubscriptions = await Subscription.count({
          where: {
            userId: user.id,
            status: 'active'
          }
        });

        // Downgrade para free se não tem outras assinaturas
        if (activeSubscriptions === 0) {
          await user.update({
            planType: 'free',
            subscriptionStatus: 'canceled'
          });
        }
      }

      return {
        success: true,
        message: 'Cancelamento processado com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao processar cancelamento', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Processa evento de reembolso
   * @param {Object} payload - Dados do evento
   * @returns {Object} - Resultado do processamento
   */
  async handlePurchaseRefunded(payload) {
    try {
      const { buyer, transaction } = payload.data || payload;
      
      if (!buyer?.email) {
        throw new Error('Email do comprador não encontrado no payload');
      }

      // Buscar usuário
      const user = await User.findOne({
        where: { email: buyer.email }
      });

      if (!user) {
        return {
          success: true,
          message: 'Usuário não encontrado para reembolso'
        };
      }

      // Registrar transação de reembolso
      await PaymentTransaction.create({
        userId: user.id,
        hotmartTransactionId: transaction?.id || transaction?.transaction,
        eventType: 'PURCHASE_REFUNDED',
        status: 'refunded',
        paymentMethod: this.extractPaymentMethod(transaction),
        amount: -(transaction?.value || transaction?.amount || 0), // Valor negativo para reembolso
        currency: 'BRL',
        buyerEmail: buyer.email,
        transactionDate: new Date(),
        rawPayload: payload
      });

      // Buscar e cancelar transação original
      const originalTransaction = await PaymentTransaction.findOne({
        where: {
          userId: user.id,
          hotmartTransactionId: transaction?.id || transaction?.transaction,
          status: 'approved'
        }
      });

      if (originalTransaction) {
        await originalTransaction.refund();
        
        // Cancelar assinatura relacionada
        if (originalTransaction.subscriptionId) {
          const subscription = await Subscription.findByPk(originalTransaction.subscriptionId);
          if (subscription && subscription.status === 'active') {
            await subscription.cancel();
          }
        }
      }

      // Verificar se usuário ainda tem assinaturas ativas
      const activeSubscriptions = await Subscription.count({
        where: {
          userId: user.id,
          status: 'active'
        }
      });

      // Downgrade para free se não tem assinaturas ativas
      if (activeSubscriptions === 0) {
        await user.update({
          planType: 'free',
          subscriptionStatus: 'canceled'
        });
      }

      return {
        success: true,
        message: 'Reembolso processado com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao processar reembolso', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Processa evento de chargeback
   * @param {Object} payload - Dados do evento
   * @returns {Object} - Resultado do processamento
   */
  async handlePurchaseChargeback(payload) {
    try {
      const { buyer, transaction } = payload.data || payload;
      
      if (!buyer?.email) {
        throw new Error('Email do comprador não encontrado no payload');
      }

      // Buscar usuário
      const user = await User.findOne({
        where: { email: buyer.email }
      });

      if (!user) {
        return {
          success: true,
          message: 'Usuário não encontrado para chargeback'
        };
      }

      // Registrar transação de chargeback
      await PaymentTransaction.create({
        userId: user.id,
        hotmartTransactionId: transaction?.id || transaction?.transaction,
        eventType: 'PURCHASE_CHARGEBACK',
        status: 'chargeback',
        paymentMethod: this.extractPaymentMethod(transaction),
        amount: -(transaction?.value || transaction?.amount || 0), // Valor negativo
        currency: 'BRL',
        buyerEmail: buyer.email,
        transactionDate: new Date(),
        rawPayload: payload
      });

      // Buscar e marcar transação original como chargeback
      const originalTransaction = await PaymentTransaction.findOne({
        where: {
          userId: user.id,
          hotmartTransactionId: transaction?.id || transaction?.transaction,
          status: 'approved'
        }
      });

      if (originalTransaction) {
        await originalTransaction.chargeback();
        
        // Cancelar assinatura relacionada
        if (originalTransaction.subscriptionId) {
          const subscription = await Subscription.findByPk(originalTransaction.subscriptionId);
          if (subscription && subscription.status === 'active') {
            await subscription.cancel();
          }
        }
      }

      // Revogar acesso premium imediatamente
      await user.update({
        planType: 'free',
        subscriptionStatus: 'canceled'
      });

      return {
        success: true,
        message: 'Chargeback processado com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao processar chargeback', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Processa evento de cancelamento de assinatura
   * @param {Object} payload - Dados do evento
   * @returns {Object} - Resultado do processamento
   */
  async handleSubscriptionCanceled(payload) {
    try {
      const { buyer, subscription } = payload.data || payload;
      
      if (!buyer?.email) {
        throw new Error('Email do comprador não encontrado no payload');
      }

      // Buscar usuário
      const user = await User.findOne({
        where: { email: buyer.email }
      });

      if (!user) {
        return {
          success: true,
          message: 'Usuário não encontrado para cancelamento de assinatura'
        };
      }

      // Buscar assinatura pelo ID da Hotmart
      const userSubscription = await Subscription.findOne({
        where: {
          userId: user.id,
          hotmartSubscriptionId: subscription?.id,
          status: 'active'
        }
      });

      if (userSubscription) {
        await userSubscription.cancel();
        
        // Verificar se usuário tem outras assinaturas ativas
        const activeSubscriptions = await Subscription.count({
          where: {
            userId: user.id,
            status: 'active'
          }
        });

        // Downgrade para free se não tem outras assinaturas
        if (activeSubscriptions === 0) {
          await user.update({
            planType: 'free',
            subscriptionStatus: 'canceled'
          });
        }
      }

      return {
        success: true,
        message: 'Cancelamento de assinatura processado com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao processar cancelamento de assinatura', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Processa evento de pagamento recorrente de assinatura
   * @param {Object} payload - Dados do evento
   * @returns {Object} - Resultado do processamento
   */
  async handleSubscriptionPaymentSuccess(payload) {
    try {
      const { buyer, product, transaction, subscription } = payload.data || payload;
      
      if (!buyer?.email) {
        throw new Error('Email do comprador não encontrado no payload');
      }

      if (!subscription?.id) {
        throw new Error('ID da assinatura não encontrado no payload');
      }

      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: buyer.email }
      });

      if (!user) {
        logger.warn('Usuário não encontrado para pagamento recorrente', {
          email: buyer.email,
          subscriptionId: subscription.id,
          transactionId: transaction?.id
        });
        
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Criar registro da transação recorrente
      const paymentTransaction = await PaymentTransaction.create({
        userId: user.id,
        hotmartTransactionId: transaction?.id || transaction?.transaction || `SUB_${subscription.id}_${Date.now()}`,
        eventType: 'SUBSCRIPTION_PAYMENT_SUCCESS',
        status: 'approved',
        paymentMethod: this.extractPaymentMethod(transaction),
        amount: transaction?.value || transaction?.amount || subscription?.price || 15.00,
        currency: 'BRL',
        productId: product?.id,
        buyerEmail: buyer.email,
        transactionDate: new Date(transaction?.approval_date || transaction?.date || Date.now()),
        rawPayload: payload
      });

      // Buscar assinatura existente do usuário
      let userSubscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: ['active', 'pending']
        },
        order: [['createdAt', 'DESC']]
      });

      if (!userSubscription) {
        // Criar nova assinatura se não existir
        userSubscription = await Subscription.create({
          userId: user.id,
          planType: 'premium',
          status: 'active',
          paymentMethod: 'hotmart',
          amount: paymentTransaction.amount,
          currency: 'BRL',
          startDate: new Date(),
          paymentId: paymentTransaction.hotmartTransactionId,
          isRecurring: true
        });
      } else {
        // Renovar assinatura existente
        const currentEndDate = userSubscription.endDate || new Date();
        const newEndDate = new Date(currentEndDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 dias
        
        await userSubscription.update({
          status: 'active',
          endDate: newEndDate,
          lastPaymentDate: new Date(),
          paymentId: paymentTransaction.hotmartTransactionId,
          isRecurring: true
        });
      }

      // Associar transação à assinatura
      await paymentTransaction.update({ subscriptionId: userSubscription.id });

      // Garantir que o usuário está com status premium ativo
      await user.update({
        planType: 'premium',
        subscriptionStatus: 'active'
      });

      logger.info('Pagamento recorrente de assinatura processado com sucesso', {
        userId: user.id,
        email: user.email,
        subscriptionId: userSubscription.id,
        hotmartSubscriptionId: subscription.id,
        transactionId: paymentTransaction.hotmartTransactionId,
        amount: paymentTransaction.amount,
        newEndDate: userSubscription.endDate
      });

      return {
        success: true,
        message: 'Pagamento recorrente processado com sucesso',
        userId: user.id,
        subscriptionId: userSubscription.id,
        transactionId: paymentTransaction.id
      };

    } catch (error) {
      logger.error('Erro ao processar pagamento recorrente de assinatura', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Extrai método de pagamento do payload da transação
   * @param {Object} transaction - Dados da transação
   * @returns {string} - Método de pagamento
   */
  extractPaymentMethod(transaction) {
    if (!transaction) return 'hotmart';
    
    const method = transaction.payment_method || transaction.paymentMethod || transaction.method;
    
    if (method) {
      const methodLower = method.toLowerCase();
      if (methodLower.includes('pix')) return 'pix';
      if (methodLower.includes('credit') || methodLower.includes('cartao')) return 'credit_card';
      if (methodLower.includes('boleto')) return 'boleto';
      if (methodLower.includes('paypal')) return 'paypal';
    }
    
    return 'hotmart';
  }
}

module.exports = new HotmartWebhookService();