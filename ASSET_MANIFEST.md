# ASSET MANIFEST – MARKET MAYHEM

Complete inventory of imported visual assets, source information, author, license, and verification status.

| Asset File Path | Source URL / Repository | Author | License Type | Commercial Use Allowed | Attribution Required | Verification Status | Usage Description |
|---|---|---|---|---|---|---|---|
| `apps/client/public/assets/tiles/urban_tiles.png` | https://kenney.nl/assets/rpg-urban-pack | Kenney (www.kenney.nl) | CC0 1.0 Universal | Yes | No (Credited voluntarily) | Verified (Official Kenney site & OpenGameArt mirror) | 486 tiles (16x16px) containing urban buildings, roads, sidewalks, props, vehicles, and 6 animated characters |
| `apps/client/public/assets/tiles/tiny_town_tiles.png` | https://kenney.nl/assets/tiny-town | Kenney (www.kenney.nl) | CC0 1.0 Universal | Yes | No (Credited voluntarily) | Verified (Official Kenney site & OpenGameArt mirror) | 132 tiles (16x16px) containing rural terrain, farms, wheat fields, trees, cottages, and fences |
| `apps/client/public/assets/tiles/License_RPG_Urban.txt` | Included with Kenney distribution | Kenney | CC0 1.0 Universal | Yes | No | Verified | Official license text file |
| `apps/client/public/assets/tiles/License_Tiny_Town.txt` | Included with Kenney distribution | Kenney | CC0 1.0 Universal | Yes | No | Verified | Official license text file |
| `apps/client/public/assets/ui/market-coin.svg` | Original project source | MARKET MAYHEM project | Project asset; not a third-party license | Controlled by project owner | No external attribution | Created locally as SVG code | 16×16 pixel coin favicon |
| `apps/client/public/assets/home/market-sunset.webp` | Generated for the project; see `docs/HOMEPAGE_ART.md` | OpenAI image generation output | Generated project artwork; not an imported licensed pack or CC0 claim | Not a downloaded commercial-use pack | No third-party pack attribution | Provenance and exact prompt recorded | 1659×948 homepage landscape, 274,282 bytes |
| `apps/client/public/assets/home/district-scenes.webp` | Generated for the project; see `docs/HOMEPAGE_ART.md` | OpenAI image generation output | Generated project artwork; not an imported licensed pack or CC0 claim | Not a downloaded commercial-use pack | No third-party pack attribution | Provenance and exact prompt recorded | 2172×724 four-panel district illustration atlas, 756,940 bytes |

---

### Verification Notes
- Both packs are released under Creative Commons CC0 1.0 Universal (Public Domain).
- No copyrighted third-party characters (e.g. Nintendo Pokémon, Mario, etc.) are included.
- Local PNG headers checked: Urban is 432×288 (27×18 cells); Tiny Town is 192×176 (12×11 cells). Both use 16×16 cells without spacing.
- City tiles and characters render at integer 2× scale (32 source-display pixels). The logical gameplay cell remains 16 pixels; the map remains 256×256 cells.
- Local license files checked before using the existing tiles in the new city renderer. No new third-party pack was downloaded for this implementation.
- Native pixel details (chimneys, wheat, bank plaques, market stalls, fountain), territory graphics and UI frames are drawn by project code. They are not additional imported packs.
- Character customization extracts the six existing Urban Pack character sets (four directions, three poses) into 64×48 canvas sheets and recolors the shirt region at runtime. These are derivatives of the already listed CC0 Urban Pack, not new downloaded assets.
- Existing Google Fonts references in `apps/client/index.html` remain external stylesheet dependencies, with local monospace fallbacks. No font binaries were imported or included in these PNG inventories.
- Assets are hosted locally within `apps/client/public/assets/` to ensure offline availability and fast loading.

