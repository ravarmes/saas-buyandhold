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
      type: DataTypes.ENUM('pix', 'credit_card', 'pix_mercadopago', 'pix_dev', 'credit_card_mercadopago', 'credit_card_dev', 'hotmart', 'boleto', 'paypal'),
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
    },
    hotmartSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID da assinatura na Hotmart (para recorrentes)'
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Início do período atual da assinatura'
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fim do período atual da assinatura'
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data do último pagamento aprovado'
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data da próxima cobrança (para recorrentes)'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica se é uma assinatura recorrente'
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

  Subscription.prototype.isActiveForCurrentMonth = function() {
    if (this.status !== 'active') return false;
    
    // Usar timezone do Brasil (UTC-3)
    const now = new Date();
    const brazilOffset = -3 * 60; // UTC-3 em minutos
    const brazilTime = new Date(now.getTime() + (brazilOffset * 60 * 1000));
    
    const currentYear = brazilTime.getFullYear();
    const currentMonth = brazilTime.getMonth();
    
    // Verificar se há pagamento válido para o mês atual
    if (this.currentPeriodStart && this.currentPeriodEnd) {
      const periodStart = new Date(this.currentPeriodStart);
      const periodEnd = new Date(this.currentPeriodEnd);
      
      return brazilTime >= periodStart && brazilTime <= periodEnd;
    }
    
    // Fallback para verificação baseada em endDate
    if (this.endDate) {
      return brazilTime <= new Date(this.endDate);
    }
    
    return false;
  };

  Subscription.prototype.activate = function() {
    this.status = 'active';
    this.startDate = new Date();
    this.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    return this.save();
  };

  Subscription.prototype.activateForCurrentMonth = function(paymentDate = null) {
    const now = paymentDate ? new Date(paymentDate) : new Date();
    
    // Usar timezone do Brasil (UTC-3)
    const brazilOffset = -3 * 60;
    const brazilTime = new Date(now.getTime() + (brazilOffset * 60 * 1000));
    
    // Definir período atual (mês completo)
    const currentYear = brazilTime.getFullYear();
    const currentMonth = brazilTime.getMonth();
    
    const periodStart = new Date(currentYear, currentMonth, 1);
    const periodEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    this.status = 'active';
    this.startDate = this.startDate || now;
    this.currentPeriodStart = periodStart;
    this.currentPeriodEnd = periodEnd;
    this.lastPaymentDate = now;
    
    // Para assinaturas recorrentes, definir próxima cobrança
    if (this.isRecurring) {
      this.nextBillingDate = new Date(currentYear, currentMonth + 1, brazilTime.getDate());
    }
    
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

  Subscription.prototype.updateFromHotmartPayment = function(transactionData) {
    this.lastPaymentDate = transactionData.approvalDate || new Date();
    
    if (transactionData.hotmartSubscriptionId) {
      this.hotmartSubscriptionId = transactionData.hotmartSubscriptionId;
      this.isRecurring = true;
    }
    
    if (transactionData.subscriptionStartDate) {
      this.currentPeriodStart = new Date(transactionData.subscriptionStartDate);
    }
    
    if (transactionData.subscriptionEndDate) {
      this.currentPeriodEnd = new Date(transactionData.subscriptionEndDate);
    }
    
    return this.activateForCurrentMonth(this.lastPaymentDate);
  };

  return Subscription;
};