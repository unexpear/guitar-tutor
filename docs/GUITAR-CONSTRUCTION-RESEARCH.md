# Guitar Construction and Classification

## Executive assessment

A believable guitar generator should assemble a coherent instrument before applying decoration. Body outline alone cannot identify construction: an electric guitar may be solid, hollow, or semi-hollow; a short scale does not define a body shape; a cutaway does not determine the string material. Museum classification also distinguishes strings from courses, a useful distinction for historical and twelve-string instruments.[^1][^2]

The recommended architecture is a constrained assembly system with independent fields for instrument family, body construction, silhouette, string arrangement, scale geometry, neck joint, bridge system, electronics, and finish. Randomness should operate inside supported assemblies. Unsupported combinations should be explained, not silently converted into something else. This is an engineering recommendation, not a universal taxonomy used by every manufacturer.

The current generator already provides several useful foundations: meter-scale meshes, mathematical fret placement, actual acoustic soundholes, rounded hardware, separate selectable strings, deterministic finishes, and mobile geometry tests. Its largest remaining realism risks are inconsistent assemblies, incomplete family coverage, exaggerated or mislabeled materials, and differences between export paths. More decoration alone will not resolve these issues.

The immediate research-backed correction is the P/PJ pickup assembly. The existing selector described a split-coil bass pickup while the primary 3D builder produced a full-width bar. It now produces two staggered coil housings, each serving part of the string set, with paired pole pieces. The optional PJ bridge pickup remains separate. This follows the structural distinction described by Seymour Duncan; the resulting mesh is an original approximation, not a manufacturer reproduction.[^3]

## 1. Classification as independent attributes

The Met classifies a historic guitar as a plucked, fretted lute-family chordophone and describes the transition between double-course and single-course guitars. This is useful for cataloging ancestry and string organization, but it is not a sufficient interface for a modern guitar-design tool.[^1]

For the generator, use the following proposed attribute system. A field can be unknown for an imported model; missing evidence must not be replaced by a confident guess.

| Attribute | Examples | What it should control |
|---|---|---|
| Instrument family | Steel-string guitar, nylon-string guitar, electric guitar, electric bass | Starting assembly and appropriate defaults |
| Body construction | Acoustic soundbox, solid, chambered, semi-hollow, hollow electric, resonator | Walls, top/back, cavities, bridge support |
| Silhouette | Non-cutaway, single-cutaway, double-cutaway, offset, compact | Outline, balance of bouts, access around neck |
| Top geometry | Flat-top approximation, carved arch, pressed arch | Surface shape and attachment heights |
| String organization | Six singles, four bass singles, six paired courses | String paths, tuners, bridge anchors, note mapping |
| Scale geometry | Single scale, per-string multiscale | Nut, fret and saddle coordinates |
| Neck assembly | Set joint, bolted joint, neck-through, Spanish heel | Heel, seam, fasteners and rear geometry |
| Headstock | Inline, paired tuners, slotted, headless | Tuner layout and complete string termination |
| Bridge system | Pin bridge, tie block, hardtail, separate tailpiece, vibrato, resonator bridge | Anchorage, saddle support and clearances |
| Electronics | None, magnetic, piezo, microphone, hybrid | Visible hardware and factual labeling |
| Finish | Opaque paint, transparent stain, satin, gloss, metal effect | Material layers, not musical identity |

Yamaha's educational material uses “semi-acoustic” for a center-block semi-hollow design. Elsewhere, guitar terminology can be broader. Prefer the explicit UI term “semi-hollow — center block” and reserve “acoustic-electric” for an acoustic-family instrument equipped for amplification. Do not infer construction from a sales label alone.[^2]

The same restraint applies to “archtop.” A curved top is a geometric characteristic, not sufficient evidence that an instrument is hollow. A carved-top solid-body electric and a hollow archtop should use different assembly definitions even if both have pronounced highlights around their rims.

## 2. Major instrument families

### Steel-string acoustics

An acoustic body is an assembly of top, back, bent sides, internal supports and a neck connection. Bracing is structural reinforcement as well as part of the instrument's vibration behavior; it is not an exterior decoration. Taylor describes top, back and side bracing, with particular emphasis on the top.[^4]

**Generator recommendation:** preserve an actual opening and interior depth at the soundhole. Use distinct top, side, back and bridge materials, with plausible grain direction for each component. Internal bracing can be omitted at small mobile viewing sizes unless it is visible, but an inspection or cutaway model must not imply it has been modeled when it has not.

Body names need caution. Taylor's own families distinguish compact, mid-sized and larger instruments; those names describe its catalog, not a universal geometric standard.[^5] Store measured body length, lower-bout width, waist width, depth and scale separately from a friendly name such as “compact concert.” A narrower waist, smaller body and shorter scale are three independently meaningful changes.

### Nylon-string and classical guitars

Yamaha describes conventional classical treble strings as solid nylon and the bass strings as wound over a multifilament core. Its example classical neck is wider than its example steel-string neck: 52 mm versus 43 mm. These are examples, not required dimensions for all nylon and steel-string guitars.[^6]

**Generator recommendation:** a procedural nylon family needs its own string appearance, bridge anchorage, spacing and headstock logic. Do not reuse the steel-string pin bridge and bronze-string recipe and call the result classical. The approved imported classical model can remain available while a separate procedural nylon assembly is developed and validated.

Flamenco should be a distinct supported variant rather than a classical guitar recolored yellow. Yamaha describes differences in response and design, including the importance of the instrument's intended playing context.[^7] Avoid assigning a simulated sound character to a cosmetic mesh. Any future flamenco preset should document which construction cues it actually implements and which remain illustrative.

### Solid, chambered, semi-hollow and hollow electrics

Yamaha distinguishes solid bodies from hollow instruments and describes a semi-hollow design with a central wooden block and hollow side areas.[^2] Its SA2200 material explicitly identifies a center block beneath the bridge, demonstrating why a hollow-looking exterior is not enough to establish internal construction.[^8]

**Generator recommendation:** separate the cavity system from the outline. A future semi-hollow preset requires a top, back, rim and support structure appropriate to its bridge; merely putting black f-hole decals on a solid slab should be labeled decorative. A chambered body need not display any opening, so a catalog tag must come from the recipe rather than image recognition.

Unusual electric outlines are a good source of visual variety, but the neck, bridge, controls and pickup routes must still land on supported regions. Preserve an ergonomic region around the waist and avoid placing a control on the edge just because an earlier body was wider there.

### Electric basses

Fender describes 34-inch long-scale basses, 30-inch short-scale examples, and an approximately 32-inch medium-scale category. These are useful reference families, not universal boundaries.[^9] A bass is not simply an electric guitar body enlarged uniformly: scale, string count, string spacing and hardware dimensions require separate treatment.

**Generator recommendation:** prioritize accurate four-string bass assemblies before expanding cosmetic variants. Five-string support is an important later addition, but it needs a visible selector, appropriately sized bridge and neck, correct poles or rails, and validation—not just a loop that accepts a fifth string. The current standalone selector omits five strings, while the phone procedural viewer is still configured around six-string guitars. Neither limitation is fixed by the split-coil change.

### Twelve-string and extended-range instruments

Fender's acoustic manual describes a conventional twelve-string layout as six pairs: octave pairs for the lower four courses and unison pairs for the upper two.[^10] A generator that spaces twelve strings uniformly across the neck has not modeled that arrangement faithfully.

**Generator recommendation:** add a course data structure before claiming conventional twelve-string support. Store each string's course, tuning relationship, diameter, lateral offset and anchor. Seven- or eight-string single-course instruments need a different recipe; string count by itself does not determine tuning or course structure.

### Resonators and headless designs

National's Style 1 is a tricone with three resonating cones and a plated brass body. Its visible coverplate and tailpiece belong to an actual resonator assembly, not merely a shiny paint treatment.[^11] A resonator family therefore needs separate topology and bridge support rather than an acoustic soundhole replacement texture.

Strandberg publishes per-string scale lengths for multiscale instruments and separately identifies a straight-scale exception. This is direct evidence that headless branding or appearance must not be used as a substitute for scale geometry.[^12] For a future headless preset, both string clamping and tuning mechanisms must be present; removing the headstock alone leaves an incomplete instrument.

## 3. Guitar making translated into an assembly pipeline

Yamaha's manufacturing overview covers wood selection, controlled drying, accurate machining, bracing, linings, bent sides, neck fitting and finishing. It describes repeated sanding between coating stages and distinguishes the construction of its custom classical neck assembly from other approaches.[^13] These are descriptions of Yamaha's processes, not instructions to reproduce its factory methods or assume that every luthier follows the same sequence.

The corresponding **recommended digital workflow** is:

1. Choose a supported family and construction recipe.
2. Resolve scale, string arrangement and neck-to-body relationship.
3. Construct the body and its real openings or cavities.
4. Fit the neck, heel, fingerboard and headstock.
5. Place saddle contacts and string anchors from the scale geometry.
6. Fit pickups and controls around the actual string paths and body bounds.
7. Apply component-specific materials, trim and decoration.
8. Validate intersections, budgets, export and user-visible classification.

This order matters. Changing a neck joint or scale after building the body can move the bridge into the wrong region. Changing body depth without updating hardware height can bury a bridge or leave it floating. An attractive front render can conceal both failures, so rear and oblique views are mandatory acceptance views for each new family.

### Neck joints are not quality levels

Taylor's neck article describes a bolted, adjustable acoustic neck using fitted pockets and spacers. That is a counterexample to the simplistic rule “acoustics are always glued and bolts are only for cheap electrics.” Its description also ties the fretboard extension, neck block and angle adjustment together.[^14]

**Generator recommendation:** represent joint type as construction, not rarity. A higher cosmetic tier may add inlays or decorative binding; it must not turn a plausible bolted instrument into a supposedly superior glued one. For mobile models, a convincing heel and visible attachment details usually matter more than hidden joinery. Do not add exposed screw heads to a joint whose geometry and label describe a different assembly.

## 4. Geometry and the underlying mathematics

For the current equal-tempered, straight-scale model, the ideal distance from the nut to fret n is:

`d(n) = L × (1 − 2^(−n/12))`

This is a mathematical derivation from twelve equal frequency steps per octave and the ideal inverse relationship between vibrating length and frequency. At fret 12, the remaining length is L/2; at fret 24 it is L/4. The generator already uses this expression. The calculation describes an ideal fret layout, not a complete setup specification.

StewMac explicitly treats fret positions, bridge placement and saddle compensation as related but distinct tasks.[^15] Real saddle placement cannot be reduced to drawing every contact on a perfectly straight line at nominal scale. Gauge, action and string behavior matter in a physical instrument; the current assets are not machining plans or setup simulators.

For generator validation, establish the following invariants:

- The nut-to-saddle relationship is consistent with the selected scale recipe.
- Frets shorten monotonically toward the bridge and remain inside the fingerboard.
- Each string contacts its intended nut and saddle region and reaches an anchor.
- Pole locations or rail coverage follow the local string spread.
- Pickup housings clear the fingerboard end and the bridge.
- Neck support and hardware mounting surfaces remain inside the body.
- Mirroring preserves handedness without changing the intended string ordering.

For multiscale, each string requires its own nut and saddle endpoints. Interpolating the corresponding fret fraction along each string is a useful geometric starting point, but a complete design must also solve fret lines, neutral-fret placement and hardware compatibility. This is a proposed future implementation approach, not functionality currently provided. Strandberg's published specifications illustrate why one global scale number cannot represent all strings.[^12]

## 5. Pickups, bridges and controls

Seymour Duncan's humbucker anatomy distinguishes two coils and their pole structures. Its split-bass explanation describes two offset coils and double poles per string.[^3][^16] These visual signatures are stronger cues than tiny screws or additional shine.

The primary 3D builder now differentiates uncovered twin-coil humbuckers, covered humbuckers, straight single-coil layouts, and offset split-bass assemblies. For P/J, the split assembly and bridge pickup remain separate. This is visual construction only: winding direction, magnetic field and output are not simulated.

**Recommended compatibility rules:**

| Assembly | Required visual relationships | Reject or explain |
|---|---|---|
| Pin-bridge steel-string | Saddle, bridge wings, pins, string break toward anchors | Unconnected strings or pins replacing the saddle |
| Nylon tie-block | Saddle and tied/anchored string paths | Steel-string bridge claimed as classical without explanation |
| Fixed electric bridge | Individual contacts and consistent anchor system | Acoustic bone strip across an otherwise electric bridge |
| Separate stop tailpiece | Bridge contacts followed by descending string runs | Strings ending at the bridge while a tailpiece sits unused |
| Split bass pickup | Two offset housings covering subsets of strings | A single straight bar labeled split-coil |
| Headless bridge | String clamps and tuning mechanism | Conventional tuners left floating after headstock removal |
| Resonator | Cone/support/coverplate relationship | Flat metallic disc labeled a complete resonator |

These are baseline generator rules, not assertions that unconventional luthier experiments cannot exist. An “experimental” mode could allow deliberate exceptions, but its labels must distinguish a stylized asset from a verified instrument assembly.

## 6. Materials and photorealism

The project provenance file identifies captured wood and lighting sources, but explicitly states that stains, hardware roughness, string winding and several figured finishes are artistic derivatives or procedural approximations. In particular, the generic captured wood is not identified as figured maple. That distinction should survive into tool labels and export metadata.[^17]

A material system should separate substrate, figure, color treatment, surface preparation, coating, wear and hardware plating. “Blue,” “maple,” “satin” and “metallic” cannot be mutually exclusive materials because they describe different attributes. A blue transparent stain over a figured wood surface is different from opaque blue paint even when their average colors match.

Three.js provides separate clearcoat and base-layer controls, anisotropy for directional effects, and angle-dependent iridescence. Its documentation also warns that physical-material features add per-pixel cost and recommends environment lighting.[^18] These controls enable approximations; they do not certify that a particular shader looks like a measured real coating.

**Recommended visual acceptance criteria:**

- Solid opaque paint suppresses underlying wood color patterns unless a deliberately textured finish is selected.
- Clearcoat reflections are coherent across a curved surface rather than painted into a diffuse map.
- Satin remains reflective with broader highlights; it is not merely darker gloss.
- Open grain appears as subtle recesses, not uniform raised ridges over every component.
- End grain, longitudinal neck grain and face grain are not indiscriminately stretched from one UV projection.
- Metal hardware, plastic bobbins, fingerboard wood and strings remain materially distinct.
- Pearl and metallic variants are checked at several view angles under the same lighting.
- High rarity may increase decoration or polish, but must not repair otherwise incorrect basic construction.

The priority remains silhouette, depth, component fit, material scale and lighting. Micro-scratches are a finishing step, not a remedy for an unsupported neck or an incorrectly built pickup. Photorealism should be judged through comparison renders and device testing, not by increasing shader parameters until the surface is shiny.

## 7. Classification and generator usability

The proposed beginner-facing flow is “instrument family → shape → finish,” with construction presets handling the dependent dimensions. Advanced controls can expose scale, joint, bridge, strings and electronics. Every generated asset should retain a readable specification summary so a person can tell what was created without inspecting JSON.

A suitable summary would read: “Four-string electric bass · solid body · double cutaway · 34-inch scale · split-coil pickup · satin blue.” Rarity and ownership belong in separate labels. The same instrument could be a starter cosmetic or a decorated reward without changing its musical family.

Compatibility failures should be concrete. Prefer “This twelve-string assembly still needs paired-course bridge and tuner support” over “Invalid configuration.” Do not silently substitute a six-string mesh for a requested twelve-string instrument. Likewise, do not infer that a model named “concert” implements a verified dimensional standard.

The current tool exposes independently adjustable construction fields with broad numeric validation. That flexibility is useful, but it is not yet a complete rule-based compatibility system. A classification overhaul should be introduced alongside matching geometry and tests rather than adding labels that imply unavailable construction.

## 8. Project audit and implementation status

The following findings refer to the inspected project sources, not to a verified installed phone build.

| Area | Current state | Recommended next action |
|---|---|---|
| Five procedural outlines | Two acoustics, two electrics, one bass | Preserve IDs; improve family-specific dimensions |
| Single-cut body | Revised waist, shoulder, cutaway and neck-support test | Keep testing all style transforms |
| P/PJ bass pickup | Corrected to two offset housings and paired poles | Render and regression-test both hands and LODs |
| Five-string selection | Not exposed in current string selector | Add as a complete, tested bass preset |
| Twelve-string selection | Offered, but primary mesh strings are uniformly spaced | Implement course geometry before calling it conventional twelve-string support |
| Classical guitar | Approved imported model; no dedicated procedural nylon family | Keep imported asset; design separate nylon construction |
| Alternate OBJ path | Separate legacy geometry exists in app.js | Audit parity with primary 3D/GLB path before promising identical exports |
| Phone procedural scene | Explicit six-string setup | Do not claim this bass correction adds a selectable bass to the phone |
| Neck and bridge geometry | Simplified static representation | Improve heel, break angles and anchor clearances by family |
| Material names | Some approximations documented in provenance | Bring those distinctions into visible tool labels |
| Mobile quality gate | Existing triangle and mesh-count limits | Add actual device frame-time and memory measurements |

The bass correction changes the primary pickup assembly and its body-relative position, plus the shared bass outline's neck-support region. Render inspection exposed both the excessive pickup height and an unsupported neck joint in the original long-scale preset. New raycast assertions check body support beneath the split coils and neck base. These changes do not affect reward probabilities, inventory state, tuner pitch processing, imported models, or existing asset IDs. They also do not solve the separate export-parity and course-layout issues listed above.

## 9. Roadmap and release gates

**First: construction consistency.** Introduce a shared, versioned assembly description consumed by preview and every export path. Preserve old recipes through explicit version handling. Add family-aware warnings without silently deleting existing designs. This is higher priority than adding more finish names.

**Second: meaningful family expansion.** Add a complete five-string bass preset, a paired-course twelve-string assembly, and a procedural nylon family. Each is a distinct feature with geometry, labels and tests. Then add one genuinely different construction—such as semi-hollow or resonator—rather than several more recolored solid bodies.

**Third: materials and craftsmanship.** Improve visible neck heels, bridge systems, cavity edges, binding fit and component-specific UVs. Use consistent neutral lighting for comparison. Add controlled material variation only after the same shape passes the construction gate.

**Fourth: user-facing classification.** Expose meaningful family filters and specification summaries in the standalone generator. The phone collection should show only models that its renderer and tuner selection can actually support. Ownership, cosmetic rarity and physical instrument type should remain independent.

For every new assembly, require front, rear, side and close-up renders; finite geometry; correct winding and normals; no essential floating parts; deterministic regeneration; self-contained static export; and successful re-import. Existing phone mesh budgets are useful regression guards, not evidence of actual frame rate. Device performance and render fidelity remain explicit gates.

## 10. Licensing and reference use

Studying how guitars are assembled is different from copying a downloadable mesh, texture, logo or product photograph. The USPTO distinguishes trademark, patent and copyright protection; the Copyright Office separately explains the treatment of useful articles and separable artistic features.[^19][^20] These general sources do not establish clearance for any specific guitar design or imported asset.

The recommended project policy is to create original outlines and decoration, avoid manufacturer logos and signature identifiers, and retain a provenance record for every imported mesh and texture. Do not treat “free to download” as permission to redistribute. For an itch release, the applicable license must permit shipping the source asset or its derivative in that package, including any attribution requirements.

The Met record explicitly marks its displayed image Public Domain.[^1] That status is evidence for that record, not a blanket license for every guitar image on a museum or manufacturer website. Historical materials such as ivory can inform an appearance study without advocating acquisition or use of the real material. This report is not a legal opinion or a trademark/design-patent clearance search.

## 11. Evidence limits

Manufacturer documentation is strongest when describing its own construction and published dimensions. Statements about superior tone, sustain or proprietary treatments are not treated here as independent comparative proof. The report uses those sources for physical organization and examples, while the generator recommendations are identified as engineering judgments.

Catalog names and scale-length categories are not globally standardized. The historical Fender manual is used for conventional paired-course tuning, not current product availability. Taylor's 2022 neck article describes that design and does not establish the construction of every later model. Several sources have no displayed publication date; the source inventory records that uncertainty.

No new third-party model or texture has been downloaded or licensed as part of this work. No acoustic simulation, material measurement, manufacturing certification or physical phone benchmark is implied. The generator remains a static visual-asset tool, and the research should guide staged improvements rather than justify unsupported feature claims.

## Sources

Sources checked September 12, 2026. “n.d.” means no publication date was established from the cited page. Project-source observations reflect the working tree inspected on that date.

[^1]: The Metropolitan Museum of Art. [Guitar, Italian, collection record 503932](https://www.metmuseum.org/art/collection/search/503932). Object dated 1800; technical description credited to Daniel Wheeldon, 2016. Classification, courses, and record-specific Public Domain marking.
[^2]: Yamaha Corporation. [The electric guitar family](https://www.yamaha.com/en/musical_instrument_guide/electric_guitar/structure/structure002.html). n.d. Solid, hollow and semi-hollow construction and bass context.
[^3]: Seymour Duncan. [Why do Fender Precision Bass pickups have two offset coils?](https://www.seymourduncan.com/blog/swd/why-do-fender-precision-bass-pickups-have-two-offset-coils). Updated October 17, 2019. Offset coils and paired poles.
[^4]: Taylor Guitars. [How Internal Guitar Bracing Shapes Tone](https://blog.taylorguitars.com/buyers-resources/guitarology-internal-bracing-shapes-tone). n.d. Internal structural and voicing roles.
[^5]: Taylor Guitars. [Acoustic Guitar Body Shapes](https://www.taylorguitars.com/guitars/acoustic/shapes/overview). n.d. Manufacturer-specific body families.
[^6]: Yamaha Corporation. [Classical guitars are great for this](https://www.yamaha.com/en/musical_instrument_guide/classical_guitar/mechanism/mechanism002.html). n.d. String construction and example neck widths.
[^7]: Yamaha Corporation. [The flamenco guitar—similar, yet different](https://www.yamaha.com/en/musical_instrument_guide/classical_guitar/mechanism/mechanism003.html). n.d. Family distinction and design context.
[^8]: Yamaha. [Hollow-body electric guitar features](https://usa.yamaha.com/products/musical_instruments/guitars_basses/el_guitars/hollow_body/features.html). n.d. Center-block example. Publisher search excerpt accessible; direct page fetch returned HTTP 403. The general construction distinction is independently supported by source 2.
[^9]: Fender. [Is a Short-Scale Bass Right for You?](https://www.fender.com/articles/instruments/is-a-short-scale-bass-right-for-you). n.d. 30-, approximately 32-, and 34-inch categories.
[^10]: Fender Musical Instruments Corporation. [Acoustic Guitar Manual](https://www.fmicassets.com/Damroot/Original/10002/2011%20Fender%20Acoustic%20Guitar%20Manual.pdf). 2011 edition, “Tuning 12-string Guitars.” Octave and unison courses.
[^11]: National Guitars. [Style 1 Tricone](https://www.nationalguitars.com/style-1). n.d. Three-cone and plated-body example.
[^12]: Strandberg Guitars. [Which strings will my .strandberg* guitar come with?](https://support.strandbergguitars.com/article/40-guitar-strings). n.d. Per-string scale lengths and straight-scale exception.
[^13]: Yamaha. [Craftsmanship](https://usa.yamaha.com/products/contents/guitars_basses/difference/craftsmanship.html). n.d. Production stages, materials, joints and finishing.
[^14]: Colin Griffith, Taylor Guitars. [Anatomy of the Taylor Neck](https://blog.taylorguitars.com/anatomy-of-the-taylor-neck). October 10, 2022. Adjustable bolted acoustic-neck example.
[^15]: Stewart-MacDonald. [How do I calculate a fret scale?](https://www.stewmac.com/video-and-ideas/online-resources/reference/how-do-i-calculate-a-fret-scale/). n.d. Distinguishes fret layout, bridge placement and compensation.
[^16]: Seymour Duncan. [Anatomy of a Humbucker](https://www.seymourduncan.com/blog/latest-updates/anatomy-of-a-humbucker). n.d. Coil and pole construction.
[^17]: Guitar Finish Studio project. [Captured material provenance](../../tools/guitar-finish-studio/CAPTURED-MATERIALS.md). Local repository record; includes September 6, 2026 source downloads, author credits, licenses and approximation limits. Also inspected: app.js, mesh-studio.js, mesh-studio.test.mjs, mobile-scene.js, mobile-recipe.js and index.html in that directory.
[^18]: Three.js. [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). Living documentation; project dependency 0.185.1. Layered rendering controls and performance caveats.
[^19]: United States Patent and Trademark Office. [Trademark, patent, or copyright](https://www.uspto.gov/trademarks/basics/trademark-patent-copyright). Living guidance. Distinct categories of intellectual property.
[^20]: United States Copyright Office. [Useful Articles](https://www.copyright.gov/register/va-useful.html). n.d. General useful-article guidance; not asset-specific clearance.
