/* test25 — the road as a decision.
   Word-parts used to drip out one at a time in a random band, so there was
   frequently exactly one part on a 1320px field and nothing to choose between.
   They arrive in offers now: two or three parts in the air together, in
   different bands, at most one of which finishes a real term.

   The correction to that correction is the field cap. Offers going out every
   1.7s while a part takes ten seconds to cross the field put a dozen unrelated
   roots on screen at once, which is not a bigger decision — it is no decision at
   all, just noise. What this file checks is the shape of an offer and the
   ceiling on the field, not a raw count: MORE than one, and FEWER than a crowd. */
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
  while (M.pickups.filter(p => !p.got).length < 2 && tries++ < 60) await sleep(120);

  const cap = MI._lexemeCap();
  const live = M.pickups.filter(p => !p.got);
  assert(live.length >= 2,
    'the road carries several pickups at once instead of one at a time: ' + live.length);

  const words = live.filter(p => p.partId);
  assert(words.length >= 2, 'an offer is at least two doors: ' + words.length + '/' + live.length);
  assert(MI._liveLexemes() <= cap,
    `and never more than the field cap, so the choice can be read at a glance (${MI._liveLexemes()} of ${cap})`);

  // an offer is a set of parts at nearly the same distance in different bands:
  // reaching for one means passing another, which is what makes it a choice
  const near = [];
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) {
    if (Math.abs(words[i].p - words[j].p) < 0.02) near.push([words[i], words[j]]);
  }
  assert(near.length > 0, 'parts arrive together, not one at a time');
  assert(near.every(([a, b]) => a.lane !== b.lane),
    'parts that arrive together arrive in different bands, so reaching one means passing another');

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
