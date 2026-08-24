# SKU Image 2 Prompts — Clinical Atelier v2

These prompts create concept posters for the five 3D configurator baselines. They are scope-review visuals only, not engineering drawings, dimensional promises, material-performance claims, certifications, capacity guarantees, MOQ, price, or lead-time promises.

## Shared direction

```text
Use case: product-mockup.
Asset type: square loading poster for a web-based 3D cosmetic packaging configurator.
Style: Clinical Atelier, photorealistic premium cosmetic packaging product photography; credible laboratory precision, quiet, restrained and tactile.
Composition: square 1:1; approximately 85 mm product lens; subject occupies about 68% of the frame with generous negative space.
Lighting: warm seamless laboratory-white background #F6F1E8; broad soft key upper left, narrow rim upper right, subtle front fill, realistic soft contact shadows, neutral accurate product colour.
Palette: deep bio-green #15362E, warm ivory and restrained copper-brown #A6532E accents.
Constraints: blank packaging; concept visualization for OEM/ODM scope review only; no readable marks anywhere.
Avoid: text, letters, numbers, logos, watermark, measurements, people, hands, ingredients, botanicals, splashes, extra products, harsh black shadows, excessive bloom, low-resolution artifacts and low-poly game-asset CGI.
```

## GT-AIRLESS-030

```text
Primary request: exactly one tall cylindrical concept airless serum bottle standing upright.
Subject and geometry: subtly weighted base, straight side walls, softly sculpted shoulder, clearly readable two-stage pump collar, short pump stem, broad low-profile pump head and precise side-facing nozzle. One matching removable cylindrical cap lies horizontally beside the bottle, fully visible and separate from the silhouette. Refined injection-moulded laboratory-ivory satin PP/PETG body, deep bio-green pump parts, discreet brushed copper-brown keylines and a small blank front branding panel. Three-quarter front view at product eye level.
Avoid: extra caps, dropper parts, trigger sprayer, aerosol nozzle, tube, mirror-like plastic, malformed nozzle, crooked pump and fused cap.
```

## GT-DROPPER-030

```text
Primary request: exactly one complete round concept cosmetic glass dropper bottle standing upright.
Subject and geometry: weighted thick glass base, straight lower walls, precise rounded shoulder, narrow threaded neck, deep bio-green collar with two fine copper-brown keylines, tactile dark elastomer bulb, transparent central glass pipette descending continuously into restrained warm amber liquid with a horizontal fill line. High-quality flint glass with optically present edges, believable wall thickness, refraction, transmission and subtle volume attenuation; small blank front branding panel. Three-quarter front view at product eye level.
Avoid: detached dropper, cork, pump, floating pipette, impossible liquid level, opaque or alpha-faded glass, black interior, distorted refraction, oversized bulb, crooked neck, glowing liquid and condensation.
```

## GT-JAR-050

```text
Primary request: exactly one closed concept wide cosmetic cream jar.
Subject and geometry: low, broad and visually weighted; gently sculpted outer body, stable broad base, precise rounded shoulders, clearly defined nested inner cup, substantial aligned deep bio-green lid with a calm monolithic silhouette, clean closure shadow line, fine brushed copper-brown keylines and a small blank front branding panel. Laboratory-ivory satin outer jar with refined polymer or frosted-glass presence, soft ivory inner cup and strong material separation. Three-quarter front view from slightly above centre line.
Avoid: open or floating lid, visible cream, spatula, multiple jars, pump jar, bottle silhouette, food or candle appearance, tall proportions, fused lid seam, mirror chrome and warped circles.
```

## GT-MASK-FULL-025

```text
Primary request: exactly one continuous single-piece cosmetic full-face sheet mask and exactly one matching sealed sachet, separate and fully visible.
Subject and geometry: left, one upright warm-ivory rectangular sachet with rounded corners, precise heat-seal bands, fine top crimp, one tear notch and a blank front panel. Right, exactly one uninterrupted oval face sheet with exactly two eye openings, one narrow nose opening and one mouth opening, gently curved anatomical surface, softly rounded chin and believable thin edges. Soft white lyocell/cotton fibre with matte microtexture, diffuse edge and only slight translucency, never glossy hydrogel.
Avoid: human face, multiple masks, folded mask, split upper/lower pieces, missing or extra holes, thick rubber, shiny hydrogel, lace, paper cutout, torn edges and medical-mask geometry.
```

## GT-MASK-SPLIT-030

```text
Primary request: exactly two clearly separate concept hydrogel facial mask pieces and exactly one matching sealed sachet.
Subject and geometry: left, one upright pale bio-green sachet with rounded corners, precise heat-seal bands, top crimp, one tear notch and a blank front panel. Right, exactly two independent pieces with a wide clean gap. The upper piece has exactly two eye openings and no mouth opening. The lower piece has exactly one mouth opening and no eye openings. The pieces never touch, overlap or merge. Pale aqua-green translucent hydrogel with realistic volume, thickness, refraction, edge attenuation and moist satin highlights; pieces remain visibly substantial.
Avoid: extra pieces, a continuous full-face mask, merged pieces, eye openings in the lower piece, a mouth opening in the upper piece, paper or cloth texture, opaque rubber, jelly-food appearance, neon glow, dripping serum, bubbles and extreme transparency.
```

## 3D calibration rules

- Glass uses transmission, IOR, thickness and attenuation; opacity stays at 1.
- Hydrogel uses transmission, IOR, thickness and attenuation; `thin`, `standard`, and `plush` alter Z thickness and highlight response.
- PP/PCR-PP remains polymeric; only PETG receives light transmission.
- The full mask is one continuous mesh. The split mask is two independent meshes with a permanent visible gap.
- Sachets include seals, crimp details and a tear notch. Bottle systems include readable pump, collar, thread, pipette, closure and base details.
- Every generated image and GLB remains a concept baseline inside the contracted modelling boundary.
