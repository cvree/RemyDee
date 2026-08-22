# The Vamp Pass — the walk, cleared and amplified

The road had every system it needs and it was saying all of them at once, in the
wrong tone of voice. This pass is about **feedback**: what the screen does when
something good happens, what it does when something bad happens, how much of it
is on screen at any moment, and whether the walk's biggest moments feel like the
biggest moments.

Measured against `NORTH_STAR.md`: Pillar III (*effort must be legible in the
outcome*), Design Rule 3 (*the player's hand is free*) and Design Rule 4
(*curiosity pays, inside the verb the player is already using*).

---

## 1. Shake is damage — and it was congratulating the player with it

**Before.** The game owned exactly one piece of loud physical feedback,
`FX.shake`, and everything called it. Entering flow shook the frame. Crossing a
momentum gear shook the frame. Completing a real medical term — the single event
the entire game exists to produce — shook the frame. Breaking a *lifetime
personal best* shook the frame **and washed it in cinnabar**, the colour used
everywhere else in the game for a wound.

A player reads the body before they read the caption. Being punched to say
"well done" does not read as praise; it reads as a bug.

**Now.** The camera has two verbs and they compose in one loop rather than
fighting over `transform`:

| Verb | Shape | Used by |
|---|---|---|
| `FX.shake(mag,ms)` | jitter + a touch of rotation, decaying hard | hazard hits, a wrong rune gate, a poor arrival |
| `FX.swell(strength,ms)` | a fast **push-in** — the picture leans toward you and settles | flow, gears, records, real terms, a right gate, an item landing, a new word read, arrival |

`FX.impact` (a flat, edge-to-edge wash) keeps damage. Rewards get `FX.bloom` —
a **radial** gradient centred on the squad, so the light comes *out of the thing
that earned it* instead of being slapped across the frame.

With every celebration moved off it, shake could get harder without the road
feeling permanently rattly: a hazard now hits at 13 where it used to hit at 9,
and it is the hardest thing the frame does.

## 2. The cursor is for steering

**Before.** Holding the pointer over a drifting word-part for 0.35s "studied"
it, and studying paid the best rewards on the road: a bigger restore, a momentum
bump, a burst of pace and the Lexicon Affinity track. A definition card followed
the cursor around the middle of the playfield, and every tile the pointer brushed
drew a fill ring.

Two problems. The obvious one is clutter, over the exact band where hazards and
gates have to be read. The deeper one: **the mouse is the steering wheel.** The
road asked the player to stop driving in order to learn, and then priced learning
as the best thing they could do — so the two most valuable verbs in the mode were
fighting for the same hand.

**Now.** There is no hover, no card, and no fill ring. **Gathering a part you
have never met reads it** (`readPart`):

- its meaning is stamped over the squad, in full;
- it pays *more* than hovering ever did — 11 to the matching reserve, a 0.26
  momentum bump, and a pace burst;
- it goes into the Lexicon permanently, and rides on the tile every later meeting;
- a gold ring pulses off the squad so the moment lands;
- a part you already know pays the plain gather and says nothing at all.

Touch and mouse now get the identical mechanic, which closes a known risk in
`GAME_PLAN.md` §11. The final boss's Blank Page phase asks its seal question at
the moment of gathering instead (`sealedFor`), so Lexicon Affinity scaffolding
still spends exactly once per charge.

## 3. A wrong rune gate is a wall

**Before.** A wrong gate cost 45% of momentum, seven morale and five stamina —
on a road where a single chained word pays all of that back inside ten seconds.
The thinking beat, the one place the game asks the player to actually *know*
something, was the cheapest thing on the road to get wrong. A player who read
every arch and a player who steered at random arrived looking the same, which is
precisely the failure Pillar III names.

**Now** the arch does not open — they walk into it:

| | Before | Now |
|---|---|---|
| Momentum | ×0.55 | **×0.22** (craters to the floor) |
| Stamina | −5 | **−13** |
| Morale/power | −7 | **−18** |
| The chain in hand | untouched | **scattered** — the half-built word is lost |
| Pace | brake | **barred for 2.4s** — a crawl, plus a stagger back down the road |
| Frame | shake 9 | shake 20, cinnabar wash, 150ms hold, a `slam()` of stone |
| The road | colour change on an arch | a red slab drops across the arch; `BARRED` over the band |

The caption names what it cost in one sentence, including the size of the word
that scattered, because "I know why I lost" is a stated success signal. A
*right* gate got the matching upgrade: the arch blows open in a ring of light,
a rising fifth (`open2()`), a 1.8–2.4 swell and a hold.

The smoke-shell reprieve, the re-ask loop and the debt scheduler are all
untouched — the punishment lands on the mistake, never on the learning.

## 4. The thing you made, landing

**Before.** Spending a forged charge produced a caption, a small floating word
and a haptic buzz — the same feedback weight as walking through an ink drop. The
piece the player chose the pattern for, took the folding risk on, and can name
the tier of, did its work invisibly.

**Now** an item is the loudest verb the player owns and is treated like one
(`itemMoment`):

- a **shockwave** off the squad, reaching as far as the piece is good;
- a **hold** of up to 260ms — the only beat allowed past the normal hitstop cap,
  because the player spent something they built to make it happen;
- a **swell and bloom** in the item's own colour (gold for Strike, cold blue for
  Vanish, green for Mend);
- the piece **naming itself** on the road — `Ashfold Cleaver · masterwork · 3 cut
  from the road`;
- the ability button kicks, and its charge counter flashes as it decrements.

Every one of those is scaled by quality tier (`ITEM_HEFT`, 0.65 → 1.45), so a
masterwork visibly *is* a masterwork. Better gear does not merely do more; it
looks like it does more, which is the argument the bench has been making all
along without any way to show it.

Pressing a spent charge now says why nothing happened instead of playing a
buzzer into silence, and the charge readout stopped dropping its `×` the first
time it was used.

## 5. Less on the screen

| Thing | Before | Now |
|---|---|---|
| Study card | followed the cursor over the playfield | gone |
| Reach rings | one on **every** part in range — five at once through a cluster | one, on the next part the squad will actually reach |
| A real term | banner **and** caption **and** pop **and** a queued crest — four surfaces, one event | banner (word, parts, meaning) + pop (numbers). The caption is left for what the banner cannot say |
| A right gate | caption repeating the banner | one line: what the part means |
| Chain stake | `bank ≈ 14 ink · ×2.6 — a hit now loses it` | `≈ 14 ink at stake` |
| Empty-chain hint | `gather a root, then a suffix, to forge a term` | `root, then suffix` |
| Control hint | six sentences held over the sky for 8.5s | one line, per input |
| Locked-ledge label | printed over the road on every frame of the first six chapters | appears only when the squad is actually pressed against the ceiling |
| Pops | flat text, stacking into a smear at the same height | ink-outlined, punch-in overshoot, stepped clear of each other, six maximum |

Nothing was removed that carried information the player did not have elsewhere.

---

## Tests

`test39.js` covers all five: the camera's two verbs (and that reduced motion
still moves nothing), reading-by-gathering and its distinct-part rule, the item
moment and its tier scaling, the full wrong-gate cost, and the decluttered
readouts. `test7.js` grew a step that dismisses the walk school before it times
an arrival — the tutorial pauses the road, and the test was racing it.
