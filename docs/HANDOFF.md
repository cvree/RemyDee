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
`BENCH_PASS.md`, `HALL_PASS.md`, `FEEL_PASS.md`, `WORD_PASS.md`,
`VAMP_PASS.md` — read `BENCH_PASS.md` first (it deleted a lot of what the older
ones describe), then `HALL_PASS.md`, then `FEEL_PASS.md`, which is about what
the road *says* rather than what it does, then `WORD_PASS.md`, which asks the
same question of the bench, and finally `VAMP_PASS.md`, which
withdrew hover-to-study and separated reward feedback from damage feedback —
it supersedes `WALK_PASS.md` §2 and §5 wherever they disagree — and finally
`FINISH_PASS.md`, the most recent, which put the difficulty chooser back in
front of the first activity, audited the save layer and the long session, and
named the radius scale.

### How to verify anything

```
npm install jsdom playwright          # node_modules is gitignored
node syntaxcheck.js                   # parses all 10 script blocks
sh runtests.sh                        # every suite, one line each; `sh runtests.sh 33 40` runs two
```

37 jsdom suites, **~1470 assertions, zero window errors**. `runtests.sh` prints
ALL GREEN or the count of red suites and exits non-zero.

**The suite is green, including the one that used to flake.** `test36`'s "ten
forges end the session" assertion failed about one run in ten, and the guess in
this file — a session clock surviving a previous `startMode('forge')` — was
right. `stageMode()` never ended the round it was replacing, every mode's HUD
uses the same ids in the same `#arcade-stage`, and a mode's `finish()` called
the *global* `A.cleanup`, so an abandoned forge could end the forge that
replaced it. Staging now ends what is on the stage, and a session ends itself
rather than whatever is current (`test42` §3).
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

**8. The road was doing the work and never saying so.** See `docs/FEEL_PASS.md`.
One question asked of every system on the walk — *when the player does this
well, how do they find out?* — and seven answers came back as "they don't."
Gathering the second piece of a word played the same 1400Hz clink as the first,
forever, and finishing a real term played the bench's generic "that worked": the
chain climbs a **major pentatonic** now (`sfx.chain`), lands from the rung it
actually reached (`sfx.chainResolve`), and only a real word opens the octave —
and the **builder plays the same ladder**, so the bench and the walk agree about
what finishing a word sounds like. Momentum changed gear from ×1 to ×5 in
silence; four named tiers, each crossed at most once per run. Five lifetime
bests did not exist at all (`S().marks`), so a player could walk their best road
ever and never be told — the three rules that keep them from nagging are in
`E.beatMark` and they are the load-bearing part of `test37`. Nothing connected
the part you reached for to the word it went into, which is the one causal link
the mode is built on, so the piece flies there. Threading a hazard was the only
skilful act on the road with no feedback at all; the band was measured live and
set at **1.8 × HIT_R** because 2.1 called most hazards a thread. The frame could
be shaken and washed but never **stopped** — hitstop runs on the road's own
clock (`dt = 0`, `draw()` still runs), capped at 110ms. And the reach was
invisible although three things widen it, so `M.reachNow` is drawn.

Two defects fell out of it: the term banner sat at `top:6px` and hid **stamina**
— the run's clock — for three and a half seconds, at exactly the moment the term
that raised it had healed the squad; and the Endless Road, which always ends by
falling over, played `sfx.bad()` even on the run that beat everything.

**9. The game is named for an act that wasn't a game.** See `docs/WORD_PASS.md`.
The same question as the feel pass, asked of the bench: the Term Builder had two
states, *not yet* and *done*, while every other system in the file has range —
and for **33 of the 44 traveler builds it printed the answer before it asked the
question**. A tier-1 tray held exactly the two tiles the hint above it had just
named; tier 2 answered its own clue ("the clue points to inflammation of the
stomach") underneath clues written specifically to pose that question.

Distractors now run **2 / 3 / 4** across the tiers, dealt round-robin per kind —
gastritis could previously draw both its distractors as suffixes and leave the
root position with a single candidate. Tier 1 keeps its definition (it is the
first teaching moment) and pays for the withdrawn hint by **glossing the tiles**;
the glosses come off at tier 2, which is the ladder. The definition is the
**Recall meaning** charge now, so a support button that was nearly dead has a
reason to exist.

That moved the **pretest** with it: its `tier < 3` gate existed only because
tier 2 printed the definition, so it now runs from 12 builds to 37. And it caught
two clues that contained their term's definition word for word — cardiology and
ophthalmology — which made the pretest a reading test with the answer on the
screen behind the card. Both rewritten; `test38` guards the whole corpus.

The **Scribe's Seal** names what was already there: `accuracy` is 0.42 of the
road's `overall`, the largest single share, and nothing ever said so. Four grades
(Unbroken / True / Smudged / Overwritten) on the wax, the card and the debrief,
with a lifetime tally at `S().seals` written lazily so old saves need no
migration. No new economy — the feel pass's lesson applied to the bench.

And the **junction went live**. The combining vowel is the one thing this subject
teaches that nothing else does, and it was a 20px bar revealed only in
`onBuildSuccess` — after the player could no longer act on it. The seam now draws
on adjacency, the losing vowel is struck through on the tile that owns it, a
dropped vowel has a sound, and the assembly reads back what the pieces spell
(borrowing the Hall's `wordOf`, now a public export, so the two places that join
word-parts cannot disagree). Two layout defects fell out: the rule note was wider
than the gap it sat in and printed "DROP O" across the word, and the assembly was
full-bleed so a two-piece word sat in about thirty empty cells.

**10. The walk was saying everything at once, and saying it wrong.** See
`docs/VAMP_PASS.md`. Five things, all about feedback rather than systems:

*Shake was congratulation.* One primitive, `FX.shake`, carried every loud moment
in the game — flow, a momentum gear, a real term completing, and a lifetime best
**washed in cinnabar**, the colour used everywhere else for a wound. The camera
has a second verb now (`FX.swell`, a push-in, composed with shake in one loop)
and a radial `FX.bloom` centred on the squad, so a reward reads as light coming
out of the thing that earned it. Damage kept shake and got harder for it.

*Hover-to-study is gone.* It put a card over the middle of the playfield and it
drove the best rewards in the mode off **the hand that steers**. Gathering a part
you have never met reads it instead (`readPart`) and pays more than hovering did;
the Blank Page asks its seal question at gather time (`sealedFor`). Touch and
mouse are finally the same mechanic.

*A wrong rune gate is a wall.* It cost ×0.55 momentum and five stamina, which one
chained word repaid in ten seconds — so the one beat that asks the player to
*know* something was the cheapest thing on the road to fail. Now: ×0.22, −13
stamina, −18 power, the half-built word in hand scattered, a 2.4s bar with a
stagger back down the road, and a red slab dropped across the arch.

*Items land.* Spending a forged charge was a caption and a buzz. It is a
shockwave, a hold of up to 260ms, a bloom in the item's own colour and the piece
naming itself and its tier on the road — every part of it scaled by quality, so a
masterwork visibly is one.

*And there is less on screen.* One reach ring instead of one per part; one voice
per event instead of four (the banner owns the lesson, the caption stopped
repeating it); the chain stake is `≈ 14 ink at stake` rather than a sentence; the
control hint is one line; the locked-ledge label appears only when the squad is
actually against the ceiling; pops are outlined, punch in, step clear of each
other and cap at six.

`test39` guards all of it. `test7` grew a step that dismisses the walk school
before it times an arrival — the school pauses the road 620ms into a first walk
and the test had always been racing it.

**11. The road is chosen before it is walked.** See `docs/FINISH_PASS.md`. The
difficulty chooser is back on the cold path, between the primer and the
workshop, because the reason it came off was the wording rather than the
question: every card leads with **who it is for** in one sentence and draws
hazards, time pressure and help as labelled meters, and `test40` proves those
meters agree with the tuning table underneath them. `requireDifficulty(next)`
stands in front of `openChapter` and the Endless Road as a backstop — it returns
`true` when it deferred, and `next` runs on the far side of the choice — so no
route reaches a graded activity on a default nobody chose. `diffAsked` closes it
for good and the migration marks it answered for any save with a road behind it;
the after-the-first-road offer moved onto its own flag, `diffReviewed`.

Walking the game in a browser to check it turned up five things worth naming:
the commission board's scout report, road code and maker's-mark line were dark
ink on the dark workshop stage (1.0:1); a lone recommendation filled the whole
bench and the pattern plate beside it was blanked; **Lucius the Cook was written
and rostered nowhere**, so `hepatitis` was the one authored build a full
campaign could not reach (he joins the Garden of Roots, and the finale absorbs
the extra as `PARTY_LADDER`'s trailing `99` always meant it to); the ending
scored a flawless run **43 / 78** when the campaign only ever asks for 44 terms
(`campaignTermCount()` derives the real denominator) and began a sentence in
lower case whenever Vale was lost; and the goal pole's omega still asked for a
CJK serif.

**12. Never audited, now audited.** The save layer swallowed every refusal:
`try{ setItem }catch(e){}` is right about not taking the game down, and was the
whole story, so a private window or a full quota cost a player a campaign
silently. A write reports now, says so once out loud, and a quota refusal sheds
the luxuries — leaderboard rows, month-old day-medals, lore already read — off
the **live** state before giving up on the campaign beside them (`test41`).
The long session: eight full cycles through every screen with listener calls
instrumented shows flat DOM, nothing stacked on a surviving node, and two real
crashes — Reed Slice scoring against a HUD the Hall had already removed, and
Seal Match writing a matched pair 240ms after the board could be gone. Both
guarded, and the slice loop stops itself when its canvas leaves the document
(`test42`). A few hundred random clicks at desktop and phone size: zero errors.

**13. The roots got their reason where the player is already looking.** All 85
parts carry a verified etymology and it lived in two places, neither of which a
player passes through for the ~20 parts no traveler ever asks for. `factFor(q)`
adds it to the teach beat of the Vigil and the Daily Trial — under the
explanation, quieter than it, suppressed when the explanation already says it.
Deliberately not on the road: the walk says one thing per event (`VAMP_PASS`).

### What is left — verified, not speculation

**Art.**
- Step 3 of the forge is now a card and a quality bar with the trial opening
  over it, so between trials the panel is sparse. It is only on screen for the
  ~600ms the bar takes to fill, but it could carry the piece being made.
- The Hall of Records still opens on five KPI stat tiles over a card grid under
  tab pills — the most generic screen left in the game. (Settings was the other
  one and is done: the pill toggle is a counter in a groove and the native range
  is a wax bead in the same groove.)
- The chest is still a mobile-game loot box; it wants to be a lacquered document
  case with a wax seal that cracks. (Note the fiction is Mediterranean now: a
  sealed wooden *capsa* with a wax *sphragis*.)
- No `writing-mode` anywhere.
- `page()` still serves seven distinct meanings across twelve call sites.
  (`sfx.pour` and `sfx.bow` found homes in the Hall pass: the forge quenches
  with one, the spirit bows out with the other.)
- ~~Border radii are a mix of 2/3/8/9/10/12/14/20px.~~ **Done** — the scale is
  named (`--r-sm/--r-md/--r-lg` for inked edges, `--r-chip` 10, `--r-card` 14,
  `--r-pill` 999) and every rule names the role it meant. One bare value
  survives and it is a shape, not a radius.

**Performance.** The road holds 59.9fps with a 16.7ms median frame. The bench's
own per-frame offenders went with the old crafts; the trials' stages have never
been profiled.

**Learning design.**
- ~~Chapter 7 introduces no new vocabulary.~~ **Not true, and worth recording so
  nobody re-fixes it.** That reading came from the chapter's static roster; in
  play `partyFor` drains the waiting list, and the finale asks for seven or eight
  terms nobody has built (hemiplegia, osteoarthritis, arthroscopy, gastrectomy,
  nephrectomy, hematoma, anticoagulant). Verify against a simulated campaign,
  not against `CHAPTERS[].builders`.
- 34 of the 78 terms are never built by a traveler in a full campaign — they are
  quiz material, Hall material and Lexicon material. All 44 that a traveler *does*
  ask for are now reachable in one campaign, exactly once each.
- Tier 1 prints the definition as its prompt, which is right for a first
  teaching moment but means seven builds never ask for retrieval at all. A
  tier-1 *repeat* — the same traveler met again later — could withhold it and
  earn the guess. Still open.

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
