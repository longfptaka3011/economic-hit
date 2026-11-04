# Fifteen-player rooms and pointer-only quiz controls

## Capacity and fairness

- Online rooms accept 2–15 players; the sixteenth join is rejected server-side. Fifteen is a per-room limit, not a measured limit for all concurrent rooms on Render.
- Six characters and sixteen color choices; duplicate room colors remain rejected. Appearance changes still clear ready status. Every current member must be ready, including the fifteenth player.
- Rooms with up to four players retain their original spawn locations. Larger rooms randomly assign fifteen or fewer slots from a sixteen-point ring of radius 90 cells around the central market. Slots do not cross district borders or overlap starting land. Each player starts with 25 cells and a 50 points/second base yield, at approximately equal distance from the market. A fresh match reshuffles positions.
- The lobby grows its roster as people join, shows joined/ready counts, uses compact cards, and keeps ready/start controls accessible while scrolling. The city artwork previews four avatars with an explicit extra-player badge; it does not represent a four-player limit. Home, help, metadata and result ranking reflect the expanded room size.

## Quiz input fix

The old overlay focused the first answer automatically. Browser default activation on Space keyup could therefore submit an answer when a player released their sprint key. The new overlay focuses its panel, captures movement/activation keydown and keyup while mounted, and accepts answer/continue/exit clicks only when the click has a nonzero pointer click count. Keyboard and scripted zero-count clicks are ignored. Mouse, pen and tap-generated clicks work. Tab still moves focus, but keyboard activation is intentionally disabled for these controls as requested. Listeners are removed on close, so movement works again after continuing. Server answer validation and five-second wrong-answer penalties remain authoritative.

## Submission refinements

The race HUD is collapsed by default (about 310×140px in the desktop browser check, up to 290px wide on phones). Clock, score, land/rank, district, income and action buttons remain visible; the Details toggle reveals advice and income/leaderboard panels. Solo practice now has exactly one player, no AI entity, no bot territory/economy/minimap marker, and personal results rather than opponent rankings. Unused BotPlayer and ArcadeHUD implementations are removed. Browser checks cover a solo capture, pause/resume, all ten unique pointer-answered questions, personal results and clean replay preserving the avatar. See [SUBMISSION.md](SUBMISSION.md) for running and presenting the project.

## State delivery and CPU work

- Ownership indexes avoid scanning all 65,536 cells separately for each player's full territory. A bounded latest-change journal emits ownership deltas, including clears and transfers, between reliable ordered Socket.IO snapshots. Full ownership is sent at match start and explicit resyncs such as a departure.
- The receiver accumulates every delta before React can batch away an intermediate render. It reuses a complete local ownership array until something changes, preserving updates during Phaser loading. A new match resets ownership state.
- Trail cell indexes preserve the first collision position and victim ordering without scanning every point on every collision check. Compact endpoints/turns reconstruct the normal adjacent-cell path exactly. Per-player trail versions avoid rebuilding unchanged trails; off-camera trail cells skip drawing.
- Production WebSockets negotiate per-message deflate for payloads of at least 2KB, level 3, without context takeover. Client position prediction and opponent interpolation remain active. Cuts, captures, economy, quiz gates and rewards stay on the server.

## Evidence

- Regression tests cover fifteen-player nonoverlapping starts, equal income, all ten scheduled answers per person, overflow joins, all-member ready votes, ownership transfer/removal over real sockets, ownership indexes, React batching, trail codec fidelity and collision ordering.
- Browser checks use two rendered players and thirteen additional real Socket.IO clients in one room. They verify all fifteen avatars/ranks, desktop and 390px mobile layout, held Space across the quiz transition, repeated WASD/arrows/Enter, deliberately focused answer/continue buttons, real mouse selection, real touch selection, the wrong-answer penalty, independent resumption, restored movement and the local quiz path.
- One local Node 24 / Windows simulation run exercised 7,200 ticks (120 seconds) with fifteen players moving, sprinting and answering checkpoints. It recorded 133 captures and 10 cuts. Tick p99 was approximately 0.35ms, with a 26.94ms maximum; snapshot construction plus JSON p99 was approximately 1.37ms. Raw snapshots averaged about 48.5KB; a separate level-3 raw-deflate measurement averaged about 6.9KB, excluding network framing. These are local scenario measurements, not Render performance guarantees or an eight-minute bandwidth forecast. Spawn shuffling and machine load affect repeated measurements.

Public deployment is checked separately with fifteen simultaneous WebSocket clients, active movement and the real first checkpoint. Hosting plan and instance count are unchanged; no payment or horizontal scaling is enabled by this release.
