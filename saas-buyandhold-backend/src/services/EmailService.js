const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { email: emailConfig } = require('../../config/environment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configuração para Gmail usando variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verificar conexão
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Erro na configuração do email:', error);
      } else {
        logger.info('Servidor de email configurado com sucesso');
      }
    });
  }

  async sendContactMessage(data) {
    const { name, email, subject, message, priority } = data;
    
    const priorityEmoji = {
      low: '🟢',
      normal: '🟡',
      high: '🔴',
      urgent: '🚨'
    };

    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: `${priorityEmoji[priority]} Contato - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nova mensagem de contato</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Informações do remetente:</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Prioridade:</strong> ${priorityEmoji[priority]} ${priority.toUpperCase()}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0;">Assunto:</h3>
            <p style="font-weight: bold;">${subject}</p>
            
            <h3>Mensagem:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Responder para:</strong> ${email}
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email de contato enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Erro ao enviar email de contato:', error);
      throw error;
    }
  }

  async sendBugReport(data) {
    const { name, email, bugType, severity, title, description, stepsToReproduce, expectedBehavior, actualBehavior, browser, device } = data;
    
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
      critical: '🚨'
    };

    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: `${severityEmoji[severity]} Bug Report - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🐛 Relatório de Bug</h2>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Informações do usuário:</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes do Bug:</h3>
            <p><strong>Tipo:</strong> ${bugType}</p>
            <p><strong>Severidade:</strong> ${severityEmoji[severity]} ${severity.toUpperCase()}</p>
            <p><strong>Título:</strong> ${title}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Descrição:</h3>
            <p style="white-space: pre-wrap;">${description}</p>
            
            <h3>Passos para reproduzir:</h3>
            <p style="white-space: pre-wrap;">${stepsToReproduce}</p>
            
            <h3>Comportamento esperado:</h3>
            <p style="white-space: pre-wrap;">${expectedBehavior}</p>
            
            <h3>Comportamento atual:</h3>
            <p style="white-space: pre-wrap;">${actualBehavior}</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0;">Ambiente:</h3>
            <p><strong>Navegador:</strong> ${browser}</p>
            <p><strong>Dispositivo:</strong> ${device}</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email de bug report enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Erro ao enviar email de bug report:', error);
      throw error;
    }
  }

  async sendFeatureSuggestion(data) {
    const { name, email, category, priority, title, description, useCase, benefits, targetUsers } = data;
    
    const priorityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };

    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: `${priorityEmoji[priority]} Sugestão de Funcionalidade - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">💡 Sugestão de Funcionalidade</h2>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Informações do usuário:</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes da Sugestão:</h3>
            <p><strong>Categoria:</strong> ${category}</p>
            <p><strong>Prioridade:</strong> ${priorityEmoji[priority]} ${priority.toUpperCase()}</p>
            <p><strong>Título:</strong> ${title}</p>
            <p><strong>Usuários alvo:</strong> ${targetUsers}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Descrição:</h3>
            <p style="white-space: pre-wrap;">${description}</p>
            
            <h3>Caso de uso:</h3>
            <p style="white-space: pre-wrap;">${useCase}</p>
            
            <h3>Benefícios:</h3>
            <p style="white-space: pre-wrap;">${benefits}</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email de sugestão de funcionalidade enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Erro ao enviar email de sugestão:', error);
      throw error;
    }
  }

  /**
   * Enviar email de reset de senha
   * @param {Object} data - Dados do usuário e token
   * @param {string} data.email - Email do usuário
   * @param {string} data.name - Nome do usuário
   * @param {string} data.resetToken - Token de reset
   */
  async sendPasswordResetEmail(data) {
    const { email, name, resetToken } = data;
    
    // URL para reset de senha (ajustar conforme necessário)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: '🔐 Redefinição de Senha - Buy & Hold',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🔐 Redefinição de Senha</h1>
            <p style="color: #64748b; margin: 10px 0 0 0;">Buy & Hold Platform</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta. Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">⚠️ Importante:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Este link é válido por apenas <strong>1 hora</strong></li>
              <li>Se você não solicitou esta redefinição, ignore este email</li>
              <li>Sua senha atual permanecerá inalterada até que você crie uma nova</li>
            </ul>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">Não consegue clicar no botão?</h3>
            <p style="color: #64748b; margin: 0;">Copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #2563eb; margin: 10px 0 0 0;">${resetUrl}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">Este email foi enviado automaticamente. Não responda a este email.</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0 0;">© 2024 Buy & Hold Platform. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email de reset de senha enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Erro ao enviar email de reset de senha:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();