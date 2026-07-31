import { coordenadasDeMapsUrl } from '../../../src/shared/geo/maps-url';

describe('coordenadasDeMapsUrl', () => {
  it('prefers the place pin (!3d!4d) over the camera (@)', () => {
    /* El `@` es donde quedó encuadrado el mapa; el `!3d!4d` es el lugar. */
    const url =
      'https://www.google.com/maps/place/Motos+Hot+Wheels/@6.2400000,-75.5700000,17z/data=!4m6!3m5!1s0x1!8m2!3d6.2450000!4d-75.5680000';

    expect(coordenadasDeMapsUrl(url)).toEqual({ lat: 6.245, lng: -75.568 });
  });

  it('reads the @lat,lng form', () => {
    expect(coordenadasDeMapsUrl('https://www.google.com/maps/@6.0629124,-75.5026782,15z')).toEqual({
      lat: 6.0629124,
      lng: -75.5026782,
    });
  });

  it('reads the q= form', () => {
    expect(
      coordenadasDeMapsUrl('https://www.google.com/maps?q=4.6515357,-74.170325&hl=es')
    ).toEqual({ lat: 4.6515357, lng: -74.170325 });
  });

  it('returns null for shortened links, which carry no coordinates', () => {
    expect(coordenadasDeMapsUrl('https://maps.app.goo.gl/8mYqXk3n2')).toBeNull();
  });

  it('returns null for anything that is not a URL', () => {
    expect(coordenadasDeMapsUrl('6.245, -75.568')).toBeNull();
    expect(coordenadasDeMapsUrl('')).toBeNull();
    expect(coordenadasDeMapsUrl(undefined)).toBeNull();
  });

  it('rejects numbers outside the range of a coordinate', () => {
    expect(coordenadasDeMapsUrl('https://www.google.com/maps/@999.9,-75.5,17z')).toBeNull();
  });
});
