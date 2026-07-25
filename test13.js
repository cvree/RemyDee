/* test13.js — DEPTH PASS: road band identity (the three bands are distinct
   strategies, not just speed picks), the active Pace/Surge verb, and the
   rising difficulty curve. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');

  const S = E.newGame(); E.setS(S); E.applySettings();

  /* ================= DIFFICULTY CURVE ================= */
  const d0 = MI._difficultyAt(0.02), d1 = MI._difficultyAt(0.5), d2 = MI._difficultyAt(0.95);
  assert(d0.density < d1.density && d1.density < d2.density, 'difficulty: hazard density rises through the road, not flat start-to-finish');
  assert(d0.dmg < d1.dmg && d1.dmg < d2.dmg, 'difficulty: hazard bite rises through the road too');
  assert(d2.density > d0.density * 1.5, 'difficulty: the final third is visibly, not just nominally, harder than the first');

  /* ================= SET UP A LIVE ROAD ================= */
  const ch = D.CHAPTERS[2];
  const mk = (bpId, name, grants, traits, qtier) => ({
    id: bpId + '_' + Math.random(), bpId, name, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
    quality: qtier === 'fine' ? 0.9 : 0.6, qtier, traits, assignedTo: null
  });
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  flow.forged = [
    mk('hook', 'Grappling hook', ['climb'], { reach: 2 }, 'ok'),
    mk('blade', 'Short blade', ['cut'], { power: 2 }, 'ok')
  ];
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const doc = window.document;

  /* ================= BAND IDENTITY ================= */
  const b = MI._bounds();
  assert(!MI._bandSeen()[0] && !MI._bandSeen()[2], 'band identity: the upper and lower bands start unannounced — the squad opens on the middle trail');

  // dive to the river floor (lane 2) — should announce the recovery-lane identity
  MI._steer(b.max - 4);
  for (let i = 0; i < 60; i++) MI._stepMove(0.05);
  assert(MI._state().lane === 2, 'band identity: steering to the bottom of the band settles the squad on the river floor');
  assert(MI._bandSeen()[2] === true, 'band identity: the river floor is announced the first time the squad actually reaches it');
  assert(/river floor/i.test(doc.getElementById('mission-caption').innerHTML), 'band identity: the caption names the river floor and what it is for');

  // climb to the upper ledge (lane 0) — with climbing gear equipped, it should be reachable
  MI._steer(b.min + 2);
  for (let i = 0; i < 60; i++) MI._stepMove(0.05);
  assert(MI._state().lane === 0, 'band identity: climbing gear opens the upper ledge');
  assert(MI._bandSeen()[0] === true, 'band identity: the upper ledge is announced the first time the squad actually reaches it');
  assert(/upper ledge/i.test(doc.getElementById('mission-caption').innerHTML), 'band identity: the caption names the upper ledge and what it is for');

  /* ================= ACTIVE PACE — SURGE ================= */
  const M = MI._state();
  M.stats.stamina = 100; M.stats.morale = 100; M.stats.safety = 100;
  M.progress = 0.05;
  const staminaBefore = M.stats.stamina;
  MI._setSurge(true);
  await sleep(60); // let one real tick pick up the held state
  assert(MI._surging() === true, 'pace: holding surge actually engages it (stamina was available)');
  await sleep(500);
  MI._setSurge(false);
  const progressWithSurge = MI._state().progress - 0.05;
  const staminaAfterSurge = MI._state().stats.stamina;
  assert(staminaAfterSurge < staminaBefore - 3, `pace: surging spends real stamina, not a free speed boost (before ${staminaBefore}, after ${staminaAfterSurge})`);

  // same window, no surge — should cover meaningfully less ground
  MI._state().progress = 0.05;
  MI._state().stats.stamina = 100;
  await sleep(560);
  const progressNoSurge = MI._state().progress - 0.05;
  assert(progressWithSurge > progressNoSurge * 1.15,
    `pace: surging covers visibly more ground than walking in the same window (surge ${progressWithSurge.toFixed(4)} vs normal ${progressNoSurge.toFixed(4)})`);

  // surging cannot be sustained on an empty tank — it's a spend, not a stat
  MI._state().stats.stamina = 2;
  MI._setSurge(true);
  await sleep(80);
  assert(MI._surging() === false, 'pace: surge will not engage with the stamina tank near empty');
  MI._setSurge(false);

  /* ================= QUALITY YOU CAN SEE ================= */
  // add a healing item so Mend has something to be credited to, then compare
  // its real effect at flawed vs fine quality — the tier must change the
  // OUTCOME, not just a label
  const healItem = mk('kit', 'Field kit', ['heal'], { recover: 2 }, 'flawed');
  flow.forged.push(healItem);
  MI._state().forge.itemFor.heal = healItem;
  MI._state().abilities.mend = 5;
  MI._state().stats.stamina = 40;
  healItem.qtier = 'flawed';
  MI._use('mend');
  const staminaAfterFlawed = MI._state().stats.stamina;
  const flawedGain = staminaAfterFlawed - 40;

  MI._state().stats.stamina = 40;
  healItem.qtier = 'fine';
  MI._use('mend');
  const staminaAfterFine = MI._state().stats.stamina;
  const fineGain = staminaAfterFine - 40;

  assert(fineGain > flawedGain, `quality visibility: a fine kit heals meaningfully more than a flawed one (fine +${fineGain} vs flawed +${flawedGain})`);
  assert(flawedGain > 0, 'quality visibility: a flawed item still does real work — it is weaker, not useless');

  /* ================= THE GEAR DEBRIEF ================= */
  // the healItem above was mended twice (flawed then fine) — drive to arrival
  // and confirm the result screen itemizes exactly what it did
  const doc2 = window.document;
  MI._state().evIdx = MI._state().events.length;
  MI._state().gate = null; MI._state().paused = false; MI._state().questionOpen = false;
  MI._state().progress = 0.995;
  await until(() => doc2.querySelector('#s-result').classList.contains('active'), 15000, 'result screen reached');
  const debrief = doc2.getElementById('gear-debrief').innerHTML;
  assert(debrief.includes(healItem.genName || healItem.name), 'gear debrief: the exact forged item appears by name');
  assert(/mended\s*&times;\s*2|mended\D*2/.test(debrief), `gear debrief: its real usage tally is itemized (${debrief.match(/mended[^<]*/) || 'not found'})`);
  assert(debrief.includes('earned its ember'), 'gear debrief: a used item is told it earned its keep');

  summary(errors);
})();
