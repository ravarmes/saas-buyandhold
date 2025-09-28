const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // ID do pagamento no provedor (Asaas, Mercado Pago, etc.)
    paymentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // Valor do pagamento
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Descrição do pagamento
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Status do pagamento
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'expired', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    // Método de pagamento
    paymentMethod: {
      type: DataTypes.ENUM('pix', 'credit_card', 'boleto'),
      allowNull: false
    },
    // Provedor do pagamento
    provider: {
      type: DataTypes.ENUM('asaas', 'mercadopago', 'pagseguro'),
      allowNull: false
    },
    // Dados específicos do provedor
    providerData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Dados específicos do provedor (QR code, links, etc.)'
    },
    // QR Code para PIX
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL do QR Code PIX'
    },
    // QR Code em Base64
    qrCodeBase64: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'QR Code PIX em formato Base64'
    },
    // Código PIX copia e cola
    pixCopyPaste: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Código PIX para copiar e colar'
    },
    // Status detalhado do Mercado Pago
    statusDetail: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Status detalhado do pagamento no Mercado Pago'
    },
    // Data de aprovação do pagamento
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Data de expiração do pagamento
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Moeda
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'BRL'
    },
    // Referência externa (para identificar o tipo de pagamento)
    externalReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Dados do webhook (para auditoria)
    webhookData: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // Instance methods
  Payment.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  Payment.prototype.isPending = function() {
    return this.status === 'pending';
  };

  Payment.prototype.isExpired = function() {
    if (this.status === 'expired') return true;
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  };

  Payment.prototype.approve = function() {
    this.status = 'approved';
    this.approvedAt = new Date();
    return this.save();
  };

  Payment.prototype.reject = function() {
    this.status = 'rejected';
    return this.save();
  };

  Payment.prototype.cancel = function() {
    this.status = 'cancelled';
    return this.save();
  };

  Payment.prototype.expire = function() {
    this.status = 'expired';
    return this.save();
  };

  Payment.prototype.refund = function() {
    this.status = 'refunded';
    return this.save();
  };

  return Payment;
};