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

export const createMockServicePoint = (overrides = {}) => ({
  id: '019c7d42-15dc-7000-8000-000000000101',
  slug: 'san-diego',
  name: 'Sede San Diego',
  type: 'SEDE',
  address: {
    street: 'Carrera 46 No 36-16',
    neighborhood: 'San Diego',
    city: 'Medellín',
    state: 'Antioquia',
  },
  phone: '+57 604 262 85 41',
  whatsapp: '+57 318 716 66 13',
  email: null,
  location: { mapsUrl: 'https://www.google.com/maps/@6.2400,-75.5700,17z', lat: 6.24, lng: -75.57 },
  hours: { monday: { open: '09:15', close: '17:00' } },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createMockService = (overrides = {}) => ({
  id: '019c7d42-15dc-7000-8000-000000000201',
  slug: 'mantenimiento-preventivo',
  name: 'Mantenimiento preventivo',
  category: 'Mantenimiento',
  shortDescription: 'Revisión programada para que la moto no se quede tirada.',
  fullDescription: null,
  icon: 'wrench',
  features: ['Cambio de aceite y filtro', 'Revisión de frenos'],
  benefits: ['Previene averías costosas'],
  pricing: { mode: 'DESDE', amount: 150000, currency: 'COP', note: 'cada 5.000 km' },
  duration: '2-3 horas',
  featured: true,
  image: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createMockNews = (overrides = {}) => ({
  id: '019c7d42-15dc-7000-8000-000000000301',
  slug: 'yamaha-mt-10-2024-lanzamiento',
  title: 'Yamaha presenta la nueva MT-10 2024',
  excerpt: 'La icónica naked japonesa llega con mejoras en electrónica.',
  content: '<p>Yamaha Motor Corporation ha revelado la nueva generación.</p>',
  author: 'Carlos Rodríguez',
  category: 'Lanzamientos',
  publishedAt: new Date('2024-11-10T10:00:00Z'),
  featured: true,
  tags: ['MT-10', 'Naked', 'Lanzamiento'],
  image: 'https://example.com/mt-10.jpg',
  readTime: '5 min',
  createdAt: new Date('2024-11-10T10:00:00Z'),
  updatedAt: new Date('2024-11-10T10:00:00Z'),
  deletedAt: null,
  ...overrides,
});

export const createMockBanner = (overrides = {}) => ({
  id: '019c7d42-15dc-7000-8000-000000000401',
  title: 'Yamaha Oriente',
  subtitle: 'Descubre la nueva generación de motocicletas Yamaha.',
  image: 'https://example.com/banner-1.webp',
  imageMobile: null,
  link: '/motos',
  linkLabel: 'Explorar modelos',
  position: 0,
  active: true,
  startsAt: null,
  endsAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
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
