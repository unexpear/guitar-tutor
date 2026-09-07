import { readFile, writeFile, mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import { build } from 'esbuild';
const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
const literal=source.match(/const outlines = (\{[\s\S]*?\n    \});/)?.[1];
if(!literal)throw Error('Missing shared model outlines');
const check=process.argv.includes('--check');
if(check&&process.argv.includes('--preview'))throw Error('--check cannot write a preview');
const outlinesURL=new URL('./mobile-outlines.json',import.meta.url);
const outlines=JSON.stringify(vm.runInNewContext(`(${literal})`));
if(check){
  if(await readFile(outlinesURL,'utf8')!==outlines)throw Error('Mobile outlines are stale; run build-mobile.mjs');
}else await writeFile(outlinesURL,outlines);
const result=await build({entryPoints:[new URL('./mobile-scene.js',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')],bundle:true,write:false,format:'iife',minify:true,legalComments:'inline'});
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src blob:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:"><style>html,body,canvas{margin:0;width:100%;height:100%;overflow:hidden}body{background:#141522}</style></head><body><canvas></canvas><script>${js}</script></body></html>`;
const outputURL=new URL('../../features/tuner/components/mobileGuitarHtml.json',import.meta.url);
if(check){
  if(await readFile(outputURL,'utf8')!==JSON.stringify(html))throw Error('Mobile scene is stale; run build-mobile.mjs');
}else await writeFile(outputURL,JSON.stringify(html));
console.log(check?'Verified current offline 3D scene:':'Bundled offline 3D scene:',html.length,'bytes');
if(process.argv.includes('--preview')) {
  await mkdir(new URL('../../output/playwright/',import.meta.url),{recursive:true});
  await writeFile(new URL('../../output/playwright/guitar-mobile.html',import.meta.url),html);
}
