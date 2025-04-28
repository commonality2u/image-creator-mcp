# Creative Prompt Recipes for MCP Image Creator

> *A curated collection of prompt recipes for generating exceptional images with the MCP Image Creator*

## Table of Contents

- [Quick-Start Template](#quick-start-template)
- [Image Editing with Reference Images](#image-editing-with-reference-images)
- [Prompt Recipes](#prompt-recipes)
  - [Hero Backgrounds](#hero-backgrounds)
  - [Icons](#icons-1024×1024-transparent)
  - [Section Illustrations](#section-illustrations-blog--feature)
  - [Textures & Patterns](#textures--patterns)
  - [Fun / Easter Eggs](#fun--easter-eggs)
- [Photographic Prompt Recipes](#photographic-prompt-recipes)
  - [Hero Banner Photos](#hero-banner-photos)
  - [Feature/Benefit Photos](#feature--benefit-illustrative-photos)
  - [Avatar/Testimonial Portraits](#avatar--testimonial-portraits-square)
  - [Blog/Case-Study Headers](#blog--case-study-header-photos)
- [Tips & Knobs](#tips--knobs)
  - [For Abstract/Design Prompts](#tips--knobs)
  - [For Photographic Prompts](#tips-for-photographic-prompts)

## Quick-Start Template

```jsonc
// For generating images from text prompt:
{
  "name": "create_image",
  "arguments": {
    "prompt": "<your vivid description>",
    "brandSignature": "palette:#0EA5E9,#0F172A; tone:Clean",
    "size": "1536x1024",
    "quality": "high",
    "filename": "<descriptive-name>.png",
    "outputPath": "<subfolder>",
    "targetProjectDir": "/absolute/path/to/project"
  }
}
```

## Image Editing with Reference Images

You can use reference images to edit or combine existing images using OpenAI's `gpt-image-1` model. Add the `referenceImagePaths` parameter with an array of paths to existing images (relative to your target project's public folder).

```jsonc
// For editing/combining existing images:
{
  "name": "create_image",
  "arguments": {
    "prompt": "Create a lovely gift basket with these products inside it",
    "referenceImagePaths": [
      "products/soap.png",
      "products/lotion.png",
      "products/incense.png"
    ],
    "filename": "gift-basket.png",
    "outputPath": "marketing/promo",
    "targetProjectDir": "/absolute/path/to/project"
  }
}
```

**Note**: When using `referenceImagePaths`:
- The model is automatically set to `gpt-image-1` (required for image editing)
- Size parameter is ignored as it's not supported for image editing operations
- All reference images should exist in your target project's public folder (or subdirectory)
- Use detailed prompts describing the desired modifications or combinations

## Prompt Recipes

### Hero Backgrounds
| Goal | Prompt (copy-paste ready) |
|------|--------------------------|
| Abstract gradient mesh | `"Dreamy gradient mesh swirling between #0EA5E9 and #0F172A, subtle bokeh lights, modern SaaS hero backdrop, soft focus, ultra-wide composition"` |
| Futuristic skyline silhouette | `"Minimalist cyber skyline at dusk, neon line art, horizon glow, negative space left for headline, high resolution matte painting"` |
| Paper-cut waves | `"Layered paper-cut ocean waves, brand blues, slight shadow depth, clean vector aesthetic, high contrast for overlay text"` |

### Icons (1024×1024, transparent)
| Purpose | Prompt |
|---------|--------|
| Export icon | `"Line icon, arrow exiting square, 2.5pt stroke, rounded ends, brand color #0EA5E9 on transparent, flat SVG style"` |
| AI chip | `"Isometric microchip with glowing neural lines, duotone brand palette, crisp pixel-perfect edges"` |

### Section Illustrations (blog / feature)
| Scenario | Prompt |
|----------|--------|
| Flow state coder | `"Stylized illustration of developer at standing desk, swirling code snippets, teal and midnight palette, open source vibes, flat shading"` |
| A/B variant cards | `"Two overlapping website cards labeled A and B, playful pastel colors, subtle drop shadow, 3:2 aspect"` |

### Textures & Patterns
| Use | Prompt |
|-----|--------|
| Subtle grid overlay | `"Ultra-light blueprint grid pattern, 8px spacing, brand teal lines on transparent, repeating seam-less tile"` |
| Particle network | `"Constellation of data nodes linked by thin glowing lines, dark background, depth-of-field blur, 4K wallpaper"` |

### Fun / Easter Eggs
| Idea | Prompt |
|------|--------|
| Mascot otter | `"Cute otter mascot wearing VR goggles, holding paint brush, tech startup style, vector mascot, brand palette accent"` |
| 404 illustration | `"Robot inspecting broken cable, large 404 numbers, humorous, monochrome line art with teal highlight"` |

## Photographic Prompt Recipes

### Hero Banner Photos  
| Desired Feel | Prompt |
|--------------|--------|
| Tech-futuristic office | `"Wide-angle photograph of a modern glass office atrium at sunset, teal & navy brand lighting accents, shallow depth of field foreground plants, cinematic look, 16:9 hero banner"` |
| Creative flow | `"Over-the-shoulder shot of a developer at ultra-wide monitor, dark mode code glowing, soft rim light, brand palette LED strip, candid studio photography, 1536×1024"` |
| Startup teamwork | `"Candid photo of diverse 3-person dev team whiteboarding UX wireframes, high-key lighting, authentic smiles, neutral backdrop, natural color grading"` |

### Feature / Benefit Illustrative Photos  
| Feature Angle | Prompt |
|---------------|--------|
| Speed & focus | `"Macro shot of mechanical watch gears in motion, dramatic lighting, blue & cyan gels, sharp detail, conveys precision speed"` |
| Brand consistency | `"Flat-lay of Pantone color swatches, teal / navy family, designer desk scene, soft daylight, minimal clutter, top-down photograph"` |
| Zero context-switch | `"Side profile of developer wearing noise-canceling headphones, blurred background monitors, subtle bokeh, calm color palette"` |

### Avatar / Testimonial Portraits (square)  
| Persona | Prompt |
|---------|--------|
| Happy SaaS founder | `"Natural light headshot of 30-yo Latina founder in modern loft office, genuine smile, shallow depth of field, 1:1 aspect, brand teal accent scarf"` |
| Senior developer | `"Studio portrait of bearded software engineer, soft gray backdrop, moody Rembrandt lighting, confident expression, square crop"` |
| Customer success manager | `"Bright portrait of friendly customer success rep wearing headset, clean white background, even softbox lighting, 1024×1024"` |

### Blog / Case-Study Header Photos  
| Story Angle | Prompt |
|-------------|--------|
| A/B test results | `"Overhead shot of two laptop screens side by side, variant A vs B dashboards, warm café lighting, storytelling composition"` |
| AI workflow | `"Close-up of code editor reflecting in developer's glasses, dark environment, neon teal reflections, cinematic shallow DOF"` |

## Tips & Knobs

*  **Brand tuning:** keep a palette list in `branding/palette.json`; reference via `brandSignature`.
*  **Model swap:** heavier creativity → `gpt-image-1`; faster/cheaper → `dall-e-2`.
*  **Variant batching:** loop through prompts with filenames `hero-v1.png`, `hero-v2.png` for split tests.
*  **Negative cues:** add phrases like `"no text, no watermark"` to reduce noise.
*  **Aspect hints:** make size match use case: hero = 1536×1024, icon = 1024×1024, tall illustration = 1024×1536.

## Tips for Photographic Prompts  
1. **Lighting adjectives**: *softbox, rim light, golden-hour, neon gels* to steer mood.  
2. **Lens / depth cues**: *macro*, *bokeh*, *wide-angle* for composition.  
3. **Authenticity**: add *candid*, *natural light*, *genuine* to reduce stock-photo vibe.  
4. **Brand tint**: reference palette colors subtly (*teal accents*, *navy background*).  
5. **People diversity**: call out ethnicity/age range when representation matters.  
6. **Aspect ratio**: hero = 16:9 or 1536×1024, avatars = 1:1.
