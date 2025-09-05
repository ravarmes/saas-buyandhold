const express = require('express');
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const Joi = require('joi');
const router = express.Router();

// Validação para formulário de contato
const validateContactForm = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
    subject: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Assunto deve ter pelo menos 5 caracteres',
      'string.max': 'Assunto deve ter no máximo 200 caracteres',
      'any.required': 'Assunto é obrigatório'
    }),
    message: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Mensagem deve ter pelo menos 10 caracteres',
      'string.max': 'Mensagem deve ter no máximo 2000 caracteres',
      'any.required': 'Mensagem é obrigatória'
    }),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal')
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details[0].message
    });
  }
  
  next();
};

// Validação para relatório de bug
const validateBugReport = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    bugType: Joi.string().valid('interface', 'calculation', 'performance', 'data', 'security', 'other').required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    stepsToReproduce: Joi.string().min(10).max(1000).required(),
    expectedBehavior: Joi.string().min(5).max(1000).required(),
    actualBehavior: Joi.string().min(5).max(1000).required(),
    browser: Joi.string().max(100).allow(''),
    device: Joi.string().max(100).allow('')
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details[0].message
    });
  }
  
  next();
};

// Validação para sugestão de funcionalidade
const validateFeatureSuggestion = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    category: Joi.string().valid('interface', 'calculation', 'data', 'integration', 'mobile', 'other').required(),
    priority: Joi.string().valid('low', 'medium', 'high').required(),
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    useCase: Joi.string().min(10).max(1000).required(),
    benefits: Joi.string().min(10).max(1000).required(),
    targetUsers: Joi.string().valid('all', 'free', 'premium', 'new', 'experienced').required()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details[0].message
    });
  }
  
  next();
};

/**
 * @route POST /api/contact/send
 * @desc Enviar mensagem de contato
 * @access Private
 */
router.post('/send', authenticate, validateContactForm, async (req, res) => {
  try {
    const result = await emailService.sendContactMessage(req.body);
    
    res.json({
      message: 'Mensagem enviada com sucesso! Responderemos em breve.',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    res.status(500).json({
      error: 'Erro ao enviar mensagem. Tente novamente ou entre em contato diretamente pelo email ajuda.brugnara@gmail.com'
    });
  }
});

/**
 * @route POST /api/contact/bug-report
 * @desc Enviar relatório de bug
 * @access Private
 */
router.post('/bug-report', authenticate, validateBugReport, async (req, res) => {
  try {
    const result = await emailService.sendBugReport(req.body);
    
    res.json({
      message: 'Relatório de bug enviado com sucesso! Analisaremos o problema reportado.',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Erro ao enviar relatório de bug:', error);
    res.status(500).json({
      error: 'Erro ao enviar relatório. Tente novamente ou entre em contato diretamente pelo email ajuda.brugnara@gmail.com'
    });
  }
});

/**
 * @route POST /api/contact/feature-suggestion
 * @desc Enviar sugestão de funcionalidade
 * @access Private
 */
router.post('/feature-suggestion', authenticate, validateFeatureSuggestion, async (req, res) => {
  try {
    const result = await emailService.sendFeatureSuggestion(req.body);
    
    res.json({
      message: 'Sugestão enviada com sucesso! Avaliaremos sua proposta.',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Erro ao enviar sugestão:', error);
    res.status(500).json({
      error: 'Erro ao enviar sugestão. Tente novamente ou entre em contato diretamente pelo email ajuda.brugnara@gmail.com'
    });
  }
});

module.exports = router;