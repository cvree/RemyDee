# Remy Dee: The Lost Lexicon

An adventure game that teaches real medical terminology by making you **build**
it. Every term is assembled from its Greek and Latin parts — prefix, root,
suffix — and every word you build makes the road ahead survivable.

**Play it:** https://cvree.github.io/RemyDee/

## The loop

1. **Build** a term for a traveler who needs it.
2. **Forge** gear at the bench — a correct decode earns the good materials.
3. **Walk** the road: gather word-parts at speed and chain them into real terms.
4. **Unlock** the next pattern, the next page of the Lexicon, a bigger company.

Eight chapters, plus the Training Hall (four practice modes), a Daily Trial
that is the same twelve questions for everyone, and an Endless Road.

Every term, part and definition in the game is real and verified. The school,
the gear and the story are fiction, and naming a term is never a diagnosis.

## Running it

It is one self-contained file. Open `RemyDee_TheLostLexicon.html` in a browser.

There is no build step and there are no assets: all art is CSS, inline SVG and
canvas, and all sound is procedural WebAudio. Four CDN libraries and a web font
are used when they load and are never required — the game is fully playable
offline. Progress is saved in `localStorage`.

Works with mouse, keyboard and touch. Motion, volume and difficulty are in
Settings, and the OS "reduce motion" preference is respected.

## Developing

```bash
npm install jsdom playwright
```

```bash
node syntaxcheck.js
```

```bash
for t in 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42; do node test$t.js | tail -1; done
```

```bash
node browsercheck.js
```

36 jsdom suites (1,572 assertions) cover behaviour; `browsercheck.js` measures
layout in real Chromium, which jsdom cannot see. `test36` has one known
intermittent assertion — re-run before investigating.

Pushing to `main` redeploys the site through `.github/workflows/pages.yml`.

## Documentation

`docs/NORTH_STAR.md` is the design constitution. `docs/HANDOFF.md` is the full
history and the list of what is still open; the `*_PASS.md` files each record
one pass over the game and the reasoning behind it.
