const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');

/**
 * Middleware de autenticação
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acesso requerido'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    const { jwt: jwtConfig } = require('../../config/environment');
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Verificar se usuário ainda existe
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      userId: user.id,
      email: user.email,
      planType: user.planType,
      isPremium: user.isPremium()
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar se usuário é premium
 */
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação requerida'
      });
    }

    const user = await User.findByPk(req.user.userId);
    
    // Verificar se usuário tem plano premium
    if (user.planType !== 'premium') {
      return res.status(403).json({
        error: 'Acesso restrito a usuários Premium',
        upgradeRequired: true,
        currentPlan: user.planType
      });
    }

    // Verificar se tem assinatura ativa
    const subscription = await Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });

    if (!subscription || !subscription.isActive()) {
      // Atualizar usuário para free se assinatura expirou
      if (subscription && subscription.isExpired()) {
        await subscription.expire();
        await user.update({
          planType: 'free',
          subscriptionStatus: 'expired'
        });
      }

      return res.status(403).json({
        error: 'Assinatura Premium expirada ou inválida',
        upgradeRequired: true,
        currentPlan: 'free',
        subscriptionExpired: true
      });
    }

    // Adicionar informações da assinatura à requisição
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error('Premium check error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar e atualizar status de assinatura
 */
const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findByPk(req.user.userId);
    
    if (user.planType === 'premium') {
      const subscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: 'active'
        },
        order: [['createdAt', 'DESC']]
      });

      // Se não tem assinatura ativa ou expirou, downgrade para free
      if (!subscription || subscription.isExpired()) {
        if (subscription && subscription.isExpired()) {
          await subscription.expire();
        }
        
        await user.update({
          planType: 'free',
          subscriptionStatus: subscription ? 'expired' : 'cancelled'
        });
        
        // Atualizar informações do usuário na requisição
        req.user.planType = 'free';
        req.user.isPremium = false;
      } else {
        req.user.isPremium = true;
        req.subscription = subscription;
      }
    } else {
      req.user.isPremium = false;
    }

    next();
  } catch (error) {
    console.error('Subscription status check error:', error);
    next(); // Continue mesmo com erro para não quebrar a aplicação
  }
};

module.exports = {
  authenticate,
  requirePremium,
  checkSubscriptionStatus
};