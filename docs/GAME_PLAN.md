# Remy Dee — Progression, Crafting & Road Overhaul: The Plan

This is the working plan for the changes requested, plus the roadmap for what comes
after. Companion document: `NORTH_STAR.md` (the design constitution).

**Status key:** ✅ shipped in this pass · 🔜 next pass · 🧭 roadmap

---

## 0. The diagnosis

Six problems, one root cause. The game currently **hands the player everything at
once and then never raises the stakes.** All seven blueprints are open on turn one;
every craft lands somewhere between "flawed" and "fine" no matter how hard you try;
the party jumps from 1 traveler to 6; and the road locks you to three rails where
half the buttons do nothing most of the time.

The fix is the same fix everywhere: **hold things back, then give them away one at a
time, and make the difference between careful and careless visible.**

| Symptom | Root cause | Fix |
|---|---|---|
| "The board is overwhelming" | 7 blueprints unlocked at chapter 0 | Blueprint unlock ladder — 1 new pattern per chapter (§2) |
| "Crafting feels like slop" | Quality floors at 0.3; every outcome ≥ flawed | Real 0–1 quality range + a **ruined** tier (§3) |
| "Trying doesn't matter" | Fine vs flawed barely differs on the road | Fine gear gets real teeth; flawed gear gets real drag (§3) |
| "Strike feels pointless" | Only usable during a rare raid | Every ability gets an always-available second use (§5) |
| "Obstacles at rune gates feel terrible" | Hazard spawner ignores gate positions | Gate approach corridor is swept clean (§5) |
| "1 → 6 travelers is overwhelming" | Chapter rosters are fixed and large | Staged party ladder 1→3→4→5→6→6→7→finale (§1) |
| "Movement feels stiff" | Player snaps between 3 lane Y positions | Continuous free movement, mouse + WASD + arrows (§4) |
| "Bad builds don't cost anything" | Wrong build = free retry | Escalating, named costs (§6) |

---

## 1. Mission scaling — the party ladder ✅

**Problem.** Prologue = 1 traveler. Chapter One = 6 builders + escorts. That is a
600% difficulty jump on mission two, and it means six term-builds back-to-back
before the player has even seen the road twice.

**Solution: a staged party system.** Chapter rosters stay exactly as authored (all
the writing, all the characters, all the terms survive), but each chapter draws a
**capped party** from a queue.

```
Chapter    prologue  ch1  ch2  ch3  ch4  ch5  ch6  ch7
Builders      1       3    4    4    5    5    6   (finale)
```

- Travelers a chapter cannot fit are pushed to a **waiting list** (`S.pending`).
- The next chapter fills its party from the waiting list *first* (oldest first),
  then from its own roster. Nobody is lost; everybody eventually gets their term
  built.
- Escorts (non-builders) top the party up to a slightly larger visible squad, so the
  caravan still *looks* like it is growing even when the build count is controlled.
- Chapter Seven ignores the cap for escorts — the finale is supposed to be everyone.

**Why this over just rewriting the rosters:** it preserves every authored traveler,
clue, and term; it makes the ramp a single tunable array; and it means later chapters
naturally get denser without new content.

---

## 2. Progression — one unlock per mission ✅

### 2.1 The blueprint ladder

The commission board no longer opens with seven patterns. It opens with **one**, and
each completed mission unlocks the pattern the *next* mission wants.

| After you finish | You unlock | Because the next road… |
|---|---|---|
| *(start)* | **Field kit** — mend | …is a first walk; you need to survive it |
| Prologue | **Short blade** — cut snags | …runs through lowland deadfall |
| Chapter One | **Grappling hook** — climb | …crosses the high passes of Windbell |
| Chapter Two | **Smoke shell** — slip patrols | …is a patrolled city road |
| Chapter Three | **Reinforced rope** — descend | …is flooded lowland and rope work |
| Chapter Four | **Climbing claws** — sure footing | …is shifting fog-forest paths |
| Chapter Five | **Reed bow** — strike at range | …is a fortified stronghold assault |
| Chapter Six | **Lexicon seal** — the finale pattern | …is the Great Archive itself |

Each unlock is announced on the result screen as a **full-width unlock card**, not a
line of small text, and is repeated on the hub. The player always knows what they
just earned and what it is for.

### 2.2 The recommended board

Even with the ladder, the board eventually holds several patterns. So the board is
now **curated, not exhaustive**:

- The 1–2 patterns the scout's road report actually calls for are shown as large
  **recommended cards**, badged and explained ("✦ the road ahead wants this").
- Everything else the player owns collapses behind a quiet *"the rest of the board"*
  toggle. Available, never in the way.

### 2.3 Bench capacity

`1 → 2 → 2 → 3 …` pieces per mission, scaling with the chapter, replacing the old
"party size ≥ 3 means 3 items" rule. Early missions are a single, meaningful choice.

### 2.4 The progression panel

A new hub panel, **The Path of the Reed**, answers the three questions from the
North Star at a glance:

- Chapter *n* of 8, with a filled spine
- Patterns known / patterns remaining
- **Next unlock:** the exact thing the next mission grants
- Lexicon affinity level and what the current level gives you

### 2.5 The campaign map ✅

A visual spot-to-spot trail sits above the chapter list on the hub: all eight
chapters, prologue to finale, laid along a winding path (`renderCampaignMap`).
Unlike the chapter list — which only ever shows what's currently reachable — the
map shows the **whole road up front**:

- Every node is always present, even chapters far in the future — nothing is
  hidden, only *locked*. A locked node shows a plain 🔒 in place of its number,
  dimmed but still there, with its terrain-trait glyph faintly visible underneath
  (locks gate access, not information).
- Each node hints its **value and traits** at a glance: a small icon derived from
  the chapter's terrain (🧗 mountain → reach & climb, 💨 road → stealth, 🪢 river →
  protect & descend, and so on — one terrain per chapter, so the mapping is exact,
  not approximated), plus a native tooltip on hover with the full risk tier and
  trait description.
- Completed nodes carry a jade seal and checkmark; the current node glows gold
  with a pulsing ring; a solid trail connects what's been walked, a plain one
  marks what's ahead.
- Clicking the current node opens that chapter exactly like the existing "Prepare
  the expedition" button; clicking a locked node explains why, rather than doing
  nothing or silently failing.

Covered by `test10.js` (23 assertions): every chapter has a spot, exactly one is
"now," locked nodes stay locked but still hint their traits, clicking a locked
node is a no-op with a clear reason, and the map advances correctly as chapters
complete.

---

## 3. Crafting with teeth ✅

### 3.1 The old math (why it felt like slop)

Every craft mini-game ended with `clamp(score, 0.3, 1)`, and the final grade was
`quality*0.45 + buildQ*0.55` with tiers at 0.82 / 0.55. A player who *closed their
eyes* scored ~0.42 — a guaranteed flawed-but-usable item. A player who did well
scored ~0.8. The entire skill range of the game was compressed into one grade band.

### 3.2 The new math

- **Floors removed.** Craft mini-games now report their true 0–1 performance.
- **A fourth tier: `ruined`.** Below ~0.34 the piece **breaks on the bench**. The
  ember is spent, nothing goes in the tray. This is the first real failure state at
  the forge, and it is what makes success mean anything.
- **Tiers:** `fine ≥ 0.82` · `ok ≥ 0.58` · `flawed ≥ 0.34` · `ruined` below.
- **A wrong decode hurts more.** It was 0.55 quality; it is now 0.42, and it locks
  the fine material for that craft. Getting the word right is the difference between
  a good piece and a coin flip.

### 3.3 Consequences that reach the road

Grades were nearly cosmetic. Now:

| Tier | Traits | On the road |
|---|---|---|
| **fine** | ×1.25 | +1 ability charge; counts toward variant unlocks |
| **ok** | ×1.0 | works as written |
| **flawed** | ×0.55 | adds a small, named drag ("the join slips") |
| **ruined** | — | never leaves the bench; ember spent |

### 3.4 Fairness, so punishing stays fun

Punishing is only fun when it is *readable and recoverable*:

- **Stakes shown before you start.** Every build step displays its target ("fine work
  needs 82%") and a live quality meter while you work.
- **Tempering** (existing technique) becomes the designed answer to a bad craft, and
  is now also offered on `ruined`, once per bench visit.
- **Relax mode** (existing accessibility setting) softens ember costs and disables
  the ruined tier entirely. The teeth are opt-out for players who need them to be.

---

## 4. Free movement on the road ✅

**Out:** three fixed Y positions, snapped to on tap.
**In:** a continuous vertical band the player moves through freely.

- **Mouse:** the squad follows the cursor's height directly. Smooth, immediate, the
  way it felt best.
- **Keyboard:** `W`/`S` and `↑`/`↓` apply continuous velocity while held (not a
  one-step hop per press).
- **Touch:** drag anywhere on the canvas.

The three *paths* remain as **terrain bands** — the upper ledge is still fast and
still needs climbing gear, the river floor is still slow and sheltered — but they are
now regions you flow between rather than rails you are clamped to. Collision is
distance-based, so partial commitment to a lane is a real, expressive choice.

Rune gate doors, hazards, and pickups all resolve by vertical proximity.

---

## 5. Every button has a purpose ✅

### 5.1 Abilities

The complaint is exactly right: **Strike ("defeat raiders")** is dead weight for
90% of a mission because raids are rare. Each ability now has a raid use *and* an
always-available road use:

| Ability | During a raid | Any other time |
|---|---|---|
| **Strike** ⚔ | Cuts the ambush down | **Clears the road ahead** — destroys every hazard in the corridor in front of the squad and bumps momentum |
| **Vanish** ☁ | Slips the ambush | **Phase** — brief immunity to hazards + a widened collection radius that pulls in nearby word-parts |
| **Mend** ✚ | — | Restores the squad (unchanged, already always-useful) |

Button labels update live to say what the button will do *right now*, so the hint
text is never a lie.

### 5.2 Clean ground at rune gates

A rune gate asks the player to *think*. Stacking a reflex dodge on top of that is the
"feels terrible" the report names. So:

- Hazards will not spawn inside the gate's approach corridor.
- Any hazard already inside the corridor when the gate opens is **swept away** with a
  visible cue (the gate's rune-light burns it off) rather than silently deleted.

The corridor covers the full read-and-decide window before the gate plane.

---

## 6. Hover-to-study — vocabulary as the reward ✅

A new mechanic that directly serves the North Star: **curiosity pays.**

Hovering the mouse over a word-part drifting down the road:

1. **Reads it to you.** A card appears with the part, its kind, and its meaning.
2. **Studies it.** Hold the hover briefly and the part is collected as *studied* —
   worth more than one collected by walking through it.
3. **Buffs you.** A studied part grants a small immediate bonus (extra stat
   restoration + a momentum nudge) on top of the normal pickup.
4. **Builds affinity.** Studied parts feed a persistent **Lexicon Affinity** track
   that survives across missions.

**Affinity levels** (persistent, campaign-long):

| Level | Threshold | Grants |
|---|---|---|
| I — Reader | 8 studied | +1 starting momentum floor on every road |
| II — Scribe | 20 | +1 ember at the bench, every mission |
| III — Keeper | 40 | Studied parts also restore the squad's morale |
| IV — Lexicographer | 70 | Rune gates reveal one wrong door before you commit |

This makes reading definitions — the single most educationally valuable thing the
player can do — mechanically the strongest thing they can do. Exactly the incentive
asked for.

---

## 7. Failure has a price at the Term Builder ✅

Wrong builds were free. Now they cost, on an escalating and clearly-named scale.
Noticeable, never punishing enough to stall a learner:

| Attempt | Cost | Shown as |
|---|---|---|
| 1st wrong | Accuracy penalty (0.22, up from 0.18) | "Their confidence dips." |
| 2nd wrong | − ink | "−4 ink · a wasted sheet" |
| 3rd+ wrong | − 1 forge ember for this mission | "The bench loses an ember to the delay." |

The correct answer is *never* withheld and there is no attempt limit — the player
can always get there. What they cannot do is get there for free. A running "naming
record" chip on the builder screen shows the cost as it accrues, so the player feels
it while it is happening rather than being surprised at the results screen.

---

## 8. The final boss — *The Erasure at the Great Archive* ✅

**Lord Jian sheds that name here.** He is revealed as **Jian Radicida, the
Root-Slayer** — Latin *radix* ("root") + *-cida* ("slayer, killer"): the one who
kills the roots. His forces don't just confiscate books — they corrupt terminology
itself (swapped prefixes, misleading suffixes, erased combining vowels, rewritten
definitions), and he believes that cutting a word's root out kills its meaning for
good. His final transformation is **Verbum Ultimum** — "the final word" — the belief
that one master alone should hold the authority to define truth. The player defeats
him by doing the opposite of everything he does: rebuilding words, recovering their
origins, and sharing their meanings. Built on Chapter Seven's existing road — no new
screen, so the whole bench-and-road toolkit (momentum, gates, hover-study, abilities)
carries into it.

### Phase I — *The Stripping* (recognition under decay) — shipped
Every rune gate from the road's start until progress 0.34 is forced to a **root**
target (`openGate`'s `forceKind`) — true to his title, he is slaying roots, so every
gate asks you to prove you still know one. An **erosion meter** ("Radicida strikes
at the root") rises steadily; naming a root gate correctly pushes it back 0.3, and
completing a real, whole term (root and all) pushes it back 0.45 — proof a complete
word survived the Stripping. If erosion maxes out, a collapse knocks momentum and
stats hard but is always recoverable — never a hard fail, per the "no reflex-only
phase, no unfair wall" design rules.

### Phase II — *The Blank Page* (recall without support) — shipped
From progress 0.34 onward, hover-to-study's definition card seals shut
(`showStudyCard`) — a new part shows its text but not its meaning. **Lexicon
Affinity is the mercy mechanic**: each affinity level earned across the whole
campaign (§6) is one scaffold charge, spent the first time a new part is reached
during this phase, permanently unsealing that one part's meaning. A player who
invested in reading definitions the whole campaign walks in with real light left;
a player at zero affinity gets the raw parts and nothing else — recall without
support, exactly as designed.

### Phase III — *The Caravan Chorus* (the argument, resolved) — shipped
At progress 0.90 the road holds and Radicida makes his last transformation —
**Verbum Ultimum**, the final word — and a full-screen assembly puzzle opens:
assemble **electrocardiogram** (electr/o + cardi/o + -gram — a real, verified
term, and notably Bai's own clue term from Chapter Three, so the finale literally
reprises a word the player already built once). The number of chapters actually
finished (`servedChapterIds.length`) decides how many parts the traveling company
"offers" pre-placed — 0 chapters served leaves all three slots to the player, 3+
pre-fills one, 6+ pre-fills two. The remaining slot(s) are filled from a tray of
the correct part plus same-kind distractors; a wrong placement explains which
position missed and lets the player swap and retry, never punished, never
unsolvable. On success, momentum surges, the squad is restored, the term is
recorded as completed and counted as a real term built, and the road resumes to a
normal arrival.

Radicida is not defeated in a fight. **He runs out of roots to slay.** The pages
scatter.

Covered by `test9.js` (48 assertions) and `test10.js` (23 assertions, title
progression): forced-root gates, erosion rise/relief/collapse-without-failure,
sealed-vs-scaffolded definitions at exact affinity thresholds, the Chorus's
pre-fill scaling, wrong-placement feedback and successful resolution, and the
Lord Jian → Jian Radicida → Verbum Ultimum reveal sequence landing at the right
narrative beats.

### Boss design rules
- No reflex-only phase. Every phase is a knowledge check wearing an action costume.
- Every phase has a visible mercy mechanic tied to something the player *chose* to
  invest in (affinity, travelers served, bench mastery).
- Failure loops back to the phase start, never the encounter start.

---

## 9. Replayability & variety 🧭

### 9.1 Reed Guild Contracts (daily/seeded roads)
A shareable seed generates a full road: weather, hazard deck, event order, gate
parts. Everyone playing the same seed faces the same road; scores compare directly.
Cheap to build — the road is already procedurally assembled from `buildRoadPlan`.

### 9.2 The Endless Road
One road, no destination, escalating hazard density and gate difficulty. Ends when
the squad's stamina breaks. The pure fluency mode, and the natural home for a
leaderboard.

### 9.3 Lexicon Trials
Short, focused challenge runs against a single body system or a single word-part
kind ("suffix trial", "cardiovascular trial"). Feeds directly off the existing
question engine and mastery data — the game already knows which parts a player is
weak on, so trials can be *generated from the player's own gaps*.

### 9.4 New Game+ — *The Second Reading*
Carry bench mastery, techniques, and affinity into a fresh campaign. In exchange:
gates prompt in reverse (meaning → form only), distractors are drawn from parts the
player has previously gotten wrong, and the party ladder starts one step higher.

### 9.5 Structural variety within a run
- **Road archetypes** per terrain: mountain roads favour vertical movement and
  climbing; river roads add current that drifts the squad; ruins add branching paths.
- **Weather as a verb, not an adjective:** fog hides gate labels until close; storm
  shortens the hazard read window; snow slows movement but slows hazards too.
- **Rival caravans:** a ghost caravan of a previous run (or a friend's seed) walks
  the same road alongside you.
- **Bench events:** an occasional traveling merchant offers a one-off reagent for ink,
  or a rush commission with a doubled reward and a halved ember budget.

### 9.6 Long-tail content hooks
- Traveler bonds — build a traveler's term well three times and they join permanently
  as a road companion with a passive.
- Guild reputation tiers that unlock cosmetic bench and caravan variations.
- A player-authored term challenge: assemble a valid term the game has not seen and
  submit it to the Lexicon.

---

## 10. Implementation order

| Pass | Contents | Status |
|---|---|---|
| **1** | Party ladder · blueprint unlock ladder · recommended board · bench capacity | ✅ |
| **2** | Craft quality overhaul · ruined tier · fine/flawed road consequences | ✅ |
| **3** | Free movement · gate corridor sweep · ability second-uses | ✅ |
| **4** | Hover-to-study · affinity track & levels | ✅ |
| **5** | Term-builder failure costs · naming-record chip | ✅ |
| **6** | Progression panel · unlock cards on the result screen | ✅ |
| **7** | Final boss encounter (3 phases) | ✅ |
| **8** | Endless Road · seeded contracts | 🧭 |
| **9** | Lexicon Trials · New Game+ | 🧭 |

---

## 11. Risks and how they are handled

| Risk | Handling |
|---|---|
| Punishing crafting frustrates learners | Relax mode disables the ruined tier and softens ember costs; stakes are shown before every build; tempering is a designed second chance |
| Free movement makes hazards unreadable | Hazards keep generous vertical hitboxes; the approach-warning ring already exists and now tracks continuous Y |
| Locking blueprints feels restrictive to returning players | Existing saves are migrated to unlock everything they have earned; unlock state derives from chapters completed |
| Party ladder strands travelers | The waiting list is FIFO and drains before new roster members; the finale sweeps up anyone remaining |
| Hover-to-study is unusable on touch | Touch keeps walk-through collection at full value; a long-press on a part opens the same definition card |
