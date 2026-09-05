import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { validateBytes } from 'gltf-validator';
const directory=process.argv[2];
if(!directory)throw new Error('Usage: npm run validate -- path/to/extracted/asset');
const files=(await readdir(directory)).filter(name=>name.endsWith('.glb'));
if(!files.length)throw new Error('No GLB files found');
for(const name of files){
  const bytes=await readFile(join(directory,name));
  const report=await validateBytes(new Uint8Array(bytes),{maxIssues:0});
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  if(json.animations?.length || json.skins?.length)throw new Error(`${name}: must remain static`);
  if(json.images?.some(image=>image.uri)||json.buffers?.some(buffer=>buffer.uri))throw new Error(`${name}: external dependency`);
  console.log(`${name}: ${report.issues.numErrors} errors, ${report.issues.numWarnings} warnings; static and self-contained`);
  if(report.issues.numErrors||report.issues.numWarnings){console.error(report.issues.messages.filter(m=>m.severity<2));process.exitCode=1;}
}
