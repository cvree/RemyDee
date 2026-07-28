/* test17.js — DIFFICULTY: four settings, one tuning table, and a road that
   learns. Plus the two systems that make the harder settings worth walking:
   the re-ask loop (a wrong answer comes straight back) and the flow state
   (push-your-luck earned only by knowing things). */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION, QE = window.__RD_QE;
  assert(E && D && P && MI && QE, 'modules exposed');
  const doc = window.document;
  const S = E.newGame(); E.setS(S); E.applySettings();

  /* ================= THE FOUR SETTINGS ================= */
  assert(E.DIFFS.length === 4, 'difficulty: four settings are offered');
  const keys = E.DIFFS.map(d => d.key);
  ['easy', 'steady', 'hard', 'adaptive'].forEach(k =>
    assert(keys.includes(k), `difficulty: "${k}" is one of them`));
  const adaptive = E.DIFFS.find(d => d.key === 'adaptive');
  assert(adaptive.tier === null, 'difficulty: the adaptive setting has no fixed tier — that is the point of it');
  E.DIFFS.forEach(d => assert(d.note && d.note.length > 40,
    `difficulty: "${d.name}" says plainly what it changes, rather than just naming itself`));

  /* ================= NOTHING IS COSMETIC ================= */
  const tune = (k) => { E.S().settings.difficulty = k; return E.diffTune(); };
  const easy = tune('easy'), steady = tune('steady'), hard = tune('hard');
  assert(easy.tier < steady.tier && steady.tier < hard.tier, 'difficulty: the three fixed settings are ordered on one scale');
  const knobs = [
    ['density', 'hazards on the road', 1],
    ['dmg', 'how hard a hazard lands', 1],
    ['drain', 'how fast the squad tires — the run\'s clock', 1],
    ['gateLead', 'how much road you get to read a gate over', -1],
    ['startMul', 'how much strength the squad sets out with', -1],
    ['momentumDecay', 'how fast momentum bleeds away', 1],
    ['healMul', 'what a completed term restores', -1]
  ];
  knobs.forEach(([k, what, dir]) => {
    const moved = dir > 0 ? (hard[k] > easy[k]) : (hard[k] < easy[k]);
    assert(moved, `difficulty: it really moves ${what} (${k}: ${easy[k].toFixed(2)} → ${hard[k].toFixed(2)})`);
  });
  assert(easy.mercyDim === true && hard.mercyDim === false,
    'difficulty: the gentlest road always dims a wrong door; the hardest never does');
  assert(easy.choices === 3 && hard.choices === 4,
    'difficulty: a demanding road offers a fourth answer to every question');

  // and the difficulty curve within a road inherits it
  E.S().settings.difficulty = 'easy';
  const curveEasy = MI._difficultyAt(0.5);
  E.S().settings.difficulty = 'hard';
  const curveHard = MI._difficultyAt(0.5);
  assert(curveHard.density > curveEasy.density * 1.6,
    `difficulty: mid-road hazard density is dramatically higher on Demanding (${curveEasy.density.toFixed(2)} vs ${curveHard.density.toFixed(2)})`);
  assert(curveHard.dmg > curveEasy.dmg, 'difficulty: and hazards bite harder there too');
  // the shape of the within-road ramp survives at every setting
  ['easy', 'steady', 'hard'].forEach(k => {
    E.S().settings.difficulty = k;
    const a = MI._difficultyAt(0.02), b = MI._difficultyAt(0.95);
    assert(b.density > a.density * 1.5, `difficulty: on ${k}, the last third of a road is still visibly harder than the first`);
  });

  /* ================= THE ROAD THAT LEARNS ================= */
  E.S().settings.difficulty = 'adaptive';
  E.S().skill = { rating: 0.5, answers: 0, runs: 0, tier: 0.42, lastTierName: null };
  const t0 = E.diffTier();
  assert(Math.abs(t0 - 0.42) < 0.02, 'adaptive: a brand-new player starts at Steady, not at a guess');

  // a first answer must not swing the whole road
  E.noteSkillAnswer(true);
  assert(Math.abs(E.diffTier() - t0) < 0.05, 'adaptive: one answer barely moves it — a lucky guess is not evidence');

  // but a sustained run of right answers does
  for (let i = 0; i < 40; i++) E.noteSkillAnswer(true);
  const tHigh = E.diffTier();
  assert(tHigh > t0 + 0.15, `adaptive: answering well consistently raises the road (${t0.toFixed(2)} → ${tHigh.toFixed(2)})`);
  assert(tHigh <= 0.96, 'adaptive: and it never exceeds the hardest hand-authored setting');

  for (let i = 0; i < 60; i++) E.noteSkillAnswer(false);
  const tLow = E.diffTier();
  assert(tLow < t0, `adaptive: struggling lowers it again (${tHigh.toFixed(2)} → ${tLow.toFixed(2)})`);
  assert(tLow >= 0.10, 'adaptive: and it never drops below the gentlest setting — there is always a road');

  // a finished run outweighs a single answer
  const before = E.skillState().rating;
  E.noteSkillRun({ score: 1 });
  assert(E.skillState().rating - before > 0.1, 'adaptive: a whole finished run counts for far more than one answer');

  // the band always has a name the player can be told
  ['Gentle', 'Steady', 'Demanding', 'Unforgiving'].forEach((n, i) => {
    const t = [0.1, 0.45, 0.75, 0.95][i];
    assert(E.tierBandName(t) === n, `adaptive: tier ${t} is named "${n}" so it can be shown to the player`);
  });

  // a FIXED setting must never drift
  E.S().settings.difficulty = 'hard';
  const fixedBefore = E.diffTier();
  for (let i = 0; i < 40; i++) E.noteSkillAnswer(false);
  assert(E.diffTier() === fixedBefore, 'difficulty: a fixed setting stays exactly where the player put it, whatever they do');

  /* ================= IT REACHES A LIVE ROAD ================= */
  const ch = D.CHAPTERS[2];
  const mk = (bpId, name, grants) => ({ id: bpId + Math.random(), bpId, name, genName: name, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null, quality: 0.7, qtier: 'ok', traits: { power: 2 }, assignedTo: null });
  const startRoad = async (key) => {
    E.S().settings.difficulty = key;
    const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
    flow.forged = [mk('blade', 'Short blade', ['cut'])];
    E.setFlow(flow); flow.roadPlan = MI.buildRoadPlan(flow); P._depart();
    await until(() => !!MI._state() && !MI._state().done, 6000, key + ' road starts');
    return MI._state();
  };

  const mEasy = await startRoad('easy');
  const easyStam = mEasy.stats.stamina, easyLead = MI._gateLead();
  assert(mEasy.diff && mEasy.diff.key === 'easy', 'road: the run takes one snapshot of the difficulty when the squad sets out');
  MI._state().done = true;

  const mHard = await startRoad('hard');
  assert(mHard.stats.stamina < easyStam,
    `road: the squad sets out with less on Demanding (${easyStam.toFixed(0)} vs ${mHard.stats.stamina.toFixed(0)} stamina)`);
  assert(MI._gateLead() < easyLead,
    `road: gates arrive with less warning on Demanding (${easyLead.toFixed(3)} vs ${MI._gateLead().toFixed(3)} of road)`);

  // the snapshot cannot shift underneath a walk in progress
  const snap = mHard.diff.drain;
  E.S().settings.difficulty = 'easy';
  assert(MI._state().diff.drain === snap,
    'road: changing the setting mid-walk does not rewrite the rules of the walk you are on');
  E.S().settings.difficulty = 'hard';

  // the stamina clock really is faster
  const M = MI._state();
  M.stats.stamina = 90; M.stats.morale = 90; M.stats.safety = 90;
  await sleep(700);
  const hardBurn = 90 - MI._state().stats.stamina;
  assert(hardBurn > 0, `road: stamina is a live clock on Demanding (burned ${hardBurn.toFixed(1)} in ~0.7s)`);

  /* ================= COMPLETION GATES ================= */
  const comp = MI._pickCompletionGate();
  assert(comp && comp.targetId && comp.skeleton.includes('___'),
    'completion gate: a real term is offered with one part torn out');
  assert(comp.skeleton.includes('+'), 'completion gate: the parts that remain are shown, so it is construction and not a guess');
  assert(comp.def && comp.def.length > 3, 'completion gate: and the meaning of the finished word is given as the clue');
  assert(D.TERMS[comp.termId].build.includes(comp.targetId), 'completion gate: the answer is genuinely part of that term');

  /* ================= THE RE-ASK LOOP ================= */
  const M2 = MI._state();
  M2.reask = [];
  const partId = Object.keys(D.PARTS)[3];
  MI._pushReask(partId);
  assert(MI._reask().includes(partId), 're-ask: a missed concept is remembered');
  let sawFocused = 0;
  for (let i = 0; i < 40; i++) { const q = MI._reviewChallenge(); if (q.reask && q.conceptIds.includes(partId)) sawFocused++; }
  assert(sawFocused > 8, `re-ask: the thing you got wrong really does come back (${sawFocused}/40 questions)`);
  // a focused question is answerable — one correct option, distinct wrongs
  const fq = QE.generate({ focus: partId, types: ['partMeaning'] });
  assert(fq.conceptIds.includes(partId), 're-ask: a focused question is about the part you missed');
  assert(fq.options.filter(o => o.ok).length === 1, 're-ask: and still has exactly one correct answer');

  /* ================= THE FLOW STATE ================= */
  const FLOW_AT = MI._flowAt();
  assert(FLOW_AT >= 3, 'flow: it takes a real streak to earn, not two lucky answers');
  MI._state().streak = 0; MI._state().flow = false;
  for (let i = 0; i < FLOW_AT - 1; i++) MI._scoreCorrect(0.5);
  assert(MI._pace().flow !== true, `flow: ${FLOW_AT - 1} in a row is not yet flow`);
  const entered = MI._scoreCorrect(0.5);
  assert(entered.flow === true, `flow: ${FLOW_AT} right answers in a row enters flow`);
  const floorInFlow = MI._forge().momentumFloor;
  assert(floorInFlow >= 2, 'flow: momentum will not fall below a hot floor while it holds');
  assert(MI._momentum() >= 2, 'flow: and the caravan is immediately running hot');
  assert(doc.getElementById('momentum').classList.contains('flow'), 'flow: the meter says so, plainly');
  // one wrong answer ends it
  const broke = MI._scoreWrong();
  assert(broke.flow === false, 'flow: a single wrong answer ends it');
  assert(broke.streak === 0, 'flow: and resets the streak');
  assert(MI._forge().momentumFloor < floorInFlow, 'flow: the hot floor goes with it — nothing is kept for free');
  assert(!doc.getElementById('momentum').classList.contains('flow'), 'flow: and the meter stops claiming it');

  /* ================= THE ROAD REPORTS ITSELF ================= */
  E.S().settings.difficulty = 'adaptive';
  E.S().skill = { rating: 0.5, answers: 200, runs: 6, tier: 0.42, lastTierName: null };
  const bandBefore = E.tierBandName();
  let moved = null;
  for (let i = 0; i < 6 && !moved; i++) moved = MI._noteRunOutcome(1);
  assert(moved, `adaptive: a run of strong arrivals moves the road, and it says which way (${bandBefore} → ${moved})`);
  assert(['Gentle', 'Steady', 'Demanding', 'Unforgiving'].includes(moved),
    'adaptive: the move is reported as a band the player can understand, not a number');
  E.S().settings.difficulty = 'steady';
  assert(MI._noteRunOutcome(1) === null, 'adaptive: a fixed setting never reports a move, because it never moves');

  /* ================= SAVED AND RESTORED ================= */
  E.S().settings.difficulty = 'hard';
  E.persist();
  const reread = E.Save.read();
  assert(reread.settings.difficulty === 'hard', 'difficulty: the choice survives a reload');
  assert(reread.skill && typeof reread.skill.rating === 'number', 'difficulty: so does the adaptive read of the player');
  // a save from before difficulty existed keeps the curve it was actually playing
  const old = E.newGame(); old.ver = 6; delete old.settings.difficulty; delete old.skill;
  window.localStorage.setItem('remydee_lost_lexicon_v3', JSON.stringify(old));
  const migrated = E.Save.read();
  assert(migrated.settings.difficulty === 'steady',
    'difficulty: a returning player is not asked mid-campaign — they keep the curve they were already walking');
  assert(migrated.skill && migrated.skill.rating === 0.5, 'difficulty: and starts the adaptive read from neutral');

  summary(errors);
})();
