const express = require('express');
const { authenticate } = require('../middleware/auth');
const PixPaymentService = require('../services/PixPaymentService');
const { User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/pix-payments/generate
 * @desc Gerar código PIX e QR Code para pagamento
 * @access Private
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount = 15.00 } = req.body;

    // Buscar dados do usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Gerar pagamento PIX
    const pixPayment = await PixPaymentService.generatePixPayment({
      userId,
      email: user.email,
      amount: parseFloat(amount)
    });

    logger.info('Código PIX gerado com sucesso', {
      userId,
      accessCode: pixPayment.accessCode,
      amount: pixPayment.amount
    });

    res.json({
      success: true,
      message: 'Código PIX gerado com sucesso',
      data: {
        id: pixPayment.id,
        accessCode: pixPayment.accessCode,
        pixCode: pixPayment.pixCode,
        qrCodeData: pixPayment.qrCodeData,
        amount: pixPayment.amount,
        expiresAt: pixPayment.expiresAt,
        status: pixPayment.status
      }
    });

  } catch (error) {
    logger.error('Erro ao gerar código PIX:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao gerar código PIX'
    });
  }
});

/**
 * @route POST /api/pix-payments/mark-paid
 * @desc Marcar pagamento como pago pelo usuário
 * @access Private
 */
router.post('/mark-paid', authenticate, async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        error: 'Código de acesso é obrigatório'
      });
    }

    // Marcar como pago
    const result = await PixPaymentService.markAsPaid(accessCode);

    logger.info('Pagamento marcado como pago', {
      userId: req.user.userId,
      accessCode,
      paymentId: result.id
    });

    res.json({
      success: true,
      message: 'Pagamento marcado como pago. Aguardando confirmação administrativa.',
      data: result
    });

  } catch (error) {
    logger.error('Erro ao marcar pagamento como pago:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao marcar pagamento como pago'
    });
  }
});

/**
 * @route GET /api/pix-payments/my-payments
 * @desc Listar pagamentos PIX do usuário
 * @access Private
 */
router.get('/my-payments', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, offset = 0 } = req.query;

    // Buscar pagamentos do usuário
    const { PixPaymentCode } = require('../models');
    
    const payments = await PixPaymentCode.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'accessCode', 'amount', 'status', 
        'createdAt', 'expiresAt', 'paidAt', 'confirmedAt'
      ]
    });

    res.json({
      success: true,
      data: {
        payments: payments.rows,
        total: payments.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Erro ao listar pagamentos do usuário:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/pix-payments/status/:accessCode
 * @desc Verificar status de um pagamento específico
 * @access Private
 */
router.get('/status/:accessCode', authenticate, async (req, res) => {
  try {
    const { accessCode } = req.params;
    const userId = req.user.userId;

    const { PixPaymentCode } = require('../models');
    
    const payment = await PixPaymentCode.findOne({
      where: { 
        accessCode,
        userId 
      },
      attributes: [
        'id', 'accessCode', 'amount', 'status', 
        'createdAt', 'expiresAt', 'paidAt', 'confirmedAt'
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pagamento não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          accessCode: payment.accessCode,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          expiresAt: payment.expiresAt,
          paidAt: payment.paidAt,
          confirmedAt: payment.confirmedAt,
          isExpired: payment.isExpired(),
          canBeUsed: payment.canBeUsed()
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao verificar status do pagamento:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS ADMINISTRATIVAS =====

/**
 * @route GET /api/pix-payments/admin/list
 * @desc Listar todos os pagamentos PIX (admin)
 * @access Private (Admin)
 */
router.get('/admin/list', authenticate, async (req, res) => {
  try {
    // TODO: Implementar middleware de verificação de admin
    // Por enquanto, verificar se é admin pelo email ou role
    const user = await User.findByPk(req.user.userId);
    if (!user || !user.isAdmin()) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem acessar esta rota.'
      });
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const result = await PixPaymentService.listPayments({
      status,
      limit,
      offset
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erro ao listar pagamentos (admin):', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/pix-payments/admin/confirm
 * @desc Confirmar pagamento PIX (admin)
 * @access Private (Admin)
 */
router.post('/admin/confirm', authenticate, async (req, res) => {
  try {
    // TODO: Implementar middleware de verificação de admin
    const user = await User.findByPk(req.user.userId);
    if (!user || !user.isAdmin()) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem confirmar pagamentos.'
      });
    }

    const { accessCode, adminNotes } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        error: 'Código de acesso é obrigatório'
      });
    }

    // Confirmar pagamento
    const result = await PixPaymentService.confirmPayment(accessCode, adminNotes);

    logger.info('Pagamento confirmado pelo admin', {
      adminId: req.user.userId,
      accessCode,
      subscriptionId: result.subscription?.id
    });

    res.json({
      success: true,
      message: 'Pagamento confirmado e assinatura ativada com sucesso',
      data: result
    });

  } catch (error) {
    logger.error('Erro ao confirmar pagamento (admin):', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao confirmar pagamento'
    });
  }
});

/**
 * @route POST /api/pix-payments/admin/expire-old
 * @desc Expirar códigos PIX antigos (admin/cron)
 * @access Private (Admin)
 */
router.post('/admin/expire-old', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user || !user.isAdmin()) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem executar esta ação.'
      });
    }

    const expiredCount = await PixPaymentService.expireOldCodes();

    logger.info('Códigos PIX expirados pelo admin', {
      adminId: req.user.userId,
      expiredCount
    });

    res.json({
      success: true,
      message: `${expiredCount} códigos PIX foram expirados`,
      data: { expiredCount }
    });

  } catch (error) {
    logger.error('Erro ao expirar códigos PIX:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;