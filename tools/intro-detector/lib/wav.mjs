// lib/wav.mjs — helpers para escribir WAV (PCM s16le) y rebanar tramos desde un buffer s16le
import fs from 'node:fs';

const SAMPLE_RATE = 16000;

function writeWav(outFile, samples /* Int16Array */, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) buf.writeInt16LE(samples[i], 44 + i * 2);
  fs.writeFileSync(outFile, buf);
}

// buffer: Node Buffer s16le mono @16000. Devuelve Int16Array del tramo [startSec, startSec+lenSec)
function slicePcm16(buffer, startSec, lenSec) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const n = Math.floor(lenSec * SAMPLE_RATE);
  const total = Math.floor(buffer.length / 2);
  const from = Math.max(0, startSample);
  const to = Math.min(total, startSample + n);
  const out = new Int16Array(Math.max(0, to - from));
  for (let i = from; i < to; i++) out[i - from] = buffer.readInt16LE(i * 2);
  return out;
}

export { writeWav, slicePcm16, SAMPLE_RATE };