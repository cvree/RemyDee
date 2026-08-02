/* test19 — QUESTION INTEGRITY.
   Every generated question must have exactly one defensible correct answer,
   and the combining-vowel item must agree with the rule the game itself
   teaches. This suite exists because cvRule used to grade ~20 terms backwards
   and then print an explanation proving the player right. */
const { boot, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const D = window.__RD_DATA, QE = window.__RD_QE;
  const { PARTS, TERMS } = D;
  console.log('\n== corpus ==');
  assert(Object.keys(PARTS).length >= 70, 'PARTS corpus present');
  assert(Object.keys(TERMS).length >= 60, 'TERMS corpus present');

  /* ---- the rule, stated once, independently of the game ---- */
  function trueKeep(leftId, rightId) {
    const L = PARTS[leftId], R = PARTS[rightId];
    if (R.kind === 'root') return true;          // root→root always keeps
    return !R.vowelStart;                        // root→suffix: keep before a consonant
  }

  console.log('\n== combining-vowel question grades the real rule ==');
  let cvSeen = 0, cvBad = 0, noJunction = 0;
  for (let i = 0; i < 900; i++) {
    const q = QE.generate({ types: ['cvRule'] });
    if (q.type !== 'cvRule') continue;
    cvSeen++;
    const [a, b] = q.conceptIds;
    const L = PARTS[a], R = PARTS[b];
    if (!L || !R || L.kind !== 'root' || !L.cv) { noJunction++; continue; }
    const want = trueKeep(a, b);
    const correct = q.options.find(o => o.ok);
    const saysKeep = /^Keep/.test(correct.label);
    if (saysKeep !== want) {
      cvBad++;
      if (cvBad < 4) console.error('    mismatch:', L.text, '+', R.text,
        '— game says', correct.label, 'rule says', want ? 'keep' : 'drop');
    }
  }
  assert(cvSeen > 100, `cvRule generated (${cvSeen} draws)`);
  assert(noJunction === 0, 'cvRule never asks a term with no root junction');
  assert(cvBad === 0, `every cvRule answer matches the rule (${cvBad} wrong of ${cvSeen})`);

  /* the specific terms the old spelling-sniff got backwards */
  console.log('\n== the 20 terms the old sniff inverted ==');
  const wasBroken = ['rhinorrhea','myopathy','cardiomegaly','hepatomegaly','neuropathy',
    'arthroscopy','phlebotomy','erythrocyte','leukocyte','thrombocyte','leukopenia',
    'hemostasis','hemolysis','hematopoiesis','hematocrit','hemoglobin','hemorrhage',
    'lymphocyte','coagulopathy'];
  let checked = 0, wrong = 0;
  wasBroken.forEach(id => {
    const T = TERMS[id]; if (!T) return;
    for (let i = 0; i < T.build.length - 1; i++) {
      const L = PARTS[T.build[i]], R = PARTS[T.build[i + 1]];
      if (!L || L.kind !== 'root' || !L.cv) continue;
      checked++;
      // all of these join a root to a CONSONANT-initial suffix → the o is KEPT
      if (R.kind === 'suffix' && !R.vowelStart && !trueKeep(T.build[i], T.build[i + 1])) wrong++;
    }
  });
  assert(checked >= 15, `checked ${checked} junctions from the previously-broken set`);
  assert(wrong === 0, 'all previously-inverted junctions now resolve to keep-the-o');

  console.log('\n== spelling distractors are misspellings, not other real terms ==');
  const realSpellings = new Set(Object.keys(TERMS).map(t => TERMS[t].spell));
  let spSeen = 0, spLeak = 0;
  for (let i = 0; i < 400; i++) {
    const q = QE.generate({ types: ['spelling'] });
    if (q.type !== 'spelling') continue;
    spSeen++;
    q.options.filter(o => !o.ok).forEach(o => { if (realSpellings.has(o.label)) spLeak++; });
  }
  assert(spSeen > 50, `spelling generated (${spSeen} draws)`);
  assert(spLeak === 0, `no real term is offered as a wrong spelling (${spLeak} leaks)`);

  console.log('\n== no question offers two correct answers ==');
  let dupes = 0, total = 0;
  const TYPES = ['partMeaning','meaningPart','termDef','defTerm','spelling','cvRule',
                 'bodySystem','similar','trueFalse'];
  for (let i = 0; i < 1600; i++) {
    const q = QE.generate({ types: TYPES });
    total++;
    const labels = q.options.map(o => String(o.label).trim().toLowerCase());
    if (new Set(labels).size !== labels.length) {
      dupes++;
      if (dupes < 4) console.error('    duplicate option in', q.type, labels.join(' | '));
    }
    if (q.options.filter(o => o.ok).length !== 1) {
      dupes++;
      if (dupes < 6) console.error('    not exactly one correct in', q.type);
    }
  }
  assert(total > 1000, `generated ${total} questions across all types`);
  assert(dupes === 0, `no duplicate or multi-correct option sets (${dupes} found)`);

  console.log('\n== body systems are mutually exclusive ==');
  const systems = [...new Set(Object.keys(TERMS).map(t => TERMS[t].system))];
  assert(!(systems.includes('Circulatory') && systems.includes('Cardiovascular')),
    'Circulatory and Cardiovascular are not both offered');

  console.log('\n== "similar" is not a coin flip ==');
  let simSeen = 0, simThin = 0;
  for (let i = 0; i < 300; i++) {
    const q = QE.generate({ types: ['similar'], nWrong: 3 });
    if (q.type !== 'similar') continue;
    simSeen++;
    if (q.options.length < 3) simThin++;
  }
  assert(simSeen > 40, `similar generated (${simSeen} draws)`);
  assert(simThin === 0, `similar always fills its option slots (${simThin} thin)`);

  console.log('\n== osteoarthritis is not taught as an inflammatory disease ==');
  assert(!/^inflammation of the bone and joint$/.test(TERMS.osteoarthritis.def),
    'osteoarthritis definition corrected');
  assert(/degenerat/i.test(TERMS.osteoarthritis.def), 'osteoarthritis reads as degenerative');

  summary(errors);
})();
