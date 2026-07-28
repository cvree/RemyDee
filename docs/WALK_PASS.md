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

---

# The Difficulty Pass — what shipped

The road had one curve, and it was the same curve for a first-day learner and
someone who already knows their roots. This pass gives the player the choice, and
gives the game a way to make that choice for them.

## 7. Four settings, one tuning table

Asked once on the first launch, before the story starts — not buried in a menu —
and changeable from Settings forever after. A returning save keeps the curve it
was already playing (Steady) rather than being interrupted mid-campaign.

| | Gentle ◔ | Steady ◑ | Demanding ◕ | The road that learns ◍ |
|---|---|---|---|---|
| tier | 0.10 | 0.42 | 0.86 | moves |
| hazard density | ×0.62 | ×0.90 | ×1.42 | — |
| hazard bite | ×0.45 | ×0.85 | ×1.27 | — |
| stamina clock | ×0.55 | ×0.95 | ×1.37 | — |
| starting strength | ×1.22 | ×1.07 | ×0.91 | — |
| road to read a gate over | ×1.55 | ×1.20 | ×0.83 | — |
| answers per question | 3 | 3 | 4 | — |
| a wrong door dimmed | always | no | no | — |

Everything downstream reads **one** object, `diffTune()`, so a setting can never
be cosmetic — and the within-road ramp (the last third of any road is visibly
harder than the first) survives at every setting rather than being replaced by it.

Two guarantees the tests hold:

- **The run takes one snapshot** of the difficulty when the squad sets out.
  An adaptive road can never rewrite the rules of a walk in progress.
- **A fixed setting never drifts.** Whatever the player does, Demanding stays
  Demanding.

Relaxed pace stays exactly what it was — an accessibility softener that rides on
top, not a difficulty in disguise.

## 8. The road that learns

A single rating in 0..1, fed by two signals:

- **Every answer, anywhere** — bench, forge, road, Training Hall — moves it
  slightly. One lucky guess proves nothing; a run of them proves something.
- **Every finished run** moves it much more, because a run is the only signal
  that covers pacing, steering and stamina management together. The run's quality
  is re-centred before it is believed (a merely-fine arrival is *par*, not
  evidence of struggling), or the road would oscillate instead of settling.

Confidence ramps in over the first ~24 answers and ~3 runs, so a new player is
not judged by their first two guesses. The tier is clamped to `[0.10, 0.96]` —
never gentler than Gentle, never harder than Demanding.

**It reports itself.** Every results page carries a *"The road you are walking"*
panel: the band by name (Gentle / Steady / Demanding / Unforgiving), a marker on
the scale, and — when it has just moved — which way and exactly what that means
for the next walk. A difficulty that changes in secret is one the player can
never trust or aim at (NORTH_STAR, Pillar II).

**No unfair walls.** A fixed setting will not move on its own, so after a road has
put the party down twice the collapse card offers to ease it — one step down, or
straight onto the road that learns. Offered, never imposed.

## 9. Three systems that make a hard road worth walking

**Completion gates.** Above tier 0.55, gates start asking the hardest and most
useful thing they can: a real term with one part torn out, and its meaning
underneath — `gastr/o + ___ → "inflammation of the stomach"`. Recognising a part
is recall; finishing a word is construction under time pressure, the transfer
mode NORTH_STAR §2 asks the road to deliver. Getting one right shows the whole
assembled term and banks construction mastery for it.

**The re-ask loop.** Wrong answers were being collected in `M.reask` and never
looked at again — a promise the code made in a comment and never kept. Now
roughly two in three questions after a mistake come back to the exact part you
missed, and the gates prefer it too. Getting it right clears the debt, pays extra
momentum, and says so: *"That one caught you earlier — and you have it now."*
Being corrected in the moment is worth far more than being told at the end.

**The flow state.** Four right answers in a row and the caravan enters flow:
everything found is worth ×1.6, momentum will not fall below a hot floor, and the
meter says so. The price is that the road stops being careful with you — the
stamina clock runs ×1.35 and hazards bite ×1.3. So a hot streak becomes a real
decision: ride it for the haul, or drop to the river floor and bank what you
have. One wrong answer, or one hazard taken square, ends it and takes the hot
floor with it. Push-your-luck that can only be earned by knowing things
(NORTH_STAR, Pillar I).

---

`test17.js` covers the four settings and that none of their knobs is cosmetic,
the within-road ramp surviving at every setting, the adaptive rating's floor,
ceiling, confidence ramp and non-drift when fixed, the per-run snapshot, the live
stamina clock, completion gates, the re-ask loop, the flow state's entry and
exit, the results panel's reporting, and save/migration of both the setting and
the adaptive read.
