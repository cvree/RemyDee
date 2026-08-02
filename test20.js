/* test20 — THE META LAYER.
   Trophies, relics, chests, the Daily Trial and the Hall of Records.
   The Trial is actually played to the end, not just constructed. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const M = window.__RD_META, E = window.__RD_ENG, D = window.__RD_DATA;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));

  console.log('\n== the layer exists and initialised ==');
  assert(!!M, 'window.__RD_META is present');
  assert(M._ach.length >= 35, `${M._ach.length} trophies defined`);
  assert(Object.keys(M._relics).length === 16, '16 relics defined');
  assert(!!$('#s-hall'), 'the Hall screen was built');
  assert(!!$('#s-trial'), 'the Trial screen was built');

  console.log('\n== every trophy is well-formed and reachable ==');
  const seenIds = new Set();
  let bad = 0;
  M._ach.forEach(a => {
    if (seenIds.has(a.id)) { bad++; console.error('  duplicate id', a.id); }
    seenIds.add(a.id);
    if (!a.n || !a.d || !a.glyph || !a.t || !a.g) { bad++; console.error('  incomplete', a.id); }
    try {
      const [h, n] = a.prog();
      if (typeof h !== 'number' || typeof n !== 'number' || !(n > 0) || isNaN(h)) {
        bad++; console.error('  bad progress', a.id, h, n);
      }
    } catch (e) { bad++; console.error('  prog() threw for', a.id, e.message); }
  });
  assert(bad === 0, 'every trophy has a name, glyph, group and a sane progress pair');
  const tiers = new Set(M._ach.map(a => a.t));
  assert([...tiers].every(t => ['bronze','silver','gold','jade'].includes(t)), 'tiers are valid');

  console.log('\n== relics are wired to real numbers, not labels ==');
  const S = E.S();
  S.relics = {};
  const base = E.diffTune();
  assert(M.bonus('gateLead') === 0, 'no relics, no bonus');
  Object.keys(M._relics).forEach(id => { S.relics[id] = { at: Date.now() }; });
  const full = E.diffTune();
  assert(M.completeSets().length === 4, 'all four sets read as complete');
  assert(full.gateLead > base.gateLead, 'gate lead improves with the Scribe set');
  assert(full.drain < base.drain, 'stamina drain falls with the Walker set');
  assert(full.healMul > base.healMul, 'term recovery rises with the Physician set');
  assert(full.momentumDecay < base.momentumDecay, 'momentum decay falls with the Shadow set');
  // and the caps hold, so a full collection cannot trivialise the road
  assert(full.gateLead < base.gateLead * 1.5, 'gate lead bonus is capped');
  assert(full.drain > base.drain * 0.55, 'drain reduction is capped');
  S.relics = {};

  console.log('\n== chests: rank is earned, loot is legal ==');
  let lowLegend = 0, highLegend = 0;
  for (let i = 0; i < 3000; i++) {
    if (M._rollRank(0).id === 'legendary') lowLegend++;
    if (M._rollRank(1).id === 'legendary') highLegend++;
  }
  assert(highLegend > lowLegend * 2, `a good road opens better chests (${highLegend} vs ${lowLegend} per 3000)`);
  let lootBad = 0;
  M._ranks.forEach(rank => {
    for (let i = 0; i < 400; i++) {
      const loot = M._rollLoot(rank);
      if (!loot.length) { lootBad++; continue; }
      if (!loot.some(l => l.kind === 'ink')) lootBad++;
      loot.forEach(l => { if (!l.name || !l.glyph || !l.note) lootBad++; });
    }
  });
  assert(lootBad === 0, 'every chest at every rank yields named, described loot including ink');

  console.log('\n== the Daily Trial is the same twelve for everyone ==');
  const sig = t => JSON.stringify(t.map(q => [q.prompt, q.options.map(o => o.label + o.ok)]));
  const a1 = M.buildTrial('2026-08-02'), a2 = M.buildTrial('2026-08-02');
  assert(sig(a1) === sig(a2), 'the same date builds a byte-identical Trial');
  assert(sig(a1) !== sig(M.buildTrial('2026-08-03')), 'a different date builds a different Trial');
  assert(a1.length === 12, 'twelve questions');
  assert(a1.every(q => q.options.filter(o => o.ok).length === 1), 'each has exactly one answer');
  // a Trial must not be shaped by how good the player is
  for (let i = 0; i < 60; i++) E.markPartResult(Object.keys(D.PARTS)[i % 73], i % 3 !== 0);
  assert(sig(M.buildTrial('2026-08-02')) === sig(a1), 'mastery state does not change the day\'s draw');
  // and it must be a real mix, not twelve of the same thing
  const kinds = new Set(a1.map(q => q.type));
  assert(kinds.size >= 6, `the twelve span ${kinds.size} question types`);
  const lore = a1.filter(q => ['figureDeed','figureGift','mythBuster','chronology'].includes(q.type));
  const orig = a1.filter(q => String(q.type).indexOf('origin') === 0);
  assert(lore.length >= 1, `the Chronicle appears (${lore.length})`);
  assert(orig.length >= 1, `the tongues appear (${orig.length})`);

  console.log('\n== playing the Trial to the end ==');
  E.setS(E.newGame());
  M.init();
  M.openTrial();
  await until(() => $('#s-trial') && $('#s-trial').classList.contains('active'), 4000, 'trial screen');
  assert($('#s-trial').classList.contains('active'), 'the Trial screen opened');
  await until(() => $$('#trial-opts .trial-opt').length > 0, 4000, 'first question');
  assert($$('#trial-opts .trial-opt').length >= 2, 'the first question rendered its answers');
  assert(!!$('.trial-hud'), 'the HUD rendered');

  // answer everything correctly and walk all the way to the end card
  let guard = 0;
  while (guard++ < 400) {
    const end = $('#trial-done');
    if (end) break;
    const opts = $$('#trial-opts .trial-opt');
    if (!opts.length || opts[0].disabled) { await sleep(120); continue; }
    const T = M._trial();
    if (!T) break;
    const q = T.extra || T.qs[T.i];
    const idx = q.options.findIndex(o => o.ok);
    opts[idx].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(200);
  }
  assert(!!$('#trial-done'), 'a perfect Trial reaches the end card');
  const st = E.S();
  assert(st.daily.lastDone === M.utcDay(), 'the day is logged');
  assert(st.daily.streak === 1, 'the streak starts at one');
  assert(st.daily.score > 0, `a score was recorded (${st.daily.score})`);
  assert((st.records.daily || []).length === 1, 'the Trial posted to the Hall of Records');
  assert(st.lifetime.answers >= 12, `answers were counted (${st.lifetime.answers})`);
  assert(st.lifetime.correct >= 12, `correct answers were counted (${st.lifetime.correct})`);
  assert(!!st.ach.daily1, 'finishing a Trial earns its trophy');

  console.log('\n== wrong answers buy extra practice, not a dead end ==');
  E.setS(E.newGame());
  M.init();
  M.openTrial();
  await until(() => $$('#trial-opts .trial-opt').length > 0
    && !$$('#trial-opts .trial-opt')[0].disabled, 4000, 'question');
  const T2 = M._trial();
  const before = T2.i;
  const q2 = T2.qs[T2.i];
  const wrongIdx = q2.options.findIndex(o => !o.ok);
  $$('#trial-opts .trial-opt')[wrongIdx].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(160);
  assert(!!$('.trial-teach.miss'), 'a wrong answer explains itself');
  assert(/./.test($('.trial-teach .tt-b').textContent.trim()), 'the explanation is not empty');
  await sleep(2400);
  const T3 = M._trial();
  const gotExtra = !!(T3 && T3.extra);
  assert(gotExtra || (T3 && T3.i > before), 'the Trial moves on — either to reinforcement or the next question');
  if (gotExtra) {
    assert(T3.extra.conceptIds.some(c => q2.conceptIds.includes(c)),
      'the reinforcement question targets the concept that was missed');
    assert(/Reinforcement/.test($('.tq-type').textContent), 'and it is labelled as free practice');
  }

  console.log('\n== three mistakes end it ==');
  let g2 = 0;
  while (g2++ < 400) {
    const T4 = M._trial();
    if (!T4 || T4.done) break;
    const opts = $$('#trial-opts .trial-opt');
    if (!opts.length || opts[0].disabled) { await sleep(140); continue; }
    const q = T4.extra || T4.qs[T4.i];
    const wi = q.options.findIndex(o => !o.ok);
    opts[wi].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(260);
  }
  await until(() => !!$('#trial-done'), 5000, 'trial end card');
  assert(!!$('#trial-done'), 'losing all three lives ends the Trial');

  console.log('\n== the Hall renders every tab without throwing ==');
  ['trophies', 'relics', 'records', 'chronicle'].forEach(tab => {
    let threw = null;
    try { M.open(tab); } catch (e) { threw = e; }
    assert(!threw, `the ${tab} tab opens${threw ? ' — ' + threw.message : ''}`);
  });
  await until(() => $('#hall-body') && $('#hall-body').children.length > 0, 4000, 'hall body');
  assert($('#hall-body').children.length > 0, 'the Hall painted content');

  console.log('\n== the hub card mounts ==');
  window.__RD_SCREENS.showHub();
  await until(() => $('#daily-mount') && $('#daily-mount').querySelector('.daily-card'), 4000, 'hub card');
  assert(!!$('#daily-mount .daily-card'), 'the Daily Trial card is on the hub');
  assert(!!$('#daily-go'), 'and it has a button that starts the Trial');
  assert(!!$('#hub-hall'), 'the hub has a door to the Hall');

  console.log('\n== a v7 save gains the meta layer without losing anything ==');
  window.localStorage.setItem('remydee_lost_lexicon_v3', JSON.stringify({
    ver: 7, chapter: 3, rep: 88, coin: 140, pages: 3, servedChapterIds: ['ch0','ch1','ch2'],
    completedTerms: ['carditis','gastritis'], mastery: { terms: {}, parts: {} },
    settings: { difficulty: 'steady', vol: {}, textSize: 'md' },
    support: { hint: 1, consult: 2, recall: 3 }, arcade: { slice:{best:9,plays:2}, match:{best:4,plays:1} }
  }));
  const mig = E.Save.read();
  assert(mig.ver === 8, 'migrated to v8');
  assert(mig.rep === 88 && mig.chapter === 3 && mig.pages === 3, 'old progress survived');
  assert(mig.arcade.slice.best === 9, 'old Training Hall records survived');
  assert(typeof mig.ach === 'object' && typeof mig.daily === 'object'
      && typeof mig.records === 'object' && typeof mig.relics === 'object'
      && typeof mig.lifetime === 'object' && Array.isArray(mig.reask),
    'every meta field was backfilled');
  assert(typeof mig.runCount === 'number', 'the review clock was backfilled');

  summary(errors);
})();
