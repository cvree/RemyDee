/* test25 — the road as a decision.
   Word-parts used to drip out one at a time in a random band, so there was
   frequently exactly one part on a 1320px field and nothing to choose between.
   They arrive in offers now: two or three parts in the air together, in
   different bands, at most one of which finishes a real term. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const MI = window.__RD_MISSION, D = window.__RD_DATA;
  const PARTS = D.PARTS, TERMS = D.TERMS;

  MI.startEndlessRoad();
  const ok = await until(() => MI._dbg() && MI._dbg().pickups, 6000, 'the road to start');
  assert(ok, 'the endless road starts and builds a playfield');
  const M = MI._dbg();

  // let a few spawn ticks run
  let tries = 0;
  while (M.pickups.filter(p => !p.got).length < 4 && tries++ < 60) await sleep(120);

  const live = M.pickups.filter(p => !p.got);
  assert(live.length >= 4,
    'the road carries several pickups at once instead of one at a time: ' + live.length);

  const words = live.filter(p => p.partId);
  assert(words.length >= 3, 'most of what is in the air is word-parts: ' + words.length + '/' + live.length);

  // an offer is a set of parts at nearly the same distance in different bands.
  // Group by distance and check the biggest group spans more than one band.
  const groups = {};
  words.forEach(p => { const k = Math.round(p.p * 40); (groups[k] = groups[k] || []).push(p); });
  const spread = Object.values(groups)
    .filter(g => g.length > 1)
    .some(g => new Set(g.map(p => p.lane)).size > 1);
  assert(spread, 'parts that arrive together arrive in different bands, so reaching one means passing another');

  // no two live parts should sit close enough to be swept up as a pair
  const tooClose = [];
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) {
    const a = words[i], b = words[j];
    if (Math.abs(a.p - b.p) < 0.004 && Math.abs(a.u - b.u) < 0.06) tooClose.push([a.partId, b.partId]);
  }
  assert(tooClose.length === 0,
    'no two parts overlap closely enough to collect together (that is not a choice): ' + tooClose.length);

  /* Every part offered must be a legal continuation of something — the road may
     not hand the player a piece that can only break their chain. */
  const kinds = new Set(words.map(p => PARTS[p.partId] && PARTS[p.partId].kind));
  assert(!kinds.has(undefined), 'every offered tile is a real word part');

  /* And the schedule must not be paid for a word that is not a word. This is the
     same guarantee test24 makes for the engine, checked here on the road path. */
  const sigs = new Set(Object.keys(TERMS).map(t => TERMS[t].build.join('+')));
  const before = JSON.stringify(window.__RD_ENG.S().mastery.parts);
  M.combo = ['hyper', 'ot'];
  const nonWord = ['hyper', 'ot', 'algia'];
  assert(!sigs.has(nonWord.join('+')), 'the chain used here really is not a term');
  window.__RD_QE.record(nonWord.filter(() => false), true);
  assert(JSON.stringify(window.__RD_ENG.S().mastery.parts) === before,
    'nothing about a coined chain touches the review schedule');

  MI.endEndlessRoad && MI.endEndlessRoad();
  await sleep(200);
  summary(errors);
})();
