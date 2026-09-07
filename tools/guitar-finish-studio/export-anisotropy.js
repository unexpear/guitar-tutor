// Three r185 exports clearcoat/iridescence but not KHR_materials_anisotropy.
// Keep preview and portable GLB materials aligned without patching dependencies.
export function anisotropyExporter(writer) {
  const name='KHR_materials_anisotropy';
  return {name,async writeMaterialAsync(material,definition) {
    if(!material.isMeshPhysicalMaterial||!(material.anisotropy>0))return;
    const extension={anisotropyStrength:material.anisotropy,anisotropyRotation:material.anisotropyRotation};
    if(material.anisotropyMap) {
      const texture=material.anisotropyMap;
      extension.anisotropyTexture={index:await writer.processTextureAsync(texture),texCoord:texture.channel};
      writer.applyTextureTransform(extension.anisotropyTexture,texture);
    }
    definition.extensions??={};definition.extensions[name]=extension;
    writer.extensionsUsed[name]=true;
  }};
}
