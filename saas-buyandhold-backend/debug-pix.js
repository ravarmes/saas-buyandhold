/**
 * Script para debug e teste das configurações PIX
 * Identifica problemas na geração de códigos PIX
 */

// Carregar variáveis de ambiente do arquivo .env.docker
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.docker') });

const { config, isProduction } = require('./config/environment');
const path = require('path');
const fs = require('fs');

// Função para calcular CRC16 (copiada do payments.js)
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Função para gerar código PIX (copiada do payments.js)
function generatePixCode({ pixKey, merchantName, merchantCity, amount, txId, userId }) {
  const formatEMVField = (id, value) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 12);
  const userSuffix = userId ? userId.toString().slice(-4) : '0000';
  const uniqueTxId = txId || `${userSuffix}_${timestamp}_${randomSuffix}`;
  const truncatedTxId = uniqueTxId.substring(0, 25);

  let pixString = '';
  
  // 00 - Payload Format Indicator
  pixString += formatEMVField('00', '01');
  
  // 01 - Point of Initiation Method
  pixString += formatEMVField('01', '12');
  
  // 26 - Merchant Account Information
  let merchantAccount = '';
  merchantAccount += formatEMVField('00', 'BR.GOV.BCB.PIX');
  merchantAccount += formatEMVField('01', pixKey);
  merchantAccount += formatEMVField('02', truncatedTxId);
  pixString += formatEMVField('26', merchantAccount);
  
  // 52 - Merchant Category Code
  pixString += formatEMVField('52', '0000');
  
  // 53 - Transaction Currency
  pixString += formatEMVField('53', '986');
  
  // 54 - Transaction Amount
  if (amount && parseFloat(amount) > 0) {
    pixString += formatEMVField('54', amount);
  }
  
  // 58 - Country Code
  pixString += formatEMVField('58', 'BR');
  
  // 59 - Merchant Name
  const merchantNameFormatted = merchantName.substring(0, 25).toUpperCase();
  pixString += formatEMVField('59', merchantNameFormatted);
  
  // 60 - Merchant City
  const merchantCityFormatted = merchantCity.substring(0, 15).toUpperCase();
  pixString += formatEMVField('60', merchantCityFormatted);
  
  // 62 - Additional Data Field Template
  let additionalData = formatEMVField('05', truncatedTxId);
  const timestampStr = timestamp.toString();
  const userIdStr = userId ? userId.toString().slice(-6) : '000000';
  additionalData += formatEMVField('07', timestampStr.slice(-8));
  additionalData += formatEMVField('08', userIdStr);
  pixString += formatEMVField('62', additionalData);
  
  // 63 - CRC16
  pixString += '6304';
  const crcValue = crc16(pixString);
  pixString += crcValue;
  
  return pixString;
}

// Função para validar chave PIX
function validatePixKey(pixKey) {
  if (!pixKey || pixKey === 'dev_pix_key' || pixKey === 'production_pix_key' || pixKey === 'sua_chave_pix_real_aqui') {
    return { valid: false, reason: 'Chave PIX não configurada ou usando valor padrão' };
  }

  // Validar CPF (11 dígitos)
  if (/^\d{11}$/.test(pixKey)) {
    return { valid: true, type: 'CPF' };
  }

  // Validar CNPJ (14 dígitos)
  if (/^\d{14}$/.test(pixKey)) {
    return { valid: true, type: 'CNPJ' };
  }

  // Validar email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
    return { valid: true, type: 'Email' };
  }

  // Validar telefone (+5511999999999)
  if (/^\+55\d{10,11}$/.test(pixKey)) {
    return { valid: true, type: 'Telefone' };
  }

  // Validar chave aleatória (UUID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pixKey)) {
    return { valid: true, type: 'Chave Aleatória' };
  }

  return { valid: false, reason: 'Formato de chave PIX inválido' };
}

console.log('🔍 DEBUG PIX - Análise das Configurações');
console.log('=' .repeat(50));

// 1. Verificar ambiente atual
console.log('\n📊 AMBIENTE ATUAL:');
console.log('APP_ENV:', process.env.APP_ENV || 'undefined (padrão: development)');
console.log('isProduction:', isProduction);
console.log('Configuração detectada:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');

// 2. Verificar configurações PIX
console.log('\n🔑 CONFIGURAÇÕES PIX:');
const pixKey = isProduction ? 
  (process.env.PIX_KEY || config.payments.pix.key) : 
  config.payments.pix.key;

const pixName = process.env.PIX_NAME || (isProduction ? 'Buy and Hold Premium' : 'SEU NOME COMPLETO');
const pixCity = process.env.PIX_CITY || (isProduction ? 'SAO PAULO' : 'SUA CIDADE');

console.log('PIX_KEY:', pixKey);
console.log('PIX_NAME:', pixName);
console.log('PIX_CITY:', pixCity);

// 3. Validar chave PIX
console.log('\n✅ VALIDAÇÃO DA CHAVE PIX:');
const validation = validatePixKey(pixKey);
console.log('Válida:', validation.valid);
if (validation.valid) {
  console.log('Tipo:', validation.type);
} else {
  console.log('❌ Problema:', validation.reason);
}

// 4. Testar geração de código PIX
console.log('\n🧪 TESTE DE GERAÇÃO PIX:');
const testPixData = {
  pixKey,
  merchantName: pixName,
  merchantCity: pixCity,
  amount: '15.00',
  txId: 'TEST_' + Date.now(),
  userId: '123'
};

try {
  const pixCode = generatePixCode(testPixData);
  console.log('Código PIX gerado:', pixCode);
  console.log('Tamanho:', pixCode.length, 'caracteres');
  console.log('Válido (formato básico):', pixCode.length > 50 && pixCode.startsWith('00020126'));
} catch (error) {
  console.log('❌ Erro ao gerar código PIX:', error.message);
}

// 5. Verificar arquivos de configuração
console.log('\n📁 ARQUIVOS DE CONFIGURAÇÃO:');
const envDockerFile = path.join(__dirname, '../.env.docker');

console.log('.env.docker existe:', fs.existsSync(envDockerFile));

if (fs.existsSync(envDockerFile)) {
  const envContent = fs.readFileSync(envDockerFile, 'utf8');
  console.log('.env.docker contém APP_ENV:', envContent.includes('APP_ENV'));
}

// 6. Recomendações
console.log('\n💡 RECOMENDAÇÕES:');
if (!isProduction && process.env.NODE_ENV === 'production') {
  console.log('⚠️  NODE_ENV é production mas APP_ENV não está definido');
  console.log('   Adicione APP_ENV=production no .env');
}

if (!validation.valid) {
  console.log('❌ Configure uma chave PIX válida no .env.docker');
  console.log('   Exemplos:');
  console.log('   - CPF: PIX_KEY=12345678901');
  console.log('   - Email: PIX_KEY=seu@email.com');
  console.log('   - Telefone: PIX_KEY=+5511999999999');
}

if (pixName.includes('SEU NOME') || pixCity.includes('SUA CIDADE')) {
  console.log('❌ Configure PIX_NAME e PIX_CITY com valores reais');
}

console.log('\n🔧 PRÓXIMOS PASSOS:');
console.log('1. Configure APP_ENV=production no .env.docker para produção');
console.log('2. Configure chave PIX real no .env.docker');
console.log('3. Configure PIX_NAME e PIX_CITY com dados reais');
console.log('4. Teste novamente a geração de códigos PIX');