/* test34.js — THE ROAD CLUTTER / DIFFICULTY / GATE-LEAD PASS.

   Three complaints, one file:
     1. Too many word-parts in the air at once — the road read as confetti
        rather than as a choice between two or three doors.
     2. The rune gate arrives too close to read, especially when the player is
        doing well and the road is running fast.
     3. The difficulty setting could not be felt in the thing it should move
        most: which word-parts you meet, and how hard the wrong answers are.
   Plus the seeded-road box, which now takes a plain chapter number and opens
   the campaign up to it. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  const SC = window.__RD_SCREENS;
  assert(E && D && P && MI && SC, 'modules exposed');
  const doc = window.document;

  const S = E.newGame(); E.setS(S); E.applySettings();

  /* ================= THE CAMPAIGN IS PART OF THE DIFFICULTY ================= */
  E.S().settings.difficulty = 'steady';
  E.S().chapter = 0;
  const early = E.diffTune();
  E.S().chapter = D.CHAPTERS.length - 1;
  const late = E.diffTune();
  assert(early.depth === 0 && late.depth === 1,
    'depth: the Prologue is 0 and the Great Archive is 1 — the chapter number is a real input');
  assert(late.density > early.density && late.dmg > early.dmg && late.drain > early.drain,
    `depth: the last chapter genuinely runs harder than the first at the same setting (density ${early.density.toFixed(2)} → ${late.density.toFixed(2)})`);
  assert(late.reach > early.reach,
    'depth: and it reaches further into word-parts the player has never met');
  assert(early.mercyDim === late.mercyDim && early.choices === late.choices,
    'depth: but it never takes away what the SETTING promised — the affordances belong to the setting alone');

  // the setting still outranks it end to end
  E.S().chapter = 0; E.S().settings.difficulty = 'hard';
  const hardEarly = E.diffTune();
  E.S().chapter = D.CHAPTERS.length - 1; E.S().settings.difficulty = 'easy';
  const easyLate = E.diffTune();
  assert(hardEarly.density > easyLate.density,
    'depth: a Demanding Prologue is still denser than a Gentle Archive — the player is never overruled');

  /* ================= HOW MUCH THE ROAD IS ALLOWED TO HOLD ================= */
  E.S().settings.difficulty = 'easy';
  const fieldEasy = MI._difficultyAt(0.5).field;
  E.S().settings.difficulty = 'hard';
  const fieldHard = MI._difficultyAt(0.5).field;
  assert(fieldHard > fieldEasy,
    `field: a demanding road is allowed more on screen at once (${fieldEasy} → ${fieldHard} obstacles)`);
  assert(fieldEasy >= 3 && fieldHard <= 8, 'field: and both ends stay inside a road a human can read');

  /* ================= A LIVE ROAD ================= */
  E.S().settings.difficulty = 'steady';
  E.S().chapter = 2;
  const ch = D.CHAPTERS[2];
  const mk = (bpId, grants) => ({ id: bpId + Math.random(), bpId, name: bpId, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null, quality: 0.7, qtier: 'ok',
    traits: { power: 2 }, assignedTo: null });
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  flow.forged = [mk('blade', ['cut'])];
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const M = MI._state();

  /* ---- THE FIELD CAP: an offer is a choice you can actually see ---- */
  const cap = MI._lexemeCap();
  assert(cap <= 5, `clutter: the road holds a handful of word-parts, not a dozen (cap ${cap})`);
  // hammer the spawner far harder than the real drip ever would
  let refused = 0;
  for (let i = 0; i < 40; i++) { if (MI._spawnOffer() === false) refused++; }
  assert(refused > 0, 'clutter: the spawner refuses once the field is full instead of piling on');
  assert(MI._liveLexemes() <= cap,
    `clutter: forty offers back to back still leave at most ${cap} word-parts in the air (got ${MI._liveLexemes()})`);

  // and a refused offer really does add nothing
  const before = MI._pickups().length;
  MI._spawnOffer();
  assert(MI._pickups().length === before, 'clutter: a refused offer adds no pickups at all');

  // once the field drains, offers flow again — the cap is a ceiling, not a stop
  MI._pickups().forEach(pk => { pk.got = true; });
  assert(MI._spawnOffer() === true, 'clutter: with the road clear, the next offer goes out immediately');
  assert(MI._liveLexemes() >= 2, 'clutter: and an offer is at least two doors — otherwise there is nothing to choose');

  /* ---- HAZARDS ARE CAPPED THE SAME WAY ---- */
  M.hazards.length = 0;
  let hazRefused = 0;
  for (let i = 0; i < 40; i++) { if (MI._spawnHazard(4) === false) hazRefused++; }
  assert(hazRefused > 0, 'clutter: hazards obey a field cap too');
  const liveHaz = M.hazards.filter(h => !h.hit && !h.passed).length;
  assert(liveHaz <= 4, `clutter: no more than the cap stand on the road at once (got ${liveHaz})`);

  /* ================= THE GATE ARRIVES WITH ROOM TO READ ================= */
  assert(MI.GATE_LEAD() > 0.18,
    `gate: the lead is longer than it was (${MI.GATE_LEAD()} of road, was 0.18)`);
  M.progress = 0.1; M.gate = null;
  M.paceLive = 1;
  const leadSlow = MI._gateLead();
  M.paceLive = 1.9;
  const leadFast = MI._gateLead();
  assert(leadFast > leadSlow * 1.5,
    `gate: a road running fast opens its gates further out, so the READING TIME holds (${leadSlow.toFixed(2)} → ${leadFast.toFixed(2)})`);
  M.paceLive = 1;

  const g = MI._forceGate();
  assert(g, 'gate: a gate opened');
  assert(Math.abs((g.p - M.progress) - g.lead) < 1e-6, 'gate: the gate records the lead it actually opened at');
  assert(MI._inGateCorridor(g.p - g.lead * 0.9),
    'gate: and the cleared corridor covers that whole approach, not the first part of it');
  MI._resolveGate(); M.gate = null;

  /* ---- a gate is never planted past the destination ---- */
  M.progress = 0.93; M.gate = null;
  const late1 = MI._forceGate();
  assert(!late1 || late1.p < MI._progressCeiling(),
    'gate: with the destination in sight, either no gate opens or it opens on road the squad will actually walk');
  M.gate = null;

  // and the road plan keeps gates out of the tail in the first place
  let latestGate = 0, plans = 0;
  for (let i = 0; i < 30; i++) {
    const plan = MI.buildRoadPlan(flow);
    plan.events.forEach(e => { if (e.type === 'gate') { latestGate = Math.max(latestGate, e.at); plans++; } });
  }
  assert(plans > 0 && latestGate <= 0.72,
    `gate: no road plan draws a gate into the last stretch (latest ${latestGate.toFixed(2)})`);

  /* ================= WHICH ROOTS THE ROAD PUTS IN FRONT OF YOU ================= */
  // teach the player a handful of parts, then ask each end of the scale what it offers
  const someParts = Object.keys(D.PARTS).slice(0, 8);
  someParts.forEach(id => E.markPartSeen(id));
  const seen = new Set(E.seenParts());
  const sampleSeenShare = (reach) => {
    M.diff = Object.assign({}, M.diff, { reach });
    let hits = 0;
    for (let i = 0; i < 240; i++) { if (seen.has(MI._pickRoadPart())) hits++; }
    return hits / 240;
  };
  const familiar = sampleSeenShare(0);
  const unfamiliar = sampleSeenShare(1);
  assert(familiar > unfamiliar,
    `content: a gentle road drills the parts the player has met; a demanding one keeps introducing new ones (${(familiar * 100).toFixed(0)}% vs ${(unfamiliar * 100).toFixed(0)}% already seen)`);
  assert(familiar - unfamiliar > 0.15, 'content: and the difference is large enough to be felt, not a rounding error');

  /* ---- how hard the WRONG doors are ---- */
  const target = 'cardi';
  const pool = Object.keys(D.PARTS).filter(id => id !== target
    && D.PARTS[id].kind === D.PARTS[target].kind
    && D.PARTS[id].mean !== D.PARTS[target].mean);
  const sameOpening = (ids) => ids.filter(id => String(D.PARTS[id].stem || '')[0] === 'c').length;
  let harshHits = 0, softHits = 0;
  for (let i = 0; i < 60; i++) {
    harshHits += sameOpening(MI._gateDistractors(pool, target, 2, true));
    softHits += sameOpening(MI._gateDistractors(pool, target, 2, false));
  }
  assert(harshHits > softHits,
    `content: a demanding gate offers wrong doors that actually look like the answer (${harshHits} vs ${softHits} sharing its opening letter)`);

  /* ---- but confusable is not the same as ambiguous ---- */
  const meaningWords = (id) => String(D.PARTS[id].mean || '').toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3);
  let ambiguous = 0, checked = 0;
  Object.keys(D.PARTS).forEach(t => {
    const p = Object.keys(D.PARTS).filter(id => id !== t
      && D.PARTS[id].kind === D.PARTS[t].kind
      && D.PARTS[id].mean !== D.PARTS[t].mean);
    if (p.length < 4) return;
    const tw = new Set(meaningWords(t));
    MI._gateDistractors(p, t, 2, true).forEach(id => {
      checked++;
      if (id === t || meaningWords(id).some(w => tw.has(w))) ambiguous++;
    });
  });
  assert(checked > 100 && ambiguous === 0,
    `content: no gate anywhere in the corpus offers a near-synonym as a wrong door — a gate always has exactly one right answer (${checked} doors checked)`);

  M.done = true;

  /* ================= THE SEEDED-ROAD BOX TAKES A CHAPTER NUMBER ================= */
  const S2 = E.newGame(); E.setS(S2); E.applySettings();
  SC.showHub();
  await sleep(60);
  const setChapter = async (txt) => {
    const inp = doc.getElementById('path-seed-input');
    const btn = doc.getElementById('path-seed-btn');
    if (!inp || !btn) return null;
    inp.value = txt; btn.onclick();
    await sleep(60);
    return E.S();
  };

  assert(doc.getElementById('path-seed-input'), 'seeded road: the box is on the hub');
  let st = await setChapter('2');
  assert(st.chapter === 2, 'seeded road: entering 2 unlocks Chapter Two');
  assert(st.servedChapterIds.length === 2 && st.servedChapterIds.indexOf('ch1') >= 0,
    'seeded road: and everything before it counts as walked, so Chapter Two is reachable');
  assert(st.pendingSeed == null, 'seeded road: a chapter number is not mistaken for a road code');
  assert(st.unlockedBps.length > 1, 'seeded road: the bench patterns those chapters would have earned come with it');
  assert(st.pages >= 2, 'seeded road: so do the recovered pages, so the regions match the progress');

  st = await setChapter('7');
  assert(st.chapter === 7, 'seeded road: entering 7 opens every level up to seven');
  assert(st.servedChapterIds.length === 7, 'seeded road: all seven earlier chapters are behind them');
  assert(D.CHAPTERS[7] && st.chapter === D.CHAPTERS[7].num,
    'seeded road: the number the player typed is the chapter number they get');

  // a real road code still works, and is still a road code
  st = await setChapter(E.seedToCode(123456));
  assert(st.pendingSeed === 123456, 'seeded road: a proper base-36 code still queues a shared road');
  assert(st.chapter === 7, 'seeded road: and queuing one does not touch the campaign');

  // out of range says so and changes nothing
  const chapterBefore = E.S().chapter;
  await setChapter('42');
  assert(E.S().chapter === chapterBefore, 'seeded road: a number past the last chapter is refused, not clamped silently');

  summary(errors);
})();
