// Reproducible CC0 recording subset, not synthesized music.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const revision = 'b4920dc662fd9cad6dcaccdeecffdd91c8725d8c';
const base = `https://raw.githubusercontent.com/sfzinstruments/karoryfer.emilyguitar/${revision}/`;
const roots = [['e2',40],['gb2',42],['a2',45],['c3',48],['eb3',51],['gb3',54],['a3',57],['c4',60],['eb4',63],['gb4',66],['a4',69]];
const directory = new URL('../assets/audio/recorded-chords/', import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = { source: base, license: 'CC0-1.0', processing: '24-bit PCM to mono 16-bit PCM; peak normalized to 0.65; 3 seconds maximum, 80 ms fade out; no synthesis or pitch shift', samples: [] };
for (const [name,midi] of roots) {
  const path = `notes/${name}_mf_rr1.wav`;
  const response = await fetch(base + path); if (!response.ok) throw new Error(`Download failed: ${path}`);
  const input = Buffer.from(await response.arrayBuffer());
  if (input.toString('ascii',0,4) !== 'RIFF' || input.toString('ascii',8,12) !== 'WAVE') throw new Error('Not WAV');
  let fmt, data;
  for (let offset=12; offset+8<=input.length;) {
    const id=input.toString('ascii',offset,offset+4), size=input.readUInt32LE(offset+4);
    if (offset+8+size>input.length) throw new Error('Truncated WAV');
    if(id==='fmt ') fmt=input.subarray(offset+8,offset+8+size);
    if(id==='data') data=input.subarray(offset+8,offset+8+size);
    offset+=8+size+(size%2);
  }
  if(!fmt || !data || fmt.readUInt16LE(0)!==1 || fmt.readUInt16LE(14)!==24) throw new Error('Expected PCM24');
  const channels=fmt.readUInt16LE(2), rate=fmt.readUInt32LE(4), stride=channels*3;
  if(rate!==44100 || channels<1 || channels>2 || data.length%stride) throw new Error('Unexpected sample format');
  const count=Math.min(data.length/stride,rate*3), values=new Float64Array(count);
  let peak=0;
  for(let i=0;i<count;i++) { for(let c=0;c<channels;c++) values[i]+=data.readIntLE(i*stride+c*3,3)/8388608/channels; peak=Math.max(peak,Math.abs(values[i])); }
  if(peak<.001) throw new Error('Silent recording');
  const out=Buffer.alloc(44+count*2);
  out.write('RIFF'); out.writeUInt32LE(out.length-8,4); out.write('WAVEfmt ',8); out.writeUInt32LE(16,16); out.writeUInt16LE(1,20); out.writeUInt16LE(1,22);
  out.writeUInt32LE(rate,24); out.writeUInt32LE(rate*2,28); out.writeUInt16LE(2,32); out.writeUInt16LE(16,34); out.write('data',36); out.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++) out.writeInt16LE(Math.round(values[i]/peak*.65*Math.min(1,(count-1-i)/(rate*.08))*32767),44+i*2);
  await writeFile(new URL(`${name}.wav`,directory),out);
  manifest.samples.push({name,midi,path,sourceSha256:createHash('sha256').update(input).digest('hex'),sha256:createHash('sha256').update(out).digest('hex'),bytes:out.length});
}
const license=await fetch(base+'LICENSE'); if(!license.ok) throw new Error('Missing license');
await writeFile(new URL('LICENSE.txt',directory),await license.text());
await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.log(`${manifest.samples.length} real guitar recordings imported (${manifest.samples.reduce((sum,s)=>sum+s.bytes,0)} bytes).`);
