# Remy Dee — handoff

Paste the block below into a fresh conversation to continue this work.

---

## Prompt

You are continuing an overhaul of **Remy Dee: The Lost Lexicon**, an educational
adventure game that teaches real medical terminology. Repo: `cvree/RemyDee`,
working dir `/home/user/RemyDee`. Live at https://cvree.github.io/RemyDee/ —
every push to `main` redeploys it via `.github/workflows/pages.yml`.

### What this project is

One self-contained file: `RemyDee_TheLostLexicon.html` (~940KB, ~15,900 lines).
CSS in `<style>` blocks, markup in the middle, **9 inline `<script>` blocks**.
This must stay a single file — no image, font or audio assets can be added.
Everything visual is CSS, inline SVG and canvas; all sound is procedural
WebAudio. Four CDN libraries (GSAP, THREE, Vanta, Lenis) plus Google Fonts are
loaded but **every use is behind a feature detect with a working fallback** —
and the CDN is blocked in the dev container, so you always test the offline
path whether you mean to or not.

Modules talk through globals: `window.__RD_DATA`, `__RD_ENG`, `__RD_QE`,
`__RD_FX`/`window.FX`, `__RD_MG`, `__RD_SCREENS`, `__RD_PREP`, `__RD_MISSION`,
`__RD_ARCADE`, `__RD_META`, `__RD_MODAL`. Prefer adding to a module over
editing across blocks.

Design constitution: `docs/NORTH_STAR.md`. Also `docs/GAME_PLAN.md`,
`DEPTH_PLAN.md`, `WALK_PASS.md`, `MAKERS_PASS.md`, `TRIALS_PASS.md`,
`BENCH_PASS.md`, `HALL_PASS.md` — read `BENCH_PASS.md` first (it deleted a lot
of what the older ones describe) and `HALL_PASS.md` second, it is the most
recent.

### How to verify anything

```
npm install jsdom playwright          # node_modules is gitignored
node syntaxcheck.js                   # parses all 10 script blocks
for t in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 28 29 30 31 32 33 34 35 36; do node test$t.js | tail -1; done
```

30 jsdom suites, **1217 assertions, all passing, zero window errors**.
`testlib.js` is the shared harness (mocks AudioContext, canvas 2d, strips CDN
scripts, counts window errors). Always run the full suite — several passes here
broke a distant test.

**The Trials need a headless escape hatch.** `__RD_MG` runs the forge's build
and proof steps, and it is a hand-skill challenge that jsdom cannot play.
`testlib.js` calls `__RD_MG.setAuto(2)` after boot, which resolves every trial
instantly at a clean grade; a suite that wants to prove a grade *changes* an
outcome sets its own tier (`setAuto(0)` / `setAuto(4)`) and puts it back
afterwards. Anything that crafts a piece is asynchronous — `await until(...)`,
do not assert on the next line.

**Trials happen at the bench and nowhere else.** The road, the chest, the spring
and the cache used to open them and no longer do; `test33` §8 fails if one ever
comes back. If you need a moment on the road to ask something of the player, ask
it of their *kit* — that is what the walk is for.

**Look at it in a real browser. This is not optional.** Playwright with the
preinstalled Chromium:
```js
chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
```
Nearly every defect fixed in the last pass was found by taking a screenshot and
looking at it: the road HUD's labels were invisible, three panels were stacked
on top of each other on a phone, the road had one word-part on screen at a time.
jsdom cannot see any of that.

### What has been done

Three large passes are merged. The first two are in the git log (learning
correctness, the meta layer, the scheduler, distractors, fifteen factual
corrections, the corpus, the first minute, the road as a decision, the Vigil,
three verbs on the road). The third pass is the four commits below.

**1. The world stops borrowing a culture it never taught.** The game taught
Greek and Latin word-parts inside a wuxia frame: ~120 hanzi seals, a cast of
forty-eight Chinese-named travelers, jian and dao in the armoury, a moxa cup
and a jade pulse-ring among the relics, a pagoda on the title screen, and a
font stack asking for Songti and SimSun. None of it carried the subject. The
setting is now the Hellenistic Mediterranean the vocabulary actually comes
from, which pays twice: every seal, weapon and place name can carry an
etymology the player is already being asked to learn. The seals are Greek
capitals chosen to mean something, and where an achievement counts, its seal
is the Greek alphabetic numeral for that count. Lord Jian is **Lord Kanon** —
*kanna*, a reed; *kanōn*, the straight reed cut into a measuring rod — against
the **School of Kalamos**, the same reed cut into pens. Palatino leads the font
stack because it carries polytonic Greek on every desktop.

**2. What the bench bought, said out loud.** Three defects on the line from the
forge to the road: `gainMult`/`valueMult` were assignments where they meant
multiplies, so a build with two points of control silently deleted the Vigil's
study bonus and every masterwork bonus; the grade reached Strike, Vanish and
Mend and nothing else, so a masterwork rope anchored the line exactly as well
as a serviceable one; and no passive could say which piece paid for it, so the
debrief told players that a perfectly braided rope "never came into play" while
it held every descent. `ownerFor` + `creditPassive` name the piece once per
road and tally silently after. The game also draws its own icons now
(`MARK_PATHS`, `D.mark()`) — the emoji are gone.

**3. The roots get a reason to stick.** `PART_FACTS` gives all 84 parts one
verified line each — *neuron* meant bowstring, *mys* meant mouse, *elektron* is
amber — shown in the Lexicon and on the reveal card, attached to whichever part
of the term the player has met least. And the reveal asks for a **guess before
it opens**, on tier 3 only (tiers 1 and 2 print the definition on the builder
screen, so a guess there is a reading test). That gate exposed a corpus hole:
hemiplegia had no sibling to be confused with; `para-`/paraplegia closes it.
Also, the seal never landed — the CSS animates `.stamp.hit` and the code added
`.go`.

**4. The journey stops stacking three things in one place.** The momentum
readout grows downward and the gate prompt and pressure meter were pinned at
fixed offsets under it; they are one flex column now. `clickSpark` was bound to
window and fired on every pointerdown in the document. And `conceptBias`
resolved to a part of speech, so a field kit's order asked about visual
examination; each concept carries a vocabulary pool now.

**5. The bench pass — one task per weapon, and only at the bench.** See
`docs/BENCH_PASS.md`. The seven hand-written canvas crafts at the forge (and the
heat layer, the scrap apron and the rubric that served them — ~1,400 lines) are
deleted; every pattern is now worked by **exactly one fixed trial**
named in `BENCH_TRIAL`, the same one every time you build that pattern. `MG.run`
and its `ACTS` pools are gone with every caller outside the forge: the road's
spring, cache and rockslide, and the chest ceremony, all read the kit again
instead of stopping the walk to grade your hands. `buildMeta` keeps `craftSpec`
fed from the two decisions that survived — the stock chosen and the trial earned.
Step 4 is the proving animation again: **one trial per piece** is a hard rule, and
`test12` fails if a pattern grows a second one. The rhythm archetype could not end
a bar containing an unplayed rest (it scored the note without resolving it), so
the mortar hung; fixed, and `play()` now carries a deadman ceiling because six of
the ten archetypes advance only on player input.

**6. The road stops shouting, and the difficulty starts being felt.** Three
player complaints, one pass — `test34` covers all of it.

*Clutter.* A word-part takes ten seconds or more to cross the field and offers
were going out every 1.7–2.8s in twos and threes, so a dozen unrelated roots
could be in the air at once. The fix is a **field cap** rather than a slower
clock: `spawnOffer` and `spawnHazard` return `false` when the road is already
full and the drip retries in half a second, so the interval is a floor and the
ceiling is what the player actually sees. Measured on a live Chapter Three road:
average word-parts on screen **3.30 → 1.95, peak 9 → 4**. Treasure moved out of
the offer's own slots into the unused band — on a two-part offer it was eating
the decision.

*The gate was too close.* `GATE_LEAD` 0.18 → **0.26, and it scales with
`M.paceLive`**, because a fixed distance is a shrinking amount of reading time
exactly when the player is doing well and the road is running fast. The gate now
records the lead it opened at (`M.gate.lead`) so the cleared corridor covers its
own whole approach. Two latent bugs fell out of this: a gate opened near the
destination was planted **past** it and could never be reached (true at 0.18
too — the last road-plan gate at 0.93 was never once resolved), so `openGate`
clamps to `progressCeiling()` and `buildRoadPlan` keeps gates out of the last
stretch; and a hazard drawn inside a gate corridor was dropped rather than
moved, which on a narrow canvas silently emptied the road of hazards for every
gate approach.

*Difficulty that could not be felt.* Three causes. The adaptive tier ramped
confidence over 24 answers onto a compressed band and so lived within a few
hundredths of 0.42 forever — it is the full band over 12 answers now. The
chapter number fed nothing: `campaignDepth()` is published on `diffTune()` and
moves density, bite, the clock, the field cap and the vocabulary, but never the
affordances the *setting* promised (Gentle still dims a door at the Archive).
And the setting could not be felt in the vocabulary at all — `diffTune().reach`
now decides how unfamiliar the parts on offer are, from a narrow drill of what
the player has met to a wide reach into what they have not, and `gateDistractors`
picks the confusable end of the pool on a demanding road. That last one needed a
guard: a wrong door reading "under, below" against `hypo-` is not hard, it is
ambiguous, so near-synonyms are excluded from the pool outright. `test34` proves
no gate anywhere in the corpus can offer one.

*And the seeded-road box takes a chapter number.* A bare `0`–`7` typed into it
opens the campaign up to that chapter, filling in the served chapters, bench
patterns and recovered pages the skipped roads would have paid out. A base-36
road code still queues a shared road; the two can't be confused.

**7. The Training Hall grew the two modes it was missing.** See
`docs/HALL_PASS.md`. The Hall taught recall twice and construction and transfer
not at all — those two live only inside the campaign, where they cost stamina
and cannot be repeated, so free practice could not reach half the promise.
**Rune Forge** (word building: BUILD / FINISH / BREAK / REPAIR, ten forges, a
strike that clangs and a blade that cracks) and **Spirit Trial** (applied
recall: DECODE / SPOT / IMPOSTOR / REPAIR / CHAIN, twelve spirits, three lives,
a fuse) join Reed Slice and Seal Match, and either can break into a shared
**Mastery Rush** — twenty seconds, no hints, earned the first time a session's
streak reaches five, where the spectacle escalates and the difficulty does not.
Every card instruction is under five words now and the paragraphs are gone.
`wordOf()` spells a build from the two clauses the game teaches and reproduces
all 78 terms letter for letter, which is what lets REPAIR show a word the corpus
does not carry; the six terms whose junction letters fuse are kept out of BREAK,
where there would be no honest place to cut. Four defects fell out of it: the
wisp's entrance class was named `rush` and inherited `position:absolute` from
the Mastery Rush overlay, so the spirit stood on its own sign; the arcade stage
had no width inside a centred flex column, so every mode came out a different
size and the Rush covered part of the screen; the Rush clock collapsed to zero
width and the twenty seconds could not be seen running out; and Reed Slice's
bomb was still the hanzi 爆 asking for a Chinese serif — the last CJK codepoint
in the game, in the one mode nobody re-read after the culture pass. `test36`
covers all of it, including that no CJK codepoint returns to the Hall.

### What is left — verified, not speculation

**Art.**
- Step 3 of the forge is now a card and a quality bar with the trial opening
  over it, so between trials the panel is sparse. It is only on screen for the
  ~600ms the bar takes to fill, but it could carry the piece being made.
- Settings still ships iOS pill toggles and a native range input with Chrome's
  default accent; the Hall of Records still opens on five KPI stat tiles over a
  card grid under tab pills. Those two screens are the most generic in the game.
- The chest is still a mobile-game loot box; it wants to be a lacquered document
  case with a wax seal that cracks. (Note the fiction is Mediterranean now: a
  sealed wooden *capsa* with a wax *sphragis*.)
- No `writing-mode` anywhere.
- `page()` still serves seven distinct meanings across twelve call sites.
  (`sfx.pour` and `sfx.bow` found homes in the Hall pass: the forge quenches
  with one, the spirit bows out with the other.)
- Border radii are still a mix of 2/3/8/9/10/12/14/20px against a token set that
  says 2/3/4. The decode chips and the gate prompt were brought in line; the
  rest were not, because pills and seals legitimately want round.

**Performance.** The road holds 59.9fps with a 16.7ms median frame. The bench's
own per-frame offenders went with the old crafts; the trials' stages have never
been profiled.

**Learning design.**
- The road still draws its goal-pole omega with `"Noto Serif SC"` in the font
  stack (`drawGoal`). Harmless — it falls through to a serif — but it is the
  same stale reference the Hall pass cleared out of the arcade.
- Chapter 7 introduces no new vocabulary; the finale asks for nothing new.
- Around 24 terms and 19 parts are never introduced by a traveler — they exist
  only as quiz material. `paraplegia` and `para-` just joined that list.
- The pretest only fires on tier 3. Tiers 1 and 2 print the definition as their
  own prompt, which is the reason — but that is a *builder* design choice worth
  revisiting rather than a fact of nature. A tier-2 builder that withheld the
  definition would earn a pretest and a harder, better minute.

**Never audited.** A bug-hunting pass on save corruption, quota-exceeded writes,
private-mode localStorage and long-session listener growth was commissioned
twice and died on a session limit both times. `test17` and `test28` cover the
save paths that exist; nobody has tried to break them.

### How to work

- Commit in coherent passes with messages that explain *why*, in prose. Match
  the existing history — read `git log` first.
- Match the file's voice in code comments: they explain the reasoning and the
  bug that motivated the code, not what the line does.
- Every behavioural fix gets a regression test, and assertions are written as
  sentences describing the guarantee.
- Don't trust an audit finding without verifying it in the code yourself —
  roughly one in six was wrong or already handled.
- Preserve save compatibility. `test17.js` and `test28.js` guard it; when you
  change a default in `newGame().settings`, check the migration reads the
  *stored* value before merging defaults over it.

Continue making it fantastic. Start by looking at it in a browser.
