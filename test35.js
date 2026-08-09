/* test35.js — THE WALK'S THREE FACTORS, AND THE FIRST WALK THAT TEACHES THEM.

   1. Every icon in the game is a drawing. Nothing falls through as bare text,
      nothing resolves to an empty string, and every key the game actually asks
      for has an entry of its own.
   2. The road's HUD is stamina / power / speed, and each is a different KIND of
      thing: a clock that only falls, a reserve that is spent, and a readout.
   3. Stamina falls with time. Power does not — it falls when a lunge LANDS on
      something real, and when a hazard lands on the squad.
   4. Power at zero does not end the run; it makes the stamina clock accelerate,
      and keep accelerating the longer the squad stays spent.
   5. The river floor is the way back: it returns power and unwinds the burn.
   6. Speed is governed by the other two, and says why it is what it is.
   7. The first road a player ever walks opens the road school, which names every
      option the walk offers — and it does not reappear on the second road. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const doc = window.document;
  const S = E.newGame(); E.setS(S); E.applySettings();

  /* ================= 1. NO BLANK ICONS, ANYWHERE ================= */
  const isSvg = (s) => typeof s === 'string' && /^<svg[\s>]/.test(s.trim()) && s.length > 40;

  // every key the game hands to mark() — the passive/spec/forecast icon names,
  // the ability marks, and the typographic marks it used to pass through raw
  const markKeys = [
    'warn', 'blade', 'bow', 'hook', 'rope', 'climb', 'foot', 'ear', 'paw', 'grain',
    'smoke', 'kit', 'splint', 'scroll', 'anvil', 'flask', 'bolt', 'pick', 'shield',
    'lens', 'pack', 'swords', 'sound', 'slow', 'seal', 'claws',
    'brace', 'focus', 'haul', 'lead',
    'stamina', 'power', 'speed',
    'mouse', 'reach', 'key', 'lanes', 'river', 'ledge', 'word', 'gate',
    'star', 'check', 'spark', 'ring', 'dot', 'gap', 'cross', 'plan',
    '★', '✓', '✦', '○', '◦', '·', '▲', '✕', 'Δ'
  ];
  let bad = [];
  markKeys.forEach(k => { if (!isSvg(D.mark(k))) bad.push(k); });
  assert(bad.length === 0, `icons: every mark the game asks for is a drawing, not text (${bad.join(', ') || 'none missing'})`);
  assert(!/[★✓▲·]/.test(D.mark('★') + D.mark('✓') + D.mark('▲') + D.mark('·')),
    'icons: the typographic marks are drawn now — no bare characters left in a row of pictures');
  assert(isSvg(D.mark('a-key-that-does-not-exist')),
    'icons: even an unrecognised key comes back as a drawing, so no slot is ever empty');
  assert(D.mark(null) === '' && D.mark('') === '',
    'icons: asking for no icon still gets you no icon — the fallback is for keys, not for nothing');

  // every icon key the blueprint, material and reagent tables actually name —
  // `claws` was the one with no drawing behind it, and it printed the word
  const gearIco = window.__RD_PREP._gearIcon;
  let blankGear = [];
  ['hook', 'smoke', 'bow', 'blade', 'claws', 'kit', 'rope', 'not-a-real-icon'].forEach(k => {
    if (!isSvg(gearIco(k))) blankGear.push(k);
  });
  assert(blankGear.length === 0,
    `icons: every forged-gear slot gets a picture, including one the table has never heard of (${blankGear.join(', ') || 'all drawn'})`);

  // the supply table, which is drawn straight rather than through mark()
  const supMissing = D.SUPPLIES.filter(s => !isSvg(D.SUPPLY_ICONS[s.id])).map(s => s.id);
  assert(supMissing.length === 0, `icons: every supply in the table has its own drawing (${supMissing.join(', ') || 'all present'})`);

  /* ================= A LIVE ROAD ================= */
  E.S().settings.difficulty = 'steady';
  E.S().chapter = 2;
  const ch = D.CHAPTERS[2];
  const flow = {
    chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0,
    results: {}, forged: [], route: null, stats: {}
  };
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const M = MI._state();

  /* ================= 7a. THE FIRST WALK TEACHES THE WALK ================= */
  const lifetime = E.S().lifetime || {};
  assert(lifetime.roadsStarted === 1, 'school: this is the first road this player has ever walked');
  await until(() => !!MI._school(), 4000, 'the road school opens');
  const school = MI._school();
  assert(!!school, 'school: the first road opens with the lesson, before a step is taken');
  assert(doc.getElementById('road-school').classList.contains('show'), 'school: and it is actually on screen');
  assert(M.paused === true, 'school: the road is held still while it is up — nothing is lost to reading it');

  const cards = MI._schoolCards();
  assert(cards.length >= 6, `school: it is a lesson, not a tooltip (${cards.length} cards)`);
  const allText = cards.map(c => (c.t + ' ' + c.b)).join(' ').toLowerCase();
  // every option the walk actually offers has to be named somewhere in it
  const mustTeach = {
    'stamina': 'stamina',
    'power': 'power',
    'speed': 'speed',
    'the river floor': 'river floor',
    'the high ledge': 'high ledge',
    'lunging': 'lunge',
    'focus': 'focus',
    'surge': 'surge',
    'the three charges': 'strike',
    'mend': 'mend',
    'reading a part': 'read',
    'rune gates': 'gate',
    'chaining terms': 'chain'
  };
  const untaught = Object.keys(mustTeach).filter(label => !allText.includes(mustTeach[label]));
  assert(untaught.length === 0, `school: every option on the walk is taught (${untaught.join(', ') || 'nothing left out'})`);
  assert(/zero/.test(allText) && /party goes down/.test(allText),
    'school: and it says plainly how a walk is lost');
  assert(allText.includes('accelerat') || allText.includes('faster the longer'),
    'school: including that an empty power reserve makes the stamina clock run away');

  // it advances card by card, and the last card ends it
  const step0 = doc.getElementById('school-step').textContent;
  MI._schoolNext();
  assert(doc.getElementById('school-step').textContent !== step0, 'school: Next moves to the next card');
  assert(MI._school().i === 1, 'school: and it knows where it is');
  for (let i = 0; i < cards.length + 2; i++) { if (MI._school()) MI._schoolNext(); }
  assert(!MI._school(), 'school: walking through to the end closes it');
  assert(!doc.getElementById('road-school').classList.contains('show'), 'school: and clears it off the road');
  assert(M.paused === false, 'school: handing the road back, walking');

  /* ================= 2. THE HUD IS THE THREE FACTORS ================= */
  assert(JSON.stringify(MI._factors()) === JSON.stringify(['stamina', 'power', 'speed']),
    'factors: the road shows stamina, power and speed — and nothing else');
  const labels = [...doc.querySelectorAll('#mission-prep .pb')].map(pb => pb.dataset.stat);
  assert(JSON.stringify(labels) === JSON.stringify(['stamina', 'power', 'speed']),
    'factors: and that is what is actually rendered into the HUD');
  assert([...doc.querySelectorAll('#mission-prep .pb .lab svg.mk')].length === 3,
    'factors: each of the three carries its own icon, so the row reads without reading');
  assert([...doc.querySelectorAll('#mission-prep .pb')].every(pb => (pb.title || '').length > 12),
    'factors: and each says what it does, for anyone who asks it');
  assert(/×\d/.test(doc.querySelector('#mission-prep .pb[data-stat="speed"]').title || ''),
    'factors: the speed bar carries the live pace figure and the reason for it');
  assert(M.stats.power > 0 && M.stats.stamina > 0,
    'factors: the squad sets out with both reserves on the board');

  /* ================= 3. STAMINA IS A CLOCK, POWER IS NOT ================= */
  M.stats.stamina = 80; M.stats.power = 80; M.powerOutT = 0;
  MI._setLane(1);
  const t0 = { st: M.stats.stamina, pw: M.stats.power };
  await sleep(900);
  assert(M.stats.stamina < t0.st, `clock: stamina falls on its own with time (${t0.st} → ${M.stats.stamina.toFixed(1)})`);
  assert(M.stats.power >= t0.pw - 0.001,
    `reserve: power does NOT fall with time — it is spent, not drained (${t0.pw} → ${M.stats.power.toFixed(1)})`);

  /* ---- a lunge that lands on something spends it; one into thin air does not ---- */
  M.hazards.length = 0;
  M.stats.power = 90; M.lungeCd = 0;
  MI._lunge(10, 10);                         // nothing whatsoever at that spot
  const afterMiss = M.stats.power;
  assert(90 - afterMiss <= 2.5,
    `power: a lunge into empty air is nearly free (${(90 - afterMiss).toFixed(1)} spent)`);

  MI._spawnHazardAt(M.progress + 0.02, 1, 'rock');
  const hz = M.hazards[M.hazards.length - 1];
  assert(!!hz, 'power: a hazard is standing on the road to lunge at');
  M.stats.power = 90; M.lungeCd = 0;
  MI._lunge(MI._screenX(hz.p), MI._objY(hz));
  const afterHit = M.stats.power;
  assert(90 - afterHit >= 4,
    `power: a lunge that LANDS on something really there costs a bite of power (${(90 - afterHit).toFixed(1)} spent)`);
  assert(afterHit < afterMiss, 'power: connecting is what is expensive, not clicking');

  /* ---- and every hazard in the table takes power when it lands on them ---- */
  const noBite = Object.keys(MI.HAZARDS).filter(k => !(MI.HAZARDS[k].dmg && MI.HAZARDS[k].dmg.power > 0));
  assert(noBite.length === 0,
    `power: every hazard on the road takes power when it connects (${noBite.join(', ') || 'all of them do'})`);

  /* ================= 4. AT ZERO, THE CLOCK RUNS AWAY ================= */
  M.stats.power = 0; M.powerOutT = 0; M.stats.stamina = 90;
  MI._setLane(1);
  await sleep(700);
  const earlyBurn = 90 - M.stats.stamina;
  assert(earlyBurn > 0, 'spent: the clock is running');
  // let them stay spent, and measure the same window again
  M.stats.power = 0;
  await until(() => M.powerOutT >= 6, 9000, 'the squad stays spent');
  M.stats.stamina = 90;
  const tSpent = M.powerOutT;
  await sleep(700);
  const lateBurn = 90 - M.stats.stamina;
  assert(M.powerOutT > 1, `spent: the game is counting how long they have been empty (${tSpent.toFixed(1)}s)`);
  assert(lateBurn > earlyBurn * 1.15,
    `spent: the longer they walk on nothing, the FASTER stamina goes (${earlyBurn.toFixed(2)} → ${lateBurn.toFixed(2)} over the same window)`);
  assert(!M.collapsing, 'spent: but empty power is not itself a loss — only stamina ends a run');

  /* ================= 5. THE RIVER FLOOR IS THE WAY BACK ================= */
  M.stats.power = 0; M.stats.stamina = 70;
  MI._setLane(2);
  await sleep(900);
  assert(M.stats.power > 0, `river: the river floor gives power back (0 → ${M.stats.power.toFixed(1)})`);
  const outT = M.powerOutT;
  await sleep(600);
  assert(M.powerOutT < outT + 0.001, 'river: and the accelerating burn unwinds instead of holding');

  /* ================= 6. SPEED IS A READOUT THAT SAYS WHY ================= */
  M.stats.power = 90; M.stats.stamina = 90; M.powerOutT = 0;
  MI._setLane(1);
  await sleep(200);
  const sp = MI._speedStatus();
  assert(typeof sp.pct === 'number' && sp.pct >= 0 && sp.pct <= 100, 'speed: it reports a live figure');
  assert(typeof sp.word === 'string' && sp.word.length > 0, 'speed: with a word for what that figure means');
  const readout = doc.getElementById('pbr-speed');
  assert(readout && readout.textContent.length > 0, 'speed: and the HUD shows that word, not a bare bar');

  M.stats.power = 0;
  await sleep(120);
  const spent = MI._speedStatus();
  assert(/power/i.test(spent.why || ''), `speed: when power is gone the readout says so ("${spent.why}")`);
  MI._setLane(2);
  await sleep(120);
  assert(MI._speedStatus().why.length > 0, 'speed: and it always has a reason for what it is doing');

  /* ---- power really is one of the things deciding how fast the road moves ---- */
  M.stats.power = 100; M.stats.stamina = 90; M.powerOutT = 0; MI._setLane(1);
  await sleep(140);
  const fast = MI._speedStatus().pct;
  const pFull = M.progress;
  await sleep(700);
  const movedFull = M.progress - pFull;
  M.stats.power = 0; M.stats.stamina = 90;
  await sleep(140);
  const pEmpty = M.progress;
  await sleep(700);
  const movedEmpty = M.progress - pEmpty;
  assert(movedEmpty < movedFull,
    `speed: a squad with no power covers less road in the same time (${movedFull.toFixed(4)} → ${movedEmpty.toFixed(4)})`);
  assert(typeof fast === 'number', 'speed: the gauge tracked it throughout');

  /* ================= 7b. THE LESSON DOES NOT REPEAT ================= */
  assert(!!doc.getElementById('pause-school'), 'school: the pause menu carries the lesson from then on');
  MI._schoolOpen(true);
  assert(!!MI._school(), 'school: and it opens on demand, on any road, forever');
  MI._schoolClose();
  assert(!MI._school(), 'school: closing it puts the player back where they were');

  summary(errors);
})();
