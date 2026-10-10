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