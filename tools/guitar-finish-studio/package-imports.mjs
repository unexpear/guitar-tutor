// Package reviewed static GLBs as offline native bridge data; no runtime fetch.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const models={};
for(const [id,name] of [['acoustic-classical','classical'],['electric-cotton-candy','cotton']]){
 const bytes=await readFile(new URL(`output/imported-guitars/material-review/${name}.glb`,root));
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 if(json.animations?.length||json.skins?.length||json.buffers.some(b=>b.uri)||json.images?.some(i=>i.uri))throw Error('Expected static self-contained model');
 for(let i=1;i<=6;i++)if(!json.nodes.some(n=>n.name===`String_${i}`))throw Error(`${id} lacks String_${i}`);
 models[id]=bytes.toString('base64');
}
await mkdir(new URL('assets/guitars/imported/',root),{recursive:true});
await writeFile(new URL('assets/guitars/imported/models.json',root),JSON.stringify(models));
