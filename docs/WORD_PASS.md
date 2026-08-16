# The word pass — the game is named for an act that wasn't a game

Every system in this file has range. The bench runs ruined → flawed → ok → fine →
masterwork and tells you which you got. The road runs ×1 → ×5 with four named
gears and a sound for each crossing. The Hall gives you three lives and a clock.
The Term Builder — the act the game is named for, the first of the four
cognitive modes in `NORTH_STAR.md` §2, the one the whole promise rests on — had
two states: **not yet**, and **done**.

And for 33 of the campaign's 44 traveler builds, it printed the answer before it
asked the question.

This pass is the `FEEL_PASS.md` question asked of the bench instead of the road —
*when the player does this well, how do they find out?* — plus the one it turned
out to be hiding behind: **is the player doing anything at all?**

---

## 1. The tray was not a question

A tier-1 builder was handed **zero distractors**, while the line above the tray
read:

> You need: **gastr/o** (stomach), **-itis** (inflammation).

So the tray held exactly two tiles, both of them named a second earlier, and the
assembly area was the only place they could go. The first act of the game — the
courier at the gate, the first term, the moment that teaches a new player what
this game *is* — asked for nothing. It was a drag test with the answer printed
above it.

Tier 2, which is 26 of the 45 travelers and therefore most of the campaign, got
two distractors and this hint:

> The clue points to **inflammation of the stomach**.

That line is worth looking at closely, because the clues it was printed under are
some of the best writing in the file. Captain Junia's is:

> After the long watch my joints ache deeply, though they are **not swollen**.
> The scholar said: **not -itis**. Give me the pain term.

That clue poses arthralgia against arthritis — precisely the confusion this game
exists to fix — and then the hint underneath resolved it for free. The clue
writer had already done the work and the hintline was undoing it.

**What it is now.** Every tier carries look-alikes, and the count is the
difficulty curve: **2 / 3 / 4**. Tier 2 and tier 3 show the clue and nothing
else; the definition is no longer free text but the **Recall meaning** charge you
already had and now have a reason to spend.

Tier 1 keeps its definition — it is the genuine first teaching moment, and taking
it away would be cruelty rather than difficulty — but it pays for the withdrawn
"you need X and Y" by **glossing the tiles**: at tier 1 each tile says what it
means. The task becomes what it should always have been — *"inflammation of the
stomach"* read against a tray that says stomach, intestine, inflammation, tumor —
and the glosses come off at tier 2, which is the ladder.

### One wrong answer per position before two anywhere

Adding distractors exposed a second bug in `distractorsFor`. It built one flat
pool and sliced it, so gastritis — a root and a suffix — could draw **both** its
distractors as suffixes and leave `gastr/o` as the only root on the tray. Half
the word still wasn't being asked about. The pool is per-kind now and dealt
round-robin, so every position a word needs has a rival standing next to the
right answer before any position gets a second. `test38` proves it across every
multi-kind build in the corpus.

---

## 2. Two clues answered themselves

The guard written for §1 caught something the DOM sweep alone would have missed.
Two clues contained their term's definition **word for word**:

| traveler | term | clue said |
|---|---|---|
| Eunike the Scholar | cardiology | "a whole discipline — *the study of the heart*" |
| Berenike the Lamp-Keeper | ophthalmology | "*the study of the eyes*, precisely" |

That is the same reading test one layer down, and it reached further than the
builder: the pretest then asked the player to guess a definition still printed on
the screen behind the card. Both clues now point at the organ and the shape of
the word and leave the meaning as the thing being asked for. Cardiology keeps
"Keep the o before -logy," which is teaching, not answering.

`test38` guards the whole corpus against the pattern returning.

---

## 3. The pretest reaches tier 2

The pretest's four gates were carefully argued and the first one read `tier < 3`.
Its own comment gives the reason:

> A tier-1 builder prints "Build the word for inflammation of the stomach" at the
> top of the screen, and a tier-2 builder says "the clue points to inflammation
> of the stomach" under it.

So the gate was never about the tier. It was about that hint. The hint is gone,
tier 2 now shows the clue and nothing else exactly as tier 3 does, and the gate
moves with the reason that created it — from **12 builds to 37**.

The other three gates are untouched: a spent Recall charge, a repeat term, and a
term with no sibling to be confused with. That last one had to be checked, since
tripling the reach triples the exposure — every tier-2 and tier-3 term in the
corpus has a sibling, and `test38` fails if one ever loses it.

Tier 1 still skips it, for the reason that was always true.

---

## 4. The Scribe's Seal

`accuracy` has been computed at the bench for a long time:

```js
acc = 1 - (attempts-1)*0.22 - supportUsed*0.12   // clamped [0.35, 1]
```

It survives into `f.results`, and at **0.42 it is the single largest term in the
road's `overall`** — a bigger share than the entire bench. A player who named
every term first time walked a materially easier road than one who guessed their
way through, and the game never once told them that was why.

So the number gets a name, a face on the wax, and a sentence about what it
bought. Four grades in `SEAL_GRADES`:

| seal | at | reason |
|---|---|---|
| **Unbroken** | 1.00 | Named first time, unaided. |
| **True** | 0.72 | Named right, with a little working. |
| **Smudged** | 0.50 | Named right, but the page shows the working. |
| **Overwritten** | — | Named at last — the sheet was rewritten more than once. |

No new economy. The seal names something the game was already doing, which is
the whole lesson of the feel pass.

Three places carry it:

- **The wax.** `#reveal-stamp` printed a fixed `Σ` on every term; it carries the
  grade's own mark now, so the signature beat says something about the naming
  that caused it.
- **The card.** One quiet line under the pronunciation — a rule above and below,
  no animation of its own. It is a verdict, not a reward popup.
- **The debrief.** `consequenceLines` had two outcomes either side of accuracy
  0.7, which put a first-time unaided naming and one that cost two hints in the
  same sentence. It names the seal and the term now.

A lifetime tally lives at `S().seals`, written lazily so a save from before this
pass grows one on its next named term rather than needing a migration step.

**The seal lives inside `#reveal-body`, not above it.** It was above at first,
and it was wrong: the pretest deliberately shows the word and nothing else, and a
verdict printed over that question is exactly the clutter the pretest was built
to remove. It arrives with the card it belongs to.

---

## 5. The junction is the signature act

The combining vowel — `gastr/o` + `-itis` is *gastritis*, `gastr/o` + `-logy` is
*gastrology* — is the one piece of knowledge in this game that belongs to medical
terminology and to nothing else. A player who owns it can spell a word they have
never met. It is the most distinctive thing the game has to teach.

It was a **20px bar and a 0.58rem note**, and both were invisible until `.drawn`
was added — which happened in exactly one place: `onBuildSuccess`. The rule was
revealed only *after* the player had finished the word, at the moment they could
no longer act on it, and only to players who had already got it right.

Now the seam is live:

- **The junction draws as soon as two tiles are adjacent**, not as a reward for
  having finished.
- **The losing vowel is struck through on the tile that owns it** — the player
  watches `gastr/o` become `gastr`. Struck, not hidden: the point is seeing which
  letter left.
- **The assembly reads back what the pieces currently spell.** A mirror, not a
  verdict — it never says whether the word is the *right* one, which is still the
  player's problem and still what stamping decides.
- **A dropped vowel has a sound**, 90ms behind the rung that placed the piece.

The readout borrows the Hall's `wordOf` rather than growing a second speller, so
the two places in the game that join word-parts cannot disagree. `wordOf` is a
public export now instead of a test hook, and `test38` re-checks that it
reproduces all 78 corpus terms letter for letter.

### Two layout defects fell out of it

- **The note printed across the word.** `.connector` was 20px — the width of a
  decorative stroke — and the rule note riding on it is ~34px and `nowrap`, so
  "DROP O" overhung both neighbouring tiles. The gap is sized to the note it has
  to carry, and the note carries its own ground.
- **The assembly was a field, not a line.** Full-bleed with a 38px rule repeating
  across it, so on a desktop a two-piece word sat in the middle of about thirty
  empty cells. Capped at 34rem and centred. The cap does not leak the piece count
  — every word gets the same box — and the placeholder no longer says
  "Prefix · Root · Suffix" at words that have no prefix.

---

## Verification

- `node syntaxcheck.js` — all 10 blocks parse.
- **32 jsdom suites, 1362 assertions.** `test38.js` is new (88 assertions) and
  covers every guarantee above, including the save-compatibility path and the
  corpus-wide clue guard.
- Chromium at **1280×800 and 390×844**: no horizontal overflow, no page errors,
  and a 3-part tier-3 word (`hypo-` + `glyc/o` + `-emia`) wraps correctly on a
  phone with every position contested.

### One pre-existing flake, not from this pass

`test36` §"ten forges end the session" fails intermittently on
`G().done >= 10`. Measured rates: **baseline 1/14, this branch 1/10** —
indistinguishable, and the mode it tests (the Hall's Rune Forge) is untouched
here. Instrumented, the failing run shows `iters=2 stalls=0 done=1 over=true`:
the session ends after a single successful forge with no stalled solve, which
points at a stale session clock surviving a previous `startMode('forge')` rather
than at the iteration cap. Left alone deliberately — it is a different system,
and a speculative fix to the Hall is a worse trade than an accurate note.

---

## What this pass deliberately did not do

- **It did not make tier 1 harder to be harder.** Tier 1 keeps its definition and
  gains glosses. What it lost is the line that named the answer.
- **It did not add a currency, a streak, or a popup.** The seal names a number
  the game was already using against the player's road.
- **It did not make the readout a verdict.** The assembly says how the pieces
  join. Whether they are the *right* pieces is still the question.
