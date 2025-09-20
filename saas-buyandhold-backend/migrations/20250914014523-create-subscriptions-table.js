'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subscriptions', {
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
      hotmartTransactionId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      hotmartSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      productId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      planType: {
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      status: {
        type: Sequelize.ENUM('active', 'cancelled', 'expired', 'refunded'),
        allowNull: false,
        defaultValue: 'active'
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
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextBillingDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.addIndex('Subscriptions', ['userId']);
    await queryInterface.addIndex('Subscriptions', ['hotmartTransactionId']);
    await queryInterface.addIndex('Subscriptions', ['hotmartSubscriptionId']);
    await queryInterface.addIndex('Subscriptions', ['status']);
    await queryInterface.addIndex('Subscriptions', ['isActive']);
    await queryInterface.addIndex('Subscriptions', ['startDate']);
    await queryInterface.addIndex('Subscriptions', ['endDate']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subscriptions');
  }
};
