# The finishing pass — asking first, and surviving what comes after

The brief was to finish the game: make it consistent, make it error-free, put
the difficulty question in front of the first activity. This is what that
turned into, and why.

---

## 1. The road is chosen before it is walked

The chooser has been on the cold path and off it. It came off (see the log
around *"the difficulty starts being felt"*) because it asked a player who had
seen one screen of the game to price **hazard density** and **gate read time** —
four nouns they do not have yet — and then defaulted anyway.

That was a fair complaint about the *wording*. Answering it by never asking is
worse: a player who wants a gentle first hour had to walk a demanding one to be
offered one, and the setting that changes the game most was the only one nobody
chose.

So the question is back, in front of the first activity, and the wording is what
changed:

| before | now |
|---|---|
| four cards of prose about systems | each card leads with **who it is for**, in one sentence |
| one bar on a scale nobody has walked | **three labelled meters** — hazards, time pressure, help offered |
| the long note as the whole card | the long note kept, underneath, for whoever wants it |

`DIFFS[].feel` is the same tier said three ways. `test40` proves the meters
agree with the tuning table underneath them: a card promising less help has to
deliver `mercyDim:false`, a card promising more hazards has to deliver more
`density`. The help meter runs the other way round, in verdant — a full bar
there is a kindness, and drawing it in the wound colour told the player the
opposite of the truth.

**Where it sits.** Between the primer and the workshop: after prefix, root and
suffix have been named, so "how hard" has something to be hard about, and before
anything can be started. Skipping the tale skips the story, never the question.

**The backstop.** `requireDifficulty(next)` stands in front of `openChapter` and
the Endless Road. It returns `true` when it deferred — the caller stops, and
`next` runs on the far side of the choice. So the map spot, a stale save, and a
direct call all pass through it, and no route reaches a graded activity on a
default nobody chose.

**Asked once.** `settings.diffAsked` closes it. The migration marks it answered
for any save with a road behind it: a returning player has already answered by
playing, and stopping them mid-campaign to ask is the wall this was avoiding.
The follow-up offer after the first road — the moment every word in the chooser
stops being abstract — moved onto its own flag, `diffReviewed`, so putting the
first question up front did not silently delete the second one.

---

## 2. What walking the game in a browser found

Five defects, all found by opening the file in Chromium and looking, none
visible to jsdom.

**The commission board hangs in a dark workshop and inherited the page's ink.**
The scout's report and the road code — the two pieces of intel the commission is
chosen *from* — were dark text on a dark stage, measured at 1.0:1. So was the
line explaining that a *matching* maker's mark is worth something and a
mismatched one is decoration, which is the whole choice that panel offers. All
three carry their own ground and their own light ink now.

**A lone recommendation filled the bench.** `commission-grid` was
`repeat(auto-fill,minmax(150px,1fr))`, so one card stretched the full width and
read as a broken card rather than as the one pattern the road calls for. Same
fix the decode chips got a pass earlier: wrapping flex, centred, with a width a
card can actually be. And the pattern plate was *emptied* on that step, so a
bright blank square sat beside the heading; it holds the order board now.

**Lucius the Cook did not exist.** Written, given `hepatitis`, a clue and a
concern — and listed in no chapter, so `partyFor` never saw him and his term was
the one authored build a full campaign could not reach. He joins the Garden of
Roots, where `hepat/o` is taught before `hepatomegaly` asks for it in Chapter
Four. The finale absorbs the extra as `PARTY_LADDER`'s trailing `99` was always
meant to.

**The last tally in the game read 43 / 78.** 78 is every term in the Lexicon;
the campaign only ever asks the player to *name* 44 of them. The ending was
telling a player who had done everything that they were a little over half done.
`campaignTermCount()` derives the real denominator from the rosters, so it
cannot drift when one changes. And the middle grade began a sentence in lower
case whenever Master Vale was lost.

**Stale font stacks.** The goal pole's omega asked for `"Noto Serif SC"` — a CJK
serif, left over from the setting this game no longer has — and six trial
captions asked for bare `sans-serif`.

**Centred past the top.** `justify-content:center` on a scrolling box centres
the *overflow* too: when the content is taller than the screen it hangs off both
ends, and the top end cannot be reached because `scrollTop` will not go
negative. On a 390×780 phone the chooser opened halfway down its own first card
— the question it asks was 266px above the viewport and no amount of scrolling
brought it back. Four other screens shared the rule: the party brief, the
Training Hall, the Trials and the Vigil. `justify-content:safe center` centres
only while everything fits, and a browser that does not know the keyword drops
the declaration and lands on the same behaviour.

---

## 3. Never audited, now audited

Two items had carried a "nobody has tried to break this" note for a long time.

### The save, when the browser says no

`write(state){ try{ localStorage.setItem(...) }catch(e){} }` is exactly right
about one thing: a browser that will not store anything must not take the
running game down with it. It was also the whole story. In a private window,
with site data blocked, or against a full quota, a player could walk an entire
campaign and lose it at the first reload **having been told nothing at all**.

Now: a write reports whether it worked. The first refusal says so out loud,
once, so the player can decide what to do with the next hour. And a refusal that
looks like a full quota first makes room from the parts of the save that are a
luxury — the ten-row leaderboards, day-medals older than a month, lore already
read — before it gives up on the campaign sitting beside them. The shed is
applied to the **live** state on purpose: healing it once beats rebuilding the
same oversized payload on every `persist()` for the rest of the session.

`test41` runs it under a storage that refuses everything and under a quota that
only admits something smaller.

### The long session

Eight full cycles of hub → Lexicon → Settings → the Hall → the title → the
Endless Road → an arcade round, in Chromium, with every `addEventListener` and
`removeEventListener` call instrumented and tallied per node:

- DOM nodes: **flat** (3555 → 3554).
- Listeners stacked on a node that survives its render: **none**. The `<g>`
  click/keydown counts that look alarming belong to campaign-map nodes, which
  are rebuilt by `innerHTML` every time the hub renders and take their handlers
  with them.
- Uncaught errors: **two**, and they were real.

`Cannot set properties of null (setting 'textContent')`, out of Reed Slice's own
animation frame. The round's HUD lives in `#arcade-stage`; the stage is emptied
when the Hall is left; the loop went on scoring against it — while `banner()`
and `updateFlow()` three lines away had always guarded. Seal Match has the same
shape on a different clock: a matched pair is written 240ms after the second
flip, and the board can be gone by then.

Both are guarded, and the slice loop **stops itself** when its own canvas leaves
the document, so a rogue frame cannot paint a canvas nobody can see. That is the
rule, not the two writes: *nothing that outlives a screen may assume the screen
is still there.* `endEndlessRoad` is exported and threw a `TypeError` when no
road was running; there is nothing to end then.

`test42` covers all three, and fails on the old code.

**And the flake that was not a flake.** `test36`'s "ten forges end the session"
assertion failed about one run in ten, and this repo's own handoff had guessed
the cause correctly: a session clock surviving a previous `startMode('forge')`.
`stageMode()` never ended the round it was replacing. Every mode's HUD uses the
same ids in the same `#arcade-stage`, so the abandoned session went on writing
into its replacement — and because `finish()` called the **global** `A.cleanup`,
an abandoned forge could end the forge that replaced it (`done=1 over=true`,
exactly the reported symptom). Staging a mode now ends what is on the stage
first, and each session holds its own `endSession` so it can only ever end
itself. Eight consecutive `test36` runs, green.

Also run: a few hundred random clicks over every reachable control, at desktop
and phone size, on every screen the game has. Zero errors.

---

## 4. The roots get their reason, where the player is already looking

All 85 word-parts carry one verified line about where they came from — *mys*
meant mouse, *neuron* meant bowstring, *elektron* is amber. Those lines are the
difference between a root memorised and a root known, and they lived in two
places: the Lexicon, which has to be opened on purpose, and the reveal card of a
term just built. **Around twenty parts are in no term any traveler asks for**, so
for those the line was reachable only by browsing.

The Vigil and the Daily Trial already stop after every answer to say what the
question was about — the one moment the player is thinking about that exact
part, right or wrong, with no clock running. `factFor(q)` puts the line there
too: under the explanation, quieter than it, suppressed when the explanation
already tells the same story or when no single part is in focus.

Deliberately **not** on the road. The walk was taught to say one thing per event
a pass ago (`VAMP_PASS.md`), and a paragraph over the playfield would undo it.

---

## 5. Consistency

**The radius scale, named.** Three tokens described the inked edges and
everything larger was a bare number: eight values between 7px and 20px doing the
work of three roles, so a chip could be 7, 8, 9, 10, 11 or 12 depending on who
wrote it. The roles *are* the scale —

```
--r-sm / --r-md / --r-lg   2 / 3 / 4    an edge ruled on paper
--r-chip                   10           chips, inputs, meters, icon buttons
--r-card                   14           cards, portraits, modals, plates
--r-pill                   999          pills, tags, and every thin bar
```

— and every rule that had a bare number now names the one it meant. One bare
value survives, and it is a shape rather than a radius (the bench lantern's
`6px 6px 8px 8px`).

**The one screen that looked like a phone.** Settings shipped the rounded
pill-and-dot toggle every mobile OS draws, and a native `input[type=range]` with
an accent colour painted on, in a game whose every other control is inked,
stamped or cut from parchment. Both are inked controls now: a counter sliding in
a groove pressed into the page (bone while it is off, verdant wax once it is
set, and the groove fills in behind it so the state reads without colour), and a
wax bead running in the same groove with the level filled behind it. WebKit has
no `::-moz-range-progress`, so the track paints its own fill from a variable the
input keeps up to date.

**Dead CSS.** `.setting-row` and `.toggle` styled a settings screen that was
replaced by `.set-row` and `.switch` and never removed.

**Contrast.** `.pr-gold` — the hub's *next unlock* and the player's own lifetime
bests — was the restrained gold on parchment at 2.18:1. Bronze reads as the same
accent and clears AA.

---

## What this pass did not do

- The **Hall of Records** is still five KPI tiles over a card grid under tab
  pills, and the **chest** is still a mobile-game loot box rather than a sealed
  *capsa* with a wax *sphragis*. Both work and both read clearly; neither was
  worth the regression risk against `test33`/`test36` in the same pass as
  everything above.
- `page()` still serves seven meanings across twelve call sites.
- No `writing-mode` anywhere.
- The trials' stages have still never been profiled.
- Tier 1 still prints the definition as its prompt, so seven builds never ask
  for retrieval. The tier-1 *repeat* argument from `WORD_PASS.md` is still open.
