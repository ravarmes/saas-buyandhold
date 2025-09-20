// Mock dos modelos
jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Subscription: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  PaymentTransaction: {
    create: jest.fn()
  }
}));

const { User, Subscription, PaymentTransaction } = require('../src/models');
const webhookService = require('../src/services/HotmartWebhookService');

describe('HotmartWebhookService - handleSubscriptionPaymentSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve processar pagamento recorrente com sucesso para usuário existente', async () => {
    // Mock do usuário existente
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      update: jest.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        planType: 'premium',
        subscriptionStatus: 'active'
      })
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock da assinatura existente
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      status: 'active',
      endDate: new Date(),
      update: jest.fn().mockResolvedValue()
    };
    Subscription.findOne.mockResolvedValue(mockSubscription);

    // Mock da transação criada
    const mockTransaction = {
      id: 'txn-123',
      hotmartTransactionId: 'TXN_RECURRING_001',
      update: jest.fn().mockResolvedValue()
    };
    PaymentTransaction.create.mockResolvedValue(mockTransaction);

    const payload = {
      event: 'subscription.payment_success',
      data: {
        buyer: {
          email: 'test@example.com',
          name: 'Usuário Teste'
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
    expect(result.userId).toBe('user-123');
    expect(result.subscriptionId).toBe('sub-123');
    expect(result.transactionId).toBe('txn-123');

    // Verificar se os métodos foram chamados
    expect(User.findOne).toHaveBeenCalledWith({
      where: { email: 'test@example.com' }
    });
    expect(PaymentTransaction.create).toHaveBeenCalled();
    expect(mockSubscription.update).toHaveBeenCalled();
    expect(mockUser.update).toHaveBeenCalledWith({
      planType: 'premium',
      subscriptionStatus: 'active'
    });
  });

  test('deve criar nova assinatura para usuário sem assinatura ativa', async () => {
    // Mock do usuário existente
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      update: jest.fn().mockResolvedValue()
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock de nenhuma assinatura ativa encontrada
    Subscription.findOne.mockResolvedValue(null);

    // Mock da nova assinatura criada
    const mockNewSubscription = {
      id: 'sub-new-123',
      userId: 'user-123',
      status: 'active'
    };
    Subscription.create.mockResolvedValue(mockNewSubscription);

    // Mock da transação criada
    const mockTransaction = {
      id: 'txn-new-123',
      hotmartTransactionId: 'TXN_RECURRING_002',
      amount: 15.00,
      update: jest.fn().mockResolvedValue()
    };
    PaymentTransaction.create.mockResolvedValue(mockTransaction);

    const payload = {
      data: {
        buyer: {
          email: 'test@example.com',
          name: 'Usuário Teste'
        },
        product: {
          id: 123456,
          name: 'Assinatura Premium'
        },
        transaction: {
          id: 'TXN_RECURRING_002',
          value: 15.00,
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
    expect(result.userId).toBe('user-123');
    expect(result.subscriptionId).toBe('sub-new-123');
    expect(result.transactionId).toBe('txn-new-123');

    // Verificar se nova assinatura foi criada
    expect(Subscription.create).toHaveBeenCalledWith({
      userId: 'user-123',
      planType: 'premium',
      status: 'active',
      paymentMethod: 'hotmart',
      amount: 15.00,
      currency: 'BRL',
      startDate: expect.any(Date),
      paymentId: 'TXN_RECURRING_002',
      isRecurring: true
    });
  });

  test('deve retornar erro para usuário não encontrado', async () => {
    // Mock de usuário não encontrado
    User.findOne.mockResolvedValue(null);

    const payload = {
      data: {
        buyer: {
          email: 'naoexiste@test.com',
          name: 'Usuário Inexistente'
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
      data: {
        buyer: {
          email: 'test@example.com',
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
    // Mock do usuário existente
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      update: jest.fn().mockResolvedValue()
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock da assinatura existente
    const mockSubscription = {
      id: 'sub-123',
      update: jest.fn().mockResolvedValue()
    };
    Subscription.findOne.mockResolvedValue(mockSubscription);

    // Mock da transação criada
    const mockTransaction = {
      id: 'txn-alt-123',
      hotmartTransactionId: 'TXN_RECURRING_005',
      update: jest.fn().mockResolvedValue()
    };
    PaymentTransaction.create.mockResolvedValue(mockTransaction);

    const payload = {
      buyer: {
        email: 'test@example.com',
        name: 'Usuário Teste'
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
    expect(result.userId).toBe('user-123');
    expect(result.subscriptionId).toBe('sub-123');
    expect(result.transactionId).toBe('txn-alt-123');

    // Verificar se a transação foi criada com método de pagamento correto
    expect(PaymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'boleto'
      })
    );
  });
});