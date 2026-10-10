# Galeria de Artes — Manifesto

Cada obra é uma seção `## Título` com um bloco de código ` ```artwork ` contendo os
metadados em YAML, seguido (opcionalmente) de uma descrição em texto livre.

O script `sync_galeria.py` lê este arquivo e sincroniza com o banco.  
Novas obras são inseridas; obras já existentes (mesmo slug) são atualizadas.

---

## Campos disponíveis

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `slug` | string | não — derivado do título | Identificador único na URL |
| `image_url` | string | **sim** | URL da imagem (Civitai CDN, picsum, etc.) |
| `thumbnail_url` | string | não — usa `image_url` | Thumbnail menor para o grid |
| `category` | string | **sim** | Ex: `Personagem`, `Paisagem`, `Retrato`, `Criatura`, `Abstrato` |
| `model` | string | **sim** | Ex: `SDXL 1.0`, `SD 1.5`, `Flux.1 Dev`, `Flux.1 Schnell` |
| `style` | string | **sim** | Ex: `Fotorrealista`, `Arte Digital`, `Anime`, `Cyberpunk`, `Conceitual`, `Fantasia` |
| `prompt` | string (multiline com `\|`) | não | Prompt positivo enviado ao modelo |
| `negative_prompt` | string (multiline com `\|`) | não | Prompt negativo |
| `sampler` | string | não | Ex: `DPM++ 2M Karras`, `Euler a`, `DDIM`, `UniPC` |
| `steps` | inteiro | não | Número de passos de diffusion |
| `cfg_scale` | decimal | não | CFG / Guidance scale |
| `seed` | string | não | Seed numérica (entre aspas para preservar zeros à esquerda) |
| `width` | inteiro | não | Largura em pixels |
| `height` | inteiro | não | Altura em pixels |
| `created_at` | data `YYYY-MM-DD` | não — usa hoje | Data de criação |

A descrição em texto livre vem **depois** do bloco ` ```artwork ` e pode ser
escrita em Markdown (é exibida como parágrafo na página da obra).

---

## Obras

## Guerreiro das Sombras

```artwork
slug: guerreiro-das-sombras
image_url: "https://picsum.photos/seed/warrior-dark/512/768"
category: Personagem
model: SDXL 1.0
style: Arte Digital
prompt: |
  dark warrior, full body, obsidian armor with glowing runes, ethereal shadows,
  dramatic rim lighting, highly detailed, 8k resolution, concept art, fantasy,
  cinematic composition, bokeh background
negative_prompt: |
  blurry, low quality, watermark, text, ugly, deformed, extra limbs,
  bad anatomy, worst quality
sampler: DPM++ 2M Karras
steps: 30
cfg_scale: 7.5
seed: "3847291056"
width: 512
height: 768
created_at: 2024-11-15
```

Um guerreiro envolvido em sombras etéreas, com armadura negra adornada de runas
luminescentes. A iluminação dramática realça cada detalhe da armadura forjada nas
profundezas.

---

## Be a Hero — Estampa Urbana

```artwork
slug: be-a-hero-estampa-urbana
image_url: "/uploads/estampa-camiseta-be-a-hero-flux.png"
category: Personagem
model: Flux.1 Dev
style: Arte Digital
prompt: |
  t-shirt print design, circular badge emblem, standalone graphic artwork, only the print, isolated on a solid pure white background. Upper body portrait framed up to the torso of a powerful heroic character in a dynamic power pose, confident and commanding stance. The character is framed within a stylized circular crop border. Vibrant urban street art and graffiti aesthetics, bold spray paint colors, electric cyan, vivid neon magenta, bright yellow, deep purple accents, bold black comic outlines, subtle aerosol splatters. Bold stylized streetwear typography text clearly reading "BE A HERO" in English curved or placed on the emblem design. Clean vector illustration style, sticker art style, high contrast, sharp details, master quality apparel graphic.
negative_prompt: |
  full body, legs, feet, shoes, t-shirt mockup, fabric, clothing folds, realistic shirt photo, mannequin, hanger, dark background, textured background, gray background, blurry, distorted text, bad typography, low quality, deformed
sampler: Euler
steps: 25
cfg_scale: 1.0
seed: "2024"
width: 1024
height: 1024
created_at: 2026-10-10
```

Arte gráfica concebida especificamente para estampa de camiseta em estilo arte urbana e grafite. Traz um herói em pose de poder enquadrado até o tronco dentro de um círculo de corte com efeito de spray, acompanhado da tipografia "BE A HERO" e uma paleta marcante de ciano elétrico, magenta e amarelo sobre fundo branco puro.

---

## Imperatriz Japonesa — Tattoo Manga

```artwork
slug: imperatriz-japonesa-tattoo-manga
image_url: "/uploads/tattoo-japonesa-imperatriz-flux.png"
category: Personagem
model: Flux.1 Dev
style: Anime
prompt: |
  Masterpiece Japanese tattoo design, manga anime aesthetic. A stunning imperial Japanese empress in a tattoo art style. Selective color: high contrast monochrome black and white ink art, with vivid crimson red ONLY on her kimono dress and her wagasa umbrella. The Japanese empress has an elegant manga face, expressive eyes, and ornate black hair styled with traditional imperial kanzashi hairpins in black ink. She is gracefully holding an open traditional Japanese wagasa paper parasol umbrella in striking bright crimson red. She wears an elaborate royal Japanese empress kimono robe in rich vivid scarlet red. Her pale porcelain skin, eyes, face, hair, sumi-e shading, and delicate crosshatching are entirely monochrome black and white. Tattoo flash artwork, crisp bold black outlines, isolated on pure white background, minimal black ink splash accents, floating black and white cherry blossom petals, clean linework, high contrast.
negative_prompt: |
  color on skin, color on face, colorful background, blue, green, yellow, orange, purple, color on hair, photorealistic, 3d render, photo, realistic skin, blurry, bad anatomy, deformed hands, extra fingers, poor quality, watermark, text
sampler: Euler
steps: 25
cfg_scale: 1.0
seed: "777"
width: 1024
height: 1024
created_at: 2026-10-10
```

Design de tatuagem inspirado na estética tradicional japonesa e mangá contemporâneo, retratando uma nobre imperatriz em técnica de cor seletiva (*color pop*). O contraste dramático é construído com traços em tinta preta e sombreado sumi-ê em preto e branco sobre fundo limpo, destacando exclusivamente o vermelho escarlate vibrante no quimono imperial e na sombrinha tradicional wagasa.

---

## Gato Navegador

```artwork
slug: gato-navegador
image_url: "/uploads/gato-navegador.png"
category: Personagem
model: Flux.1 Dev
style: Fotorrealista
prompt: |
  Cinematic award-winning photograph of a real domestic cat sitting on a rustic wooden harbor pier at dusk. The cat has completely authentic feline anatomy and is sitting upright naturally in a real cat pose on all four paws, resting peacefully on weathered dock wood planks. A human owner has dressed the cat in a miniature ship captain costume: a tiny Edwardian Titanic-style captain peaked naval hat perched delicately between its natural pointed cat ears, a small tailored dark navy blue captain coat with tiny gold buttons and epaulets fitted onto its furry body, and a small dark cape draped across its back. In the background, a majestic grand vintage Titanic-era steamship ocean liner is moored in the harbor. Atmospheric twilight sunset, glowing amber and golden hour crepuscular rays, deep blue and violet dusk sky, gentle water ripples. Shallow depth of field, sharp crisp focus on the cat, realistic fur texture, whiskers, and feline eyes, soft creamy cinematic bokeh blur on the background harbor and ship, 8k resolution, photorealistic, natural lighting.
negative_prompt: |
  anthropomorphic, standing on two legs, bipedal, human body, human pose, walking upright, cartoon, 3d render, anime, illustration, painting, drawing, deformed, extra legs, bad anatomy, distorted paws, blurry, low quality, watermark, text
sampler: Euler
steps: 25
cfg_scale: 1.0
seed: "3527464381"
width: 1024
height: 1024
created_at: 2026-10-10
```

Fotografia cinematográfica em alta resolução retratando um gato doméstico com anatomia e postura felina autêntica, sentado sobre as tábuas de um cais portuário ao entardecer. O felino veste um detalhado traje de capitão de navio estilo Titanic, com casaco naval de botões dourados, pequena capa e chapéu militar. Ao fundo, um imponente transatlântico a vapor repousa atracado sob as cores douradas e púrpuras do crepúsculo com desfoque cinematográfico.