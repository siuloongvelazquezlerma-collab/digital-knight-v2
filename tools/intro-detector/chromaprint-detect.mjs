// chromaprint-detect.mjs — detecta la intro con Chromaprint (fpcalc) comparando
// fingerprints entre episodios, tolerando el desplazamiento (cold opens).
//
// Método:
//   1. Para cada episodio genera fingerprints de ventanas deslizantes (fpcalc -raw).
//   2. Para cada par (A,B) calcula la distancia mínima entre ventanas permitiendo
//      un pequeño desfase (shift) para absorber diferencias de encod/alineación.
//   3. Busca el tramo contiguo donde la MAYORÍA de episodios comparte el mismo
//      fragmento (la intro) aunque esté en offsets distintos.
//
// Uso: node chromaprint-detect.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { fpcalcRaw, fpDistance } from './lib/chromaprint.mjs';
import { writeWav, slicePcm16 } from './lib/wav.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PCM_DIR = path.join(__dirname, 'pcm', 'la-teoria-del-big-bang-1418.s1');
const WIN_S = 20; // ventana (s)
const STEP_S = 5; // paso (s)
const SHIFT = 35; // desfase máx en ints de fingerprint (~5s a 6.7 ints/s)
const DIST_THR = parseFloat(process.env.CP_DIST || '0.14'); // distancia máx para considerar match
const MIN_WIN = parseInt(process.env.CP_MINWIN || '3', 10); // ventanas mínimas del tramo

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-'));

function loadPcm(name) {
  return fs.readFileSync(path.join(PCM_DIR, name));
}

// me mejor distancia entre dos fingerprints permitiendo desplazamiento
function bestFpDistance(a, b, maxShift) {
  let best = 1;
  for (let s = -maxShift; s <= maxShift; s++) {
    const a0 = Math.max(0, -s);
    const b0 = Math.max(0, s);
    const len = Math.min(a.length - a0, b.length - b0);
    if (len < 8) continue;
    let diff = 0;
    for (let i = 0; i < len; i++) diff += popcount((a[a0 + i] ^ b[b0 + i]) >>> 0);
    const d = diff / (len * 32);
    if (d < best) best = d;
  }
  return best;
}
function popcount(x) {
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

async function main() {
  const files = fs.readdirSync(PCM_DIR).filter((f) => f.endsWith('.s16le')).sort();
  console.log('Episodios:', files.join(' , '));

  // fingerprints por episodio
  const fps = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(PCM_DIR, f));
    const totalSec = Math.floor(buf.length / 2 / 16000);
    const wins = [];
    for (let t = 0; t + WIN_S <= totalSec; t += STEP_S) {
      const samples = slicePcm16(buf, t, WIN_S);
      const w = path.join(tmp, `${path.basename(f).replace(/\W+/g, '_')}_${t}.wav`);
      writeWav(w, samples);
      wins.push({ t, fp: await fpcalcRaw(w) });
    }
    fps.push({ name: f, wins });
    console.log(`  ${f}: ${wins.length} ventanas hasta ${wins[wins.length - 1].t}s`);
  }

  // similarity consensus by reference episode
  const refs = [];
  for (let ref = 0; ref < fps.length; ref++) {
    const rwins = fps[ref].wins;
    // for each window k of reference, count episodes with a similar window (aligned)
    const hits = new Array(rwins.length).fill(0);
    const coverage = [];
    for (const other of fps) {
      if (other === fps[ref]) continue;
      const bestd = rwins.map((k) => Math.min(...other.wins.map((o) => bestFpDistance(k.fp, o.fp, SHIFT))));
      coverage.push(bestd);
    }
    for (let k = 0; k < rwins.length; k++) {
      let cnt = 0;
      for (const d of coverage) if (d[k] < DIST_THR) cnt++;
      hits[k] = cnt;
    }
    refs.push({ ref, hits, rwins, coverage });
  }

  // pick best reference/candidate por nivel de exigencia:
//   STRICT  : el tramo aparece en TODOS los demás episodios (confianza alta)
//   RELAXED : aparece en todos menos uno (confianza media)
const candidates = [];
for (const level of [fps.length - 1, fps.length - 2]) {
  if (level < 1) continue;
  let bestRef = null;
  let bestRun = 0;
  for (const { ref, hits } of refs) {
    let run = -1, bestStart = -1, bestLen = 0;
    for (let k = 0; k <= hits.length; k++) {
      const ok = k < hits.length && hits[k] >= level;
      if (ok) { if (run < 0) run = k; }
      else { if (run >= 0) { const l = k - run; if (l > bestLen) { bestLen = l; bestStart = run; } } run = -1; }
    }
    if (bestLen >= MIN_WIN && bestLen > bestRun) {
      bestRun = bestLen;
      bestRef = { ref, start: bestStart, end: bestStart + bestLen, hits, level };
    }
  }
  if (bestRef) candidates.push({ ...bestRef, strictness: level === fps.length - 1 ? 'STRICT' : 'RELAXED' });
}

const bestRef = candidates[0];
if (!bestRef) {
  console.log('\nNo se encontró ningún tramo consistente como intro con los umbrales por defecto.');
  console.log('--- DIAGNÓSTICO: mejor tramo por umbral de distancia / nº episodios requeridos ---');
  console.log('dist | eps | referencia | start-end | duración(s)');
  for (const dt of [0.10, 0.12, 0.14, 0.16, 0.18, 0.22]) {
    for (const level of [fps.length - 1, fps.length - 2]) {
      if (level < 1) continue;
      let out = null;
      for (const { ref, coverage } of refs) {
        const hh = coverage.map((d) => d.filter((x) => x < dt).length);
        // hh[k] ya no aplica; recalcular con dt sobre coverage
        const hits2 = new Array(coverage.length ? coverage[0].length : 0).fill(0);
        for (let k = 0; k < hits2.length; k++) {
          let c = 0;
          for (const cov of coverage) {
            const dd = cov[k];
            if (dd < dt) c++;
          }
          hits2[k] = c;
        }
        let run = -1, bs = -1, bl = 0;
        for (let k = 0; k <= hits2.length; k++) {
          const ok = k < hits2.length && hits2[k] >= level;
          if (ok) { if (run < 0) run = k; }
          else { if (run >= 0) { const l = k - run; if (l > bl) { bl = l; bs = run; } } run = -1; }
        }
        if (bl >= 2 && (!out || bl > out.len)) {
          out = { ref, start: bs, end: bs + bl, len: bl };
        }
      }
      if (out) {
        const s = out.start * STEP_S;
        const e = out.end * STEP_S + WIN_S;
        console.log(`${dt.toFixed(2)} | ${level}   | ${fps[out.ref].name.padEnd(14)} | ${String(out.start).padStart(2)}-${String(out.end).padStart(2)} ventanas | ${e - s}s`);
      } else {
        console.log(`${dt.toFixed(2)} | ${level}   | (nada)`);
      }
    }
  }
  return;
}
bestRef.coverage = refs[bestRef.ref].coverage;

const refEp = fps[bestRef.ref].name;
const startSec = bestRef.start * STEP_S;
const endSec = bestRef.end * STEP_S + WIN_S;
console.log('\n===== RESULTADO =====');
console.log('referencia:', refEp);
console.log(`start=${startSec}s end=${endSec}s duración=${endSec - startSec}s`);
console.log(`confianza: ${bestRef.strictness} — match en ${bestRef.level}/${fps.length - 1} episodios, dist < ${DIST_THR}`);

  console.log('\n--- perfil (episodios similares por ventana de la referencia) ---');
  for (let k = 0; k < bestRef.hits.length; k++) {
    const inIntro = k >= bestRef.start && k < bestRef.end;
    console.log(`${String(k * STEP_S).padStart(4)}s  hits=${bestRef.hits[k]}/${fps.length - 1}${inIntro ? '  <-- INTRO' : ''}`);
  }

  // detalle del mejor tramo: qué ventana casa en cada episodio y con qué distancia
  console.log('\n--- detalle del tramo (ventana ref -> ventana matched / distancia por episodio) ---');
  for (let k = bestRef.start; k < bestRef.end; k++) {
    const parts = [];
    for (let ci = 0; ci < bestRef.coverage.length; ci++) {
      const otherIdx = ci < bestRef.ref ? ci : ci + 1;
      const cov = bestRef.coverage[ci];
      // buscar la mejor ventana en ese episodio
      let bi = -1;
      let bd = Infinity;
      for (let o = 0; o < fps[otherIdx].wins.length; o++) {
        const d = bestFpDistance(fps[bestRef.ref].wins[k].fp, fps[otherIdx].wins[o].fp, SHIFT);
        if (d < bd) { bd = d; bi = o; }
      }
      parts.push(`${fps[otherIdx].wins[bi]?.t}s@${bd.toFixed(3)}`);
    }
    console.log(`ref ${String(k * STEP_S).padStart(4)}s -> ${parts.join(' | ')}`);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });