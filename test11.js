/* test11.js — the pause menu (Escape / pause button freeze the road and
   surface real options, without ever losing the run just by opening it)
   and the rune gate lead-distance fix (gates used to spawn only 0.075
   progress ahead — barely a second and a half of reading time at typical
   speed; they now spawn 0.18 ahead, ~2.4x farther out). */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const doc = window.document;

  const S = E.newGame();
  E.setS(S); E.applySettings();
  const ch = D.CHAPTERS[1];
  const mk = (bpId, grants, traits) => ({
    id: bpId + '_' + Math.random(), bpId, name: bpId, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
    quality: 0.7, qtier: 'ok', traits, assignedTo: null
  });
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  flow.forged = [mk('blade', ['cut'], { power: 1 })];
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');

  /* ================= THE GATE LEAD DISTANCE ================= */
  assert(MI.GATE_LEAD() > 0.15, 'a rune gate now opens well ahead of the squad, not right on top of them');
  assert(MI.GATE_LEAD() >= 0.075 * 2, 'the fix is a real, meaningful increase over the old cramped distance — at least double');

  const g = MI._forceGate();
  assert(g, 'a gate opened');
  const leadAtSpawn = g.p - MI._state().progress;
  assert(Math.abs(leadAtSpawn - MI.GATE_LEAD()) < 0.001, 'the gate actually spawns at the documented lead distance');
  // roughly translate that into real seconds at a typical steady pace, the way a player would experience it
  const typicalSpeed = 0.045; // progress/sec, representative of steady (non-surging) travel
  const readSeconds = leadAtSpawn / typicalSpeed;
  assert(readSeconds > 3.5, `at a typical pace the player gets over 3.5s to read and react (got ${readSeconds.toFixed(1)}s)`);
  MI._resolveGate();
  MI._state().gate = null;

  /* ================= THE PAUSE MENU ================= */
  assert(!doc.getElementById('pause-menu').classList.contains('show'), 'the pause menu starts closed');

  // Escape opens it
  const M1 = MI._state();
  MI._escKey();
  await sleep(30);
  assert(doc.getElementById('pause-menu').classList.contains('show'), 'Escape opens the pause menu');
  assert(M1.paused === true && M1.pausedByMenu === true, 'opening the pause menu freezes the road');

  // the road is genuinely frozen — steering and progress don't advance while paused
  const progressBefore = M1.progress;
  MI._stepMove(0.5);
  await sleep(30);
  assert(M1.progress === progressBefore, 'progress does not advance while the pause menu is open');

  // Escape again (with no other modal open) closes it and resumes
  MI._escKey();
  await sleep(30);
  assert(!doc.getElementById('pause-menu').classList.contains('show'), 'Escape again closes the pause menu');
  assert(M1.paused === false && M1.pausedByMenu === false, 'closing the pause menu resumes the road');

  // the on-screen pause button does the same thing (for players with no keyboard)
  assert(!!doc.getElementById('mission-pause-btn'), 'a visible pause button exists for touch players');
  doc.getElementById('mission-pause-btn').click();
  await sleep(30);
  assert(doc.getElementById('pause-menu').classList.contains('show'), 'the pause button opens the same menu Escape does');
  doc.getElementById('pause-resume').click();
  await sleep(30);
  assert(!doc.getElementById('pause-menu').classList.contains('show'), 'the Resume button closes it too');
  assert(MI._state().paused === false, 'and the road resumes');

  // opening Settings from the pause menu layers a modal on top; Escape closes
  // JUST the modal first, leaving the paused road underneath (not resuming it)
  MI._openPause();
  doc.getElementById('pause-settings').click();
  await sleep(30);
  assert(doc.getElementById('modal-settings').classList.contains('show'), 'Settings opens on top of the pause menu');
  assert(MI._state().paused === true, 'the road stays paused while Settings is open');
  MI._escKey();
  await sleep(30);
  assert(!doc.getElementById('modal-settings').classList.contains('show'), 'Escape closes the Settings modal first');
  assert(doc.getElementById('pause-menu').classList.contains('show'), 'the pause menu is still open underneath');
  assert(MI._state().paused === true, 'the road is still paused — Escape did not silently resume it');
  MI._closePause();

  // opening Lexicon from the pause menu behaves the same way
  MI._openPause();
  doc.getElementById('pause-gloss').click();
  await sleep(30);
  assert(doc.getElementById('modal-gloss').classList.contains('show'), 'Lexicon opens on top of the pause menu');
  MI._escKey();
  await sleep(30);
  assert(!doc.getElementById('modal-gloss').classList.contains('show'), 'Escape closes the Lexicon modal');
  assert(doc.getElementById('pause-menu').classList.contains('show'), 'the pause menu remains open underneath');
  MI._closePause();

  // "Turn back" asks for confirmation before abandoning the run
  MI._openPause();
  doc.getElementById('pause-quit').click();
  await sleep(30);
  assert(doc.getElementById('pause-quit-confirm').classList.contains('show'), 'turning back asks for confirmation first');
  assert(E.current() === 's-mission', 'nothing has happened yet — still on the road');
  doc.getElementById('pause-quit-no').click();
  await sleep(30);
  assert(!doc.getElementById('pause-quit-confirm').classList.contains('show'), '"Stay on the road" backs out of the confirmation');
  assert(E.current() === 's-mission', 'declining the confirmation does not leave the mission');
  assert(doc.getElementById('pause-menu').classList.contains('show'), 'the pause menu is still open after declining');

  // confirming actually leaves — the abandon path unbinds cleanly and returns to the hub
  doc.getElementById('pause-quit').click();
  await sleep(30);
  doc.getElementById('pause-quit-yes').click();
  await until(() => E.current() === 's-hub', 6000, 'confirming turns back to the hub');
  assert(!doc.getElementById('pause-menu').classList.contains('show'), 'the pause menu closes on the way out');

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
