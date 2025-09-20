const crypto = require('crypto');
const axios = require('axios');
const { payments } = require('../../config/environment');

class HotmartService {
  constructor() {
    this.clientId = payments.hotmart.clientId;
    this.clientSecret = payments.hotmart.clientSecret;
    this.basicToken = payments.hotmart.basicAuth || payments.hotmart.basicToken;
    this.webhookToken = process.env.HOTMART_WEBHOOK_TOKEN || payments.hotmart.webhookSecret;
    this.baseURL = 'https://developers.hotmart.com';
    this.sandboxURL = 'https://sandbox.hotmart.com';
    this.isSandbox = payments.hotmart.sandboxMode;
    // Endpoint correto para OAuth2 (independente de sandbox)
    this.tokenURL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
    
    // URLs de callback
    this.successUrl = payments.hotmart.successUrl;
    this.cancelUrl = payments.hotmart.cancelUrl;
    this.webhookUrl = payments.hotmart.webhookUrl;
  }

  /**
   * Gera token de acesso OAuth2 da Hotmart
   */
  async getAccessToken() {
    try {
      // Endpoint oficial de token com query parameters (formato correto da Hotmart)
      const url = `${this.tokenURL}?grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`;

      const basicHeader = this.basicToken || Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(url, null, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicHeader}`
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Erro ao obter token de acesso Hotmart:', {
        status: error.response?.status,
        data: error.response?.data || error.message
      });
      throw new Error('Falha na autenticação com Hotmart');
    }
  }

  /**
   * Cria um checkout na Hotmart
   */
  async createCheckout(orderData) {
    try {
      const accessToken = await this.getAccessToken();
      // API pública usa sempre developers.hotmart.com (o sandbox é um ambiente, não um host diferente)
      const url = `${this.baseURL}/payments/api/v1/checkouts`;
      
      const checkoutData = {
        product: {
          id: payments.hotmart.productId,
          name: 'SaaS Buy&Hold - Plano Premium',
          price: orderData.amount || 9900, // Preço em centavos (R$ 99,00)
        },
        buyer: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone || '',
          document: orderData.customerDocument || ''
        },
        payment: {
          type: 'CREDIT_CARD', // ou 'PIX', 'BOLETO'
          installments: orderData.installments || 1
        },
        urls: {
          success: this.successUrl,
          cancel: this.cancelUrl
        },
        metadata: {
          userId: orderData.userId,
          planType: 'premium',
          source: 'saas-buyandhold',
          userEmail: orderData.customerEmail,
          timestamp: new Date().toISOString()
        }
      };
      
      const response = await axios.post(url, checkoutData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        checkoutUrl: response.data.checkout_url,
        transactionId: response.data.transaction_id,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao criar checkout Hotmart:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao processar pagamento'
      };
    }
  }

  /**
   * Verifica o status de uma transação
   */
  async getTransactionStatus(transactionId) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${this.baseURL}/payments/api/v1/transactions/${transactionId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao consultar transação Hotmart:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Erro ao consultar status da transação'
      };
    }
  }

  /**
   * Valida webhook da Hotmart
   */
  validateWebhook(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookToken)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Erro ao validar webhook:', error);
      return false;
    }
  }

  /**
   * Processa webhook da Hotmart
   */
  async processWebhook(payload) {
    try {
      const { event, data } = payload;
      
      console.log('DEBUG - processWebhook payload:', JSON.stringify(payload, null, 2));
      
      switch (event) {
        case 'PURCHASE_COMPLETE':
          return await this.handlePurchaseComplete(data);
        case 'PURCHASE_CANCELED':
          return await this.handlePurchaseCanceled(data);
        case 'PURCHASE_REFUNDED':
          return await this.handlePurchaseRefunded(data);
        case 'SUBSCRIPTION_CANCELED':
          return await this.handleSubscriptionCanceled(data);
        default:
          console.log(`Evento não tratado: ${event}`);
          return { success: true, message: 'Evento ignorado' };
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trata compra aprovada
   */
  async handlePurchaseComplete(data) {
    try {
      console.log('DEBUG - Dados recebidos:', JSON.stringify(data, null, 2));
      
      const { buyer, product, transaction, purchase, subscription } = data;
      const { User, Subscription } = require('../models');
      
      // Usar purchase se transaction não estiver presente (formato da simulação)
      const transactionData = transaction || purchase;
      
      console.log('DEBUG - Objetos extraídos:', {
        buyer: buyer ? 'presente' : 'ausente',
        product: product ? 'presente' : 'ausente', 
        transaction: transaction ? 'presente' : 'ausente',
        purchase: purchase ? 'presente' : 'ausente',
        transactionData: transactionData ? 'presente' : 'ausente',
        subscription: subscription ? 'presente' : 'ausente'
      });
      
      // Verificar se os dados obrigatórios estão presentes
      if (!buyer || !buyer.email) {
        throw new Error('Dados do comprador são obrigatórios');
      }
      
      if (!product || !product.id) {
        throw new Error('Dados do produto são obrigatórios');
      }
      
      if (!transactionData || !transactionData.transaction) {
        throw new Error('Dados da transação são obrigatórios');
      }
      
      console.log('Compra aprovada:', {
        email: buyer.email,
        transactionId: transactionData.transaction,
        productId: product.id
      });
      
      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: buyer.email }
      });
      
      if (!user) {
        console.error('Usuário não encontrado para email:', buyer.email);
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }
      
      // Criar nova assinatura
      const newSubscription = await Subscription.create({
        userId: user.id,
        planType: 'premium',
        status: 'active',
        paymentMethod: 'hotmart',
        amount: 15.00, // Valor fixo para simulação
        currency: 'BRL',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        paymentId: transactionData.transaction,
        paymentData: {
          hotmartTransactionId: transactionData.transaction,
          hotmartSubscriptionId: subscription?.id,
          buyerEmail: buyer.email,
          productId: product.id
        }
      });
      
      // Atualizar usuário para premium
      await user.update({
        planType: 'premium',
        subscriptionStatus: 'active'
      });
      
      console.log('Usuário atualizado para premium:', {
        userId: user.id,
        email: user.email,
        subscriptionId: newSubscription.id
      });
      
      return {
        success: true,
        message: 'Usuário atualizado para premium',
        userId: user.id,
        subscriptionId: newSubscription.id
      };
    } catch (error) {
      console.error('Erro ao processar compra aprovada:', error);
      throw error;
    }
  }

  /**
   * Trata compra cancelada
   */
  async handlePurchaseCanceled(data) {
    try {
      const { buyer, transaction } = data;
      const { User, Subscription } = require('../models');
      
      console.log('Compra cancelada:', {
        email: buyer.email,
        transactionId: transaction.id
      });
      
      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: buyer.email }
      });
      
      if (user) {
        // Buscar assinatura ativa relacionada à transação
        const subscription = await Subscription.findOne({
          where: {
            userId: user.id,
            paymentId: transaction.id,
            status: 'active'
          }
        });
        
        if (subscription) {
          // Cancelar assinatura
          await subscription.update({ status: 'cancelled' });
          
          // Verificar se usuário tem outras assinaturas ativas
          const activeSubscriptions = await Subscription.count({
            where: {
              userId: user.id,
              status: 'active'
            }
          });
          
          // Se não tem outras assinaturas ativas, downgrade para free
          if (activeSubscriptions === 0) {
            await user.update({
              planType: 'free',
              subscriptionStatus: 'cancelled'
            });
          }
          
          console.log('Assinatura cancelada:', {
            userId: user.id,
            subscriptionId: subscription.id
          });
        }
      }
      
      return {
        success: true,
        message: 'Compra cancelada processada'
      };
    } catch (error) {
      console.error('Erro ao processar cancelamento:', error);
      throw error;
    }
  }

  /**
   * Trata reembolso
   */
  async handlePurchaseRefunded(data) {
    try {
      const { buyer, transaction } = data;
      const { User, Subscription } = require('../models');
      
      console.log('Reembolso processado:', {
        email: buyer.email,
        transactionId: transaction.id
      });
      
      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: buyer.email }
      });
      
      if (user) {
        // Buscar assinatura relacionada à transação
        const subscription = await Subscription.findOne({
          where: {
            userId: user.id,
            paymentId: transaction.id
          }
        });
        
        if (subscription) {
          // Cancelar assinatura devido ao reembolso
          await subscription.update({ 
            status: 'cancelled',
            paymentData: {
              ...subscription.paymentData,
              refunded: true,
              refundDate: new Date()
            }
          });
          
          // Verificar se usuário tem outras assinaturas ativas
          const activeSubscriptions = await Subscription.count({
            where: {
              userId: user.id,
              status: 'active'
            }
          });
          
          // Se não tem outras assinaturas ativas, downgrade para free
          if (activeSubscriptions === 0) {
            await user.update({
              planType: 'free',
              subscriptionStatus: 'cancelled'
            });
          }
          
          console.log('Reembolso processado - usuário downgraded:', {
            userId: user.id,
            subscriptionId: subscription.id
          });
        }
      }
      
      return {
        success: true,
        message: 'Reembolso processado'
      };
    } catch (error) {
      console.error('Erro ao processar reembolso:', error);
      throw error;
    }
  }

  /**
   * Trata cancelamento de assinatura
   */
  async handleSubscriptionCanceled(data) {
    try {
      const { buyer, subscription } = data;
      const { User, Subscription } = require('../models');
      
      console.log('Assinatura cancelada:', {
        email: buyer.email,
        subscriptionId: subscription.id
      });
      
      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: buyer.email }
      });
      
      if (user) {
        // Buscar assinatura no banco usando o ID da Hotmart
        const localSubscription = await Subscription.findOne({
          where: {
            userId: user.id,
            'paymentData.hotmartSubscriptionId': subscription.id
          }
        });
        
        if (localSubscription) {
          // Cancelar assinatura
          await localSubscription.update({ status: 'cancelled' });
          
          // Verificar se usuário tem outras assinaturas ativas
          const activeSubscriptions = await Subscription.count({
            where: {
              userId: user.id,
              status: 'active'
            }
          });
          
          // Se não tem outras assinaturas ativas, downgrade para free
          if (activeSubscriptions === 0) {
            await user.update({
              planType: 'free',
              subscriptionStatus: 'cancelled'
            });
          }
          
          console.log('Assinatura cancelada no sistema:', {
            userId: user.id,
            subscriptionId: localSubscription.id
          });
        }
      }
      
      return {
        success: true,
        message: 'Cancelamento de assinatura processado'
      };
    } catch (error) {
      console.error('Erro ao processar cancelamento de assinatura:', error);
      throw error;
    }
  }

  /**
   * Cria pagamento PIX via Hotmart
   */
  /**
   * Cria um checkout da Hotmart com PIX como método de pagamento
   * A Hotmart gerencia o PIX internamente através do checkout
   */
  async createPixPayment(pixData) {
    try {
      // Usar o método createCheckout com PIX como método preferencial
      const checkoutData = {
        ...pixData,
        paymentMethod: 'PIX'
      };
      
      console.log('Criando checkout Hotmart com PIX:', {
        userId: pixData.userId,
        amount: pixData.amount,
        customerEmail: pixData.customerEmail
      });
      
      const result = await this.createCheckout(checkoutData);
      
      if (result.success) {
        return {
          success: true,
          checkoutUrl: result.checkoutUrl,
          transactionId: result.transactionId,
          pixCode: null, // A Hotmart gerencia o PIX no checkout
          pixId: result.transactionId,
          qrCodeBase64: null, // Será gerado no checkout da Hotmart
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
          amount: pixData.amount,
          data: result.data,
          isHotmartCheckout: true
        };
      } else {
        throw new Error(result.error || 'Falha ao criar checkout Hotmart');
      }
    } catch (error) {
      console.error('Erro ao criar checkout PIX Hotmart:', {
        status: error.response?.status,
        data: error.response?.data || error.message,
        userId: pixData.userId
      });
      
      return {
        success: false,
        error: `Erro ao criar checkout PIX: ${error.message}`
      };
    }
  }

  /**
   * Cria link de pagamento direto (alternativa ao checkout)
   */
  async createPaymentLink(orderData) {
    try {
      const accessToken = await this.getAccessToken();
      // Usar URL de sandbox se estiver em modo sandbox
      const apiHost = this.isSandbox ? this.sandboxURL : this.baseURL;
      const url = `${apiHost}/payments/api/v1/payment-links`;
      
      const linkData = {
        product_id: payments.hotmart.productId,
        amount: orderData.amount || 9900,
        buyer_email: orderData.customerEmail,
        buyer_name: orderData.customerName,
        success_url: this.successUrl,
        cancel_url: this.cancelUrl,
        metadata: {
          userId: orderData.userId,
          planType: 'premium'
        }
      };
      
      const response = await axios.post(url, linkData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Alguns ambientes/versões podem retornar chaves diferentes
      const raw = response?.data || {};
      // Log seguro dos campos retornados
      try {
        console.log('Hotmart createPaymentLink - campos retornados:', Object.keys(raw));
      } catch (_) {}
      
      const paymentUrl = raw.payment_url || raw.checkout_url || raw.url || raw.redirect_url || raw?.link?.url || null;
      const linkId = raw.link_id || raw.id || raw?.link?.id || null;

      return {
        success: true,
        paymentUrl,
        linkId,
        data: raw
      };
    } catch (error) {
      // Log detalhado do erro da Hotmart para diagnóstico
      console.error('Erro ao criar link de pagamento:', {
        status: error.response?.status,
        data: error.response?.data || error.message
      });
      const hotmartData = error.response?.data || {};
      const reason = hotmartData.error_description || hotmartData.message || hotmartData.error || error.message;
      return {
        success: false,
        error: `Erro ao gerar link de pagamento: ${reason}`
      };
    }
  }
}

module.exports = new HotmartService();