# The Press Pass — the control layer, made one object

Every previous pass in this file has been about a *system*: what the road does,
what the bench buys, what the walk says. This one is about the thing the player's
hand is actually on. There are seventy-one buttons in `RemyDee_TheLostLexicon.html`
and, before this pass, no two screens agreed on what a button was.

Measured against `NORTH_STAR.md`: Pillar II (*progression you can see one step
ahead* — a screen that does not say which button is the way forward is a screen
that hides the next step) and Design Rule 3 (*the player's hand is free*).

---

## 0. The sentence that was already written, and that nothing obeyed

Somewhere in the middle of the file, above the Trial's answer stones:

> **CARVED STONE, NOT A WEB CHIP.** These are the surfaces the player chooses
> with. A card that lifts toward the cursor is a webpage; a stone that presses in
> when you push it is an object.

That is the right sentence. It named two selectors — `.trial-opt` and
`.diff-card` — and by the end of the file **both of them had been overridden by a
later `<style>` block that put the lift back**. Meanwhile the icon buttons rose
1px, the ability pills 3px, the arcade cards 4px, the commission cards 2px, the
material cards 3px, the spirit seals 3px, and STRIKE — the hammer coming down on
the anvil — rose 2px to meet the cursor and then dropped 2px *below* its own
resting line.

This pass is that sentence, applied to the whole layer and held in place by
tokens and by `test40.js`.

---

## 1. One press language

Four tokens, at the top of the file with the rest of the design tokens:

| Token | What it is |
|---|---|
| `--ctl-rest` | the object sitting on the surface: a hairline of light along its top edge, its own weight below it |
| `--ctl-press` | the same object pushed in: the light goes out, the shadow comes inside |
| `--ctl-sink` | `1px` — a press is *felt*, not watched |
| `--ctl-snap` | `.09s` — a press has to answer within a frame or two |

The two face colours are registered with `@property` so the gradient actually
interpolates — a custom property is a string until it is typed, and a string
cannot be tweened, so the button would otherwise snap to its hover colour while
the hairline above it faded in over 140ms: two speeds on one control. Browsers
without `@property` get the snap, which is the old behaviour and not a fault.

Nothing rises. Hover is the cursor *finding* a control — a gold rule drawn inside
its own edge, or its pigment deepening — never the control coming to meet the
cursor. The distinction matters most on the road, where the pointer is also the
steering: every pass of the mouse over the HUD rail used to set the whole bar
twitching.

**The one exception, written into the CSS so it is not tidied away by rule next
time:** `.tile`, `.frag`, `.rack-item`, `.held-item` and `.ct-tile` still lift.
They are the pieces of a word and the kit on a rack — things the player *picks
up* and puts somewhere. Lifting is the correct verb for a thing being taken;
pressing is the correct verb for a thing being chosen. Every surface in the game
now does one or the other, and none of them does both. `test40` §1 fails if a
sixth name joins that list.

---

## 2. Three ranks, not five colours

`Not today` and `Build their terms →` sat side by side at identical weight, so
the case screen never said which one was the road forward. The title screen
offered `Begin the journey`, `Lexicon` and `Training Hall` as three equals.

| Rank | Class | What it is | Where |
|---|---|---|---|
| Primary | `.btn` (+ `.lg`) | a block of cinnabar pigment with an inked edge | the one way forward on a screen |
| Secondary | `.btn.ghost` | a label inked on the page: parchment, ink-line edge, ink text | real alternatives |
| Tertiary | `.btn.quiet` | no fill and no edge until you reach for it | walking away |

`.verd` (a confirm) and `.gold` (a bronze plate) sit inside the primary rank as
tone, not as extra ranks. Gold at rest used to be almost the value of the paper —
the Hall button on the hub read as disabled — and now has an edge to sit on.

The border of every rank is a darker mix of **its own colour** rather than
near-black on everything. That one change is most of what separates a lacquered
block from a bordered rectangle.

**The safe answer is the easy one.** The pause menu's "turn back and lose this
road" confirm made the destructive option the loudest button in the dialog and
the one that keeps the player's progress the quiet one. They are swapped: *Stay
on the road* is the large block, *Yes, turn back* is the quiet rank underneath it.

**Continue outranks Begin.** With a save on disk, `Continue` takes the large
cinnabar block and `Begin the journey` steps down to ghost. They trade ranks in
`showTitle`; `test40` §7 proves the swap runs both ways and that neither loses
its handler.

The stock shiny-button gleam — a white diagonal sweeping across the primary
action on hover, on the same screen as a hand-painted brush underline — is gone.

---

## 3. Radii come from the tokens

The token set says `2 / 3 / 4`. The controls said 7, 8, 9, 10, 12, 14, 16, 20,
100 and 999: an 8px topbar chip, a 16px iOS capsule, a 100px tab pill, a 14px
difficulty card. All of them now take `var(--r-sm)` or `var(--r-md)`.

Round is still a meaning here, and the exceptions are deliberate: the seal, the
HUD beads, the charge counts, the pips, the badges. `test40` §2 asserts that no
*control* invents its own corner while leaving those alone.

---

## 4. Two of every control

Three classes were styled and had never been used at all — `.toggle`,
`.setting-row`, and half of `.seg` — and two more were declared **twice, in
different `<style>` blocks, with different values**:

- **`.seg`** existed as a 10px flex-with-gap version whose children were
  `.seg button`, and as a 9px overflow-hidden version whose children were
  `.seg-btn`. Whichever lost took its children with it. The call site builds
  `.seg-btn`, so that pair survives.
- **`.gloss-search`** existed at 9px and at 10px. It also asked for
  `var(--font-body)`, which is not a token this file defines — so the one search
  box in the game was falling through to the browser default face.

`test40` §3 fails if any control grows a second base definition.

---

## 5. The settings screen, made of this game's parts

The handoff named Settings as one of the two most generic screens in the game.
It was: iOS pill toggles and a native `<input type=range>` wearing Chrome's
default accent.

- **The latch.** The pill is a sliding bolt in a channel — a recess cut into the
  parchment, a knurled bronze bolt, and one scored line running the length of the
  track with half of it covered at any moment. **Which half is showing is the
  state**, so the control still reads with the colour taken away; the old pill
  was hue and nothing else, which a red-green colourblind player reads as one
  state. Same DOM (`<button class="switch"><i></i></button>`), so no JS moved.
- **The sliders** are drawn by this game on both engines — the same channel and
  the same bronze bolt, `-webkit-` and `-moz-`. `accent-color` is gone.
- **The segmented control** presses its chosen segment *in*. It was the only
  control in the game whose selected state popped *out*.
- **On a phone**, each row stacks label-over-control under 560px. Text size's
  fourth segment, `Huge`, was being cut off by the edge of the card — on the one
  control a player with poor eyesight has come to that screen to reach.

---

## 6. The Hall's sections are tabs

Four 100px capsules with a solid-black selected pill, above five KPI stat tiles.
They are index tabs on a ledger now: the row sits on a hairline rule and the
section you are reading is marked on that rule in cinnabar.

---

## 7. Forty-four pixels, everywhere, once

`.btn.sm` was about 26px tall and `.small-btn` about 22px, and both are on the
hub, which is the first screen a phone opens. Each control had to be measured on
its own before. The floor is a token now (`--ctl-min`, set to 44px under
`@media (pointer:coarse)`), so a control added later cannot be born too small to
hit.

Four things were quietly defeating it, and **every one of them was a rule in a
later `<style>` block beating an earlier one** — which is the failure mode this
file is shaped to produce and the reason the floor is now a token:

- A later media block set the icon buttons to **40px** — five pixels of good
  intention. A size between the desktop 38 and the touch 44 is always that
  mistake: either a control is at its desk size or it is at thumb size.
- `.icon-btn.sm` is 30px, which is right on a desk (it is a mark beside a word in
  the Lexicon, not an action) and sits later in the file than *both* touch
  floors — so the Lexicon was a list of eighty-odd 30px targets.
- `.tag.filter` had its own `pointer:coarse` rule at 40px, also later.
- `.set-row` becoming a column on a phone turned the latch's `flex:0 0 58px`
  from a *width* into a *height*, so the bolt sat in the top corner of a 58px box.

And a two-letter `Set` button is 39px wide however tall it is, so `.btn.sm` and
`.small-btn` take a `min-width` on coarse pointers as well.

Measured in real Chromium with a touch context: **every control in the game now
clears 44×44**, and the harness that measures it is in this pass's history.

---

## 8. Defects that fell out of it

- **The focus ring reshaped what it landed on.** `:focus-visible` set
  `border-radius:4px` — which is the *element's* radius, not the ring's. Tabbing
  onto a 2px seal-edged button rounded the button off, and tabbing onto a 999px
  HUD pill squared it. Every control in the game changed shape at the moment the
  keyboard reached it.
- **Three controls had talked their way out of the focus ring entirely.**
  `.comm-card` and `.variant-btn` carried `outline:none` — on the two screens
  where the player chooses what to forge — and `.arcade-card` and `.sp-seal`
  carried `outline:3px solid var(--gold)`, which is the 2.18:1 gold-on-parchment
  the global ring was written to avoid.
- **`#build-pron` was never closed.** The Pronounce button at the builder has no
  `</button>`, so `Stamp the seal` was written inside it. The parser recovers by
  implicitly closing the outer button, which is why nobody noticed.
- **The forge's decode answers were colour and nothing else.** The Trial's own
  answers were given a glyph, a weight change and a border that differs in *kind*
  precisely so the colour is confirmation rather than the message; the forge's
  decode was never brought along and its right/wrong differed only in hue, at
  effectively identical luminance. Same treatment now.
- **`.cinnabar-btn` froze the button it marked.** The road's wrong-answer marker
  set `background` outright, which beats the face variables — so the button it
  landed on lost hover, press and disabled all at once. It sets the face now, and
  carries a struck-through label and a dashed edge, because it too had been
  marking a wrong answer in colour alone.
- **Disabled was mud.** `grayscale(.6) brightness(.9)` over cinnabar is a brown
  smear that still reads as the loudest thing on the panel. A button that is
  doing nothing looks like paper now.
- **The seeded-road box and its Set button** were an 8px-radius input and a
  2px-radius button at two different heights with a gap down the middle. They are
  one instrument.
- **The rows that hold buttons were stretching them to one height.** `display:flex`
  with no `align-items` makes every child as tall as the tallest, so the moment
  the title screen got a large primary it inflated both second-rank buttons to
  match — the hierarchy was in the stylesheet and cancelled by the box. Four rows
  (`.title-actions`, `.brief-actions`, `.build-controls`, `.temper-row`) centre
  their children now, and `test40` §6 fails if one stops.

---

## What this pass did not touch

The modal card is still 14px and the panels are still their own radii — those are
surfaces, not controls, and squaring them is a different argument that should be
made deliberately rather than as a side effect of a button pass. The road's own
canvas-drawn affordances are untouched. `page()` still serves seven meanings.

## Verifying it

```
node syntaxcheck.js
for t in 6 7 8 ... 39 40; do node test$t.js | tail -1; done
node browsercheck.js            # real Chromium; --shots writes PNGs to ./shots
```

`test40.js` is 86 assertions over the CSS as the browser sees it (every `<style>`
block concatenated, comments stripped, rules parsed to selector/body pairs) plus
the live DOM for the rank swaps and the latch. It asserts guarantees, not values:
*nothing rises*, *no control invents its own corner*, *no control is defined
twice*, *no control opts out of the focus ring*, *no rule parks a control between
the desktop size and the touch floor*.

`browsercheck.js` is the other half, and it is the half that matters most here.
It boots the game in real Chromium, drives it to the hub, the settings card and
the Lexicon in an iPhone touch context, and reports every control under 44x44,
every control deformed by its container, anything running past the edge of the
card it lives in, and whether the button ranks are actually three different
sizes. It found four faults after `test40` was already green:

- the Lexicon is a list of eighty-odd `.icon-btn.sm` pronounce buttons, and that
  rule sits in a **later `<style>` block than both touch floors**, so the whole
  screen was 30px targets;
- `.tag.filter` had its own coarse rule at 40px, also later;
- a two-letter `Set` button is 39px wide however tall it is;
- and `.title-actions` is a flex row, which stretches its children to the tallest
  by default — so the large primary was inflating both second-rank buttons to
  match it and **every button on the title screen measured out at exactly one
  height**. The hierarchy was in the CSS and not on the screen.

That last one is the lesson of this pass in one line: a rule that is correct in
the stylesheet can be cancelled by the box it lands in, and only a browser will
tell you. Every defect in §8 was found by taking a screenshot and looking at it,
or by measuring the live layout. None of them is visible to jsdom.
