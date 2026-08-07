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
`DEPTH_PLAN.md`, `WALK_PASS.md`, `MAKERS_PASS.md`.

### How to verify anything

```
npm install jsdom playwright          # node_modules is gitignored
node syntaxcheck.js                   # parses all 10 script blocks
for t in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 28 29 30 31 32 33; do node test$t.js | tail -1; done
```

27 jsdom suites, **1125 assertions, all passing, zero window errors**.
`testlib.js` is the shared harness (mocks AudioContext, canvas 2d, strips CDN
scripts, counts window errors). Always run the full suite — several passes here
broke a distant test.

**The Trials need a headless escape hatch.** `__RD_MG` sits in the middle of the
chest, cache, slide, spring and forge-proof flows, and it is a hand-skill
challenge that jsdom cannot play. `testlib.js` calls `__RD_MG.setAuto(2)` after
boot, which resolves every trial instantly at a clean grade; a suite that wants
to prove a grade *changes* an outcome sets its own tier (`setAuto(0)` /
`setAuto(4)`) and puts it back afterwards. Anything that opens a chest or fires
a road event is now asynchronous — `await until(...)`, do not assert on the
next line.

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

### What is left — verified, not speculation

**Art.**
- Settings still ships iOS pill toggles and a native range input with Chrome's
  default accent; the Hall of Records still opens on five KPI stat tiles over a
  card grid under tab pills. Those two screens are the most generic in the game.
- The chest is still a mobile-game loot box; it wants to be a lacquered document
  case with a wax seal that cracks. (Note the fiction is Mediterranean now: a
  sealed wooden *capsa* with a wax *sphragis*.)
- No `writing-mode` anywhere.
- `sfx.pour` and `sfx.bow` are defined with zero call sites; `page()` still
  serves seven distinct meanings across twelve call sites.
- Border radii are still a mix of 2/3/8/9/10/12/14/20px against a token set that
  says 2/3/4. The decode chips and the gate prompt were brought in line; the
  rest were not, because pills and seals legitimately want round.

**Performance.** The road holds 59.9fps with a 16.7ms median frame. Still open:
`rubPaint` builds attribute selectors in a template literal every bench frame,
and the bench felt and `drawHeat` gradients are rebuilt per frame.

**Learning design.**
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
