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
`VAMP_PASS.md`, `PRESS_PASS.md` — read `BENCH_PASS.md` first (it deleted a lot
of what the older ones describe), then `HALL_PASS.md`, then `FEEL_PASS.md`,
which is about what the road *says* rather than what it does, then
`WORD_PASS.md`, which asks the same question of the bench, then `VAMP_PASS.md`,
which withdrew hover-to-study and separated reward feedback from damage feedback
— it supersedes `WALK_PASS.md` §2 and §5 wherever they disagree — and finally
`PRESS_PASS.md`, which is not about a system at all: it is the control layer, and
it is the one document to read before touching any button, field, tab, latch or
chip anywhere in the file — and finally `ASK_PASS.md`, the most recent, which
asks `WORD_PASS.md`'s question of the question engine and leaves one rule behind:
nothing shown WITH a question may contain its answer, and everything shown after
the player has answered should — and `FRAME_PASS.md`, the newest, which is about
what the player is looking *into* rather than what they are doing: the grade over
the whole frame, the entrance choreography, and the one shell width every screen
lays out against. Read it before adding any rule to the **last `<style>` block in
the file** — that block is the end of the cascade, and an unguarded rule in it
outranks every media query above it, which is how a 390px phone quietly went back
to two columns.

### How to verify anything

```
npm install jsdom playwright          # node_modules is gitignored
node syntaxcheck.js                   # parses all 10 script blocks
for t in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 28 29 30 31 32 33 34 35 36 37 38 39 40 41; do node test$t.js | tail -1; done
```

35 jsdom suites, **1518 assertions, zero window errors**.

**One suite is intermittently red and it is not yours.** `test36`'s "ten forges
end the session" assertion (`G().done >= 10`) fails on roughly one run in ten,
at the same rate on `main` as on any branch — the forge session ends after a
single successful round (`iters=2 stalls=0 done=1 over=true`), which looks like
a session clock surviving a previous `startMode('forge')`. Re-run before you go
hunting; if you do fix it, it is a Hall bug, not a test bug.
`testlib.js` is the shared harness (mocks AudioContext, canvas 2d, strips CDN
scripts, counts window errors). Always run the full suite — several passes here
broke a distant test.

**And the suites cannot see composition at all.** Every defect the frame pass
fixed was found by screenshotting in real Chromium and looking at it, or by
measuring `getBoundingClientRect().left` on two screens at two viewport widths
and noticing they disagreed — a heading and the panels under it starting 62px
apart is invisible to 1518 assertions and obvious in one PNG.

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

`node browsercheck.js` is the standing version of that instruction — it boots the
game in real Chromium, drives it to the hub, the settings card and the Lexicon on
an iPhone touch context, and reports every control under 44x44, every control
deformed by its container, anything running past the edge of the card it lives
in, and whether the button ranks are actually three different sizes. Add
`--shots` to write PNGs to `./shots` (gitignored). It found four faults that the
jsdom suites cannot see, including a whole screen of 30px targets in the Lexicon
and a flex row that was stretching every button to one height and erasing the
hierarchy the CSS had just been given.

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

**11. Every button in the game became the same object.** See `docs/PRESS_PASS.md`.
Not a system this time — the control layer. The right sentence had already been
written once, above the Trial's answer stones (*"a card that lifts toward the
cursor is a webpage; a stone that presses in when you push it is an object"*),
it named two selectors out of six, and **a later `<style>` block overrode both of
them**. So nothing in the file obeyed it: icon buttons rose 1px, ability pills
3px, arcade cards 4px, material cards 3px, and STRIKE rose 2px to meet the cursor
and then dropped 2px below its own resting line. Four tokens (`--ctl-rest`,
`--ctl-press`, `--ctl-sink`, `--ctl-snap`) hold that grammar in one place now,
and the one exception is written into the CSS: `.tile`, `.frag`, `.rack-item`,
`.held-item` and `.ct-tile` still lift, because they are things the player *picks
up* rather than presses.

Three ranks replaced five colours — `.btn` / `.ghost` / `.quiet`, with `.lg` and
`.sm` as size — because `Not today` and `Build their terms →` had been sitting
side by side at identical weight and the screen never said which was the road
forward. Continue and Begin trade ranks depending on whether there is a save.
The radii came onto the token set (8/9/10/12/14/16/20/100 → `var(--r-*)`, with
seals, beads and badges left round on purpose). The settings screen stopped being
an iOS form: the pill toggle is a sliding bolt in a channel whose **position** is
the state rather than its hue, and the volume sliders are drawn by this game on
both engines instead of by `accent-color`. The Hall's four capsule pills are
index tabs on a rule. And the 44px touch floor is one token instead of a
measurement per control — verified in a real touch context, where **every control
in the game now clears 44×44**.

Six defects fell out of it. `:focus-visible` set `border-radius:4px`, which is
the *element's* radius and not the ring's, so every control in the game changed
shape at the moment the keyboard reached it. Four controls had talked their way
out of the focus ring entirely — `outline:none` on `.comm-card` and
`.variant-btn`, and the 2.18:1 `outline:3px solid var(--gold)` on `.arcade-card`
and `.sp-seal`. `#build-pron` has no closing `</button>`, so `Stamp the seal` was
written inside it and the parser was recovering. `.toggle`, `.setting-row` and
half of `.seg` were styled and never used; `.seg` and `.gloss-search` were each
declared **twice in different blocks with different values**, and
`.gloss-search` asked for `var(--font-body)`, a token this file does not define.
Disabled was `grayscale(.6)` mud. Turning the settings rows into columns on a
phone made the latch's `flex:0 0 58px` a *height*, so the bolt sat in the corner
of a 58px box. The forge's decode answers and the road's wrong-answer marker both
differed by hue alone, at effectively identical luminance — the Trial's answers
were given a glyph and a border that differs in kind for exactly that reason and
neither of the other two was ever brought along; `.cinnabar-btn` also set
`background` outright, which beats the face variables, so the button it marked
lost hover, press and disabled all at once. The pause menu's quit confirm made
the destructive option the loudest button in the dialog and the option that keeps
the player's road the quiet one, which is backwards.
And four rows that hold buttons were flex rows with no `align-items`, so they
stretched every child to the tallest: the moment the title screen got a large
primary, both second-rank buttons inflated to match it and the hierarchy that had
just been written into the CSS measured out, on screen, at exactly one height.

`test40` guards all of it — 86 assertions, over the CSS as the browser sees it
(every `<style>` block concatenated, comments stripped, rules parsed to
selector/body pairs) plus the live DOM for the rank swaps and the latch. It
asserts guarantees rather than values: *nothing rises*, *no control invents its
own corner*, *no control is defined twice*, *no control opts out of the focus
ring*, *no rule parks a control between the desktop size and the touch floor*.

**12. The question stopped answering itself, again.** See `docs/ASK_PASS.md`.
`WORD_PASS` asked whether the screen says the answer before it asks the question,
found 33 of 44 traveler builds doing it, and fixed the bench. The same question
put to the question engine came back with two leaks, and between them they
covered every question of their kind.

*The pronunciation was the answer read out.* The engine asks about a part in two
directions — `partMeaning` ("What does **-penia** mean?") and `meaningPart`
("Which word part means **deficiency**?") — and both carried `pron`, which both
the Vigil and the Daily Trial print on the card under the question. On
`partMeaning` that is a reading aid for a form already on screen. On
`meaningPart` the part IS the answer, so `Which word part means deficiency?` sat
above four suffixes with **PEE-nee-ah** underneath: the player never had to know
what `-penia` meant, only which one sounded like the line they had just been
given. It was on 900 of 900 draws. `meaningPart` no longer carries a
pronunciation; it moved into the explanation — `-ectomy (EK-toh-mee) means
surgical removal` — so it teaches one beat later instead of instead of. The fix
is in the generator rather than the two renderers, because a question that never
carries the leak cannot leak it on a screen added tomorrow.

*The Vigil's eyebrow named the part it was asking for.* The line above the
question exists to say why it is worth answering — this part is on the road you
are about to walk — and it said so by printing the part, so a `meaningPart` card
read `· -PENIA IS ON THIS ROAD` directly above `Which word part means
deficiency?`. All 85 parts did it. The stake is kept and the name is dropped
wherever the prompt has not already shown it: `· THIS ONE IS ON THE ROAD AHEAD`.

Everything else that asks the player to know something was audited and was
already clean: the rune gates always ask in one register and answer in the other
(40 live gates checked), Reed Slice prompts with a meaning and labels its tiles
with parts, and the Spirit Trial's REPAIR round shows the **broken** word over
the definition — the first audit flagged it and the flag was reading the reveal
frame, where `land()` has already put the finished word on the sign because the
player has already answered.

And `test29` was guarding the wrong thing: it asserted the literal string `is on
this road`, which the eyebrow produced by printing the part. Its intent was right
and its mechanism was the leak; it now asserts the stake in either wording plus
the half it was missing.

`test41` holds the general rule — **nothing shown with a question may contain its
answer, and everything shown after the player has answered should** — over ~4,800
generated questions, 255 focused Vigil cards and 40 live rune gates. It checks
the prompt, the pronunciation, the eyebrow, the doors and the distractors, and
the other direction too: that every explanation still names the answer, so
withdrawing a hint never quietly removed the teaching with it.

### What is left — verified, not speculation

**Art.**
- Step 3 of the forge is now a card and a quality bar with the trial opening
  over it, so between trials the panel is sparse. It is only on screen for the
  ~600ms the bar takes to fill, but it could carry the piece being made.
- ~~Settings still ships iOS pill toggles and a native range input.~~ **Done** —
  the press pass. The toggle is a sliding bolt in a channel and the sliders are
  drawn by this game on both engines. ~~The Hall of Records still opens on five
  KPI stat tiles over a card grid under tab pills.~~ **Half done** — the tab
  pills are index tabs on a rule now; the five KPI tiles above them are still
  five KPI tiles, and that is the part of that screen still worth an argument.
- The chest is still a mobile-game loot box; it wants to be a lacquered document
  case with a wax seal that cracks. (Note the fiction is Mediterranean now: a
  sealed wooden *capsa* with a wax *sphragis*.)
- No `writing-mode` anywhere.
- `page()` still serves seven distinct meanings across twelve call sites.
  (`sfx.pour` and `sfx.bow` found homes in the Hall pass: the forge quenches
  with one, the spirit bows out with the other.)
- ~~Border radii are still a mix of 2/3/8/9/10/12/14/20px.~~ **Done for the
  controls** — `test40` §2 fails if a button, field, tab or latch invents its own
  corner, and seals, beads and badges stay round on purpose. What is still mixed
  is the *surfaces*: `.modal-card` is 14px, `.panel` and `.gloss-item` have their
  own, and the loot rows are 9–10px. Squaring those is a real argument about
  whether a panel is a card or a sheet of papyrus, and it should be made
  deliberately rather than as a side effect of a control pass.

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
- ~~The pretest only fires on tier 3.~~ **Done** — the word pass withheld the
  tier-2 definition and the gate moved with it (12 builds → 37). What is still
  open is the tier-1 end of the same argument: tier 1 prints the definition as
  its prompt, which is right for a first teaching moment but means seven builds
  never ask for retrieval at all. A tier-1 *repeat* — the same traveler met
  again later — could withhold it and earn the guess.
- Around 24 terms and 19 parts are still never introduced by a traveler. The word
  pass made the tray reach further into that pool as distractors, so more of them
  are now at least *seen* under pressure, but seeing a part as a wrong answer is
  not being taught it.

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
