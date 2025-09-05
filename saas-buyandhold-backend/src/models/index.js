const { Sequelize } = require('sequelize');
const path = require('path');
const { database } = require('../../config/environment');

// Verificar se está em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Configuração do banco de dados
const sequelize = new Sequelize(
  database.name,
  database.username,
  database.password,
  {
    host: database.host,
    port: database.port,
    dialect: database.dialect,
    dialectOptions: {
      ssl: database.ssl
    },
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
const User = require('./User')(sequelize);
const Portfolio = require('./Portfolio')(sequelize);
const Asset = require('./Asset')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Payment = require('./Payment')(sequelize);

// Define associations
User.hasMany(Portfolio, { foreignKey: 'userId', as: 'portfolios' });
Portfolio.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Portfolio.hasMany(Asset, { foreignKey: 'portfolioId', as: 'assets' });
Asset.belongsTo(Portfolio, { foreignKey: 'portfolioId', as: 'portfolio' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Portfolio,
  Asset,
  Subscription,
  Payment
};