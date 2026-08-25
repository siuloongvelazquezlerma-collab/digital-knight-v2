import { framesSimilar } from './fingerprint.mjs';

function agreementProfile(seqs, simThresh, offset = 0) {
  const numEp = seqs.length;
  const len = Math.min(...seqs.map((s) => s.length - offset));
  if (len <= 0) return [];
  const agree = new Array(len).fill(0);
  for (let t = 0; t < len; t++) {
    let best = 0;
    for (let a = 0; a < numEp; a++) {
      let c = 0;
      for (let b = 0; b < numEp; b++) {
        // a fija en t; b desplazada por offset
        const bt = offset >= 0 ? t : t - offset;
        const at = offset >= 0 ? t + offset : t;
        if (bt < 0 || bt >= seqs[b].length) continue;
        if (at >= seqs[a].length) continue;
        if (framesSimilar(seqs[a][at], seqs[b][bt]) >= simThresh) c++;
      }
      if (c > best) best = c;
    }
    agree[t] = best / numEp;
  }
  return agree;
}

function longestRun(agree, minSec, thresh) {
  const len = agree.length;
  let bestStart = -1;
  let bestLen = 0;
  let run = -1;
  for (let t = 0; t <= len; t++) {
    if (t < len && agree[t] >= thresh) {
      if (run < 0) run = t;
    } else {
      if (run >= 0) {
        const l = t - run;
        if (l > bestLen) {
          bestLen = l;
          bestStart = run;
        }
      }
      run = -1;
    }
  }
  if (bestStart < 0 || bestLen < minSec) return null;
  return { start: bestStart, end: bestStart + bestLen, length: bestLen };
}

/**
 * Encuentra el segmento repetido (intro) entre episodios de la misma temporada.
 * Compara la FORMA espectral (similitud coseno) en vez de códigos exactos,
 * lo que tolera diferencias de masterización/códec entre episodios.
 *
 * Primero intenta con alineación offset=0 (intro en el mismo segundo relativo).
 * Si no encuentra nada, busca el mejor desplazamiento (cold opens / intros que
 * empiezan más tarde) en un rango pequeño y se queda con el mejor resultado.
 *
 * @param {Array<Array<{bands:number[]}>>} seqs
 * @returns {{start:number,end:number,length:number,offset:number,threshold:number}|null}
 */
export function findIntroConsensus(seqs, { similarity = 0.92, minSec = 6, threshold = 0.6, maxOffset = 30 } = {}) {
  if (!seqs || seqs.length < 2) return null;
  const numEp = seqs.length;
  const len = Math.min(...seqs.map((s) => s.length));

  let best = null;
  // intenta offset 0 y pequeños desplazamientos
  for (let offset = 0; offset <= Math.min(maxOffset, len - 1); offset++) {
    const agree = agreementProfile(seqs, similarity, offset);
    const run = longestRun(agree, minSec, threshold);
    if (!run) continue;
    // score: longitud * (agreement medio en el rango)
    let sum = 0;
    for (let t = run.start; t < run.end; t++) sum += agree[t];
    const avg = run.length > 0 ? sum / run.length : 0;
    if (!best || run.length > best.length || (run.length === best.length && avg > best.avg)) {
      best = { ...run, offset, avg, agree };
    }
  }

  if (!best) return null;
  const { agree, offset, avg, ...rest } = best;
  // reintentar con tolerancia menor si el mejor es débil
  return { ...rest, offset, avgAgreement: avg };
}

// Exportamos helpers para el informe de verificación
export { agreementProfile, longestRun };