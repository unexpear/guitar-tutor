import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../../output/material-source/Wood062/',import.meta.url);
const names=['Color','Displacement','Roughness'];
const channels=[],hashes={};
for(const name of names) {
  const bytes=await readFile(new URL(`Wood062_1K-JPG_${name}.jpg`,base));
  hashes[name]=createHash('sha256').update(bytes).digest('hex');
  channels.push(await sharp(bytes).rotate(90).resize(256,256).greyscale().raw().toBuffer());
}
const packed=Buffer.alloc(256*256*3);
for(let i=0;i<256*256;i++)for(let c=0;c<3;c++)packed[i*3+c]=channels[c][i];
const color=await sharp(await readFile(new URL('Wood062_1K-JPG_Color.jpg',base))).rotate(90).resize(256,256).removeAlpha().raw().toBuffer();
await writeFile(new URL('./captured-wood.json',import.meta.url),JSON.stringify({size:256,channels:['luminance','height','roughness'],source:'https://ambientcg.com/view?id=Wood062',license:'CC0-1.0',sourceSha256:hashes,pixels:packed.toString('base64'),color:color.toString('base64')}));
console.log(`Baked ${packed.length} bytes; vertical grain; no runtime fetch`);
