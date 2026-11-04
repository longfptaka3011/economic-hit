# Online movement smoothing

## What changes

The local avatar predicts movement immediately from keyboard/touch intent, using the same acceleration, normalized diagonal speed, sprint resource and world bounds as the server. The server still simulates at 60Hz, publishes at 10Hz and owns all cuts, territory, score, shields and quiz locks. No client position or client-supplied frame duration is accepted.

Input changes are sent on the next rendered frame, with a 50ms heartbeat while playing. Snapshots include the last accepted input sequence, the duration the server has held it, sprint recovery delay and a motion revision. The client uses these to estimate the local timeline corresponding to the authoritative state and replays recent input after it. This is a bounded timing estimate, not a guarantee of frame-exact agreement under arbitrary packet delay. Corrections decay visually over 80ms; corrections over 128px snap. Replay is limited to 300ms, history to one second and sent-input timestamps to two seconds. Prediction stops after 500ms without an authoritative update.

Opponents use a 120ms interpolation buffer on server tick time rather than chasing the latest received position. A missing update holds the newest available position instead of extrapolating into a possible collision. Old ticks are rejected. Same-tick updates are allowed because continue, disconnect and match finish can publish immediately between simulation steps.

Respawn and quiz continuation increment the authoritative motion revision. The client clears pending prediction / interpolation across those discontinuities, including short-distance respawns. Learning, pause and finish use authoritative frozen positions. A new match constructs new controllers. Trails and ownership remain authoritative; the avatar can temporarily lead its confirmed trail while an input is in flight.

## Validation

- Tests compare predicted movement with authority, including diagonal normalization, sprint release, bounds and recovery state.
- A ten-second simulation introduces 160–210ms round-trip delay and dropped heartbeats; visual error relative to immediate-input movement stays below 8px on average and 30px maximum in that deterministic scenario. This is a regression threshold, not a production latency benchmark.
- Tests cover queued input replay, convergence, stale packets, long outages, respawn revisions, learning freeze, same-tick finish, jittered remote arrivals and removed players.
- A two-tab browser check delays movement snapshots by 200ms. The controlled avatar moves and begins sprinting before the delayed authoritative position changes. Respawn snaps to spawn, learning freezes prediction and results still open.

## Scope

This subsystem improves perceived movement response and does not add lag compensation for cuts. The subsequent crowd release raises the room limit to fifteen and optimizes state delivery; see [CROWD_PLAYTEST.md](CROWD_PLAYTEST.md). Hosting remains one instance. Measure real RTT, frame time and server tick cost when increasing concurrent room count.
