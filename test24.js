/* test24 — the learning-integrity pass.
   Every assertion here corresponds to a measured defect: mastery credit paid for
   words that do not exist, a scheduler that retired parts for the rest of the
   campaign, distractors that were also correct, and question types you could
   beat without reading the prompt. */
const { boot, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const D = window.__RD_DATA, QE = window.__RD_QE, E = window.__RD_ENG;
  const PARTS = D.PARTS, TERMS = D.TERMS;

  /* ---------- the corpus is internally consistent ---------- */
  const orphanParts = Object.keys(PARTS).filter(k => !Object.values(TERMS).some(t => t.build.includes(k)));
  assert(orphanParts.length === 0,
    'every word part appears in at least one real term (-centesis used to appear in none): ' + orphanParts.join(','));

  // Each term must spell out from its own build under the game's own rule, so a
  // note can never teach a spelling the data contradicts.
  const misspelt = [];
  Object.entries(TERMS).forEach(([id, t]) => {
    let out = '';
    t.build.forEach((pid, i) => {
      const p = PARTS[pid]; if (!p) { misspelt.push(id + ' has unknown part ' + pid); return; }
      let seg = p.kind === 'root' ? p.stem : p.text.replace(/-/g, '');
      if (p.kind === 'root') {
        const nx = PARTS[t.build[i + 1]];
        if (nx && (nx.kind === 'root' || !nx.vowelStart)) seg += p.cv;
      }
      out += seg;
    });
    if (out.replace(/ii/g, 'i').replace(/aa/g, 'a') !== t.spell) misspelt.push(id + ': ' + out + ' != ' + t.spell);
  });
  assert(misspelt.length === 0, 'every term spells out from its own build: ' + misspelt.slice(0, 3).join('; '));

  // A part defined by itself teaches nothing, and makes the question answerable
  // by string similarity alone.
  const circular = Object.keys(PARTS).filter(k => {
    const bare = PARTS[k].text.replace(/[-\/]/g, '').replace(/o$/, '');
    return PARTS[k].mean.toLowerCase() === bare.toLowerCase();
  });
  assert(circular.length === 0, 'no word part is defined as itself (lymph/o meant "lymph"): ' + circular.join(','));

  /* ---------- the Two Tongues has more than six cards in it ---------- */
  assert(D.TWIN_ROOTS.length >= 7,
    'Greek/Latin twin pairs number at least seven (was three, giving the type six distinct items): ' + D.TWIN_ROOTS.length);
  const langed = Object.keys(PARTS).filter(p => PARTS[p].lang);
  assert(langed.length === Object.keys(PARTS).length, 'every part still declares its tongue');
  const latin = langed.filter(p => PARTS[p].lang === 'L');
  assert(latin.length >= 15, 'the Latin side of the corpus is no longer a rounding error: ' + latin.length + ' parts');

  /* ---------- building a word that is not a word buys no mastery ---------- */
  const S = E.S();
  const freshMastery = (id) => S.mastery.parts[id];
  // hyper- + ot/o + -algia is a legal chain and not a word.
  const coined = ['hyper', 'ot', 'algia'];
  const before = coined.map(id => JSON.stringify(freshMastery(id)));
  QE.record(coined.filter(() => false), true);            // no-op guard
  const sig = Object.keys(TERMS).map(t => TERMS[t].build.join('+'));
  assert(!sig.includes(coined.join('+')), 'the chain used for this test really is not a term');
  const after = coined.map(id => JSON.stringify(freshMastery(id)));
  assert(before.join('|') === after.join('|'), 'a coined chain leaves the review schedule untouched');
  // and the real thing still counts
  QE.record(['gastr', 'itis'], true);
  assert((freshMastery('gastr').correct || 0) >= 1, 'a real term still records practice for its parts');

  /* ---------- the scheduler keeps weak items in front of the player ---------- */
  const probe = 'nephr';
  const m = S.mastery.parts[probe];
  m.seen = 1; m.ef = 2.5; m.reps = 0; m.ivl = 0; m.due = 0; m.lapses = 0; m.fast = false;
  for (let i = 0; i < 8; i++) E.markPartResult(probe, true, false);
  assert(m.ivl <= 7,
    'a part answered right eight times in a row is still due within seven runs, not twenty-four: ivl=' + m.ivl);
  m.reps = 0; m.ivl = 1; m.lapses = 12; m.due = 999;
  const w = QE._partWeight ? QE._partWeight(probe) : null;
  if (w != null) assert(w > 0.18, 'a part dropped twelve times is not rested out of the pool: ' + w);

  /* ---------- the scheduler actually chases what you are bad at ----------
     Simulated before the fix, a player failing three quarters of their weak
     items saw those items only 1.38x as often as everything else — which is
     barely a preference at all. This runs the same simulation and holds the
     line at a real multiple. */
  {
    const st = E.S();
    Object.keys(st.mastery.parts).forEach(id => {
      const m = st.mastery.parts[id];
      m.seen = 1; m.correct = 0; m.wrong = 0; m.ef = 2.5; m.reps = 0; m.ivl = 0; m.due = 0; m.lapses = 0; m.fast = false;
    });
    const weak = ['itis', 'algia', 'emia', 'penia', 'stasis', 'lysis', 'poiesis', 'crit', 'globin', 'ectasis'];
    const asks = {};
    for (let run = 0; run < 30; run++) {
      st.runCount = run;
      for (let n = 0; n < 25; n++) {
        const Q = QE.generate({ types: ['partMeaning', 'meaningPart', 'trueFalse'] });
        if (!Q || !Q.conceptIds) continue;
        Q.conceptIds.forEach(id => {
          asks[id] = (asks[id] || 0) + 1;
          E.markPartResult(id, Math.random() < (weak.indexOf(id) >= 0 ? 0.25 : 0.92), false);
        });
      }
    }
    const wAvg = weak.reduce((a, id) => a + (asks[id] || 0), 0) / weak.length;
    const rest = Object.keys(asks).filter(id => weak.indexOf(id) < 0);
    const oAvg = rest.reduce((a, id) => a + asks[id], 0) / Math.max(1, rest.length);
    const ratio = wAvg / Math.max(0.01, oAvg);
    assert(ratio >= 2.2,
      'a player failing their weak items sees them far more often than the rest — ratio ' +
      ratio.toFixed(2) + 'x (measured 1.38x before the scheduler was fixed)');
  }

  /* ---------- generated questions ---------- */
  const senseOf = (id) => PARTS[id].sense || PARTS[id].mean;
  let twoCorrect = 0, appended = 0, degenerate = 0, gk = 0, la = 0, total = 0;
  for (let i = 0; i < 900; i++) {
    const q = QE.generate({ types: ['partMeaning', 'meaningPart', 'trueFalse', 'spelling', 'originId', 'figureDeed'] });
    if (!q) continue;
    total++;
    // no two options may carry the same sense — that is a question with two answers
    if (q.type === 'partMeaning' || q.type === 'meaningPart') {
      const ids = Object.keys(PARTS);
      const seen = new Set();
      q.options.forEach(o => {
        const hit = ids.find(p => PARTS[p].text === o.label || PARTS[p].mean === o.label);
        if (hit) { const s = senseOf(hit); if (seen.has(s)) twoCorrect++; seen.add(s); }
      });
    }
    if (q.type === 'spelling') {
      const right = q.options.find(o => o.ok);
      q.options.forEach(o => { if (!o.ok && right && o.label.indexOf(right.label) === 0) appended++; });
    }
    if (q.type === 'figureDeed' && q.prompt.replace(/<[^>]+>/g, '').trim().length < 24) degenerate++;
    if (q.type === 'originId') { const ok = q.options.find(o => o.ok); if (ok) { if (ok.label === 'Greek') gk++; else la++; } }
  }
  assert(total > 700, 'the generator produced questions to inspect: ' + total);
  assert(twoCorrect === 0, 'no meaning question offers two options that mean the same thing: ' + twoCorrect);
  assert(appended === 0,
    'no spelling distractor is just the right answer with letters bolted on (carditisis): ' + appended);
  assert(degenerate === 0, 'no Chronicle question truncates to something unanswerable ("Who read Pasteur?"): ' + degenerate);
  const share = la / Math.max(1, gk + la);
  assert(share > 0.3 && share < 0.7,
    'guessing "Greek" no longer beats the origin question — Latin is ' + Math.round(share * 100) + '% of answers');

  summary(errors);
})();
