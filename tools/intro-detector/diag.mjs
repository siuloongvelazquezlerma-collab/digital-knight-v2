// diag.mjs — diagnóstico: comparar espectros entre episodios sin re-descargar
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { framesSimilar } from './lib/fingerprint.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(dir, 'out', 'la-teoria-del-big-bang-1418.s1');

function load(n) {
  const arr = JSON.parse(fs.readFileSync(`${base}.ep${n}.bands.json`, 'utf8'));
  return arr.map((bands) => ({ bands }));
}

const a = load(1);
const b = load(2);
const n = Math.min(a.length, b.length);
const cos = [];
for (let t = 0; t < n; t++) cos.push({ t, v: framesSimilar(a[t], b[t]) });

cos.sort((x, y) => x.v - y.v);
const low = cos.slice(0, 25);
console.log('25 segundos con MENOR similitud (ep1 vs ep2):');
for (const { t, v } of low) console.log(`  t=${String(t).padStart(3)}s  cos=${v.toFixed(3)}`);
const avg = cos.reduce((s, c) => s + c.v, 0) / cos.length;
const over99 = cos.filter((c) => c.v >= 0.99).length;
console.log(`\nMedia cos=${avg.toFixed(3)}  ·  nº segundos con cos>=0.99: ${over99}/${n}`);
console.log('Si casi todo tiene cos>=0.99, la métrica NO discrimina el contenido (audio muy parecido de forma).');
