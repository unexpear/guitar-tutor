import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../../output/material-source/rosewood_veneer1/',import.meta.url);
const hashes={},channels=[];
for(const name of ['color','roughness']) {
  const bytes=await readFile(new URL(`${name}.jpg`,base));hashes[name]=createHash('sha256').update(bytes).digest('hex');
  let pipeline=sharp(bytes).extract({left:1400,top:800,width:100,height:1100}).resize(64,512).removeAlpha();
  if(name==='roughness')pipeline=pipeline.greyscale();
  channels.push(await pipeline.raw().toBuffer());
}
const data=Buffer.alloc(64*512*4);
for(let i=0;i<64*512;i++){for(let c=0;c<3;c++)data[i*4+c]=channels[0][i*3+c];data[i*4+3]=channels[1][i];}
await writeFile(new URL('./captured-rosewood.json',import.meta.url),JSON.stringify({width:64,height:512,source:'https://polyhaven.com/a/rosewood_veneer1',author:'Jenelle van Heerden',license:'CC0-1.0',sourceSha256:hashes,pixels:data.toString('base64')}));
