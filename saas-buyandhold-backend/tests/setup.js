// Mock do Sequelize e modelos
jest.mock('../src/models', () => {
  const mockModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    reload: jest.fn()
  };

  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      sync: jest.fn().mockResolvedValue(),
      transaction: jest.fn().mockImplementation((callback) => {
        return callback({
          commit: jest.fn(),
          rollback: jest.fn()
        });
      })
    },
    User: mockModel,
    Subscription: mockModel,
    PaymentTransaction: mockModel,
    WebhookEventLog: mockModel
  };
});

// Mock do logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Mock das variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.HOTMART_WEBHOOK_SECRET = 'test-secret-key';
process.env.JWT_SECRET = 'test-jwt-secret';