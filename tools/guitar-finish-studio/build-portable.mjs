// Build a single offline document. Runtime users need only a WebGL-capable browser.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const source=dirname(fileURLToPath(import.meta.url));
const destination=process.argv[2];
if(!destination) throw new Error('Pass the output HTML path');
const read=name=>readFile(resolve(source,name),'utf8');
let html=await read('index.html');
const css=await read('styles.css');
html=html.replace('<link rel="stylesheet" href="styles.css" />',()=>`<style>${css}</style>`);
const samples={};
for(const filename of ['acoustic-cutaway-wood.png','electric-singlecut-wood.png']) {
  samples[filename]=`data:image/png;base64,${(await readFile(resolve(source,'sources',filename))).toString('base64')}`;
}
const safeScript=text=>text.replace(/<\/script/gi,'<\\/script');
for(const filename of ['review.js','mesh-studio.bundle.js','app.js','workspace.js']) {
  const contents=(filename==='app.js'?`window.GUITAR_STUDIO_SAMPLES=${JSON.stringify(samples)};\n`:'')+await read(filename);
  html=html.replace(`<script src="${filename}"></script>`,()=>`<script>${safeScript(contents)}</script>`);
}
await writeFile(resolve(destination),html);
console.log(`Portable HTML: ${resolve(destination)}`);
