import { createMockServicePoint } from '../../helpers/mocks';

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

import { servicePointService } from '../../../src/services/service-point.service';
import { BadRequestError, NotFoundError } from '../../../src/shared/errors';

describe('servicePointService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getServicePointBySlug', () => {
    it('returns the service point when found', async () => {
      const punto = createMockServicePoint();
      mockDb.select.mockReturnValueOnce(createQueryMock([punto]));

      const result = await servicePointService.getServicePointBySlug('san-diego');

      expect(result).toEqual(punto);
    });

    it('throws NotFoundError when no service point matches', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(servicePointService.getServicePointBySlug('unknown')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('listServicePoints', () => {
    it('returns a paginated collection', async () => {
      const punto = createMockServicePoint();
      mockDb.select
        .mockReturnValueOnce(createQueryMock([punto]))
        .mockReturnValueOnce(createQueryMock([{ value: 1 }]));

      const result = await servicePointService.listServicePoints({ page: 1, limit: 50 });

      expect(result).toEqual({
        servicePoints: [punto],
        page: 1,
        limit: 50,
        total: 1,
      });
    });
  });

  /* La ubicación se pega como enlace: las coordenadas se derivan de ahí y
     nunca llegan de afuera. Ver `shared/geo/maps-url.ts`. */
  describe('createServicePoint', () => {
    function capturarInsert(punto: unknown) {
      const values = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([punto]),
      });
      mockDb.insert.mockReturnValueOnce({ values });
      return values;
    }

    it('derives lat/lng from the pasted Google Maps link', async () => {
      const punto = createMockServicePoint();
      const values = capturarInsert(punto);

      await servicePointService.createServicePoint({
        slug: punto.slug,
        name: punto.name,
        type: 'SEDE',
        location: { mapsUrl: 'https://www.google.com/maps/@6.2450,-75.5680,17z' },
      });

      expect(values.mock.calls[0][0].location).toEqual({
        mapsUrl: 'https://www.google.com/maps/@6.2450,-75.5680,17z',
        lat: 6.245,
        lng: -75.568,
      });
    });

    it('keeps the link without coordinates when it has none', async () => {
      const punto = createMockServicePoint();
      const values = capturarInsert(punto);

      await servicePointService.createServicePoint({
        slug: punto.slug,
        name: punto.name,
        type: 'SEDE',
        location: { mapsUrl: 'https://maps.app.goo.gl/abc123' },
      });

      expect(values.mock.calls[0][0].location).toEqual({
        mapsUrl: 'https://maps.app.goo.gl/abc123',
      });
    });
  });

  /* Papelera: `deleteServicePoint` no borra, marca. PATRON.md §1.1. */
  describe('trashServicePoint', () => {
    it('marks the service point as deleted instead of removing the row', async () => {
      const punto = createMockServicePoint();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([punto]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([punto]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await servicePointService.trashServicePoint(punto.id);

      expect(result).toBe(true);
      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(set.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it('is idempotent: trashing what is already in the trash does nothing', async () => {
      const punto = createMockServicePoint({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([punto]));

      await expect(servicePointService.trashServicePoint(punto.id)).resolves.toBe(true);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the service point does not exist', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(servicePointService.deleteServicePoint('missing-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('restoreServicePoint', () => {
    it('clears deletedAt', async () => {
      const punto = createMockServicePoint({ deletedAt: new Date('2026-01-01') });
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...punto, deletedAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([punto]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await servicePointService.restoreServicePoint(punto.id);

      expect(result.deletedAt).toBeNull();
      expect(set.mock.calls[0][0].deletedAt).toBeNull();
    });
  });

  describe('purgeServicePoint', () => {
    it('deletes for real when the service point is already in the trash', async () => {
      const punto = createMockServicePoint({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([punto]));
      mockDb.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce(undefined) });

      await expect(servicePointService.purgeServicePoint(punto.id)).resolves.toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('refuses to skip the trash', async () => {
      const punto = createMockServicePoint();
      mockDb.select.mockReturnValueOnce(createQueryMock([punto]));

      await expect(servicePointService.purgeServicePoint(punto.id)).rejects.toThrow(
        BadRequestError
      );
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
});
