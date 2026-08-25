/**
 * detect.mjs — Detección automática de intros (proof of concept para The Big Bang Theory)
 *
 * Uso (desde tools/intro-detector):
 *   node detect.mjs --html "../../www/series/la-teoria-del-big-bang.html" --season 1 --sample 6 --window 240
 *
 * Qué hace:
 *   1. Lee el HTML de la serie y extrae window.playlist (seriesId, temporadas, episodios → URL del video).
 *   2. De la temporada elegida toma una MUESTRA de episodios.
 *   3. Para cada episodio extrae SOLO el audio de los primeros `--window` segundos
 *      (ffmpeg + Range/`-ss -t -vn`: no descarga el episodio completo).
 *   4. Calcula una huella de audio por segundo.
 *   5. Busca el segmento repetido entre episodios (la intro) por consenso.
 *   6. Imprime start/end + informe de verificación y escribe tools/intro-detector/out/….
 *
 * NO se ejecuta en el reproductor ni para los usuarios: es herramienta del mantenedor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBinaries, ffprobeDuration, extractPcmToFile } from './lib/ffmpeg.mjs';
import { fingerprintPcm } from './lib/fingerprint.mjs';
import { findIntroConsensus, agreementProfile } from './lib/match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- CLI ----------
function parseArgs(argv) {
  const get = (name, def) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
  };
  return {
    html: get('html'),
    season: parseInt(get('season', '1'), 10),
    window: parseInt(get('window', '240'), 10),
    sample: parseInt(get('sample', '6'), 10),
    threshold: parseFloat(get('threshold', '0.6')),
    minSec: parseInt(get('minsec', '6'), 10),
    similarity: parseFloat(get('similarity', '0.92')),
    maxOffset: parseInt(get('maxoffset', '30'), 10),
  };
}

// ---------- Parseo del playlist ----------
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

// ---------- Main ----------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.html) {
    console.error('Falta --html <ruta-al-html-de-la-serie>');
    process.exit(1);
  }

  const { ffmpeg, ffprobe } = resolveBinaries();
  console.log('[ffmpeg] ', ffmpeg);
  console.log('[ffprobe]', ffprobe);
  if (!fs.existsSync(ffmpeg) && ffmpeg !== 'ffmpeg') {
    console.error('⚠️ ffmpeg-static no descargado. Ejecuta:  npm install  dentro de ' + __dirname);
    process.exit(1);
  }

  const html = fs.readFileSync(args.html, 'utf8');
  const { seriesId, seasons } = parsePlaylist(html);
  console.log('[serie] seriesId =', seriesId, '| temporadas:', seasons.length);

  const season = seasons.find((s) => s.num === args.season);
  if (!season) {
    console.error(`No existe la temporada ${args.season}.`);
    process.exit(1);
  }
  const sample = season.episodes.slice(0, args.sample);
  console.log(`[temporada] ${season.num} · episodios disponibles: ${season.episodes.length} · muestra: ${sample.length}`);

  const tmpDir = path.join(__dirname, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  const seqs = [];
  const report = [];
  for (let i = 0; i < sample.length; i++) {
    const ep = sample[i];
    const raw = path.join(tmpDir, `ep${i + 1}.s16le`);
    console.log(`\n▶ analizando ${ep.code} (${ep.url}) window=${args.window}s`);
    try {
      const dur = await ffprobeDuration(ep.url);
      if (dur > 0 && dur < args.window) {
        console.log(`   (duración ${dur.toFixed(1)}s — se extraerán ${Math.floor(dur)}s)`);
      }
      await extractPcmToFile(ep.url, { start: 0, duration: args.window, outFile: raw });
      const buffer = fs.readFileSync(raw);
      const fps = fingerprintPcm(buffer);
      seqs.push(fps);
      report.push({ code: ep.code, url: ep.url, frames: fps.length });
      // Guardar huellas para iterar el matching sin re-descargar audio
      fs.writeFileSync(
        path.join(outDir, `${seriesId}.s${season.num}.ep${i + 1}.bands.json`),
        JSON.stringify(fps.map((f) => f.bands))
      );
      console.log(`   huella calculada: ${fps.length} segundos`);
    } catch (e) {
      console.warn(`   ⚠️ fallo en ${ep.code}: ${e.message}`);
      report.push({ code: ep.code, url: ep.url, error: e.message });
    } finally {
      try { fs.unlinkSync(raw); } catch { /* ignore */ }
    }
  }

  if (seqs.length < 2) {
    console.error('\n❌ No hubo suficientes episodios analizados.');
    process.exit(1);
  }

  const result = findIntroConsensus(seqs, {
    threshold: args.threshold,
    minSec: args.minSec,
    similarity: args.similarity,
    maxOffset: args.maxOffset,
  });

  console.log('\n================ RESULTADO ================');
  if (!result) {
    console.log('No se encontró un segmento repetido (intro) con estos parámetros.');
  } else {
    console.log(`Intro detectada →  start=${result.start}s  end=${result.end}s  (duración ${result.length}s)`);
    console.log(`(alineación offset=${result.offset}s · consenso ≥ ${(args.threshold * 100).toFixed(0)}% · similitud ≥ ${args.similarity})`);
  }

  // Verificación: fracción de episodios que comparten espectro por segundo (alrededor del rango)
  const agree = result ? agreementProfile(seqs, args.similarity, result.offset) : [];
  const lo = Math.max(0, (result ? result.start : 0) - 5);
  const hi = Math.min(agree.length, (result ? result.end : 24) + 5);
  console.log('\n--- Verificación (fracción de episodios que comparten espectro por segundo) ---');
  console.log('seg : fraccion | barra');
  for (let t = lo; t < hi; t++) {
    const frac = agree[t] || 0;
    const bar = '#'.repeat(Math.round(frac * 20)).padEnd(20, '.');
    const inIntro = result && t >= result.start && t < result.end;
    console.log(`${String(t).padStart(4)}s : ${(frac * 100).toFixed(0).padStart(3)}% ${bar}${inIntro ? '  <-- INTRO' : ''}`);
  }

  const payload = {
    seriesId,
    season: season.num,
    sample: sample.map((s) => s.code),
    intro: result,
    report,
  };
  const outFile = path.join(outDir, `${seriesId}.s${season.num}.json`);
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log('\nResultado guardado en', outFile);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});