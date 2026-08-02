# Remy Dee — handoff

Paste the block below into a fresh conversation to continue this work.

---

## Prompt

You are continuing an overhaul of **Remy Dee: The Lost Lexicon**, an educational
adventure game that teaches real medical terminology. Repo: `cvree/RemyDee`,
working dir `/home/user/RemyDee`.

### What this project is

One self-contained file: `RemyDee_TheLostLexicon.html` (~800KB, ~13,700 lines).
CSS in `<style>` blocks, markup in the middle, **9 inline `<script>` blocks**.
This must stay a single file — no image, font or audio assets can be added.
Everything visual is CSS, inline SVG and canvas; all sound is procedural
WebAudio. Four CDN libraries (GSAP, THREE, Vanta, Lenis) are loaded but every
use is behind a feature detect with a working fallback.

Modules talk through globals: `window.__RD_DATA`, `__RD_ENG`, `__RD_QE`,
`__RD_FX`/`window.FX`, `__RD_SCREENS`, `__RD_PREP`, `__RD_MISSION`,
`__RD_ARCADE`, `__RD_META`, `__RD_MODAL`. Prefer adding to a module over
editing across blocks.

Design constitution: `docs/NORTH_STAR.md`. Also `docs/GAME_PLAN.md`,
`DEPTH_PLAN.md`, `WALK_PASS.md`, `MAKERS_PASS.md`.

### How to verify anything

```
node syntaxcheck.js                      # parses all 9 script blocks
for t in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23; do node test$t.js; done
```

18 jsdom suites, **765 assertions, all passing, zero window errors**. `testlib.js`
is the shared harness (mocks AudioContext, canvas 2d, strips CDN scripts).
Always run the full suite — several passes here broke a distant test.

To see it for real, Playwright + the preinstalled browser:
```js
chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
```
**Do this.** Two real regressions in the last pass (a focus ring boxing every
screen title, and props stretched into slabs) were invisible to jsdom and
obvious in one screenshot.

### What has been done

Merged to `main` (`af1dc05`). Eight passes:

1. **Learning correctness.** `cvRule` decided "keep or drop the combining vowel"
   by string-matching the spelling for `logy|gram`, so ~20 terms were graded
   backwards and then shown an explanation proving the player right. Now reads
   the rule off the data. Also: `spelling` distractors were other real terms;
   `similar` was a coin flip; `bodySystem` offered Circulatory *and*
   Cardiovascular; `osteoarthritis` was defined as inflammatory.
2. **The Two Tongues.** All 73 word-parts carry `lang` (Gk/L) and `src`
   (ancestor word). `TWIN_ROOTS` derives Greek/Latin pairs from the data.
   Three new question types.
3. **The Chronicle.** 16 figures in the history of medicine, each with a deed,
   a legacy, and a plausible falsehood the villain asserts. Four question types,
   deliberately kept off survival gates.
4. **Real spaced repetition.** SM-2 per part and per term, counted in *runs*
   not days, with a learning queue so a just-missed part stays in front of the
   player. The re-ask debt persists across runs.
5. **The meta layer** (`__RD_META`): 38 trophies, 16 relics in 4 sets whose
   effects are folded into `diffTune()`, chests with an earned rank, the
   **Daily Trial** (12 questions seeded off the UTC date, identical for every
   player), and the Hall of Records.
6. **Three mid-campaign lieutenants** (ch2/ch4/ch6) — Praefixa demands prefixes,
   Terminus suffixes, Bilingua alternates Greek and Latin.
7. **Robustness.** Five reproduced bugs: a future-version save wiped the
   campaign; `mastery:null` crashed the hub; a partial `settings` threw at boot;
   the Daily Trial kept its clock running after you left the screen and burned
   all three lives off-screen; chests granted while one was open were silently
   discarded. Plus: 11 authored travelers could never build their term (now all
   43 do), a rAF Set that grew one entry per frame forever, and spam-clicking
   depart leaving 6× render loops.
8. **Accessibility + art.** Pinch-zoom was disabled; `prefers-reduced-motion`
   was ignored in CSS; right/wrong was hue-only at 1.00:1 in greyscale; focus
   was never managed. Then a scene table (every screen used the identical
   backdrop), seeded brushed ridges with SVG ink filters, an impact layer
   (`FX.shake/impact/pop` — the game had *no* screen shake at all), and a real
   music state machine (it was a random-note generator, and the road was silent).

### What is left — verified findings, not speculation

Three audits produced these. They are real and were measured; they were not
reached before the handoff.

**First-minute experience (highest priority — the brief asks for a "wow" in the
first minute and this is the weakest part of the game).**
- 11 clicks and ~450–600 words of reading before the player does anything
  skillful. Path: `showTitle 5044` → `showDifficulty 5002` → `startIntro 5091`
  (7 prose panels, 169 words) → `showHub` → `openChapter` → `openBuilder`.
- `showDifficulty` asks the player to price "hazard density" and "gate read
  time" — four nouns that do not exist in their head yet — and already defaults.
  Recommendation: cut it from the cold path (keep `adaptive`), surface it on the
  results screen after the first road. Collapse the 7-panel intro to one
  scrollable page.

**Art (from the art audit, P1/P2 not yet done).**
- Transitions: `TRANSITION` map omits `s-arcade` and `s-title`; `showTitle`
  passes `instant:true`, so returning from the ending is a hard cut. No held
  beat, no letterbox, no camera push. `screenIn` animates `scale(.995)` —
  imperceptible.
- Everything is a rounded web card: `--r-md:12px`, `--r-lg:22px`, `.panel`,
  `.modal-card`, `.trial-opt`. Proposal: radius 12→3, carved-stone option
  buttons that press *in*, lacquer buttons (kill the `0 5px 0` Material shadow).
- Silhouettes are crude: `portraitSVG` is a square `<rect>` inside a round mask
  with a `<circle>` head; `walkerSVG` legs and arms are literal `<rect>`s;
  `radixSVG` is a Western cartoon fox (white sclera, pupil highlights) in a Ming
  ink game.
- `FX.countUp` exists and is used 4 times. The Trial score never counts up.
- No `writing-mode` anywhere — no vertical seal text.
- Without the font CDN the entire calligraphic identity falls back to Times.

**Accessibility (measured contrast ratios).**
- `.topbar .brand b` cinnabar on ink **2.99**; `.cr-row .cr-pip` **2.48**;
  `.assembly .placeholder` **3.59**; `.gloss-search:focus` **1.23**.
- `html[data-contrast="high"]` *regresses* `.btn.gold` from 7.05 to **3.91**.
- `#sliceCanvas` and `#craftCanvas` are keyboard-unplayable (pointer events
  only, no tabindex). The road itself is fine — W/S/arrows/Space/1-2-3/G.
- No `<main>`, no landmarks, no skip link.
- `.map-node` uses `role="listitem"` on a focusable Enter/Space handler (should
  be `role="button"`); `.diff-card` carries selection as a class only.
- WCAG 2.2.1: the Trial's 15s clock extends only to 24s via `timerRelax`, whose
  settings label never mentions the Trial.
- `.tile{touch-action:none}` freezes scrolling when a drag starts on a tray tile.
- Road steering binds `pointerdown` on **`window`**, so tapping the pause button
  also steers the caravan. `.mission-hint` still says "Lead the squad with the
  **mouse**".

**Performance (measured, all P2 — nothing is slow enough to hurt yet).**
- 11 `document.querySelector` per road frame (`updatePrepBars`,
  `updateMomentumMeter`, `updatePaceGauge`); 16 per frame on all 7 bench crafts
  (`rubPaint` builds attribute selectors in a template literal every frame).
  Cache the nodes at mission/craft start.
- Gradients rebuilt every frame: road sky, bench felt, `drawHeat`. Build once
  per canvas resize.

**Never audited.** The gameplay/progression/rewards/replayability agent died on
a session limit and never reported. Nobody has adversarially reviewed the core
loop's pacing, the reward curves, or day-3/day-10 replayability.

### How to work

- Commit in coherent passes with commit messages that explain *why*, in prose.
  Match the existing history — read `git log` first.
- Match the file's voice in code comments: they explain the reasoning and the
  bug that motivated the code, not what the line does.
- Every behavioural fix gets a regression test. Name assertions as sentences.
- Don't trust an audit finding without verifying it in the code yourself —
  roughly one in six was wrong or already handled.

Continue making it fantastic. Start by looking at it in a browser.
