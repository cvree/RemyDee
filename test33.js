/* test33 — THE TRIALS (__RD_MG)
   ------------------------------------------------------------------
   The mini-game library: the grade ladder the bench pays out against,
   the ten archetypes it can run, and — just as important — the places
   a trial must NEVER appear. Trials are how a weapon gets made. They
   are not how a road gets walked and they are not a toll on a reward.

   The trials themselves are hand-skill challenges and jsdom has no
   hands, so what is proved here is everything AROUND the hands: that
   the grades are ordered and gated, that every archetype is reachable
   and constructible, that no trial leaves a veil behind it, and that
   the grade CHANGES what leaves the bench — a mini-game you cannot
   fail is a cutscene with a button on it. */
const { boot, sleep, until, assert, summary } = require('./testlib.js');

(async () => {
  const { window, errors } = await boot();
  const MG = window.__RD_MG, E = window.__RD_ENG, D = window.__RD_DATA, META = window.__RD_META;
  const $ = (s) => window.document.querySelector(s);
  assert(!!MG, 'the trials module is exposed as __RD_MG');
  assert(typeof MG.play === 'function', 'play() is the public call');

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

  /* NOTHING PICKS A TRIAL AT RANDOM ANY MORE.
     The module used to own a table of activity pools and hand a caller a
     randomly chosen archetype, so a chest was a lock one night and a seized lid
     the next. Variety-by-dice is the enemy of a craft: a task you meet once is
     a puzzle, and a task you meet every time you build a bow is a skill. The
     pools are gone, and the bench names the archetype it wants. */
  ['run', 'ACTS', 'pickFor'].forEach((k) =>
    assert(MG[k] === undefined, `${k} is gone — the library no longer chooses for its caller`));

  /* And the one caller left spreads itself across the library: eight patterns,
     one trial each, and they must not all be the same trial. */
  const P = window.__RD_PREP;
  const bench = new Set();
  Object.keys(P._blueprints()).forEach((id) => bench.add(P.benchTrial(id).type));
  bench.forEach((t) => assert(typeof MG.ARCH[t] === 'function', `the bench asks for a real archetype (${t})`));
  assert(bench.size >= 6, `the bench reaches most of the library (${bench.size}/${TYPES.length} archetypes in use)`);

  /* ================= 3b. EVERY TRIAL ENDS =================
     The mortar hung. A rest played correctly is a rest you never strike, so
     nothing in the input path touched it, and the note-sweep scored those
     without resolving them — the end condition (every note judged) could not
     be reached and the bar ran until the player killed the tab. Two guards go
     in: the bug is fixed where it lives, and the library now refuses to run
     any trial past a ceiling, because SIX of the ten archetypes advance only
     on player input and any of them can be left open by a hand that stops. */
  console.log('\n== a trial always ends, with hands or without them ==');

  /* THE MORTAR, DIRECTLY. Drive the archetype forward in time with no input at
     all, over many seeds so bars with rests, holds and plain hits are all
     covered, and it must resolve every time. */
  const fakeStage = () => new Proxy({ w: 600, h: 400, briefA: 0, dt: 0, t: 0 }, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'string') { t[k] = () => {}; return t[k]; }
      return undefined;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
  const noopCombo = { hit() {}, break() {}, step() {}, paint() {}, best: 0 };
  const driveDry = async (type, seed, diff) => {
    let out = null;
    const api = { combo: noopCombo, diff, R: MG._rng(seed),
      finish(score, flawless, detail) { if (!out) out = { score, flawless, detail }; } };
    const impl = MG.ARCH[type](fakeStage(), { diff, R: MG._rng(seed), skin: 'pestle', seed }, api);
    // 60 trial-seconds at 1/30s a step, which is many times any bar's length
    for (let i = 0; i < 1800 && !out; i++) { try { impl.step && impl.step(1 / 30); } catch (e) {} }
    // the archetypes end through Ender(), which defers finish() by a beat so the
    // last hit can be seen — so the answer arrives after the stepping stops
    await sleep(420);
    return out;
  };
  let hung = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const r = await driveDry('rhythm', seed, 0.2 + (seed % 5) * 0.18);
    if (!r) hung++;
  }
  assert(hung === 0, `the mortar resolves on all forty seeds, untouched (${hung} hung)`);

  /* The specific shape of the bug: a bar carrying a rest. Rests appear at
     p = 0.10 + diff*0.16 per beat past the third, so a high-difficulty bar
     across forty seeds is certain to produce several. */
  let sawRest = 0, restHung = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const R = MG._rng(seed), diff = 0.95;
    const nBeats = 8 + Math.round(diff * 6);
    let rests = 0;
    for (let k = 0; k < nBeats; k++) {
      if (k > 0 && k % 4 === 3 && R.chance(0.55 + diff * 0.2)) continue;
      else if (k > 2 && R.chance(0.10 + diff * 0.16)) rests++;
    }
    if (!rests) continue;
    sawRest++;
    if (!(await driveDry('rhythm', seed, diff))) restHung++;
  }
  assert(sawRest > 0, `bars carrying an unplayed rest were actually generated (${sawRest} of 40 seeds)`);
  assert(restHung === 0,
    `and every one of them ends — an unplayed rest resolves instead of stalling the bar (${restHung} hung)`);

  /* THE DEADMAN, for the other nine. Every archetype, played by nobody, must
     still hand the caller a grade rather than sitting on the screen forever. */
  MG.setAuto(null);
  MG._setCeiling(0.5);                       // half a trial-second, so this is quick
  for (const t of TYPES) {
    const r = await Promise.race([
      MG.play({ type: t, diff: 0.5, title: 'deadman', brief: 'nobody is playing', holdFor: 0.01 }),
      // the ceiling ends the trial; the verdict card then plays out before the
      // promise resolves, so allow for that on top
      sleep(9000).then(() => null)
    ]);
    const v = window.document.querySelector('.mg-veil'); if (v) v.remove();
    assert(!!r, `${t}: a trial nobody plays still resolves rather than hanging`);
    if (r) assert(typeof r.score === 'number' && r.tier >= 0 && r.tier <= 4,
      `${t}: and it resolves to a real grade the caller can pay out (${r.grade})`);
    await sleep(20);
  }
  MG._setCeiling(null);
  MG.setAuto(2);

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

  /* ================= 7. THE CHEST IS NOT A TRIAL ================= */
  console.log('\n== the chest opens; it does not examine you ==');
  /* For one pass a lock-picking trial stood between the lid and the contents.
     It charged the player twice — they had already walked the road that earned
     the chest — and it turned the reward ceremony into an exam at the end of a
     run. The hands are asked for at the bench now. Out here the chest opens. */
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

  MG.setAuto(null);        // any trial that opened here would now really run
  E.setS(E.newGame());
  META.grantChest(0.9, 'test', () => {});
  await sleep(60);
  // take-it-all does nothing until the lid is actually off
  const early2 = $('#chest-veil .chest-done .btn');
  if (early2) early2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(80);
  assert($('#chest-veil') && $('#chest-veil').classList.contains('show'),
    'take-it-all does nothing until the lid is actually off');
  const box0 = $('#chest-veil .chest-box');
  if (box0) box0.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(200);
  assert(!window.document.querySelector('.mg-veil'),
    'pressing the lid opens no trial — no stage, no hand-skill toll on a reward');
  await until(() => $('#chest-veil').classList.contains('opened'), 4000, 'chest opens');
  assert(window.document.querySelectorAll('#chest-veil .loot-row').length >= 1,
    'and the chest gives up what it was carrying');
  await takeIt();
  assert(E.S().chests === 1, 'and the chest is counted exactly once');
  MG.setAuto(2);

  /* ================= 7b. THE MISSION'S NEW PATTERN LIVES IN THE CHEST =========
     One new commission pattern per mission, and the chest is where it arrives.
     The rule that matters: progression is NEVER gated on anything but walking
     the road. What the road's quality decides is what comes WITH the pattern. */
  console.log('\n== the mission\'s new pattern is delivered by the chest ==');
  const pin = () => ({ kind: 'blueprint', id: 'blade', glyph: 'Δ', rare: true,
    name: 'War blade — a new pattern', note: 'cuts snags. Cut for <b>Thera</b>.' });
  const rowNames = () => [...window.document.querySelectorAll('#chest-veil .loot-row .ln')]
    .map(n => n.textContent);

  for (const q of [0.2, 0.8]) {
    E.setS(E.newGame());
    assert(!(E.S().unlockedBps || []).includes('blade'), `q=${q}: the bench does not know the pattern yet`);
    META.grantChest(q, 'arrival', () => {}, { pin: [pin()] });
    await sleep(120);
    await openIt();
    assert(rowNames()[0] === 'War blade — a new pattern',
      `q=${q}: the pattern is the FIRST thing out of the chest`);
    await takeIt();
    assert((E.S().unlockedBps || []).includes('blade'),
      `q=${q}: and the bench has learned it — a bad road cannot cost you progression`);
  }

  /* what the road's quality DOES decide: whether the pattern arrives with stock */
  E.setS(E.newGame());
  META.grantChest(0.2, 'arrival', () => {}, { pin: [pin()] });
  await sleep(120); await openIt(); await takeIt();
  assert((E.S().foundMats || []).length === 0, 'a road walked badly yields no bench stock alongside the pattern');

  E.setS(E.newGame());
  META.grantChest(0.9, 'arrival', () => {}, { pin: [pin()] });
  await sleep(120); await openIt(); await takeIt();
  const mats = E.S().foundMats || [];
  assert(mats.length === 1, 'a road walked well folds a length of bench stock in beside it');
  const FOUND = window.__RD_FOUND || {};
  assert(FOUND[mats[0]] && FOUND[mats[0]].forBps.includes('blade'),
    `and it is the stock that pattern was cut for (${mats[0]})`);

  /* a replayed road owes nothing: no phantom pattern in the chest */
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

  /* ================= 8. THE WALK IS NOT INTERRUPTED =================
     The road used to stop the squad and put a trial on screen — a stem to cut at
     the spring, a lid to lever off a cache, a rockslide to shoulder. Good trials,
     wrong place: the one continuous stretch of the game became a corridor of
     pop-ups. The road reads the KIT now. Everything the hands earned at the bench
     is spent out here, and nothing stops to grade them again. */
  console.log('\n== no trial ever opens on the road ==');
  const MI = window.__RD_MISSION;
  const mNow = () => MI._dbg();
  const startRun = async (forged) => {
    E.setS(E.newGame());
    const ch = D.CHAPTERS[0];
    const caps = { climb:false, smoke:false, shoot:false, cut:false, heal:false, descend:false };
    (forged || []).forEach((it) => (it.grants || []).forEach((g) => { if (caps[g] != null) caps[g] = true; }));
    E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 2), idx: 0,
      results: {}, forged: forged || [], route: null, stats: { caps, traits: {}, perks: [] } });
    MI.runMission();
    await until(() => !!mNow(), 5000, 'road running');
    return mNow();
  };
  const edge = (qtier) => ({ id: 'blade_r', bpId: 'blade', craft: 'trace', name: 'Blade',
    genName: 'Road Blade', icon: 'blade', gear: 'blade', grants: ['cut'], perks: [],
    quality: 0.9, qtier, traits: { power: 2 }, craftMeta: { folds: 4, worstFold: 90 },
    assignedTo: null, tally: {}, wear: 0 });

  MG.setAuto(null);                 // a trial opening here would really run, and be seen
  let M = await startRun();
  const threat0 = M.threat;
  ['oasis', 'cache', 'slide'].forEach((ev) => MI._forceEvent(ev));
  await sleep(300);
  assert(!window.document.querySelector('.mg-veil'),
    'the spring, the cache and the rockslide open no trial between them');
  assert(!M.paused, 'and none of them pauses the walk to wait for a hand');
  MG.setAuto(2);

  /* THE KIT IS THE ANSWER NOW, and it is a real answer with a real cost. */
  console.log('\n== what you forged is what the road pays out ==');
  M = await startRun();                       // bare hands
  MI._forceEvent('cache');
  await sleep(200);
  assert(M.threat > threat0, 'a cache forced with bare hands makes noise the road remembers');
  assert((E.S().foundMats || []).length === 0, 'and gives up none of the rare bench stock');

  M = await startRun([edge('masterwork')]);   // a masterwork edge to prise it
  MI._forceEvent('cache');
  await until(() => (E.S().foundMats || []).length >= 1, 3000, 'an edge opens the cache');
  assert((E.S().foundMats || []).length >= 1, 'an edge opens the cache and it gives up the rare material');

  /* the slide: the same obstacle, two different outcomes */
  M = await startRun();
  M.stats.stamina = 100;
  MI._forceEvent('slide');
  await sleep(200);
  const badStam = M.stats.stamina;
  M = await startRun([edge('masterwork')]);
  M.stats.stamina = 100;
  MI._forceEvent('slide');
  await sleep(200);
  assert(M.stats.stamina > badStam,
    `gear moves the rock; bare shoulders pay for it (${M.stats.stamina} vs ${badStam})`);

  MG.setAuto(2);
  summary(errors);
})();
