const express = require('express');
const asaasController = require('../controllers/asaasController');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/payments/asaas/create-pix
 * @desc Criar cobrança PIX usando Asaas
 * @access Private
 */
router.post('/create-pix', authMiddleware, async (req, res) => {
    logger.info('Rota POST /api/payments/asaas/create-pix chamada', {
        userId: req.user?.id,
        body: { ...req.body, amount: req.body.amount } // Log sem dados sensíveis
    });
    
    await asaasController.createPixPayment(req, res);
});

/**
 * @route GET /api/payments/asaas/status/:paymentId
 * @desc Verificar status de um pagamento
 * @access Private
 */
router.get('/status/:paymentId', authMiddleware, async (req, res) => {
    logger.info('Rota GET /api/payments/asaas/status/:paymentId chamada', {
        userId: req.user?.id,
        paymentId: req.params.paymentId
    });
    
    await asaasController.checkPaymentStatus(req, res);
});

/**
 * @route GET /api/payments/asaas/user-payments
 * @desc Listar pagamentos do usuário
 * @access Private
 */
router.get('/user-payments', authMiddleware, async (req, res) => {
    logger.info('Rota GET /api/payments/asaas/user-payments chamada', {
        userId: req.user?.id,
        query: req.query
    });
    
    await asaasController.getUserPayments(req, res);
});

/**
 * @route POST /api/payments/asaas/webhook
 * @desc Webhook para receber notificações do Asaas
 * @access Public (mas deve ser validado pelo Asaas)
 */
router.post('/webhook', async (req, res) => {
    logger.info('Webhook do Asaas recebido', {
        headers: {
            'user-agent': req.get('user-agent'),
            'content-type': req.get('content-type')
        },
        body: req.body
    });
    
    await asaasController.webhook(req, res);
});

/**
 * @route GET /api/payments/asaas/health
 * @desc Health check para verificar se o serviço Asaas está funcionando
 * @access Private
 */
router.get('/health', authMiddleware, async (req, res) => {
    try {
        const asaasService = require('../services/AsaasService');
        
        // Teste simples para verificar se o serviço está configurado
        const isConfigured = !!asaasService.accessToken;
        const environment = asaasService.isSandbox ? 'sandbox' : 'production';
        
        res.json({
            success: true,
            status: 'healthy',
            configured: isConfigured,
            environment: environment,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro no health check do Asaas', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;