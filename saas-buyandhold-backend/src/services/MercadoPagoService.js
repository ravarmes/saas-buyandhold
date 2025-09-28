const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const logger = require('../utils/logger');
const { PixTransaction, User, Subscription } = require('../models');

class MercadoPagoService {
  constructor() {
    // Determinar qual token usar baseado no ambiente
    const appEnv = process.env.APP_ENV || 'development';
    const environment = appEnv === 'production' ? 'PROD' : 'TEST';
    
    const accessToken = environment === 'PROD' 
      ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PROD 
      : process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST;
    
    if (!accessToken) {
      throw new Error(`Token do Mercado Pago não configurado para ambiente: ${environment} (APP_ENV: ${appEnv})`);
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 10000,
        idempotencyKey: 'abc'
      }
    });
    
    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
    this.environment = environment;
    this.appEnv = appEnv;
    
    // Log de inicialização
    const mode = accessToken.startsWith('TEST-') ? 'TESTE (sandbox)' : 'PRODUÇÃO';
    logger.info(`MercadoPago inicializado em modo: ${mode} - Environment: ${environment} - APP_ENV: ${appEnv}`);
  }

  /**
   * Criar pagamento PIX completo com armazenamento no banco
   * @param {Object} paymentData - Dados do pagamento
   * @param {number} paymentData.amount - Valor do pagamento
   * @param {string} paymentData.description - Descrição do pagamento
   * @param {string} paymentData.email - Email do pagador
   * @param {string} paymentData.name - Nome do pagador
   * @param {string} paymentData.cpf - CPF do pagador (opcional)
   * @param {string} paymentData.userId - ID do usuário
   * @returns {Promise<Object>} Resultado do pagamento
   */
  async createPixPayment(paymentData) {
    try {
      const { amount, description, email, name, cpf, userId } = paymentData;
      
      // Validar dados obrigatórios
      if (!amount || !description || !email || !name || !userId) {
        throw new Error('Dados obrigatórios não fornecidos');
      }

      // Separar nome em primeiro e último nome
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Premium';
      
      // Criar external_reference único
      const externalReference = `pix_${userId}_${Date.now()}`;
      
      // Data de expiração (configurável via env, padrão 30 minutos)
      const expirationMinutes = parseInt(process.env.PIX_EXPIRATION_MINUTES) || 30;
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);
      
      // URL do webhook baseada no ambiente
      const webhookUrl = this.appEnv === 'production' 
        ? process.env.MERCADO_PAGO_WEBHOOK_URL_PROD 
        : process.env.MERCADO_PAGO_WEBHOOK_URL_DEV || process.env.MERCADO_PAGO_WEBHOOK_URL ||
          `${process.env.BACKEND_URL || 'http://localhost:5001'}/webhooks/mercadopago`;
      
      const paymentRequest = {
        transaction_amount: parseFloat(amount),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: firstName,
          last_name: lastName,
          ...(cpf && { identification: { type: 'CPF', number: cpf.replace(/\D/g, '') } })
        },
        external_reference: externalReference,
        notification_url: webhookUrl,
        date_of_expiration: expirationDate.toISOString()
      };
      
      logger.info('Criando pagamento PIX no Mercado Pago', { 
        paymentRequest: { ...paymentRequest, payer: { email: paymentRequest.payer.email } },
        userId,
        externalReference
      });
      
      const response = await this.payment.create({ body: paymentRequest });
      
      if (response && response.id) {
        logger.info('Pagamento PIX criado com sucesso no Mercado Pago', {
          paymentId: response.id,
          status: response.status,
          externalReference: externalReference,
          userId
        });

        // Salvar transação no banco de dados
        const pixTransaction = await PixTransaction.create({
          userId: userId,
          mercadoPagoPaymentId: response.id.toString(),
          externalReference: externalReference,
          status: 'pending',
          pixCode: response.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
          pixKey: process.env.PIX_KEY,
          amount: parseFloat(amount),
          currency: 'BRL',
          description: description,
          expirationDate: expirationDate,
          payerEmail: email,
          payerName: name,
          payerDocument: cpf?.replace(/\D/g, ''),
          gatewayResponse: response,
          metadata: {
            environment: this.environment,
            webhookUrl: webhookUrl,
            createdVia: 'api'
          }
        });

        logger.info('Transação PIX salva no banco de dados', {
          transactionId: pixTransaction.id,
          paymentId: response.id,
          userId
        });
        
        return {
          success: true,
          paymentId: response.id.toString(),
          transactionId: pixTransaction.id,
          qrCode: response.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
          externalReference: externalReference,
          status: response.status,
          expirationDate: expirationDate.toISOString(),
          amount: parseFloat(amount)
        };
      } else {
        throw new Error('Resposta inválida do Mercado Pago');
      }
      
    } catch (error) {
      logger.error('Erro ao criar pagamento PIX no Mercado Pago', {
        error: error.message,
        stack: error.stack,
        paymentData: { amount, description, email, name, userId }
      });
      
      return {
        success: false,
        error: `Erro ao criar pagamento PIX: ${error.message}`
      };
    }
  }

  /**
   * Criar pagamento por cartão de crédito
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Promise<Object>} Resultado do pagamento
   */
  async createCreditCardPayment(paymentData) {
    try {
      const { amount, description, email, name, cpf, cardData, installments } = paymentData;
      
      // Separar nome em primeiro e último nome
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Premium';
      
      // Criar external_reference único
      const externalReference = `premium_cc_${Date.now()}`;
      
      const paymentRequest = {
        transaction_amount: amount,
        description: description,
        installments: installments || 1,
        payment_method_id: cardData.payment_method_id,
        token: cardData.token,
        payer: {
          email: email,
          first_name: firstName,
          last_name: lastName,
          ...(cpf && { identification: { type: 'CPF', number: cpf } })
        },
        external_reference: externalReference,
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook/mercadopago`
      };
      
      logger.info('Criando pagamento por cartão no Mercado Pago', { paymentRequest });
      
      const response = await this.payment.create({ body: paymentRequest });
      
      if (response && response.id) {
        logger.info('Pagamento por cartão criado com sucesso no Mercado Pago', {
          paymentId: response.id,
          status: response.status,
          externalReference: externalReference
        });
        
        return {
          success: true,
          paymentId: response.id.toString(),
          externalReference: externalReference,
          status: response.status,
          statusDetail: response.status_detail
        };
      } else {
        throw new Error('Resposta inválida do Mercado Pago');
      }
      
    } catch (error) {
      logger.error('Erro ao criar pagamento por cartão no Mercado Pago', {
        error: error.message,
        paymentData: { amount, description, email, name }
      });
      
      return {
        success: false,
        error: `Erro ao criar pagamento por cartão: ${error.message}`
      };
    }
  }

  /**
   * Buscar detalhes do pagamento (usado pelo webhook)
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<Object>} Detalhes do pagamento
   */
  async getPaymentDetails(paymentId) {
    try {
      logger.info('Buscando detalhes do pagamento no Mercado Pago', { paymentId });
      
      const response = await this.payment.get({ id: paymentId });
      
      if (response && response.id) {
        logger.info('Detalhes do pagamento obtidos com sucesso', {
          paymentId: response.id,
          status: response.status,
          statusDetail: response.status_detail,
          externalReference: response.external_reference
        });
        
        return {
          success: true,
          payment: response
        };
      } else {
        throw new Error('Pagamento não encontrado');
      }
      
    } catch (error) {
      logger.error('Erro ao buscar detalhes do pagamento', {
        error: error.message,
        paymentId
      });
      
      // Verificar se é erro de pagamento não encontrado
      if (error.message.includes('not found') || error.status === 404) {
        return {
          success: false,
          errorType: 'not_found',
          error: 'Pagamento não encontrado'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar status do pagamento
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<Object>} Status do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      logger.info('Verificando status do pagamento PIX', { paymentId });
      
      const response = await this.payment.get({ id: paymentId });
      
      if (response && response.id) {
        logger.info('Status do pagamento PIX obtido com sucesso', {
          paymentId: response.id,
          status: response.status,
          statusDetail: response.status_detail
        });
        
        return {
          success: true,
          paymentId: response.id.toString(),
          status: response.status,
          statusDetail: response.status_detail,
          externalReference: response.external_reference,
          transactionAmount: response.transaction_amount,
          dateApproved: response.date_approved,
          dateCreated: response.date_created
        };
      } else {
        throw new Error('Pagamento não encontrado');
      }
      
    } catch (error) {
      logger.error('Erro ao verificar status do pagamento PIX', {
        error: error.message,
        paymentId
      });
      
      // Verificar se é erro de pagamento não encontrado
      if (error.message.includes('not found') || error.status === 404) {
        return {
          success: false,
          errorType: 'not_found',
          error: 'Pagamento não encontrado'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processar notificação do webhook
   * @param {Object} notification - Dados da notificação
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processWebhookNotification(notification) {
    try {
      logger.info('Processando notificação do webhook Mercado Pago', { notification });
      
      const paymentId = notification.id || notification.data?.id;
      
      if (!paymentId) {
        throw new Error('ID do pagamento não encontrado na notificação');
      }
      
      // Buscar detalhes do pagamento
      const paymentStatus = await this.getPaymentStatus(paymentId);
      
      if (!paymentStatus.success) {
        throw new Error('Erro ao obter status do pagamento');
      }
      
      const isApproved = paymentStatus.status === 'approved';
      
      logger.info('Notificação do webhook processada', {
        paymentId: paymentStatus.paymentId,
        status: paymentStatus.status,
        isApproved: isApproved,
        externalReference: paymentStatus.externalReference
      });
      
      return {
        success: true,
        paymentId: paymentStatus.paymentId,
        status: paymentStatus.status,
        isApproved: isApproved,
        externalReference: paymentStatus.externalReference,
        transactionAmount: paymentStatus.transactionAmount,
        dateApproved: paymentStatus.dateApproved
      };
      
    } catch (error) {
      logger.error('Erro ao processar notificação do webhook', {
        error: error.message,
        notification
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instância única
module.exports = MercadoPagoService;