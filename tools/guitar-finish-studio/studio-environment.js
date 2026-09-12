import * as T from 'three';
import capture from './captured-studio.json' with {type:'json'};

export function studioPixels(fill=0) {
  const packed=Uint8Array.from(atob(capture.pixels),c=>c.charCodeAt(0)),pixels=new Uint16Array(capture.width*capture.height*4);
  for(let i=0;i<packed.length;i+=4) {
    const scale=packed[i+3]?2**(packed[i+3]-128)/255:0;
    for(let c=0;c<3;c++)pixels[i+c]=T.DataUtils.toHalfFloat(Math.min(65504,packed[i+c]*scale+Math.max(0,fill)));
    pixels[i+3]=T.DataUtils.toHalfFloat(1);
  }
  return pixels;
}
export function studioEnvironment(renderer) {
  // Neutral light-tent fill keeps reflective faces readable without painting
  // highlights into chrome or changing the archived captured HDR data.
  const input=new T.DataTexture(studioPixels(.18),capture.width,capture.height,T.RGBAFormat,T.HalfFloatType);
  input.colorSpace=T.LinearSRGBColorSpace;input.mapping=T.EquirectangularReflectionMapping;input.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer);
  const environment=generator.fromEquirectangular(input);
  input.dispose();generator.dispose();return environment;
}
