const fs = require('fs');
const path = require('path');

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToFrequency(note, octave) {
  const noteIndex = NOTE_NAMES.indexOf(note);
  const midiNote = (octave + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function generateWav(frequency, duration = 2.0, sampleRate = 44100) {
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  function writeString(str) {
    for (let i = 0; i < str.length; i++) {
      buffer[offset++] = str.charCodeAt(i);
    }
  }

  function writeInt32(value) {
    buffer[offset++] = value & 0xFF;
    buffer[offset++] = (value >> 8) & 0xFF;
    buffer[offset++] = (value >> 16) & 0xFF;
    buffer[offset++] = (value >> 24) & 0xFF;
  }

  function writeInt16(value) {
    buffer[offset++] = value & 0xFF;
    buffer[offset++] = (value >> 8) & 0xFF;
  }

  writeString('RIFF');
  writeInt32(fileSize);
  writeString('WAVE');
  writeString('fmt ');
  writeInt32(16);
  writeInt16(1);
  writeInt16(numChannels);
  writeInt32(sampleRate);
  writeInt32(byteRate);
  writeInt16(blockAlign);
  writeInt16(bitsPerSample);
  writeString('data');
  writeInt32(dataSize);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 2.5) * (1 - Math.exp(-t * 50));
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic2 = 0.3 * Math.sin(2 * Math.PI * frequency * 2 * t);
    const harmonic3 = 0.1 * Math.sin(2 * Math.PI * frequency * 3 * t);
    const sample = (fundamental + harmonic2 + harmonic3) * envelope * 0.8;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    writeInt16(intSample);
  }

  return buffer;
}

const outputDir = path.join(__dirname, '..', 'assets', 'audio');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let count = 0;
// B0 covers standard five/six-string bass. Octave 1 covers four-string bass,
// baritone and extended-range guitar reference pitches.
const b0 = generateWav(noteToFrequency('B', 0));
fs.writeFileSync(path.join(outputDir, 'B0.wav'), b0);
count++;

for (let octave = 1; octave <= 6; octave++) {
  for (const note of NOTE_NAMES) {
    if (octave === 6 && NOTE_NAMES.indexOf(note) > 4) continue;
    const freq = noteToFrequency(note, octave);
    const wav = generateWav(freq);
    const filename = `${note}${octave}.wav`;
    fs.writeFileSync(path.join(outputDir, filename), wav);
    count++;
  }
}

console.log(`Generated ${count} WAV files in ${outputDir}`);
