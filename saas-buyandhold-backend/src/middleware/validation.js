const Joi = require('joi');

/**
 * Validação para registro de usuário
 */
const validateRegister = (req, res, next) => {
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
    password: Joi.string().min(6).required().messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'any.required': 'Senha é obrigatória'
    })
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
 * Validação para login
 */
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória'
    })
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
 * Validação para cálculo de investimentos
 */
const validateInvestmentCalculation = (req, res, next) => {
  const schema = Joi.object({
    portfolioId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID da carteira deve ser um UUID válido',
      'any.required': 'ID da carteira é obrigatório'
    }),
    investmentAmount: Joi.number().positive().required().messages({
      'number.positive': 'Valor de investimento deve ser positivo',
      'any.required': 'Valor de investimento é obrigatório'
    })
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

module.exports = {
  validateRegister,
  validateLogin,
  validateInvestmentCalculation
};