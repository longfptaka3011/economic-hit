# Illustrated homepage

The user requested the supplied illustrated pixel-art homepage as a visual reference. The implementation keeps its blue/violet sunset landscape, gold title treatment, three prominent actions and four illustrated cards. The cards describe the actual game districts (industrial profit, commercial profit, interest and ground rent), rather than suggesting that historical economic formations are playable stages.

All title text, navigation, actions, educational copy and frames are real React/CSS/SVG elements. The homepage preserves local avatar setup, create/join room flows, live connection/ping status and lazy Phaser loading. High ping uses amber rather than implying low latency. The guide button expands and focuses the instructions; fullscreen uses the existing browser fullscreen handler. Mobile uses stacked actions/cards, with a skip link, visible keyboard focus and reduced-motion styling.

## Saved production assets

Generation mode: **built-in `image_gen` tool**, no CLI/API fallback. Only encoding to WebP was performed after generation; no image content was redrawn in postprocessing. The generated images are decorative marketing illustrations; gameplay continues to use the existing licensed tile packs.

| Asset | Dimensions | Transfer size |
|---|---|---|
| `apps/client/public/assets/home/market-sunset.webp` | 1659×948 | 274,282 bytes |
| `apps/client/public/assets/home/district-scenes.webp` | 2172×724 | 756,940 bytes |

The two original PNG files total 5,439,246 bytes; the production WebP files total 1,031,222 bytes (about 81% less). The hero is preloaded from `apps/client/index.html`. The atlas is cropped into four illustrations by CSS background positioning. PNG originals are retained in `.tmp/home-source-images/` and in the built-in tool's generation output; they are excluded from deployment.

## Exact generation prompts

### Landscape (one user-provided image included as reference)

Use case: stylized-concept. Create a production-ready PIXEL ART LANDSCAPE BACKGROUND asset for the MARKET MAYHEM game homepage, inspired by the attached reference image's twilight pixel-art landscape, jewel-like gold illumination, blue and violet sky, warm sunset, game-poster craftsmanship. The attached image is STYLE/COMPOSITION REFERENCE ONLY, not an edit target. Output one wide landscape 1792x1024 or wider image, crisp deliberate pixel clusters, rich detailed hand-pixelled environment, no photorealism, no smooth vector gradients. NO TEXT, NO LETTERS, NO LOGO, NO UI BUTTONS, NO CARDS, NO BORDERS, NO WATERMARK. Composition: upper 60 percent mostly open deep indigo evening sky, scattered lavender and peach pixel clouds; central sky dark and uncluttered so large HTML title can overlay. Detailed scenery restricted to bottom third and far left/right edges: left a leafy tree canopy framing the corner and a charming rural trading village with market stalls, small grain barn and stone commercial hall; right a red-brick factory with smoking chimneys, bank and modern office towers lit by golden sunset near far right horizon, distant blue mountain silhouettes. A thin grass-covered earth platform runs across at 78 percent height, lower portion transitions naturally into dark navy earth/shadow suitable for cards over it. Tiny warm lanterns, gold sunset highlights, painterly-but-crisp 16-bit/32-bit pixel art, inviting multiplayer strategy-game aesthetic, high polish. Preserve generous negative space in the central 65 percent for real page content.

### District atlas (new image, no reference image attached)

Use case: stylized-concept. Generate ONE wide pixel-art environment illustration atlas for four economic district cards in a polished multiplayer strategy game. Exact composition: FOUR EQUAL WIDTH vertical panels side by side, left-to-right, no gaps, each panel is its own cohesive scene, all four the SAME height; total wide aspect ratio approximately 3:1, ideally 1536x512. No text, no letters, no labels, no UI borders, no cards, no icons, no logos, no watermark. Crisp rich handcrafted 16-bit/32-bit pixel art, visible deliberate pixel clusters, golden late afternoon lighting, lavender clouds and blue mountains, charming immersive isometric-ish side-view landscapes, matching a twilight fantasy economic city game. Panel 1 leftmost: red brick industrial factory, terracotta roofs, two tall chimneys, warm sunset orange palette. Panel 2 next: bustling cozy commercial market with colorful striped stall awnings, crates of produce and timber shop fronts, sunny blue/teal palette. Panel 3 next: grand classical bank with stone columns and golden coin ornament, office towers and street lanterns, rich sapphire blue with gold palette. Panel 4 rightmost: peaceful lush farmland with golden grain rows, windmill, fruit trees and a small farmhouse, moss green and warm gold palette. Each main subject is centered in its own quarter of the image and fully contained within that quarter, no subjects crossing between quarters. Four equally vivid, equally detailed scenic illustrations, designed to be shown as separate CSS background crops.

## Verification

Browser checks cover desktop, tablet and phone widths (1659, 1280, 768, 390 and 320px), image decoding, visible action targets, no horizontal overflow, help focus, local game start, create/join entry, offline local-play availability and reduced motion. The game regression suite and production build are also run before release.
