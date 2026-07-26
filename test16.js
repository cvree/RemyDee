/* test16.js — DEPTH PASS: Lexicon Trials (DEPTH_PLAN §5.3). Short, focused
   runs against a single word-part kind, or generated from the player's own
   weak spots — reusing the same adaptive mastery data the campaign already
   keeps, with no new content. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();
  const doc = window.document;

  /* ================= buildTrialEvents ================= */
  const evs = MI.buildTrialEvents();
  assert(evs.length >= 6 && evs.length <= 10, `trial: a short, bounded event list (${evs.length} events), not a whole road`);
  assert(evs[0].type === 'gate', 'trial: opens on a gate — the trial is the point from the first stop');
  const gateCt = evs.filter(e => e.type === 'gate').length;
  assert(gateCt / evs.length >= 0.6, `trial: gate-heavy (${gateCt}/${evs.length}) — it is a lexicon drill, not a normal road`);
  let ordered = true;
  for (let i = 1; i < evs.length; i++) if (evs[i].at <= evs[i - 1].at) ordered = false;
  assert(ordered, 'trial: events are strictly ordered by distance');
  assert(evs[evs.length - 1].at < 1, 'trial: the whole event list fits inside one normal progress span (0..1)');

  /* ================= KIND-FILTERED TRIAL ================= */
  MI.startLexiconTrial('prefix');
  await until(() => !!MI._state(), 6000, 'prefix trial starts');
  let M = MI._state();
  assert(M.trial && M.trial.mode === 'prefix' && M.trial.kind === 'prefix', 'trial: the mission is flagged with the chosen mode and kind');
  assert((M.f.forged || []).length === 0, 'trial: bare-handed, like the Endless Road');
  assert(M.f.chapter.name.includes('Prefixes'), 'trial: the road name announces which trial this is');

  let G = MI._forceGate();
  assert(!!G, 'prefix trial: a gate opens');
  assert(D.PARTS[G.targetId].kind === 'prefix', `prefix trial: the gate only ever asks about a prefix (got ${D.PARTS[G.targetId].kind})`);

  // answer it correctly and confirm the trial tallies it
  MI._setLane(G.ansLane);
  MI._resolveGate();
  assert(MI._state().trial.total === 1, 'trial: total answered ticks up');
  assert(MI._state().trial.correct === 1, 'trial: a correct answer is credited');

  /* ================= WRONG ANSWERS ARE TRACKED FOR THE DEBRIEF ================= */
  M.gate = null;
  G = MI._forceGate();
  const wrongLane = [0, 1, 2].find(l => l !== G.ansLane);
  MI._setLane(wrongLane);
  MI._resolveGate();
  assert(MI._state().trial.total === 2, 'trial: total keeps counting across gates');
  assert(MI._state().trial.correct === 1, 'trial: a wrong answer does not add to correct');
  assert(MI._state().trial.missed.length === 1, 'trial: the missed part id is recorded for the debrief');

  /* ================= TRIAL ENDS AT ARRIVAL, NOT VIA THE NORMAL CHAPTER FLOW ================= */
  MI._state().progress = 1.01;
  await until(() => doc.getElementById('trial-result').classList.contains('show'), 6000, 'trial result panel opens on arrival');
  assert(MI._state().done === true, 'trial: the mission is marked done on completion');
  assert(!doc.getElementById('s-result').classList.contains('active'), 'trial: does not fall through to the normal campaign result screen');
  assert(doc.getElementById('tr-acc').textContent.includes('2'), 'trial: the accuracy readout reports total answered this run');

  /* ================= BEST ACCURACY PERSISTS PER MODE ================= */
  assert(E.S().trialBest && E.S().trialBest.prefix, 'trial: a completed run records a best for its own mode');
  const firstAcc = E.S().trialBest.prefix.acc;
  assert(firstAcc === 50, `trial: recorded accuracy matches the run (1/2 correct = 50%, got ${firstAcc})`);

  /* ================= A WORSE RUN IN THE SAME MODE DOES NOT OVERWRITE A BETTER BEST =================
     (checked via M.done rather than the panel's DOM class — the class is left "show" from the
     previous run's panel until its own continue button is clicked, so re-polling it here would
     pass on stale state instead of the real second completion) */
  MI.startLexiconTrial('prefix');
  await until(() => !!MI._state() && !MI._state().done, 6000, 'second prefix trial starts');
  MI._state().progress = 1.01;
  await until(() => MI._state().done === true, 6000, 'second trial run completes');
  assert(E.S().trialBest.prefix.acc === firstAcc, 'trial: a 0-answer run (0%) does not overwrite the earlier 50% best');

  /* ================= A DIFFERENT MODE KEEPS ITS OWN BEST, INDEPENDENTLY ================= */
  MI.startLexiconTrial('root');
  await until(() => !!MI._state() && !MI._state().done, 6000, 'root trial starts');
  M = MI._state();
  assert(M.trial.mode === 'root' && M.trial.kind === 'root', 'trial: root mode flags correctly');
  MI._forceGate();
  G = MI._gate();
  assert(D.PARTS[G.targetId].kind === 'root', 'root trial: the gate only ever asks about a root');
  MI._state().progress = 1.01;
  await until(() => MI._state().done === true, 6000, 'root trial run completes');
  assert(E.S().trialBest.prefix.acc === firstAcc, 'trial: the prefix best is untouched by a root-mode run');
  assert(!!E.S().trialBest.root, 'trial: root mode has its own recorded best');

  /* ================= WEAK-SPOT MODE FALLS BACK GRACEFULLY WITH NO WEAK DATA YET ================= */
  MI.startLexiconTrial('weak');
  await until(() => !!MI._state() && !MI._state().done, 6000, 'weak trial starts');
  assert(MI._state().trial.mode === 'weak' && MI._state().trial.kind == null, 'trial: weak mode carries no kind filter');
  MI._forceGate();
  assert(!!MI._gate(), 'weak trial: a gate still opens even with no weak-part history yet (falls back to the full pool)');

  summary(errors);
})();
