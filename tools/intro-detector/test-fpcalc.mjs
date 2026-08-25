// test-fpcalc.mjs — prueba quick del pipeline chromaprint sobre un PCM existente
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fpcalcRaw, fpDistance } from './lib/chromaprint.mjs';
import { writeWav } from './lib/wav.mjs';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pcmDir = path.join(__dirname, 'pcm', 'la-teoria-del-big-bang-1418.s1');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-'));

(async () => {
  const a = fs.readFileSync(path.join(pcmDir, 'T1_E1.s16le'));
  const b = fs.readFileSync(path.join(pcmDir, 'T1_E2.s16le'));
  // ventanas de 15s en distintos offsets
  for (const [label, buf, sec] of [
    ['E1@0s', a, 0],
    ['E1@90s', a, 90],
    ['E2@0s', b, 0],
    ['E2@90s', b, 90],
  ]) {
    const n = Math.floor(15 * 16000);
    const samples = new Int16Array(n);
    for (let i = 0; i < n; i++) samples[i] = buf.readInt16LE((sec * 16000 + i) * 2);
    const w = path.join(tmp, `${label.replace(/[^a-z0-9]+/gi, '_')}.wav`);
    writeWav(w, samples);
    const fp = await fpcalcRaw(w);
    console.log(`${label}: ${fp.length} ints (15s audio)`);
  }
  // distancia entre E1@0s y E2@0s (misma ventana temporal)
  const f1a = await fpcalcRaw(wavFor(a, 0));
  const f2a = await fpcalcRaw(wavFor(b, 0));
  const f1b = await fpcalcRaw(wavFor(a, 90));
  const f2b = await fpcalcRaw(wavFor(b, 90));
  console.log('dist E1@0 vs E2@0 (misma ventana):', fpDistance(f1a, f2a).toFixed(3));
  console.log('dist E1@90 vs E2@90 (misma ventana):', fpDistance(f1b, f2b).toFixed(3));
  // autocorr: E1@0 vs E1@0
  console.log('dist E1@0 vs E1@0 (autocorr):', fpDistance(f1a, f1a).toFixed(3));

  function wavFor(buf, sec) {
    const n = Math.floor(15 * 16000);
    const s = new Int16Array(n);
    for (let i = 0; i < n; i++) s[i] = buf.readInt16LE((sec * 16000 + i) * 2);
    const w = path.join(tmp, `t${sec}.wav`);
    writeWav(w, s);
    return w;
  }
})();