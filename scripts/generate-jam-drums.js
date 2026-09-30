/**
 * Short original drum one-shots for jam backing tracks.
 * Synthesized (not sampled from commercial kits). Same WAV writer style as
 * scripts/generate-samples.js.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(samples) {
  const numSamples = samples.length;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) buffer[offset++] = str.charCodeAt(i);
  };
  const writeInt32 = (value) => {
    buffer[offset++] = value & 0xff;
    buffer[offset++] = (value >> 8) & 0xff;
    buffer[offset++] = (value >> 16) & 0xff;
    buffer[offset++] = (value >> 24) & 0xff;
  };
  const writeInt16 = (value) => {
    buffer[offset++] = value & 0xff;
    buffer[offset++] = (value >> 8) & 0xff;
  };

  writeString('RIFF');
  writeInt32(36 + dataSize);
  writeString('WAVE');
  writeString('fmt ');
  writeInt32(16);
  writeInt16(1);
  writeInt16(numChannels);
  writeInt32(SAMPLE_RATE);
  writeInt32(byteRate);
  writeInt16(blockAlign);
  writeInt16(bitsPerSample);
  writeString('data');
  writeInt32(dataSize);

  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    writeInt16(Math.floor(clamped * 32767));
  }
  return buffer;
}

function kick() {
  const duration = 0.28;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 150 * Math.exp(-t * 28) + 42;
    const body = Math.sin(2 * Math.PI * freq * t);
    const click = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 90) * 0.18;
    const env = Math.exp(-t * 9);
    out[i] = (body * 0.9 + click) * env;
  }
  return out;
}

function snare() {
  const duration = 0.22;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Array(n);
  let noise = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    noise = Math.random() * 2 - 1;
    const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 22);
    const body = noise * Math.exp(-t * 16);
    out[i] = tone * 0.35 + body * 0.65;
  }
  return out;
}

function hat() {
  const duration = 0.08;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    const bright =
      Math.sin(2 * Math.PI * 7800 * t) * 0.25 +
      Math.sin(2 * Math.PI * 11200 * t) * 0.18;
    out[i] = (noise * 0.7 + bright) * Math.exp(-t * 55) * 0.55;
  }
  return out;
}

const outDir = path.join(__dirname, '..', 'assets', 'audio', 'jam');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'kick.wav'), writeWav(kick()));
fs.writeFileSync(path.join(outDir, 'snare.wav'), writeWav(snare()));
fs.writeFileSync(path.join(outDir, 'hat.wav'), writeWav(hat()));
console.log(`Wrote kick.wav, snare.wav, hat.wav in ${outDir}`);
