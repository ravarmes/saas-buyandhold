const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'ID do usuário que realizou a transação'
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Subscriptions',
        key: 'id'
      },
      comment: 'Referência para a assinatura relacionada'
    },
    hotmartTransactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'ID único da transação na Hotmart'
    },
    hotmartSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID da assinatura na Hotmart (para pagamentos recorrentes)'
    },
    eventType: {
      type: DataTypes.ENUM(
        'PURCHASE_COMPLETE',
        'PURCHASE_APPROVED', 
        'PURCHASE_PENDING',
        'PURCHASE_CANCELLED',
        'PURCHASE_REFUNDED',
        'PURCHASE_CHARGEBACK',
        'PURCHASE_EXPIRED',
        'PURCHASE_DELAYED',
        'SUBSCRIPTION_CANCELLATION',
        'SUBSCRIPTION_PLAN_CHANGE',
        'SUBSCRIPTION_BILLING_DATE_UPDATE'
      ),
      allowNull: false,
      comment: 'Tipo de evento recebido da Hotmart'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'cancelled', 'refunded', 'expired', 'chargeback'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status atual da transação'
    },
    paymentMethod: {
      type: DataTypes.ENUM('pix', 'credit_card', 'boleto', 'paypal', 'other'),
      allowNull: false,
      comment: 'Método de pagamento utilizado'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Valor da transação'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'BRL',
      comment: 'Moeda da transação'
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID do produto na Hotmart'
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nome do produto'
    },
    buyerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      comment: 'Email do comprador'
    },
    buyerName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nome do comprador'
    },
    buyerDocument: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Documento do comprador (CPF/CNPJ)'
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Data da transação'
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de aprovação do pagamento'
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de início da assinatura (para recorrentes)'
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de fim da assinatura (para recorrentes)'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica se é um pagamento recorrente'
    },
    rawPayload: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Payload completo recebido da Hotmart para auditoria'
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de processamento da transação'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações adicionais'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['hotmartTransactionId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['eventType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['buyerEmail']
      },
      {
        fields: ['transactionDate']
      },
      {
        fields: ['hotmartSubscriptionId']
      }
    ]
  });

  // Instance methods
  PaymentTransaction.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  PaymentTransaction.prototype.isActive = function() {
    return ['approved'].includes(this.status);
  };

  PaymentTransaction.prototype.approve = function() {
    this.status = 'approved';
    this.approvalDate = new Date();
    this.processedAt = new Date();
    return this.save();
  };

  PaymentTransaction.prototype.cancel = function() {
    this.status = 'cancelled';
    this.processedAt = new Date();
    return this.save();
  };

  PaymentTransaction.prototype.refund = function() {
    this.status = 'refunded';
    this.processedAt = new Date();
    return this.save();
  };

  PaymentTransaction.prototype.chargeback = function() {
    this.status = 'chargeback';
    this.processedAt = new Date();
    return this.save();
  };

  return PaymentTransaction;
};