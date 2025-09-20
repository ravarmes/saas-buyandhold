const { User, Subscription, PaymentTransaction } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class SubscriptionService {
  /**
   * Verifica se o usuário tem assinatura ativa para o mês atual
   * @param {string} userId - ID do usuário
   * @returns {boolean} - True se tem assinatura ativa
   */
  async hasActiveSubscriptionForCurrentMonth(userId) {
    try {
      if (!userId) {
        return false;
      }

      // Buscar assinatura ativa do usuário
      const subscription = await Subscription.findOne({
        where: {
          userId: userId,
          status: 'active'
        },
        order: [['createdAt', 'DESC']]
      });

      if (!subscription) {
        return false;
      }

      // Usar método do modelo para verificar se está ativa no mês atual
      return subscription.isActiveForCurrentMonth();

    } catch (error) {
      logger.error('Erro ao verificar assinatura ativa', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Verifica se o usuário tem assinatura ativa (qualquer período)
   * @param {string} userId - ID do usuário
   * @returns {boolean} - True se tem assinatura ativa
   */
  async hasActiveSubscription(userId) {
    try {
      if (!userId) {
        return false;
      }

      const subscription = await Subscription.findOne({
        where: {
          userId: userId,
          status: 'active'
        },
        order: [['createdAt', 'DESC']]
      });

      return subscription ? subscription.isActive() : false;

    } catch (error) {
      logger.error('Erro ao verificar assinatura ativa', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Obtém detalhes da assinatura ativa do usuário
   * @param {string} userId - ID do usuário
   * @returns {Object|null} - Dados da assinatura ou null
   */
  async getUserActiveSubscription(userId) {
    try {
      if (!userId) {
        return null;
      }

      const subscription = await Subscription.findOne({
        where: {
          userId: userId,
          status: 'active'
        },
        include: [
          {
            model: PaymentTransaction,
            as: 'transactions',
            where: {
              status: ['approved', 'pending']
            },
            required: false,
            order: [['createdAt', 'DESC']]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (!subscription) {
        return null;
      }

      return {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        amount: subscription.amount,
        currency: subscription.currency,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        lastPaymentDate: subscription.lastPaymentDate,
        nextBillingDate: subscription.nextBillingDate,
        isRecurring: subscription.isRecurring,
        isActiveForCurrentMonth: subscription.isActiveForCurrentMonth(),
        isActive: subscription.isActive(),
        transactions: subscription.transactions || []
      };

    } catch (error) {
      logger.error('Erro ao obter assinatura do usuário', {
        userId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Marca assinatura como paga e ativa para o mês atual
   * @param {string} userId - ID do usuário
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Object} - Resultado da operação
   */
  async markSubscriptionPaid(userId, paymentData) {
    try {
      if (!userId || !paymentData) {
        throw new Error('userId e paymentData são obrigatórios');
      }

      // Buscar usuário
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar assinatura existente ou criar nova
      let subscription = await Subscription.findOne({
        where: {
          userId: userId,
          status: ['active', 'pending']
        },
        order: [['createdAt', 'DESC']]
      });

      if (!subscription) {
        // Criar nova assinatura
        subscription = await Subscription.create({
          userId: userId,
          planType: paymentData.planType || 'premium',
          status: 'pending',
          paymentMethod: paymentData.paymentMethod || 'hotmart',
          amount: paymentData.amount || 15.00,
          currency: paymentData.currency || 'BRL',
          startDate: new Date(),
          paymentId: paymentData.transactionId,
          isRecurring: paymentData.isRecurring || false
        });
      }

      // Ativar assinatura para o mês atual
      await subscription.activateForCurrentMonth(paymentData.paymentDate);

      // Atualizar dados específicos da Hotmart se fornecidos
      if (paymentData.hotmartData) {
        await subscription.updateFromHotmartPayment(paymentData.hotmartData);
      }

      // Atualizar usuário para premium
      await user.update({
        planType: subscription.planType,
        subscriptionStatus: 'active'
      });

      logger.info('Assinatura marcada como paga', {
        userId,
        subscriptionId: subscription.id,
        planType: subscription.planType,
        amount: subscription.amount
      });

      return {
        success: true,
        message: 'Assinatura ativada com sucesso',
        subscription: {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          isActiveForCurrentMonth: subscription.isActiveForCurrentMonth()
        }
      };

    } catch (error) {
      logger.error('Erro ao marcar assinatura como paga', {
        userId,
        error: error.message,
        paymentData
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancela assinatura do usuário
   * @param {string} userId - ID do usuário
   * @param {string} reason - Motivo do cancelamento
   * @returns {Object} - Resultado da operação
   */
  async cancelSubscription(userId, reason = 'user_request') {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      // Buscar assinatura ativa
      const subscription = await Subscription.findOne({
        where: {
          userId: userId,
          status: 'active'
        },
        order: [['createdAt', 'DESC']]
      });

      if (!subscription) {
        return {
          success: false,
          error: 'Nenhuma assinatura ativa encontrada'
        };
      }

      // Cancelar assinatura
      await subscription.cancel();

      // Verificar se usuário tem outras assinaturas ativas
      const activeSubscriptions = await Subscription.count({
        where: {
          userId: userId,
          status: 'active'
        }
      });

      // Atualizar usuário se não tem outras assinaturas
      if (activeSubscriptions === 0) {
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({
            planType: 'free',
            subscriptionStatus: 'canceled'
          });
        }
      }

      logger.info('Assinatura cancelada', {
        userId,
        subscriptionId: subscription.id,
        reason
      });

      return {
        success: true,
        message: 'Assinatura cancelada com sucesso'
      };

    } catch (error) {
      logger.error('Erro ao cancelar assinatura', {
        userId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém histórico de transações do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de filtro
   * @returns {Array} - Lista de transações
   */
  async getUserTransactionHistory(userId, options = {}) {
    try {
      if (!userId) {
        return [];
      }

      const { limit = 50, offset = 0, status, eventType } = options;
      
      const whereClause = { userId };
      
      if (status) {
        whereClause.status = status;
      }
      
      if (eventType) {
        whereClause.eventType = eventType;
      }

      const transactions = await PaymentTransaction.findAll({
        where: whereClause,
        include: [
          {
            model: Subscription,
            as: 'subscription',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return transactions.map(transaction => ({
        id: transaction.id,
        hotmartTransactionId: transaction.hotmartTransactionId,
        eventType: transaction.eventType,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amount,
        currency: transaction.currency,
        transactionDate: transaction.transactionDate,
        createdAt: transaction.createdAt,
        subscription: transaction.subscription ? {
          id: transaction.subscription.id,
          planType: transaction.subscription.planType,
          status: transaction.subscription.status
        } : null
      }));

    } catch (error) {
      logger.error('Erro ao obter histórico de transações', {
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Verifica assinaturas expiradas e atualiza status
   * @returns {Object} - Resultado da operação
   */
  async checkExpiredSubscriptions() {
    try {
      // Usar timezone do Brasil (UTC-3)
      const now = new Date();
      const brazilOffset = -3 * 60; // UTC-3 em minutos
      const brazilTime = new Date(now.getTime() + (brazilOffset * 60 * 1000));

      // Buscar assinaturas ativas que expiraram
      const expiredSubscriptions = await Subscription.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            {
              endDate: {
                [Op.lt]: brazilTime
              }
            },
            {
              currentPeriodEnd: {
                [Op.lt]: brazilTime
              }
            }
          ]
        },
        include: [
          {
            model: User,
            as: 'user',
            required: true
          }
        ]
      });

      let expiredCount = 0;
      
      for (const subscription of expiredSubscriptions) {
        // Verificar se realmente expirou usando método do modelo
        if (subscription.isExpired() || !subscription.isActiveForCurrentMonth()) {
          await subscription.expire();
          
          // Verificar se usuário tem outras assinaturas ativas
          const activeSubscriptions = await Subscription.count({
            where: {
              userId: subscription.userId,
              status: 'active'
            }
          });

          // Downgrade usuário se não tem outras assinaturas
          if (activeSubscriptions === 0) {
            await subscription.user.update({
              planType: 'free',
              subscriptionStatus: 'expired'
            });
          }
          
          expiredCount++;
        }
      }

      logger.info('Verificação de assinaturas expiradas concluída', {
        expiredCount,
        totalChecked: expiredSubscriptions.length
      });

      return {
        success: true,
        expiredCount,
        totalChecked: expiredSubscriptions.length
      };

    } catch (error) {
      logger.error('Erro ao verificar assinaturas expiradas', {
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém estatísticas de assinaturas
   * @returns {Object} - Estatísticas
   */
  async getSubscriptionStats() {
    try {
      const stats = await Subscription.findAll({
        attributes: [
          'status',
          'planType',
          [Subscription.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status', 'planType'],
        raw: true
      });

      const totalUsers = await User.count();
      const premiumUsers = await User.count({
        where: { planType: 'premium' }
      });
      const freeUsers = totalUsers - premiumUsers;

      const activeSubscriptions = await Subscription.count({
        where: { status: 'active' }
      });

      return {
        totalUsers,
        premiumUsers,
        freeUsers,
        activeSubscriptions,
        conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers * 100).toFixed(2) : 0,
        detailedStats: stats
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de assinaturas', {
        error: error.message
      });
      
      return {
        totalUsers: 0,
        premiumUsers: 0,
        freeUsers: 0,
        activeSubscriptions: 0,
        conversionRate: 0,
        detailedStats: []
      };
    }
  }
}

module.exports = new SubscriptionService();