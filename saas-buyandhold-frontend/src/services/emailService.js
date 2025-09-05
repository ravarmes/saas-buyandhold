import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    console.log('Todas as variáveis de ambiente:', process.env);
    
    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    this.templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    this.passwordTemplateId = process.env.REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID;
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    this.initialized = false;
    
    // Debug logs detalhados
    console.log('EmailJS Config Detalhado:', {
      serviceId: this.serviceId,
      serviceIdType: typeof this.serviceId,
      templateId: this.templateId,
      templateIdType: typeof this.templateId,
      passwordTemplateId: this.passwordTemplateId,
      passwordTemplateIdType: typeof this.passwordTemplateId,
      publicKey: this.publicKey,
      publicKeyType: typeof this.publicKey,
      publicKeySet: this.publicKey ? 'SET' : 'NOT SET'
    });
  }

  initEmailJS() {
    console.log('Tentando inicializar EmailJS:', {
      initialized: this.initialized,
      publicKey: this.publicKey,
      hasPublicKey: !!this.publicKey
    });
    
    if (!this.initialized && this.publicKey) {
      console.log('Inicializando EmailJS com chave:', this.publicKey);
      emailjs.init(this.publicKey);
      this.initialized = true;
      console.log('EmailJS inicializado com sucesso');
    } else {
      console.error('Falha na inicialização do EmailJS:', {
        alreadyInitialized: this.initialized,
        missingPublicKey: !this.publicKey
      });
    }
  }

  async sendContactEmail(formData) {
    this.initEmailJS();
    
    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'ajuda.brugnara@gmail.com'
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

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
    this.initEmailJS();
    
    console.log('=== DEBUG RESET PASSWORD EMAIL ===');
    console.log('Email:', email);
    console.log('Reset Link:', resetLink);
    console.log('Service ID:', this.serviceId);
    console.log('Password Template ID:', this.passwordTemplateId);
    console.log('Public Key:', this.publicKey);
    
    try {
      const templateParams = {
        to_email: email,
        reset_link: resetLink,
        from_name: 'SaaS Buy&Hold'
      };

      console.log('Template Params:', templateParams);

      const response = await emailjs.send(
        this.serviceId,
        this.passwordTemplateId, // Template específico para reset de senha
        templateParams
      );

      console.log('EmailJS Response:', response);

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
    this.initEmailJS();
    
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
        subject: `${severityEmoji[formData.severity]} Bug Report - ${formData.title}`,
        message: `TIPO: ${formData.bugType}\nSEVERIDADE: ${formData.severity.toUpperCase()}\n\nDESCRIÇÃO:\n${formData.description}\n\nPASSOS PARA REPRODUZIR:\n${formData.stepsToReproduce}\n\nCOMPORTAMENTO ESPERADO:\n${formData.expectedBehavior}\n\nCOMPORTAMENTO ATUAL:\n${formData.actualBehavior}\n\nNAVEGADOR: ${formData.browser}\nDISPOSITIVO: ${formData.device}`,
        to_email: 'ajuda.brugnara@gmail.com'
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

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
    this.initEmailJS();
    
    try {
      const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
      };

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: `${priorityEmoji[formData.priority]} Sugestão de Funcionalidade - ${formData.title}`,
        message: `CATEGORIA: ${formData.category}\nPRIORIDADE: ${formData.priority.toUpperCase()}\nUSUÁRIOS ALVO: ${formData.targetUsers}\n\nDESCRIÇÃO:\n${formData.description}\n\nCASO DE USO:\n${formData.useCase}\n\nBENEFÍCIOS:\n${formData.benefits}`,
        to_email: 'ajuda.brugnara@gmail.com'
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

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

const emailService = new EmailService();
export default emailService;
