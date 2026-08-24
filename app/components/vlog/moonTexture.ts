/**
 * Procedural, deterministic Moon texture generator (canvas-based). No
 * external texture files or network fetches — surface albedo + relief
 * come from value noise (mare vs highlands) plus a set of craters stamped
 * directly into the elevation field, sampled on a unit sphere so it wraps
 * seamlessly at the longitude seam and doesn't pinch at the poles.
 *
 * Produces two maps: color (surface) and normal (crater relief — this is
 * what actually sells the 3D read, since a moon is basically nothing but
 * shadowed bowls and rims). No clouds/atmosphere maps: the Moon has
 * neither, unlike the Earth version this replaces.
 */

function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function noise3(x: number, y: number, z: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const xf = x - x0;
  const yf = y - y0;
  const zf = z - z0;
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const c000 = hash3(x0, y0, z0);
  const c100 = hash3(x0 + 1, y0, z0);
  const c010 = hash3(x0, y0 + 1, z0);
  const c110 = hash3(x0 + 1, y0 + 1, z0);
  const c001 = hash3(x0, y0, z0 + 1);
  const c101 = hash3(x0 + 1, y0, z0 + 1);
  const c011 = hash3(x0, y0 + 1, z0 + 1);
  const c111 = hash3(x0 + 1, y0 + 1, z0 + 1);

  const x00 = lerp(c000, c100, u);
  const x10 = lerp(c010, c110, u);
  const x01 = lerp(c001, c101, u);
  const x11 = lerp(c011, c111, u);

  const y0i = lerp(x00, x10, v);
  const y1i = lerp(x01, x11, v);

  return lerp(y0i, y1i, w);
}

function fbm3(x: number, y: number, z: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise3(x * freq, y * freq, z * freq) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    freq *= 2;
  }
  return value / max;
}

/** Small deterministic PRNG (mulberry32) so the crater field is stable
 * across reloads instead of reshuffling every render. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Crater = { x: number; y: number; z: number; radius: number; depth: number; rim: number };

function generateCraters(count: number, seed: number): Crater[] {
  const random = mulberry32(seed);
  const craters: Crater[] = [];

  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const u = random() * 2 - 1;
    const r = Math.sqrt(1 - u * u);
    const x = r * Math.cos(theta);
    const y = u;
    const z = r * Math.sin(theta);

    // Power-law size bias: many small craters, a few large basins.
    const size = Math.pow(random(), 2.0);
    const radius = lerp(0.04, 0.22, size);

    craters.push({
      x,
      y,
      z,
      radius,
      depth: radius * 0.4,
      rim: radius * 0.22,
    });
  }

  return craters;
}

/** Bowl + raised rim cross-section, 0 outside the crater's angular radius. */
function craterProfile(d: number, depth: number, rim: number): number {
  if (d >= 1) return 0;
  const bowl = -depth * (1 - d * d);
  const rimBump = Math.max(0, 1 - Math.abs(d - 0.86) / 0.14) * rim;
  return bowl + rimBump;
}

const HIGHLAND: readonly [number, number, number] = [168, 164, 158];
const MARE: readonly [number, number, number] = [72, 72, 78];

function mixColor(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  return [lerp(a[0], b[0], clamped), lerp(a[1], b[1], clamped), lerp(a[2], b[2], clamped)];
}

type TextureSize = { width: number; height: number };

export function generateMoonTextures(size: TextureSize) {
  const { width, height } = size;
  const craters = generateCraters(120, 1337);

  // Directions + base terrain sampled once, reused for elevation, albedo
  // and the normal-map gradient so all three stay consistent.
  const dirs = new Float32Array(width * height * 3);
  const elevation = new Float32Array(width * height);
  const mare = new Float32Array(width * height);

  for (let py = 0; py < height; py++) {
    const v = py / (height - 1);
    const lat = (v - 0.5) * Math.PI;

    for (let px = 0; px < width; px++) {
      const u = px / width;
      const lon = u * Math.PI * 2;

      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);

      const i = py * width + px;
      dirs[i * 3] = x;
      dirs[i * 3 + 1] = y;
      dirs[i * 3 + 2] = z;

      const mareMask = fbm3(x * 1.1 + 4, y * 1.1 + 4, z * 1.1 + 4, 4);
      mare[i] = Math.max(0, Math.min(1, (mareMask - 0.52) / 0.16));

      const regolith = fbm3(x * 9 + 90, y * 9 + 90, z * 9 + 90, 3);
      let e = (regolith - 0.5) * 0.05 - mare[i] * 0.06;

      for (let c = 0; c < craters.length; c++) {
        const crater = craters[c];
        const cosAngle = x * crater.x + y * crater.y + z * crater.z;
        if (cosAngle <= 0) continue;
        const cosRadius = Math.cos(crater.radius * 1.25);
        if (cosAngle < cosRadius) continue;
        const angle = Math.acos(Math.min(1, cosAngle));
        const d = angle / crater.radius;
        e += craterProfile(d, crater.depth, crater.rim);
      }

      elevation[i] = e;
    }
  }

  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  const sctx = surface.getContext("2d")!;
  const surfaceImage = sctx.createImageData(width, height);

  const roughness = document.createElement("canvas");
  roughness.width = width;
  roughness.height = height;
  const rctx = roughness.getContext("2d")!;
  const roughnessImage = rctx.createImageData(width, height);

  const normal = document.createElement("canvas");
  normal.width = width;
  normal.height = height;
  const nctx = normal.getContext("2d")!;
  const normalImage = nctx.createImageData(width, height);

  const normalStrength = 5.5;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const i = py * width + px;
      const idx = i * 4;

      const albedo = mixColor(HIGHLAND, MARE, mare[i]);
      // Crater floors read a touch darker, fresh rims a touch brighter —
      // subtle, but it keeps craters legible even at grazing light angles
      // where the normal map alone goes flat.
      const relief = Math.max(-0.12, Math.min(0.12, elevation[i]));
      const shade = 1 + relief * 1.4;
      surfaceImage.data[idx] = Math.max(0, Math.min(255, albedo[0] * shade));
      surfaceImage.data[idx + 1] = Math.max(0, Math.min(255, albedo[1] * shade));
      surfaceImage.data[idx + 2] = Math.max(0, Math.min(255, albedo[2] * shade));
      surfaceImage.data[idx + 3] = 255;

      const rough = lerp(0.95, 0.82, mare[i]);
      const grey = Math.round(rough * 255);
      roughnessImage.data[idx] = grey;
      roughnessImage.data[idx + 1] = grey;
      roughnessImage.data[idx + 2] = grey;
      roughnessImage.data[idx + 3] = 255;

      const xL = (px - 1 + width) % width;
      const xR = (px + 1) % width;
      const yT = Math.max(0, py - 1);
      const yB = Math.min(height - 1, py + 1);

      const eL = elevation[py * width + xL];
      const eR = elevation[py * width + xR];
      const eT = elevation[yT * width + px];
      const eB = elevation[yB * width + px];

      const dx = (eL - eR) * normalStrength;
      const dy = (eT - eB) * normalStrength;

      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      normalImage.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalImage.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalImage.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalImage.data[idx + 3] = 255;
    }
  }

  sctx.putImageData(surfaceImage, 0, 0);
  rctx.putImageData(roughnessImage, 0, 0);
  nctx.putImageData(normalImage, 0, 0);

  return { surface, roughness, normal };
}
