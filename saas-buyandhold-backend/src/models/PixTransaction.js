const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PixTransaction = sequelize.define('PixTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Subscriptions',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    
    // Dados do Mercado Pago
    mercadoPagoPaymentId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'mercadoPagoPaymentId'
    },
    externalReference: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'externalReference'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'),
      allowNull: false,
      defaultValue: 'pending'
    },
    
    // Dados do PIX
    pixCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'pixCode'
    },
    qrCodeBase64: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'qrCodeBase64'
    },
    pixKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'pixKey'
    },
    
    // Dados financeiros
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'BRL'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Timestamps importantes
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expirationDate'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approvedAt'
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processedAt'
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refundedAt'
    },
    
    // Dados adicionais
    payerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payerEmail'
    },
    payerName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payerName'
    },
    payerDocument: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'payerDocument'
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'gatewayResponse'
    },
    webhookData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'webhookData'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'PixTransactions',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['mercadoPagoPaymentId']
      },
      {
        unique: true,
        fields: ['externalReference']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['subscriptionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['approvedAt']
      },
      {
        fields: ['amount']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['expirationDate']
      }
    ]
  });

  // Métodos de instância
  PixTransaction.prototype.isExpired = function() {
    if (!this.expirationDate) return false;
    return new Date() > new Date(this.expirationDate);
  };

  PixTransaction.prototype.isPending = function() {
    return this.status === 'pending';
  };

  PixTransaction.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  PixTransaction.prototype.canBeProcessed = function() {
    return this.isPending() && !this.isExpired();
  };

  PixTransaction.prototype.getFormattedAmount = function() {
    return `R$ ${parseFloat(this.amount).toFixed(2).replace('.', ',')}`;
  };

  PixTransaction.prototype.getTimeUntilExpiration = function() {
    if (!this.expirationDate) return null;
    
    const now = new Date();
    const expiration = new Date(this.expirationDate);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    
    return `${minutes}min`;
  };

  // Métodos estáticos
  PixTransaction.findByMercadoPagoId = function(mercadoPagoPaymentId) {
    return this.findOne({
      where: { mercadoPagoPaymentId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'email', 'name', 'userType']
        },
        {
          model: sequelize.models.Subscription,
          as: 'subscription',
          required: false
        }
      ]
    });
  };

  PixTransaction.findByExternalReference = function(externalReference) {
    return this.findOne({
      where: { externalReference },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'email', 'name', 'userType']
        }
      ]
    });
  };

  PixTransaction.findPendingByUserId = function(userId) {
    return this.findAll({
      where: { 
        userId,
        status: 'pending'
      },
      order: [['createdAt', 'DESC']]
    });
  };

  PixTransaction.findExpiredTransactions = function() {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        status: 'pending',
        expirationDate: {
          [Op.lt]: new Date()
        }
      }
    });
  };

  PixTransaction.getRevenueStats = function(startDate, endDate) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        status: 'approved',
        approvedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount']
      ],
      raw: true
    });
  };

  // Associações
  PixTransaction.associate = function(models) {
    PixTransaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    PixTransaction.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription'
    });
  };

  return PixTransaction;
};