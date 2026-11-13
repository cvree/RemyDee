# The mote pass — nothing could come out of the thing that earned it

The game had three verbs for a big moment: lean the camera in (`swell`), light
the squad (`bloom`), hit the frame (`shake`). All three act on the **whole
picture**. A sealed word, a masterwork, an opened chest and a right answer on
the Daily Trial each said "well done" by tinting everything for a fifth of a
second, and the eye was never told where to look.

And off the road, most of them still said it with a **shake**. `VAMP_PASS` took
shake away from every reward on the walk — "congratulation delivered as a punch
feels like a bug" — and nobody carried the rule back to the bench, the chest,
the Trial or the Hall.

---

## 1. One canvas for everything that flies

`#fx-motes` sits over the frame (z 150: above the modals, below the toast). One
pool, one loop, and the loop stops when the pool is empty.

| call | what it is |
|---|---|
| `FX.burst(from, o)` | motes / sparks / stars / leaves / Greek capitals thrown from a point |
| `FX.ring(from, o)` | one expanding stroke — *it landed here* |
| `FX.confetti(o)` | laurel and gold leaf, from above or from both lower corners |
| `FX.fly(from, to, o)` | reward motes that travel to the counter they feed, which punches on arrival |
| `FX.celebrate(n, from)` | the four sizes of good news, composed from the above |
| `FX.punch(el)` / `FX.sheen(el)` | the counter that just changed; light crossing a thing that just became true |

`from` is an element or a client point, never a percentage of the screen. The
road converts out of its own canvas space with `roadPt` / `roadBurst` /
`roadRing`.

Three rules keep it from becoming the noise the walk pass removed:

- **Colour is meaning.** Gold and jade are reward, cinnabar is the seal, ember
  is the forge, violet is a relic. Damage gets no particles — it has shake.
- **It is capped.** 560 / 340 / 150 live motes by quality tier; a burst into a
  full pool is trimmed, not queued.
- **Reduced motion means none of it.** Every entry point returns first. The one
  exception is `fly`, whose landing still fires — the arrival is information.

## 2. Four sizes

| level | for | what happens |
|---|---|---|
| 1 | a right answer | a puff from the thing you pressed |
| 2 | a word, a fine piece | ring + burst, the camera leans in |
| 3 | a masterwork, a new best | stars, a second ring, leaf from the corners |
| 4 | an Alpha road, the ending | the wreath comes down |

`test42` holds them in strict order and holds level 4 at four or more times
level 1, so a new call site cannot make a small thing as loud as the ending.

## 3. Where it went

- **The bench.** A placed piece answers in the colour of its kind. The seal no
  longer shakes or washes cinnabar; the word throws light, each tile takes a
  sheen, and `inkBloom` — a 260px disc of ink over the word the player had just
  got right — is gone from it. On the reveal the wax lands at the frame
  `stampIn` reaches the page, and the **grade decides how hard**: Unbroken
  brings the wreath down, Smudged gets the press and nothing else.
- **The forge.** A bad piece keeps the knock. Serviceable gets a puff, fine the
  ring, masterwork everything.
- **The road.** Gathering throws from where the part *was* (the flight already
  said where it went). A real term rings out from the squad, scaled by length;
  a coined one gets a puff of jade. A thread throws sparks back down the road.
  Gates, gears, flow, items and lifetime bests each got the part that comes out
  of the squad.
- **The result.** Alpha / Beta / Gamma were a letter and a tint. The tallies
  count out one after another and each answers when it lands.
- **The chest.** It opened as `shake(8 + heft*3)` — the best chest in the game
  was the most like taking damage. Light comes out of the box now, and each row
  of loot throws its own.
- **The Daily Trial and the Vigil.** Points leave the answer and land on the
  score. `fly` takes a selector because both screens re-render the counter
  between the answer and the landing.
- **The Hall.** The Rune Forge's strike leans instead of shaking, and its sparks
  moved off the DOM. The end card counts its score out; a new best is the one
  time the Hall brings the wreath down.
- **Everything else.** Trophies throw stars. The ending is sized by the ending
  earned. The hub's two figures count from what the player last saw there. The
  one large primary on a screen catches the lamp every few seconds.

## 4. Three things found by measuring

**The camera was the most expensive effect in the game.** A swell changes the
frame's scale every frame, and a scale change re-rasters everything inside it.
p95 frame time **doubled for the length of every swell** with nothing else
moving (50ms → 100ms in software rendering; `celebrate(4)` 117ms → 50ms after).
The frame is promoted with `will-change:transform` while the camera runs and
released when it rests.

**The camera could be killed mid-move, for good.** It ran on `FX.raf`, which
registers with the per-screen disposables. Any screen change during a swell or
a shake cancelled the loop where it stood: the frame stayed 4% zoomed, `camH`
stayed set, and `camRun()` returned early for the rest of the session. Arriving
at a destination is a 900ms swell followed by a screen change. The camera keeps
its own loop now and always runs to rest.

**The commonest effect was the most wasteful.** `clickSpark` made seven DOM
nodes per button press, and the Rune Forge up to forty-two per strike, each
with its own animation and removal timer. Both are dots on the shared canvas.

## Where it is proved

`test42.js` — 54 assertions: one canvas, the cap, the four sizes in order,
reduced motion, the landing finding a re-rendered counter, the camera surviving
`FX.cleanup()` mid-swell, no DOM from a button press, the named shakes gone
from the seal / chest / Trial / Forge / Rush, a real build at the bench, and
the hub's tally.

`browsercheck.js` hardcoded a Chromium revision that newer containers do not
ship and died on launch; it falls back to Playwright's own browser.

## Known, and left alone

- The Trials (`__RD_MG`) have their own stage with its own `emit` / `ring` /
  `slowmo`. They were already the best-feeling thing in the file and they are
  drawn inside their own canvas; they were not moved onto this layer.
- Reed Slice still has its own blade particles for the same reason.
- `FX.inkBloom` is still exported and now has no caller.
