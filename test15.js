/* test15.js — DEPTH PASS: the Endless Road. One road, no destination,
   escalating density, ends the instant stamina breaks, and remembers a
   best score. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();
  const doc = window.document;

  /* ================= buildEndlessEvents ================= */
  const evs = MI.buildEndlessEvents();
  assert(evs.length > 100, `endless: the pre-generated event list is genuinely long (${evs.length} events), not a short repeating loop`);
  assert(evs[evs.length - 1].at > 30, 'endless: events extend far past a normal road\'s 0..1 progress range');
  let increasing = true;
  for (let i = 1; i < evs.length; i++) if (evs[i].at <= evs[i - 1].at) increasing = false;
  assert(increasing, 'endless: events are strictly ordered by distance');
  const early = evs.filter(e => e.at < 5).length, late = evs.filter(e => e.at >= 5 && e.at < 10).length;
  assert(late >= early, `endless: spacing tightens (or at least does not loosen) with distance (early stretch: ${early} events, later stretch: ${late})`);

  /* ================= STARTING & PROGRESS UNCAPPED ================= */
  MI.startEndlessRoad();
  await until(() => !!MI._state(), 6000, 'endless mission starts');
  const M = MI._state();
  assert(M.endless === true, 'endless: the mission is correctly flagged');
  assert((M.f.forged || []).length === 0, 'endless: the pure-fluency mode starts bare-handed, by design');

  // push progress well past 1.0 and confirm nothing caps or triggers a normal arrival
  M.progress = 1.4;
  for (let i = 0; i < 5; i++) { MI._use ? null : null; await sleep(30); }
  await sleep(60);
  assert(MI._state().progress >= 1.4, 'endless: progress is not clamped at 1.0 — there is no destination');
  assert(!doc.getElementById('s-result').classList.contains('active'), 'endless: passing progress 1.0 does not trigger a normal chapter arrival');

  /* ================= DIFFICULTY ESCALATES WITH DISTANCE ================= */
  const dNear = MI._difficultyAt(Math.min(1, 0.2 / 2.2));
  const dFar = MI._difficultyAt(Math.min(1, 3.5 / 2.2));
  assert(dFar.density > dNear.density, 'endless: hazard density is visibly higher far into the walk than near the start');

  /* ================= STAMINA BREAKS THE RUN ================= */
  MI._state().stats.stamina = 3;
  MI._state().realTermsBuilt = 2;
  MI._state().bestMomentum = 2.4;
  await sleep(120); // one real tick is enough for the passive drain to reach zero
  await until(() => doc.getElementById('endless-result').classList.contains('show'), 6000, 'endless result panel opens on stamina break');
  assert(MI._state().done === true, 'endless: the mission is marked done the instant stamina breaks');
  assert(doc.getElementById('er-body').innerHTML.includes('2'), 'endless: the result panel reports the real terms built this run');

  /* ================= BEST SCORE PERSISTS ================= */
  assert(typeof E.S().endlessScore === 'number' && E.S().endlessScore > 0, 'endless: a completed run records a best score');
  assert(E.S().endlessBest > 0, 'endless: a completed run records a best distance');
  const firstBest = E.S().endlessScore;

  // a WORSE run should not overwrite the best
  MI.startEndlessRoad();
  await until(() => !!MI._state() && !MI._state().done, 6000, 'second endless run starts');
  MI._state().progress = 0.05;
  MI._state().realTermsBuilt = 0;
  MI._state().stats.stamina = 0.5;
  await sleep(120);
  await until(() => doc.getElementById('endless-result').classList.contains('show'), 6000, 'second result panel opens');
  assert(E.S().endlessScore === firstBest, 'endless: a worse run does not overwrite a better best score');

  summary(errors);
})();
