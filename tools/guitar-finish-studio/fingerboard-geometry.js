import * as T from 'three';
export const fingerboardRadius=.3048; // 12 inches: a visual default, not every guitar.
export const fingerboardSag=x=>fingerboardRadius-Math.sqrt(fingerboardRadius**2-x*x);
export function fingerboardGeometry(nut,end,nutWidth,endWidth) {
  const positions=[],uvs=[],indices=[],segments=16;
  // Separate top/bottom strips and end/side faces keep the edge crisp.
  for(const top of [false,true])for(let row=0;row<2;row++)for(let i=0;i<=segments;i++) {
    const x=(i/segments-.5)*(row?nutWidth:endWidth);
    positions.push(x,row?nut:end,(top?.004:0)-fingerboardSag(x));uvs.push(i/segments,row);
  }
  const layer=(segments+1)*2;
  for(let side=0;side<2;side++)for(let i=0;i<segments;i++) {
    const a=side*layer+i,b=a+1,c=a+segments+1,d=c+1;
    indices.push(...(side?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
  }
  function face(a,b,c,d) {
    const base=positions.length/3;
    for(const index of [a,b,c,d]) {positions.push(...positions.slice(index*3,index*3+3));uvs.push(...uvs.slice(index*2,index*2+2));}
    indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  for(let i=0;i<segments;i++) {
    face(i,i+1,layer+i+1,layer+i);
    const j=segments+1+i;face(j+1,j,layer+j,layer+j+1);
  }
  face(segments+1,0,layer,layer+segments+1);
  face(segments,segments*2+1,layer+segments*2+1,layer+segments);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function fretGeometry(width) {
  const geometry=new T.CylinderGeometry(.00075,.00075,width,8,8,false);
  geometry.rotateZ(Math.PI/2);
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-fingerboardSag(p.getX(i)));
  geometry.computeVertexNormals();return geometry;
}
