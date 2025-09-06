// Configuração centralizada de ambiente
// Detecta automaticamente se é TESTE (development) ou PRODUÇÃO (production)

const getRuntimeOrigin = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return process.env.REACT_APP_APP_URL || 'http://localhost:3000';
};

const runtimeProfile = process.env.REACT_APP_PROFILE || process.env.NODE_ENV || 'development';
const isDevFlag = runtimeProfile === 'development';
const isProdFlag = runtimeProfile === 'production';

const apiBaseURL = process.env.REACT_APP_API_URL || '/api';

const environment = {
  // Detecta o ambiente atual
  isDevelopment: isDevFlag,
  isProduction: isProdFlag,
  
  // Configurações baseadas no ambiente
  api: {
    // Usa variável REACT_APP_API_URL, se existir; caso contrário, usa caminho relativo '/api'
    baseURL: apiBaseURL,
  },
  
  app: {
    // Usa a origem em tempo de execução para evitar hardcode de domínio
    domain: getRuntimeOrigin(),
    name: 'Buy & Hold',
    version: '1.0.0'
  },
  
  // URLs para meta tags e SEO
  seo: {
    url: `${getRuntimeOrigin()}/`,
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
    enabled: isDevFlag,
    logLevel: isDevFlag ? 'debug' : 'error'
  },
  
  // Configurações de features (pode ser útil para A/B testing)
  features: {
    showAds: true,
    enableAnalytics: isProdFlag,
    enableHotReload: isDevFlag
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
  console.log('🔧 Ambiente detectado:', runtimeProfile);
  console.log('🌐 API URL:', environment.api.baseURL);
  console.log('🏠 App URL:', environment.app.domain);
}