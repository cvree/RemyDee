/* test8.js — THE ROAD OVERHAUL: free continuous movement, hover-to-study +
   Lexicon Affinity, the clean gate corridor, and abilities that always do
   something. Also covers the party ladder and the term-builder failure costs. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');

  const S = E.newGame();
  E.setS(S); E.applySettings();

  /* ================= THE PARTY LADDER ================= */
  const ladder = D.CHAPTERS.map(c => E.partyFor(c).builders.length);
  assert(ladder[0] === 1, 'prologue: one traveler needs a name');
  assert(ladder[1] === 3, 'chapter one: three, not six — the ramp is gentle');
  assert(ladder[1] > ladder[0] && ladder[1] < 6, 'the second mission is a step, not a cliff');
  for (let i = 1; i < ladder.length - 1; i++) {
    assert(ladder[i] - ladder[i - 1] <= 2, `chapter ${i} grows the party by at most two`);
  }
  // nobody is lost: whoever does not fit goes on the waiting list and is taken FIRST next time
  const p1 = E.partyFor(D.CHAPTERS[1]);
  assert(p1.pending.length > 0, 'overflow travelers wait rather than vanish');
  E.commitParty(p1);
  const p2 = E.partyFor(D.CHAPTERS[2]);
  assert(p1.pending.slice(0, p2.builders.length).every(id => p2.builders.includes(id)),
    'the waiting list drains before the next chapter\'s own roster');
  E.S().pending = [];

  /* ================= AFFINITY (independent of the road) ================= */
  assert(E.affinity().n === 0, 'a new player has no affinity');
  const parts = Object.keys(D.PARTS);
  for (let i = 0; i < 8; i++) E.markStudied(parts[i]);
  assert(E.studiedCount() === 8, 'studied parts are counted');
  assert(E.affinity().n === 1 && E.affinity().name === 'Reader', 'eight reads reach Reader');
  E.markStudied(parts[0]);
  assert(E.studiedCount() === 8, 'affinity counts DISTINCT parts — no farming one word');
  for (let i = 8; i < 20; i++) E.markStudied(parts[i]);
  assert(E.affinity().n === 2, 'twenty reads reach Scribe');

  /* Scribe stokes the forge hotter — affinity reaches back into the bench */
  const chB = D.CHAPTERS[1];
  E.S().unlockedBps = ['kit', 'blade', 'hook', 'smoke'];
  const flowB = { chapter: chB, builders: [], members: chB.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flowB);
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'bench with affinity');
  assert(P._commission().embers === P._commission().maxItems + 2,
    'Scribe affinity grants the promised extra ember');
  assert(P._commission().pool.length === 4, 'the board shows only the patterns the player knows');

  /* the naming debt from a shaky term build costs the bench an ember */
  E.S().emberDebt = 1;
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'bench with naming debt');
  assert(P._commission().embers === P._commission().maxItems + 1,
    'a wrong naming at the builder is genuinely felt at the forge');
  E.S().emberDebt = 0;

  /* ================= THE ROAD ================= */
  const ch = D.CHAPTERS[2];
  const mk = (bpId, name, grants, traits, qtier) => ({
    id: bpId + '_' + Math.random(), bpId, name, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
    quality: qtier === 'fine' ? 0.9 : 0.6, qtier, traits, assignedTo: null
  });
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  flow.forged = [
    mk('blade', 'Short blade', ['cut'], { power: 2 }, 'ok'),
    mk('smoke', 'Smoke shell', ['smoke'], { stealth: 2 }, 'ok'),
    mk('kit', 'Field kit', ['heal'], { recover: 2 }, 'ok')
  ];
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const M = MI._state();

  /* ---- FREE MOVEMENT: continuous, not three snapped rails ---- */
  const b = MI._bounds();
  assert(b && b.max > b.min, 'the road has a continuous vertical band');
  const midY = (b.min + b.max) / 2;
  MI._steer(midY + 7);
  for (let i = 0; i < 40; i++) MI._stepMove(0.05);
  const y1 = MI._state().laneY;
  assert(Math.abs(y1 - (midY + 7)) < 2, 'the squad settles exactly where you steer, not on a rail');
  // a position BETWEEN two lane centres must be reachable and must stay there
  const between = (0.615 + 0.815) / 2 * b.h;
  MI._steer(between);
  for (let i = 0; i < 40; i++) MI._stepMove(0.05);
  assert(Math.abs(MI._state().laneY - between) < 2, 'half-way between two paths is a real, held position');
  // travel is gradual, not teleportation
  MI._steer(b.min);
  const before = MI._state().laneY;
  MI._stepMove(0.016);
  const after = MI._state().laneY;
  assert(after < before && after > b.min + 4, 'movement is a glide, not a snap');
  // the band is clamped at both ends
  MI._steer(b.max + 400);
  for (let i = 0; i < 60; i++) MI._stepMove(0.05);
  assert(MI._state().laneY <= b.max + 0.01, 'the squad cannot walk off the bottom of the road');

  /* ---- keyboard travels continuously while held ---- */
  MI._steer(midY);
  for (let i = 0; i < 40; i++) MI._stepMove(0.05);
  const kStart = MI._state().laneY;
  MI._state().keyUp = true;
  MI._stepMove(0.05); MI._stepMove(0.05);
  MI._state().keyUp = false;
  assert(MI._state().targetY < kStart, 'holding W/↑ travels upward continuously');

  /* ---- HOVER TO STUDY: reading a word pays ---- */
  const studiedBefore = E.studiedCount();
  const partId = Object.keys(D.PARTS).find(id => !(E.S().studied || []).includes(id));
  const moBefore = MI._momentum();
  const staminaBefore = M.stats.stamina;
  const res = MI._study(partId);
  assert(res.studied === studiedBefore + 1, 'reading a part on the road records it');
  assert(MI._momentum() > moBefore, 'a studied part nudges momentum');
  assert(M.stats.stamina > staminaBefore || M.stats.morale > 0, 'a studied part restores the squad');

  /* ---- THE GATE CORRIDOR: nothing blocks a thinking beat ---- */
  const g = MI._forceGate();
  assert(g, 'a rune gate opened');
  // the corridor is measured against the lead THIS gate opened at, not a fixed
  // distance — the lead moves with the difficulty, the forged gear and the pace
  const lead = MI._gateLead();
  assert(MI._inGateCorridor(g.p - 0.04), 'the approach to a gate is a protected corridor');
  assert(MI._inGateCorridor(g.p - lead * 0.9), 'the corridor covers the whole read-and-decide window, however long the lead is');
  assert(!MI._inGateCorridor(g.p - lead * 1.2), 'the corridor is local to the gate, not the whole road');
  assert(lead < 0.5, `the corridor can never be most of the road (lead ${lead.toFixed(2)})`);
  const hazBefore = MI._hazards().length;
  assert(MI._spawnHazardAt(g.p - 0.03, 1, 'rock') === null, 'a hazard cannot spawn in the gate corridor');
  assert(MI._hazards().length === hazBefore, 'and none was added');
  assert(MI._spawnHazardAt(g.p - 0.4, 1, 'rock') !== null, 'hazards spawn freely away from the gate');
  // a hazard already standing in the corridor is swept away when the gate opens
  MI._resolveGate();
  MI._state().gate = null;
  // a small offset ahead of the current position — well inside whatever
  // corridor the next gate opens with, whatever its exact spawn distance is
  const hazSpot = MI._state().progress + 0.05;
  MI._spawnHazardAt(hazSpot, 1, 'rock');
  const stacked = MI._hazards().filter(h => !h.hit && !h.passed).length;
  MI._forceGate();
  assert(MI._hazards().filter(h => !h.hit && !h.passed).length < stacked,
    'a hazard already in the corridor is burned off when the gate opens');
  MI._resolveGate();
  MI._state().gate = null;

  /* ---- ABILITIES: no dead buttons ---- */
  const M2 = MI._state();
  M2.raid = null;
  M2.hazards.length = 0;
  // Strike outside a raid: clears the road ahead
  for (let i = 0; i < 3; i++) MI._spawnHazardAt(M2.progress + 0.02 + i * 0.01, 1, 'rock');
  assert(MI._hazardsAhead() >= 2, 'hazards are stacked up ahead');
  const strikeCharges = M2.abilities.strike;
  const afterStrike = MI._useAbility('strike');
  assert(afterStrike.abilities.strike === strikeCharges - 1, 'Strike spends a charge outside a raid');
  assert(MI._hazardsAhead() === 0, 'Strike CLEARS THE ROAD when there is no ambush — never a dead button');
  // Vanish outside a raid: a phase window
  const vanishCharges = M2.abilities.vanish;
  const afterVanish = MI._useAbility('vanish');
  assert(afterVanish.abilities.vanish === vanishCharges - 1, 'Vanish spends a charge outside a raid');
  assert(afterVanish.phaseT > 0, 'Vanish opens a phase window on the open road');
  // Mend was always useful and still is
  M2.stats.stamina = 30;
  const mendCharges = M2.abilities.mend;
  MI._useAbility('mend');
  assert(M2.abilities.mend === mendCharges - 1 && M2.stats.stamina > 30, 'Mend restores the squad');
  // and a Strike with genuinely nothing to hit refuses rather than wasting the charge
  M2.hazards.length = 0;
  M2.abilities.strike = 1;
  MI._useAbility('strike');
  assert(M2.abilities.strike === 1, 'Strike will not burn a charge on an empty road');

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
