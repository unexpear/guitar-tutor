import * as T from 'three';

// Lower the perimeter, leaving the bridge/neck mounting plateau unchanged.
export function carveHeight(x,y,outline) {
  let distance=Infinity;
  for(let i=0;i<outline.length;i++) {
    const a=outline[i],b=outline[(i+1)%outline.length],dx=b.x-a.x,dy=b.y-a.y;
    const t=T.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
    distance=Math.min(distance,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
  }
  // Zero first AND second derivatives at the rim/plateau avoid a sudden
  // curvature change in long clearcoat reflections.
  return -.006*(1-T.MathUtils.smootherstep(distance,0,.065))||0;
}

export function carvedNormal(position,normal,outline,depth,heightAt=carveHeight) {
  const offset=heightAt(position.x,position.y,outline);
  const weight=T.MathUtils.clamp(position.z/depth,0,1),e=.0001;
  const dx=(heightAt(position.x+e,position.y,outline)-heightAt(position.x-e,position.y,outline))/(2*e)*weight;
  const dy=(heightAt(position.x,position.y+e,outline)-heightAt(position.x,position.y-e,outline))/(2*e)*weight;
  // The clamped deformation has no z derivative outside the body slab.
  // Applying offset/depth there incorrectly bends the bevel's normals.
  const derivative=position.z>0&&position.z<depth?offset/depth:0;
  const nz=normal.z/(1+derivative);
  return new T.Vector3(normal.x-dx*nz,normal.y-dy*nz,nz).normalize();
}

export function carveTop(source,outline,depth,lod,heightAt=carveHeight,detailLimit) {
  const positions=[],normals=[],uvs=[],groups=[];
  const p=source.attributes.position,n=source.attributes.normal,uv=source.attributes.uv;
  const vertex=i=>({p:new T.Vector3().fromBufferAttribute(p,i),n:new T.Vector3().fromBufferAttribute(n,i),uv:new T.Vector2().fromBufferAttribute(uv,i)});
  const middle=(a,b)=>({p:a.p.clone().add(b.p).multiplyScalar(.5),n:a.n.clone().add(b.n).normalize(),uv:a.uv.clone().add(b.uv).multiplyScalar(.5)});
  const emit=v=>{
    const offset=heightAt(v.p.x,v.p.y,outline),weight=T.MathUtils.clamp(v.p.z/depth,0,1);
    const normal=carvedNormal(v.p,v.n,outline,depth,heightAt);
    positions.push(v.p.x,v.p.y,v.p.z+offset*weight);normals.push(...normal.toArray());uvs.push(v.uv.x,v.uv.y);
  };
  const triangle=(a,b,c,level=0)=>{
    const lengths=[a.p.distanceToSquared(b.p),b.p.distanceToSquared(c.p),c.p.distanceToSquared(a.p)];
    const longest=Math.max(...lengths),limit=detailLimit??(lod===0?.012:.018);
    if(a.n.z>.999&&b.n.z>.999&&c.n.z>.999&&longest>limit*limit&&level<12) {
      const edge=lengths.indexOf(longest);
      if(edge===0){const m=middle(a,b);triangle(a,m,c,level+1);triangle(m,b,c,level+1);}
      else if(edge===1){const m=middle(b,c);triangle(a,b,m,level+1);triangle(a,m,c,level+1);}
      else {const m=middle(c,a);triangle(a,b,m,level+1);triangle(m,b,c,level+1);}
    } else {emit(a);emit(b);emit(c);}
  };
  for(const group of source.groups) {
    const start=positions.length/3;
    for(let i=group.start;i<group.start+group.count;i+=3)triangle(vertex(i),vertex(i+1),vertex(i+2));
    groups.push({start,count:positions.length/3-start,materialIndex:group.materialIndex});
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  for(const group of groups)geometry.addGroup(group.start,group.count,group.materialIndex);
  return geometry;
}
