// Configuração centralizada de ambiente
// Detecta automaticamente se é TESTE (development) ou PRODUÇÃO (production)

const environment = {
  // Detecta o ambiente atual
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Configurações baseadas no ambiente
  api: {
    baseURL: process.env.NODE_ENV === 'production' 
      ? 'https://buyandhold.vargascode.com.br/api'
      : 'http://localhost:5000',
  },
  
  app: {
    domain: process.env.NODE_ENV === 'production'
      ? 'https://buyandhold.vargascode.com.br'
      : 'http://localhost:3000',
    name: 'Buy & Hold',
    version: '1.0.0'
  },
  
  // URLs para meta tags e SEO
  seo: {
    url: process.env.NODE_ENV === 'production'
      ? 'https://buyandhold.vargascode.com.br/'
      : 'http://localhost:3000/',
    title: 'SaaS Buy & Hold - Calculadora de Investimentos',
    description: 'Otimize sua carteira de investimentos com sugestões inteligentes'
  },
  
  // Configurações de terceiros
  services: {
    googleAdsense: {
      client: 'ca-pub-8703883002838699',
      enabled: true // Pode ser desabilitado em desenvolvimento se necessário
    },
    
    emailJS: {
      serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || '',
      templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '',
      publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || ''
    },
    
    mercadoPago: {
      // URLs do SDK são as mesmas para ambos os ambientes
      sdkUrl: 'https://sdk.mercadopago.com/js/v2'
    }
  },
  
  // Configurações de debug e logging
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
  },
  
  // Configurações de features (pode ser útil para A/B testing)
  features: {
    showAds: true,
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableHotReload: process.env.NODE_ENV === 'development'
  }
};

// Função helper para obter a URL da API
export const getApiUrl = (endpoint = '') => {
  const baseUrl = environment.api.baseURL;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : baseUrl;
};

// Função helper para logs condicionais
export const debugLog = (...args) => {
  if (environment.debug.enabled) {
    console.log('[DEBUG]', ...args);
  }
};

// Função para verificar se estamos em produção
export const isProduction = () => environment.isProduction;

// Função para verificar se estamos em desenvolvimento
export const isDevelopment = () => environment.isDevelopment;

// Exportar configuração principal
export default environment;

// Exportar configurações específicas para fácil acesso
export const { api, app, seo, services, debug, features } = environment;

// Log do ambiente atual (apenas em desenvolvimento)
if (environment.debug.enabled) {
  console.log('🔧 Ambiente detectado:', process.env.NODE_ENV);
  console.log('🌐 API URL:', environment.api.baseURL);
  console.log('🏠 App URL:', environment.app.domain);
}