const subscriptionService = require('../services/SubscriptionService');
const logger = require('../utils/logger');

/**
 * Middleware para verificar se o usuário tem assinatura premium ativa
 * Deve ser usado após o middleware de autenticação
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const requirePremium = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.id;

    // Verificar se tem assinatura ativa para o mês atual
    const hasActiveSubscription = await subscriptionService.hasActiveSubscriptionForCurrentMonth(userId);

    if (!hasActiveSubscription) {
      // Log para auditoria
      logger.warn('Acesso negado - assinatura premium requerida', {
        userId,
        userEmail: req.user.email,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a usuários premium',
        message: 'Esta funcionalidade requer uma assinatura premium ativa para o mês atual',
        code: 'PREMIUM_REQUIRED',
        upgradeUrl: '/api/payments/create-hotmart' // URL para upgrade
      });
    }

    // Log de acesso autorizado (opcional, apenas para auditoria)
    logger.info('Acesso premium autorizado', {
      userId,
      userEmail: req.user.email,
      endpoint: req.originalUrl,
      method: req.method
    });

    // Usuário tem assinatura ativa, continuar
    next();

  } catch (error) {
    logger.error('Erro no middleware requirePremium', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      endpoint: req.originalUrl
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware mais flexível que verifica assinatura premium mas permite acesso limitado
 * Adiciona informações da assinatura ao req.subscription para uso posterior
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const checkPremiumStatus = async (req, res, next) => {
  try {
    // Inicializar objeto de assinatura
    req.subscription = {
      isPremium: false,
      isActive: false,
      details: null
    };

    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return next(); // Continuar sem informações de assinatura
    }

    const userId = req.user.id;

    // Obter detalhes da assinatura
    const subscriptionDetails = await subscriptionService.getUserActiveSubscription(userId);
    
    if (subscriptionDetails) {
      req.subscription = {
        isPremium: subscriptionDetails.isActiveForCurrentMonth,
        isActive: subscriptionDetails.isActive,
        details: subscriptionDetails
      };
    }

    // Continuar independentemente do status da assinatura
    next();

  } catch (error) {
    logger.error('Erro no middleware checkPremiumStatus', {
      error: error.message,
      userId: req.user?.id,
      endpoint: req.originalUrl
    });

    // Em caso de erro, continuar sem informações de assinatura
    req.subscription = {
      isPremium: false,
      isActive: false,
      details: null,
      error: error.message
    };

    next();
  }
};

/**
 * Middleware que verifica se o usuário atingiu o limite de uso gratuito
 * Usado para funcionalidades que têm limite para usuários free
 * @param {number} freeLimit - Limite para usuários gratuitos
 * @param {string} featureName - Nome da funcionalidade para logs
 * @returns {Function} - Middleware function
 */
const checkUsageLimit = (freeLimit, featureName) => {
  return async (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      const userId = req.user.id;

      // Verificar se tem assinatura premium ativa
      const hasActiveSubscription = await subscriptionService.hasActiveSubscriptionForCurrentMonth(userId);

      if (hasActiveSubscription) {
        // Usuário premium, sem limites
        return next();
      }

      // Usuário gratuito, verificar limite
      // Aqui você pode implementar lógica específica para contar uso
      // Por exemplo, verificar quantas simulações o usuário fez no mês
      
      // Para este exemplo, vamos usar um campo do usuário
      const currentUsage = req.user.investmentSimulationsCount || 0;
      
      if (currentUsage >= freeLimit) {
        logger.warn('Limite de uso atingido para usuário gratuito', {
          userId,
          userEmail: req.user.email,
          featureName,
          currentUsage,
          freeLimit,
          endpoint: req.originalUrl
        });

        return res.status(403).json({
          success: false,
          error: `Limite de ${freeLimit} ${featureName} atingido`,
          message: `Usuários gratuitos podem usar ${featureName} até ${freeLimit} vezes por mês. Faça upgrade para premium para uso ilimitado.`,
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage,
          limit: freeLimit,
          upgradeUrl: '/api/payments/create-hotmart'
        });
      }

      // Adicionar informações de uso ao request
      req.usageInfo = {
        currentUsage,
        limit: freeLimit,
        remaining: freeLimit - currentUsage,
        isPremium: false
      };

      next();

    } catch (error) {
      logger.error('Erro no middleware checkUsageLimit', {
        error: error.message,
        userId: req.user?.id,
        featureName,
        endpoint: req.originalUrl
      });

      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

module.exports = {
  requirePremium,
  checkPremiumStatus,
  checkUsageLimit
};