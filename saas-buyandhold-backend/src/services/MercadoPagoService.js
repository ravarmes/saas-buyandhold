const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { payments } = require('../../config/environment');
const logger = require('../utils/logger');

class MercadoPagoService {
  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: payments.mercadoPago.accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc'
      }
    });
    
    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
    
    // Log de inicialização
    const environment = process.env.NODE_ENV || 'development';
    const mode = payments.mercadoPago.accessToken.startsWith('TEST-') ? 'TESTE (sandbox)' : 'PRODUÇÃO';
    logger.info(`MercadoPago inicializado em modo: ${mode} - NODE_ENV: ${environment}`);
  }

  /**
   * Criar pagamento PIX
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
      
      // Separar nome em primeiro e último nome
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Premium';
      
      // Criar external_reference único
      const externalReference = `premium_${Date.now()}`;
      
      // Data de expiração (30 minutos)
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 30);
      
      const paymentRequest = {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: firstName,
          last_name: lastName,
          ...(cpf && { identification: { type: 'CPF', number: cpf } })
        },
        external_reference: externalReference,
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payments/webhook`,
        date_of_expiration: expirationDate.toISOString()
      };
      
      logger.info('Criando pagamento PIX no Mercado Pago', { paymentRequest });
      
      const response = await this.payment.create({ body: paymentRequest });
      
      if (response && response.id) {
        logger.info('Pagamento PIX criado com sucesso no Mercado Pago', {
          paymentId: response.id,
          status: response.status,
          externalReference: externalReference
        });
        
        return {
          success: true,
          paymentId: response.id.toString(),
          qrCode: response.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
          externalReference: externalReference,
          status: response.status,
          expirationDate: expirationDate.toISOString()
        };
      } else {
        throw new Error('Resposta inválida do Mercado Pago');
      }
      
    } catch (error) {
      logger.error('Erro ao criar pagamento PIX no Mercado Pago', {
        error: error.message,
        paymentData: { amount, description, email, name }
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
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payments/webhook`
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
module.exports = new MercadoPagoService();