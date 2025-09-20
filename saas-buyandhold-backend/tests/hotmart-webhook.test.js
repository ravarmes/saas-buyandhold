const request = require('supertest');
const app = require('../server'); // Usando o server.js principal
const { User, Subscription, PaymentTransaction, WebhookEventLog } = require('../src/models');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Mock do logger para evitar logs durante os testes
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Hotmart Webhook Integration Tests', () => {
  let testUser;
  let authToken;
  const webhookSecret = process.env.HOTMART_WEBHOOK_SECRET || 'test-secret-key';

  // Helper para gerar assinatura HMAC
  const generateSignature = (payload) => {
    return crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  };

  // Helper para criar payload base da Hotmart
  const createBasePayload = (eventType, overrides = {}) => {
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: eventType,
      version: '2.0.0',
      date_created: new Date().toISOString(),
      data: {
        product: {
          id: 123456,
          name: 'Assinatura Premium SaaS',
          ucode: 'premium-saas'
        },
        buyer: {
          email: 'test@example.com',
          name: 'João Silva',
          checkout_phone: '+5511999999999'
        },
        purchase: {
          transaction: `TXN_${Date.now()}`,
          status: 'APPROVED',
          payment: {
            method: 'CREDIT_CARD',
            installments_number: 1,
            type: 'CREDIT_CARD'
          },
          price: {
            value: 29.90,
            currency_value: 'BRL'
          },
          approved_date: new Date().toISOString()
        },
        subscription: {
          id: `SUB_${Date.now()}`,
          status: 'ACTIVE',
          date_next_charge: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        ...overrides
      }
    };
  };

  beforeAll(async () => {
    // Configurar banco de dados de teste
    await User.sync({ force: true });
    await Subscription.sync({ force: true });
    await PaymentTransaction.sync({ force: true });
    await WebhookEventLog.sync({ force: true });
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await WebhookEventLog.destroy({ where: {} });
    await PaymentTransaction.destroy({ where: {} });
    await Subscription.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Criar usuário de teste
    testUser = await User.create({
      email: 'test@example.com',
      name: 'João Silva',
      password: 'hashedpassword',
      userType: 'comum'
    });

    // Gerar token de autenticação
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-jwt-secret'
    );
  });

  afterAll(async () => {
    // Limpar após todos os testes
    await WebhookEventLog.destroy({ where: {} });
    await PaymentTransaction.destroy({ where: {} });
    await Subscription.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('POST /api/payments/hotmart/webhook', () => {
    test('deve processar pagamento aprovado com cartão de crédito', async () => {
      const payload = createBasePayload('PURCHASE_APPROVED', {
        purchase: {
          transaction: 'TXN_CREDIT_001',
          status: 'APPROVED',
          payment: {
            method: 'CREDIT_CARD',
            installments_number: 1,
            type: 'CREDIT_CARD'
          },
          price: {
            value: 29.90,
            currency_value: 'BRL'
          },
          approved_date: new Date().toISOString()
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar se o evento foi registrado
      const eventLog = await WebhookEventLog.findOne({
        where: { eventId: payload.id }
      });
      expect(eventLog).toBeTruthy();
      expect(eventLog.status).toBe('processed');

      // Verificar se a transação foi criada
      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: payload.data.purchase.transaction }
      });
      expect(transaction).toBeTruthy();
      expect(transaction.status).toBe('approved');
      expect(transaction.paymentMethod).toBe('credit_card');
      expect(transaction.amount).toBe(29.90);

      // Verificar se a assinatura foi criada/atualizada
      const subscription = await Subscription.findOne({
        where: { userId: testUser.id }
      });
      expect(subscription).toBeTruthy();
      expect(subscription.status).toBe('active');
      expect(subscription.paymentMethod).toBe('credit_card');
    });

    test('deve processar pagamento aprovado com PIX', async () => {
      const payload = createBasePayload('PURCHASE_APPROVED', {
        purchase: {
          transaction: 'TXN_PIX_001',
          status: 'APPROVED',
          payment: {
            method: 'PIX',
            type: 'PIX'
          },
          price: {
            value: 29.90,
            currency_value: 'BRL'
          },
          approved_date: new Date().toISOString()
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response.status).toBe(200);

      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: payload.data.purchase.transaction }
      });
      expect(transaction.paymentMethod).toBe('pix');
    });

    test('deve processar pagamento aprovado com boleto', async () => {
      const payload = createBasePayload('PURCHASE_APPROVED', {
        purchase: {
          transaction: 'TXN_BOLETO_001',
          status: 'APPROVED',
          payment: {
            method: 'BILLET',
            type: 'BILLET'
          },
          price: {
            value: 29.90,
            currency_value: 'BRL'
          },
          approved_date: new Date().toISOString()
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response.status).toBe(200);

      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: payload.data.purchase.transaction }
      });
      expect(transaction.paymentMethod).toBe('boleto');
    });

    test('deve processar pagamento aprovado com PayPal', async () => {
      const payload = createBasePayload('PURCHASE_APPROVED', {
        purchase: {
          transaction: 'TXN_PAYPAL_001',
          status: 'APPROVED',
          payment: {
            method: 'PAYPAL',
            type: 'PAYPAL'
          },
          price: {
            value: 29.90,
            currency_value: 'BRL'
          },
          approved_date: new Date().toISOString()
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response.status).toBe(200);

      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: payload.data.purchase.transaction }
      });
      expect(transaction.paymentMethod).toBe('paypal');
    });

    test('deve processar cancelamento de compra', async () => {
      // Primeiro, criar uma assinatura ativa
      await Subscription.create({
        userId: testUser.id,
        status: 'active',
        paymentMethod: 'credit_card',
        hotmartSubscriptionId: 'SUB_CANCEL_TEST',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const payload = createBasePayload('PURCHASE_CANCELED', {
        subscription: {
          id: 'SUB_CANCEL_TEST',
          status: 'CANCELED'
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response.status).toBe(200);

      // Verificar se a assinatura foi cancelada
      const subscription = await Subscription.findOne({
        where: { hotmartSubscriptionId: 'SUB_CANCEL_TEST' }
      });
      expect(subscription.status).toBe('canceled');
    });

    test('deve processar reembolso', async () => {
      // Primeiro, criar uma transação e assinatura
      const transaction = await PaymentTransaction.create({
        userId: testUser.id,
        hotmartTransactionId: 'TXN_REFUND_TEST',
        status: 'approved',
        paymentMethod: 'credit_card',
        amount: 29.90,
        currency: 'BRL'
      });

      await Subscription.create({
        userId: testUser.id,
        status: 'active',
        paymentMethod: 'credit_card',
        hotmartSubscriptionId: 'SUB_REFUND_TEST'
      });

      const payload = createBasePayload('PURCHASE_REFUNDED', {
        purchase: {
          transaction: 'TXN_REFUND_TEST',
          status: 'REFUNDED'
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response.status).toBe(200);

      // Verificar se a transação foi marcada como reembolsada
      const updatedTransaction = await PaymentTransaction.findByPk(transaction.id);
      expect(updatedTransaction.status).toBe('refunded');
    });

    test('deve processar chargeback', async () => {
      const payload = createBasePayload('PURCHASE_CHARGEBACK', {
        purchase: {
          transaction: 'TXN_CHARGEBACK_TEST',
          status: 'CHARGEBACK'
        }
      });

      const signature = generateSignature(payload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response.status).toBe(200);

      // Verificar se uma nova transação de chargeback foi criada
      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: 'TXN_CHARGEBACK_TEST' }
      });
      expect(transaction.status).toBe('chargeback');
    });

    test('deve rejeitar webhook com assinatura inválida', async () => {
      const payload = createBasePayload('PURCHASE_APPROVED');
      const invalidSignature = 'invalid-signature';

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', invalidSignature)
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Assinatura inválida');
    });

    test('deve implementar idempotência - não processar evento duplicado', async () => {
      const payload = createBasePayload('PURCHASE_APPROVED');
      const signature = generateSignature(payload);

      // Primeiro webhook
      const response1 = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response1.status).toBe(200);

      // Segundo webhook (duplicado)
      const response2 = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(payload);

      expect(response2.status).toBe(200);
      expect(response2.body.message).toContain('já foi processado');

      // Verificar que apenas uma transação foi criada
      const transactionCount = await PaymentTransaction.count({
        where: { hotmartTransactionId: payload.data.purchase.transaction }
      });
      expect(transactionCount).toBe(1);
    });

    test('deve lidar com payload malformado', async () => {
      const invalidPayload = { invalid: 'data' };
      const signature = generateSignature(invalidPayload);

      const response = await request(app)
        .post('/api/payments/hotmart/webhook')
        .set('X-Hotmart-Hottok', signature)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Middleware requirePremium', () => {
    test('deve permitir acesso para usuário com assinatura ativa', async () => {
      // Criar assinatura ativa para o mês atual
      await Subscription.create({
        userId: testUser.id,
        status: 'active',
        paymentMethod: 'credit_card',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastPaymentDate: new Date()
      });

      // Assumindo que existe uma rota protegida /api/premium/test
      const response = await request(app)
        .get('/api/premium/test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(403);
    });

    test('deve bloquear acesso para usuário sem assinatura', async () => {
      const response = await request(app)
        .get('/api/premium/test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PREMIUM_REQUIRED');
    });

    test('deve bloquear acesso para usuário com assinatura expirada', async () => {
      // Criar assinatura expirada
      await Subscription.create({
        userId: testUser.id,
        status: 'active',
        paymentMethod: 'credit_card',
        currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastPaymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get('/api/premium/test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PREMIUM_REQUIRED');
    });
  });
});

// Testes unitários dos services
describe('SubscriptionService Unit Tests', () => {
  const SubscriptionService = require('../src/services/SubscriptionService');
  let subscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService();
  });

  describe('hasActiveSubscriptionForCurrentMonth', () => {
    test('deve retornar true para assinatura ativa no mês atual', async () => {
      // Mock do modelo
      const mockSubscription = {
        isActiveForCurrentMonth: jest.fn().mockReturnValue(true)
      };

      jest.spyOn(Subscription, 'findOne').mockResolvedValue(mockSubscription);

      const result = await subscriptionService.hasActiveSubscriptionForCurrentMonth('user-id');
      expect(result).toBe(true);
    });

    test('deve retornar false para usuário sem assinatura', async () => {
      jest.spyOn(Subscription, 'findOne').mockResolvedValue(null);

      const result = await subscriptionService.hasActiveSubscriptionForCurrentMonth('user-id');
      expect(result).toBe(false);
    });
  });
});

// Testes unitários do HotmartWebhookService
describe('HotmartWebhookService Unit Tests', () => {
  const webhookService = require('../src/services/HotmartWebhookService');

  beforeEach(() => {
    // O service já é uma instância exportada
  });

  describe('validateSignature', () => {
    test('deve validar assinatura correta', () => {
      const payload = { test: 'data' };
      const secret = 'test-secret';
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = webhookService.validateSignature(payload, validSignature, secret);
      expect(result).toBe(true);
    });

    test('deve rejeitar assinatura inválida', () => {
      const payload = { test: 'data' };
      const secret = 'test-secret';
      const invalidSignature = 'invalid-signature';

      const result = webhookService.validateSignature(payload, invalidSignature, secret);
      expect(result).toBe(false);
    });
  });

  describe('extractPaymentMethod', () => {
    test('deve extrair método de pagamento corretamente', () => {
      const testCases = [
        { input: 'CREDIT_CARD', expected: 'credit_card' },
        { input: 'PIX', expected: 'pix' },
        { input: 'BILLET', expected: 'boleto' },
        { input: 'PAYPAL', expected: 'paypal' },
        { input: 'UNKNOWN', expected: 'other' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = webhookService.extractPaymentMethod({ method: input });
        expect(result).toBe(expected);
      });
    });
  });

  describe('handleSubscriptionPaymentSuccess', () => {
    let testUser, testSubscription;

    beforeEach(async () => {
      // Criar usuário de teste
      testUser = await User.create({
        email: 'subscription@test.com',
        name: 'Usuário Assinatura',
        planType: 'premium',
        subscriptionStatus: 'active'
      });

      // Criar assinatura de teste
      testSubscription = await Subscription.create({
        userId: testUser.id,
        planType: 'premium',
        status: 'active',
        paymentMethod: 'hotmart',
        amount: 15.00,
        currency: 'BRL',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isRecurring: true
      });
    });

    test('deve processar pagamento recorrente com sucesso para usuário existente', async () => {
      const payload = {
        event: 'subscription.payment_success',
        data: {
          buyer: {
            email: testUser.email,
            name: 'Usuário Assinatura'
          },
          product: {
            id: 123456,
            name: 'Assinatura Premium'
          },
          transaction: {
            id: 'TXN_RECURRING_001',
            value: 15.00,
            approval_date: new Date().toISOString(),
            payment_method: 'CREDIT_CARD'
          },
          subscription: {
            id: 'SUB_RECURRING_001',
            price: 15.00
          }
        }
      };

      const result = await webhookService.handleSubscriptionPaymentSuccess(payload);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Pagamento recorrente processado com sucesso');
      expect(result.userId).toBe(testUser.id);

      // Verificar se a transação foi criada
      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: 'TXN_RECURRING_001' }
      });
      expect(transaction).toBeTruthy();
      expect(transaction.eventType).toBe('SUBSCRIPTION_PAYMENT_SUCCESS');
      expect(transaction.status).toBe('approved');
      expect(transaction.amount).toBe(15.00);

      // Verificar se a assinatura foi renovada
      await testSubscription.reload();
      expect(testSubscription.status).toBe('active');
      expect(testSubscription.isRecurring).toBe(true);
    });

    test('deve criar nova assinatura para usuário sem assinatura ativa', async () => {
      // Cancelar assinatura existente
      await testSubscription.update({ status: 'canceled' });

      const payload = {
        event: 'subscription.payment_success',
        data: {
          buyer: {
            email: testUser.email,
            name: 'Usuário Assinatura'
          },
          product: {
            id: 123456,
            name: 'Assinatura Premium'
          },
          transaction: {
            id: 'TXN_RECURRING_002',
            value: 15.00,
            approval_date: new Date().toISOString(),
            payment_method: 'PIX'
          },
          subscription: {
            id: 'SUB_RECURRING_002',
            price: 15.00
          }
        }
      };

      const result = await webhookService.handleSubscriptionPaymentSuccess(payload);

      expect(result.success).toBe(true);

      // Verificar se nova assinatura foi criada
      const newSubscription = await Subscription.findOne({
        where: {
          userId: testUser.id,
          status: 'active',
          paymentId: 'TXN_RECURRING_002'
        }
      });
      expect(newSubscription).toBeTruthy();
      expect(newSubscription.isRecurring).toBe(true);
      expect(newSubscription.planType).toBe('premium');
    });

    test('deve retornar erro para usuário não encontrado', async () => {
      const payload = {
        event: 'subscription.payment_success',
        data: {
          buyer: {
            email: 'naoexiste@test.com',
            name: 'Usuário Inexistente'
          },
          product: {
            id: 123456,
            name: 'Assinatura Premium'
          },
          transaction: {
            id: 'TXN_RECURRING_003',
            value: 15.00
          },
          subscription: {
            id: 'SUB_RECURRING_003'
          }
        }
      };

      const result = await webhookService.handleSubscriptionPaymentSuccess(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não encontrado');
    });

    test('deve lançar erro para payload inválido sem email', async () => {
      const payload = {
        event: 'subscription.payment_success',
        data: {
          buyer: {
            name: 'Usuário Sem Email'
          },
          subscription: {
            id: 'SUB_RECURRING_004'
          }
        }
      };

      await expect(webhookService.handleSubscriptionPaymentSuccess(payload))
        .rejects
        .toThrow('Email do comprador não encontrado no payload');
    });

    test('deve lançar erro para payload sem ID de assinatura', async () => {
      const payload = {
        event: 'subscription.payment_success',
        data: {
          buyer: {
            email: testUser.email,
            name: 'Usuário Teste'
          },
          subscription: {}
        }
      };

      await expect(webhookService.handleSubscriptionPaymentSuccess(payload))
        .rejects
        .toThrow('ID da assinatura não encontrado no payload');
    });

    test('deve processar payload com estrutura alternativa (sem data wrapper)', async () => {
      const payload = {
        buyer: {
          email: testUser.email,
          name: 'Usuário Assinatura'
        },
        product: {
          id: 123456,
          name: 'Assinatura Premium'
        },
        transaction: {
          id: 'TXN_RECURRING_005',
          value: 15.00,
          payment_method: 'BOLETO'
        },
        subscription: {
          id: 'SUB_RECURRING_005',
          price: 15.00
        }
      };

      const result = await webhookService.handleSubscriptionPaymentSuccess(payload);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(testUser.id);

      // Verificar se a transação foi criada com método de pagamento correto
      const transaction = await PaymentTransaction.findOne({
        where: { hotmartTransactionId: 'TXN_RECURRING_005' }
      });
      expect(transaction).toBeTruthy();
      expect(transaction.paymentMethod).toBe('boleto');
    });
  });
});