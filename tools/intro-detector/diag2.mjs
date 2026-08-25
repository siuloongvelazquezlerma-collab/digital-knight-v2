// diag2.mjs — ¿dónde está la intro? Perfil de consenso offset=0 con umbrales estrictos
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { agreementProfile, longestRun } from './lib/match.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(dir, 'out', 'la-teoria-del-big-bang-1418.s1');
function load(n) {
  const arr = JSON.parse(fs.readFileSync(`${base}.ep${n}.bands.json`, 'utf8'));
  return arr.map((bands) => ({ bands }));
}
const seqs = [1, 2, 3, 4].map(load);

for (const thresh of [0.93, 0.95, 0.97, 0.99]) {
  const agree = agreementProfile(seqs, thresh, 0);
  const run = longestRun(agree, 6, 0.6); // mínimo 6s, consenso >= 60%
  console.log(`\n--- umbral similitud=${thresh} (offset 0) ---`);
  if (run) {
    console.log(`mejor tramo: start=${run.start}s end=${run.end}s (${run.length}s)`);
    const lo = Math.max(0, run.start - 3);
    const hi = Math.min(agree.length, run.end + 3);
    for (let t = lo; t < hi; t++) {
      const frac = agree[t] || 0;
      const bar = '#'.repeat(Math.round(frac * 20)).padEnd(20, '.');
      const inIntro = t >= run.start && t < run.end;
      console.log(`${String(t).padStart(3)}s ${(frac * 100).toFixed(0).padStart(3)}% ${bar}${inIntro ? '  <-- TRAMO' : ''}`);
    }
  } else {
    console.log('sin tramo >= 6s al 60%');
    // muestra dónde hay picos altos
    const top = agree.map((v, t) => ({ t, v })).sort((x, y) => y.v - x.v).slice(0, 12);
    console.log('picos de consenso:', top.map((x) => `${x.t}s:${(x.v * 100).toFixed(0)}%`).join(' '));
  }
}
