import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    // Remover log de todas as variáveis para não poluir o console em produção
    // console.log('Todas as variáveis de ambiente:', process.env);

    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    this.templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    this.passwordTemplateId = process.env.REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID;
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    this.initialized = false;

    // Logs somente em desenvolvimento
    if (process.env.REACT_APP_PROFILE !== 'production') {
      console.log('EmailJS Config Detalhado:', {
        serviceId: this.serviceId,
        templateId: this.templateId,
        passwordTemplateId: this.passwordTemplateId,
        publicKeySet: this.publicKey ? 'SET' : 'NOT SET'
      });
    }
  }

  hasRequiredConfig() {
    return !!(this.serviceId && this.templateId && this.publicKey);
  }

  initEmailJS() {
    // Evitar tentativa de inicializar se não houver configuração
    if (!this.publicKey) {
      if (process.env.REACT_APP_PROFILE !== 'production') {
        console.warn('[EmailService] Public key ausente. EmailJS não será inicializado.');
      }
      return false;
    }

    if (!this.initialized) {
      try {
        emailjs.init(this.publicKey);
        this.initialized = true;
        if (process.env.REACT_APP_PROFILE !== 'production') {
          console.log('[EmailService] EmailJS inicializado com sucesso');
        }
      } catch (e) {
        console.error('[EmailService] Falha ao inicializar EmailJS:', e);
        this.initialized = false;
        return false;
      }
    }
    return this.initialized;
  }

  async sendContactEmail(formData) {
    // Se faltar configuração, retornar fallback amigável
    if (!this.hasRequiredConfig()) {
      return {
        success: false,
        message:
          'Serviço de email não está configurado. Por favor, configure as variáveis REACT_APP_EMAILJS_* e tente novamente.'
      };
    }

    if (!this.initEmailJS()) {
      return {
        success: false,
        message: 'Não foi possível inicializar o serviço de email. Verifique a chave pública.'
      };
    }

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: process.env.REACT_APP_EMAIL_TO || 'vargascodemail@gmail.com',
        app_name: process.env.REACT_APP_APP_NAME || 'SaaS Buy&Hold'
      };

      const response = await emailjs.send(this.serviceId, this.templateId, templateParams);

      return {
        success: true,
        message: 'Email enviado com sucesso!',
        response
      };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        message: 'Erro ao enviar email. Tente novamente.',
        error
      };
    }
  }

  async sendPasswordResetEmail(email, resetLink) {
    // Validar configuração necessária: serviceId, passwordTemplateId, publicKey
    if (!(this.serviceId && this.passwordTemplateId && this.publicKey)) {
      return {
        success: false,
        message:
          'Serviço de email para reset de senha não está configurado. Defina REACT_APP_EMAILJS_*.'
      };
    }

    if (!this.initEmailJS()) {
      return {
        success: false,
        message: 'Não foi possível inicializar o serviço de email. Verifique a chave pública.'
      };
    }

    try {
      const templateParams = {
        to_email: email,
        reset_link: resetLink,
        from_name: process.env.REACT_APP_APP_NAME || 'SaaS Buy&Hold',
        app_name: process.env.REACT_APP_APP_NAME || 'SaaS Buy&Hold'
      };

      const response = await emailjs.send(this.serviceId, this.passwordTemplateId, templateParams);

      return {
        success: true,
        message: 'Email de redefinição enviado com sucesso!',
        response
      };
    } catch (error) {
      console.error('Erro ao enviar email de reset:', error);
      return {
        success: false,
        message: 'Erro ao enviar email de redefinição. Tente novamente.',
        error
      };
    }
  }
  async sendBugReport(formData) {
    if (!this.hasRequiredConfig()) {
      return {
        success: false,
        message:
          'Serviço de email não está configurado. Por favor, configure as variáveis REACT_APP_EMAILJS_* e tente novamente.'
      };
    }

    if (!this.initEmailJS()) {
      return {
        success: false,
        message: 'Não foi possível inicializar o serviço de email. Verifique a chave pública.'
      };
    }

    try {
      const severityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴',
        critical: '🚨'
      };

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: `${severityEmoji[formData.severity] || '🐞'} Bug Report - ${formData.title}`,
        message: `TIPO: ${formData.bugType}\nSEVERIDADE: ${formData.severity?.toUpperCase()}\n\nDESCRIÇÃO:\n${formData.description}\n\nPASSOS PARA REPRODUZIR:\n${formData.stepsToReproduce}\n\nCOMPORTAMENTO ESPERADO:\n${formData.expectedBehavior}\n\nCOMPORTAMENTO ATUAL:\n${formData.actualBehavior}\n\nNAVEGADOR: ${formData.browser}\nDISPOSITIVO: ${formData.device}`,
        to_email: process.env.REACT_APP_EMAIL_TO || 'vargascodemail@gmail.com',
        app_name: process.env.REACT_APP_APP_NAME || 'SaaS Buy&Hold'
      };

      const response = await emailjs.send(this.serviceId, this.templateId, templateParams);

      return {
        success: true,
        message: 'Bug report enviado com sucesso!',
        response
      };
    } catch (error) {
      console.error('Erro ao enviar bug report:', error);
      return {
        success: false,
        message: 'Erro ao enviar bug report. Tente novamente.',
        error
      };
    }
  }

  async sendFeatureSuggestion(formData) {
    if (!this.hasRequiredConfig()) {
      return {
        success: false,
        message:
          'Serviço de email não está configurado. Por favor, configure as variáveis REACT_APP_EMAILJS_* e tente novamente.'
      };
    }

    if (!this.initEmailJS()) {
      return {
        success: false,
        message: 'Não foi possível inicializar o serviço de email. Verifique a chave pública.'
      };
    }

    try {
      const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
      };

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: `${priorityEmoji[formData.priority] || '💡'} Sugestão de Funcionalidade - ${formData.title}`,
        message: `CATEGORIA: ${formData.category}\nPRIORIDADE: ${formData.priority?.toUpperCase()}\nUSUÁRIOS ALVO: ${formData.targetUsers}\n\nDESCRIÇÃO:\n${formData.description}\n\nCASO DE USO:\n${formData.useCase}\n\nBENEFÍCIOS:\n${formData.benefits}`,
        to_email: process.env.REACT_APP_EMAIL_TO || 'vargascodemail@gmail.com',
        app_name: process.env.REACT_APP_APP_NAME || 'SaaS Buy&Hold'
      };

      const response = await emailjs.send(this.serviceId, this.templateId, templateParams);

      return {
        success: true,
        message: 'Sugestão de funcionalidade enviada com sucesso!',
        response
      };
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      return {
        success: false,
        message: 'Erro ao enviar sugestão. Tente novamente.',
        error
      };
    }
  }
}

export default new EmailService();
