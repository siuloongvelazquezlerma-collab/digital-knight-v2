/**
 * Huella de audio por segundo (estilo "chromaprint simplificado").
 * Entrada: buffer PCM int16 LE mono @ 16000 Hz.
 * Salida:  array de { code }  (1 por segundo), donde code es un entero de
 *          BANDS bits = dirección de la energía espectral de cada banda
 *          respecto al segundo anterior. Misma intro -> mismo code.
 */

export const SAMPLE_RATE = 16000;
const FRAME = SAMPLE_RATE; // 1 s
const FFT_N = 16384; // potencia de 2 >= FRAME
const BANDS = 14;

function hann(i, n) {
  return 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
}

export function fftMagnitudes(samples, n) {
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    re[i] = i < samples.length ? samples[i] * hann(i, n) : 0;
  }
  // Reordenamiento bit-reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Mariposas
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
  const mags = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) mags[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  return mags;
}

function bandEnergies(mags, n, numBands) {
  const nyq = SAMPLE_RATE / 2;
  const fLow = 60;
  const fHigh = Math.min(nyq, 7600);
  const lo = Math.log(fLow);
  const hi = Math.log(fHigh);
  const e = new Array(numBands).fill(0);
  for (let i = 1; i < mags.length; i++) {
    const hz = (i * SAMPLE_RATE) / n;
    if (hz < fLow || hz > fHigh) continue;
    const b = Math.min(numBands - 1, Math.floor(((Math.log(hz) - lo) / (hi - lo)) * numBands));
    e[b] += mags[i] * mags[i];
  }
  return e;
}

export function fingerprintPcm(buffer) {
  const numFrames = Math.floor(buffer.length / 2 / FRAME);
  const frames = [];
  let prev = null;
  for (let f = 0; f < numFrames; f++) {
    const samples = new Float64Array(FRAME);
    for (let i = 0; i < FRAME; i++) {
      samples[i] = buffer.readInt16LE((f * FRAME + i) * 2) / 32768;
    }
    const mags = fftMagnitudes(samples, FFT_N);
    const bands = bandEnergies(mags, FFT_N, BANDS);
    let code = 0;
    if (prev) {
      for (let b = 0; b < BANDS; b++) {
        if (bands[b] > prev[b]) code |= 1 << b;
      }
    }
    frames.push({ code, bands });
    prev = bands;
  }
  return frames;
}

export { BANDS };

export function spectrum(a) {
  // vector log-energía por banda (para comparar con similitud coseno)
  const v = a.map((e) => Math.log(e + 1e-6));
  return v;
}

export function framesSimilar(a, b, numBands) {
  const va = spectrum(a.bands?.length ? a.bands : a);
  const vb = spectrum(b.bands?.length ? b.bands : b);
  if (va.length !== vb.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < va.length; i++) {
    dot += va[i] * vb[i];
    na += va[i] * va[i];
    nb += vb[i] * vb[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function hamming(a, b) {
  let x = (a ^ b) >>> 0;
  let c = 0;
  while (x) {
    c += x & 1;
    x >>>= 1;
  }
  return c;
}