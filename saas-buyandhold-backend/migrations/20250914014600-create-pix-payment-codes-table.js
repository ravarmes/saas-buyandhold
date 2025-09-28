'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PixPaymentCode', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
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
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accessCode: {
        type: Sequelize.STRING(8),
        allowNull: false,
        unique: true
      },
      pixCode: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      qrCodeData: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 15.00
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid_pending_confirmation', 'confirmed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pix'
      },
      planType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'premium'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      confirmedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      codeUsedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar índices
    await queryInterface.addIndex('PixPaymentCode', ['accessCode'], {
      unique: true,
      name: 'pix_payment_codes_access_code_unique'
    });

    await queryInterface.addIndex('PixPaymentCode', ['userId'], {
      name: 'pix_payment_codes_user_id_index'
    });

    await queryInterface.addIndex('PixPaymentCode', ['email'], {
      name: 'pix_payment_codes_email_index'
    });

    await queryInterface.addIndex('PixPaymentCode', ['status'], {
      name: 'pix_payment_codes_status_index'
    });

    await queryInterface.addIndex('PixPaymentCode', ['expiresAt'], {
      name: 'pix_payment_codes_expires_at_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PixPaymentCode');
  }
};