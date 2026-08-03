# Remy Dee — handoff

Paste the block below into a fresh conversation to continue this work.

---

## Prompt

You are continuing an overhaul of **Remy Dee: The Lost Lexicon**, an educational
adventure game that teaches real medical terminology. Repo: `cvree/RemyDee`,
working dir `/home/user/RemyDee`. Live at https://cvree.github.io/RemyDee/ —
every push to `main` redeploys it via `.github/workflows/pages.yml`.

### What this project is

One self-contained file: `RemyDee_TheLostLexicon.html` (~850KB, ~14,400 lines).
CSS in `<style>` blocks, markup in the middle, **9 inline `<script>` blocks**.
This must stay a single file — no image, font or audio assets can be added.
Everything visual is CSS, inline SVG and canvas; all sound is procedural
WebAudio. Four CDN libraries (GSAP, THREE, Vanta, Lenis) plus Google Fonts are
loaded but **every use is behind a feature detect with a working fallback** —
and the CDN is blocked in the dev container, so you always test the offline
path whether you mean to or not.

Modules talk through globals: `window.__RD_DATA`, `__RD_ENG`, `__RD_QE`,
`__RD_FX`/`window.FX`, `__RD_SCREENS`, `__RD_PREP`, `__RD_MISSION`,
`__RD_ARCADE`, `__RD_META`, `__RD_MODAL`. Prefer adding to a module over
editing across blocks.

Design constitution: `docs/NORTH_STAR.md`. Also `docs/GAME_PLAN.md`,
`DEPTH_PLAN.md`, `WALK_PASS.md`, `MAKERS_PASS.md`.

### How to verify anything

```
npm install jsdom playwright          # node_modules is gitignored
node syntaxcheck.js                   # parses all 9 script blocks
for t in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 28 29; do node test$t.js | tail -1; done
```

23 jsdom suites, **889 assertions, all passing, zero window errors**.
`testlib.js` is the shared harness (mocks AudioContext, canvas 2d, strips CDN
scripts, counts window errors). Always run the full suite — several passes here
broke a distant test.

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

Two large passes. The first (merged as `af1dc05`) fixed learning correctness,
built the meta layer, added three lieutenants, hardened saves, and did the art
and accessibility groundwork — see the git log for detail.

The second pass, in `main` now:

1. **Learning integrity.** `completeTerm` recorded every completed chain as
   correct practice for every part in it — but only 55 of the 1,290 two-part
   chains the road can produce are real terms. Credit is gated on a real term
   now; coined chains keep momentum and get told what they built.
2. **The scheduler.** Measured chasing weak items at only 1.38x; now 3.5–3.9x,
   asserted in `test24.js`. One lucky guess used to end the learning queue; the
   resting floor ignored lapses; a 24-run interval cap retired parts for the
   rest of a campaign nowhere near 24 runs long.
3. **Distractors.** Parts carry a `sense`; same-sense parts never meet. 57 of
   4,000 generated true/false items had been graded wrong because the game
   teaches `endo-`/`intra-` as twins and then marked one of them incorrect.
4. **Fifteen factual corrections**, worst of which was a combining-vowel note
   that spells its own example wrong (`cardi/o + -itis` does not give
   `cardiitis`).
5. **The corpus grew**: 73 → 84 parts, 67 → 77 terms. Latin partners for
   `nephr/o`, `rhin/o`, `ot/o`, `pneumon/o` take Greek/Latin twin pairs from 3
   to 8; `-al`, `-ic`, `-ary`, `-logist`, `-plasty`, `-stomy` arrive with nine
   real terms. Every one of the 84 parts now appears in at least one term.
6. **The first minute.** Difficulty chooser off the cold path (new games are
   `adaptive`; it is offered once after the first road). Seven-panel prologue is
   one scrolling page. Eleven clicks to the first real decision became three.
   The page carries a combining-vowel primer the game never had.
7. **The road is a decision.** Word-parts arrive in *offers* — two or three at
   once in different bands, at most one finishing a real term. The combo HUD
   names the *meaning* that would finish the word instead of saying "suffix?".
8. **Legibility and access.** Road HUD text had no ink behind it; a `main`
   landmark and skip link were missing entirely; eight map buttons claimed to be
   list items; Lexicon filter chips were 17px tall.
9. **The Lexicon teaches.** Every part now shows its tongue, its ancestor word,
   and the terms that use it — all three were already in the data and none were
   shown.
10. **The Vigil** (`__RD_META.openVigil`, screen `s-vigil`). A study step between
    the bench and the armory, gated by `toArmory()` in the prep module and run
    once per road. Eight questions drawn from *this* road — the terms the company
    just named, its travelers' terms, then SRS arrears. Its result is written to
    `flow.vigil` and read by five systems: `computeForgePassives` (momentum
    floor, gain, ink value), `computeAbilities` (charges), the mission's opening
    `stats`, `pickRoadPart` (shaky parts are weighted *above* historically weak
    ones), and `collectPickup` (studied parts pay a bonus). `renderVigilBrief()`
    restates the ledger on the armory screen.
11. **The frame fills the window.** `#frame` lost its 1320x840 cap and the base
    font-size tracks viewport height, so the road is legible on a large display.
12. **Three verbs on the road.** `tryLunge` (click / Shift — reach, or shove a
    hazard, on a cooldown, costs stamina) and `setFocus` (right-click / F — the
    road drops to 0.38 speed while stamina drains). Both run from `stepHands(dt)`
    in the tick and are exported as `__RD_MISSION._lunge/_focus` for the suite.
    The control hint retires after three roads; the pause menu carries the full
    key legend permanently.

### What is left — verified, not speculation

**Art (from the art audit; P1/P2 not done).**
- Everything is a rounded web card: `--r-md:12px`, `--r-lg:22px`, `.panel`,
  `.modal-card`. Proposal: radius 12→3, carved-stone option buttons that press
  *in*, lacquer buttons (kill the `0 5px 0` Material shadow).
- `screenIn` animates `scale(.995)` — imperceptible.
- Silhouettes are crude: `portraitSVG` is a square `<rect>` in a round mask,
  `walkerSVG` limbs are literal `<rect>`s, `radixSVG` is a Western cartoon fox
  in a Ming ink game.
- The difficulty screen leaves the bottom half of the frame empty.
- No `writing-mode` anywhere — no vertical seal text.

**Performance (P2 — nothing is slow enough to hurt yet).**
- Cache the per-frame `document.querySelector` calls in `updatePrepBars`,
  `updateMomentumMeter`, `updatePaceGauge` and `rubPaint` at mission/craft start.
- Road sky, bench felt and `drawHeat` gradients are rebuilt every frame; build
  once per canvas resize.

**Learning design (from the learning audit; the corpus fixes are done, these
are not).**
- The road's rune gates still teach only with a one-line caption that scrolls
  away — the mini-challenge got a proper lesson beat, gates did not.
- Chapter 7 introduces no new vocabulary; the finale asks for nothing new.
- 24 terms and 19 parts are never introduced by a traveler — they exist only as
  quiz material.
- `showReveal` presents the breakdown; it would teach harder if it asked "what
  do you think this means?" before showing it (the pretesting effect).

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
