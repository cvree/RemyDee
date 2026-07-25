/* test14.js — DEPTH PASS: Seeded Contracts. buildRoadPlan is deterministic
   from a seed (event order/types, gate distractor structure), the same
   seed reproduces the identical hazard deck during live play, a shareable
   code round-trips through the hub's seed entry, and the seed never leaks
   into unrelated randomness (bench crafting stays genuinely random). */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();

  /* ================= THE PRNG + CODE ROUND-TRIP ================= */
  const seed = 123456789;
  const code = E.seedToCode(seed);
  assert(typeof code === 'string' && code.length > 0, 'a seed encodes to a readable code');
  assert(E.codeToSeed(code) === (seed >>> 0), 'the code decodes back to the exact same seed');
  assert(E.codeToSeed('not-a-real-code-!!!') !== null || E.codeToSeed('') === null, 'garbage input is handled without throwing');
  const rngA = E.mulberry32(777), rngB = E.mulberry32(777);
  const seqA = [rngA(), rngA(), rngA()], seqB = [rngB(), rngB(), rngB()];
  assert(JSON.stringify(seqA) === JSON.stringify(seqB), 'the PRNG is deterministic: same seed, same sequence');
  const rngC = E.mulberry32(778);
  assert(rngC() !== E.mulberry32(777)(), 'different seeds produce different sequences');

  /* ================= buildRoadPlan DETERMINISM ================= */
  const ch = D.CHAPTERS[2];
  const flowFor = () => ({ chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} });
  const planA = MI.buildRoadPlan(flowFor(), seed);
  const planB = MI.buildRoadPlan(flowFor(), seed);
  assert(planA.seed === seed && planB.seed === seed, 'the plan records the exact seed it was built from');
  assert(planA.code === code, 'the plan exposes the same shareable code as the seed');
  assert(JSON.stringify(planA.events) === JSON.stringify(planB.events),
    'seeded contracts: the SAME seed produces the IDENTICAL event order and types, twice in a row');
  assert(JSON.stringify(planA.intel) === JSON.stringify(planB.intel), 'seeded contracts: scout intel matches too');

  const planC = MI.buildRoadPlan(flowFor(), seed + 1);
  assert(JSON.stringify(planA.events) !== JSON.stringify(planC.events),
    'seeded contracts: a DIFFERENT seed produces a genuinely different road');

  const planRandom1 = MI.buildRoadPlan(flowFor());
  const planRandom2 = MI.buildRoadPlan(flowFor());
  assert(planRandom1.seed !== planRandom2.seed, 'no seed given: each road still gets its own (random) seed, and they differ');

  /* ================= THE SEED NEVER LEAKS ================= */
  // building a seeded plan must not leave Math.random permanently patched —
  // bench crafting and everything else stays genuinely random afterward
  const savedRandom = Math.random;
  MI.buildRoadPlan(flowFor(), 42);
  assert(Math.random === savedRandom, 'seeded contracts: Math.random is restored immediately after building the plan — no global leakage');

  /* ================= LIVE HAZARD DECK DETERMINISM ================= */
  const runWithSeed = async (sd) => {
    const flow = flowFor();
    flow.forged = [{
      id: 'blade_' + Math.random(), bpId: 'blade', name: 'Short blade', icon: 'blade', gear: 'blade',
      grants: ['cut'], material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
      quality: 0.7, qtier: 'ok', traits: { power: 2 }, assignedTo: null
    }];
    E.setFlow(flow);
    flow.roadPlan = MI.buildRoadPlan(flow, sd);
    P._depart();
    await until(() => !!MI._state(), 6000, 'mission start (seeded)');
    const deck = MI._hazardDeck();
    return { plan: flow.roadPlan, deck: deck.slice() };
  };
  const runA = await runWithSeed(999999);
  const runB = await runWithSeed(999999);
  assert(JSON.stringify(runA.deck) === JSON.stringify(runB.deck),
    `seeded contracts: the live hazard deck is identical run to run under the same seed (${runA.deck.join(',')} vs ${runB.deck.join(',')})`);
  assert(runA.plan.code === runB.plan.code, 'seeded contracts: both runs report the same road code');

  const runC = await runWithSeed(11111);
  assert(JSON.stringify(runA.deck) !== JSON.stringify(runC.deck), 'seeded contracts: a different seed shuffles the hazard deck differently');

  /* ================= HUB SEED ENTRY ================= */
  const doc = window.document;
  window.__RD_SCREENS.showHub();
  await until(() => doc.getElementById('path-seed-row') && doc.getElementById('path-seed-row').innerHTML.length > 0, 6000, 'hub seed row rendered');
  const input = doc.getElementById('path-seed-input');
  input.value = code;
  doc.getElementById('path-seed-btn').click();
  assert(E.S().pendingSeed === (seed >>> 0), 'hub: entering a code and pressing Set queues that exact seed for the next road');

  // the queued seed is consumed by the NEXT bench visit's road plan
  const flow2 = flowFor();
  E.setFlow(flow2);
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'commission board (queued seed)');
  assert(flow2.roadPlan && flow2.roadPlan.seed === (seed >>> 0), 'hub: the queued seed is actually consumed by the next road plan');
  assert(E.S().pendingSeed === null, 'hub: the queued seed is cleared once consumed, so it does not silently repeat');
  assert(doc.querySelector('.road-code .rc-code') && doc.querySelector('.road-code .rc-code').textContent === code,
    'commission board: the current road\'s shareable code is shown to the player');

  summary(errors);
})();
