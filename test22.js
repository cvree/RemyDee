/* test22 — ROBUSTNESS.
   Every case here is a bug that was actually reproduced: a save that wiped
   progress, a screen that could not be left, a reward that was silently
   discarded, a loop that ran forever. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));
  const E = window.__RD_ENG, D = window.__RD_DATA, M = window.__RD_META, MI = window.__RD_MISSION;
  const KEY = 'remydee_lost_lexicon_v3';
  const load = (obj) => { window.localStorage.setItem(KEY, JSON.stringify(obj)); return E.Save.read(); };

  console.log('\n== a corrupted save must never take the player down with it ==');
  let threw = null;
  try {
    const m = load({ ver: 8, chapter: 2, rep: 10, mastery: null, settings: { vol: {} } });
    assert(m && m.mastery && m.mastery.parts && m.mastery.terms, 'mastery:null is rebuilt, not passed through');
  } catch (e) { threw = e; }
  assert(!threw, `a null mastery does not throw${threw ? ' — ' + threw.message : ''}`);

  [['settings:{}', {}], ['settings:[]', []], ['settings missing vol', { textSize: 'lg' }]].forEach(([label, st]) => {
    let t2 = null, m = null;
    try { m = load({ ver: 8, chapter: 1, rep: 4, settings: st }); } catch (e) { t2 = e; }
    assert(!t2 && m && m.settings && m.settings.vol && typeof m.settings.vol.master === 'number',
      `${label} is merged over the defaults`);
  });

  console.log('\n== a save from a NEWER build must not be shredded ==');
  const future = load({
    ver: 99, chapter: 7, rep: 500, coin: 900, pages: 7,
    servedChapterIds: ['ch0','ch1','ch2','ch3','ch4','ch5','ch6'],
    techniques: ['tempering','twinstoke'], relics: { seal: {}, lens: {} }, chests: 4,
    somethingFromTheFuture: { nested: true }
  });
  assert(future.chapter === 7, 'chapter survived');
  assert(future.servedChapterIds.length === 7, 'campaign history survived');
  assert(future.techniques.length === 2, 'bench techniques survived');
  assert(Object.keys(future.relics).length === 2, 'relics survived');
  assert(future.chests === 4, 'chest count survived');
  assert(future.somethingFromTheFuture, 'unknown future fields are left alone');

  console.log('\n== truly unreadable saves still fall back cleanly ==');
  window.localStorage.setItem(KEY, '{"ver":8,"chapter":');
  let t3 = null, bad = null;
  try { bad = E.Save.read(); } catch (e) { t3 = e; }
  assert(!t3, 'truncated JSON does not throw');
  assert(bad === null, 'and returns null so a fresh game starts');

  console.log('\n== every authored traveler gets to build their term ==');
  E.setS(E.newGame());
  const S = E.S();
  const built = new Set();
  let busiest = 0;
  D.CHAPTERS.forEach(c => {
    const p = E.partyFor(c);
    busiest = Math.max(busiest, p.builders.length);
    p.builders.forEach(id => { built.add(id); S.completedTerms.push(D.TRAVELERS[id].term); });
    E.commitParty(p);
  });
  const authored = new Set();
  D.CHAPTERS.forEach(c => (c.builders || []).forEach(b => { if (D.TRAVELERS[b]) authored.add(b); }));
  const stranded = [...authored].filter(id => !built.has(id));
  assert(authored.size >= 40, `${authored.size} distinct authored builders`);
  assert(stranded.length === 0, `nobody is left unbuilt (${stranded.length} stranded)`);
  assert(S.pending.length === 0, `the waiting list is empty at the end (${S.pending.length})`);
  assert(busiest <= 7, `no chapter demands more than seven builds (busiest ${busiest})`);
  // and a traveler already served is never re-queued
  E.setS(E.newGame());
  const S2 = E.S();
  const ch1 = D.CHAPTERS[1];
  const first = E.partyFor(ch1);
  S2.completedTerms = first.builders.map(id => D.TRAVELERS[id].term);
  E.commitParty(first);
  const again = E.partyFor(ch1);
  assert(!again.builders.some(id => first.builders.includes(id)),
    'a traveler whose term is already built is not asked again');

  console.log('\n== the Daily Trial cannot be lost by walking away ==');
  E.setS(E.newGame());
  M.init();
  M.openTrial();
  await until(() => $$('#trial-opts .trial-opt').length > 0, 4000, 'trial');
  const key = M.utcDay();
  window.__RD_SCREENS.showHub();
  await sleep(400);
  // the clock must be stopped: nothing may auto-answer while the player is away
  const T = M._trial();
  const iAtLeave = T ? T.i : 0;
  await sleep(2500);
  const T2 = M._trial();
  assert(!T2 || T2.i === iAtLeave, 'the Trial does not advance itself once the screen is left');
  assert(!T2 || T2.lives === 3, `no lives are burned off-screen (${T2 ? T2.lives : 'n/a'})`);
  assert(E.S().daily.lastDone !== key, 'and the day is not stamped as spent');

  console.log('\n== a "none" day can be redeemed ==');
  const st = E.S();
  st.daily.medals = { [key]: 'none' };
  st.daily.lastDone = null;
  M.openTrial();
  await until(() => $$('#trial-opts .trial-opt').length > 0, 4000, 'trial again');
  let guard = 0;
  while (guard++ < 400) {
    if ($('#trial-done')) break;
    const opts = $$('#trial-opts .trial-opt');
    if (!opts.length || opts[0].disabled) { await sleep(110); continue; }
    const t = M._trial(); if (!t) break;
    const q = t.extra || t.qs[t.i];
    opts[q.options.findIndex(o => o.ok)].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(190);
  }
  assert(!!$('#trial-done'), 'the replay finished');
  assert(E.S().daily.medals[key] !== 'none',
    `a perfect replay upgrades the day's medal (now ${E.S().daily.medals[key]})`);

  console.log('\n== the end card survives a double click ==');
  const before = errors.length;
  $('#trial-done').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  $('#trial-done') && $('#trial-done').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(200);
  assert(errors.length === before, 'clicking through twice throws nothing');

  console.log('\n== no chest is ever silently discarded ==');
  /* The Trial's own payout chest may still be on screen from the block above.
     It used to be dropped by a timing race — the take-it-all button was live
     before the lid was, so the veil could be dismissed out from under its own
     loot. It is not dropped any more, which is the point of this section, so
     drain it before counting rather than pretending it was never granted. */
  {
    let guard = 0;
    while (guard++ < 12 && $('#chest-veil') && $('#chest-veil').classList.contains('show')) {
      const box = $('#chest-veil .chest-box');
      if (box) box.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(200);
      const d = $('#chest-veil .chest-done .btn');
      if (d) d.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(320);
    }
  }
  E.setS(E.newGame());
  const st3 = E.S();
  const coin0 = st3.coin;
  let fired = 0;
  for (let i = 0; i < 4; i++) M.grantChest(0.9, 'test', () => { fired++; });
  await sleep(120);
  // the first is on screen; the rest are queued, not dropped
  const veil = $('#chest-veil');
  assert(!!veil && veil.classList.contains('show'), 'the first chest is on screen');
  let spins = 0;
  while (spins++ < 40 && fired < 4) {
    const box = $('#chest-veil .chest-box');
    if (box) box.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(160);
    const done = $('#chest-veil .chest-done .btn');
    if (done) done.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(300);
  }
  assert(fired === 4, `all four chests were opened and paid out (${fired}/4)`);
  assert(E.S().chests === 4, `and all four were counted (${E.S().chests})`);
  assert(E.S().coin > coin0, 'the ink actually landed');

  console.log('\n== the review debt stays bounded in-run too ==');
  E.setS(E.newGame());
  const ch = D.CHAPTERS[1];
  E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {},
    forged: [], route: null,
    stats: { tot:{stamina:5,safety:4,speed:4,morale:5,weather:3,health:3},
             prepScore:0.6, caps:{}, overall:0.6, shortfalls:[], termScore:0.7 } });
  MI.runMission();
  await sleep(700);
  for (let i = 0; i < 120; i++) MI._pushReask('thromb');
  const parts = Object.keys(D.PARTS);
  for (let i = 0; i < 60; i++) MI._pushReask(parts[i % parts.length]);
  const live = MI._reask();
  assert(live.length <= 12, `the in-run queue is capped (${live.length})`);
  assert(new Set(live).size === live.length, 'and holds no duplicates');
  assert(E.S().reask.length <= 12, `the persisted queue is capped too (${E.S().reask.length})`);

  console.log('\n== rapid departs leave exactly one render loop ==');
  let frames = 0;
  const realRaf = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) { frames++; return realRaf.call(window, cb); };
  const mkFlow = () => ({ chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0,
    results: {}, forged: [], route: null,
    stats: { tot:{stamina:5,safety:4,speed:4,morale:5,weather:3,health:3},
             prepScore:0.6, caps:{}, overall:0.6, shortfalls:[], termScore:0.7 } });
  E.setFlow(mkFlow()); MI.runMission();
  await sleep(1000);
  const single = frames;
  frames = 0;
  for (let i = 0; i < 6; i++) { E.setFlow(mkFlow()); MI.runMission(); }
  await sleep(1000);
  const sixfold = frames;
  window.requestAnimationFrame = realRaf;
  assert(sixfold < single * 2.5,
    `six rapid departs do not multiply the render loop (${single} → ${sixfold} frames)`);

  summary(errors);
})();
