// lib/chromaprint.mjs — envuelve fpcalc (Chromaprint) para obtener fingerprints "raw"
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FPCALC = process.env.FPCALC_PATH || path.join(__dirname, '..', 'bin', 'chromaprint-fpcalc-1.6.1-windows-x86_64', 'fpcalc.exe');

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(FPCALC, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`fpcalc falló (${code}): ${err.slice(-800)}`));
    });
  });
}

/**
 * Devuelve el fingerprint "raw" de un archivo de audio como array de enteros de 32 bits.
 */
export async function fpcalcRaw(audioFile) {
  const out = await run(['-raw', '-format', 'wav', audioFile]);
  const m = out.match(/FINGERPRINT=([0-9,\-]+)/);
  if (!m) return [];
  return m[1].split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n));
}

/**
 * Distancia de Hamming normalizada entre dos fingerprints (misma longitud).
 * 0 = idénticos, 1 = totalmente distintos.
 */
export function fpDistance(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 1;
  let diff = 0;
  for (let i = 0; i < n; i++) {
    let x = (a[i] ^ b[i]) >>> 0;
    while (x) {
      diff += x & 1;
      x >>>= 1;
    }
  }
  return diff / (n * 32);
}

export { FPCALC };