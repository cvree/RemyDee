# The feel pass — the road was doing the work and never saying so

This pass changed nothing about what the road *does*. It changed what the road
*says* about what it is already doing, which turned out to be almost nothing.

The audit that started it was one question asked of every system on the walk:
**when the player does this well, how do they find out?** Seven answers came
back as "they don't."

---

## 1. The chain sings

**What was wrong.** Gathering the second piece of a word played `sfx.clink()` —
a triangle wave at 1400Hz with ±2% variation. So did the third. So did the
first. A four-piece chain was acoustically identical to a one-piece chain, and
completing a real medical term played `sfx.great()`, the same cue the bench
plays when you pick a material.

**What it is now.** `sfx.chain(step)` climbs one rung of a **major pentatonic**
per piece — the scale with no wrong note in it, so any partial chain is
consonant and none of them sounds like a mistake. Ten rungs, so a chain never
repeats a pitch inside itself. A fifth below arrives 22ms late and thickens with
the chain, so a long word has *weight* and not merely *pitch*.

`sfx.chainResolve(step, real)` lands the phrase, starting from the rung the
chain actually reached. A real term opens the **octave** over the top; nothing
else in the game plays that interval. That is the whole contract of the mode in
one second of audio:

| what happened | what it sounds like |
|---|---|
| a piece joins | the phrase climbs and stays open |
| the chain breaks | the ladder falls off its rung (`chainBreak`) |
| a coined chain closes | the phrase resolves, flat |
| **a real term closes** | the phrase resolves **and opens the octave** |

**And the bench plays it too.** The builder is the other place in the game where
a word is assembled a piece at a time, and it played one flat `snap()` per tile
however many were down. It plays the same ladder now, and `onBuildSuccess`
resolves it under the wax stamp. A player arriving on the road for the first
time already knows what a rising phrase means.

---

## 2. The gears

Momentum runs ×1 → ×5. It multiplies ink, drives the pace, decides part of the
grade, and sets the recovery floor. It changed gear in **total silence** — a bar
filled and a word in small caps changed underneath it.

Four named tiers now, in `MOMENTUM_TIERS`:

| at | name |
|---|---|
| ×2 | ROLLING |
| ×3 | FLYING |
| ×4 | UNSTOPPABLE |
| ×5 | PERFECT |

Each is crossed **at most once per run** (`M.tierHit`). Falling back below one
and climbing through it again is not a second arrival — a run spent oscillating
around ×2 would otherwise spend the whole walk shouting, and the words would
stop meaning anything. The meter also holds a band colour (`.t3/.t4/.t5`) for as
long as the gear is held, because a celebration that vanishes teaches nothing
about where you currently are.

---

## 3. The marks

Five lifetime bests that did not exist. A player could walk the best road of
their life and the game would never say so.

```
S().marks = { chain, momentum, realTerms, streak, distance, graze }
```

Every one is a thing the player did with their **hands or their vocabulary**,
never a thing they were given. `realTerms` — how many real words came out of one
road — is the purest measure the game has of the skill it is teaching, and the
only mark you cannot reach by steering well.

**Three rules, in `E.beatMark`:**

1. **A mark of zero has never been set, so beating it is silent.** The first
   road puts the bar down; every road after can clear it. Without this a new
   player is told they broke five records in their first ninety seconds, which
   teaches them the word "record" means nothing here.
2. **A mark announces at most once per run.** Momentum climbs *through* its old
   best and keeps climbing. The shout belongs to the crossing.
3. **The stored value keeps rising silently after the shout**, so the bar the
   next run has to clear is the real one.

`beatMark` returns the *previous* best when the call broke it and should be
announced, and `null` every other time — which is exactly the condition every
caller wants to branch on.

**They are banked as they happen, not on arrival.** A run that goes down at 40%
having built the longest chain of your life keeps that chain. That is the reason
to walk again after falling over, and the collapse card says so.

---

## 4. The crest

The road had two registers: the caption strip along the bottom (a murmur — a
reagent found, a passive credited) and floating pops over the squad (counting
pennies). Neither is any use for the two things worth interrupting the eye for.

`.road-crest` sits in clear sky over the squad, arrives with weight, and is gone
inside 1.75s. It never covers the lanes.

**It queues, and the queue holds two.** A genuinely good moment fires three of
these at once — a long chain completes a real word, which crosses a gear, which
breaks a record, which takes the streak to six. Played end to end that is seven
seconds of banner over a road that is still moving: the best thing that can
happen to a player becomes the thing that makes them crash. Late arrivals are
**dropped rather than delayed**, because a crest that lands five seconds after
its cause is worse than no crest — the player has to work out what it refers to.

Flow was moved onto it. Flow is the largest thing that happens on a road (the
value of everything changes, the floor rises, the road stops being careful) and
it announced itself with a pop the same size as `+3 ink`.

---

## 5. The piece in flight

Nothing connected the part you reached for to the word it went into — which is
the one causal link the entire mode is built on. The pop printed the part's name
where the part had been standing, and somewhere else entirely, up in the HUD, a
tile silently appeared.

`flyToWord()` arcs the piece from the pickup to the builder, measured in canvas
coordinates from the live `#combo-build` rect, and `.combo-build.took` flinches
when it lands. The anchor **falls back to the top of the walkable band** rather
than returning null: a rect can legitimately measure zero for a frame (during a
resize, before first layout), and dropping the flight in those frames would make
the one cue that explains the mode the only cue that intermittently vanishes.

Off entirely under reduced motion — the tile appearing is still correct, merely
quieter.

---

## 6. The near miss

A hazard threaded by a hand's breadth paid `statGain({morale:1})` and said
nothing. It was the only skilful act on the road with no feedback at all: the
road rewarded *surviving* and was silent about doing it *well*.

Measured on a live Chapter Three road, a band of **2.1 hit-radii** called six
hazards in forty-seven seconds a thread — most of them. A reward that fires for
ordinary play is not a reward, it is wallpaper. The band is **1.8 × HIT_R**,
about a quarter of a lane's spacing: the width of "past their shoulder" rather
than "in the next lane". It pays a sliver of momentum (never enough to
substitute for knowing a word — Pillar I) and feeds the `graze` mark.

---

## 7. Hitstop

The frame could be shaken and washed with colour. Nothing could **stop** it.
Stopping is the oldest impact cue there is, and without it a shake is a wobble.

Implemented on the road's own clock rather than by pausing: the simulation gets
`dt = 0` and `draw()` still runs, which is the difference between a freeze and a
dropped frame. Capped at **110ms**, refuses to stack (a running stop can only be
extended to the longest single request), and off under reduced motion or low
quality.

Fired on: a real term closing (scaled by length), a hazard taken square, a gear
crossed, entering Flow, and a mark broken.

---

## 8. The reach, drawn

Three things widen the collect radius — Surge by 55px, a lunge by up to 120,
Vanish by 90 — and **none of them showed**. So the strongest reason to hold
Surge (sweeping a cluster you could not otherwise take) was discoverable only by
accident, and a lunge that just missed looked identical to one that landed.

`M.reachNow` is published each tick and drawn as a dashed ellipse around the
squad, under the pickups so it never obscures a decision, and only while the
reach is actually wider than a walk. Pickups inside the live radius get a ring
of their own, which turns a road full of drifting labels into a road with a set
of things you can *currently have*.

**Two-pass stroke.** Gold on tan is the lowest-contrast pair in the palette and
the canvas is authored at 720px and displayed at about 510, so a single 2.5px
gold stroke arrives as a 1.8px suggestion — the first version sampled eight
points of luminance over the background, which is a thing that is technically on
the screen and effectively is not. A dark stroke underneath gives the bright one
an edge to sit on.

---

## Two defects that fell out of it

**The term banner covered the clock.** At `top:6px` it sat over `.mission-top`
for three and a half seconds — so **stamina**, the run's actual clock, was hidden
at precisely the moment the term that raised the banner had just healed the
squad. It takes the word-hud's place instead, which is what the existing
`.hushed` rule was already written for.

**The Endless Road congratulated you with the failure cue.** It always ends by
falling over, so `sfx.bad()` was the only sound it ever made — including on the
run that beat everything the player had ever done.

---

## Where it is proved

`test37.js` — 54 assertions. The load-bearing part is the three mark rules and
the save migration:

- a v8 save with **no** `marks` block gets one rather than throwing
- the `momentum` mark is **seeded from `lifetime.bestMomentum`**, which predates
  it, so a returning player's best road is still the bar to beat
- a **corrupted** marks block is repaired key by key, never trusted
- a NaN or a negative is refused rather than stored
- the road genuinely does not advance during a hitstop
- reduced motion never stops the road
- two crests on one frame queue rather than draw over each other

`test16` was tightened rather than relaxed: a real term's letters are stamped in
one span each, so the word is no longer a contiguous run of `innerHTML` —
`textContent` is the stronger check anyway, since it is exactly what the
`aria-live` region announces.
