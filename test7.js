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

  /* ---- interactive flavor events ---- */
  // oasis → press on → bottled spring water reagent
  MI._forceEvent('oasis');
  assert(MI._choice() && MI._choice().up && MI._choice().down, 'oasis is a real choice');
  MI._forkPick('down');
  assert((E.S().reagents.springwater || 0) === 1, 'oasis flask branch banks a reagent');
  assert(E.S().techniques.includes('reagentcraft'), 'first reagent unlocks Reagent craft at the bench');
  assert(!MI._choice(), 'choice resolves');

  // cache → pry (blade counts) → first found-mat discovered
  MI._forceEvent('cache');
  MI._forkPick('up');
  assert((E.S().foundMats || []).length === 1, 'pried cache yields a rare bench material');

  // cache again → mark for the guild
  MI._forceEvent('cache');
  MI._forkPick('down');
  assert(M.cachesMarked === 1, 'guild mark recorded for results pay');

  // scholar → road-lore → hazards revealed for a stretch
  MI._forceEvent('scholar');
  MI._forkPick('down');
  assert(M.revealT > 0, 'scholar road-lore names dangers ahead');

  // storm → shelter → weather turns, pace drops, no morale hit
  const mor = M.stats.morale;
  MI._forceEvent('storm');
  MI._forkPick('down');
  assert(M.weather === 'rain' || M.weather === 'snow', 'storm changes the weather');
  assert(M.paceMult < 1 && M.paceT > 0, 'sheltering trades pace for safety');
  assert(M.stats.morale >= mor, 'sheltered squad takes no storm damage');

  // slide → clear it (blade) → cheap and fast
  const stam = M.stats.stamina;
  MI._forceEvent('slide');
  MI._forkPick('up');
  assert(M.stats.stamina >= stam - 5, 'forged edge clears the slide cheaply');

  // traveler → directions → routes through the shared QuestionEngine
  MI._forceEvent('traveler');
  MI._forkPick('down');
  await until(() => M.questionOpen, 4000, 'traveler question');
  assert(M.questionOpen, 'traveler directions ask a real vocab question');
  const doc = window.document;
  assert(doc.querySelector('#mini-challenge').classList.contains('show'), 'challenge box shown');
  const correctLabel = doc.querySelectorAll('#mini-opts .btn');
  assert(correctLabel.length >= 2, 'question has options');
  correctLabel[0].click();
  await until(() => !M.paused, 6000, 'question resolves');
  assert(!M.questionOpen, 'question closed, road resumes');

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
  M.fork = null; M.paused = false; M.questionOpen = false;
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
