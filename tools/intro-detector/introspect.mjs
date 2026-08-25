// introspect.mjs — detecta la intro por CORRELACIÓN CRUZADA NORMALIZADA (NCC)
// sobre el PCM real. Es la prueba más directa de "este audio es el mismo".
// Para cada segundo s (ventana de Ls) calcula el mejor NCC con cada uno de los
// otros episodios (buscando un desplazamiento sub-segundo). La intro es el
// tramo contiguo donde las 4 muestras se correlacionan.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pcmDir = process.argv[2] || path.join(__dirname, 'pcm', 'la-teoria-del-big-bang-1418.s1');

const WIN = 15; // ventana en segundos (búsqueda de intro)
const LAG = 6; // +/- segundos de desplazamiento permitido
const threshs = [0.1, 0.15, 0.2, 0.25, 0.3];

function loadFloat(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.s16le'));
  const list = files.map((f) => {
    const buf = fs.readFileSync(path.join(dir, f));
    const n = Math.floor(buf.length / 2);
    const a = new Float32Array(n >> 1); // downsampling a 8 kHz
    for (let i = 0; i < a.length; i++) a[i] = buf.readInt16LE(i * 4) / 32768; // cada 2ª muestra
    return { name: f, data: a };
  });
  return list;
}

function ncc(xs, xi, ys, yi, L) {
  let sxy = 0, sx = 0, sy = 0, sxx = 0, syy = 0;
  for (let k = 0; k < L; k++) {
    const xx = xs[xi + k];
    const yy = ys[yi + k];
    sxy += xx * yy;
    sx += xx;
    sy += yy;
    sxx += xx * xx;
    syy += yy * yy;
  }
  const num = L * sxy - sx * sy;
  const den = Math.sqrt((L * sxx - sx * sx) * (L * syy - sy * sy));
  return den > 0 ? num / den : 0;
}

const eps = loadFloat(pcmDir);
console.log('Episodios cargados:', eps.map((e) => e.name).join(', '));
const SR = 8000;
const L = WIN * SR;
const minLen = Math.min(...eps.map((e) => e.data.length));
const stepSamples = 1 * SR; // 1 segundo
const maxStartS = Math.floor((minLen - L - LAG * SR) / stepSamples);
const lags = [];
for (let d = -LAG; d <= LAG; d += 0.5) lags.push(Math.round(d * SR));

const scores = []; // por segundo s: valor del par con MENOR NCC (consenso)
for (let s = 0; s <= maxStartS; s++) {
  const base = s * stepSamples;
  let bestPair = Infinity;
  for (let a = 0; a < eps.length; a++) {
    for (let b = a + 1; b < eps.length; b++) {
      let best = -Infinity;
      for (const lag of lags) {
        const xi = base + lag;
        if (xi < 0 || xi + L > eps[a].data.length) continue;
        if (base + L > eps[b].data.length) continue;
        const v = ncc(eps[a].data, xi, eps[b].data, base, L);
        if (v > best) best = v;
      }
      if (best < bestPair) bestPair = best;
    }
  }
  scores.push({ t: s, v: bestPair });
}

console.log('\nPerfil de consenso NCC por segundo (peor de los pares, ventana 15s):');
for (const { t, v } of scores) {
  const bar = '#'.repeat(Math.round(v * 40)).padEnd(40, '.');
  console.log(`${String(t).padStart(3)}s ${(v * 100).toFixed(0).padStart(3)}% ${bar}`);
}

// mejor tramo contiguo para cada umbral
function bestRun(scoresArr, thr) {
  let bestStart = -1, bestLen = 0, run = -1;
  for (let i = 0; i <= scoresArr.length; i++) {
    const ok = i < scoresArr.length && scoresArr[i].v >= thr;
    if (ok) { if (run < 0) run = i; }
    else { if (run >= 0) { const l = i - run; if (l > bestLen) { bestLen = l; bestStart = run; } run = -1; } }
  }
  return bestStart >= 0 ? { start: bestStart, end: bestStart + bestLen, len: bestLen } : null;
}
console.log('\nTramos por umbral de NCC:');
for (const thr of threshs) {
  const r = bestRun(scores, thr);
  console.log(`NCC>=${thr}  →  ${r ? `start=${r.start}s end=${r.end}s len=${r.len}s` : 'nada (>= 2s)'}`);
}