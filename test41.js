/* test41.js — THE QUESTION STOPS ANSWERING ITSELF.

   `test38` asked this of the bench and found that 33 of the 44 traveler builds
   printed the answer before they asked the question. This suite asks it of the
   other place the game asks the player to know something: the question engine,
   and every surface that renders what it produces.

   Two leaks, and between them they covered every question of their kind:

     1. THE PRONUNCIATION WAS THE ANSWER READ OUT. `partMeaning` shows a part
        and asks what it means, so printing "PEE-nee-ah" under it is a reading
        aid for a form already on the screen. `meaningPart` is the mirror — it
        asks WHICH part means deficiency, so the part is the answer, and the
        same line under the same card is the answer said aloud. It carried the
        pronunciation on every single one. It moved into the explanation, where
        it teaches after the answer instead of instead of it.
     2. THE VIGIL'S EYEBROW NAMED IT. The line above the question exists to say
        why the question is worth answering — this part is on the road you are
        about to walk — and it said so by printing the part. Above "Which word
        part means deficiency?" it read "· -PENIA is on this road". All 85 parts
        did it. The stake is worth keeping; the name is not, and is printed only
        where the prompt has already shown it.

   The general guarantee, which is what this file actually holds: NOTHING SHOWN
   WITH A QUESTION MAY CONTAIN ITS ANSWER. Everything after the player has
   answered — the explanation, the teach line, the reveal — is free to.
*/
const { boot, assert, summary } = require('./testlib');

const strip = (s) => String(s || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
  .replace(/&mdash;/g, '—')
  .trim();
const norm = (s) => strip(s).toLowerCase().replace(/[’']/g, "'");

/* Every shape the engine can produce. Kept as a literal list so a new type
   added without a leak check fails the count assertion below rather than
   quietly opting out of the whole suite. */
const TYPES = ['partMeaning', 'meaningPart', 'termDef', 'defTerm', 'spelling', 'cvRule',
  'bodySystem', 'similar', 'trueFalse', 'originId', 'originPair', 'originRule'];
/* how many of each to draw — enough that a leak on a rare corpus entry shows up */
const DRAWS = 400;

(async () => {
  const { window, errors } = await boot();
  const QE = window.__RD_QE, E = window.__RD_ENG, D = window.__RD_DATA;
  const PARTS = D.PARTS;

  /* A player who has learned everything is the widest possible corpus: every
     type can fire and every distractor pool is full. */
  E.setS(E.newGame());
  E.S().completedTerms = Object.keys(D.TERMS);
  Object.keys(PARTS).forEach((p) => { if (E.markPartSeen) E.markPartSeen(p); });

  console.log('\n1. THE ENGINE CAN STILL ASK EVERYTHING IT CLAIMS TO');

  const made = {};
  const all = [];
  TYPES.forEach((t) => {
    made[t] = [];
    for (let i = 0; i < DRAWS; i++) {
      let q = null;
      try { q = QE.generate({ types: [t], nWrong: 3, choices: 4 }); } catch (e) { /* counted below */ }
      if (q && q.options && q.options.length) { made[t].push(q); all.push(q); }
    }
  });
  TYPES.forEach((t) => assert(made[t].length > 0, `the engine can still produce ${t}`));
  assert(all.length > TYPES.length * 100,
    `the corpus is wide enough to be worth checking (${all.length} questions drawn)`);
  assert(all.every((q) => q.options.some((o) => o.ok)),
    'every question drawn has exactly one thing that is true');

  console.log('\n2. NOTHING SHOWN WITH A QUESTION CONTAINS ITS ANSWER');

  /* A True/False card restates the claim it is asking about — that is the form,
     not a leak. Everything else is held to the rule. */
  const isTF = (q) => q.options.length === 2 &&
    q.options.every((o) => /^(true|false)$/i.test(strip(o.label)));

  const promptLeaks = all.filter((q) => {
    if (isTF(q)) return false;
    const ans = norm(q.correctLabel);
    if (ans.length < 3) return false;
    if (!norm(q.prompt).includes(ans)) return false;
    /* Naming the answer is only a leak if the prompt does NOT also name a wrong
       one. "hypo- and sub- both mean under — which is the Latin one?" puts both
       candidates on the card and still asks the player to know which is which. */
    return !q.options.filter((o) => !o.ok)
      .some((o) => norm(o.label).length > 2 && norm(q.prompt).includes(norm(o.label)));
  });
  assert(promptLeaks.length === 0,
    'no prompt hands over its own answer' +
    (promptLeaks.length ? ` — e.g. ${strip(promptLeaks[0].prompt)} → ${strip(promptLeaks[0].correctLabel)}` : ''));

  /* THE PRONUNCIATION. It is shown on the card, beside the question, before the
     player answers — so it is subject to the same rule as the prompt. It may
     transcribe a form the prompt has already put on screen and nothing else. */
  const pronCarriers = all.filter((q) => q.pron);
  assert(pronCarriers.length > 0, 'some questions still carry a pronunciation at all');
  const pronLeaks = pronCarriers.filter((q) => {
    const owner = Object.keys(PARTS).find((p) => PARTS[p].pron === q.pron);
    if (!owner) return false;
    return String(q.prompt || '').indexOf(PARTS[owner].text) < 0;
  });
  assert(pronLeaks.length === 0,
    'a pronunciation only ever transcribes a form the prompt has already shown' +
    (pronLeaks.length ? ` — e.g. "${pronLeaks[0].pron}" over "${strip(pronLeaks[0].prompt)}"` : ''));

  /* Named directly, because this is the one that was on every card of its kind
     and the one a future refactor is most likely to put back. */
  const mp = made.meaningPart;
  assert(mp.length > 0, 'the engine still asks which part carries a meaning');
  assert(mp.every((q) => !q.pron),
    'asking WHICH part means something never prints how that part is said');
  assert(mp.every((q) => /\(/.test(String(q.explanation || ''))),
    'and the pronunciation is not lost — it is in the explanation, after the answer');

  const pm = made.partMeaning;
  assert(pm.length > 0, 'the engine still asks what a part means');
  assert(pm.every((q) => !!q.pron),
    'asking what a part MEANS keeps the pronunciation — the part is on screen, so it is a reading aid');

  console.log('\n3. THE DISTRACTORS ARE REAL');

  const dupes = all.filter((q) => {
    const labs = q.options.map((o) => norm(o.label));
    return new Set(labs).size !== labs.length;
  });
  assert(dupes.length === 0,
    'no question offers the same answer twice' +
    (dupes.length ? ` — e.g. ${strip(dupes[0].prompt)}` : ''));

  /* A wrong answer that means the same as the right one punishes the player for
     knowing both. The engine already excludes near-synonyms; this holds it. */
  const synonymTraps = all.filter((q) => {
    if (isTF(q)) return false;
    const right = norm(q.correctLabel);
    return q.options.filter((o) => !o.ok).some((o) => norm(o.label) === right);
  });
  assert(synonymTraps.length === 0, 'no wrong answer is spelled the same as the right one');

  console.log('\n4. THE VIGIL SAYS WHY WITHOUT SAYING WHAT');

  /* The eyebrow prints the focus part only where the prompt has already shown
     it. This walks every part in the corpus through every focusable form and
     applies the rule renderVigil applies, so the check is on the line the
     player actually reads rather than on the data behind it. */
  const eyebrowFor = (q, focusId) => {
    const text = PARTS[focusId] ? PARTS[focusId].text : '';
    if (!text) return '';
    return String(q.prompt || '').indexOf(text) >= 0 ? text : '';
  };
  let checked = 0, named = 0;
  const eyebrowLeaks = [];
  ['partMeaning', 'meaningPart', 'trueFalse'].forEach((t) => {
    Object.keys(PARTS).forEach((id) => {
      let q = null;
      try { q = QE.generate({ focus: id, nWrong: 3, choices: 4, types: [t] }); } catch (e) { return; }
      if (!q || !q.correctLabel) return;
      checked++;
      const eye = eyebrowFor(q, id);
      if (eye) named++;
      if (eye && norm(eye) === norm(q.correctLabel)) {
        eyebrowLeaks.push(`${t}: "${strip(q.prompt)}" under "${eye} is on this road"`);
      }
    });
  });
  assert(checked > 100, `every part was walked through every focusable form (${checked} cards)`);
  assert(eyebrowLeaks.length === 0,
    'the eyebrow never names the part that is the answer' +
    (eyebrowLeaks.length ? ` — e.g. ${eyebrowLeaks[0]}` : ''));
  assert(named > 0,
    'and it still names the part where the prompt has already shown it — the stake was worth keeping');

  console.log('\n5. THE RUNE GATE ASKS IN ONE REGISTER AND ANSWERS IN THE OTHER');

  /* The road's gates are the other place the game asks the player to know
     something, and they were already right — but the thing that makes them
     right is a single invariant worth holding: the prompt and the three doors
     are never in the same register. A gate that named a part and then labelled
     the doors with parts would be a reading test with the answer written above
     it. Drive real gates and read what the player would read. */
  const MI = window.__RD_MISSION, P = window.__RD_PREP;
  const ch = D.CHAPTERS.find((c) => c.members && c.members.length >= 3) || D.CHAPTERS[2];
  E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0,
    results: {}, forged: [], route: null, stats: {} });
  E.getFlow().roadPlan = MI.buildRoadPlan(E.getFlow());
  P._depart();
  const started = await (async () => {
    for (let i = 0; i < 60; i++) { if (MI._state()) return true; await new Promise(r => setTimeout(r, 100)); }
    return false;
  })();
  assert(started, 'a road can be walked, so its gates can be read');

  const gateFaults = [];
  let gatesRead = 0;
  if (started) {
    for (let i = 0; i < 40; i++) {
      const M = MI._state(); if (!M || M.done) break;
      const g = MI._forceGate(); if (!g) break;
      gatesRead++;
      const promptText = strip(g.prompt).toLowerCase();
      /* the label the player sees on each door, exactly as the road draws it */
      const doors = g.laneIds.filter(Boolean).map((id) =>
        norm(g.showMeaning ? PARTS[id].mean : PARTS[id].text));
      const answer = doors.length ? norm(g.showMeaning
        ? PARTS[g.laneIds[g.ansLane]].mean : PARTS[g.laneIds[g.ansLane]].text) : '';
      if (answer && answer.length > 2 && promptText.includes(answer)) {
        gateFaults.push(`${strip(g.prompt)} → ${answer}`);
      }
      MI._setLane(g.ansLane);
      MI._resolveGate();
    }
  }
  assert(gatesRead > 3, `enough gates were opened to be worth checking (${gatesRead})`);
  assert(gateFaults.length === 0,
    'no rune gate writes its answer above its own doors' +
    (gateFaults.length ? ` — e.g. ${gateFaults[0]}` : ''));

  console.log('\n6. THE ANSWER IS STILL TAUGHT, AFTER IT IS GIVEN');

  /* The rule above is only worth having if nothing was lost by it. Every
     question still explains itself once the player has committed. */
  const unexplained = all.filter((q) => !strip(q.explanation));
  assert(unexplained.length === 0,
    'every question still explains itself after the answer' +
    (unexplained.length ? ` — e.g. ${strip(unexplained[0].prompt)}` : ''));
  /* Where the answer IS a corpus token — a part, a term, a definition, a system —
     the explanation has to name it, because that is the one place the game is
     allowed to say it and the place the withdrawn pronunciation went. `cvRule`
     and `originRule` are excluded on purpose: their answers are sentences the
     player picks ("Drop the o", "endo- and intra- (within)") and their
     explanations restate the rule rather than the label, which is right. */
  const TOKEN_ANSWER = ['partMeaning', 'meaningPart', 'termDef', 'defTerm',
    'spelling', 'bodySystem', 'similar', 'originPair'];
  const tokenQs = all.filter((q) => TOKEN_ANSWER.includes(q.type));
  assert(tokenQs.length > 0, 'there are questions whose answer is a word from the corpus');
  const unnamed = tokenQs.filter((q) => !norm(q.explanation).includes(norm(q.correctLabel)));
  assert(unnamed.length === 0,
    'and each of those explanations names the answer — the one place it belongs' +
    (unnamed.length ? ` — e.g. ${strip(unnamed[0].prompt)} → ${strip(unnamed[0].correctLabel)}` : ''));

  summary(errors);
})();
