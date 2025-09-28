const QRCode = require('qrcode');
const { PixPaymentCode, User, Subscription } = require('../models');
const logger = require('../utils/logger');
const EmailService = require('./EmailService');

class PixPaymentService {
  constructor() {
    this.pixKey = process.env.PIX_KEY || 'contato@buyandhold.com.br';
    this.merchantName = 'BUY AND HOLD';
    this.merchantCity = 'SAO PAULO';
    this.defaultAmount = 15.00;
  }

  /**
   * Gerar código PIX e QR Code para pagamento
   * @param {Object} data - Dados do pagamento
   * @param {string} data.userId - ID do usuário
   * @param {string} data.email - Email do usuário
   * @param {number} data.amount - Valor do pagamento (opcional, padrão 15.00)
   * @returns {Object} Dados do pagamento PIX
   */
  async generatePixPayment(data) {
    try {
      const { userId, email, amount = this.defaultAmount } = data;

      // Verificar se o usuário existe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se já existe um código PIX pendente para este usuário
      const existingCode = await PixPaymentCode.findOne({
        where: {
          userId,
          status: ['pending', 'paid_pending_confirmation']
        }
      });

      if (existingCode && !existingCode.isExpired()) {
        throw new Error('Já existe um pagamento PIX pendente para este usuário');
      }

      // Gerar código de acesso único
      let accessCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        accessCode = PixPaymentCode.generateAccessCode();
        const existing = await PixPaymentCode.findOne({ where: { accessCode } });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Não foi possível gerar um código único. Tente novamente.');
      }

      // Gerar código PIX
      const pixCode = this.generatePixCode(amount, accessCode);

      // Gerar QR Code
      const qrCodeData = await this.generateQRCode(pixCode);

      // Data de expiração (24 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Criar registro no banco
      const pixPayment = await PixPaymentCode.create({
        userId,
        email,
        accessCode,
        pixCode,
        qrCodeData,
        amount,
        expiresAt,
        status: 'pending',
        paymentMethod: 'pix',
        planType: 'premium'
      });

      logger.info(`Código PIX gerado para usuário ${userId}: ${accessCode}`);

      return {
        id: pixPayment.id,
        accessCode,
        pixCode,
        qrCodeData,
        amount,
        expiresAt,
        status: 'pending'
      };

    } catch (error) {
      logger.error('Erro ao gerar pagamento PIX:', error);
      throw error;
    }
  }

  /**
   * Gerar código PIX Copia e Cola
   * @param {number} amount - Valor do pagamento
   * @param {string} accessCode - Código de acesso
   * @returns {string} Código PIX
   */
  generatePixCode(amount, accessCode) {
    // Implementação simplificada do PIX
    // Em produção, usar biblioteca específica como 'pix-utils' ou similar
    
    const formattedAmount = amount.toFixed(2);
    const txId = accessCode.substring(0, 25); // Máximo 25 caracteres
    
    // Estrutura básica do PIX EMV
    const payload = {
      '00': '01', // Payload Format Indicator
      '01': '12', // Point of Initiation Method (12 = static)
      '26': {
        '00': 'BR.GOV.BCB.PIX',
        '01': this.pixKey,
        '02': txId
      },
      '52': '0000', // Merchant Category Code
      '53': '986', // Transaction Currency (986 = BRL)
      '54': formattedAmount,
      '58': 'BR',
      '59': this.merchantName.substring(0, 25),
      '60': this.merchantCity.substring(0, 15),
      '62': {
        '05': txId
      }
    };

    // Construir string PIX (implementação simplificada)
    let pixString = '';
    
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (typeof value === 'object') {
        let subString = '';
        Object.keys(value).forEach(subKey => {
          const subValue = value[subKey];
          subString += subKey.padStart(2, '0') + subValue.length.toString().padStart(2, '0') + subValue;
        });
        pixString += key + subString.length.toString().padStart(2, '0') + subString;
      } else {
        pixString += key + value.length.toString().padStart(2, '0') + value;
      }
    });

    // Adicionar CRC16 (implementação simplificada)
    pixString += '6304';
    const crc = this.calculateCRC16(pixString);
    pixString += crc;

    return pixString;
  }

  /**
   * Calcular CRC16 para código PIX (implementação simplificada)
   * @param {string} data - Dados para calcular CRC
   * @returns {string} CRC16 em hexadecimal
   */
  calculateCRC16(data) {
    // Implementação simplificada - em produção usar biblioteca específica
    let crc = 0xFFFF;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Gerar QR Code a partir do código PIX
   * @param {string} pixCode - Código PIX
   * @returns {string} QR Code em base64
   */
  async generateQRCode(pixCode) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(pixCode, {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeDataURL;
    } catch (error) {
      logger.error('Erro ao gerar QR Code:', error);
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Marcar pagamento como pago pelo usuário
   * @param {string} accessCode - Código de acesso
   * @returns {Object} Dados atualizados do pagamento
   */
  async markAsPaid(accessCode) {
    try {
      const pixPayment = await PixPaymentCode.findOne({
        where: { accessCode },
        include: [{ model: User, as: 'user' }]
      });

      if (!pixPayment) {
        throw new Error('Código de pagamento não encontrado');
      }

      if (pixPayment.isExpired()) {
        throw new Error('Código de pagamento expirado');
      }

      if (pixPayment.status !== 'pending') {
        throw new Error('Pagamento já foi processado');
      }

      await pixPayment.markAsPaid();

      logger.info(`Pagamento marcado como pago: ${accessCode}`);

      return {
        id: pixPayment.id,
        accessCode: pixPayment.accessCode,
        status: pixPayment.status,
        paidAt: pixPayment.paidAt
      };

    } catch (error) {
      logger.error('Erro ao marcar pagamento como pago:', error);
      throw error;
    }
  }

  /**
   * Confirmar pagamento pelo administrador
   * @param {string} accessCode - Código de acesso
   * @param {string} adminNotes - Observações do admin (opcional)
   * @returns {Object} Dados da assinatura criada
   */
  async confirmPayment(accessCode, adminNotes = null) {
    try {
      const pixPayment = await PixPaymentCode.findOne({
        where: { accessCode },
        include: [{ model: User, as: 'user' }]
      });

      if (!pixPayment) {
        throw new Error('Código de pagamento não encontrado');
      }

      if (pixPayment.status !== 'paid_pending_confirmation') {
        throw new Error('Pagamento não está aguardando confirmação');
      }

      // Confirmar pagamento
      await pixPayment.confirm(adminNotes);

      // Criar ou ativar assinatura IMEDIATAMENTE
      const subscription = await this.createOrActivateSubscription(pixPayment);

      // Marcar código como usado
      await pixPayment.useCode(subscription.id);

      // Enviar email de CONFIRMAÇÃO (não código de acesso)
      await this.sendConfirmationEmail(pixPayment);

      logger.info(`Pagamento confirmado e assinatura ativada IMEDIATAMENTE: ${accessCode}`);

      return {
        pixPayment: {
          id: pixPayment.id,
          accessCode: pixPayment.accessCode,
          status: pixPayment.status,
          confirmedAt: pixPayment.confirmedAt
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      };

    } catch (error) {
      logger.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  /**
   * Validar e usar código de acesso
   * @param {string} accessCode - Código de acesso
   * @param {string} userId - ID do usuário (opcional, para validação)
   * @returns {Object} Dados da assinatura ativada
   */
  async validateAndUseAccessCode(accessCode, userId = null) {
    try {
      const whereClause = { accessCode };
      if (userId) {
        whereClause.userId = userId;
      }

      const pixPayment = await PixPaymentCode.findOne({
        where: whereClause,
        include: [{ model: User, as: 'user' }]
      });

      if (!pixPayment) {
        throw new Error('Código de acesso inválido');
      }

      if (!pixPayment.canBeUsed()) {
        throw new Error('Código de acesso não pode ser usado');
      }

      // Se ainda não foi usado, criar/ativar assinatura
      if (!pixPayment.subscriptionId) {
        const subscription = await this.createOrActivateSubscription(pixPayment);
        await pixPayment.useCode(subscription.id);
        
        return {
          success: true,
          message: 'Assinatura ativada com sucesso!',
          subscription: {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          }
        };
      }

      // Se já foi usado, retornar dados da assinatura existente
      const subscription = await Subscription.findByPk(pixPayment.subscriptionId);
      
      return {
        success: true,
        message: 'Código já foi utilizado',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      };

    } catch (error) {
      logger.error('Erro ao validar código de acesso:', error);
      throw error;
    }
  }

  /**
   * Criar ou ativar assinatura premium
   * @param {Object} pixPayment - Dados do pagamento PIX
   * @returns {Object} Assinatura criada/ativada
   */
  async createOrActivateSubscription(pixPayment) {
    try {
      // Verificar se já existe uma assinatura ativa
      let subscription = await Subscription.findOne({
        where: {
          userId: pixPayment.userId,
          status: 'active'
        }
      });

      if (subscription && subscription.isActive()) {
        // Estender assinatura existente
        const currentEnd = new Date(subscription.endDate);
        const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias
        
        subscription.endDate = newEnd;
        subscription.lastPaymentDate = new Date();
        await subscription.save();
        
        logger.info(`Assinatura estendida para usuário ${pixPayment.userId}`);
      } else {
        // Criar nova assinatura ou reativar
        if (subscription) {
          await subscription.activate();
        } else {
          subscription = await Subscription.create({
            userId: pixPayment.userId,
            planType: 'premium',
            status: 'active',
            paymentMethod: 'pix',
            amount: pixPayment.amount,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            lastPaymentDate: new Date()
          });
        }
        
        logger.info(`Nova assinatura criada para usuário ${pixPayment.userId}`);
      }

      // Atualizar status do usuário
      await User.update(
        { 
          planType: 'premium',
          subscriptionStatus: 'active'
        },
        { where: { id: pixPayment.userId } }
      );

      return subscription;

    } catch (error) {
      logger.error('Erro ao criar/ativar assinatura:', error);
      throw error;
    }
  }

  /**
   * Enviar email de confirmação de ativação (usando template existente)
   * @param {Object} pixPayment - Dados do pagamento PIX
   */
  async sendConfirmationEmail(pixPayment) {
    try {
      const emailData = {
        email: pixPayment.email,
        name: pixPayment.user.name,
        // Usar o template existente mas como confirmação, não código de acesso
        resetToken: null, // Não é reset de senha
        accessCode: null, // Não precisa de código - acesso já liberado
        isAccessCode: false, // Flag para usar como confirmação
        isConfirmation: true // Nova flag para identificar email de confirmação
      };

      await EmailService.sendPasswordResetEmail(emailData);
      
      logger.info(`Email de confirmação de ativação enviado para: ${pixPayment.email}`);

    } catch (error) {
      logger.error('Erro ao enviar email de confirmação:', error);
      // Não propagar o erro para não interromper o fluxo principal
    }
  }

  /**
   * Listar pagamentos PIX para administração
   * @param {Object} filters - Filtros de busca
   * @returns {Array} Lista de pagamentos
   */
  async listPayments(filters = {}) {
    try {
      const { status, limit = 50, offset = 0 } = filters;
      
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const payments = await PixPaymentCode.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: Subscription, as: 'subscription', required: false }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        payments: payments.rows,
        total: payments.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

    } catch (error) {
      logger.error('Erro ao listar pagamentos PIX:', error);
      throw error;
    }
  }

  /**
   * Expirar códigos PIX antigos (executar via cron job)
   */
  async expireOldCodes() {
    try {
      const expiredCodes = await PixPaymentCode.findAll({
        where: {
          status: 'pending',
          expiresAt: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      });

      for (const code of expiredCodes) {
        await code.expire();
      }

      logger.info(`${expiredCodes.length} códigos PIX expirados`);

      return expiredCodes.length;

    } catch (error) {
      logger.error('Erro ao expirar códigos PIX:', error);
      throw error;
    }
  }
}

module.exports = new PixPaymentService();