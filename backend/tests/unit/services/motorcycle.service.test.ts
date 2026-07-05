import { createMockMotorcycle } from '../../helpers/mocks';

function createQueryMock(result: unknown) {
  const mock: any = {
    from: jest.fn(() => mock),
    where: jest.fn(() => mock),
    orderBy: jest.fn(() => mock),
    limit: jest.fn(() => mock),
    offset: jest.fn(() => mock),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
  return mock;
}

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../../src/shared/database/drizzle', () => ({
  getDb: () => mockDb,
}));

import { motorcycleService } from '../../../src/services/motorcycle.service';
import { NotFoundError } from '../../../src/shared/errors';

describe('motorcycleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMotorcycleBySlug', () => {
    it('returns the motorcycle when found', async () => {
      const motorcycle = createMockMotorcycle();
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));

      const result = await motorcycleService.getMotorcycleBySlug('mt-09');

      expect(result).toEqual(motorcycle);
    });

    it('throws NotFoundError when no motorcycle matches', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(motorcycleService.getMotorcycleBySlug('unknown')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('listMotorcycles', () => {
    it('returns a paginated collection', async () => {
      const motorcycle = createMockMotorcycle();
      mockDb.select
        .mockReturnValueOnce(createQueryMock([motorcycle]))
        .mockReturnValueOnce(createQueryMock([{ value: 1 }]));

      const result = await motorcycleService.listMotorcycles({ page: 1, limit: 20 });

      expect(result).toEqual({
        motorcycles: [motorcycle],
        page: 1,
        limit: 20,
        total: 1,
      });
    });
  });

  describe('createMotorcycle', () => {
    it('inserts and returns the created motorcycle', async () => {
      const motorcycle = createMockMotorcycle();
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([motorcycle]),
        }),
      });

      const result = await motorcycleService.createMotorcycle({
        slug: motorcycle.slug,
        name: motorcycle.name,
      });

      expect(result).toEqual(motorcycle);
    });
  });

  describe('deleteMotorcycle', () => {
    it('deletes an existing motorcycle', async () => {
      const motorcycle = createMockMotorcycle();
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));
      mockDb.delete.mockReturnValueOnce({
        where: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await motorcycleService.deleteMotorcycle(motorcycle.id);

      expect(result).toBe(true);
    });

    it('throws NotFoundError when the motorcycle does not exist', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(motorcycleService.deleteMotorcycle('missing-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
