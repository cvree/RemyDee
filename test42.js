/* test42.js — THE MOTE LAYER.

   The game could lean the camera, light the squad and hit the frame, and all
   three act on the whole picture. Nothing could come OUT of the thing that
   earned it — and half the rewards off the road were still being delivered as
   a shake, which is what damage is. One pass:

     1. ONE CANVAS FOR EVERYTHING THAT FLIES. burst / ring / confetti / fly,
        one pool with a ceiling, one loop that sleeps when the pool is empty.
     2. FOUR SIZES OF GOOD NEWS. celebrate(1..4): a right answer can never be
        as loud as the ending, and the ending can never be as quiet as one.
     3. REDUCED MOTION MEANS NONE OF IT — but a reward that flies somewhere
        still ARRIVES, because the landing is information, not decoration.
     4. THE CAMERA CANNOT BE KILLED MID-MOVE. A screen change during a swell
        used to cancel the loop where it stood: the frame stayed zoomed and
        the game had no camera until it was reloaded.
     5. REWARDS OFF THE ROAD LEAN IN TOO. The seal, the chest, a right answer
        on the Trial and the strike at the Rune Forge all shook the frame.
*/
const fs = require('fs');
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const E = window.__RD_ENG, D = window.__RD_DATA, SC = window.__RD_SCREENS, FX = window.FX;
  assert(E && D && SC && FX, 'modules exposed');
  const src = fs.readFileSync('RemyDee_TheLostLexicon.html', 'utf8');
  const frame = doc.getElementById('frame');
  const drained = () => until(() => FX._motes() === 0, 8000, 'the pool to empty');

  E.setS(E.newGame()); E.applySettings(); SC.showHub();
  await sleep(300);

  /* ================= 1. ONE CANVAS, ONE POOL ================= */
  console.log('\n== everything that flies shares one canvas ==');
  ['burst', 'ring', 'confetti', 'fly', 'punch', 'sheen', 'celebrate'].forEach((fn) =>
    assert(typeof FX[fn] === 'function', `FX.${fn} is exported`));

  await drained();
  const thrown = FX.burst(doc.body, { n: 12 });
  assert(thrown > 0 && FX._motes() === thrown, 'a burst puts its motes in the pool and says how many it threw');
  FX.burst(doc.body, { n: 12 }); FX.ring(doc.body, {}); FX.confetti({ n: 10 });
  assert(doc.querySelectorAll('#fx-motes').length === 1,
    'four effects later there is still exactly one canvas in the frame');
  assert(doc.getElementById('fx-motes').parentNode === frame,
    'and it lives in the frame, so it moves with the camera instead of sliding against it');
  assert(doc.getElementById('fx-motes').getAttribute('aria-hidden') === 'true',
    'a screen reader is not told about a canvas of dots');

  for (let i = 0; i < 60; i++) FX.celebrate(4, doc.body, { still: true });
  assert(FX._motes() <= 560, `sixty of the largest celebration at once stay under the ceiling (${FX._motes()} live)`);
  assert(FX.burst(doc.body, { n: 40 }) === 0, 'and a burst into a full pool is trimmed, not queued');

  assert(await drained(), 'left alone, the pool empties itself — the loop has an end');

  /* ================= 2. FOUR SIZES ================= */
  console.log('\n== good news comes in four sizes, in order ==');
  const sizes = [];
  for (const lv of [1, 2, 3, 4]) {
    await drained();
    FX.celebrate(lv, doc.body, { still: true });
    sizes.push(FX._motes());
  }
  assert(sizes[0] > 0, `a right answer throws something (${sizes[0]})`);
  assert(sizes[0] < sizes[1] && sizes[1] < sizes[2] && sizes[2] < sizes[3],
    `and each size is strictly bigger than the last (${sizes.join(' < ')})`);
  assert(sizes[0] * 4 <= sizes[3], 'the ending is at least four times a right answer — they cannot be mistaken for each other');
  await drained();

  /* ================= 3. REDUCED MOTION ================= */
  console.log('\n== reduced motion means none of it ==');
  FX.setReduced(true);
  const sheensBefore = doc.querySelectorAll('.fx-sheen').length;
  FX.burst(doc.body, { n: 30 }); FX.ring(doc.body, {}); FX.confetti({ n: 40 }); FX.celebrate(4, doc.body);
  assert(FX._motes() === 0, 'nothing is thrown');
  const target = doc.createElement('div'); target.id = 't42-target'; frame.appendChild(target);
  FX.sheen(target); FX.punch(target);
  assert(doc.querySelectorAll('.fx-sheen').length === sheensBefore, 'no light is laid over anything');
  assert(!target.classList.contains('fx-punch'), 'and no counter is punched');
  assert(!frame.style.transform, 'the frame is not moved');
  let arrived = 0;
  FX.fly(doc.body, target, { onArrive: () => arrived++ });
  assert(arrived === 1, 'but a reward that flies somewhere still ARRIVES — immediately, with no flight');
  FX.setReduced(false);

  /* ================= 4. THE REWARD LANDS ON THE NUMBER ================= */
  console.log('\n== a reward goes where it is kept ==');
  let landed = 0;
  FX.fly(doc.body, '#t42-target', { ms: 120, onArrive: () => landed++ });
  assert(FX._motes() > 0, 'the points leave the answer as motes');
  /* the counters on the Trial and the Vigil are re-rendered between the answer
     and the landing; swap the node the way they do */
  target.remove();
  const again = doc.createElement('div'); again.id = 't42-target'; frame.appendChild(again);
  await until(() => landed === 1, 2000, 'the flight to land');
  assert(landed === 1, 'the landing fires once');
  assert(again.classList.contains('fx-punch'),
    'and the punch finds the counter that is on screen NOW, not the node that was there when the answer was given');

  const tally = doc.createElement('div'); frame.appendChild(tally);
  let doneCt = 0;
  FX.countUp(tally, 14, { dur: 80, punch: true, done: () => doneCt++ });
  await until(() => doneCt === 1, 2000, 'the tally to finish');
  assert(tally.textContent === '14' && tally.classList.contains('fx-punch'),
    'a tally that has finished counting says so');
  const flat = doc.createElement('div'); frame.appendChild(flat);
  let flatDone = 0;
  FX.countUp(flat, 0, { dur: 60, punch: true, done: () => flatDone++ });
  await until(() => flatDone === 1, 2000, 'the empty tally to finish');
  assert(!flat.classList.contains('fx-punch'), 'and a tally of nothing does not celebrate nothing');

  /* ================= 5. THE CAMERA RUNS TO REST ================= */
  console.log('\n== a screen change cannot strand the camera ==');
  FX.swell(3, 300);
  await until(() => !!frame.style.transform, 1500, 'the swell to start');
  assert(!!frame.style.transform, 'a swell moves the frame');
  assert(frame.style.willChange === 'transform',
    'and the frame is promoted for the duration, so the picture is scaled rather than re-drawn every frame');
  FX.cleanup();                       // what every screen change does
  await until(() => !frame.style.transform, 2500, 'the camera to settle');
  assert(!frame.style.transform,
    'a screen change mid-swell no longer leaves the frame zoomed — the camera runs to rest on its own loop');
  assert(!frame.style.willChange, 'and it gives the layer back when it gets there');
  FX.swell(2, 200);
  await until(() => !!frame.style.transform, 1500, 'the next swell');
  assert(!!frame.style.transform, 'and the camera still works afterwards — it used to be dead for the rest of the session');
  FX.shake(8, 150);
  await until(() => !frame.style.transform, 2500, 'the camera to settle again');
  assert(!frame.style.transform, 'shake and swell together still come to rest');

  /* ================= 6. BUTTONS SPARK ON THE CANVAS ================= */
  console.log('\n== the commonest effect makes no DOM ==');
  await drained();
  FX.bindClickSpark();
  const btn = doc.createElement('button'); frame.appendChild(btn);
  const nodesBefore = frame.querySelectorAll('*').length;
  btn.dispatchEvent(new window.PointerEvent('pointerdown', { clientX: 40, clientY: 40, bubbles: true }));
  assert(FX._motes() > 0, 'pressing a button throws ink');
  assert(frame.querySelectorAll('*').length === nodesBefore,
    'and adds no elements to the document — it used to be seven per press');
  assert(!/\.spark\{/.test(src) && !/\.fg-spark\{/.test(src),
    'the two DOM spark rules are gone with the nodes they styled');

  /* ================= 7. THE SEAL IS A REWARD ================= */
  console.log('\n== the bench leans in ==');
  const fnBody = (name) => {
    const a = src.indexOf('function ' + name + '(');
    const b = src.indexOf('\nfunction ', a + 10);
    return a < 0 ? '' : src.slice(a, b);
  };
  const seal = fnBody('onBuildSuccess');
  assert(seal.length > 200, 'found the seal');
  assert(!/FX\.shake\(/.test(seal), 'sealing a word does not shake the frame');
  assert(!/FX\.impact\("#b5322b"/.test(seal), 'and is not washed in the colour of a wound');
  assert(/FX\.swell\(/.test(seal) && /FX\.burst\(/.test(seal) && /FX\.ring\(/.test(seal),
    'it leans in, and the light comes out of the word');
  assert(!/FX\.inkBloom\(/.test(seal), 'and no disc of ink is laid over the word the player just got right');
  assert(!/FX\.shake\(8\+heft\*3/.test(src), 'the chest does not open as a hit that grows with its rarity');
  assert(!/FX\.shake\(fast\?5:3/.test(src), 'a right answer on the Daily Trial does not shake');
  assert(!/FX\.shake\(5\+Math\.min\(7,G\.streak\)/.test(src), 'nor does the strike at the Rune Forge');
  assert(!/hits>=5\) FX\.shake/.test(src), 'nor the Mastery Rush, whose shake grew with every right answer');

  // and played for real: name a term at the bench and watch what comes off it
  const tid = Object.keys(D.TRAVELERS).find((k) => D.TRAVELERS[k].tier === 1 && D.TERMS[D.TRAVELERS[k].term]);
  E.setFlow({ chapter: D.CHAPTERS[3], builders: [tid], members: [tid], idx: 0,
    results: {}, forged: [], route: null, stats: {} });
  SC.openBuilder();
  await until(() => {
    const b = SC._builderState();
    return b && b.term === D.TRAVELERS[tid].term && doc.querySelectorAll('#tray .tile').length === b.trayIds.length;
  }, 4000, 'the builder');
  await drained();
  D.TERMS[SC._builderState().term].build.forEach((id) => {
    const t = doc.querySelector(`#tray .tile[data-id="${id}"]`); if (t) t.click();
  });
  await until(() => FX._motes() > 0, 1500, 'the placed piece to answer');
  assert(FX._motes() > 0, 'a piece landing in the assembly throws something');
  await drained();
  doc.getElementById('build-check').click();
  assert(FX._motes() >= 20, `the seal comes down and the word throws light (${FX._motes()} motes)`);
  await until(() => doc.getElementById('reveal').classList.contains('show'), 4000, 'the reveal');
  assert(E.getFlow().results[tid].seal === 'unbroken', 'named first time, unaided');
  /* the wax lands 300ms after the card opens; the punch on the seal row is the
     one part of it that only an Unbroken seal gets */
  const sealRow = doc.getElementById('reveal-seal');
  await until(() => sealRow.classList.contains('fx-punch'), 3000, 'the wax to land');
  assert(sealRow.classList.contains('fx-punch') && FX._motes() >= 20,
    `and an Unbroken seal brings the wreath down on the card (${FX._motes()} motes)`);

  /* ================= 8. THE HUB COUNTS FROM WHAT YOU LAST SAW ================= */
  console.log('\n== coming home with more is news ==');
  doc.getElementById('reveal').classList.remove('show');
  SC.showHub(); await sleep(250);
  const seen = window.__RD_HUBSEEN;
  assert(seen && seen.rep === E.S().rep && seen.coin === E.S().coin, 'the hub remembers the figures it showed');
  E.S().coin += 14;
  SC.showHub();
  await until(() => doc.getElementById('hub-coin').textContent === String(E.S().coin), 3000, 'the ink to count up');
  assert(doc.getElementById('hub-coin').textContent === String(E.S().coin), 'the ink arrives at the right total');
  await until(() => doc.getElementById('hub-coin').classList.contains('fx-punch'), 1500, 'the punch');
  assert(doc.getElementById('hub-coin').classList.contains('fx-punch'), 'and a figure that grew says so when it lands');

  await drained();
  assert(!frame.style.transform, 'the frame is at rest at the end of all of it');
  summary(errors);
})();
