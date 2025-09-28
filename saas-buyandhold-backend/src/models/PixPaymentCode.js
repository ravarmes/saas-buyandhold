const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PixPaymentCode = sequelize.define('PixPaymentCode', {
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
      comment: 'ID do usuário que solicitou o pagamento'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      comment: 'Email do usuário para envio do código'
    },
    accessCode: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true,
      comment: 'Código de acesso de 8 dígitos'
    },
    pixCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Código PIX Copia e Cola'
    },
    qrCodeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dados do QR Code em base64'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 15.00,
      validate: {
        min: 0
      },
      comment: 'Valor do pagamento'
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid_pending_confirmation', 'confirmed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status do pagamento PIX'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pix',
      comment: 'Método de pagamento'
    },
    planType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'premium',
      comment: 'Tipo de plano adquirido'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Data de expiração do código PIX (24h)'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data em que o usuário informou o pagamento'
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de confirmação do pagamento pelo admin'
    },
    codeUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data em que o código foi usado para ativar a assinatura'
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações do administrador'
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Subscriptions',
        key: 'id'
      },
      comment: 'ID da assinatura criada após confirmação'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['accessCode']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  // Instance methods
  PixPaymentCode.prototype.isExpired = function() {
    return new Date() > new Date(this.expiresAt);
  };

  PixPaymentCode.prototype.isPending = function() {
    return this.status === 'pending' && !this.isExpired();
  };

  PixPaymentCode.prototype.canBeUsed = function() {
    return this.status === 'confirmed' && !this.codeUsedAt;
  };

  PixPaymentCode.prototype.markAsPaid = function() {
    this.status = 'paid_pending_confirmation';
    this.paidAt = new Date();
    return this.save();
  };

  PixPaymentCode.prototype.confirm = function(adminNotes = null) {
    this.status = 'confirmed';
    this.confirmedAt = new Date();
    if (adminNotes) {
      this.adminNotes = adminNotes;
    }
    return this.save();
  };

  PixPaymentCode.prototype.useCode = function(subscriptionId) {
    this.codeUsedAt = new Date();
    this.subscriptionId = subscriptionId;
    return this.save();
  };

  PixPaymentCode.prototype.cancel = function(reason = null) {
    this.status = 'cancelled';
    if (reason) {
      this.adminNotes = reason;
    }
    return this.save();
  };

  PixPaymentCode.prototype.expire = function() {
    if (this.status === 'pending') {
      this.status = 'expired';
      return this.save();
    }
    return Promise.resolve(this);
  };

  // Static methods
  PixPaymentCode.generateAccessCode = function() {
    // Gerar código de 8 dígitos
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  PixPaymentCode.generatePixCode = function(amount, accessCode) {
    // Simulação de código PIX - em produção, integrar com API do banco
    const pixKey = process.env.PIX_KEY || 'contato@buyandhold.com.br';
    const merchantName = 'BUY AND HOLD';
    const merchantCity = 'SAO PAULO';
    const txId = accessCode;
    
    // Formato simplificado do PIX (em produção usar biblioteca específica)
    return `00020126580014BR.GOV.BCB.PIX0136${pixKey}0208${txId}5204000053039865802BR5913${merchantName}6009${merchantCity}62070503***6304`;
  };

  return PixPaymentCode;
};