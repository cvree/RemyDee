# The Maker's Pass — what shipped

The bench had seven genuinely different mini-games with real decisions in them, and
it still felt like a scoring minigame bolted to the side of the game. This pass is
about why, and the five connected changes that fix it.

Measured against `NORTH_STAR.md`: Pillar I (*knowledge is power, literally*),
Pillar III (*effort must be legible in the outcome*), and Design Rule 4 (*curiosity
is never the slow option*).

---

## 0. The diagnosis

Applying Scott Rogers' rule from `Make_Fun.txt` — *find the unfun and remove it* —
three things on the bench were unfun, and they were the same thing wearing three
coats:

**You could not see why.** Every craft ended in one opaque percentage. A player who
scored 61% learned nothing about which hand let them down, so "work more carefully"
was the only available strategy — and that is not a strategy. You cannot be tactful
about a black box.

**Heat charged you for something invisible.** The universal heat layer silently
scaled the result by 0.5–1.3× via `heatMult()`. The player felt an unexplained
number move and had no way to read it. Worse, *cooling the piece meant doing
nothing* — stand still and watch a bar fall. The strategic pause was the most boring
thing on the bench.

**How you built a piece was recorded and then thrown away.** Every craft wrote its
build decisions into `craftMeta` — folds, pleats, tempo, bite angle, what went in
the case. Almost none of it was ever read again. A rope's `weakSpots` were logged and
then *silently discarded*, so a shaky braid and a perfect one behaved identically on
the road. Two blades of the same grade were the same blade. That is the real reason
the bench felt detached: nothing you decided there survived the walk out of the gate.

---

## 1. The rubric — the mystery percentage, itemized

Every craft now declares **three named, weighted criteria** that update live while
you work, drawn directly under the quality bar they explain.

| Craft | Rows |
|---|---|
| Blade / Seal (`trace`) | **Line** · **Edge** · Temper |
| Hook (`align`) | **Read** · **Economy** · Temper |
| Bow (`tension`) | **Aim** · **Balance** · Temper |
| Smoke (`fold`) | **Recall** · **Density** · Temper |
| Claws (`fit`) | **Angle** · **Match** · Temper |
| Field kit (`pack`) | **Capacity** · **Balance** · Temper |
| Rope (`weave`) | **Rhythm** · **Seat** · Temper |

Each row shows a live bar, its percentage, a state pip (`○` → `✓` → `★`), a one-line
explanation of what it measures, and the masterwork threshold drawn *on* the bar so
the target is never a guess. Under them, one line names the row that is actually
costing you the grade: *"holding you back: temper"*.

**The grade is gated on the weakest row, not the average** (`rubBuildScore`:
`overall*0.72 + min*0.28`). An average can be flattered by one strong axis; a minimum
cannot. That single rule is what makes a good piece a matter of tact rather than
persistence — verified in `test18`: two rubrics with an identical weighted mean grade
differently when one has a weak row (0.662 vs 0.745).

## 2. Temper — heat became a graded row instead of a hidden multiplier

`heatMult()` is gone from every craft's arithmetic. Heat discipline is now the third
row of every rubric: **the measured share of your working time spent inside the
band** (`heatTemper()` = `inBandT / activeT`). A crack caps it at 0.42, so a cracked
piece can never be starred.

Two fairness fixes fell out of measuring it honestly:

- **The clock starts on your first stroke.** Heat used to open at 0.30 against a
  starting band of `[0.40, 0.60]`, so every craft began with a stretch of "cold" the
  player had no way to skip — and then charged them for it. The piece now comes off
  the coals already workable (`v: 0.44`), and `heatTick` refuses to run until the
  first stroke.
- **Beats where you cannot act don't count.** `heatTick(active, frozen)` freezes the
  clock through choice screens and through the smoke shell's fold-order playback.
  Charging Temper for time the player was forbidden to work is the same unearned
  penalty in a different hat.

The strategic pause still works — pausing mid-work still cools the piece.

## 3. The scrap apron — cooling is a verb now

The canvas reserves a 54px **apron** below the work area (`craftH(cv)` = canvas
minus `APRON`; every craft lays itself out against it, so the strip is guaranteed
clear of the work). Four to six breakable offcuts sit there.

Smashing them vents real heat — slag carries more away than an offcut, and each
takes two hits, with a hairline crack after the first so you can read the damage
before you commit. **This is the only active way to shed heat**, which turns the
worst moment on the bench (stand still, watch a bar) into the most tactile one.
It is also the one tip `Make_Fun.txt` closes on: *make stuff breakable.*

The apron gets first refusal on every pointer event, so a smash can never also
register as a stray stroke on the piece you are working (asserted in `test18`).

## 4. The masterwork — and what it costs

A fifth tier above *fine*. It demands three things at once, and any one of them
missing denies it:

1. **Every rubric row past the bar** (88%, or 80% in relax mode) — no weak hand
   anywhere in the build.
2. **A piece that was never cracked.**
3. **A clean decode** (≥ 85%) — you understood the word the commission was written
   against.

That third clause is the point of the whole game. *You cannot hammer your way to a
perfect tool without knowing the term it was ordered against.* A flawless build with
a fumbled decode ships as `ok`, and `test18` holds that line.

A masterwork is not merely a bigger number: it scales traits ×1.5, **removes the
piece's failure mode entirely** (it cannot slip, fade, or catch), speeds momentum
12% on the road, and survives one extra journey as an heirloom.

## 5. The spec — how you built it reaches the road

`craftSpec(item)` is the single place that reads a piece's build decisions and turns
them into road numbers. `craftMeta` is finally load-bearing.

| Craft | The decision | What it does on the road |
|---|---|---|
| Blade | **folds** (1–5) | Strike's corridor (`strikeSpan` 0.46→0.68) and the momentum floor (×1.30→×1.70) |
| Smoke | **pleats** (3–6), **leaks** | The phase window, second for second (4.0s at three pleats, 6.1s at six); every mis-remembered pleat cuts 0.55s |
| Rope | **weakSpots**, **looseSpots** | A live `slipChance` — the line really gives out on the upper ledge |
| Bow | **bestDraw** | power → wider corridor · accuracy → +0.45 momentum per Strike · speed → an extra Strike charge |
| Claws | **angle**, **consistency** | steep → hazards glance off · shallow → the ledge is walked faster · a mismatched set can skate |
| Hook | **balanceLean**, **balanceRead** | reach → up to 48% more road to read each rune gate over · stability → hazard resistance |
| Field kit | **packed** counts | tonics → Mend restores up to 160% · bandages → extra Mend charges, each lighter |

Two consequences worth calling out:

- **The strike arc is drawn from the blade.** `M.sweepSpan` means a five-fold edge
  visibly sweeps most of the screen where a two-fold one barely clears.
- **The rope slip does not break your answer streak.** It brakes the pace, because
  it is the *gear* failing, not the player misreading a word. The streak keeps
  meaning "words I got right."

Every number is stated three times before it can surprise you: on the **spec sheet**
at the test step, in the **assign forecast** before departure
(*"Razor Blade · Folded 5× — Strike sweeps 68% of the road ahead"*), and in the
**road's gear chip** while walking.

## 6. The spec sheet — the lesson, not just the score

The test step used to be a 1.4s animation you watched. It now also prints what the
piece you actually built will do, and closes with exactly **one** actionable line:

> **One thing away: Temper** came in at 56% and every row needs 88%. Time worked
> inside the heat band — that's the row to win next time.

Chosen in priority order: ruined → cracked → decode → weakest row. A player who
reads this walks into the next commission knowing what to do differently, which is
the whole difference between a score and a lesson.

## 7. Interaction upgrades where a craft was thinnest

- **Hook — probes replace scrubbing.** Dragging the slider used to give continuous
  free hot/cold feedback, so the "hidden" optimum wasn't hidden: you swept the bar
  until the ring went calm. You now get **five probe strikes**; each rings the beam,
  pins its reading on the track, and then the beam goes quiet. It is triangulation
  from a handful of samples. Probes cost heat, unspent probes are scored, and
  committing far from anything you probed caps the Read row.
- **Claws — the marked claw.** The template is scribed on the **first post only**.
  Set that one against the mark; then the mark disappears and you match the other two
  by eye against your own first claw. **Angle** grades you against the mark,
  **Match** grades you against yourself, and three claws set neatly to the wrong
  angle scores one and fails the other.
- **Rope — strike, then seat.** Each beat is a tap *and* a hold. Release early and
  the strand sits loose; hold past it and you overwork the fibre. Two different
  mistakes leaving two different marks on the finished rope. The fast tempo tightens
  both windows — and because both rows scale by tempo value, **a slow braid tops out
  near 78% and can never be a masterwork.** Choosing the safe tempo is choosing not
  to be perfect, and the rubric says so from the first beat.
- **Field kit — carry balance.** A crammed case can still be a bad case. Weight is
  now tracked either side of the case's centre line and shown as a live see-saw on
  the strap. *Where* each supply goes matters as much as how many fit.
- **Blade — the worst fold sets the line.** Each fold is graded on its own and the
  sloppiest one weighs into the Line row, so pushing for a fifth fold is a real
  gamble rather than free upside. The decide prompt shows both the bank-now figure
  and your sloppiest fold so far.

---

## One real bug fixed on the way

`craftAnim` only ever held the **last** scheduled frame id, so starting a second
craft orphaned the first one's render loop — it kept running for the rest of the
session. That was invisible while the loops only drew. Once they also published the
rubric's grade every frame, a zombie loop from an earlier piece would overwrite the
current piece's quality with its own stale score, and the piece shipped flawed no
matter how well it was built. Worse, the retired loop's final frame clobbered
`craftAnim` itself, leaving the live loop uncancellable.

Each craft run now takes a generation token (`craftNewGen()`), its loop refuses to
draw, grade, or reschedule once superseded, and a stale loop can never touch the live
loop's frame id. `test18` pins the regression directly: a banked quality must survive
every following frame.

---

## Tests

`test18.js` (97 assertions) covers all five sections: every craft's rubric shape and
normalised weights, the weakest-link asymmetry, all three masterwork gates
independently (including that a flawless build with a bad decode is denied), the
apron's geometry / heat venting / event isolation, the heat clock's start and freeze
rules, `craftSpec` for all seven crafts plus null-safety, the spec landing on a
*running* road (momentum floor from fold count, phase window from pleat count, slip
chance from weak spots, chip text naming the build), and the no-zombie-benches
regression.

`test12.js` was updated rather than replaced — it still drives all seven crafts
through real simulated pointer input, now against the probe budget, the marked-claw
ordering, and the strike-and-hold braid.

Full suite: **569 assertions across 13 files, all passing.**
