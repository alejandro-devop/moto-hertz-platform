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
import { BadRequestError, NotFoundError } from '../../../src/shared/errors';

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

  /* Papelera: `deleteMotorcycle` ya no borra, marca. Ver PATRON.md §«Soft delete». */
  describe('trashMotorcycle', () => {
    it('marks the motorcycle as deleted instead of removing the row', async () => {
      const motorcycle = createMockMotorcycle();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([motorcycle]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await motorcycleService.trashMotorcycle(motorcycle.id);

      expect(result).toBe(true);
      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(set.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it('is idempotent: trashing what is already in the trash does nothing', async () => {
      const motorcycle = createMockMotorcycle({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));

      await expect(motorcycleService.trashMotorcycle(motorcycle.id)).resolves.toBe(true);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the motorcycle does not exist', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(motorcycleService.deleteMotorcycle('missing-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('restoreMotorcycle', () => {
    it('clears deletedAt', async () => {
      const motorcycle = createMockMotorcycle({ deletedAt: new Date('2026-01-01') });
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...motorcycle, deletedAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await motorcycleService.restoreMotorcycle(motorcycle.id);

      expect(result.deletedAt).toBeNull();
      expect(set.mock.calls[0][0].deletedAt).toBeNull();
    });
  });

  describe('purgeMotorcycle', () => {
    it('deletes for real when the motorcycle is already in the trash', async () => {
      const motorcycle = createMockMotorcycle({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));
      mockDb.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce(undefined) });

      await expect(motorcycleService.purgeMotorcycle(motorcycle.id)).resolves.toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('refuses to skip the trash', async () => {
      const motorcycle = createMockMotorcycle();
      mockDb.select.mockReturnValueOnce(createQueryMock([motorcycle]));

      await expect(motorcycleService.purgeMotorcycle(motorcycle.id)).rejects.toThrow(
        BadRequestError
      );
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
});
