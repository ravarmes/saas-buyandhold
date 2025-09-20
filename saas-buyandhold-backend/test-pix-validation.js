/**
 * Script para testar e validar códigos PIX gerados
 * Identifica problemas específicos no formato EMV
 */

// Carregar variáveis de ambiente do .env.docker
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.docker') });

const { config } = require('./config/environment');

// Função CRC16 (copiada do payments.js)
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

// Função para validar código PIX
function validatePixCode(pixCode) {
  const errors = [];
  const warnings = [];
  
  // Verificar se começa com 00020101
  if (!pixCode.startsWith('000201')) {
    errors.push('Código deve começar com 000201 (Payload Format Indicator)');
  }
  
  // Verificar se tem Point of Initiation Method
  if (!pixCode.includes('010212')) {
    errors.push('Deve conter 010212 (Point of Initiation Method)');
  }
  
  // Verificar se contém BR.GOV.BCB.PIX
  if (!pixCode.includes('BR.GOV.BCB.PIX')) {
    errors.push('Deve conter BR.GOV.BCB.PIX');
  }
  
  // Verificar Currency Code (986 = BRL)
  if (!pixCode.includes('53039')) {
    errors.push('Deve conter 530398 (Currency Code BRL)');
  }
  
  // Verificar Country Code (BR)
  if (!pixCode.includes('5802BR')) {
    errors.push('Deve conter 5802BR (Country Code)');
  }
  
  // Verificar CRC16 no final
  if (!pixCode.match(/6304[A-F0-9]{4}$/)) {
    errors.push('Deve terminar com 6304 seguido de 4 dígitos hexadecimais (CRC16)');
  }
  
  // Verificar tamanho (deve ser entre 100-512 caracteres)
  if (pixCode.length < 100) {
    warnings.push(`Código muito curto: ${pixCode.length} caracteres (mínimo recomendado: 100)`);
  }
  if (pixCode.length > 512) {
    errors.push(`Código muito longo: ${pixCode.length} caracteres (máximo: 512)`);
  }
  
  // Verificar CRC16
  const crcPart = pixCode.slice(-4);
  const dataForCrc = pixCode.slice(0, -4);
  const calculatedCrc = crc16(dataForCrc);
  
  if (crcPart !== calculatedCrc) {
    errors.push(`CRC16 inválido. Esperado: ${calculatedCrc}, Encontrado: ${crcPart}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Função para analisar estrutura do código PIX
function analyzePixStructure(pixCode) {
  console.log('\n🔍 ANÁLISE DETALHADA DA ESTRUTURA PIX:');
  console.log('=' .repeat(50));
  
  let pos = 0;
  const fields = [];
  
  while (pos < pixCode.length - 4) { // -4 para o CRC no final
    if (pos + 4 > pixCode.length) break;
    
    const id = pixCode.substr(pos, 2);
    const length = parseInt(pixCode.substr(pos + 2, 2));
    
    if (isNaN(length) || pos + 4 + length > pixCode.length) {
      console.log(`❌ Erro na posição ${pos}: ID=${id}, Length=${length}`);
      break;
    }
    
    const value = pixCode.substr(pos + 4, length);
    fields.push({ id, length, value, position: pos });
    
    console.log(`Campo ${id}: [${length.toString().padStart(2, '0')}] "${value}"`);
    
    pos += 4 + length;
  }
  
  // Analisar CRC
  const crcField = pixCode.slice(-8);
  console.log(`\nCRC Field: ${crcField}`);
  console.log(`CRC ID: ${crcField.substr(0, 2)}`);
  console.log(`CRC Length: ${crcField.substr(2, 2)}`);
  console.log(`CRC Value: ${crcField.substr(4, 4)}`);
  
  return fields;
}

// Executar testes
console.log('🧪 TESTE DE VALIDAÇÃO PIX');
console.log('=' .repeat(50));

// Configurações de teste
const testConfig = {
  pixKey: config.payments.pix.key,
  merchantName: process.env.PIX_NAME || 'Buy and Hold Premium',
  merchantCity: process.env.PIX_CITY || 'SAO PAULO',
  amount: '15.00',
  userId: 12345
};

console.log('📋 Configurações de teste:');
console.log(`PIX Key: ${testConfig.pixKey}`);
console.log(`Merchant Name: ${testConfig.merchantName}`);
console.log(`Merchant City: ${testConfig.merchantCity}`);
console.log(`Amount: ${testConfig.amount}`);
console.log(`User ID: ${testConfig.userId}`);

// Gerar código PIX
const pixCode = generatePixCode(testConfig);
console.log(`\n📱 Código PIX gerado:`);
console.log(pixCode);
console.log(`Tamanho: ${pixCode.length} caracteres`);

// Validar código
const validation = validatePixCode(pixCode);
console.log(`\n✅ Resultado da validação:`);
console.log(`Válido: ${validation.isValid ? '✅ SIM' : '❌ NÃO'}`);

if (validation.errors.length > 0) {
  console.log('\n❌ Erros encontrados:');
  validation.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
}

if (validation.warnings.length > 0) {
  console.log('\n⚠️ Avisos:');
  validation.warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning}`);
  });
}

// Analisar estrutura
analyzePixStructure(pixCode);

console.log('\n🎯 CONCLUSÃO:');
if (validation.isValid) {
  console.log('✅ O código PIX está válido e deve funcionar!');
} else {
  console.log('❌ O código PIX tem problemas que precisam ser corrigidos.');
  console.log('💡 Verifique os erros listados acima.');
}