import { createMockSiteSettings } from '../../helpers/mocks';

function createQueryMock(result: unknown) {
  const mock: any = {
    from: jest.fn(() => mock),
    where: jest.fn(() => mock),
    limit: jest.fn(() => mock),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
  return mock;
}

const mockDb = {
  select: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../../src/shared/database/drizzle', () => ({
  getDb: () => mockDb,
}));

import { siteSettingsService } from '../../../src/services/site-settings.service';
import { NotFoundError } from '../../../src/shared/errors';

describe('siteSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSiteSettings', () => {
    it('returns the single row', async () => {
      const settings = createMockSiteSettings();
      mockDb.select.mockReturnValueOnce(createQueryMock([settings]));

      const result = await siteSettingsService.getSiteSettings();

      expect(result).toEqual(settings);
    });

    /* En un ambiente migrado correctamente esto nunca pasa (la migración 011
       siembra la fila); si pasa, hay que decirlo claro en vez de un null. */
    it('throws NotFoundError when the seed row is missing', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(siteSettingsService.getSiteSettings()).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateSiteSettings', () => {
    it('updates only the row with id = 1', async () => {
      const settings = createMockSiteSettings();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...settings, phone: '+57 310 555 0000' }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([settings]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await siteSettingsService.updateSiteSettings({ phone: '+57 310 555 0000' });

      expect(result.phone).toBe('+57 310 555 0000');
      expect(set.mock.calls[0][0].phone).toBe('+57 310 555 0000');
      expect(set.mock.calls[0][0].updatedAt).toBeInstanceOf(Date);
    });

    it('leaves untouched columns alone (undefined never overwrites)', async () => {
      const settings = createMockSiteSettings();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([settings]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([settings]));
      mockDb.update.mockReturnValueOnce({ set });

      await siteSettingsService.updateSiteSettings({ siteName: 'Motos Hot Wheels' });

      const cambios = set.mock.calls[0][0];
      expect(cambios.siteName).toBe('Motos Hot Wheels');
      expect(cambios.phone).toBeUndefined();
    });

    it('fails clearly when the seed row is missing, instead of creating one', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(
        siteSettingsService.updateSiteSettings({ siteName: 'Otro nombre' })
      ).rejects.toThrow(NotFoundError);
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
