import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let cached = null;

/**
 * Resuelve los binarios de ffmpeg/ffprobe:
 *   1) bundle de npm (ffmpeg-static / ffprobe-static)  -> recomendado (sin admin)
 *   2) binarios del sistema (ffmpeg / ffprobe en PATH)
 */
export function resolveBinaries() {
  if (cached) return cached;
  let ffmpegPath = 'ffmpeg';
  let ffprobePath = 'ffprobe';
  try {
    const ff = require('ffmpeg-static');
    const fp = require('ffprobe-static');
    ffmpegPath = typeof ff === 'string' ? ff : ff.path;
    ffprobePath = typeof fp === 'string' ? fp : (fp.path || fp.ffprobePath);
  } catch (e) {
    console.warn('[ffmpeg] No se encontró ffmpeg-static (se usará el del PATH):', e.message);
  }
  cached = { ffmpeg: ffmpegPath, ffprobe: ffprobePath };
  return cached;
}

function spawnCollect(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${bin} falló (código ${code}): ${err.slice(-1500)}`));
    });
  });
}

export function ffprobeDuration(url) {
  const { ffprobe } = resolveBinaries();
  return spawnCollect(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    url,
  ]).then((out) => {
    const d = parseFloat(out.trim());
    return Number.isFinite(d) ? d : 0;
  });
}

/**
 * Extrae el audio (PCM int16 mono) de un TRAMO del video a un archivo.
 * NO descarga el episodio completo: usa -ss/-t (búsqueda por rango HTTP),
 * y -vn para descodificar solo audio.
 */
export function extractPcmToFile(url, { start = 0, duration = 240, outFile, sampleRate = 16000 }) {
  const { ffmpeg } = resolveBinaries();
  return spawnCollect(ffmpeg, [
    '-hide_banner', '-loglevel', 'error',
    '-y',
    '-ss', String(start),
    '-t', String(duration),
    '-i', url,
    '-vn',
    '-ac', '1',
    '-ar', String(sampleRate),
    '-f', 's16le',
    outFile,
  ]);
}