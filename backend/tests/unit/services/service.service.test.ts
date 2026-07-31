import { createMockService } from '../../helpers/mocks';

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

import { serviceService } from '../../../src/services/service.service';
import { BadRequestError, NotFoundError } from '../../../src/shared/errors';

describe('serviceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getServiceBySlug', () => {
    it('returns the service when found', async () => {
      const servicio = createMockService();
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));

      const result = await serviceService.getServiceBySlug('mantenimiento-preventivo');

      expect(result).toEqual(servicio);
    });

    it('throws NotFoundError when no service matches', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(serviceService.getServiceBySlug('unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listServices', () => {
    it('returns a paginated collection', async () => {
      const servicio = createMockService();
      mockDb.select
        .mockReturnValueOnce(createQueryMock([servicio]))
        .mockReturnValueOnce(createQueryMock([{ value: 1 }]));

      const result = await serviceService.listServices({ page: 1, limit: 50 });

      expect(result).toEqual({
        services: [servicio],
        page: 1,
        limit: 50,
        total: 1,
      });
    });
  });

  /* El precio se normaliza al guardar para que en la base no queden dos formas
     de decir lo mismo. Ver `ServicePricing`. */
  describe('createService · precio', () => {
    function capturarInsert(servicio: unknown) {
      const values = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([servicio]),
      });
      mockDb.insert.mockReturnValueOnce({ values });
      return values;
    }

    it('keeps the amount for DESDE and forces COP', async () => {
      const servicio = createMockService();
      const values = capturarInsert(servicio);

      await serviceService.createService({
        slug: servicio.slug,
        name: servicio.name,
        pricing: { mode: 'DESDE', amount: 150000, currency: 'USD' as 'COP', note: ' cada 5.000 km ' },
      });

      expect(values.mock.calls[0][0].pricing).toEqual({
        mode: 'DESDE',
        amount: 150000,
        currency: 'COP',
        note: 'cada 5.000 km',
      });
    });

    it('drops the amount when the price is A_CONVENIR', async () => {
      const servicio = createMockService();
      const values = capturarInsert(servicio);

      await serviceService.createService({
        slug: servicio.slug,
        name: servicio.name,
        pricing: { mode: 'A_CONVENIR', amount: 999, currency: 'COP' },
      });

      expect(values.mock.calls[0][0].pricing).toEqual({ mode: 'A_CONVENIR', currency: 'COP' });
    });

    it('drops empty rows from features and benefits', async () => {
      const servicio = createMockService();
      const values = capturarInsert(servicio);

      await serviceService.createService({
        slug: servicio.slug,
        name: servicio.name,
        features: ['  Cambio de aceite  ', '   ', 'Revisión de frenos'],
        benefits: [],
      });

      expect(values.mock.calls[0][0].features).toEqual([
        'Cambio de aceite',
        'Revisión de frenos',
      ]);
      expect(values.mock.calls[0][0].benefits).toEqual([]);
    });
  });

  describe('updateService', () => {
    it('leaves untouched columns alone (undefined never overwrites)', async () => {
      const servicio = createMockService();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([servicio]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));
      mockDb.update.mockReturnValueOnce({ set });

      await serviceService.updateService(servicio.id, { name: 'Otro nombre' });

      const cambios = set.mock.calls[0][0];
      expect(cambios.name).toBe('Otro nombre');
      expect(cambios.features).toBeUndefined();
      expect(cambios.pricing).toBeUndefined();
    });
  });

  /* Papelera: `deleteService` no borra, marca. PATRON.md §1.1. */
  describe('trashService', () => {
    it('marks the service as deleted instead of removing the row', async () => {
      const servicio = createMockService();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([servicio]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await serviceService.trashService(servicio.id);

      expect(result).toBe(true);
      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(set.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it('is idempotent: trashing what is already in the trash does nothing', async () => {
      const servicio = createMockService({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));

      await expect(serviceService.trashService(servicio.id)).resolves.toBe(true);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the service does not exist', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(serviceService.deleteService('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('restoreService', () => {
    it('clears deletedAt', async () => {
      const servicio = createMockService({ deletedAt: new Date('2026-01-01') });
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...servicio, deletedAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await serviceService.restoreService(servicio.id);

      expect(result.deletedAt).toBeNull();
      expect(set.mock.calls[0][0].deletedAt).toBeNull();
    });
  });

  describe('purgeService', () => {
    it('deletes for real when the service is already in the trash', async () => {
      const servicio = createMockService({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));
      mockDb.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce(undefined) });

      await expect(serviceService.purgeService(servicio.id)).resolves.toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('refuses to skip the trash', async () => {
      const servicio = createMockService();
      mockDb.select.mockReturnValueOnce(createQueryMock([servicio]));

      await expect(serviceService.purgeService(servicio.id)).rejects.toThrow(BadRequestError);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
});
