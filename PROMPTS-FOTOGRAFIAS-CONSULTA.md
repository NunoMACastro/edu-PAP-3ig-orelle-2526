# Prompts para fotografias sintéticas da consulta Orélle

## Objetivo e modo de utilização

Este documento contém duas prompts para cada um dos sete objetivos principais da consulta cosmética:

1. acne e imperfeições;
2. hidratação e barreira;
3. controlo de oleosidade;
4. sensibilidade e vermelhidão;
5. manchas, tom e luminosidade;
6. proteção solar;
7. maquilhagem.

Em cada opção, a **Prompt 1** gera a fotografia frontal e estabelece a identidade visual da mulher fictícia. A **Prompt 2** tem de ser executada imediatamente a seguir, na mesma conversa ou sessão do gerador, com a fotografia frontal anexada como referência visual obrigatória.

O gerador escolhido tem de suportar imagens de referência ou edição *image-to-image*. Se não permitir anexar a frontal à segunda geração, não consegue garantir de forma fiável que o perfil representa a mesma pessoa; nesse caso, a Prompt 2 não deve ser executada nessa ferramenta.

Cada prompt deve produzir apenas um ficheiro. A aplicação Orélle recebe a fotografia frontal e a fotografia de perfil como ficheiros separados; não devem ser geradas colagens, dípticos ou folhas de contacto.

As imagens pedidas têm `1600 × 1600 px`, formato PNG, exatamente um rosto, iluminação uniforme e um enquadramento compatível com a consulta. A expressão inclui um sorriso fechado muito ligeiro e cativante, sem dentes, sem semicerrar os olhos e sem alterar significativamente a geometria facial.

> Nota de rigor: a pele clara pode tornar eritema e queimadura solar mais visíveis e apresenta menor proteção natural pela melanina. No entanto, a proteção solar é relevante para todos os tons de pele. A opção de proteção solar usa uma mulher de pele clara para criar um caso de teste visualmente distinto, não para excluir outros tons de pele deste cuidado.

## 1. Acne e imperfeições

### Prompt 1 — fotografia frontal

```text
---
prompt_id: "orelle-acne-01-frontal"
pair_id: "orelle-acne-01"
execution:
  step: 1
  must_run_before: "orelle-acne-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "acne_imperfections"
  scope: "non-medical cosmetic consultation"
subject:
  synthetic_person: true
  adult: true
  age: 24
  gender_presentation: "woman"
  skin_tone: "medium-deep brown"
  undertone: "warm-neutral"
  eye_colour: "dark brown"
  hair: "black tightly curled hair, pulled back from the face"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "mild-to-moderate"
  affected_areas: ["cheeks", "chin", "jaw"]
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte light grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-acne-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and unretouched frontal cosmetic-consultation photograph using the metadata above.

Create a fictional 24-year-old adult woman with medium-deep brown skin, a warm-neutral undertone, dark-brown eyes and black tightly curled hair pulled fully away from her face. She must not resemble a real person, celebrity or public figure.

Show a realistic mild-to-moderate presentation of cosmetic imperfections concentrated on the cheeks, chin and jaw: naturally irregular closed comedones, a few blackheads, several small non-severe blemishes and subtle flat post-imperfection marks. Preserve realistic contrast between active imperfections, residual marks and unaffected skin. Do not arrange features symmetrically and do not beautify or erase them.

Keep the skin intact. Do not show severe nodules, cystic lesions, wounds, bleeding, infection or extreme inflammation. Do not diagnose a disease or suggest a guaranteed treatment.

She is looking directly into the camera with her head upright and no more than 5 degrees of horizontal rotation. Give her a very slight, warm and engaging closed-mouth smile. The smile must not show teeth, raise the cheeks strongly, narrow the eyes or distort the jaw. Her eyes remain naturally open and attentive.

Show the complete hairline, forehead, ears, chin and upper shoulders. Keep the face close to the image centre and occupying approximately 55% of the image height. Use an eye-level camera and a natural portrait perspective without wide-angle distortion.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte light-grey background. Keep the entire face sharply focused with realistic pores, fine facial hair, pigmentation, texture and natural asymmetry.

Apply no makeup, concealer, foundation, powder, skincare shine, beauty filter, skin smoothing, jewellery, glasses or facial accessories. Generate exactly one person and one face. Do not add text, labels, watermark, collage, split screen, cropped facial areas, blur, hard shadows, overexposure, underexposure, plastic skin or glamour styling.
```

### Prompt 2 — fotografia lateral a 50°

```text
---
prompt_id: "orelle-acne-01-profile"
pair_id: "orelle-acne-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-acne-01-frontal"
  depends_on_file: "orelle-acne-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
capture:
  view: "three-quarter profile"
  direction: "subject right, viewer left"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-acne-01-profile.png"
---

The frontal image generated by prompt `orelle-acne-01-frontal` must be attached as the mandatory visual reference. If that exact reference is unavailable, do not generate an image and do not attempt to recreate the woman from text alone.

Generate exactly one new extremely photorealistic photograph of the same fictional woman. Rotate her head approximately 50 degrees towards her right, corresponding to the viewer's left, while keeping her shoulders mostly facing the camera. This must be a three-quarter profile between 35 and 75 degrees, never a complete 90-degree side profile.

Strictly preserve her identity, apparent age, facial proportions, skin tone, undertone, eyes, nose, lips, jaw, ears, hairline, hairstyle, clothing and natural asymmetry. Preserve the same pores, blemishes, blackheads, comedones and post-imperfection marks in the same anatomical locations and at the same severity. Natural occlusion caused by the new angle is allowed; mirroring, relocating, removing, improving or inventing skin features is forbidden.

Preserve the same very slight, engaging closed-mouth smile without showing teeth, strongly raising the cheeks or narrowing the eyes. Maintain the same lighting, exposure, white balance, background, camera height, camera distance, sharpness and colour reproduction as the frontal image.

Keep the complete hairline, facial outline, chin, visible ear and upper shoulders inside the frame. Keep the face close to the centre and approximately 55% of the image height.

Apply no makeup, retouching, filters, skin smoothing, jewellery or glasses. Generate one separate image only. Do not create a collage, split screen, contact sheet, second person, second face, text, watermark, full 90-degree profile, blur, crop, hard shadow or identity variation.
```

## 2. Hidratação e barreira

### Prompt 1 — fotografia frontal

```text
---
prompt_id: "orelle-hydration-01-frontal"
pair_id: "orelle-hydration-01"
execution:
  step: 1
  must_run_before: "orelle-hydration-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "hydration_barrier"
  scope: "non-medical cosmetic consultation"
subject:
  synthetic_person: true
  adult: true
  age: 38
  gender_presentation: "woman"
  skin_tone: "deep brown"
  undertone: "cool-neutral"
  eye_colour: "dark hazel"
  hair: "long black box braids tied back away from the face"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "mild"
  affected_areas: ["cheeks", "sides of nose", "around mouth"]
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte warm light grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-hydration-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and unretouched frontal cosmetic-consultation photograph using the metadata above.

Create a fictional 38-year-old adult woman with deep-brown skin, a cool-neutral undertone, dark-hazel eyes and long black box braids tied securely away from her face. She must not resemble any real or famous person.

Show mild visible cosmetic dryness through fine dry texture, a slightly matte surface and very light flaking on the cheeks, beside the nose and around the mouth. On deep-brown skin, render the dry texture with realistic subtle tonal contrast without turning the face grey, chalky or artificially desaturated. Preserve normal texture elsewhere and do not invent subjective sensations such as tightness.

Do not show cracked skin, bleeding, open lesions, severe irritation, eczema or another diagnosed condition. Do not underexpose the image to simulate dryness.

She looks directly into the camera with her head upright and less than 5 degrees of horizontal rotation. Give her a subtle, welcoming closed-mouth smile: no teeth, no pronounced cheek lifting, no squinting and no strong expression lines. Her eyes remain open and captivating.

Show the complete hairline, forehead, ears, chin and upper shoulders. Keep the face centred and approximately 55% of the image height. Use an eye-level camera with natural portrait perspective.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte warm light-grey background. Keep the face sharply focused and preserve realistic pores, fine lines, pigmentation and asymmetry.

Apply no makeup, powder, foundation, visible moisturiser, skincare residue, artificial shine, filters, retouching, skin smoothing, glasses or jewellery. Generate exactly one person and one face. No text, watermark, collage, cropped head, blur, hard shadows, overexposure, underexposure or synthetic plastic skin.
```

### Prompt 2 — fotografia lateral a 50°

```text
---
prompt_id: "orelle-hydration-01-profile"
pair_id: "orelle-hydration-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-hydration-01-frontal"
  depends_on_file: "orelle-hydration-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
capture:
  view: "three-quarter profile"
  direction: "subject left, viewer right"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-hydration-01-profile.png"
---

The exact output of prompt `orelle-hydration-01-frontal` must be attached as the mandatory visual identity reference. If it is missing, do not generate an image and do not reconstruct the woman independently.

Generate exactly one extremely photorealistic photograph of the same fictional woman, rotating her head approximately 50 degrees towards her left, corresponding to the viewer's right. Keep her shoulders mostly facing the camera. Produce a three-quarter profile, not a full side profile.

Strictly preserve identity, apparent age, facial anatomy, deep-brown skin tone, cool-neutral undertone, dark-hazel eyes, braids, hairline, clothing and asymmetry. Preserve the same fine dry texture, matte areas and light flaking in the same anatomical locations and with the same severity. Allow only natural occlusion from the angle. Do not add, remove, relocate, intensify, soften or mirror dry areas.

Preserve the same very slight closed-mouth smile, naturally open eyes and engaging expression without teeth, strong cheek compression or squinting. Match the frontal photograph's lighting, exposure, background, white balance, camera height, distance and sharpness.

Keep the complete head, facial outline, chin, visible ear and upper shoulders inside the frame. Keep the face near the centre and approximately 55% of the image height.

Use no makeup, visible moisturiser, artificial shine, filters, retouching, skin smoothing, jewellery or glasses. Generate one separate image only. No collage, contact sheet, second face, text, watermark, full 90-degree profile, crop, blur, hard shadow or identity drift.
```

## 3. Controlo de oleosidade

### Prompt 1 — fotografia frontal

```text
---
prompt_id: "orelle-oil-control-01-frontal"
pair_id: "orelle-oil-control-01"
execution:
  step: 1
  must_run_before: "orelle-oil-control-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "oil_control"
  scope: "non-medical cosmetic consultation"
subject:
  synthetic_person: true
  adult: true
  age: 29
  gender_presentation: "woman"
  skin_tone: "light-medium olive"
  undertone: "golden-neutral"
  eye_colour: "green-hazel"
  hair: "straight black hair in a low ponytail"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "moderate"
  affected_areas: ["forehead", "nose", "chin"]
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte cool light grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-oil-control-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and unretouched frontal cosmetic-consultation photograph using the metadata above.

Create a fictional 29-year-old adult woman with light-medium olive skin, a golden-neutral undertone, green-hazel eyes and straight black hair secured in a low ponytail completely away from the face. She must not resemble a real person or public figure.

Show moderate but realistic cosmetic oiliness concentrated in the T-zone: forehead, nose and chin. Include natural skin reflectance and slightly visible pores around the nose and nearby areas. Keep the cheeks naturally textured and less reflective so the T-zone remains distinguishable.

The effect must come from realistic sebum reflectance under uniform light. Do not make the face wet, sweaty, covered in oil, coated with gloss or overexposed. Do not use highlighter or skincare products to simulate shine.

She looks directly into the camera with her head upright and less than 5 degrees of horizontal rotation. Give her a slight, confident and welcoming closed-mouth smile. Do not show teeth, strongly lift the cheeks, narrow the eyes or distort the facial geometry.

Show the complete hairline, forehead, ears, chin and upper shoulders. Keep the face centred and approximately 55% of the image height. Use an eye-level camera with a natural portrait perspective.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte cool light-grey background. Keep the complete face sharply focused and preserve realistic pores, texture, pigmentation and asymmetry.

Apply no makeup, primer, foundation, powder, highlighter, skincare shine, filters, beauty retouching, skin smoothing, glasses or jewellery. Generate exactly one person and one face. No text, watermark, collage, crop, blur, hard shadows, artificial wetness, plastic skin or glamour styling.
```

### Prompt 2 — fotografia lateral a 50°

```text
---
prompt_id: "orelle-oil-control-01-profile"
pair_id: "orelle-oil-control-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-oil-control-01-frontal"
  depends_on_file: "orelle-oil-control-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
capture:
  view: "three-quarter profile"
  direction: "subject right, viewer left"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-oil-control-01-profile.png"
---

Attach the exact output of prompt `orelle-oil-control-01-frontal` as the mandatory visual reference. If that image is missing, stop and do not generate a profile from text alone.

Generate exactly one extremely photorealistic image of the same fictional woman with her head rotated approximately 50 degrees towards her right, corresponding to the viewer's left. Keep the shoulders mostly frontal. This is a three-quarter profile, never a complete 90-degree profile.

Strictly preserve identity, facial proportions, age, olive skin tone, undertone, green-hazel eyes, hair, hairline, clothing and asymmetry. Preserve the same T-zone oiliness, pore visibility and difference between reflective and non-reflective areas. The reflectance must remain consistent with the changed angle and identical lighting. Do not add wetness, mirror the highlights, relocate pores or increase or reduce severity.

Preserve the same slight, engaging closed-mouth smile and open eyes without showing teeth, compressing the cheeks or squinting. Match the frontal image's lighting, exposure, neutral white balance, matte background, camera distance and sharpness.

Keep the complete head, chin, facial outline, visible ear and upper shoulders in frame. Keep the face near the centre and approximately 55% of the image height.

Apply no makeup, skincare gloss, retouching, filters, smoothing, glasses or jewellery. Generate one separate image only. No collage, split screen, contact sheet, second face, text, watermark, full side profile, crop, blur, hard shadow or identity change.
```

## 4. Sensibilidade e vermelhidão

### Prompt 1 — fotografia frontal

```text
---
prompt_id: "orelle-sensitivity-01-frontal"
pair_id: "orelle-sensitivity-01"
execution:
  step: 1
  must_run_before: "orelle-sensitivity-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "sensitivity_redness"
  scope: "non-medical cosmetic consultation"
subject:
  synthetic_person: true
  adult: true
  age: 33
  gender_presentation: "woman"
  skin_tone: "fair-light"
  undertone: "cool"
  eye_colour: "blue-grey"
  hair: "soft auburn wavy hair tied back"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "mild"
  affected_areas: ["cheeks", "sides of nose"]
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte neutral light grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-sensitivity-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and unretouched frontal cosmetic-consultation photograph using the metadata above.

Create a fictional 33-year-old adult woman with fair-light skin, a cool undertone, blue-grey eyes and soft auburn wavy hair tied completely away from her face. She must not resemble any real or famous person.

Show mild, diffuse and non-severe visible redness across the cheeks and around the sides of the nose. The redness must have natural soft transitions, remain visible under neutral lighting and preserve intact pores and skin texture. Avoid uniformly painting the face red or increasing global colour saturation.

Do not show swelling, hives, broken skin, wounds, severe inflammation or extreme irritation. Do not diagnose or visually label rosacea, dermatitis, allergy or another medical condition.

She looks directly into the camera with her head upright and less than 5 degrees of horizontal rotation. Give her a gentle, approachable closed-mouth smile. The smile must remain very slight, show no teeth, avoid pronounced cheek lifting and leave the eyes naturally open.

Show the complete hairline, forehead, ears, chin and upper shoulders. Keep the face centred and approximately 55% of the image height. Use an eye-level camera with natural perspective.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte neutral light-grey background. Maintain sharp focus and realistic pores, fine facial hair, pigmentation and asymmetry.

Apply no makeup, colour corrector, foundation, blush, powder, skincare shine, filters, retouching, skin smoothing, glasses or jewellery. Generate exactly one person and one face. No text, watermark, collage, crop, blur, hard shadows, coloured lighting, exaggerated redness or medical annotations.
```

### Prompt 2 — fotografia lateral a 50°

```text
---
prompt_id: "orelle-sensitivity-01-profile"
pair_id: "orelle-sensitivity-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-sensitivity-01-frontal"
  depends_on_file: "orelle-sensitivity-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
capture:
  view: "three-quarter profile"
  direction: "subject left, viewer right"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-sensitivity-01-profile.png"
---

Attach the exact frontal photograph generated by prompt `orelle-sensitivity-01-frontal`. It is the mandatory identity reference. If it is not attached, do not generate an image and do not recreate the subject from the description.

Generate exactly one extremely photorealistic photograph of the same woman, rotating her head approximately 50 degrees towards her left, corresponding to the viewer's right, with shoulders mostly facing the camera. Produce a three-quarter profile, not a complete side profile.

Strictly preserve her facial identity, apparent age, fair-light skin, cool undertone, blue-grey eyes, auburn hair, hairline, clothing and natural asymmetry. Preserve the same mild redness, distribution, intensity, texture and transitions on the cheeks and sides of the nose. Permit only natural perspective and occlusion. Do not recolour the entire face, mirror the redness or add, remove or relocate affected areas.

Preserve the same gentle, slightly captivating closed-mouth smile and naturally open eyes. Do not show teeth, produce a broad smile, strongly raise the cheeks or introduce new expression lines. Match lighting, exposure, white balance, background, camera height, camera distance and focus to the frontal image.

Keep the complete head, facial outline, chin, visible ear and upper shoulders in the frame. Keep the face near the centre and approximately 55% of the image height.

Apply no makeup, filters, retouching, smoothing, glasses or jewellery. Generate one separate file only. No collage, contact sheet, second face, text, watermark, full 90-degree profile, crop, blur, hard shadows or identity drift.
```

## 5. Manchas, tom e luminosidade

### Prompt 1 — fotografia frontal

```text
---
prompt_id: "orelle-tone-01-frontal"
pair_id: "orelle-tone-01"
execution:
  step: 1
  must_run_before: "orelle-tone-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "spots_tone_luminosity"
  scope: "non-medical cosmetic consultation"
subject:
  synthetic_person: true
  adult: true
  age: 45
  gender_presentation: "woman"
  skin_tone: "medium-deep bronze"
  undertone: "warm golden"
  eye_colour: "amber brown"
  hair: "voluminous dark-chestnut curls held back with no hair over the face"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "moderate"
  affected_areas: ["forehead", "cheeks", "chin"]
  representative_variant: "uneven tone with post-imperfection marks"
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte beige-grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-tone-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and unretouched frontal cosmetic-consultation photograph using the metadata above.

Create a fictional 45-year-old adult woman with medium-deep bronze skin, a warm-golden undertone, amber-brown eyes and voluminous dark-chestnut curls held fully away from the face. She must not resemble a real person, celebrity or public figure.

Show a realistic moderate presentation of uneven tone: subtle irregular areas of pigmentation with soft boundaries across the forehead and cheeks, plus several flat post-imperfection marks near the cheeks and chin. Preserve natural variation in luminosity and unaffected areas. The features should remain anatomically plausible and non-symmetrical.

Do not simulate reduced luminosity by making the complete photograph dark, grey, desaturated or underexposed. Do not create dramatic patches or diagnose melasma or another pigmentation disorder.

She looks directly into the camera with her head upright and less than 5 degrees of horizontal rotation. Give her a subtle, calm and captivating closed-mouth smile. Show no teeth, avoid strong cheek lifting and keep the eyes open and relaxed.

Show the complete hairline, forehead, ears, chin and upper shoulders. Keep the face centred and approximately 55% of the image height. Use an eye-level camera with natural portrait perspective.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte beige-grey background. Maintain sharp focus and preserve realistic pores, fine lines, pigmentation, facial hair and asymmetry.

Apply no makeup, concealer, colour corrector, foundation, powder, highlighter, skincare shine, filters, retouching, smoothing, glasses or jewellery. Generate exactly one person and one face. No text, watermark, collage, crop, blur, hard shadows, artificial pigmentation, excessive contrast or medical annotations.
```

### Prompt 2 — fotografia lateral a 50°

```text
---
prompt_id: "orelle-tone-01-profile"
pair_id: "orelle-tone-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-tone-01-frontal"
  depends_on_file: "orelle-tone-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
capture:
  view: "three-quarter profile"
  direction: "subject right, viewer left"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-tone-01-profile.png"
---

The exact output of prompt `orelle-tone-01-frontal` must be attached as the required visual reference. If it is missing, stop and do not generate the profile from text alone.

Generate exactly one extremely photorealistic photograph of the same fictional woman, rotating her head approximately 50 degrees towards her right, corresponding to the viewer's left. Keep her shoulders mostly frontal. Produce a three-quarter profile, not a complete 90-degree view.

Strictly preserve identity, age, facial proportions, bronze skin tone, warm-golden undertone, amber-brown eyes, curls, hairline, clothing and asymmetry. Preserve the same uneven-tone areas, post-imperfection marks, pigmentation boundaries and luminosity variations in the same anatomical locations and at the same severity. Allow only natural perspective and occlusion. Do not mirror, relocate, erase, soften, darken or invent marks.

Preserve the same subtle closed-mouth smile and open, engaging eyes without teeth, strong cheek compression or new expression lines. Match the frontal image's lighting, white balance, background, camera distance, exposure, focus and colour reproduction.

Keep the complete head, facial outline, chin, visible ear and upper shoulders in frame. Keep the face near the centre and approximately 55% of the image height.

Apply no makeup, retouching, filters, smoothing, glasses or jewellery. Generate one separate image only. Do not create a collage, contact sheet, second person, second face, text, watermark, full side profile, crop, blur, hard shadows or identity variation.
```

## 6. Proteção solar

### Prompt 1 — fotografia frontal

```text
---
prompt_id: "orelle-sun-protection-01-frontal"
pair_id: "orelle-sun-protection-01"
execution:
  step: 1
  must_run_before: "orelle-sun-protection-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "sun_protection"
  scope: "non-medical cosmetic consultation"
subject:
  synthetic_person: true
  adult: true
  age: 41
  gender_presentation: "woman"
  skin_tone: "fair-light"
  undertone: "neutral-warm"
  eye_colour: "light hazel"
  hair: "light-brown softly wavy hair tied back"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "neutral baseline"
  visible_features: ["light natural freckles across nose and upper cheeks"]
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte light grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-sun-protection-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and unretouched frontal cosmetic-consultation photograph using the metadata above.

Create a fictional 41-year-old adult woman with fair-light skin, a neutral-warm undertone, light-hazel eyes and softly wavy light-brown hair tied entirely away from her face. She must not resemble any real or famous person.

Generate a neutral, natural and makeup-free skin baseline for a daily sun-protection consultation. Preserve realistic pores, fine lines, pigmentation and minor natural variation. Include a small number of subtle, irregular natural freckles across the nose and upper cheeks.

Do not invent a skin condition to justify sun protection. Do not show sunburn, exposure-related redness, tan lines, peeling, severe pigmentation, alleged sun damage or artificially premature ageing. Do not infer exposure duration, outdoor activity or sunscreen habits from the portrait.

She looks directly into the camera with her head upright and less than 5 degrees of horizontal rotation. Give her a very slight, bright and approachable closed-mouth smile. Do not show teeth, strongly raise the cheeks, narrow the eyes or create pronounced expression lines.

Show the complete hairline, forehead, ears, chin and upper shoulders. Keep the face centred and approximately 55% of the image height. Use an eye-level camera and natural portrait perspective.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte light-grey background. Preserve highlights carefully on the fair skin without overexposure. Keep the face sharply focused with realistic colour and texture.

Apply no makeup, tinted sunscreen, visible sunscreen residue, foundation, powder, skincare shine, filters, retouching, smoothing, glasses or jewellery. Generate exactly one person and one face. No text, watermark, collage, crop, blur, hard shadows, coloured lighting, plastic skin or medical claims.
```

### Prompt 2 — fotografia lateral a 50°

```text
---
prompt_id: "orelle-sun-protection-01-profile"
pair_id: "orelle-sun-protection-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-sun-protection-01-frontal"
  depends_on_file: "orelle-sun-protection-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
capture:
  view: "three-quarter profile"
  direction: "subject left, viewer right"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-sun-protection-01-profile.png"
---

Attach the exact output of prompt `orelle-sun-protection-01-frontal` as the mandatory identity reference. If that file is unavailable, do not generate an image and do not recreate the subject from text alone.

Generate exactly one extremely photorealistic photograph of the same fictional woman, rotating her head approximately 50 degrees towards her left, corresponding to the viewer's right. Keep the shoulders mostly facing the camera. Produce a three-quarter profile, not a full 90-degree side view.

Strictly preserve identity, apparent age, fair-light skin tone, neutral-warm undertone, light-hazel eyes, hair, hairline, facial anatomy, clothing and asymmetry. Preserve the same natural freckles in the same anatomical locations and with the same intensity. Natural occlusion from the profile is allowed; adding, removing, mirroring or relocating freckles is forbidden. Do not introduce sunburn, tanning or sun damage.

Preserve the same slight, warm closed-mouth smile and naturally open eyes without teeth, strong cheek lifting or squinting. Match the frontal photograph's illumination, exposure, highlight control, background, white balance, camera distance and sharpness.

Keep the complete head, facial outline, chin, visible ear and upper shoulders in frame. Keep the face near the centre and approximately 55% of the image height.

Apply no makeup, sunscreen residue, filters, retouching, skin smoothing, glasses or jewellery. Generate one separate image only. No collage, contact sheet, second face, text, watermark, full side profile, crop, blur, hard shadow or identity drift.
```

## 7. Maquilhagem

### Prompt 1 — fotografia frontal sem maquilhagem

```text
---
prompt_id: "orelle-makeup-01-frontal"
pair_id: "orelle-makeup-01"
execution:
  step: 1
  must_run_before: "orelle-makeup-01-profile"
  reference_image_required: false
consultation:
  primary_goal: "makeup"
  scope: "makeup-free baseline for later virtual makeup generation"
subject:
  synthetic_person: true
  adult: true
  age: 27
  gender_presentation: "woman"
  skin_tone: "medium"
  undertone: "strictly neutral, neither visibly warm nor cool"
  eye_colour: "grey-green"
  hair: "long dark-blonde hair with soft natural waves, worn loose over the shoulders"
  expression: "subtle engaging closed-mouth smile"
cosmetic_presentation:
  severity: "neutral makeup-free baseline"
  visible_features: ["natural pores", "minor natural skin variation", "clear facial regions"]
appearance_composition:
  hair_is_part_of_final_look: true
  hair_must_frame_but_not_cover_face: true
  downstream_makeup_edit_must_preserve_hair: true
capture:
  view: "frontal"
  yaw_degrees: 0
  camera_height: "eye level"
  background: "plain matte neutral grey"
  lighting: "soft uniform diffuse frontal daylight"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-makeup-01-frontal.png"
---

Generate exactly one extremely photorealistic, high-detail and completely makeup-free frontal source photograph using the metadata above.

Create a fictional 27-year-old adult woman with medium skin and a strictly neutral undertone that is neither visibly golden, pink, red nor olive. Give her grey-green eyes and long dark-blonde hair with soft, natural and well-defined waves. She must not resemble a real person, celebrity or public figure.

The hairstyle is an intentional part of the overall beauty composition. Wear the hair loose, with natural volume, a soft side part and visible movement, flowing around the outer contour of the head and over both shoulders. It should look polished, healthy and attractive without appearing excessively styled or digitally perfect. The hair must complement the face and make the later makeup result feel like a complete appearance rather than an isolated facial edit.

Keep all facial analysis regions unobstructed. Position the front sections behind the facial plane so that no strands cross or cover the hairline, forehead, eyebrows, eyes, eyelids, cheeks, nose, lips or jawline. The hair may frame the outer silhouette of the face and cover part of the ears, but it must never overlap facial skin or hide landmarks.

This is the clean input image for a later virtual makeup generator. Keep every cosmetic region unobstructed and clearly defined: complexion, cheeks, eyebrows, eyelids, natural eyelashes, eyes and lips. Preserve realistic eyebrow hairs, eyelid contours, lip boundaries, pores, fine facial hair, minor natural skin variation and asymmetry.

Apply absolutely no makeup: no primer, foundation, skin tint, concealer, colour corrector, powder, bronzer, contouring, blush, highlighter, eyebrow product, eyeliner, eyeshadow, mascara, false eyelashes, lipstick, lip liner, lip tint or lip gloss. Do not add visible skincare residue or artificial shine.

She looks directly into the camera with her head upright and less than 5 degrees of horizontal rotation. Give her a very slight, elegant and captivating closed-mouth smile. Do not show teeth, purse the lips, strongly raise the cheeks, squint or distort lip boundaries needed by the later makeup simulation.

Show the complete hairline, forehead, facial contour, chin, full hairstyle and upper shoulders. Leave enough space around the head and shoulders to display the hair naturally without reducing the face below approximately 55% of the image height. Keep the face centred. Use an eye-level camera and natural portrait perspective.

Use soft, diffuse and uniform frontal daylight, neutral white balance and a plain matte neutral-grey background. Keep the entire face sharply focused with accurate neutral colour reproduction.

Generate exactly one person and one face. No filters, beauty retouching, skin smoothing, jewellery, glasses, text, watermark, collage, crop, blur, hard shadows, artificial hair extensions, flyaway strands across the face or plastic skin.
```

### Prompt 2 — fotografia lateral a 50° sem maquilhagem

```text
---
prompt_id: "orelle-makeup-01-profile"
pair_id: "orelle-makeup-01"
execution:
  step: 2
  must_run_immediately_after: "orelle-makeup-01-frontal"
  depends_on_file: "orelle-makeup-01-frontal.png"
  reference_image_required: true
  abort_if_reference_missing: true
identity:
  mode: "strict visual identity lock"
  independent_regeneration_forbidden: true
  preserve_cosmetic_feature_locations: true
  preserve_hairstyle_geometry: true
  hair_is_part_of_final_appearance: true
capture:
  view: "three-quarter profile"
  direction: "subject right, viewer left"
  yaw_degrees: 50
  camera_height: "eye level"
output:
  files: 1
  width: 1600
  height: 1600
  format: "PNG"
  colour_space: "sRGB"
  filename: "orelle-makeup-01-profile.png"
---

The exact output of prompt `orelle-makeup-01-frontal` must be attached as the mandatory visual identity reference. If it is absent, do not generate an image and do not recreate the woman independently from text.

Generate exactly one extremely photorealistic photograph of the same fictional woman, rotating her head approximately 50 degrees towards her right, corresponding to the viewer's left. Keep her shoulders mostly facing the camera. This must be a three-quarter profile rather than a complete side view.

Strictly preserve identity, apparent age, facial anatomy, medium skin tone, strictly neutral undertone, grey-green eyes, hairline, clothing, lip shape, eyebrow structure, eyelid contours, pores, minor skin variation and asymmetry. Preserve accurate colour balance; do not shift the skin towards warm, cool, pink, golden or olive.

The loose hairstyle is part of the subject's appearance and must remain identity-locked. Preserve the same dark-blonde colour, side part, length, soft wave pattern, volume, texture and distribution over both shoulders. Allow only the physically natural perspective change caused by the 50-degree head rotation. Do not tie the hair back, shorten it, recolour it, straighten it, increase its curl, move all of it to one shoulder or replace the hairstyle.

Keep the hair visually present around the outer contour and shoulders while preserving every facial analysis region. No strand may cross the forehead, eyebrows, eyes, cheeks, nose, lips or jawline. Do not let the profile rotation cause hair to cover the visible side of the face.

Preserve the same very slight, elegant closed-mouth smile without showing teeth, pursing the lips, strongly lifting the cheeks or narrowing the eyes. Match the frontal photograph's lighting, neutral white balance, background, camera distance, camera height, sharpness and exposure.

Apply absolutely no makeup or visible skincare product. Do not add foundation, concealer, powder, blush, highlighter, eye makeup, eyebrow product, mascara, lipstick or gloss.

Keep the complete head, facial outline, chin, full loose hairstyle and upper shoulders in frame. Keep the face near the centre and approximately 55% of the image height, with sufficient surrounding space for the hair to remain visible.

Generate one separate image only. No collage, contact sheet, second person, second face, filters, beauty retouching, skin smoothing, jewellery, glasses, text, watermark, full 90-degree profile, crop, blur, hard shadow, hairstyle replacement or identity variation.
```
