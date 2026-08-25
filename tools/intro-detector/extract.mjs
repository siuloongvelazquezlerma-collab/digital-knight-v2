// extract.mjs — extrae y GUARDA el PCM (mono 16 kHz) de una muestra para luego
// aplicar correlación cruzada (NCC) y así VERIFICAR qué segmento es idéntico.
// Uso: node extract.mjs --html <ruta> --season 1 --sample 4 --window 120
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBinaries, extractPcmToFile } from './lib/ffmpeg.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}
const html = arg('html');
const seasonNum = parseInt(arg('season') || '1', 10);
const sampleN = parseInt(arg('sample') || '5', 10);
const windowSecs = parseInt(arg('window') || '120', 10);

function parsePlaylist(html) {
  const idm = html.match(/seriesId\s*=\s*"([^"]+)"/);
  const seriesId = idm ? idm[1] : 'unknown';
  const seasonIdx = [];
  const seasonRe = /Temporada\s+(\d+)/g;
  let mm;
  while ((mm = seasonRe.exec(html))) seasonIdx.push({ num: +mm[1], index: mm.index });
  const hids = [];
  const hidRe = /"?hiddenCode"?\s*:\s*"([^"]+)"/g;
  while ((mm = hidRe.exec(html))) hids.push({ code: mm[1], index: mm.index });
  const lats = [];
  const latRe = /"?latino"?\s*:\s*"([^"]*)"/g;
  while ((mm = latRe.exec(html))) lats.push({ url: mm[1], index: mm.index });
  const seasons = [];
  for (let s = 0; s < seasonIdx.length; s++) {
    const start = seasonIdx[s].index;
    const end = s + 1 < seasonIdx.length ? seasonIdx[s + 1].index : html.length;
    const hIn = hids.filter((h) => h.index >= start && h.index < end);
    const lIn = lats.filter((l) => l.index >= start && l.index < end);
    const episodes = [];
    for (let i = 0; i < hIn.length; i++) {
      const url = lIn[i] ? lIn[i].url : '';
      if (url) episodes.push({ code: hIn[i].code, url });
    }
    seasons.push({ num: seasonIdx[s].num, episodes });
  }
  return { seriesId, seasons };
}

async function main() {
  if (!html) {
    console.error('Falta --html');
    process.exit(1);
  }
  console.log('ffmpeg:', resolveBinaries().ffmpeg);
  const { seriesId, seasons } = parsePlaylist(fs.readFileSync(html, 'utf8'));
  const season = seasons.find((s) => s.num === seasonNum);
  if (!season) {
    console.error('Temporada inválida', seasonNum);
    process.exit(1);
  }
  const sample = season.episodes.filter((e) => e.url).slice(0, sampleN);
  const outDir = path.join(__dirname, 'pcm', `${seriesId}.s${seasonNum}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log('Muestra:', sample.map((e) => e.code).join(', '));
  for (let i = 0; i < sample.length; i++) {
    const safe = sample[i].code.replace(/[^a-zA-Z0-9]+/g, '_');
    const outFile = path.join(outDir, `${safe}.s16le`);
    if (fs.existsSync(outFile)) {
      console.log(`✓ ya existe ${sample[i].code}`);
      continue;
    }
    console.log(`▶ extrae ${sample[i].code} → ${outFile}`);
    await extractPcmToFile(sample[i].url, { start: 0, duration: windowSecs, outFile });
    console.log(`   listo (${fs.statSync(outFile).size} bytes)`);
  }
  console.log('Guarda los PCM en:', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});