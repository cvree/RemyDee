# The Frame Pass — the game as a lit scene, not a lit document

Every pass before this one was about a *system*: what the road does, what the
bench buys, what the walk says, what the hand is on. This one is about what the
player is looking **into**. The complaint it answers is one sentence: the
interface read as a webpage laid over a painting rather than as something
standing inside one.

Measured against `NORTH_STAR.md`: Pillar II (*progression you can see one step
ahead* — a screen whose blocks start at four different left margins is a screen
with no reading order) and the standing instruction that everything here is CSS,
inline SVG and canvas. Nothing in this pass adds an asset, a library or a
kilobyte of image data. It is gradients, one mask, and one class.

---

## 0. Three causes, and not one of them was a colour

**ONE — the grade never reached the interface.** `.vignette` is real and it
works, and it lives inside `.backdrop` at z-index 3 while `.content` is at
z-index 4. So the corners of the *scenery* fell away into shadow while every
panel, heading and button above it stayed lit at exactly the brightness of the
middle of the frame. A scene has one light. When only the wallpaper obeys it,
the furniture is a decal stuck to the glass.

**TWO — nothing arrived.** `screenIn` fades a screen in as a single block, so a
heading, the rule under it and eight panels all resolve on the same frame: the
visual signature of a page load, which is the one thing a cut never looks like.

**THREE — everything was centred, at full width, at a different width each
time.** The title was a stack down the middle of the frame with three buttons in
a row and the legal note directly under the call to action, competing with it.
The difficulty screen ran its explanation across a 130-character line and flung
its two buttons to opposite edges of a 1440px frame. And the Training Hall laid
out its heading at 845px, its intro at 441px and its card menu at 1014px, each
centred on its own width — four different left edges on one screen.

---

## 1. The grade

One lens over the whole frame, as two pseudo-elements on `#frame` at z-index
300: above the screens **and above the modals**, because a light that stops at
the edge of a dialog is not a light; below the transition wipe (z 400) so a cut
still covers it, and below the skip link so the first thing a keyboard reaches
is never behind glass. `pointer-events:none` — it can never be clicked.

`::before` carries the key and the bowl. The key is a warm radial, high and a
little left of centre, and it stays modest: **a scene is not made cinematic by
brightening one part of it, it is made cinematic by taking the light off
everywhere else.** The bowl is a wide falloff whose stops are deliberately far
apart, because a vignette you can find the edge of is a black ring.

`::after` carries the tooth and the edges. The tooth is the same 3px tile
`.paper-grain` already plays on the backdrop, finally reaching the things
standing on it. The edges are **four short linear falloffs rather than one
deeper bowl**, because a bowl big enough to frame the picture also reaches the
middle of it, and the middle of this picture is where the reading is. They
darken a band a tenth of the frame deep and are mathematically zero everywhere
else, so the composition gets its frame and no panel loses a point of contrast
for it.

Three numbers govern all of it — `--grade-key`, `--grade-fall`, `--grade-grain`
— held in `:root` so the theme can move them without restating the geometry.

Two places take the lens off:

- **High contrast.** A player who asked for high contrast asked for the opposite
  of a grade. `html[data-contrast="high"]` drops the key to `.06`, the falloff
  to `.16` and the grain to zero — a trace of edge so the frame still has one,
  and no film on the text at all.
- **A trial.** `Stage()` sets `html.mg-open` while a trial is up. A trial is
  already a lens — it draws its own object edge to edge with its own light on it
  — and a second vignette over that reads as a smear on the monitor.

The two side bands are the lightest of the four **on purpose**. The road spawns
its word-parts at the right edge and slides them left, so that is the one
gradient in the grade sitting on top of something the player must read the
instant it appears. A chip entering under a quarter-alpha of near-black is a
chip that has to be read twice.

## 2. The stage

`.staged`, added by `swap()` and taken off again 1100ms later. Four beats,
70ms apart: the label, the name, **the rule drawn under it** (a line is drawn,
not faded — `stageRule` scales it from its left edge), then the body, then the
thing you press.

The class has to come off again. It is a screen-*entrance* class, and the hub
re-renders its panels on nearly every action; a screen that keeps it replays the
whole cascade every time the ledger updates, which reads as the interface
flickering rather than as an entrance.

Reduced motion removes the entrance outright rather than playing it faster. The
global rule crushes every duration to a millisecond, which on eight staggered
panels is a strobe. `swap()` also gates `.staged` behind `FX.reduced()`, so on
that path nothing is ever staged at all — verified in a browser: at 120ms after
the swap every element is already at opacity 1.

## 3. The shell

One width (`--shell`, 1280px) applied to a screen's heading **and** to what it
heads, so the two agree at every frame size, plus `--gutter` and `--gutter-y` for
the air the letterbox is framed by and `--measure` (62ch) for the width a line of
prose is allowed. The topbar restates the same arithmetic against its own width,
because it spans the whole frame and a percentage there would resolve against
the frame rather than against the content box under it.

`--shell-inset` is that offset expressed as a margin, for blocks that want the
shell's left edge but not its width — the percentage resolves against the
containing block at the point of use, which is exactly the arithmetic
`margin:0 auto` was doing invisibly.

Measured before and after, at 1440x900, left edge in px:

| screen | before | after |
|---|---|---|
| hub — topbar / head / grid | 80 / 80 / 80 | 80 / 80 / 80 |
| party brief — topbar / wrap | 80 / 266 | 80 / 80 |
| Training Hall — topbar / head / lede / menu | 80 / 297 / 80 / 213 | 80 / 80 / 80 / 80 |
| difficulty — head / cards | 160 / 160 | 80 / 80 |

The workbench is deliberately **not** on the shell. It is a symmetric
composition — a tray, a rack and a row of tools, all centred on their own axis —
and dragging it to a left margin would only make it lopsided. It got the other
half of the fix instead: `#s-build .content` joins the five screens that centre
their content vertically, so it no longer sits against the top rail with 170px
of dead frame under it.

### The flex-column trap

Five screens centre their content with `display:flex;flex-direction:column;
justify-content:center`, and every block inside them carried
`max-width:N;margin:0 auto` from the days when `.content` was an ordinary block.
**In a column flex container an auto inline margin overrides the default
`stretch`**, so those blocks stopped filling their max-width and became
shrink-to-fit, each centred on its own content. `width:100%` gives the max-width
back its meaning. This is what the Training Hall's four left edges were.

And `justify-content:center` in a scroll container clips the **top** of anything
taller than the container, with no scrolling back to what it pushed out. All six
now say `justify-content:safe center` after the plain `center`, so a browser
that knows the keyword falls back to flex-start exactly when that would happen
and one that does not keeps the behaviour that is already shipping.

## 4. The horizon

Three hard horizontal lines ran the full width of the picture and they were the
loudest thing in it. Each ink-wash ridge is a div 60% of the frame tall whose
bottom is pinned at 20%, 33% and 46%, and `mountainPath` fills from its own crest
all the way down to that pin — so every ridge ended in a **guillotined straight
edge across the entire frame**, one of them directly through the game's own
subtitle on the title screen.

A ridge in a wash does not end; it goes into the haze. `buildBackdrop` marks
ridge layers `.ridge` and the stylesheet feathers the bottom third of each one.
The temple and the cypresses are `.layer` too and are deliberately not `.ridge`
— those two stand on the ground and have to keep their feet. For free, this is
also the thing that was missing from the scene as a scene: distance reading as
distance.

## 5. The title

The main menu of a story game is not a centred stack. It is a plate of type held
against one side of the frame with the scene visible in the rest of it, and its
options are a list you read down, not a toolbar you scan across. The three
buttons are a column; the legal note, which used to sit directly under the
primary button at body size — so the last thing the composition said before
"Begin" was a disclaimer — is a footer rule at the foot of the frame.

`align-items:stretch` on that column is deliberate and is **not** the mistake the
note on `.title-actions` warns about. That one was a ROW stretching ranks to a
common HEIGHT and erasing them. In a column, stretch equalises WIDTH, which is
what makes a menu read as a menu; the ranks stay distinct because they differ in
weight and in height, which a column never touches. `browsercheck.js` §4 still
measures the primary at 52px against the second rank's 45px.

On a portrait phone there is no "rest of the scene" to hold the plate against —
a left-anchored plate there is just a wide left margin — so it goes back to
centre, and the tagline's three phrases stack as three tracked lines instead of
wrapping with a separator hanging off the end of one.

## 6. Two things found by measuring

Neither was visible until something was put next to it.

**The difficulty cards are `<button>` elements, and the user-agent stylesheet
centres the contents of a button.** Every card in the row is stretched to the
tallest, so the three with less to say had their whole stack pushed down by half
of what they were short: Gentle's title sat 9px above Steady's for no reason the
markup could show, on the one screen in the game whose entire job is showing
four options as parallel. The glyphs compounded it — an inline span sizes its
line box from the glyph in it, and `◔ ◑ ◕ ◍` are four different heights. Fixed
box, and a column that starts at the start: all four titles now land on 441.
`.arcade-card` has the same button-centring and four cards of identical length,
so it never showed — and stretching *its* children turns the "MEANING RECALL"
pill into a full-width bar, which is why it is not in that rule.

**A single traveler in a 1280px shell became a single 1280px card.** The cap
goes on the card, not on the track: `minmax(250px,460px)` would hand a 368px
phone a 460px column and push it off the side of the screen.

## 7. The cascade ends here

This is the **last stylesheet in the file**, so an unguarded rule in it outranks
every media query above it. Four of the phone's deliberate tightenings were
being silently undone and are restated at their own breakpoints — `.content`
padding, `.topbar` padding, `.section-head h2`, and, worst, `.hub-grid`, whose
restated grid template beat `@media (max-width:860px){grid-template-columns:1fr}`
and put a 390px phone back into two columns with "The School of Kalamos" wrapping
one word per line.

**Anything added to that block from now on has to answer the same question: is
there a media query above it that says something different?**

---

## How this was verified

`node syntaxcheck.js`, all 35 jsdom suites (1518 assertions, zero window errors)
and `node browsercheck.js` are green before and after. None of it would have
caught any of the above: every defect in this pass was found by taking a
screenshot in real Chromium and looking at it, or by measuring an element's
`getBoundingClientRect().left` on two screens at two viewport widths and
noticing they disagreed.

The choreography was verified by sampling computed opacity through the
entrance rather than by eye — at 760ms the eyebrow is at 0.94, the heading at
0.82, the first panel at 0.67 and the fourth at 0.06, which is the cascade; by
1300ms `.staged` is gone and everything is at 1.

## Known, and left alone

`#radix-hub` is `position:absolute` at the frame's bottom-left with `z-index:5`,
over content at z-index 4. On a phone, where the hub is one full-width column,
the fox floats over whatever has scrolled under it. This predates the pass and
moving a mascot is a design decision rather than a styling one, so it is written
down here rather than changed.
