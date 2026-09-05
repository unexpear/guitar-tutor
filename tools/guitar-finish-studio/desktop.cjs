const {app,BrowserWindow,protocol,session,Menu,dialog}=require('electron');
const {readFile,mkdir,writeFile}=require('node:fs/promises');
const path=require('node:path');
const smoke=process.argv.includes('--smoke-test');
const qaDirectory=path.join(app.getPath('temp'),'guitar-finish-studio-desktop-qa');
app.setName('Guitar Finish Studio');
// Fixed identity survives portable EXE extraction and version changes.
app.setPath('userData',smoke?path.join(qaDirectory,'profile'):path.join(app.getPath('appData'),'GuitarFinishStudio'));
protocol.registerSchemesAsPrivileged([{scheme:'studio',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const files=new Set(['index.html','styles.css','app.js','review.js','workspace.js','mesh-studio.bundle.js','sources/acoustic-cutaway-wood.png','sources/electric-singlecut-wood.png']);
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png'};
const csp="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
let window;
app.whenReady().then(async()=>{
  protocol.handle('studio',async request=>{
    const url=new URL(request.url),file=url.pathname.slice(1);
    if(url.host!=='app'||!files.has(file)||request.method!=='GET')return new Response('Not found',{status:404});
    try{return new Response(await readFile(path.join(__dirname,file)),{headers:{'Content-Type':mime[path.extname(file)],'Content-Security-Policy':csp}});}
    catch{return new Response('Asset unavailable',{status:404});}
  });
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
  window=new BrowserWindow({width:1366,height:920,minWidth:640,minHeight:540,show:false,backgroundColor:'#090a0d',title:'Guitar Finish Studio',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',event=>event.preventDefault());
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'File',submenu:[{role:'quit'}]},
    {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},
  ]));
  if(!smoke) window.once('ready-to-show',()=>window.show());
  const errors=[];
  window.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);});
  session.defaultSession.on('will-download',(_event,item)=>{
    if(smoke)item.setSavePath(path.join(qaDirectory,path.basename(item.getFilename())));
    else item.setSaveDialogOptions({title:'Save Guitar Finish Studio export'});
    item.once('done',(_event,state)=>{
      if(!smoke && state==='interrupted')void dialog.showMessageBox(window,{type:'error',message:'Export could not be saved. Please try again.'});
    });
  });
  await window.loadURL('studio://app/index.html');
  if(smoke){
    await mkdir(qaDirectory,{recursive:true});
    const timeout=setTimeout(()=>app.exit(1),60000);
    try{
      const download=new Promise(resolve=>session.defaultSession.once('will-download',(_event,item)=>item.once('done',(_event,state)=>resolve({state,path:item.getSavePath()}))));
      const result=await window.webContents.executeJavaScript(`(async()=>{
        const wait=async test=>{for(let i=0;i<200;i++){if(test())return;await new Promise(r=>setTimeout(r,50));}throw Error('UI timed out');};
        await wait(()=>document.querySelector('#status').textContent.includes('recognized'));
        document.querySelector('[data-workspace="collection"]').click();
        document.querySelector('#batch-count').value='2';document.querySelector('#generate-batch').click();
        await wait(()=>!document.querySelector('#export-batch').disabled);
        const security={node:typeof require,bridge:typeof window.electron};
        document.querySelector('#export-batch').click();
        return {security,preview:document.querySelector('#mesh-status').textContent,collection:document.querySelectorAll('#batch-gallery canvas').length};
      })()`);
      const saved=await download;
      await writeFile(path.join(qaDirectory,'window.png'),(await window.webContents.capturePage()).toPNG());
      await writeFile(path.join(qaDirectory,'report.json'),JSON.stringify({packaged:app.isPackaged,version:app.getVersion(),...result,download:saved,errors},null,2));
      clearTimeout(timeout);app.exit(saved.state==='completed'&&result.collection===2&&result.security.node==='undefined'&&!errors.length?0:1);
    }catch(error){await writeFile(path.join(qaDirectory,'report.json'),JSON.stringify({error:String(error),errors}));app.exit(1);}
  }
}).catch(error=>{console.error(error);app.exit(1);});
app.on('window-all-closed',()=>app.quit());
