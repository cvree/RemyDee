# The Hall Pass — two more halls, and instructions under five words

## The brief

> "Rune Forge. WORD BUILDING. *Build the term.* … Drag: HEPAT + ITIS. Then hit
> the anvil. CLANG → HEPATITIS. The pieces fuse, sparks shoot outward, and the
> finished word stamps into the lexicon."
>
> "Wrong answer: don't stop the game with a boring error screen. The blade
> forms… then CRACKS in half. The wrong fragment gets blasted off the anvil. The
> correct pieces remain. That makes failure satisfying too."
>
> "Spirit Trial. APPLIED RECALL. *Decode the sign.* … The other seals explode
> into paper fragments. Then the spirit instantly recovers and vanishes. No
> paragraph. No explanation screen."
>
> "That's the direction I'd push the entire Training Hall: instructions under
> five words whenever possible, learning revealed through interaction, and every
> correct answer gets a tiny tactile payoff. The player should almost
> accidentally drill medical terminology because hitting the next answer feels
> so good."

The Hall had two modes and both were recall. The two cognitive modes the North
Star names as the other half of the promise — **construction** (make the word)
and **transfer** (read a word you were not taught) — were only ever practised
inside the campaign, where they cost stamina and cannot be repeated. Free
practice could not reach them. That is what this pass adds, and it takes the
brief's second instruction as seriously as its first: the Hall now explains
itself by being played.

## 1. The four cards

The menu is a square of four, and each one says what it is in four words or
fewer. The forty-word paragraph that used to sit on each card is gone; what it
described is now what the first round does.

| | | |
|---|---|---|
| MEANING RECALL | Reed Slice | *Slash the right part.* |
| PAIRED RECALL | Seal Match | *Match the pairs.* |
| WORD BUILDING | Rune Forge | *Build the term.* |
| APPLIED RECALL | Spirit Trial | *Decode the sign.* |

The glyph on each card is the mode's initial in the tongue the vocabulary comes
from: **Τ** *tomē*, a cut; **Ζ** *zeugos*, a yoked pair; **Χ** *chalkeus*, the
smith; **Ψ** *psychē*, the spirit. The hall's own title and its paragraph of
throat-clearing now step out of the way while a round is on — standing, they
cost 150px at the top of the screen and pushed the reveal, the part that
teaches, below the fold.

## 2. Rune Forge — four shapes of round, one strike

Ten forges to a session. The rotation is shuffled and exhausted before it
repeats, so no shape comes twice in a row:

| | asks | answered by |
|---|---|---|
| **BUILD** | a definition | lay every piece on the anvil, in order, and strike |
| **FINISH** | a meaning | one slot is open; pick the piece that fills it |
| **BREAK** | a finished word | tap every boundary between its pieces |
| **REPAIR** | a definition the word does not match | smash the wrong piece, choose its replacement |

**A right answer is the loudest thing in the mode.** The hammer, then the seal,
a shove of the frame, a wash of gold, sparks off the hearth, and the finished
word stamps onto the anvil — then the micro-reveal names each piece and nothing
else (`HEPAT = liver` / `-ITIS = inflammation`) and the next forge is already
coming.

**A wrong answer is drawn too.** The blade forms, cracks, and the piece that
broke it is blasted off the anvil *with its meaning attached* — `-ECTOMY =
removal` — and stays off. Every correct piece is still lying there. Three cases
are separated, because they are three different mistakes:

- a piece that does not belong in the word is **blasted** and recorded wrong;
- a piece that belongs but is in the wrong place comes back to the tray with
  "**-ITIS** belongs — but not there", and is not recorded wrong, because
  knowing the piece and knowing its seat are different things;
- a build that is right as far as it goes just says "the word is not finished"
  and blasts nothing.

**The streak is the spectacle, not the difficulty.** Three perfect and the
hearth glows (`FORGE HEATING`), five and it runs white (`WHITE HOT`), ten and
it is the brightest thing on the screen (`MASTER FORGE`). The strike shakes
harder, the sparks multiply, and the beat between rounds shortens from 1550ms to
900ms. The questions do not get harder while any of that happens.

## 3. Spirit Trial — five shapes of sign

Twelve spirits, three lives, and a fuse burning under each sign.

| | the sign | the seals |
|---|---|---|
| **DECODE** | a term | four meanings, at least one of them a sibling's |
| **SPOT** | a meaning | the pieces that might carry it |
| **IMPOSTOR** | *Find the nerve term.* | three terms that end the same way |
| **REPAIR** | a term wearing one wrong piece | smash it, then replace it |
| **CHAIN** | three meanings in a row | three pieces, then the word they make |

A spirit rushes in, the sign appears, the right seal is slashed and the rest
burn away; the word flashes with its pieces named, the spirit bows out and
vanishes. There is no explanation screen anywhere in the mode. A sign left
unread costs a life and the spirit falls through you.

CHAIN is the one worth watching: three retrievals inside five seconds each,
where the third is only answerable because the first two just happened, and the
three seals converge into `TACHYCARDIA · CHAIN ×3`.

## 4. Mastery Rush

Either hall can break into it, and it is **earned, not rolled**: the first time
a session's streak reaches five. Twenty seconds, no hints, three beats per term
— name the first piece, name the second, build it out of what you just named.

The hall answers louder with every right answer: a chime at one, the lanterns at
three, the frame moves at five, the music thickens to `urgent` at eight, and at
ten a seal the size of the screen — **Ι**, the Greek numeral for ten. Then
`10 PERFECT / +3 mastered parts`, and the round that was interrupted resumes
with the bonus already banked.

The escalation is the whole trick. **The spectacle increases; the difficulty
does not.**

## 5. The spelling rule, written down once

Both modes have to show words the corpus does not carry — `gastrectomy` when the
term is `gastritis` — so `wordOf(build)` spells a build from the rule the game
teaches:

1. the combining vowel survives in front of a consonant suffix and dies in front
   of a vowel (`nephr/o + -logy → nephrology`, `nephr/o + -itis → nephritis`);
2. a vowel that meets its own twin across a junction becomes one letter
   (`cardi/o + -itis → carditis`, never `cardiitis` — the corpus already says so
   in its own note).

Those two clauses reproduce **all 78 terms letter for letter**, which `test36`
asserts. Six of them fuse a shared letter, and those six are marked and kept out
of BREAK: where two pieces share a letter there is no honest place to cut, and a
round that marked a correct tap wrong would be teaching a lie.

## 6. Four things fixed on the way past

- **The wisp's entrance class was called `rush`**, which is also the Mastery Rush
  overlay — so the spirit inherited `position:absolute` from it and stood on top
  of its own sign. The animation classes are namespaced now.
- **The Hall's stage had no width.** It sits in a centred flex column, so it
  shrank to its widest child: every mode came out a different size, and the
  Mastery Rush, which covers the stage, covered part of the screen.
- **The Rush clock was invisible** — a bar with `margin:auto` and no width
  collapses to nothing inside a flex column, so the twenty seconds could not be
  seen running out.
- **The last hanzi in the game.** Reed Slice's bomb tile was labelled 爆 and
  asked for `"Noto Serif SC"` to draw it — a leftover of the frame the game
  stopped borrowing three passes ago, in the one mode nobody re-read. The bomb is
  drawn now (a burst, eight spokes and a core), and the tile face uses the game's
  own serif stack. `test36` fails if a CJK codepoint reappears anywhere in the
  Training Hall.

`sfx.pour` and `sfx.bow` had been defined with zero call sites since the audio
pass. The forge quenches with one and the spirit bows out with the other.

## 7. What it is worth to the player

Both modes write every answer back through `QE.record` into the same adaptive
mastery model the campaign uses, so a session in the Hall moves the review
schedule, the Lexicon counters and the road's difficulty read exactly as a
mission would. Both keep a best score in `arcade.forge` / `arcade.spirit` and
post a row to the Hall of Records. A save written before this pass is backfilled
with both shelves.

## 8. Left undone

- The Rush always draws two-part terms. Three-part terms would want a fourth
  beat and a longer clock; it was not worth making the twenty seconds ragged.
- BREAK needs a word of eight letters with no fused junction and no piece
  shorter than three letters, which is 40-odd of the 78. A shorter word is a
  legitimate cut but reads as a formality (`NAS|AL`).
- The forge accepts taps, not drags. Tap-to-place and tap-to-remove cover every
  input the game supports; a drag would be a second way to do the same thing,
  and the anvil is a large target on purpose.
- Neither mode has a trophy. The trophy case is weighted toward learning over
  grinding and a Hall score is grindable; if they get one it should be for a
  ten-streak, not a high score.
