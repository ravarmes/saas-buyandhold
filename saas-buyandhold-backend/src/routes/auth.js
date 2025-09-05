const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const { jwt: jwtConfig } = require('../../config/environment');
const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Registrar novo usuário
 * @access Public
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Criar usuário
    const user = await User.create({
      email,
      password,
      name,
      planType: 'free'
    });

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtConfig.secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login do usuário
 * @access Public
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Verificar se a conta está ativa
    if (user.status === 'inactive') {
      return res.status(403).json({
        error: 'Conta desativada. Entre em contato com o suporte se necessário.'
      });
    }

    // Atualizar último login
    await user.update({ lastLoginAt: new Date() });

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtConfig.secret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Obter perfil do usuário
 * @access Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [
        {
          association: 'portfolios',
          attributes: ['id', 'name', 'isDefault', 'totalValue', 'createdAt']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      user: user.toJSON(),
      permissions: {
        isPremium: user.isPremium(),
        canCreateMultiplePortfolios: user.isPremium(),
        canSavePortfolios: user.isPremium()
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Atualizar perfil do usuário
 * @access Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validações básicas
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: 'Nome deve ter pelo menos 2 caracteres'
      });
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.user.userId }
        } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          error: 'Este email já está em uso por outro usuário'
        });
      }
    }

    // Atualizar usuário
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    await user.update({
      name: name.trim(),
      email: email.trim().toLowerCase()
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/auth/subscription-status
 * @desc Verificar status de assinatura do usuário
 * @access Private
 */
router.get('/subscription-status', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar assinatura ativa
    const subscription = await Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });

    let planType = 'free';
    let subscriptionStatus = 'inactive';
    let subscriptionEndDate = null;

    if (subscription) {
      const now = new Date();
      if (subscription.endDate > now) {
        planType = 'premium';
        subscriptionStatus = 'active';
        subscriptionEndDate = subscription.endDate;
      } else {
        // Assinatura expirada, atualizar status
        await subscription.update({ status: 'expired' });
        await user.update({ planType: 'free' });
      }
    }

    // Atualizar usuário se necessário
    if (user.planType !== planType) {
      await user.update({ planType });
    }

    res.json({
      planType,
      subscriptionStatus,
      subscriptionEndDate
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route DELETE /api/auth/deactivate-account
 * @desc Desativar conta do usuário (soft delete)
 * @access Private
 */
router.delete('/deactivate-account', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se a conta já está inativa
    if (user.status === 'inactive') {
      return res.status(400).json({
        error: 'Conta já está desativada'
      });
    }

    // Desativar a conta (soft delete)
    await user.update({ status: 'inactive' });

    res.json({
      message: 'Conta desativada com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Solicitar reset de senha
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    // Verificar se usuário existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return res.status(200).json({
        message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha'
      });
    }

    // Verificar se a conta está ativa
    if (user.status === 'inactive') {
      return res.status(400).json({
        error: 'Conta inativa. Entre em contato com o suporte para reativar sua conta'
      });
    }

    // Gerar token de reset
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no usuário
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires
    });

    // Log do token para debug (remover em produção)
    console.log(`Reset token gerado para ${email}: ${resetToken}`);
    console.log(`Link de reset: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    
    // Nota: O email será enviado pelo frontend usando EmailJS
    // O frontend deve fazer uma chamada para enviar o email com o token

    res.status(200).json({
      message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha',
      // Dados para o frontend enviar o email via EmailJS
      emailData: user ? {
        name: user.name,
        email: user.email,
        resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      } : null
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Confirmar reset de senha com token
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token e nova senha são obrigatórios'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário pelo token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Token inválido ou expirado'
      });
    }

    // Verificar se a conta está ativa
    if (user.status === 'inactive') {
      return res.status(400).json({
        error: 'Conta inativa. Entre em contato com o suporte para reativar sua conta'
      });
    }

    // Atualizar senha e limpar token
    await user.update({
      password: newPassword, // O hash será feito pelo hook beforeUpdate
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.status(200).json({
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;