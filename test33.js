/* test33 — THE TRIALS (__RD_MG)
   ------------------------------------------------------------------
   The mini-game library: the grade ladder every caller pays out
   against, the activity pools that decide which archetype a chest or
   a cache gets, and the wiring into the chest ceremony, the road's
   cache and slide, and the bench's proof step.

   The trials themselves are hand-skill challenges and jsdom has no
   hands, so what is proved here is everything AROUND the hands: that
   the grades are ordered and gated, that every archetype is reachable
   and constructible, that no trial leaves a veil behind it, and above
   all that the grade CHANGES the outcome at every call site — which is
   the entire point of the pass. A mini-game you cannot fail is a
   cutscene with a button on it. */
const { boot, sleep, until, assert, summary } = require('./testlib.js');

(async () => {
  const { window, errors } = await boot();
  const MG = window.__RD_MG, E = window.__RD_ENG, D = window.__RD_DATA, META = window.__RD_META;
  const $ = (s) => window.document.querySelector(s);
  assert(!!MG, 'the trials module is exposed as __RD_MG');
  assert(typeof MG.run === 'function' && typeof MG.play === 'function', 'run() and play() are the public calls');

  /* ================= 1. THE GRADE LADDER ================= */
  console.log('\n== one ladder, five rungs, used by every caller ==');
  assert(MG.GRADES.length === 5, 'five tiers: fail, rough, clean, excellent, flawless');
  const mults = MG.GRADES.map(g => g.mult);
  assert(mults[0] === 0, 'a failed trial pays nothing at all');
  for (let i = 1; i < 5; i++) assert(mults[i] > mults[i - 1], `tier ${i} pays strictly more than tier ${i - 1}`);
  assert(mults[4] > 1.5, 'a flawless run pays well over a clean one — mastery is worth chasing');

  assert(MG.gradeOf(0.10, false) === 0, 'a bad score fails');
  assert(MG.gradeOf(0.45, false) === 1, 'a scrappy score is rough');
  assert(MG.gradeOf(0.70, false) === 2, 'a decent score is clean');
  assert(MG.gradeOf(0.88, false) === 3, 'a strong score is excellent');
  assert(MG.gradeOf(0.99, true) === 4, 'a near-perfect score WITH no slips is flawless');
  /* THE GATE THAT MAKES THE TOP RUNG MEAN SOMETHING. */
  assert(MG.gradeOf(0.99, false) === 3,
    'the same score with one slip anywhere caps at excellent — flawless cannot be bought with accuracy alone');
  assert(MG.result(1, false).flawless === false, 'result() refuses to call a slipped run flawless');
  assert(MG.result(1, true).flawless === true, 'and honours a clean one');

  /* ================= 2. DIFFICULTY COMES FROM THE GAME ================= */
  console.log('\n== difficulty is read from the run, not passed in blind ==');
  const st = E.newGame(); E.setS(st);
  st.chapter = 1; st.settings.difficulty = 'steady';
  const early = MG.diffFor(0.4);
  st.chapter = 8;
  const late = MG.diffFor(0.4);
  assert(late > early, 'the same trial is harder in chapter eight than in chapter one');
  st.chapter = 1; st.settings.difficulty = 'gentle';
  const gentle = MG.diffFor(0.4);
  st.settings.difficulty = 'brutal';
  const brutal = MG.diffFor(0.4);
  assert(brutal > gentle, "the player's chosen difficulty scales the whole ladder");
  assert(MG.diffFor(0) >= 0 && MG.diffFor(1) <= 1, 'difficulty stays inside 0..1 at both extremes');
  st.settings.difficulty = 'steady';

  /* ================= 3. THE LIBRARY ================= */
  console.log('\n== ten archetypes, and every one of them reachable ==');
  const TYPES = ['sweetspot', 'needle', 'rhythm', 'sequence', 'match', 'flow', 'aim', 'trace', 'track', 'struggle'];
  TYPES.forEach(t => assert(typeof MG.ARCH[t] === 'function', `archetype "${t}" exists`));
  assert(Object.keys(MG.ARCH).length === TYPES.length, 'and there are no others hiding in the table');

  const used = new Set();
  Object.keys(MG.ACTS).forEach(act => {
    const pool = MG.ACTS[act];
    assert(pool.length >= 3, `${act}: offers at least three different challenges`);
    pool.forEach(p => {
      used.add(p.type);
      assert(typeof MG.ARCH[p.type] === 'function', `${act}/${p.type}: names a real archetype`);
      assert(p.title && p.brief, `${act}/${p.type}: names itself and teaches itself in one line`);
      /* FAILURE HAS TO MEAN SOMETHING, AND IT HAS TO BE SAID OUT LOUD. */
      assert(!!p.stakes, `${act}/${p.type}: states what failing costs before a hand moves`);
    });
    const kinds = new Set(pool.map(p => p.type));
    assert(kinds.size === pool.length, `${act}: no archetype is listed twice in the same pool`);
  });
  assert(used.size === TYPES.length,
    `every archetype is assigned to at least one activity (${used.size}/${TYPES.length})`);

  /* VARIATION. The same chest twice running must not be the same challenge. */
  console.log('\n== the same activity does not repeat itself back to back ==');
  let repeats = 0, seen = [];
  for (let i = 0; i < 40; i++) {
    const p = MG.pickFor('chest');
    if (seen.length && p.type === seen[seen.length - 1]) repeats++;
    seen.push(p.type);
  }
  assert(repeats === 0, `forty chests in a row never drew the same trial twice running (${repeats} repeats)`);
  assert(new Set(seen).size >= 3, `and drew at least three different ones (${new Set(seen).size})`);

  /* ================= 4. THE LEXICON FEED ================= */
  console.log('\n== the knowledge trials pull from what the player is learning ==');
  const pool = MG._lexPool(6, MG._rng(1));
  assert(pool.length === 6, 'lexPool returns the count asked for');
  assert(pool.every(id => !!D.PARTS[id]), 'every id it returns is a real word-part');
  assert(new Set(pool).size === 6, 'with no duplicates — a pairs board of one part twice is not a pairs board');

  /* ================= 5. NO TRIAL LEAVES ANYTHING BEHIND ================= */
  console.log('\n== a trial cleans up after itself ==');
  MG.setAuto(null);
  const before = window.document.querySelectorAll('.mg-veil').length;
  for (const t of TYPES) {
    const p = MG.play({ type: t, diff: 0.5, title: 'probe', brief: 'probe' });
    await sleep(90);                                     // a few real frames
    const veil = window.document.querySelector('.mg-veil');
    assert(!!veil, `${t}: opens a stage`);
    assert(!!veil.querySelector('canvas'), `${t}: and draws on a canvas, not a pile of divs`);
    assert(veil.getAttribute('aria-modal') === 'true', `${t}: takes the screen as a dialog`);
    assert(!!veil.querySelector('.mg-live'), `${t}: carries a live region — a canvas says nothing on its own`);
    veil.remove();                                       // abandon it the way a torn-down screen would
    await sleep(20);
  }
  await sleep(120);
  assert(window.document.querySelectorAll('.mg-veil').length === before,
    'ten trials opened and abandoned leave no veils behind');
  MG.setAuto(2);

  /* ================= 6. RELAX MODE ================= */
  console.log('\n== relax mode softens the trial, it does not switch it off ==');
  MG.setAuto(null);
  E.S().settings.timerRelax = true;
  // with no input at all the sweet-spot trial ends on its own timer at zero;
  // relax mode has to lift that off the floor rather than leave it a failure
  const relaxed = await Promise.race([
    MG.play({ type: 'sweetspot', diff: 0.9, title: 'relax probe', holdFor: 0.01 }).then(r => r),
    sleep(4000).then(() => null)
  ]);
  const rv = window.document.querySelector('.mg-veil'); if (rv) rv.remove();
  E.S().settings.timerRelax = false;
  MG.setAuto(2);
  assert(relaxed === null || relaxed.tier >= 1,
    'in relax mode a trial cannot land on an outright failure');

  /* ================= 7. THE CHEST ================= */
  console.log('\n== the chest is worked, and the grade decides the contents ==');
  const roll = (tier) => {
    MG.setAuto(tier);
    E.setS(E.newGame());
    const r = META.grantChest(0.95, 'test', () => {});
    return r;
  };
  const openIt = async () => {
    const box = $('#chest-veil .chest-box');
    if (box) box.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await until(() => $('#chest-veil') && $('#chest-veil').classList.contains('opened'), 4000, 'chest opens');
  };
  const takeIt = async () => {
    const b = $('#chest-veil .chest-done .btn');
    if (b) b.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(360);
  };

  roll(0); await openIt();
  const failCoin = E.S().coin, failRows = window.document.querySelectorAll('#chest-veil .loot-row').length;
  assert(failRows >= 1, 'a forced chest still gives up whatever was loose in it');
  await takeIt();

  roll(4); await openIt();
  const perfCoin = E.S().coin, perfRows = window.document.querySelectorAll('#chest-veil .loot-row').length;
  await takeIt();
  assert(perfCoin > failCoin,
    `a flawless pick pays more ink than a forced one (${perfCoin} vs ${failCoin})`);
  assert(perfRows > failRows,
    `and gives up more of what was locked away (${perfRows} rows vs ${failRows})`);

  // the chest cannot be taken before it has opened — the trial sits in between
  MG.setAuto(2);
  E.setS(E.newGame());
  META.grantChest(0.9, 'test', () => {});
  await sleep(60);
  const early2 = $('#chest-veil .chest-done .btn');
  if (early2) early2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(80);
  assert($('#chest-veil') && $('#chest-veil').classList.contains('show'),
    'take-it-all does nothing until the lid is actually off');
  await openIt(); await takeIt();
  assert(E.S().chests === 1, 'and the chest is counted exactly once');

  /* ================= 7b. THE MISSION'S NEW PATTERN LIVES IN THE CHEST =========
     One new commission pattern per mission, and the chest is where it arrives.
     The rule that matters: progression is NEVER gated on hand skill. A fumbled
     lock costs you the roll — it must never cost you the pattern, or a player
     who cannot pick locks stops being able to play the game. */
  console.log('\n== the mission\'s new pattern is delivered by the chest ==');
  const pin = () => ({ kind: 'blueprint', id: 'blade', glyph: 'Δ', rare: true,
    name: 'War blade — a new pattern', note: 'cuts snags. Cut for <b>Thera</b>.' });
  const rowNames = () => [...window.document.querySelectorAll('#chest-veil .loot-row .ln')]
    .map(n => n.textContent);

  for (const tier of [0, 2, 4]) {
    MG.setAuto(tier);
    E.setS(E.newGame());
    assert(!(E.S().unlockedBps || []).includes('blade'), `tier ${tier}: the bench does not know the pattern yet`);
    META.grantChest(0.8, 'arrival', () => {}, { pin: [pin()] });
    await sleep(120);
    await openIt();
    const names = rowNames();
    assert(names[0] === 'War blade — a new pattern',
      `tier ${tier}: the pattern is the FIRST thing out of the chest`);
    await takeIt();
    assert((E.S().unlockedBps || []).includes('blade'),
      `tier ${tier}: and the bench has learned it — even a forced lock cannot cost you progression`);
  }

  /* what the grade DOES decide: whether the pattern arrives with its stock */
  MG.setAuto(0);
  E.setS(E.newGame());
  META.grantChest(0.8, 'arrival', () => {}, { pin: [pin()] });
  await sleep(120); await openIt(); await takeIt();
  assert((E.S().foundMats || []).length === 0, 'a forced lock yields no bench stock alongside the pattern');

  MG.setAuto(4);
  E.setS(E.newGame());
  META.grantChest(0.8, 'arrival', () => {}, { pin: [pin()] });
  await sleep(120); await openIt(); await takeIt();
  const mats = E.S().foundMats || [];
  assert(mats.length === 1, 'a flawless one folds a length of bench stock in beside it');
  const FOUND = window.__RD_FOUND || {};
  assert(FOUND[mats[0]] && FOUND[mats[0]].forBps.includes('blade'),
    `and it is the stock that pattern was cut for (${mats[0]})`);

  /* a replayed road owes nothing: no phantom pattern in the chest */
  MG.setAuto(2);
  E.setS(E.newGame());
  const MIx = window.__RD_MISSION;
  assert(typeof MIx._pendingPattern === 'function', 'the arrival exposes what pattern it owes');
  const ch1 = D.CHAPTERS[0];
  const owed = MIx._pendingPattern(ch1);
  if (owed) {
    assert(owed.kind === 'blueprint' && !!D.CHAPTERS.length, 'a fresh chapter owes a real pattern');
    E.S().unlockedBps = (E.S().unlockedBps || []).concat([owed.id]);
    assert(MIx._pendingPattern(ch1) === null,
      'and a road walked twice does not promise the same pattern again');
  }

  /* ================= 8. THE ROAD ================= */
  console.log('\n== the road pays what the hands earned ==');
  const MI = window.__RD_MISSION;
  const mNow = () => MI._dbg();
  const startRun = async () => {
    E.setS(E.newGame());
    const ch = D.CHAPTERS[0];
    E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 2), idx: 0,
      results: {}, forged: [], route: null, stats: {} });
    MI.runMission();
    await until(() => !!mNow(), 5000, 'road running');
    return mNow();
  };

  MG.setAuto(0);
  let M = await startRun();
  const threat0 = M.threat;
  MI._forceEvent('cache');
  await until(() => !M.paused, 4000, 'forced cache resolves');
  assert(M.threat > threat0, 'a forced cache makes noise the road remembers');
  assert((E.S().foundMats || []).length === 0, 'and gives up none of the rare bench stock');

  MG.setAuto(4);
  M = await startRun();
  MI._forceEvent('cache');
  await until(() => (E.S().foundMats || []).length >= 1, 4000, 'clean cache pays');
  assert((E.S().foundMats || []).length >= 1, 'a cleanly worked cache gives up the rare material');

  /* the slide: the same obstacle, two different outcomes */
  MG.setAuto(0);
  M = await startRun();
  M.stats.stamina = 100;
  MI._forceEvent('slide');
  await until(() => !M.paused, 4000, 'failed slide resolves');
  const badStam = M.stats.stamina;
  MG.setAuto(4);
  M = await startRun();
  M.stats.stamina = 100;
  MI._forceEvent('slide');
  await until(() => !M.paused, 4000, 'clean slide resolves');
  assert(M.stats.stamina > badStam,
    `heaving the rock well costs the squad less than heaving it badly (${M.stats.stamina} vs ${badStam})`);

  MG.setAuto(2);
  summary(errors);
})();
