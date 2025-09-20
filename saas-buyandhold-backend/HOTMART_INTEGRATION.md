# Integração com Hotmart - Sistema de Assinaturas Premium

Este documento descreve a implementação completa da integração com a Hotmart para gerenciar assinaturas premium no sistema SaaS Buy&Hold.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configuração](#configuração)
4. [Modelos de Dados](#modelos-de-dados)
5. [Webhooks](#webhooks)
6. [Exemplos de Payloads](#exemplos-de-payloads)
7. [Testes](#testes)
8. [Deploy em Produção](#deploy-em-produção)
9. [Monitoramento](#monitoramento)
10. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

A integração permite:
- ✅ Receber webhooks da Hotmart para todos os métodos de pagamento (PIX, Cartão, Boleto, PayPal)
- ✅ Validar assinaturas HMAC para segurança
- ✅ Implementar idempotência para evitar processamento duplicado
- ✅ Gerenciar status de assinaturas (ativa, cancelada, expirada)
- ✅ Controlar acesso a funcionalidades premium
- ✅ Auditoria completa de transações

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Hotmart     │───▶│   Webhook API    │───▶│   Database      │
│   (Pagamentos)  │    │  /hotmart/webhook│    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Business Logic  │
                       │  - Validation    │
                       │  - Processing    │
                       │  - Idempotency   │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Frontend API   │
                       │ (Premium Access) │
                       └──────────────────┘
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

**Variáveis obrigatórias:**
```env
# Hotmart API
HOTMART_CLIENT_ID=seu_client_id
HOTMART_CLIENT_SECRET=seu_client_secret
HOTMART_WEBHOOK_SECRET=sua_chave_secreta_webhook

# Database
DB_HOST=localhost
DB_NAME=saas_buyandhold
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta
```

### 2. Instalação de Dependências

```bash
npm install
```

### 3. Executar Migrations

```bash
npx sequelize-cli db:migrate
```

### 4. Configurar Webhook na Hotmart

1. Acesse o painel da Hotmart
2. Vá em **Ferramentas > Webhooks**
3. Adicione a URL: `https://seudominio.com/api/payments/hotmart/webhook`
4. Configure a chave secreta (mesma do `HOTMART_WEBHOOK_SECRET`)
5. Selecione os eventos:
   - ✅ Compra aprovada
   - ✅ Compra cancelada
   - ✅ Compra reembolsada
   - ✅ Chargeback
   - ✅ Assinatura cancelada

## 🗄️ Modelos de Dados

### User
```javascript
// Campos adicionais para integração
userType: 'comum' | 'premium'
```

### Subscription
```javascript
{
  id: UUID,
  userId: UUID,
  status: 'active' | 'canceled' | 'expired',
  paymentMethod: 'credit_card' | 'pix' | 'boleto' | 'paypal',
  hotmartSubscriptionId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  lastPaymentDate: Date,
  nextBillingDate: Date,
  isRecurring: Boolean
}
```

### PaymentTransaction
```javascript
{
  id: UUID,
  userId: UUID,
  subscriptionId: UUID,
  hotmartTransactionId: String,
  status: 'pending' | 'approved' | 'canceled' | 'refunded' | 'chargeback',
  paymentMethod: String,
  amount: Decimal,
  currency: String,
  processedAt: Date
}
```

### WebhookEventLog
```javascript
{
  id: UUID,
  eventId: String, // ID único do evento Hotmart
  source: 'hotmart',
  eventType: String,
  status: 'received' | 'processing' | 'processed' | 'failed',
  rawPayload: JSON,
  signature: String,
  processedAt: Date
}
```

## 🔗 Webhooks

### Endpoint Principal
```
POST /api/payments/hotmart/webhook
```

### Headers Obrigatórios
```
Content-Type: application/json
X-Hotmart-Hottok: <assinatura_hmac_sha256>
```

### Fluxo de Processamento

1. **Validação de Assinatura**: Verifica HMAC SHA256
2. **Verificação de Idempotência**: Evita processamento duplicado
3. **Registro do Evento**: Salva no `WebhookEventLog`
4. **Processamento**: Atualiza `PaymentTransaction` e `Subscription`
5. **Resposta**: Retorna status 200 para a Hotmart

## 📝 Exemplos de Payloads

### Pagamento Aprovado - PIX
```json
{
  "id": "evt_1234567890",
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "date_created": "2024-01-15T10:30:00Z",
  "data": {
    "product": {
      "id": 123456,
      "name": "Assinatura Premium SaaS",
      "ucode": "premium-saas"
    },
    "buyer": {
      "email": "cliente@email.com",
      "name": "João Silva",
      "checkout_phone": "+5511999999999"
    },
    "purchase": {
      "transaction": "TXN_PIX_001",
      "status": "APPROVED",
      "payment": {
        "method": "PIX",
        "type": "PIX"
      },
      "price": {
        "value": 29.90,
        "currency_value": "BRL"
      },
      "approved_date": "2024-01-15T10:30:00Z"
    },
    "subscription": {
      "id": "SUB_123456",
      "status": "ACTIVE",
      "date_next_charge": "2024-02-15T10:30:00Z"
    }
  }
}
```

### Pagamento Aprovado - Cartão de Crédito
```json
{
  "id": "evt_1234567891",
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "date_created": "2024-01-15T11:00:00Z",
  "data": {
    "product": {
      "id": 123456,
      "name": "Assinatura Premium SaaS",
      "ucode": "premium-saas"
    },
    "buyer": {
      "email": "cliente@email.com",
      "name": "Maria Santos"
    },
    "purchase": {
      "transaction": "TXN_CARD_001",
      "status": "APPROVED",
      "payment": {
        "method": "CREDIT_CARD",
        "type": "CREDIT_CARD",
        "installments_number": 1
      },
      "price": {
        "value": 29.90,
        "currency_value": "BRL"
      },
      "approved_date": "2024-01-15T11:00:00Z"
    },
    "subscription": {
      "id": "SUB_123457",
      "status": "ACTIVE",
      "date_next_charge": "2024-02-15T11:00:00Z"
    }
  }
}
```

### Pagamento Aprovado - Boleto
```json
{
  "id": "evt_1234567892",
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "date_created": "2024-01-15T14:30:00Z",
  "data": {
    "product": {
      "id": 123456,
      "name": "Assinatura Premium SaaS"
    },
    "buyer": {
      "email": "cliente@email.com",
      "name": "Carlos Oliveira"
    },
    "purchase": {
      "transaction": "TXN_BOLETO_001",
      "status": "APPROVED",
      "payment": {
        "method": "BILLET",
        "type": "BILLET"
      },
      "price": {
        "value": 29.90,
        "currency_value": "BRL"
      },
      "approved_date": "2024-01-15T14:30:00Z"
    }
  }
}
```

### Cancelamento de Compra
```json
{
  "id": "evt_1234567893",
  "event": "PURCHASE_CANCELED",
  "version": "2.0.0",
  "date_created": "2024-01-20T09:15:00Z",
  "data": {
    "product": {
      "id": 123456,
      "name": "Assinatura Premium SaaS"
    },
    "buyer": {
      "email": "cliente@email.com",
      "name": "João Silva"
    },
    "purchase": {
      "transaction": "TXN_PIX_001",
      "status": "CANCELED"
    },
    "subscription": {
      "id": "SUB_123456",
      "status": "CANCELED"
    }
  }
}
```

### Reembolso
```json
{
  "id": "evt_1234567894",
  "event": "PURCHASE_REFUNDED",
  "version": "2.0.0",
  "date_created": "2024-01-25T16:45:00Z",
  "data": {
    "product": {
      "id": 123456,
      "name": "Assinatura Premium SaaS"
    },
    "buyer": {
      "email": "cliente@email.com",
      "name": "Maria Santos"
    },
    "purchase": {
      "transaction": "TXN_CARD_001",
      "status": "REFUNDED",
      "price": {
        "value": 29.90,
        "currency_value": "BRL"
      }
    }
  }
}
```

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Apenas testes de webhook
npm test -- --grep "Hotmart Webhook"

# Com coverage
npm run test:coverage
```

### Testes Manuais

1. **Teste de Assinatura HMAC**:
```bash
curl -X POST http://localhost:3000/api/payments/hotmart/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: sua_assinatura_hmac" \
  -d '{"test": "payload"}'
```

2. **Teste de Idempotência**:
   - Envie o mesmo payload duas vezes
   - Verifique que apenas uma transação é criada

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] **Configuração de Ambiente**
  - [ ] Variáveis de ambiente configuradas
  - [ ] Banco de dados PostgreSQL configurado
  - [ ] Migrations executadas
  - [ ] SSL/HTTPS configurado

- [ ] **Configuração da Hotmart**
  - [ ] Webhook URL configurada (HTTPS obrigatório)
  - [ ] Chave secreta configurada
  - [ ] Eventos selecionados
  - [ ] Produto configurado corretamente

- [ ] **Segurança**
  - [ ] Chaves secretas seguras (mínimo 32 caracteres)
  - [ ] Rate limiting configurado
  - [ ] CORS configurado adequadamente
  - [ ] Headers de segurança configurados

- [ ] **Monitoramento**
  - [ ] Logs configurados
  - [ ] Alertas configurados
  - [ ] Health checks implementados
  - [ ] Métricas de performance

- [ ] **Backup e Recovery**
  - [ ] Backup automático do banco
  - [ ] Plano de rollback definido
  - [ ] Documentação de recovery

### Configuração de Produção

```env
# Produção
NODE_ENV=production
HOTMART_API_URL=https://api-sec-vlc.hotmart.com
WEBHOOK_URL=https://seudominio.com/api/payments/hotmart/webhook

# Segurança
HOTMART_WEBHOOK_SECRET=sua_chave_super_secreta_de_32_caracteres_ou_mais
JWT_SECRET=sua_chave_jwt_super_secreta_de_32_caracteres_ou_mais

# Database (usar connection pool)
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name seudominio.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/payments/hotmart/webhook {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings for webhook
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

## 📊 Monitoramento

### Métricas Importantes

1. **Webhooks**:
   - Taxa de sucesso de processamento
   - Tempo de resposta
   - Eventos duplicados detectados
   - Falhas de validação de assinatura

2. **Assinaturas**:
   - Assinaturas ativas por mês
   - Taxa de cancelamento
   - Métodos de pagamento mais usados
   - Revenue mensal

3. **Performance**:
   - Tempo de resposta da API
   - Uso de CPU e memória
   - Conexões de banco de dados
   - Erros 5xx

### Logs Importantes

```javascript
// Webhook recebido
logger.info('Webhook received', {
  eventId: payload.id,
  eventType: payload.event,
  userId: user.id,
  transactionId: payload.data.purchase.transaction
});

// Pagamento processado
logger.info('Payment processed', {
  userId: user.id,
  transactionId: transaction.id,
  amount: transaction.amount,
  paymentMethod: transaction.paymentMethod,
  subscriptionStatus: subscription.status
});

// Erro de processamento
logger.error('Webhook processing failed', {
  eventId: payload.id,
  error: error.message,
  stack: error.stack,
  payload: payload
});
```

### Alertas Recomendados

1. **Críticos**:
   - Taxa de erro de webhook > 5%
   - Falha na validação de assinatura
   - Banco de dados indisponível

2. **Importantes**:
   - Tempo de resposta > 5 segundos
   - Muitos eventos duplicados
   - Assinaturas não processadas

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Webhook não está sendo recebido

**Possíveis causas:**
- URL do webhook incorreta na Hotmart
- Firewall bloqueando requisições
- SSL/HTTPS não configurado

**Solução:**
```bash
# Verificar se o endpoint está acessível
curl -I https://seudominio.com/api/payments/hotmart/webhook

# Verificar logs do servidor
tail -f logs/app.log | grep webhook
```

#### 2. Erro de validação de assinatura

**Possíveis causas:**
- Chave secreta incorreta
- Formato do payload alterado
- Encoding de caracteres

**Solução:**
```javascript
// Debug da assinatura
console.log('Received signature:', receivedSignature);
console.log('Calculated signature:', calculatedSignature);
console.log('Payload:', JSON.stringify(payload));
```

#### 3. Usuário não encontrado

**Possíveis causas:**
- Email no payload diferente do cadastrado
- Usuário não existe no sistema

**Solução:**
```javascript
// Criar usuário automaticamente se não existir
if (!user) {
  user = await User.create({
    email: payload.data.buyer.email,
    name: payload.data.buyer.name,
    userType: 'comum'
  });
}
```

#### 4. Eventos duplicados

**Verificação:**
```sql
SELECT event_id, COUNT(*) 
FROM webhook_event_logs 
GROUP BY event_id 
HAVING COUNT(*) > 1;
```

### Comandos Úteis

```bash
# Verificar status das assinaturas
psql -d saas_buyandhold -c "SELECT status, COUNT(*) FROM subscriptions GROUP BY status;"

# Verificar últimas transações
psql -d saas_buyandhold -c "SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;"

# Verificar eventos de webhook
psql -d saas_buyandhold -c "SELECT event_type, status, COUNT(*) FROM webhook_event_logs GROUP BY event_type, status;"

# Limpar logs antigos (mais de 30 dias)
psql -d saas_buyandhold -c "DELETE FROM webhook_event_logs WHERE created_at < NOW() - INTERVAL '30 days';"
```

## 📞 Suporte

Para dúvidas ou problemas:

1. **Documentação da Hotmart**: https://developers.hotmart.com/
2. **Logs da aplicação**: `logs/app.log`
3. **Monitoramento**: Dashboard de métricas
4. **Suporte técnico**: Abrir issue no repositório

---

**Última atualização**: Janeiro 2024
**Versão**: 1.0.0