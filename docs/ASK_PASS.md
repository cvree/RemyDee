# The Ask Pass — the question stops answering itself

`WORD_PASS.md` asked one question of the bench: *when the game asks the player to
know something, does the screen already say it?* It found that **33 of the 44
traveler builds printed the answer before they asked the question**.

This pass asks the same question of the other place the game asks for knowledge —
the question engine and every surface that renders what it produces. Two leaks
came back, and between them they covered every question of their kind.

Measured against `NORTH_STAR.md`: Pillar I (*never let grinding, luck or
button-mashing substitute for knowing the word*). A card that contains its own
answer is not a substitute for knowing the word — it is a way of never being
asked.

---

## 1. The pronunciation was the answer read out

The engine asks about a word-part in two directions:

| Type | Prompt | Answer |
|---|---|---|
| `partMeaning` | What does **-penia** mean? | the meaning |
| `meaningPart` | Which word part means **deficiency**? | the part |

Both carried `pron`, and both rendered it on the card under the question.

On `partMeaning` that is correct: the part is on the screen, so telling the player
how to say it is a reading aid for a form they are already looking at.

On `meaningPart` it is the answer. `Which word part means deficiency?` above four
suffixes, with **PEE-nee-ah** printed underneath, is not a question — the player
does not have to know that `-penia` means deficiency, only that `-penia` is the
one that sounds like *PEE-nee-ah*, which the card just told them.

It was on **every single one**: 900 of 900 draws.

**Now.** `meaningPart` does not carry a pronunciation. It moved into the
explanation, which is shown after the player commits:

```
-ectomy (EK-toh-mee) means surgical removal.
```

Nothing is lost — the pronunciation is still taught, on the same card, one beat
later. This is the same move the word pass made with the tier-2 definition.

The fix is in the **generator**, not the renderers, because two screens render
`q.pron` (the Vigil and the Daily Trial) and a third and fourth could be added
tomorrow. A question that never carries the leak cannot leak it anywhere.

---

## 2. The Vigil's eyebrow named the part it was asking for

The line above a Vigil question exists to say *why this one is worth answering* —
the part is on the road you are about to walk. It said so by printing the part:

```
FIND THE PART · -PENIA IS ON THIS ROAD
Which word part means deficiency?
        -penia    -rrhage    -logy    -globin
```

On `partMeaning` and `trueFalse` the part is already in the prompt, so naming it
is a reminder. On `meaningPart` the part **is** the answer. All 85 parts in the
corpus did this.

**Now.** The stake is kept and the name is dropped wherever the prompt has not
already shown it:

```
FIND THE PART · THIS ONE IS ON THE ROAD AHEAD
Which word part means joint?
```

The rule is one line and it is checkable: *the eyebrow may name the focus part
only if the prompt already contains it.*

---

## 3. What was audited and found clean

The rule was applied to every surface that asks the player to know something, not
just the one in the report:

- **The rune gates** ask in one register and answer in the other, always: when the
  prompt names a meaning the doors carry parts, and when the prompt names a part
  the doors carry meanings (`showMeaning: !askMeaning`). 40 live gates checked.
- **The Spirit Trial's REPAIR round** shows the *broken* word — `RHINOLYSIS` over
  "The breakdown or destruction of red blood cells" — so the clue is the
  definition and the player still has to know that blood is `hem-`. The first
  audit flagged it; the flag was reading the **reveal** frame, where `land()` has
  already put the finished word on the sign because the player has already
  answered. That is where the answer belongs.
- **Reed Slice** prompts with a meaning and labels the falling tiles with parts.
- **`originRule`**'s "hypo- and sub- both mean under — which is the Latin one?"
  names the answer in the prompt and also names the distractor, so the player
  still has to know which tongue is which. Not a leak, and `test41` is written so
  it does not call it one.

---

## 4. A test that guarded the wrong thing

`test29` asserted:

> the question names the part it is drilling as one this road will use

…by matching the literal string `is on this road` — which the eyebrow produced by
**printing the part**. The assertion's intent was right (the Vigil is about *this*
road, which is its whole difference from the Daily Trial); its mechanism was the
leak. It now asserts the stake in either wording, and adds the other half: that
the eyebrow does not say the answer while saying it.

---

## The guarantee this pass leaves behind

**Nothing shown with a question may contain its answer. Everything shown after the
player has answered is free to, and should.**

`test41.js` holds it — 33 assertions over ~4,800 generated questions plus 255
focused Vigil cards and 40 live rune gates. It checks the prompt, the
pronunciation, the eyebrow, the doors, the distractors, and the other direction
too: that every explanation still names the answer, so withdrawing a hint never
quietly removed the teaching with it.

## Verifying it

```
node syntaxcheck.js
for t in 6 7 8 ... 40 41; do node test$t.js | tail -1; done
```
