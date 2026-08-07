# The Trials — the mini-game pass

## What was wrong

Every interaction in this game that was supposed to be a *moment* opened itself.

- **The chest** was a lid you pressed. An animation played, the same loot fell
  out whatever you did, and all four ranks ran the identical ceremony — the
  difference between a travelling case and an Archive reliquary was a colour.
- **The road cache**, the richest find on the walk, checked one boolean (did you
  forge anything with an edge on it), printed one of two sentences, and moved on.
- **The rockslide** — the most physical obstacle in the game — checked the same
  boolean and printed one of two sentences.
- **The spring** handed you a reagent on a coin flip.
- **Step 4 of the forge, the proof**, was a cutscene. The grade was already
  decided before the step opened; you watched a short animation of the thing you
  had made working or failing, and pressed on.

Seven craft interactions at the bench were genuinely good and are untouched.
Everything above asked nothing of the player's hands and was replaced.

## What is there now

One module, `window.__RD_MG`, in its own script block after the question engine.
Ten archetypes, one shared grade ladder, one shared stage.

```
__RD_MG.run(activity, {diff, title, seed}) -> Promise<{score, tier, grade, mult, flawless}>
```

A caller says what the player is **doing** — `chest`, `cache`, `gather`,
`proof`, `seal`, `door`, `tend` — never which mini-game to run. That indirection
is the point: a chest is a ward lock tonight and a seized lid tomorrow, and
`grantChest` never learns about it. A rotation memory guarantees the same
activity never draws the same archetype twice running.

### The ten

| id | the object | the skill |
|---|---|---|
| `sweetspot` | a bronze steelyard balance | drop the pin as the counterweight crosses a marked, drifting, narrowing zone |
| `needle` | a ward lock filling the screen | seat each ward in order as a sweeping pointer crosses it; the pointer speeds up and reverses as you succeed |
| `rhythm` | a mortar, hoops of resin falling onto the rim | strike on the beat, hold the pours, do not play the rests |
| `sequence` | a shelf of labelled apothecary jars | reproduce the order the wicks took light — longer, faster, decoyed, reversed |
| `match` | wax tablets under a burning candle | join each word-part to its meaning before the light goes |
| `flow` | a bronze channel board | route the decoction from retort to phial on a counted number of turns |
| `aim` | roots drying on a rack | take only what the jar's order calls for, before they spoil |
| `trace` | a reed pen and a Greek seal | one unbroken stroke; ink pools when you creep and goes dry when you rush |
| `track` | a wandering pulse at a wrist | keep contact; it accelerates *because* you are holding it |
| `struggle` | a swollen crate lid | alternate shoulders and hold the strain inside a band — past it, the lid splits |

### The grade ladder

`FAILED · ROUGH · CLEAN · EXCELLENT · FLAWLESS`, paying `0 · 0.55 · 1 · 1.3 · 1.75`.

FLAWLESS needs the score **and** a clean run — one miss anywhere caps you at
EXCELLENT. That gate is what keeps the top rung meaning something; without it,
accuracy alone buys it and the word stops being true.

### The mission's new pattern is in the chest

One new commission pattern per mission. It used to be announced in a card on the
arrival screen — which meant the chest that followed it, the game's entire reward
ceremony, never once contained the actual reward for the mission. The card is
gone and the pattern is **pinned** into the arrival chest as its first loot line,
carrying what the card used to say: what the tool does, and which road it was cut
for.

Pinned means the fail-strip cannot touch it. **Progression is never gated on hand
skill** — a fumbled lock costs you the roll, never the pattern, because a player
who cannot pick locks must not stop being able to play. What the grade decides is
what comes *with* it: at EXCELLENT or better, the chest also yields a length of
the bench stock that pattern was cut for, which is the most useful thing the game
can hand over at the exact moment the player is about to walk to the forge and
build it.

`grantChest(quality, reason, onDone, {pin:[…]})`. Pins are prepended to the roll
and flagged `keep`. `pendingPatternLoot(chapter)` returns null on a replayed road,
so an arrival never promises a reward it is not carrying.

### What failure costs, per call site

| where | FAILED | FLAWLESS |
|---|---|---|
| chest | ink halved, every locked line lost, said out loud | ink ×1.9 and a bonus line rolled from one rank **above** the chest |
| road cache | 3 ink and a threat spike — the noise carries | the rare material, a second reagent, morale and momentum |
| rockslide | 16 stamina, a long slow, momentum knocked | pace bonus, morale, momentum |
| spring | the stem tears; nothing kept (the *water* is still free) | reagent, ink, morale, momentum |
| forge proof | final quality ×0.74 | ×1.13, and it is the fourth condition of a masterwork |
| arrival pattern | delivered anyway — progression is not for sale | delivered with the bench stock it was cut for |

The masterwork rule was three clauses (every rubric row clear, no heat crack, a
clean decode). It is four now: **a piece that cannot be proved is not a
masterwork**, however well it was built.

## Rules the module holds itself to

- **The object is the interface.** There is not one progress bar in the file and
  the only rectangle is the screen. The turn budget is bronze pins. The clock is
  a candle that shortens, or a sand glass, or a strip of paper being written on.
  The strain gauge is riveted to the crate.
- **Anticipation → input → impact → result**, every time. The object is on
  screen before the clock is: `step()` does not run until the brief has cleared,
  so nothing can spoil, burn down or sail past while you are still reading.
- **Ticks climb toward a strike.** Several trials can be played half by ear.
- **Difficulty from mastery, never from confusion.** The live ward carries a
  breathing halo and a caret. The candle dims the board but never past reading.
- **Education is a label, never a question.** The jars, the tablets and the
  drying roots carry real word-parts, drawn preferentially from what the engine
  says the player is currently getting *wrong* (`weakParts` → `seenParts` → any).
  A wrong pick names the part it just cost you, at the one moment you are
  guaranteed to be looking. Correct joins report to `markPartResult`.
- **Relax mode softens, it does not switch off.** Difficulty ×0.45 and the score
  compressed to `0.42 + s·0.58`, so a good run still reads better than a bad one
  and nothing can be ruined.
- **Keyboard everywhere.** Space/Enter strikes in every timing trial; digits
  select jars and roots; A/D fight the lid; Space walks the pen along the seal.

## Traps in here, for whoever is next

- **`Ender()` exists for a reason.** Any trial that ends on a condition its own
  `step()` keeps evaluating must go through it. Written the obvious way
  (`if(cond) setTimeout(finish, 500)`) the condition is still true next frame,
  so the closing chime, camera punch and particle burst fire sixty times a
  second until the timeout lands. `finish()` is idempotent, which is exactly why
  the bug is invisible in a test and deafening in a browser.
- **`setAuto`** is the headless escape hatch, not a difficulty setting. See
  HANDOFF.
- **Sizing.** Objects are sized off the short edge and pulled in far enough to
  leave room for their own readouts underneath. The first cut of the ward lock
  filled the frame and pushed its bite tally off the bottom of the screen.
- **Contrast.** The room is a *tight*, dark pool. The first cut was a wide warm
  gradient and every bronze object on it turned to brown-on-brown mush.
- **Look at it in a browser.** The mortar was a sphere with the beat rings
  cutting straight through it, the balance pan hung unattached below the beam,
  the pulse wandered off the arm entirely, and the "forced open" line was
  swallowed by a `display:none` it inherited from `.chest-hint`. jsdom saw none
  of that and never will.

## One thing deliberately left alone

The brief for this pass asked for the mini-games to be built around a Chinese
historical/fantasy world. The game was moved off that setting in the previous
pass — deliberately, and for a stated reason: it taught Greek and Latin
word-parts inside a wuxia frame, and none of the frame carried the subject. The
setting is now the Hellenistic Mediterranean the vocabulary actually comes from.

The Trials are built for the world the game currently has, because a lock that
does not match the room it is in is worse than no lock. Every mechanic the brief
asked for is here — the sweet spot, the needle, the rhythm crafting, the Simon
row, the quick match, the routing, the aiming, the tracing, the tracking, the
struggle — skinned as a steelyard, a ward lock, a mortar, a jar shelf, wax
tablets, channel pipes, a drying rack, a reed pen, a wrist and a swollen lid.
Reskinning them back is a table-swap in `ACTS` plus the paint functions; the
mechanics, grading and wiring do not care.
