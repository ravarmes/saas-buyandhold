/**
 * Configuração centralizada de ambiente para o backend
 * Detecta automaticamente o ambiente baseado em NODE_ENV
 * e carrega as configurações apropriadas
 */

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
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
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME || 'saas-buyandhold',
      username: process.env.DB_USER || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
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
    corsOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    
    // JWT
    jwt: {
      secret: 'dev_jwt_secret_key_change_in_production',
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
        key: 'dev_pix_key',
        bankCode: '001'
      },
      mercadoPago: {
        accessToken: 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789',
        publicKey: 'TEST-abcdef12-3456-7890-abcd-ef1234567890'
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
    frontendUrl: 'https://buyandhold.vargascode.com.br',
    backendUrl: 'https://buyandhold.vargascode.com.br/api',
    domain: 'buyandhold.vargascode.com.br',
    
    // Servidor
    port: process.env.PORT || 5000,
    
    // Banco de dados
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME || 'buyandhold_prod',
      username: process.env.DB_USER || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      ssl: process.env.DB_SSL === 'false' ? false : true,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: '-03:00'
    },
    
    // CORS
    corsOrigins: ['https://buyandhold.vargascode.com.br'],
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
      expiresIn: '7d'
    },
    
    // Logs
    logs: {
      level: 'info',
      file: './logs/app-prod.log'
    },
    
    // Pagamentos
    payments: {
      pix: {
        key: process.env.PIX_KEY || 'production_pix_key',
        bankCode: process.env.PIX_BANK_CODE || '001'
      },
      mercadoPago: {
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'PROD-access-token',
        publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || 'PROD-public-key'
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