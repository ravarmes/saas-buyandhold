const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    planType: {
      type: DataTypes.ENUM('premium'),
      allowNull: false,
      defaultValue: 'premium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'cancelled', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('pix', 'credit_card', 'pix_mercadopago', 'pix_dev', 'credit_card_mercadopago', 'credit_card_dev'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 9.99
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'BRL'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID do pagamento no gateway (PIX ou cartão)'
    },
    paymentData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Dados adicionais do pagamento (QR code PIX, etc.)'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    timestamps: true
  });

  // Instance methods
  Subscription.prototype.isActive = function() {
    if (this.status !== 'active') return false;
    if (!this.endDate) return false;
    return new Date() <= new Date(this.endDate);
  };

  Subscription.prototype.isExpired = function() {
    if (!this.endDate) return false;
    return new Date() > new Date(this.endDate);
  };

  Subscription.prototype.activate = function() {
    this.status = 'active';
    this.startDate = new Date();
    this.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    return this.save();
  };

  Subscription.prototype.cancel = function() {
    this.status = 'cancelled';
    return this.save();
  };

  Subscription.prototype.expire = function() {
    this.status = 'expired';
    return this.save();
  };

  return Subscription;
};