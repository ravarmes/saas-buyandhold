'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentTransactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscriptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Subscriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      hotmartTransactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      hotmartSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transactionType: {
        type: Sequelize.ENUM('purchase', 'refund', 'chargeback', 'cancellation'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('approved', 'cancelled', 'refunded', 'chargeback', 'pending'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'BRL'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      productId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      buyerEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      buyerName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      buyerDocument: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transactionDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      webhookData: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex('PaymentTransactions', ['userId']);
    await queryInterface.addIndex('PaymentTransactions', ['subscriptionId']);
    await queryInterface.addIndex('PaymentTransactions', ['hotmartTransactionId']);
    await queryInterface.addIndex('PaymentTransactions', ['hotmartSubscriptionId']);
    await queryInterface.addIndex('PaymentTransactions', ['transactionType']);
    await queryInterface.addIndex('PaymentTransactions', ['status']);
    await queryInterface.addIndex('PaymentTransactions', ['transactionDate']);
    await queryInterface.addIndex('PaymentTransactions', ['buyerEmail']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PaymentTransactions');
  }
};
