/**
 * Configuração centralizada de ambiente para o backend
 * Detecta automaticamente o ambiente baseado em APP_ENV
 * e carrega as configurações do arquivo .env.docker centralizado
 */

// Carregar variáveis de ambiente do arquivo .env.docker centralizado
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.docker') });

const runtimeEnv = process.env.APP_ENV || 'development';
const isDevelopment = runtimeEnv === 'development';
const isProduction = runtimeEnv === 'production';
const isTest = runtimeEnv === 'test';

// Configurações base para cada ambiente
const environments = {
  development: {
    // URLs e domínios
    frontendUrl: 'http://localhost:3000',
    backendUrl: 'http://localhost:5000',
    domain: 'localhost',
    
    // Servidor
    port: 5000,
    
    // Banco de dados
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME || 'saas_buyandhold',
      username: process.env.DB_USER || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      dialect: 'postgres',
      ssl: process.env.DB_SSL === 'true',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: process.env.TIMEZONE || '-03:00'
    },
    
    // CORS
    corsOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production',
      expiresIn: '7d'
    },
    
    // Logs
    logs: {
      level: 'debug',
      file: './logs/app-dev.log'
    },
    
    // Pagamentos
    payments: {
      pix: {
        key: process.env.PIX_KEY || '28992566255',
        bankCode: process.env.PIX_BANK_CODE || '001',
        name: process.env.PIX_NAME || 'Buy and Hold Premium',
        city: process.env.PIX_CITY || 'SAO PAULO'
      },
      mercadoPago: {
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789',
        publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || 'TEST-abcdef12-3456-7890-abcd-ef1234567890',
        enabled: process.env.MERCADO_PAGO === 'true'
      },
      hotmart: {
          clientId: process.env.HOTMART_CLIENT_ID || '32a81e15-0824-4626-8fdd-e00bd346044c',
          clientSecret: process.env.HOTMART_CLIENT_SECRET || '532320c3-39e7-4813-a6cb-8610eaf162fb',
          basicToken: process.env.HOTMART_BASIC_AUTH || 'Basic MzJhODFlMTUtMDgyNC00NjI2LThmZGQtZTAwYmQzNDYwNDRjOjUzMjMyMGMzLTM5ZTctNDgxMy1hNmNiLTg2MTBlYWYxNjJmYg==',
          webhookSecret: process.env.HOTMART_WEBHOOK_SECRET || 'uvMuQHHFBq4YAo9ow0JrJx0TlZ6jn222432426',
          productId: process.env.HOTMART_PRODUCT_ID || '6212414',
          productUcode: process.env.HOTMART_PRODUCT_UCODE || 'premium-saas',
          apiUrl: process.env.HOTMART_API_URL || 'https://sandbox.hotmart.com',
          checkoutUrl: process.env.HOTMART_CHECKOUT_URL || 'https://pay.hotmart.com',
          sandboxMode: !isProduction,
          enabled: process.env.HOTMART === 'true',
          successUrl: process.env.HOTMART_SUCCESS_URL || `${process.env.NGROK_URL || 'http://localhost:3000'}/upgrade/success`,
          cancelUrl: process.env.HOTMART_CANCEL_URL || `${process.env.NGROK_URL || 'http://localhost:3000'}/upgrade/cancel`,
          webhookUrl: process.env.HOTMART_WEBHOOK_URL || `${process.env.NGROK_URL || 'http://localhost:5000'}/api/payments/hotmart/webhook`
        }
    },
    
    // SSL
    ssl: {
      enabled: false
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000 // máximo 1000 requests por IP
    },
    
    // Sessão
    session: {
      secret: 'dev_session_secret',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    },
    
    // Email
    email: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password',
      from: process.env.EMAIL_FROM || 'Buy & Hold <noreply@buyandhold.com>',
      to: process.env.EMAIL_TO || 'vargascodemail@gmail.com'
    },

    // Debug
    debug: true
  },
  
  production: {
    // URLs e domínios
    frontendUrl: process.env.FRONTEND_URL_PROD || 'https://buyandhold.vargascode.com.br',
    backendUrl: process.env.BACKEND_URL_PROD || 'https://buyandhold.vargascode.com.br/api',
    domain: process.env.REACT_APP_DOMAIN_PROD || 'buyandhold.vargascode.com.br',
    
    // Servidor
    port: process.env.PORT || process.env.BACKEND_PORT || 5000,
    
    // Banco de dados
    database: {
      host: process.env.DB_HOST_PROD || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME_PROD || process.env.DB_NAME || 'buyandhold_prod',
      username: process.env.DB_USER_PROD || process.env.DB_USER || 'postgres',
      user: process.env.DB_USER_PROD || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      ssl: process.env.DB_SSL_PROD === 'true' || process.env.DB_SSL === 'true',
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: process.env.TIMEZONE || '-03:00'
    },
    
    // CORS
    corsOrigins: [process.env.FRONTEND_URL_PROD || 'https://buyandhold.vargascode.com.br'],
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET_PROD || process.env.JWT_SECRET || 'change_this_secret_in_production',
      expiresIn: '7d'
    },
    
    // Logs
    logs: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || './logs/app-prod.log'
    },
    
    // Pagamentos
    payments: {
      pix: {
        key: process.env.PIX_KEY || '28992566255',
        bankCode: process.env.PIX_BANK_CODE || '001',
        name: process.env.PIX_NAME || 'Buy and Hold Premium',
        city: process.env.PIX_CITY || 'SAO PAULO'
      },
      mercadoPago: {
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN_PROD || process.env.MERCADO_PAGO_ACCESS_TOKEN || 'PROD-access-token',
        publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY_PROD || process.env.MERCADO_PAGO_PUBLIC_KEY || 'PROD-public-key',
        enabled: process.env.MERCADO_PAGO === 'true'
      },
      hotmart: {
         clientId: process.env.HOTMART_CLIENT_ID_PROD || process.env.HOTMART_CLIENT_ID || '32a81e15-0824-4626-8fdd-e00bd346044c',
         clientSecret: process.env.HOTMART_CLIENT_SECRET_PROD || process.env.HOTMART_CLIENT_SECRET || '532320c3-39e7-4813-a6cb-8610eaf162fb',
         basicToken: process.env.HOTMART_BASIC_TOKEN_PROD || process.env.HOTMART_BASIC_AUTH || 'Basic MzJhODFlMTUtMDgyNC00NjI2LThmZGQtZTAwYmQzNDYwNDRjOjUzMjMyMGMzLTM5ZTctNDgxMy1hNmNiLTg2MTBlYWYxNjJmYg==',
         webhookSecret: process.env.HOTMART_WEBHOOK_SECRET || 'uvMuQHHFBq4YAo9ow0JrJx0TlZ6jn222432426',
         productId: process.env.HOTMART_PRODUCT_ID_PROD || process.env.HOTMART_PRODUCT_ID || '6212414',
         productUcode: process.env.HOTMART_PRODUCT_UCODE || 'premium-saas',
         apiUrl: process.env.HOTMART_API_URL || 'https://api-sec-vlc.hotmart.com',
         checkoutUrl: process.env.HOTMART_CHECKOUT_URL || 'https://pay.hotmart.com',
         sandboxMode: false,
         enabled: process.env.HOTMART === 'true',
         successUrl: process.env.HOTMART_SUCCESS_URL_PROD || process.env.HOTMART_SUCCESS_URL || 'https://buyandhold.vargascode.com.br/upgrade/success',
         cancelUrl: process.env.HOTMART_CANCEL_URL_PROD || process.env.HOTMART_CANCEL_URL || 'https://buyandhold.vargascode.com.br/upgrade/cancel',
         webhookUrl: process.env.HOTMART_WEBHOOK_URL_PROD || process.env.HOTMART_WEBHOOK_URL || 'https://buyandhold.vargascode.com.br/api/payments/hotmart/webhook'
       }
    },
    
    // SSL
    ssl: {
      enabled: true,
      keyPath: process.env.SSL_KEY_PATH,
      certPath: process.env.SSL_CERT_PATH
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // máximo 100 requests por IP
    },
    
    // Sessão
    session: {
      secret: process.env.SESSION_SECRET || 'change_this_session_secret',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    },
    
    // Email
    email: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password',
      from: process.env.EMAIL_FROM || 'Buy & Hold <noreply@buyandhold.com>',
      to: process.env.EMAIL_TO || 'vargascodemail@gmail.com'
    },

    // Debug
    debug: false
  },
  
  test: {
    // URLs e domínios
    frontendUrl: 'http://localhost:3000',
    backendUrl: 'http://localhost:5000',
    domain: 'localhost',
    
    // Servidor
    port: 5000,
    
    // Banco de dados
    database: {
      host: 'localhost',
      port: 5432,
      name: 'buyandhold_test',
      username: 'postgres',
      user: 'postgres',
      password: 'postgres',
      dialect: 'postgres',
      ssl: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: '-03:00'
    },
    
    // CORS
    corsOrigins: ['http://localhost:3000'],
    
    // JWT
    jwt: {
      secret: 'test_jwt_secret',
      expiresIn: '1h'
    },
    
    // Logs
    logs: {
      level: 'error',
      file: './logs/app-test.log'
    },
    
    // Pagamentos
    payments: {
      pix: {
        key: 'test_pix_key',
        bankCode: '001'
      },
      mercadoPago: {
        accessToken: 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789',
        publicKey: 'TEST-abcdef12-3456-7890-abcd-ef1234567890'
      },
      hotmart: {
         clientId: 'test_client_id',
         clientSecret: 'test_client_secret',
         basicToken: 'test_basic_auth',
         webhookSecret: 'test_webhook_secret',
         productId: 'test_product_id',
         productUcode: 'test_product_ucode',
         apiUrl: 'https://sandbox.hotmart.com',
         checkoutUrl: 'https://pay.hotmart.com',
         sandboxMode: true,
         successUrl: 'http://localhost:3000/upgrade/success',
         cancelUrl: 'http://localhost:3000/upgrade/cancel',
         webhookUrl: 'http://localhost:5000/api/payments/hotmart/webhook'
       }
    },
    
    // SSL
    ssl: {
      enabled: false
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000
    },
    
    // Sessão
    session: {
      secret: 'test_session_secret',
      secure: false,
      maxAge: 60 * 60 * 1000 // 1 hora
    },
    
    // Email
    email: {
      user: process.env.EMAIL_USER || 'test-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'test-password',
      from: process.env.EMAIL_FROM || 'Buy & Hold Test <test@buyandhold.com>',
      to: process.env.EMAIL_TO || 'test@example.com'
    },

    // Debug
    debug: true
  }
};

// Determinar ambiente atual
const currentEnvironment = isProduction ? 'production' : 
                          isTest ? 'test' : 
                          'development';

// Configuração ativa
const config = environments[currentEnvironment];

// Configuração dinâmica do webhook da Hotmart baseada no ambiente
if (config.payments && config.payments.hotmart) {
  // Usa a variável HOTMART_WEBHOOK_URL do .env.docker
  config.payments.hotmart.webhookUrl = process.env.HOTMART_WEBHOOK_URL || config.payments.hotmart.webhookUrl;
}

// Enriquecer CORS com FRONTEND_URL, se definido
if (process.env.FRONTEND_URL) {
  const origins = new Set([...(config.corsOrigins || [])]);
  origins.add(process.env.FRONTEND_URL);
  config.corsOrigins = Array.from(origins);
}

// Funções auxiliares
const debugLog = (...args) => {
  if (config.debug) {
    console.log('[DEBUG]', ...args);
  }
};

const getEnvironment = () => currentEnvironment;

const isDev = () => currentEnvironment === 'development';
const isProd = () => currentEnvironment === 'production';
const isTestEnv = () => currentEnvironment === 'test';

// Exportar configurações
module.exports = {
  // Configuração completa
  config,
  
  // Configurações específicas
  frontendUrl: config.frontendUrl,
  backendUrl: config.backendUrl,
  domain: config.domain,
  port: config.port,
  database: config.database,
  corsOrigins: config.corsOrigins,
  jwt: config.jwt,
  logs: config.logs,
  payments: config.payments,
  ssl: config.ssl,
  rateLimit: config.rateLimit,
  session: config.session,
  email: config.email,
  
  // Funções auxiliares
  debugLog,
  getEnvironment,
  isDev,
  isProd,
  isTestEnv,
  
  // Flags de ambiente
  isProduction,
  isTest
};