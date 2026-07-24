# Remy Dee: The Lost Lexicon — North Star

**One line:** You learn real medical terminology by *building* it — and every word you
build makes the road ahead survivable.

---

## 1. The promise

A player who finishes this game can look at a medical term they have never seen
before, break it into prefix / root / suffix, and make a confident, correct guess at
what it means. They will not have felt like they were studying.

Everything in the game exists to serve that promise. If a system does not make word
knowledge *matter*, it is decoration and should be cut.

---

## 2. The core loop

```
   LEARN                 PREPARE                  PROVE                REWARD
 Build a term    →   Forge gear for the    →   Walk the road,     →   Unlock the next
 for a traveler      road ahead (decode         gather word-parts,     blueprint, a new
 who needs it        a term to earn the         chain them into        page of the Lexicon,
                     good materials)            real terms             a bigger party
       ↑                                                                     │
       └─────────────────────────────────────────────────────────────────────┘
```

Each of the four beats teaches the *same* vocabulary from a different angle:

| Beat | What it asks of the player | Cognitive mode |
|---|---|---|
| Term Builder | Assemble a term from parts | Construction (production) |
| Forge / Decode | Identify a part's meaning under stakes | Recognition (recall) |
| The Road | Recognise parts at speed, chain them | Fluency (automaticity) |
| Rune Gates | Map meaning → form under time pressure | Transfer |

A player who only ever does one of these gets a shallow win. A player who does all
four gets fluent. **The systems must never let the player skip a mode.**

---

## 3. The three pillars

### Pillar I — Knowledge is power, literally
Every mechanical advantage in the game traces back to a word the player understood.
Momentum comes from chaining real terms. Good materials come from a correct decode.
Gate answers open the fast lane. There is no stat you can buy that replaces knowing
a root.

**Anti-goal:** never let grinding, luck, or button-mashing substitute for knowing the
word. If a player can win by ignoring the vocabulary, the game has failed.

### Pillar II — Progression you can see one step ahead
The player should always be able to answer three questions without opening a menu:

1. What am I doing right now?
2. What do I get when I finish it?
3. What is the *next* thing that opens up?

Progression is delivered in **small, legible, frequent unlocks** — one new blueprint
per chapter, one technique per milestone, one Lexicon page per mission. A player
should never be handed six new things at once (which reads as noise) or zero new
things (which reads as a treadmill).

### Pillar III — Effort must be legible in the outcome
Trying hard and trying lazily must produce visibly different results. This means:

- Real failure states, not soft floors. A bad craft can be **ruined**.
- Real rewards. A `fine` craft is meaningfully, obviously stronger.
- Mistakes cost something the player can name ("that wrong build cost me an ember").

**Anti-goal:** "slop" — systems where every outcome lands in the same mushy middle.
If the player cannot tell a good run from a careless one, delete the system or give
it teeth.

---

## 4. Design rules (use these to settle arguments)

1. **No dead buttons.** Every control on screen must have a use in the next 30
   seconds of play. If a button is only useful during one rare event, give it a
   second, always-available use.
2. **No unfair walls.** A skill check (a rune gate, an ambush) is never stacked on
   top of a reflex check (a hazard). Clear the ground around anything that asks the
   player to *think*.
3. **The player's hand is free.** Movement is continuous and available on mouse,
   keyboard, and touch. Never lock the player to discrete positions to make the
   engine's collision math easier.
4. **Curiosity pays.** Reaching for an optional thing (hovering a word to read its
   definition, marking a cache) always gives *something* — knowledge, a buff, or
   affinity. Never punish exploration.
5. **Scale the party like a difficulty curve, not a content dump.** 1 → 3 → 4 → 5 …
   The number of terms a player builds per mission is the real difficulty dial.
6. **One new thing per mission.** Introduce a mechanic, let it breathe for a whole
   mission, then build on it.
7. **Every fiction is fictional; every term is real.** Schools, gear, reagents,
   remedies — invented. Prefixes, roots, suffixes, terms, definitions — verified.
   Naming a term is never diagnosing a person.

---

## 5. What "done" looks like

**v1.0 (shipping target).** Eight chapters, a legible progression spine, a bench
that punishes and rewards, a road that reads as a game rather than a slideshow, and
a final boss that can only be beaten by someone who actually learned the vocabulary.

**Beyond v1.0.** Endless Road, seeded daily contracts, Lexicon Trials, and a New
Game+ that carries bench mastery forward — the systems below in §Replayability.

---

## 6. Success signals

| Signal | Target |
|---|---|
| Player can define an unseen term from its parts | The whole point |
| Mission-to-mission retention | Player wants the next unlock before they want a break |
| "I know why I lost" | Player can name the cause of a bad grade in one sentence |
| Craft variance | Ruined / flawed / ok / fine all occur in normal play |
| Ability usage | Every ability button gets pressed at least once per mission |

---

## 7. The villain's thesis (why the game is about anything)

Lord Jian believes knowledge is dangerous in untrained hands, so it should be locked
away. Remy Dee believes knowledge is dangerous *only* in untrained hands, so hands
should be trained. The final boss must dramatise that argument mechanically — not
just narratively. See `GAME_PLAN.md` §7 for the Great Archive encounter.
