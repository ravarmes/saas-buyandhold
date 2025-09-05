const winston = require('winston');
const { logs } = require('../../config/environment');

// Verificar se está em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Configuração do logger
const logger = winston.createLogger({
  level: logs.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'saas-buyandhold' },
  transports: []
});

// Se não estiver em produção, adicionar logs no console
if (isDevelopment) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;