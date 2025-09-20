const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WebhookEventLog = sequelize.define('WebhookEventLog', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'ID único do evento para garantir idempotência'
    },
    source: {
      type: DataTypes.ENUM('hotmart', 'mercadopago', 'asaas', 'other'),
      allowNull: false,
      defaultValue: 'hotmart',
      comment: 'Origem do webhook'
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tipo do evento recebido'
    },
    status: {
      type: DataTypes.ENUM('received', 'processing', 'processed', 'failed', 'ignored'),
      allowNull: false,
      defaultValue: 'received',
      comment: 'Status do processamento do evento'
    },
    httpMethod: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'POST',
      comment: 'Método HTTP da requisição'
    },
    headers: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Headers da requisição HTTP'
    },
    rawPayload: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Payload completo recebido no webhook'
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Assinatura HMAC recebida no header'
    },
    signatureValid: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Indica se a assinatura foi validada com sucesso'
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User-Agent da requisição'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Endereço IP de origem da requisição'
    },
    processingStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp do início do processamento'
    },
    processingCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp da conclusão do processamento'
    },
    processingDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duração do processamento em milissegundos'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mensagem de erro caso o processamento falhe'
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Stack trace do erro'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Número de tentativas de processamento'
    },
    lastRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp da última tentativa'
    },
    relatedTransactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID da transação relacionada (se processada)'
    },
    relatedUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID do usuário relacionado (se identificado)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações adicionais sobre o processamento'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['eventId']
      },
      {
        fields: ['source']
      },
      {
        fields: ['eventType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['relatedTransactionId']
      },
      {
        fields: ['relatedUserId']
      },
      {
        fields: ['ipAddress']
      }
    ]
  });

  // Instance methods
  WebhookEventLog.prototype.markAsProcessing = function() {
    this.status = 'processing';
    this.processingStartedAt = new Date();
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    return this.save();
  };

  WebhookEventLog.prototype.markAsProcessed = function(transactionId = null, userId = null) {
    this.status = 'processed';
    this.processingCompletedAt = new Date();
    if (this.processingStartedAt) {
      this.processingDuration = new Date() - this.processingStartedAt;
    }
    if (transactionId) {
      this.relatedTransactionId = transactionId;
    }
    if (userId) {
      this.relatedUserId = userId;
    }
    return this.save();
  };

  WebhookEventLog.prototype.markAsFailed = function(error) {
    this.status = 'failed';
    this.processingCompletedAt = new Date();
    if (this.processingStartedAt) {
      this.processingDuration = new Date() - this.processingStartedAt;
    }
    if (error) {
      this.errorMessage = error.message || error.toString();
      this.errorStack = error.stack;
    }
    return this.save();
  };

  WebhookEventLog.prototype.markAsIgnored = function(reason = null) {
    this.status = 'ignored';
    this.processingCompletedAt = new Date();
    if (reason) {
      this.notes = reason;
    }
    return this.save();
  };

  WebhookEventLog.prototype.canRetry = function(maxRetries = 5) {
    return this.retryCount < maxRetries && this.status === 'failed';
  };

  // Static methods
  WebhookEventLog.isDuplicate = async function(eventId) {
    const existing = await this.findOne({ where: { eventId } });
    return !!existing;
  };

  WebhookEventLog.getProcessingStats = async function(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [sequelize.Op.gte]: since
        }
      },
      group: ['status'],
      raw: true
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  };

  return WebhookEventLog;
};