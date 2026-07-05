// Mock helpers for database and external services

const createMockQueryBuilder = () => ({
  findFirst: jest.fn(),
  findMany: jest.fn(),
});

export const mockDb = {
  query: {
    motorcycles: createMockQueryBuilder(),
    servicePoints: createMockQueryBuilder(),
    services: createMockQueryBuilder(),
    news: createMockQueryBuilder(),
  },
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([]),
          }),
        }),
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
  insert: jest.fn(() => ({
    values: jest.fn().mockReturnValue({
      returning: jest.fn(),
    }),
  })),
  update: jest.fn(() => ({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn(),
      }),
    }),
  })),
  delete: jest.fn(() => ({
    where: jest.fn(),
  })),
};

export const mockDbPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
};

export const createMockMotorcycle = (overrides = {}) => ({
  id: '019c7d42-15dc-7000-8000-000000000001',
  slug: 'mt-09',
  name: 'MT-09',
  category: 'Hyper Naked',
  year: 2024,
  price: '42500000.00',
  currency: 'COP',
  description: 'La MT-09 es una motocicleta Hyper Naked de alto rendimiento.',
  fullDescription: null,
  engine: { type: '3 cilindros en línea', displacement: '890cc', power: '119 HP', torque: '93 Nm' },
  features: ['ABS', 'Quickshifter'],
  colors: ['Azul Yamaha', 'Negro'],
  images: { main: 'https://example.com/mt09.jpg', gallery: [] },
  specs: { weight: '189 kg' },
  available: true,
  featured: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockDbPool.query.mockReset();
  mockRedisClient.get.mockReset();
  mockRedisClient.set.mockReset();
  mockRedisClient.setex.mockReset();
  mockRedisClient.del.mockReset();
  mockRedisClient.ping.mockReset();
};
