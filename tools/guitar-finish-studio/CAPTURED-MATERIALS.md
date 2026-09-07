# Captured material provenance

Studio Small 09 by Sergej Majboroda / Poly Haven:
https://polyhaven.com/a/studio_small_09
License: CC0 1.0, https://polyhaven.com/license
Downloaded 2026-09-06 from the original 4K EXR asset. Linear-light box filtering
reduces it to 512×256; a shared-exponent RGB8 encoding preserves HDR radiance.
The source SHA-256 and peak radiance are in captured-studio.json. Reproduce with
bake-studio-light.mjs. Preview renders and logos are not redistributed. The EXR
decoder is used only at build time, not shipped in the desktop/mobile runtime.
The runtime decodes to half-float and prefilters once for physical materials.
GLB exports contain materials/textures, not this application's lighting setup.

Rosewood Veneer1 by Jenelle van Heerden / Poly Haven:
https://polyhaven.com/a/rosewood_veneer1
License: CC0 1.0, https://polyhaven.com/license
Downloaded 2026-09-06. Original 4K diffuse and roughness assets, not preview renders.
The 2.4 m source is cropped to a narrow longitudinal board and baked to 64×512
RGB/roughness in captured-rosewood.json with SHA-256 source hashes. Reproduce
with bake-rosewood.mjs. Fretboard/bridge darkening and increased roughness are
artistic derivatives of the lacquered veneer, not measured unfinished rosewood.

Wood062 by ambientCG / Lennart Demes:
https://ambientcg.com/view?id=Wood062

License: CC0 1.0; redistribution and modification permitted.
https://docs.ambientcg.com/license/
https://creativecommons.org/publicdomain/zero/1.0/

Source archive: https://ambientcg.com/get?file=Wood062_1K-JPG.zip
Downloaded 2026-09-06. Provider describes capture as Photometric Stereo.
Not identified as a specific wood species or figured maple.

Color luminance, displacement and roughness maps are rotated to longitudinal
grain, reduced to 256 square and packed into captured-wood.json. Source file
SHA-256 hashes are included there. Original textures are not needed at runtime.
The build script bake-captured-wood.mjs reproduces the packed derivative from
the downloaded source archive under output/material-source/Wood062.

The derivative also retains RGB source color, normalized per channel for local
warm/cool variation under user-selected stains. Hardware/plastic roughness and
string-winding normals are procedural, not captured or measured. Bronze wound
acoustic bass strings and nickel wound electric bass strings are separate from
plain steel trebles and hardware plating. These are default visual string sets,
not a claim that every real guitar uses those alloys.

One directional shadow map is used (512 square on phones, 1024 in the studio).
Small decorative parts and strings do not cast shadows. The scene remains
event-driven; physical-device performance is not yet verified.

Application stains and finish roughness are artistic modifications of this source;
they are not measured finish samples. Figured families remain approximations.

Pearlescent and Metallic Flake are procedural PBR approximations, not captured
coatings. Metallic flakes vary base-layer normals beneath a smooth clearcoat.
Pearl uses the shared mask texture's green channel for thin-film thickness
(300–650 nm); the red channel controls coverage. No extra texture is required
for thickness. Appearance depends on lighting, view angle, and importer support
for glTF iridescence/clearcoat extensions; no animation is required.
