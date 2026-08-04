/**
 * Lo que importa comprobar aquí no es que Drizzle sepa insertar: es que el
 * progreso de un usuario no se pise con el de otro y que marcar visto dos
 * veces actualice en vez de duplicar.
 */

function createQueryMock(result: unknown) {
  const mock: any = {
    from: jest.fn(() => mock),
    where: jest.fn(() => mock),
    limit: jest.fn(() => mock),
    values: jest.fn(() => mock),
    set: jest.fn(() => mock),
    returning: jest.fn(() => Promise.resolve(result)),
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

import { tourService } from '../../../src/services/tour.service';

const filaVista = {
  id: '019c7d42-15dc-7000-8000-000000000001',
  userId: '1',
  tourKey: 'panel.bienvenida',
  version: 1,
  status: 'completed' as const,
  seenAt: new Date('2026-08-03T10:00:00Z'),
};

describe('tourService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTourProgress', () => {
    it('devuelve el progreso del usuario', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([filaVista]));

      const result = await tourService.listTourProgress('1');

      expect(result).toEqual([filaVista]);
    });

    it('un usuario sin recorridos vistos devuelve lista vacía, no error', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(tourService.listTourProgress('99')).resolves.toEqual([]);
    });
  });

  describe('markTourSeen', () => {
    it('inserta cuando el recorrido nunca se había visto', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));
      const insertMock = createQueryMock([filaVista]);
      mockDb.insert.mockReturnValueOnce(insertMock);

      const result = await tourService.markTourSeen({
        userId: '1',
        tourKey: 'panel.bienvenida',
        version: 1,
        status: 'completed',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
      expect(insertMock.values).toHaveBeenCalledWith({
        userId: '1',
        tourKey: 'panel.bienvenida',
        version: 1,
        status: 'completed',
      });
      expect(result).toEqual(filaVista);
    });

    /* El caso de «volver a verlo tras un reinicio», y también el de dos
       pestañas abiertas marcando lo mismo: actualiza, no duplica. */
    it('actualiza la fila existente en vez de crear otra', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([{ id: filaVista.id }]));
      const updateMock = createQueryMock([{ ...filaVista, version: 2, status: 'skipped' }]);
      mockDb.update.mockReturnValueOnce(updateMock);

      const result = await tourService.markTourSeen({
        userId: '1',
        tourKey: 'panel.bienvenida',
        version: 2,
        status: 'skipped',
      });

      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(updateMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2, status: 'skipped' })
      );
      expect(result.version).toBe(2);
    });
  });

  describe('resetTourProgress', () => {
    it('devuelve cuántos recorridos reinició', async () => {
      mockDb.delete.mockReturnValueOnce(createQueryMock([{ id: 'a' }, { id: 'b' }]));

      await expect(tourService.resetTourProgress({ userId: '1' })).resolves.toBe(2);
    });

    /* Para que el panel pueda decir «no había nada que reiniciar» en vez de un
       «listo» que no hizo nada. */
    it('devuelve 0 cuando no había nada que borrar', async () => {
      mockDb.delete.mockReturnValueOnce(createQueryMock([]));

      await expect(
        tourService.resetTourProgress({ userId: '1', tourKey: 'motos.lista' })
      ).resolves.toBe(0);
    });
  });
});
