/* test7.js — ROAD redesign: plan-driven events, interactive flavor choices,
   hazard deck + gear counters, perks, raid hooks, arrival + heirloom pick. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  E.setS(E.newGame()); E.applySettings();
  const ch = D.CHAPTERS[2];   // has an enemy → patrol/bandits legal
  assert(!!ch.enemy, 'test chapter has an enemy');
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flow);

  /* hand-forged loadout: blade (fine, keenedge), smoke, kit, hook */
  const mk = (bpId, name, grants, traits, perks, qtier) => ({
    id: bpId + '_' + Math.random(), bpId, name, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: perks || [], bonus: null,
    quality: qtier === 'fine' ? 0.9 : 0.6, qtier, traits, assignedTo: null
  });
  flow.forged = [
    mk('blade', 'Ridge-back blade', ['cut'], { power: 2, protect: 1 }, ['keenedge'], 'fine'),
    mk('smoke', 'Fictional smoke shell', ['smoke'], { stealth: 2 }, [], 'fine'),
    mk('kit', 'Field kit', ['heal'], { recover: 2 }, [], 'ok'),
    mk('hook', 'Grappling hook', ['climb'], { reach: 2 }, [], 'ok')
  ];
  flow.roadPlan = MI.buildRoadPlan(flow);
  assert(flow.roadPlan.events.length >= 7, 'road plan generated');
  assert(flow.roadPlan.events.some(e => e.type === 'bandits'), 'enemy chapter plans a raid');
  const bAt = flow.roadPlan.events.find(e => e.type === 'bandits');
  assert(bAt.at >= 0.45, 'raid lands in the back half of the road');
  // two plans differ run-to-run (positions jittered, mixes drawn)
  const planB = MI.buildRoadPlan(flow);
  const sig = (p) => p.events.map(e => e.type + '@' + e.at).join('|');
  assert(sig(planB) !== sig(flow.roadPlan), 'plans vary run to run');

  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const M = MI._state();
  assert(M.perks.has('keenedge'), 'perk set live on the road');
  assert(M.events.length === flow.roadPlan.events.length, 'mission consumes the plan');

  /* ---- hazard deck: variety + weather awareness ---- */
  const deck = MI._hazardDeck();
  const kinds = new Set(deck);
  assert(['scree', 'mud', 'wasps', 'branch'].some(k => kinds.has(k)), 'new hazard kinds in the deck');
  assert(kinds.has('patrol'), 'patrols dealt only when an enemy walks the road');

  /* ---- hazard counter: keenedge negates roots ---- */
  M.hazards.length = 0;
  M.stats.morale = 50;
  M.hazards.push({ p: M.progress + 0.004, lane: M.lane, kind: 'roots', hit: false, passed: false });
  await until(() => M.hazards.length === 0 || M.hazards[0].hit || M.hazards[0].passed, 6000, 'roots resolve');
  assert(M.slowT === 0, 'keenedge blade cuts snagging roots — no slow');
  assert(M.stats.morale >= 50, 'countered hazard costs nothing (small morale gain)');

  const doc = window.document;

  /* ---- forged gear is read as live Word Road passives ---- */
  const fp = MI._forge();
  assert(fp && fp.cutClear === true, 'a keen edge is read as a hazard-clearing passive');
  assert(fp.momentumFloor >= 1.6, 'the keen edge floors momentum above ×1');
  assert(fp.climbFast === true, 'climbing gear opens the swift upper lane');
  assert(fp.smokeSaves === 1, 'a smoke shell banks one free wrong-gate save');
  assert(doc.querySelectorAll('#forge-strip .forge-chip').length >= 1, 'forged gear readout is shown on the road');

  /* ---- the combo: chain parts into a real term, momentum surges ---- */
  M.combo = [];
  const mo0 = M.momentum;
  MI._pushCombo('cyst');
  assert(M.combo.length === 1, 'a gathered root starts the term');
  MI._pushCombo('itis');
  assert(M.combo.length === 0, 'a closing suffix forges and clears the term');
  assert(M.realTermsBuilt >= 1, 'cyst + -itis is recognised as the real term cystitis');
  assert(M.termsBuilt.includes('cystitis'), 'the forged term is recorded');
  assert(M.momentum > mo0, 'forging a term surges the momentum multiplier');

  // a stray, ungrammatical part does not corrupt the builder
  M.combo = [];
  MI._pushCombo('itis');            // a suffix cannot open a word
  assert(M.combo.length === 0, 'a lone suffix cannot start a chain');

  /* ---- a hazard hit knocks momentum down and breaks the chain ---- */
  MI._pushCombo('gastr');
  const moBeforeHit = M.momentum;
  knockCheck: {
    M.hazards.length = 0;
    M.stats.safety = 60;
    M.hazards.push({ p: M.progress + 0.002, lane: M.lane, kind: 'rock', hit: false, passed: false });
    await until(() => M.hazards.length === 0 || (M.hazards[0] && M.hazards[0].hit), 6000, 'rock hits');
  }
  assert(M.momentum < moBeforeHit, 'a clean hazard hit drops the multiplier');
  assert(M.combo.length === 0, 'a hazard hit breaks the term-in-progress');

  /* ---- rune gates replace the old fork: steer to the right meaning ---- */
  const wonBefore = M.challengesWon;
  const g1 = MI._forceGate();
  assert(g1 && Array.isArray(g1.laneIds) && g1.laneIds.length === 3, 'a rune gate spans three lanes');
  assert(g1.laneIds[g1.ansLane], 'the correct path carries the target part');
  MI._setLane(g1.ansLane);
  const moG = M.momentum;
  MI._resolveGate();
  assert(M.challengesWon === wonBefore + 1, 'passing the right gate scores a recall');
  assert(M.momentum >= moG, 'the right gate feeds momentum');
  assert(!MI._gate() || MI._gate().resolved, 'gate resolves');

  // wrong gate → covered once by the banked smoke shell (no penalty)
  M.gate = null;
  const g2 = MI._forceGate();
  const wrong2 = [0, 1, 2].find(l => l !== g2.ansLane);
  MI._setLane(wrong2);
  MI._resolveGate();
  assert(MI._forge().smokeSaves === 0, 'a wrong gate spends the banked smoke save');

  // wrong gate again → real penalty now the smoke is gone
  M.gate = null;
  const g3 = MI._forceGate();
  const wrong3 = [0, 1, 2].find(l => l !== g3.ansLane);
  MI._setLane(wrong3);
  const moWrong = M.momentum;
  MI._resolveGate();
  assert(M.momentum < moWrong, 'a wrong gate with no smoke slips the multiplier');

  /* ---- flavor beats auto-resolve — never a blocking menu ---- */
  M.gate = null;
  MI._forceEvent('scholar');
  assert(!MI._gate(), 'scholar is an auto-resolving beat, not a gate');
  assert(M.revealT > 0, 'scholar road-lore names dangers ahead');

  /* A cache is a trial now, not a flag check: the squad stops, the player works
     the lid, and the payout follows the grade. So it resolves a tick later than
     it used to, and the assertion has to wait for it. */
  MI._forceEvent('cache');
  await until(() => (E.S().foundMats || []).length >= 1, 3000, 'cache trial pays out');
  assert((E.S().foundMats || []).length >= 1, 'a worked cache gives up a rare bench material');
  assert(!M.paused, 'the road resumes once the cache trial is done');

  // a found reagent unlocks Reagent craft at the bench (as the oasis spring can)
  MI._grantReagent('springwater');
  assert(E.S().techniques.includes('reagentcraft'), 'first reagent unlocks Reagent craft at the bench');

  const wPre = M.weather;
  MI._forceEvent('storm');
  assert(M.weather === 'rain' || M.weather === 'snow', 'storm changes the weather');

  const stam = M.stats.stamina;
  MI._forceEvent('slide');
  assert(M.stats.stamina >= stam - 5, 'forged edge clears the slide cheaply');

  M.gate = null;
  MI._forceEvent('traveler');
  assert(!MI._gate() && !M.questionOpen, 'traveler auto-resolves without a pop-up');

  /* ---- raid + forged answers still work ---- */
  MI._forceRaid();
  assert(M.raid && !M.raid.resolved, 'raid approaches');
  MI._use('vanish');
  assert(M.raid.resolved, 'smoke shell answers the ambush');

  /* ---- storm-aware deck rebuild ---- */
  const deck2 = MI._hazardDeck();
  assert(deck2.filter(k => k === 'mud').length >= 2, 'wet weather deals more mud into the deck');

  /* ---- arrival → result → heirloom choice persists ---- */
  M.evIdx = M.events.length;   // drain remaining planned stops — this test only checks arrival
  M.gate = null; M.paused = false; M.questionOpen = false;
  M.progress = 0.995;
  await until(() => doc.querySelector('#s-result').classList.contains('active'), 15000, 'result screen');
  assert(doc.querySelector('#s-result').classList.contains('active'), 'arrival reaches the result screen');
  await sleep(300);
  const picks = doc.querySelectorAll('.heir-pick .btn');
  assert(picks.length >= 2, 'heirloom chooser offered (fine/ok tools + travel light)');
  picks[0].click();
  assert(E.S().heirloom && E.S().heirloom.bpId === flow.forged[0].bpId, 'chosen heirloom persisted for the next mission');
  assert(E.S().techniques.includes('reagentcraft'), 'techniques persisted');

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
