'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WebhookEventLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      eventType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'hotmart'
      },
      hotmartTransactionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hotmartSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('received', 'processing', 'processed', 'failed', 'ignored'),
        allowNull: false,
        defaultValue: 'received'
      },
      httpMethod: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'POST'
      },
      httpStatusCode: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requestHeaders: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      requestBody: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      responseBody: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      processingTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Processing time in milliseconds'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      errorStack: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastRetryAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('WebhookEventLogs', ['eventId']);
    await queryInterface.addIndex('WebhookEventLogs', ['eventType']);
    await queryInterface.addIndex('WebhookEventLogs', ['source']);
    await queryInterface.addIndex('WebhookEventLogs', ['hotmartTransactionId']);
    await queryInterface.addIndex('WebhookEventLogs', ['hotmartSubscriptionId']);
    await queryInterface.addIndex('WebhookEventLogs', ['status']);
    await queryInterface.addIndex('WebhookEventLogs', ['createdAt']);
    await queryInterface.addIndex('WebhookEventLogs', ['processedAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WebhookEventLogs');
  }
};
