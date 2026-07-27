# The Walk Pass — what shipped

The road had all its systems and none of its clarity. This pass is about the
*feel* of the walk: what you can see, what the mouse does, what happens when you
run out, and what it feels like to know the answer.

Measured against `NORTH_STAR.md`: Design Rule 3 (*the player's hand is free*),
Pillar III (*effort must be legible in the outcome*), and Pillar I (*knowledge is
power, literally*).

---

## 1. The playfield is never under the interface

**Before.** Lane positions were fixed fractions of the canvas (`0.40 / 0.615 /
0.815`) while the bottom HUD — gear strip, ability row, pace button, hint line and
a two-line caption — stacked to roughly 200px. On anything shorter than a desktop
window the river-floor lane, and everything spawned on it, was drawn *underneath*
the interface. You could walk into a word-part you were never shown.

**Now.** `syncRoadInsets()` measures what `.mission-top` and `.mission-hud` are
really occupying, converts it to canvas pixels, and the walkable band becomes the
canvas minus those two strips. Everything on the road — lanes, word-parts,
hazards, rune-gate arches, the squad — is positioned **band-relatively** (`u`,
0 = top of the band, 1 = bottom) rather than as an absolute canvas fraction, so
when the interface changes size the whole road moves with it.

- Re-measured a few times a second, and on `resize`.
- `ROAD_TOP`/`ROAD_BOT` are now a *maximum* extent, not the definition.
- Verified at 390×780, 1280×620 and 1600×900: the band's bottom edge always sits
  above the control rail's top edge.

## 2. Less clutter, without losing anything

The bottom rail was a wall. It is now a thin, pointer-transparent strip:

| Element | Before | Now |
|---|---|---|
| Forged-gear strip | Always on, wrapped to 2–3 rows | Folded away; the chip for an item **springs out for ~2.6s when that item actually does something**. `G` or the ⚒ button pins the whole strip open. |
| Ability + pace buttons | Tall stacked cards | One row of compact pills (hints hidden on narrow screens) |
| Control hint | In the rail, pushing the road up | Floats in the empty sky, fades after 8.5s, costs the road nothing |
| Caption | Parked on screen permanently | Fixed two-line slot, fades itself out after ~5.4s |
| Chapter title / stats | Wrapped, pushed the pause button off-screen on mobile | Single row; title drops below 700px |

Everything but the actual buttons is `pointer-events:none`.

## 3. The mouse reaches the whole road

Steering was bound to the canvas. The moment the cursor crossed the bottom rail —
which covered the lowest lane — `pointermove` stopped firing and the squad froze.
That is what the dead zone was.

- Steering is bound at the **window**, so nothing can swallow the cursor.
- The pointer's height across the view is re-spread across the band, so both
  edges have real reach instead of a long hard clamp.
- A locked upper ledge no longer wastes travel: the ceiling sits on the seam
  between the ledge and the trail, and the rock above it is **drawn** as a sheer
  face with a labelled dashed edge — so a mouse that stops climbing reads as
  terrain in the way, not a control that broke.

## 4. Stamina is the clock on every road

Stamina hitting zero used to mean "walk at 55% speed forever" on a chapter road;
only the Endless Road ended. Now it ends every road.

1. `beginCollapse()` — input released, pace gauge drops to ×0.
2. The party topples in turn, front of the line first, and the road dims.
3. **The party is down** card: how far they got, and what the walk taught
   (parts read / real terms / words chained / best streak).
4. **Walk it again** re-runs the same road — same squad, same bench, same seed —
   from the start. No partial credit, no arrival grade for a run that failed.

The bench you forged is untouched, and every part you *read* stays in the
Lexicon, so a failed walk is still a walk that taught you something. One warning
fires at 20 stamina naming the two ways out (the river floor, or building a
term), and the stamina bar takes a visible critical state.

## 5. Answering correctly feels like accelerating

Getting a word right used to add a number. Now it changes how the road moves.

- **`rush(power)`** opens a burst that decays over 1–2s. Gates, chained terms,
  popup challenges and reading a part all call it, weighted by how hard they are.
- **Pace eases, it does not snap.** `paceNow` chases `paceTarget` (fast to gather
  speed, slower to shed it), which is the entire difference between "faster" and
  "accelerating". Held inputs — Surge — stay instant, because a button you are
  holding must answer immediately.
- **A streak compounds it.** Consecutive right answers stack up to +0.55 extra
  burst; a hazard hit or a wrong answer resets the streak and visibly brakes.
- **You can see it.** Speed streaks whose count, length and brightness all read
  the same pace figure; a chevron wake blooming behind the squad on the kick; a
  ×pace gauge with an up/down arrow; and waystones on the verge streaming past at
  the road's true speed.

Streaks stay *behind* the squad — the road ahead, where hazards and gates have to
be read, is never obscured.

## 6. Fleshing out the walk for learning

- **The term banner.** Completing a chain raises a card in clear sky with the
  word, every part that made it *with its meaning*, and the definition — tagged
  `real term` or `coined`. The reward and the lesson are deliberately the same
  event. The momentum meter hushes for the couple of seconds it is up.
- **Reinforcement on the tile.** A part you have already sat and read carries its
  meaning on the tile from then on — every later sighting is a free repetition.
  A part you have never read stays bare, so the invitation to hover and learn it
  is intact. (Suppressed on the final boss road, where the Archive seals meanings.)
- **A run recap on failure**, so a collapsed walk still names what it taught.
- **Waystones** every 5% of the road, numbered every 25% — progress you can read
  without opening anything.
- **Reading pays in speed.** Studying a part now calls `rush()` too: curiosity is
  never the slow option (Design Rule 4).

---

## Tests

`test16.js` covers all six: band-vs-HUD geometry at simulated interface sizes,
band-relative placement of every spawned object, steering reach to both edges,
the eased-not-stepped acceleration curve, streak compounding and braking, the
term banner's contents, the folded gear strip and self-fading caption, the
collapse → recap → retry loop, and that a collapsed run never hands out an
arrival grade.
