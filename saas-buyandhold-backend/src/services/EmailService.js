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
    const { email, name, resetToken, accessCode, isAccessCode = false, isConfirmation = false } = data;
    
    // Determinar o tipo de email
    const isPasswordReset = !isAccessCode && !isConfirmation && resetToken;
    const isAccessCodeEmail = isAccessCode && accessCode;
    const isConfirmationEmail = isConfirmation;
    
    if (!isPasswordReset && !isAccessCodeEmail && !isConfirmationEmail) {
      throw new Error('Dados insuficientes: é necessário resetToken para reset de senha, accessCode para código de acesso, ou isConfirmation para confirmação');
    }
    
    // Configurar dados baseado no tipo de email
    let subject, title, message, buttonText, buttonLink, warningText, validityText;
    
    if (isPasswordReset) {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      subject = '🔐 Redefinição de Senha - Buy & Hold';
      title = '🔐 Redefinição de Senha';
      message = 'Recebemos uma solicitação para redefinir a senha da sua conta. Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:';
      buttonText = 'Redefinir Senha';
      buttonLink = resetUrl;
      warningText = 'Se você não solicitou esta redefinição, ignore este email';
      validityText = 'Este link é válido por apenas <strong>1 hora</strong>';
    } else if (isAccessCodeEmail) {
      subject = '🎉 Seu Código de Acesso Premium - Buy & Hold';
      title = '🎉 Acesso Premium Liberado!';
      message = `Parabéns! Seu pagamento foi confirmado e seu acesso premium foi liberado. Use o código abaixo para ativar sua assinatura:`;
      buttonText = accessCode;
      buttonLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-premium?code=${accessCode}`;
      warningText = 'Guarde este código em local seguro';
      validityText = 'Este código é válido por <strong>24 horas</strong>';
    } else if (isConfirmationEmail) {
      // Email de confirmação - acesso já liberado
      subject = '🎉 Acesso Premium Ativado - Buy & Hold';
      title = '🎉 Bem-vindo ao Premium!';
      message = `Parabéns! Seu pagamento foi confirmado e seu acesso premium foi ativado com sucesso. Você já pode aproveitar todos os recursos premium da plataforma!`;
      buttonText = 'Acessar Plataforma';
      buttonLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
      warningText = 'Seu acesso premium está ativo e pronto para uso';
      validityText = 'Aproveite todos os recursos premium disponíveis';
    }
    
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${title}</h1>
            <p style="color: #64748b; margin: 10px 0 0 0;">Buy & Hold Platform</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${name || 'Usuário'}!</h2>
            <p style="color: #475569; line-height: 1.6;">${message}</p>
          </div>
          
          ${isAccessCodeEmail ? `
          <div style="background-color: #dcfce7; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #166534; margin-top: 0;">Seu Código de Acesso:</h3>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #22c55e;">
              <span style="font-size: 32px; font-weight: bold; color: #166534; letter-spacing: 4px;">${accessCode}</span>
            </div>
          </div>
          ` : ''}
          
          ${isConfirmationEmail ? `
          <div style="background-color: #dcfce7; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #166534; margin-top: 0;">🎉 Acesso Ativado!</h3>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #22c55e;">
              <span style="font-size: 18px; font-weight: bold; color: #166534;">Sua assinatura premium está ativa e pronta para uso!</span>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${buttonLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${buttonText}</a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">⚠️ Importante:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>${validityText}</li>
              <li>${warningText}</li>
              ${isPasswordReset ? '<li>Sua senha atual permanecerá inalterada até que você crie uma nova</li>' : ''}
              ${isAccessCodeEmail ? '<li>Nunca compartilhe este código com outras pessoas</li>' : ''}
              ${isConfirmationEmail ? '<li>Faça login na plataforma para acessar os recursos premium</li>' : ''}
            </ul>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">${isPasswordReset ? 'Não consegue clicar no botão?' : isConfirmationEmail ? 'Acesso direto:' : 'Link direto:'}</h3>
            <p style="color: #64748b; margin: 0;">${isPasswordReset ? 'Copie e cole este link no seu navegador:' : isConfirmationEmail ? 'Você pode acessar diretamente a plataforma:' : 'Você também pode acessar diretamente:'}</p>
            <p style="word-break: break-all; color: #2563eb; margin: 10px 0 0 0;">${buttonLink}</p>
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
      const logMessage = isPasswordReset ? 'Email de reset de senha enviado' : isConfirmationEmail ? 'Email de confirmação de ativação enviado' : 'Email com código de acesso enviado';
      logger.info(`${logMessage}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      const errorMessage = isPasswordReset ? 'Erro ao enviar email de reset de senha' : isConfirmationEmail ? 'Erro ao enviar email de confirmação' : 'Erro ao enviar email com código de acesso';
      logger.error(`${errorMessage}:`, error);
      throw error;
    }
  }
}

module.exports = new EmailService();