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

const mockStorage = {
  name: 'local',
  put: jest.fn(),
  delete: jest.fn(),
  url: jest.fn(),
  exists: jest.fn(),
};

jest.mock('../../../src/shared/database/drizzle', () => ({ getDb: () => mockDb }));
jest.mock('../../../src/shared/storage', () => ({ getStorage: () => mockStorage }));
/* sharp no entra en un test unitario: se procesa de mentira y se comprueba
   que lo que llega a la base es lo que devolvió el procesador. */
jest.mock('../../../src/shared/images/process', () => ({
  ...jest.requireActual('../../../src/shared/images/process'),
  procesarImagen: jest.fn(),
}));

import { procesarImagen } from '../../../src/shared/images/process';
import { mediaService } from '../../../src/services/media.service';
import { BadRequestError, NotFoundError } from '../../../src/shared/errors';

const registro = {
  id: '019c7d42-15dc-7000-8000-0000000000aa',
  key: '2026/07/abc.webp',
  url: 'http://localhost:8080/media/2026/07/abc.webp',
  driver: 'local',
  mimeType: 'image/webp',
  sizeBytes: 4,
  width: 1600,
  height: 900,
  originalName: 'moto.jpg',
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-01'),
  deletedAt: null as Date | null,
};

function mockInsert(devuelve: unknown) {
  const values = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([devuelve]) });
  mockDb.insert.mockReturnValueOnce({ values });
  return values;
}

describe('mediaService', () => {
  /* `resetMocks` de jest.config borra las implementaciones entre tests, así que
     se vuelven a poner aquí. */
  beforeEach(() => {
    (procesarImagen as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('webp'),
      width: 1600,
      height: 900,
      mimeType: 'image/webp',
      extension: 'webp',
    });
    mockStorage.put.mockResolvedValue(undefined);
    mockStorage.delete.mockResolvedValue(undefined);
    mockStorage.url.mockImplementation((key: string) => `http://localhost:8080/media/${key}`);
    mockStorage.exists.mockResolvedValue(true);
  });

  describe('uploadMedia', () => {
    it('processes the image, stores it under a non-guessable key and records it', async () => {
      const values = mockInsert(registro);

      const result = await mediaService.uploadMedia({
        buffer: Buffer.from('jpeg'),
        mimeType: 'image/jpeg',
        originalName: 'moto.jpg',
      });

      expect(result).toEqual(registro);

      const key: string = mockStorage.put.mock.calls[0][0];
      expect(key).toMatch(/^\d{4}\/\d{2}\/[0-9a-f]{32}\.webp$/);

      const fila = values.mock.calls[0][0];
      expect(fila.mimeType).toBe('image/webp');
      expect(fila.width).toBe(1600);
      expect(fila.driver).toBe('local');
    });

    it('rejects anything that is not an image before touching the storage', async () => {
      await expect(
        mediaService.uploadMedia({
          buffer: Buffer.from('%PDF'),
          mimeType: 'application/pdf',
          originalName: 'ficha.pdf',
        })
      ).rejects.toThrow(BadRequestError);

      expect(mockStorage.put).not.toHaveBeenCalled();
    });

    it('removes the stored file when the row cannot be written', async () => {
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('db caída')),
        }),
      });

      await expect(
        mediaService.uploadMedia({ buffer: Buffer.from('jpeg'), mimeType: 'image/jpeg' })
      ).rejects.toThrow('db caída');

      expect(mockStorage.delete).toHaveBeenCalledWith(mockStorage.put.mock.calls[0][0]);
    });
  });

  describe('trashMedia', () => {
    it('marks the file as deleted without touching the storage', async () => {
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...registro, deletedAt: new Date() }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([registro]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await mediaService.trashMedia(registro.id);

      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for an unknown id', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));
      await expect(mediaService.trashMedia(registro.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('purgeMedia', () => {
    it('deletes the file and the row when it is already in the trash', async () => {
      mockDb.select.mockReturnValueOnce(
        createQueryMock([{ ...registro, deletedAt: new Date('2026-07-02') }])
      );
      mockDb.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValue(undefined) });

      await expect(mediaService.purgeMedia(registro.id)).resolves.toBe(true);
      expect(mockStorage.delete).toHaveBeenCalledWith(registro.key);
    });

    it('refuses to skip the trash', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([registro]));

      await expect(mediaService.purgeMedia(registro.id)).rejects.toThrow(BadRequestError);
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });
  });

  describe('listMedia', () => {
    it('returns a paginated collection', async () => {
      mockDb.select
        .mockReturnValueOnce(createQueryMock([registro]))
        .mockReturnValueOnce(createQueryMock([{ value: 1 }]));

      const result = await mediaService.listMedia({ page: 1, limit: 50 });

      expect(result).toEqual({ media: [registro], page: 1, limit: 50, total: 1 });
    });
  });
});
