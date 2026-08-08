# The Bench Pass — one task per weapon, and only at the bench

## The complaint

> "The new games are totally fun. But building a weapon should be the same task
> every time for that item. Remove the old outdated tasks — filling the suitcase
> where you click sucks. Only use the new games. And the games should not pop up
> during the walk. The games are only for crafting the weapon."

and then, after the first cut of this pass:

> "Mortar game bugged, infinite loop. I like the memory game being for the field
> kit. NO DOUBLE GAMES PER ACTIVITY — why am I doing the memory game then doing
> the mortar activity. One activity per item. Think fluidity and utter fun."

Faults that share a root: the trials library and the bench were built at
different times and never reconciled, so the game shipped two parallel sets of
hand-skill interactions with no rule about which belonged where — and then, in
fixing that, kept one interaction too many per piece.

## 1. The old crafts are gone

The bench carried seven hand-written canvas mini-games of its own — `trace`,
`align`, `tension`, `fold`, `fit`, `pack`, `weave` — roughly 1,400 lines,
predating `__RD_MG` entirely. They came with their own heat layer, their own
breakable scrap apron, their own three-row rubric, their own pointer binding and
their own render-loop generation counter.

They were the weakest interactions in the game. The named offender, `pack`, was
a field-kit case that swung on a strap while you tapped remedies into pockets:
not a skill, a tolerance test. And because they were separate code they had
drifted — the on-screen instructions for two of them described interactions that
had been rewritten out from under them.

All of it is deleted: the seven crafts, `craftHeat`, the apron, the rubric, and
the eleven debug hooks that existed only to test them.

## 2. One fixed trial per pattern, forever — and exactly one

`BENCH_TRIAL` is a single table in the forge module. Each pattern names the one
trial it is worked with, and nothing rolls dice.

| pattern | worked by |
|---|---|
| Short blade | `trace` — one stroke down the grinding channel |
| Grappling hook | `sweetspot`/balance — weigh the head on the steelyard |
| Recurve bow | `track` — hold the limb to its curve while it takes the tiller |
| Smoke shell | `sequence` — the fold order, watched once, laid from memory |
| Climbing claws | `needle` — drive each claw as the pointer crosses its seat |
| Field kit | `match` — pair each remedy with what it treats before it is packed |
| Reinforced rope | `rhythm`/pestle — braid on the beat, hold through the lay |
| Lexicon seal | `trace` — cut the die |

That is the whole point of the change. **A task you meet once is a puzzle; a task
you meet every time you build a bow is a craft you can get good at.** The variable
is your hand, not the dice. The build screen says so out loud — *"Every recurve
bow is worked the same way. What changes is your hand."* — and the spec sheet's
"one thing away" line is now genuinely actionable, because the next blade is
ground on the same channel as this one.

### The proof was one game too many

The first cut of this pass gave every pattern *two* trials — one to shape the
piece, one to prove it — and it read as exactly what it was: a second game bolted
onto the end of the first. You packed the field kit by pairing remedies, which is
a good minute, and were then handed a mortar and told to grind a draught out of
it before you were allowed to see what you had made. Two unrelated skills, back
to back, between a player and one object.

Step 4 is the proving **animation** again. That is the right shape for it: the
last beat of making a thing is watching the thing you made be a thing, not being
examined a second time. Nothing between the build and the verdict moves the
grade, which is precisely what makes the trial at step 3 matter.

## 3. The walk is not interrupted

`MG.run(activity)` and its `ACTS` pools are deleted along with every caller
outside the bench:

- **The spring** granted a reagent behind a stem-cutting trial. It grants it
  outright now, and a forged edge takes the root at the node for ink on top.
- **The road cache** was a trial. It is opened with what you brought: bare hands
  force it and the noise carries; an edge prises it; a fine or masterwork edge
  opens it without a sound.
- **The rockslide** was a trial. Gear moves the rock; bare shoulders pay for it
  in legs and daylight.
- **The chest** was a lock-picking trial. That charged the player twice — they
  had already walked the road that earned the chest — and turned the reward
  ceremony into an exam. It opens. What the road's quality decides is whether the
  pattern inside arrives with a length of the stock it was cut for.

## What the piece still remembers

`craftSpec` reads `craftMeta` to make two pieces of the same pattern behave
differently on the road, and every one of the seven crafts used to write it
directly. `buildMeta` replaces all of them, and derives the record from the two
decisions that actually survived the redesign — and they are the better two:

- **the stock chosen at step 2** sets the piece's character (a hook of light
  river-steel is balanced for reach, one of forged iron for stability);
- **the build trial's grade** sets the degree of it (a steady hand works the edge
  five times; a rough one manages two).

Nothing is invented that the player did not choose or earn, and `craftSpec` did
not have to change.

## The masterwork gate

Four conditions became two, the rubric and the heat crack having gone with the old
bench and the proof clause with the second trial:

1. the build trial at or above the bar (88%, or 80% in relax mode),
2. a clean decode — you understood the word the commission asked for.

Plus the final quality itself at 0.88. Clause 2 is the one that keeps this a
vocabulary game: you cannot hammer your way to a perfect tool without knowing the
term it was ordered against.

## The mortar hung, and why that was a whole class of bug

The rhythm archetype builds a bar of music with three kinds of beat: strikes,
held pours, and **rests you are supposed to not play**. A rest played correctly
is a rest you never touch, so nothing in the input path ever reaches it — and the
sweep that catches notes sailing past scored those (`n.q = 1`) without resolving
them (`n.judged` stayed false). The bar ends on `notes.every(n => n.judged)`.

So any bar containing a rest could never end. At the difficulties the bench asks
for, that is most of them: 38 of 40 seeds. The rope hung, and so did anything
else worked on the mortar. Fixed where it lives — every note now resolves, and a
struck rest is tracked on its own `struck` flag so the misfire count still means
what it says.

**The class of bug is the real finding.** Six of the ten archetypes advance only
on player input, so any of them can be left open by a hand that stops arriving,
and a future edit can reintroduce the same stall wearing a different object. So
`play()` now carries a deadman: a trial that runs past a ceiling — four times the
longest bar any archetype can generate — resolves ROUGH rather than hanging. A
player who walked away has not earned a good piece, but the library must never
take the tab down with it, and must never refuse the caller an answer.

## One new guard

A trial is a promise, and a promise outlives the screen that opened it. `buildGen`
is bumped whenever a build starts and whenever one is graded, and a trial that
resolves against a stale generation is dropped — otherwise an abandoned trial's
grade lands on whatever piece happens to be on the bench when it comes back. Same
guard on the proof. `test18` §4 holds it.

## Tests

- `test12` was the seven bench crafts driven through simulated pointer input. It
  is now **the bench trials**: every pattern declares two, they never vary, the
  old crafts are unreachable, and the piece still remembers how it was made.
- `test18` loses its rubric, masterwork-by-rubric and scrap-apron sections and
  keeps the spec sections; the masterwork gate is retested against the three
  conditions above.
- `test33` loses the activity pools, the chest trial and the road trials, and
  gains the two assertions that matter most: **no trial ever opens on the road**,
  and **every trial ends**. The mortar is driven forward in time across forty
  seeds with no input at all and must resolve every time (with the fix reverted,
  31 of 40 hang); then all ten archetypes are played by nobody against a lowered
  ceiling and must each still hand back a real grade.
- `test12` gains the rule as a rule: a pattern that grew a second nested trial
  back fails the suite.

27 suites, 1,066 assertions, zero window errors. Checked in Chromium: the rope's
mortar opens, plays, and ends 5.5s after the last tap at the player's real 90s
ceiling — the bar ending itself, not the deadman catching it — and the field kit
goes memory board → verdict with no second game in between.
