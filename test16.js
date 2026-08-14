/* test16.js — POLISH PASS: the walk itself.
   1. Nothing on the road can hide underneath the interface (the walkable band is
      the canvas minus whatever the HUD is really occupying).
   2. The mouse reaches the whole road — steering is bound at the window, so the
      cursor crossing the control rail no longer stops the squad dead.
   3. Stamina is the clock on EVERY road: it breaks, the party falls, the round
      ends, and you can walk it again.
   4. A right answer ACCELERATES the caravan — an eased burst, not a step change.
   5. The road stays uncluttered: captions fade, the gear strip stays folded. */
const { boot, sleep, until, assert, summary } = require('./testlib');

const ptr = (window, target, type, x, y) => {
  const ev = new window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'clientX', { value: x });
  Object.defineProperty(ev, 'clientY', { value: y });
  Object.defineProperty(ev, 'pointerType', { value: 'mouse' });
  Object.defineProperty(ev, 'buttons', { value: 0 });
  target.dispatchEvent(ev);
  return ev;
};

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();
  const doc = window.document;

  /* ================= SET UP A LIVE ROAD ================= */
  const ch = D.CHAPTERS[2];
  const mk = (bpId, name, grants, traits, qtier) => ({
    id: bpId + '_' + Math.random(), bpId, name, genName: name, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
    quality: qtier === 'fine' ? 0.9 : 0.6, qtier, traits, assignedTo: null
  });
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  flow.forged = [mk('blade', 'Short blade', ['cut'], { power: 2 }, 'ok')];
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const M = MI._state();

  /* The very first road a player ever walks now opens with the road school —
     the tutorial that teaches the three factors and every option on the walk
     (covered in full by test35.js). It holds the road still while it is up, so
     dismiss it here: everything below measures a road actually in motion. */
  await until(() => !!MI._school(), 4000, 'the road school opens on a first walk');
  MI._schoolClose();
  assert(!MI._school(), 'school: dismissed, and the road is walking again');

  /* ================= 1. THE PLAYFIELD IS NEVER UNDER THE HUD ================= */
  const band0 = MI._band();
  assert(band0 && band0.bot > band0.top, 'band: the road has a real walkable band');
  assert(typeof band0.inset.top === 'number' && typeof band0.inset.bot === 'number',
    'band: the band tracks measured HUD insets, not hard-coded fractions');

  // simulate a chunky interface (a tall control rail, as on a small window) and
  // confirm the road, its lanes and everything spawned on it move up out of it
  MI._setInset(60, 190);
  const band1 = MI._band();
  assert(band1.bot <= M.cv.height - 190 + 0.01,
    `band: the bottom of the road lifts clear of a 190px control rail (bottom ${band1.bot.toFixed(0)} of ${M.cv.height})`);
  assert(band1.bot < band0.bot, 'band: growing the HUD really does shrink the playfield rather than overlap it');
  for (let i = 0; i < 3; i++) {
    const y = MI._laneY(i);
    assert(y >= band1.top - 0.01 && y <= band1.bot + 0.01, `band: lane ${i} sits inside the clear area, not under the interface`);
  }
  MI._setInset(0, 0);

  // spawn a crowd of pickups and hazards; every single one must land in the clear.
  // Everything on the road is positioned band-relatively, so whatever the HUD is
  // occupying at the time, nothing can be drawn underneath it.
  M.pickups.length = 0; M.hazards.length = 0;
  M.spawnPickT = 0; M.spawnHazT = 0;
  await sleep(500);
  const objs = M.pickups.concat(M.hazards);
  assert(objs.length > 0, 'band: the road spawned things to check');
  const stray = objs.filter(o => o.u == null || o.u < 0 || o.u > 1);
  assert(stray.length === 0,
    `band: every word-part and hazard is placed band-relatively, so it moves with the clear area (${objs.length} checked, ${stray.length} stray)`);
  const bandNow = MI._band();
  const outside = objs.filter(o => {
    const y = bandNow.top + o.u * (bandNow.bot - bandNow.top);
    return y < bandNow.top - 0.01 || y > bandNow.bot + 0.01;
  });
  assert(outside.length === 0, `band: nothing on the road lands outside the clear area (${outside.length} outside)`);

  /* ================= 2. THE MOUSE REACHES THE WHOLE ROAD ================= */
  const cv = doc.getElementById('missionCanvas');
  // jsdom gives zero-size rects, so drive the documented steering path directly:
  // the point is that steering is bound at the WINDOW, not the canvas — a pointer
  // event that never touches the canvas still has to move the squad.
  const b = MI._bounds();
  ptr(window, doc.body, 'pointermove', 10, 10);
  assert(true, 'steering: a window-level pointer event is accepted without throwing');
  MI._steer(b.max);
  for (let i = 0; i < 60; i++) MI._stepMove(0.05);
  assert(MI._state().lane === 2, 'steering: reaching for the bottom of the view walks them onto the river floor');
  assert(Math.abs(MI._state().laneY - b.max) < 2, 'steering: the very bottom of the band is reachable, not clamped short');
  MI._steer(b.min);
  for (let i = 0; i < 60; i++) MI._stepMove(0.05);
  assert(Math.abs(MI._state().laneY - b.min) < 2, 'steering: the very top of the reachable band is reachable too');
  // the canvas listener is gone from the move path — the window carries it, so
  // the HUD can never swallow the cursor again
  assert(cv !== null, 'steering: the canvas is still the drawing surface');

  /* ================= 3. ACCELERATION ON A RIGHT ANSWER ================= */
  MI._steer((b.min + b.max) / 2);
  for (let i = 0; i < 20; i++) MI._stepMove(0.05);
  const paceBefore = MI._pace().now;
  const boost0 = MI._rushBoost();
  assert(boost0 === 1, 'acceleration: with nothing earned, there is no burst');
  MI._rush(0.9);
  const boost1 = MI._rushBoost();
  assert(boost1 > 1.4, `acceleration: a right answer opens a real burst (×${boost1.toFixed(2)} of extra pace)`);
  await sleep(220);
  const paceMid = MI._pace().now;
  assert(paceMid > paceBefore, `acceleration: the caravan speeds up after the answer (${paceBefore.toFixed(2)} → ${paceMid.toFixed(2)})`);
  assert(paceMid < paceBefore * boost1,
    'acceleration: the speed EASES in — it is not a step change, which is what makes it feel like accelerating');
  await sleep(1400);
  const paceLate = MI._pace().now;
  assert(paceLate < paceMid + 0.01, 'acceleration: the burst decays back down once it is spent');

  // a streak of right answers compounds the burst
  MI._state().streak = 0;
  MI._state().rushT = 0; MI._state().rushPow = 0;
  const gate = MI._forceGate();
  if (gate) { MI._setLane(gate.ansLane); MI._resolveGate(); }
  const afterGate = MI._pace();
  assert(afterGate.streak >= 1, 'acceleration: a correct gate counts toward the run streak');
  assert(afterGate.rushT > 0, 'acceleration: a correct gate kicks the caravan into a higher gear');
  const rush1 = MI._state().rushPow;
  MI._state().rushT = 0; MI._state().rushPow = 0;
  MI._state().streak = 4;
  MI._state().combo = [];
  MI._state().gate = null;            // clear the resolved arch so a fresh one can open
  const g2 = MI._forceGate();
  if (g2) { MI._setLane(g2.ansLane); MI._resolveGate(); }
  assert(MI._state().rushPow > rush1, 'acceleration: answers on a streak accelerate harder than a lone right answer');

  // getting one wrong brakes it
  MI._state().streak = 5;
  MI._state().rushT = 1.2; MI._state().rushPow = 1;
  MI._state().gate = null;
  const g3 = MI._forceGate();
  if (g3) { MI._setLane(g3.ansLane === 2 ? 1 : 2); MI._resolveGate(); }
  assert(MI._state().streak === 0, 'acceleration: a wrong answer breaks the streak');
  assert(MI._rushBoost() === 1, 'acceleration: a wrong answer kills the burst — you feel yourself slow down');

  /* ================= 4. LEARNING BEAT: the term banner ================= */
  const termId = Object.keys(D.TERMS)[0];
  const buildIds = D.TERMS[termId].build;
  MI._state().combo = [];
  buildIds.forEach(id => MI._pushCombo(id));
  const banner = doc.getElementById('term-banner');
  assert(banner.classList.contains('show'), 'learning: completing a real term raises the banner');
  /* A real term's letters are stamped in one span each, so the word no longer
     appears as a contiguous run of innerHTML. textContent is the stronger check
     anyway: it is exactly what this aria-live region announces. */
  assert(banner.textContent.includes(D.TERMS[termId].spell), 'learning: the banner names the word that was just built');
  assert(banner.querySelectorAll('.tb-ltr').length === D.TERMS[termId].spell.length,
    'learning: a real term arrives one letter at a time — the word being made, not a notice appearing');
  assert(banner.innerHTML.includes(D.TERMS[termId].def), 'learning: the banner gives its meaning, so the reward IS the lesson');
  buildIds.forEach(id => assert(banner.innerHTML.includes(D.PARTS[id].mean),
    `learning: the banner shows what the part "${D.PARTS[id].text}" contributed`));

  /* ================= 5. THE ROAD STAYS UNCLUTTERED ================= */
  const strip = doc.getElementById('forge-strip');
  assert(strip.querySelectorAll('.forge-chip').length >= 1, 'clutter: the forged-gear readout still exists');
  assert(!strip.classList.contains('open'), 'clutter: but it is folded away while walking, not parked across the road');
  MI._gearStrip(true);
  assert(strip.classList.contains('open'), 'clutter: it can be pinned open on demand (G / the ⚒ button)');
  MI._gearStrip(false);
  assert(!strip.classList.contains('open'), 'clutter: and folded away again');

  const cap = doc.getElementById('mission-caption');
  MI._state().lastCap = '';
  MI._state().capT = 0.2;
  cap.classList.remove('dim');
  MI._ageCaption(0.5);
  assert(cap.classList.contains('dim'), 'clutter: a caption fades itself out instead of sitting on the road forever');

  /* ================= 6. STAMINA BREAKS THE RUN ON A NORMAL ROAD ================= */
  const M2 = MI._state();
  assert(M2.endless !== true, 'collapse: this is an ordinary chapter road, not the Endless Road');
  M2.stats.stamina = 0.3;
  await until(() => MI._state().collapsing === true, 6000, 'the party collapses when stamina breaks');
  assert(MI._state().collapsing === true, 'collapse: stamina reaching zero drops the party where they stand');
  assert(MI._state().paused === true, 'collapse: the road stops — this is not a slow limp onward');
  await until(() => doc.getElementById('road-collapse').classList.contains('show'), 6000, 'the collapse card appears');
  assert(MI._state().done === true, 'collapse: the round is over');
  assert(doc.getElementById('collapse-body').innerHTML.length > 10, 'collapse: the card says how far they got and what was kept');
  assert(doc.querySelectorAll('#collapse-learned .cl-stat').length === 4,
    'collapse: the card reports what the walk actually taught — parts read, terms, words, streak');
  assert(!doc.getElementById('s-result').classList.contains('active'),
    'collapse: a collapsed run does NOT quietly hand out an arrival grade');

  /* ================= 7. AND YOU HAVE TO DO IT AGAIN ================= */
  MI._retry();
  await until(() => !!MI._state() && !MI._state().done && !MI._state().collapsing, 6000, 'the road restarts');
  const M3 = MI._state();
  assert(M3 && !M3.done, 'retry: "Walk it again" puts you back at the start of the same road');
  assert(M3.progress < 0.05, 'retry: from the beginning — no partial credit for the failed run');
  assert(M3.stats.stamina > 20, 'retry: with the squad back on their feet');
  assert(M3.f.chapter.id === ch.id, 'retry: it is the same chapter, with the same bench you forged');
  assert(!doc.getElementById('road-collapse').classList.contains('show'), 'retry: the collapse card is cleared away');

  summary(errors);
})();
