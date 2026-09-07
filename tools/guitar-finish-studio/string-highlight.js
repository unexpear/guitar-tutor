import * as T from 'three';

/** Screen-space halo around the actual string surface; never widens the asset. */
export function stringHighlight(model,render){
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,
  uniforms:{viewport:{value:new T.Vector2(innerWidth,innerHeight)},opacity:{value:.4}},
  vertexShader:`uniform vec2 viewport;
  void main(){vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    vec2 n=(projectionMatrix*vec4(normalMatrix*normal,0.0)).xy;
    if(length(n)>0.00001)p.xy+=normalize(n)*p.w*vec2(6.0)/viewport;
    gl_Position=p;}`,
  fragmentShader:`uniform float opacity;void main(){gl_FragColor=vec4(1.0,0.68,0.12,opacity);}`});
 const halos=[];
 for(let i=0;i<6;i++){
  const parts=[];model.getObjectByName(`String_${i+1}`)?.traverse(o=>{if(o.isMesh)parts.push(o);});
  for(const part of parts){const halo=new T.Mesh(part.geometry,material);halo.userData.isStringGlow=true;halo.visible=false;part.add(halo);halos.push({index:i,halo});}
 }
 let timer,selection=null;
 const stop=()=>{if(timer){clearInterval(timer);timer=undefined;}};
 return {
  select(index){
   for(const {index:i,halo} of halos)halo.visible=i===index;
   if(index===selection)return;selection=index;stop();material.uniforms.opacity.value=.4;
   if(Number.isInteger(index)&&index>=0&&index<6&&!matchMedia('(prefers-reduced-motion: reduce)').matches)
    timer=setInterval(()=>{if(document.hidden)return;material.uniforms.opacity.value=.32+.12*(.5+.5*Math.sin(performance.now()/650));render();},100);
  },
  resize(w,h){material.uniforms.viewport.value.set(w,h);},
  dispose(){stop();for(const {halo} of halos)halo.removeFromParent();material.dispose();},
 };
}
