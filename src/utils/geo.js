/**
 * Geographic coordinate utilities.
 * The 3D world map plane is 300 × 150 world-units (2:1 = Mercator ratio).
 * All geoToScene / sceneToGeo conversions use this scale.
 */

export const MAP_W = 300;   // world-units across full longitude range
export const MAP_H = 150;   // world-units across full latitude range

/** Convert geographic coordinates to Three.js scene coords (y = 0 = on the map). */
export function geoToScene(lon, lat) {
  return [
    lon  * (MAP_W / 360),   // x: -150 (west) … +150 (east)
    0,
    -lat * (MAP_H / 180),   // z: -75 (north) … +75 (south)
  ];
}

/** Convert scene x/z back to lon/lat. */
export function sceneToGeo(x, z) {
  return [
    x  / (MAP_W / 360),   // lon
    -z / (MAP_H / 180),   // lat
  ];
}

/**
 * Compute a good camera position + lookAt for a given country zoom.
 * @param {number} lon  Country centroid longitude
 * @param {number} lat  Country centroid latitude
 * @param {number} zoom Scene-unit height above the map (controls zoom level)
 */
export function cameraForCountry(lon, lat, zoom) {
  const [x, , z] = geoToScene(lon, lat);
  return {
    pos:    [x, zoom, z + zoom * 0.65],
    lookAt: [x, 0,    z],
  };
}

/** Full world overview camera. */
export const WORLD_VIEW = {
  pos:    [0, 220, 110],
  lookAt: [0, 0,   -10],
};

/** Major countries for the zoom UI (lon, lat = centroid; zoom = camera height). */
export const COUNTRIES = [
  // Europe
  { name: 'France',          code: 'FR', lon:   2.35, lat: 46.23, zoom:  38 },
  { name: 'Germany',         code: 'DE', lon:  10.45, lat: 51.17, zoom:  33 },
  { name: 'United Kingdom',  code: 'GB', lon:  -3.44, lat: 55.38, zoom:  30 },
  { name: 'Italy',           code: 'IT', lon:  12.57, lat: 41.87, zoom:  32 },
  { name: 'Spain',           code: 'ES', lon:  -3.75, lat: 40.46, zoom:  35 },
  { name: 'Netherlands',     code: 'NL', lon:   5.29, lat: 52.13, zoom:  16 },
  { name: 'Belgium',         code: 'BE', lon:   4.47, lat: 50.50, zoom:  14 },
  { name: 'Switzerland',     code: 'CH', lon:   8.23, lat: 46.82, zoom:  14 },
  { name: 'Poland',          code: 'PL', lon:  19.14, lat: 51.92, zoom:  30 },
  { name: 'Sweden',          code: 'SE', lon:  18.64, lat: 60.13, zoom:  42 },
  { name: 'Norway',          code: 'NO', lon:  10.45, lat: 60.47, zoom:  40 },
  { name: 'Portugal',        code: 'PT', lon:  -8.22, lat: 39.40, zoom:  24 },
  { name: 'Czech Republic',  code: 'CZ', lon:  15.47, lat: 49.82, zoom:  18 },
  { name: 'Austria',         code: 'AT', lon:  14.55, lat: 47.52, zoom:  18 },
  { name: 'Romania',         code: 'RO', lon:  24.97, lat: 45.94, zoom:  24 },
  { name: 'Greece',          code: 'GR', lon:  21.82, lat: 39.07, zoom:  26 },
  { name: 'Ukraine',         code: 'UA', lon:  31.17, lat: 48.38, zoom:  42 },
  // Americas
  { name: 'United States',   code: 'US', lon: -95.71, lat: 37.09, zoom: 110 },
  { name: 'Canada',          code: 'CA', lon: -96.79, lat: 60.73, zoom: 120 },
  { name: 'Mexico',          code: 'MX', lon:-102.55, lat: 23.63, zoom:  60 },
  { name: 'Brazil',          code: 'BR', lon: -51.93, lat:-14.24, zoom: 110 },
  { name: 'Argentina',       code: 'AR', lon: -63.62, lat:-38.42, zoom:  60 },
  { name: 'Colombia',        code: 'CO', lon: -74.30, lat:  4.57, zoom:  38 },
  { name: 'Chile',           code: 'CL', lon: -71.54, lat:-35.68, zoom:  50 },
  { name: 'Peru',            code: 'PE', lon: -75.02, lat: -9.19, zoom:  40 },
  // Asia & Oceania
  { name: 'China',           code: 'CN', lon: 104.20, lat: 35.86, zoom:  95 },
  { name: 'Japan',           code: 'JP', lon: 138.25, lat: 36.20, zoom:  36 },
  { name: 'South Korea',     code: 'KR', lon: 127.77, lat: 35.91, zoom:  20 },
  { name: 'India',           code: 'IN', lon:  78.96, lat: 20.59, zoom:  70 },
  { name: 'Indonesia',       code: 'ID', lon: 113.92, lat: -0.79, zoom:  65 },
  { name: 'Australia',       code: 'AU', lon: 133.78, lat:-25.27, zoom:  95 },
  { name: 'Russia',          code: 'RU', lon: 105.32, lat: 61.52, zoom: 160 },
  { name: 'Thailand',        code: 'TH', lon: 100.99, lat: 15.87, zoom:  28 },
  { name: 'Vietnam',         code: 'VN', lon: 108.28, lat: 14.06, zoom:  28 },
  { name: 'Malaysia',        code: 'MY', lon: 109.70, lat:  4.21, zoom:  28 },
  { name: 'Pakistan',        code: 'PK', lon:  69.35, lat: 30.38, zoom:  48 },
  { name: 'Bangladesh',      code: 'BD', lon:  90.36, lat: 23.69, zoom:  18 },
  { name: 'Philippines',     code: 'PH', lon: 121.77, lat: 12.88, zoom:  32 },
  { name: 'New Zealand',     code: 'NZ', lon: 174.88, lat:-40.90, zoom:  30 },
  // Middle East
  { name: 'Saudi Arabia',    code: 'SA', lon:  45.08, lat: 23.89, zoom:  58 },
  { name: 'UAE',             code: 'AE', lon:  53.85, lat: 23.42, zoom:  20 },
  { name: 'Turkey',          code: 'TR', lon:  35.24, lat: 38.96, zoom:  42 },
  { name: 'Israel',          code: 'IL', lon:  34.85, lat: 31.05, zoom:  12 },
  { name: 'Iran',            code: 'IR', lon:  53.69, lat: 32.43, zoom:  50 },
  { name: 'Iraq',            code: 'IQ', lon:  43.68, lat: 33.22, zoom:  32 },
  { name: 'Qatar',           code: 'QA', lon:  51.18, lat: 25.35, zoom:  10 },
  { name: 'Kuwait',          code: 'KW', lon:  47.48, lat: 29.31, zoom:  10 },
  // Africa
  { name: 'Nigeria',         code: 'NG', lon:   8.68, lat:  9.08, zoom:  38 },
  { name: 'South Africa',    code: 'ZA', lon:  25.08, lat:-29.00, zoom:  52 },
  { name: 'Egypt',           code: 'EG', lon:  30.80, lat: 26.82, zoom:  38 },
  { name: 'Ethiopia',        code: 'ET', lon:  40.49, lat:  9.15, zoom:  40 },
  { name: 'Morocco',         code: 'MA', lon:  -7.09, lat: 31.79, zoom:  32 },
  { name: 'Kenya',           code: 'KE', lon:  37.91, lat: -0.02, zoom:  30 },
  { name: 'Ghana',           code: 'GH', lon:  -1.02, lat:  7.95, zoom:  22 },
  { name: 'Tanzania',        code: 'TZ', lon:  34.89, lat: -6.37, zoom:  32 },
  { name: 'Algeria',         code: 'DZ', lon:   3.00, lat: 28.03, zoom:  52 },
];
