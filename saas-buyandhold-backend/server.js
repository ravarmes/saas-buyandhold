const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const { corsOrigins, port, debugLog, getEnvironment } = require('./config/environment');

// Import routes
const authRoutes = require('./src/routes/auth');
const portfolioRoutes = require('./src/routes/portfolios');
const assetRoutes = require('./src/routes/assets');
const investmentRoutes = require('./src/routes/investments');
const assetDataRoutes = require('./src/routes/assetData');
const paymentRoutes = require('./src/routes/payments');
// const asaasRoutes = require('./src/routes/asaasRoutes');
const contactRoutes = require('./src/routes/contact');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

debugLog('CORS configurado para origens:', corsOrigins);
debugLog('Ambiente atual:', getEnvironment());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/asset-data', assetDataRoutes);
app.use('/api/payments', paymentRoutes);
// app.use('/api/payments/asaas', asaasRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token inválido ou expirado'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Algo deu errado' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Conexão com banco de dados estabelecida com sucesso');
    
    // Sync database models
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Modelos do banco sincronizados (alterados)');
    }
    
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
