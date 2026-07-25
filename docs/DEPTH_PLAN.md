# Remy Dee — Depth Plan: Crafting, Walking & Replayability

A design plan for making the bench genuinely interesting, the road worth walking
twice, and forged gear visibly *present* during play. Companion to
`NORTH_STAR.md` (the constitution) and `GAME_PLAN.md` (what has shipped).

**Status key:** 🔜 next · 🧭 later · 💭 exploratory

---

## 0. The honest diagnosis

The previous pass fixed *fairness* — real quality range, a ruined tier, stakes shown
up front. It did not fix **interest**. Punishing a boring mini-game just makes it a
boring mini-game with teeth.

### 0.1 What every craft game currently is

| Blueprint | Game | The actual verb | Decisions the player makes |
|---|---|---|---|
| Blade | `trace` | drag along a curved channel | **none** |
| Hook | `align` | slide two halves to a gap, commit | **none** (target is visible) |
| Bow | `tension` | drag to a band, hold, release | **none** (band is visible) |
| Smoke | `fold` | drag corner-to-corner, ×2 | **none** |
| Claws | `fit` | drag 3 claws into 3 sockets | **none** |
| Kit | `pack` | tap into columns, don't overfill | one (how many) |
| Rope | `weave` | scrub over 5 frays | **none** |

Three problems fall straight out of that table:

1. **They are all the same verb.** Trace, fold, weave, and fit are all "move the
   pointer accurately to a marked place." The variety is cosmetic.
2. **There are no decisions.** Every target is visible and static. The player is
   never choosing, only executing. A mini-game with one correct action and a
   precision score is a *dexterity check*, not a game.
3. **They have nothing to do with words.** The decode step asks a vocabulary
   question, then the craft is pure motor skill. This violates the North Star's
   Pillar I ("every mechanical advantage traces back to a word the player
   understood") and its rule that no system may let the player skip a cognitive
   mode. Right now roughly half of bench time teaches nothing.

### 0.2 What the road currently is

The road is in much better shape — free movement, hover-to-study, momentum, gates
with clean corridors, abilities that always do something. What it lacks:

- **A flat difficulty curve.** Hazard and pickup density is constant from
  progress 0.0 to 1.0. The last stretch feels like the first.
- **Bands that differ only in speed.** High/middle/low change pace and a couple of
  hazard tables, but not *what you find there*. There is no reason to prefer the
  river floor except safety, and no reason to risk the ledge except a small speed
  bonus.
- **No active resource for the player to spend while walking.** Movement is free
  and continuous, momentum accrues passively from correct answers. Between beats,
  the player is holding a direction.
- **No route commitment.** Nothing on the road is a fork you cannot take back.

### 0.3 What "item effects are visible" currently means

Almost entirely: **a text chip.** `computeForgePassives` builds a `chips` array
("Keen edge — clears snags · momentum never drops below ×1.6") rendered into
`#forge-strip`. Plus ability charges in the ability bar.

So the player reads a sentence about their gear once, and then the gear is
invisible for the rest of the run — a rock gets countered and a generic caption
fires, but nothing points at *the specific blade you made and the choices you made
making it*. The bench's whole output is a passive stat line.

---

## 1. Design principles for this pass

Before the specifics, the bar every proposal below must clear:

1. **A craft is a decision, not a motion.** If the player can succeed without
   choosing anything, it is not a game. Every craft must have at least one
   moment where a reasonable player could reasonably pick differently.
2. **Intuitive surface, deep floor.** The first thirty seconds should need no
   explanation (drag, tap, hold, rhythm). Mastery should look visibly different
   from competence. No tutorials, no modal instructions.
3. **Push-your-luck beats precision.** "Do I stop here or push for more?" is more
   interesting than "how accurately can you trace this line," and it produces
   stories. Precision alone produces scores.
4. **The craft decides what the item IS, not just how good it is.** Two players
   forging the same blueprint should be able to walk away with meaningfully
   different tools. This is where build variety comes from without new content.
5. **Words must be in the loop.** At least one craft decision per item should be
   answerable by vocabulary knowledge, not just hand-eye. This is a learning game.
6. **Every trait must be observable in play.** If a stat can't be seen doing
   something on the road, it should be cut or made visible.

---

## 2. The crafting overhaul

### 2.1 The shared layer: HEAT 🔜

One universal system that gives every craft push-your-luck tension without
changing its verb — and reuses the ember fiction already at the bench.

- Every craft opens with a **heat gauge**. Heat rises while you work and falls
  while you pause.
- **Hot metal is workable**: progress is faster, quality gains are larger, and
  the "sweet band" bonuses only trigger while hot.
- **Too hot ruins it**: above the red line, mistakes are permanent instead of
  correctable, and a slip can crack the piece outright.
- The band **drifts** over the course of the craft, so it can't be memorized —
  you re-read it each time.

This is one mechanic, learned once, that makes all seven crafts tense. It also
makes *pausing* a real move: stepping back to let the metal cool is a legitimate,
visible strategy, which gives thoughtful players something to do besides be fast.

**Why this first:** it's the highest interest-per-line-of-code change available,
it doesn't require rewriting any existing craft, and it gives the later per-craft
redesigns a common language.

### 2.2 The per-craft redesigns 🔜

Each keeps its recognizable fiction and gains one real decision.

#### Blade — *The Folding Edge* (push your luck)
Replace one trace with **repeated folds**. Each pass over the edge adds sharpness,
but the channel narrows every time — pass 1 is generous, pass 5 is a razor line.
You choose when to stop and quench.

- **Decision:** greed vs. safety, made 4-6 times per craft.
- **Grounded:** this is literally how folded steel is made; needs no explanation.
- **Output varies:** fold count becomes the blade's *sharpness*, which on the road
  is how many hazards a single Strike clears (see §4).

#### Hook — *The Balance Point* (hidden optimum, deduction)
The join has a **hidden** center of gravity. Sliding it gives hot/cold feedback via
a wobble meter — no visible target. Probe to narrow it down, then commit.

- **Decision:** commit on a decent read, or spend more heat probing for perfect?
- **Skill:** reading feedback and binary-searching, not steadiness.
- **Output varies:** balance = throw distance = a visibly longer rope arc on the
  road, and whether the high ledge is reachable from further back.

#### Bow — *The Three Draws* (spend a limited budget)
Draw and release **three times**. Each draw sets one property — *power*,
*accuracy*, *speed* — and the target band moves between draws. Your three results
become the bow's actual trait spread.

- **Decision:** you cannot max all three. Where do you spend your steadiest hand?
- **This is the single biggest build-variety lever in the plan:** same blueprint,
  genuinely different weapons, chosen deliberately.

#### Smoke — *The Pleat Pattern* (memory + duration trade)
A fold sequence flashes briefly, then hides. Reproduce it. More pleats = denser,
longer-lasting smoke, but a heavier carry (speed penalty).

- **Decision:** how many pleats to attempt — longer sequences pay more and risk more.
- **Cognitive fit:** an actual memory challenge in a game about retention.

#### Claws — *The Bite Angle* (consistency under choice)
Each claw is **rotated** as well as seated. Steep angle = grip (reach/protect),
shallow = speed. The three claws must *match each other* — a mismatched set is
unstable and degrades the item.

- **Decision:** which angle to commit to, then the skill of repeating it thrice.

#### Kit — *The Packed Case* (spatial puzzle with loadout consequences)
Real shaped supplies (bandage 2×1, salve 1×1, splint 3×1, tonic 2×2) into a fixed
case. **What you fit determines what the kit does** — 3 bandages + 1 salve is many
small heals; 1 bandage + 2 tonics is fewer, stronger ones.

- **Decision:** a genuine packing puzzle whose solution *is* the loadout.
- **Most visible on the road:** you watch the specific supplies you packed get used
  and run out.

#### Rope — *The Braid Rhythm* (timing)
Braiding is inherently rhythmic: alternate strands on the beat. Off-beat strokes
create **weak spots at known positions in the rope**. You pick the tempo — faster
braid finishes sooner and is worth more, but is harder to hold.

- **Decision:** tempo.
- **Consequence is concrete:** a weak spot can actually part during a descent on
  the road, at the position you fumbled.

#### Seal (finale) — *The Counter-Stamp* (vocabulary, directly)
Assemble the seal die out of **word-parts** so it presses a complete term. Thematically
exact for a tool built to hold words together against Radicida, and it puts
vocabulary squarely in a craft.

### 2.3 Words in the craft loop 🔜

Beyond the Seal, one lightweight mechanic that touches every craft:

**Maker's marks.** Before the final commit, choose a word-part to stamp into the
piece. Choosing a part whose *meaning matches what the item does* (e.g. `-tomy`,
"cutting," on a blade; `brady-`, "slow," on a heavy item) grants a real bonus.
Choosing a mismatched part gives nothing.

- Intuitive: it's a flavor choice that turns out to matter.
- It is a **recognition check disguised as decoration** — exactly the North Star's
  "knowledge check wearing an action costume."
- It reuses the existing PARTS data with no new content.

---

## 3. The walking overhaul

### 3.1 Give the three bands real identity 🔜

Right now they differ in speed. They should differ in **what is there**:

| Band | Character | Content |
|---|---|---|
| **Upper ledge** | risk | rare word-parts, reagents, lexicon shards — and the worst hazards. Needs climbing gear. |
| **Middle trail** | tempo | the most rune gates and the steadiest pickup flow. The "play the game" lane. |
| **River floor** | safety | few hazards, slow, but ink and recovery. The "catch your breath" lane. |

This turns a speed preference into a **strategy**: dive low to recover when
stamina is failing, climb high when you need a specific reagent, hold the middle
when you're chaining terms. The bands become a resource the player manages.

### 3.2 An active verb while walking: PACE 🔜

The player currently holds a direction and waits. Give them one spendable thing:

- **Press to surge** — burn stamina for a burst of speed and a wider collection
  radius.
- Surging through a pickup cluster is genuinely good; surging into a hazard you
  couldn't brake for is genuinely bad.
- Creates moment-to-moment decisions in the gaps between gates, which is exactly
  where the road is currently quiet.

### 3.3 A difficulty curve 🔜

Scale hazard density, hazard speed, and gate difficulty with `progress` so the
road's last third is visibly harder than its first. Pair with a **rising musical
intensity** so the pressure is felt, not just measured.

### 3.4 Chain risk 🧭

Make the term-chaining gamble explicit: a 2-part term pays modestly and banks
immediately; pushing for a 3rd or 4th part multiplies the payout but a hazard hit
breaks the whole chain. Show the current chain's *pending value* so the player
feels what they stand to lose. This makes the existing best system tense.

### 3.5 Forks 🧭

Occasional hard branches (a collapsed bridge, a flooded ford) that split the road
into two committed routes with different content and a stated trade. Route choice
was removed when the fork became a rune gate; it should come back as a *terrain*
decision rather than a knowledge one, so the two systems don't compete.

---

## 4. Making item effects visible

The single biggest perceived-value gap. Five changes, cheapest first:

### 4.1 Trigger flashes 🔜
When a forged item does something, **the item says so**. The relevant chip in the
forge strip flashes and pulses at the moment of use, and a short line names the
specific item — "*Ridge-back blade* cuts the deadfall" — not a generic caption.
Cheap, and it converts an invisible passive into a visible event.

### 4.2 Live per-item tallies 🔜
Each chip accumulates a running count: "Ridge-back blade — **4 snags cut**."
By arrival, the player can see which of their tools actually earned its ember.

### 4.3 Gear on the walkers 🔜
The assigned item is drawn on its carrier's silhouette and **animates on use** —
the hook line actually throws, the smoke shell actually blooms from the traveler
carrying it. The engine already tracks `assignedTo` and draws gear glyphs; this
extends it to the moment of use.

### 4.4 Quality you can see 🔜
- **Fine** work glints, and its effects land with a heavier flourish.
- **Flawed** work visibly sputters — a failed hook throw that has to be re-cast, a
  smoke shell that thins early — so "flawed" is something the player *watches*
  rather than reads in a tooltip.

This is what finally makes the ruined/flawed/ok/fine ladder from `GAME_PLAN.md` §3
feel earned rather than administrative.

### 4.5 The gear debrief 🔜
On the result screen, an itemized "what your bench did" list: each forged item,
what it prevented or enabled, how many times, and whether it was worth its embers.
Closes the loop from craft decision → road consequence → next bench decision.

---

## 5. Replayability

Ordered by value-per-effort. The first two reuse systems that already exist.

### 5.1 Seeded Contracts 🔜 *(highest value, lowest cost)*
`buildRoadPlan` already generates a whole road procedurally. Feed it a **seed**
and the same seed produces the same road for everyone — weather, hazard deck,
event order, gate parts. Shareable codes, directly comparable scores, and a
natural daily. Very little new machinery.

### 5.2 The Endless Road 🔜
One road, no destination, escalating density and gate difficulty; ends when
stamina breaks. The pure-fluency mode and the natural home for a leaderboard.
Also the best possible testbed for §3.3's difficulty curve.

### 5.3 Lexicon Trials 🧭
Short focused runs against a single body system or word-part kind. The question
engine already tracks per-part mastery, so trials can be **generated from the
player's own weak spots** — the most educationally valuable mode in the plan, and
mostly assembly of existing parts.

### 5.4 New Game+ — *The Second Reading* 🧭
Carry bench mastery, techniques, and affinity into a fresh campaign. In exchange:
gates prompt meaning→form only, distractors are drawn from parts you previously
got wrong, and the party ladder starts a step higher.

### 5.5 Structural variety within a run 🧭
- **Weather as a verb:** fog hides gate labels until close; storm shortens the
  hazard read window; snow slows movement *and* hazards.
- **Road archetypes per terrain:** mountain roads favor vertical movement, river
  roads add drifting current, ruins add branching.
- **Bench events:** a traveling merchant offering a reagent for ink; a rush
  commission with doubled reward and halved embers.

### 5.6 Long-tail hooks 💭
- **Traveler bonds** — build a traveler's term well three times and they join
  permanently as a companion with a passive.
- **Ghost caravans** — a previous run (or a friend's seed) walks beside you.
- **Player-authored terms** — assemble a valid term the game hasn't seen and
  submit it to the Lexicon.

---

## 6. Suggested order of work

Sequenced so each pass ships something playable and de-risks the next.

| Pass | Contents | Why here |
|---|---|---|
| **A** | Item visibility (§4.1–4.3) | Cheapest, and it makes *everything already built* feel better immediately. Do this first regardless. |
| **B** | Heat system (§2.1) | One mechanic, all seven crafts get tense. Highest interest-per-effort at the bench. |
| **C** | Band identity + Pace + difficulty curve (§3.1–3.3) | Makes the road a strategy rather than a corridor. |
| **D** | Bow "Three Draws" + Kit "Packed Case" (§2.2) | The two with the biggest build-variety payoff; proves the redesign approach before committing to all seven. |
| **E** | Remaining craft redesigns + Maker's marks (§2.2–2.3) | Now with the pattern established. |
| **F** | Seeded Contracts + Endless Road (§5.1–5.2) | Replayability, once the core loop is worth replaying. |
| **G** | Quality visibility + gear debrief (§4.4–4.5) | Lands best after the crafts actually produce varied items. |
| **H** | Lexicon Trials, NG+, structural variety (§5.3–5.5) | Long tail. |

**Deliberate ordering note:** replayability is *last* among the major systems, not
first. There is no point making people replay a loop before the loop is worth
replaying — passes A–E are what make F worth doing.

---

## 7. Risks

| Risk | Handling |
|---|---|
| Craft games become fiddly or slow | Hard cap: every craft must finish in under ~25 seconds of active play. If a design can't, it's cut. |
| Heat makes crafting stressful for learners | Relax mode already softens the craft curve; it should also widen the heat band and disable heat-ruin entirely. |
| Push-your-luck frustrates rather than delights | Always show what you'd bank by stopping *now* — greed must be informed, never blind. |
| Redesigning all 7 crafts is a large surface | Pass D deliberately does two first as a proving ground before committing to the rest. |
| Band identity punishes players without climbing gear | The high band must be a bonus route, never required; middle must always be a complete, viable way to play. |
| Trait axes (7) exceed what players can track | Any axis that can't be made visible per §4 should be merged or cut. Visibility is the test of whether a stat deserves to exist. |
