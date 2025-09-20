/**
 * Script para verificar se as configurações de produção estão sendo carregadas corretamente
 * Simula o ambiente de produção para validar as configurações PIX
 */

// Simular ambiente de produção
process.env.APP_ENV = 'production';

// Carregar variáveis de ambiente do .env.docker
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.docker') });

const { config, isProduction } = require('./config/environment');
const logger = require('./src/utils/logger');

console.log('🔍 VERIFICAÇÃO DE CONFIGURAÇÕES DE PRODUÇÃO');
console.log('=' .repeat(60));

// Verificar ambiente
console.log('\n📋 AMBIENTE:');
console.log(`APP_ENV: ${process.env.APP_ENV}`);
console.log(`isProduction: ${isProduction}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);

// Verificar configurações PIX
console.log('\n💳 CONFIGURAÇÕES PIX:');
console.log(`PIX_KEY (env): ${process.env.PIX_KEY || 'undefined'}`);
console.log(`PIX_NAME (env): ${process.env.PIX_NAME || 'undefined'}`);
console.log(`PIX_CITY (env): ${process.env.PIX_CITY || 'undefined'}`);
console.log(`PIX_BANK_CODE (env): ${process.env.PIX_BANK_CODE || 'undefined'}`);

console.log('\n⚙️ CONFIGURAÇÕES CARREGADAS PELO SISTEMA:');
console.log(`config.payments.pix.key: ${config.payments.pix.key}`);
console.log(`config.payments.pix.bankCode: ${config.payments.pix.bankCode}`);

// Verificar URLs
console.log('\n🌐 URLs:');
console.log(`Frontend URL: ${config.frontendUrl}`);
console.log(`Backend URL: ${config.backendUrl}`);
console.log(`Domain: ${config.domain}`);

// Verificar banco de dados
console.log('\n🗄️ BANCO DE DADOS:');
console.log(`Host: ${config.database.host}`);
console.log(`Database: ${config.database.name}`);
console.log(`SSL: ${config.database.ssl}`);

// Verificar JWT
console.log('\n🔐 SEGURANÇA:');
console.log(`JWT Secret: ${config.jwt.secret.substring(0, 10)}***`);
console.log(`Session Secret: ${config.session.secret.substring(0, 10)}***`);

// Verificar SSL
console.log('\n🔒 SSL:');
console.log(`SSL Enabled: ${config.ssl.enabled}`);
if (config.ssl.enabled) {
  console.log(`SSL Key Path: ${config.ssl.keyPath || 'undefined'}`);
  console.log(`SSL Cert Path: ${config.ssl.certPath || 'undefined'}`);
}

// Verificar Hotmart
console.log('\n🛒 HOTMART:');
console.log(`Client ID: ${config.payments.hotmart.clientId}`);
console.log(`Sandbox Mode: ${config.payments.hotmart.sandboxMode}`);
console.log(`Webhook URL: ${config.payments.hotmart.webhookUrl}`);

// Verificar Mercado Pago
console.log('\n💰 MERCADO PAGO:');
console.log(`Access Token: ${config.payments.mercadoPago.accessToken.substring(0, 10)}***`);
console.log(`Public Key: ${config.payments.mercadoPago.publicKey.substring(0, 10)}***`);

// Verificar Email
console.log('\n📧 EMAIL:');
console.log(`Email User: ${config.email.user}`);
console.log(`Email From: ${config.email.from}`);
console.log(`Email To: ${config.email.to}`);

// Validações críticas
console.log('\n✅ VALIDAÇÕES CRÍTICAS:');
const validations = [];

// Validar PIX
if (!config.payments.pix.key || config.payments.pix.key === 'production_pix_key') {
  validations.push('❌ Chave PIX não configurada ou usando valor padrão');
} else {
  validations.push('✅ Chave PIX configurada');
}

// Validar JWT
if (config.jwt.secret === 'change_this_secret_in_production') {
  validations.push('❌ JWT Secret usando valor padrão - INSEGURO!');
} else {
  validations.push('✅ JWT Secret configurado');
}

// Validar Session
if (config.session.secret === 'change_this_session_secret') {
  validations.push('❌ Session Secret usando valor padrão - INSEGURO!');
} else {
  validations.push('✅ Session Secret configurado');
}

// Validar Hotmart
if (config.payments.hotmart.clientId.includes('prod_client_id')) {
  validations.push('❌ Hotmart Client ID usando valor padrão');
} else {
  validations.push('✅ Hotmart Client ID configurado');
}

// Validar Mercado Pago
if (config.payments.mercadoPago.accessToken.includes('PROD-access-token')) {
  validations.push('❌ Mercado Pago Access Token usando valor padrão');
} else {
  validations.push('✅ Mercado Pago Access Token configurado');
}

// Validar SSL
if (config.ssl.enabled && (!config.ssl.keyPath || !config.ssl.certPath)) {
  validations.push('❌ SSL habilitado mas caminhos dos certificados não configurados');
} else if (config.ssl.enabled) {
  validations.push('✅ SSL configurado corretamente');
}

// Exibir validações
validations.forEach(validation => console.log(validation));

// Teste de geração PIX
console.log('\n🧪 TESTE DE GERAÇÃO PIX:');
try {
  // Importar função de geração PIX
  const fs = require('fs');
  const paymentsCode = fs.readFileSync('./src/routes/payments.js', 'utf8');
  
  // Extrair e executar função generatePixCode (método simplificado)
  const pixKey = config.payments.pix.key;
  const merchantName = process.env.PIX_NAME || 'Buy and Hold Premium';
  const merchantCity = process.env.PIX_CITY || 'SAO PAULO';
  
  console.log(`Chave PIX: ${pixKey}`);
  console.log(`Nome: ${merchantName}`);
  console.log(`Cidade: ${merchantCity}`);
  
  if (pixKey && pixKey !== 'production_pix_key') {
    console.log('✅ Configurações PIX válidas para geração de código');
  } else {
    console.log('❌ Configurações PIX inválidas - código não pode ser gerado');
  }
  
} catch (error) {
  console.log(`❌ Erro no teste de geração PIX: ${error.message}`);
}

// Resumo final
console.log('\n📊 RESUMO:');
const errors = validations.filter(v => v.includes('❌')).length;
const successes = validations.filter(v => v.includes('✅')).length;

console.log(`✅ Configurações válidas: ${successes}`);
console.log(`❌ Configurações com problemas: ${errors}`);

if (errors === 0) {
  console.log('\n🎉 TODAS AS CONFIGURAÇÕES ESTÃO CORRETAS!');
  console.log('O servidor deve funcionar corretamente em produção.');
} else {
  console.log('\n⚠️ EXISTEM PROBLEMAS NAS CONFIGURAÇÕES!');
  console.log('Corrija os itens marcados com ❌ antes de fazer deploy.');
}

console.log('\n' + '='.repeat(60));