/* test42.js — WHAT RUNS AFTER THE SCREEN IS GONE.

   Found by cycling the whole game in a real browser for a few minutes with
   every listener call instrumented: Reed Slice threw
   `Cannot set properties of null (setting 'textContent')` out of its animation
   frame. The round's HUD lives in #arcade-stage, the stage is emptied when the
   Hall is left, and the loop went on scoring against it. The banner and flow
   readouts three lines away had always guarded; the score, the lives and the
   prompt never had, and the loop had no way of noticing that its own canvas
   was no longer in the document.

   Seal Match had the same shape with a different clock: a matched pair is
   written 240ms after the second flip, and the board can be gone by then.

   Neither is about those two writes. It is the rule underneath them: nothing
   that keeps running after a screen change may assume the screen it was
   drawing is still there. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));
  const E = window.__RD_ENG, AR = window.__RD_ARCADE, MI = window.__RD_MISSION;
  assert(E && AR && MI, 'modules exposed');

  /* watch what gets scheduled, so a loop that refuses to stop is visible: the
     round's loop re-schedules the same function object every frame, so the last
     thing scheduled before the board is taken away is that loop, and whether it
     is ever scheduled again is the whole question */
  let lastCb = null, after = null;
  const rafOrig = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    lastCb = cb; if (after) after.add(cb);
    return rafOrig.call(window, cb);
  };

  E.setS(E.newGame()); E.applySettings();

  /* ---------- 1 · Reed Slice, left mid-fall ---------- */
  AR.open('hub');
  await until(() => $$('.arcade-card').length > 0, 4000, 'the hall menu');
  AR.startMode('slice');
  await until(() => !!$('#sliceCanvas'), 4000, 'the slice board');
  await sleep(200);
  const before = errors.length;

  // leave the way a screen change leaves it: the stage is emptied under the loop
  const roundLoop = lastCb;
  after = new Set();
  $('#arcade-stage').innerHTML = '';
  await sleep(400);
  assert(errors.length === before,
    `a round whose board is taken away throws nothing (${errors.length - before} error(s))`);
  assert(!!roundLoop && !after.has(roundLoop),
    'and the loop stops itself rather than painting a canvas nobody can see');
  after = null;

  /* ---------- 2 · Seal Match, left between the flip and the match ---------- */
  AR.open('hub');
  await until(() => $$('.arcade-card').length > 0, 4000, 'the hall menu again');
  AR.startMode('match');
  await until(() => $$('#arcade-stage .seal-tile').length > 1, 4000, 'the match board');
  const tiles = $$('#arcade-stage .seal-tile');
  /* Find a genuine pair from the corpus rather than from any marker on the
     tile: a part's face and its meaning are two halves of one seal, and that
     is what the board is dealing. Matching by hand this way also proves the
     board deals real pairs at all. */
  const D = window.__RD_DATA;
  const faceOf = (t) => (t.querySelector('.seal-front') || {}).textContent || '';
  const partner = {};
  Object.keys(D.PARTS).forEach((id) => { const p = D.PARTS[id]; partner[p.text] = p.mean; });
  Object.keys(D.TERMS).forEach((id) => { const t = D.TERMS[id]; if (t.def) partner[id] = t.def; });
  let pair = null;
  tiles.forEach((a) => {
    if (pair) return;
    const want = partner[faceOf(a).trim()];
    if (!want) return;
    const b = tiles.find((x) => x !== a && faceOf(x).trim() === String(want).trim());
    if (b) pair = [a, b];
  });
  const before2 = errors.length;
  if (pair) {
    pair[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    pair[1].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    $('#arcade-stage').innerHTML = '';       // leave inside the 240ms
    await sleep(500);
  }
  assert(!!pair, 'the match board deals real pairs to turn over');
  assert(errors.length === before2,
    `a pair that lands after the board is gone throws nothing (${errors.length - before2} error(s))`);

  /* ---------- 3 · ending a road that is not running ---------- */
  const before3 = errors.length;
  let threw = null;
  try { MI.endEndlessRoad(); } catch (e) { threw = e; }
  assert(!threw && errors.length === before3,
    'ending the Endless Road when no road is running does nothing, rather than throwing');

  window.requestAnimationFrame = rafOrig;
  AR.open('hub');
  await sleep(150);
  summary(errors);
})();
