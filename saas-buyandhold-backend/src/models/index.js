const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const { database } = require('../../config/environment');

// Verificar se está em ambiente de desenvolvimento
const isDevelopment = process.env.APP_ENV === 'development';

// Configuração do banco de dados
const dialectOptions = database.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {};

const sequelize = new Sequelize(
  database.name,
  database.username,
  database.password,
  {
    host: database.host,
    port: database.port,
    dialect: database.dialect,
    dialectOptions,
    pool: database.pool,
    timezone: database.timezone,
    logging: isDevelopment ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Import models
const User = require('./User')(sequelize, DataTypes);
const Portfolio = require('./Portfolio')(sequelize, DataTypes);
const Asset = require('./Asset')(sequelize, DataTypes);
const Subscription = require('./Subscription')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const PaymentTransaction = require('./PaymentTransaction')(sequelize, DataTypes);
const WebhookEventLog = require('./WebhookEventLog')(sequelize, DataTypes);

// Define associations
User.hasMany(Portfolio, { foreignKey: 'userId', as: 'portfolios' });
Portfolio.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Portfolio.hasMany(Asset, { foreignKey: 'portfolioId', as: 'assets' });
Asset.belongsTo(Portfolio, { foreignKey: 'portfolioId', as: 'portfolio' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Associações para PaymentTransaction
User.hasMany(PaymentTransaction, { foreignKey: 'userId', as: 'paymentTransactions' });
PaymentTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Subscription.hasMany(PaymentTransaction, { foreignKey: 'subscriptionId', as: 'transactions' });
PaymentTransaction.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

module.exports = {
  sequelize,
  User,
  Portfolio,
  Asset,
  Subscription,
  Payment,
  PaymentTransaction,
  WebhookEventLog
};