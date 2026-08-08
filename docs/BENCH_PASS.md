# The Bench Pass — one task per weapon, and only at the bench

## The complaint

> "The new games are totally fun. But building a weapon should be the same task
> every time for that item. Remove the old outdated tasks — filling the suitcase
> where you click sucks. Only use the new games. And the games should not pop up
> during the walk. The games are only for crafting the weapon."

Three separate faults, and they share a root: the trials library and the bench
were built at different times and never reconciled, so the game shipped two
parallel sets of hand-skill interactions with no rule about which belonged where.

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

## 2. One fixed trial per pattern, forever

`BENCH_TRIAL` is a single table in the forge module. Each pattern names the trial
it is **worked** with and the trial it is **proved** with, and nothing rolls dice.

| pattern | worked by | proved by |
|---|---|---|
| Short blade | `trace` — one stroke down the grinding channel | `sweetspot`/whet — strike the stone where the edge runs true |
| Grappling hook | `sweetspot`/balance — weigh the head on the steelyard | `struggle` — hang your weight on it |
| Recurve bow | `track` — hold the limb to its curve while it takes the tiller | `aim` — put it on the mark |
| Smoke shell | `sequence` — the fold order, watched once, laid from memory | `flow` — let it draw |
| Climbing claws | `needle` — drive each claw as the pointer crosses its seat | `struggle` — hang off them |
| Field kit | `match` — pair each remedy with what it treats before it is packed | `rhythm`/pestle — draw a draught from it |
| Reinforced rope | `rhythm`/pestle — braid on the beat, hold through the lay | `track` — follow the strain |
| Lexicon seal | `trace` — cut the die | `sweetspot`/kettle — press it at heat |

That is the whole point of the change. **A task you meet once is a puzzle; a task
you meet every time you build a bow is a craft you can get good at.** The variable
is your hand, not the dice. The build screen says so out loud — *"Every recurve
bow is worked the same way. What changes is your hand."* — and the spec sheet's
"one thing away" line is now genuinely actionable, because the next blade is
ground on the same channel as this one.

Seven of the ten archetypes carry a build; eight of ten are reached across builds
and proofs together.

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

Four conditions became three, because the rubric and the heat crack went with the
old bench:

1. the build trial at or above the bar (88%, or 80% in relax mode),
2. a piece that survives its own proof (tier 3+),
3. a clean decode — you understood the word the commission asked for.

Plus the final quality itself at 0.88. Clause 3 is the one that keeps this a
vocabulary game: you cannot hammer your way to a perfect tool without knowing the
term it was ordered against.

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
  gains the assertion that matters most: **no trial ever opens on the road.**

27 suites, 1,070 assertions, zero window errors.
