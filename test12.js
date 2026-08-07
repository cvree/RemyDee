/* test12.js — THE SEVEN BENCH CRAFTS, driven through real simulated pointer
   interactions (not the `_finishBuild` shortcut other tests use), plus the
   universal Heat system and visible item activation.
   Each craft must: accept a genuine decision, respond to real drag/tap input,
   and produce a quality + trait/craftMeta reflecting what the player actually
   did — not a fixed script.

   Updated for the MAKER'S PASS: crafts now lay out against craftH(cv) (the
   canvas minus the scrap apron), grade themselves through the live rubric
   rather than by calling setCraftQ from the input handler, and two of them
   changed interaction model outright — the hook is probed rather than
   scrubbed, and each rope beat is a strike AND a hold. */
const { boot, sleep, until, assert, summary } = require('./testlib');

function ptr(win, cv, type, x, y) {
  const ev = new win.PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  cv.dispatchEvent(ev);
}
const CV_H = 360 + 54;   // work area + scrap apron (must match APRON in the game)
function setupCanvas(window, P, type) {
  P._testCraft(type);
  const cvs = window.document.querySelectorAll('#craftCanvas');
  const cv = cvs[cvs.length - 1];
  // rect height MUST equal cv.height, or bindPointer's sy scale factor silently
  // shifts every simulated y coordinate off the control it was aimed at
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 560, height: CV_H, right: 560, bottom: CV_H });
  return cv;
}

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP;
  assert(E && D && P, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();
  const W2 = 560, H2 = 360;   // H2 is the WORK area — craftH(cv), i.e. cv.height - APRON
  // a benign placeholder flow so each craft's real (delayed, ~620ms) finishBuild→stepTest
  // callback has somewhere valid to commit into, instead of crashing on a null flow
  E.setFlow({ chapter: D.CHAPTERS[0], builders: [], members: D.CHAPTERS[0].members.slice(0, 1), idx: 0, results: {}, forged: [], route: null, stats: {} });

  /* ================= BLADE — The Folding Edge ================= */
  {
    const cv = setupCanvas(window, P, 'trace');
    const guidePt = (i) => ({ x: W2 * 0.12 + (i / 48) * W2 * 0.76, y: H2 * 0.52 - Math.sin((i / 48) * Math.PI) * H2 * 0.30 });
    const tracePass = () => {
      const p0 = guidePt(0);
      ptr(window, cv, 'pointerdown', p0.x, p0.y);
      for (let i = 1; i <= 48; i++) { const p = guidePt(i); ptr(window, cv, 'pointermove', p.x, p.y); }
      ptr(window, cv, 'pointerup', guidePt(48).x, guidePt(48).y);
    };
    tracePass();
    // the rubric grades on the next rendered frame (craftPulse), and the decide-phase
    // choice buttons are laid out in that same frame
    await sleep(40);
    let cur = P._dbg().cur;
    assert(cur.buildQ > 0, 'blade: a full trace pass registers real quality progress');
    const rub0 = P._craftRub();
    assert(rub0 && rub0.defs.length === 3, 'blade: the craft declares a three-row rubric');
    assert(rub0.defs.some(d => d.k === 'line') && rub0.defs.some(d => d.k === 'edge') && rub0.defs.some(d => d.k === 'temper'),
      'blade: the rubric rows are the named ones (line / edge / temper)');
    assert(rub0.v.line > 0, 'blade: tracing the channel raises the Line row specifically');
    // decision point: fold again (right button of the choice prompt)
    // craftChoice draws its buttons ABOVE craftLabel's two lines (H-30 / H-12) so
    // the sentence explaining the choice is not hidden underneath them
    const foldAgainBtn = { x: W2 * 0.5 + 8 + (W2 * 0.34) / 2, y: H2 * 0.66 + 18 };
    ptr(window, cv, 'pointerdown', foldAgainBtn.x, foldAgainBtn.y);
    tracePass();
    await sleep(40);
    // now quench (left button)
    const quenchBtn = { x: W2 * 0.5 - (W2 * 0.34) / 2 - 8, y: H2 * 0.66 + 18 };
    ptr(window, cv, 'pointerdown', quenchBtn.x, quenchBtn.y);
    cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.folds === 2, `blade: choosing "fold again" once then quenching banks exactly 2 folds (got ${cur.craftMeta && cur.craftMeta.folds})`);
    assert(cur.buildQ >= 0 && cur.buildQ <= 1, 'blade: final quality is a valid 0..1 score');
    assert((cur.traits.power || 0) > 0, 'blade: extra folds add real sharpness (power trait)');
    assert(cur.rubric && cur.rubric.rows.length === 3 && typeof cur.rubric.min === 'number',
      'blade: the finished piece carries a frozen rubric snapshot');
    assert(typeof cur.craftMeta.worstFold === 'number', 'blade: the sloppiest fold is recorded, not just the average');
  }

  /* ================= HOOK — The Balance Point ================= */
  {
    const cv = setupCanvas(window, P, 'align');
    const trackY = H2 * 0.60, tx = W2 * 0.20, tw = W2 * 0.60;
    const atPos = (p) => tx + p * tw;
    // THE PROBE BUDGET. Each tap on the track buys one reading and no more; the
    // beam is silent between probes, so this is triangulation, not a scrub.
    ptr(window, cv, 'pointerdown', atPos(0.25), trackY);
    ptr(window, cv, 'pointerup', atPos(0.25), trackY);
    await sleep(30);
    let rub = P._craftRub();
    assert(rub.defs.some(d => d.k === 'read') && rub.defs.some(d => d.k === 'economy'),
      'hook: the rubric grades both the read and the probe economy');
    assert(rub.v.economy > 0.7, 'hook: one probe spent still leaves the Economy row nearly full');
    for (let i = 0; i < 4; i++) { const px = atPos(0.35 + i * 0.1);
      ptr(window, cv, 'pointerdown', px, trackY); ptr(window, cv, 'pointerup', px, trackY); }
    await sleep(30);
    rub = P._craftRub();
    assert(rub.v.economy < 0.05, 'hook: spending every probe empties the Economy row — information has a price');
    let cur = P._dbg().cur;
    assert(!cur.craftMeta, 'hook: probing does not commit by itself');
    // commit via the bottom button (craftBtn geometry: y=H-46,h=34,w=W*0.5,x=W/2-w/2)
    const commitBtn = { x: W2 / 2, y: H2 - 46 + 17 };
    ptr(window, cv, 'pointerdown', commitBtn.x, commitBtn.y);
    cur = P._dbg().cur;
    assert(cur.craftMeta && (cur.craftMeta.balanceLean === 'reach' || cur.craftMeta.balanceLean === 'stability'),
      'hook: committing records which side of the balance the player leaned toward');
    assert((cur.traits.reach || 0) + (cur.traits.protect || 0) > 0, 'hook: leaning a direction adds a real trait');
    assert(cur.craftMeta.probesUsed === 5, `hook: how many probes it took is recorded (got ${cur.craftMeta.probesUsed})`);
  }

  /* ================= BOW — The Three Draws ================= */
  {
    const cv = setupCanvas(window, P, 'tension');
    const cx = W2 * 0.20, span = W2 * 0.52;
    const drawAxis = (pickCenter, target) => {
      ptr(window, cv, 'pointerdown', pickCenter.x, pickCenter.y);
      ptr(window, cv, 'pointerup', pickCenter.x, pickCenter.y);
      const tx = cx + target * span;
      ptr(window, cv, 'pointerdown', tx, 200);
      ptr(window, cv, 'pointerup', tx, 200);
    };
    // round 1: 3 buttons (power, speed, control) — pick "power" (first). The very first
    // frame's pick buttons are laid out synchronously at setup, so no wait is needed yet.
    drawAxis({ x: W2 / 2 - ((3 * (W2 * 0.24) + 2 * 10) / 2) + (W2 * 0.24) / 2, y: H2 * 0.74 + 16 }, 0.72);
    let cur = P._dbg().cur;
    assert((cur.traits.power || 0) > 0, 'bow: the first draw sets the chosen axis (power)');
    // each subsequent round's pick buttons are laid out on the NEXT rendered frame
    await sleep(40);
    // round 2: 2 remaining buttons — pick the first remaining (speed)
    drawAxis({ x: W2 / 2 - ((2 * (W2 * 0.24) + 10) / 2) + (W2 * 0.24) / 2, y: H2 * 0.74 + 16 }, 0.42);
    await sleep(40);
    // round 3: 1 remaining button (control/accuracy)
    drawAxis({ x: W2 / 2, y: H2 * 0.74 + 16 }, 0.58);
    cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.draws && cur.craftMeta.draws.length === 3, 'bow: three draws recorded, one per axis');
    assert((cur.traits.power || 0) > 0 && (cur.traits.speed || 0) > 0 && (cur.traits.control || 0) > 0,
      'bow: all three traits (power/speed/control) were actually set by the three draws');
    assert(cur.buildQ >= 0 && cur.buildQ <= 1, 'bow: final quality is a valid 0..1 score');
  }

  /* ================= CLAWS — The Bite Angle ================= */
  {
    const cv = setupCanvas(window, P, 'fit');
    // choose "Steep — grip & reach" (first of 3 stacked buttons)
    ptr(window, cv, 'pointerdown', W2 / 2, H2 * 0.30 + 16);
    ptr(window, cv, 'pointerup', W2 / 2, H2 * 0.30 + 16);
    const top = H2 * 0.20, bot = H2 * 0.60;
    const xs = [W2 * 0.26, W2 * 0.5, W2 * 0.74];
    const steepY = top + 0.80 * (bot - top);
    const setClaw = (x) => {
      ptr(window, cv, 'pointerdown', x, top + 0.5 * (bot - top)); // grabs the claw at its starting norm (0.5)
      ptr(window, cv, 'pointermove', x, steepY);
      ptr(window, cv, 'pointerup', x, steepY);
    };
    // THE MARKED CLAW GOES FIRST. Reaching for claw 2 or 3 before the reference
    // exists is refused, because the other two are graded against it.
    setClaw(xs[1]);
    assert(!P._dbg().cur.craftMeta, 'claws: the set cannot be started from the middle claw — the marked one comes first');
    xs.forEach(setClaw);
    const cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.angle === 'steep', 'claws: the chosen angle preset is recorded');
    assert(cur.craftMeta.consistency >= 70, `claws: matching all three claws to the same angle scores high consistency (got ${cur.craftMeta && cur.craftMeta.consistency})`);
    assert(cur.rubric && cur.rubric.rows.some(r => r.k === 'angle') && cur.rubric.rows.some(r => r.k === 'match'),
      'claws: Angle (vs the mark) and Match (vs yourself) are graded as separate rows');
    assert((cur.traits.protect || 0) > 0 && (cur.traits.reach || 0) > 0, 'claws: steep grants both protect and reach');
  }

  /* ================= SMOKE — The Pleat Pattern ================= */
  {
    const cv = setupCanvas(window, P, 'fold');
    // choose "3 pleats" (first of 4 stacked buttons)
    ptr(window, cv, 'pointerdown', W2 / 2, H2 * 0.28 + 16);
    ptr(window, cv, 'pointerup', W2 / 2, H2 * 0.28 + 16);
    await until(() => P._dbg().cur.craftMeta === undefined, 10, 'smoke: choice registered'); // no-op wait tick
    // wait out the show sequence: ~500ms initial + 3×620ms reveals
    await sleep(2500);
    const cx = W2 * 0.5, cy = H2 * 0.44, r = Math.min(W2, H2) * 0.28;
    const pts = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 3); return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }; });
    pts.forEach(p => { ptr(window, cv, 'pointerdown', p.x, p.y); ptr(window, cv, 'pointerup', p.x, p.y); });
    const cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.pleats === 3 && cur.craftMeta.of === 3, 'smoke: pleat count choice is recorded and the full sequence was attempted');
    assert(typeof cur.craftMeta.remembered === 'number' && cur.craftMeta.remembered >= 0 && cur.craftMeta.remembered <= 3, 'smoke: memory accuracy is tracked');
    assert(cur.buildQ >= 0 && cur.buildQ <= 1, 'smoke: final quality is a valid 0..1 score');
  }

  /* ================= FIELD KIT — The Hanging Case ================= */
  {
    /* The case stopped being inventory Tetris, and then it stopped being a pour
       into a painted band — which was worse, because a bar filling itself tells
       your hand nothing. What is left is the one good idea: the case HANGS, it
       swings on its strap with real weight, and every remedy you put in it moves
       it. Take one off the shelf, press above the case, and it falls into
       whichever pocket is under your finger when it lands. Keep it level. */
    const cv = setupCanvas(window, P, 'pack');
    const bw = Math.min(W2 * 0.30, 190), gap = 14, bx0 = W2 / 2 - (bw * 2 + gap) / 2;
    const cardX = (i) => bx0 + i * (bw + gap) + bw / 2;
    const cardY = H2 * 0.60 + 22;
    const dropY = H2 * 0.28;
    const closeY = H2 - 46 + 17;

    const takeAndDrop = async (cardIdx, dropX) => {
      ptr(window, cv, 'pointerdown', cardX(cardIdx), cardY);   // take one off the shelf
      await sleep(40);
      ptr(window, cv, 'pointerdown', dropX, dropY);            // and let it go above the case
      await sleep(560);                                        // it falls, it lands, the case swings
    };

    // load it evenly — left, right, middle — and it should hang close to true
    await takeAndDrop(0, W2 * 0.36);
    await takeAndDrop(1, W2 * 0.64);
    await takeAndDrop(0, W2 * 0.50);
    ptr(window, cv, 'pointerdown', W2 / 2, closeY);            // close the case
    await sleep(60);

    const cur = P._dbg().cur;
    const m = cur.craftMeta || {};
    assert(!!m.packed, 'kit: packed composition recorded');
    const total = Object.keys(m.packed).reduce((a, k) => a + m.packed[k], 0);
    assert(m.cells === 3, `kit: three remedies dropped, three pockets filled (got ${m.cells})`);
    assert(total === m.cells, `kit: what is in the pockets is what is recorded (${total} vs ${m.cells})`);
    assert(typeof m.balance === 'number', 'kit: how level the loaded case hangs is recorded');
    assert(typeof m.broken === 'number', 'kit: what smashed on the bench is recorded');
    assert((cur.traits.recover || 0) + (cur.traits.protect || 0) > 0,
      'kit: the mix chosen determines real recover/protect traits');
    assert(cur.rubric.rows.some(r => r.k === 'balance'),
      'kit: how level it hangs is a graded row, not flavour');
    assert(cur.rubric.rows.some(r => r.k === 'packed'),
      'kit: how much of the case you filled is the other graded row');
    assert(!cur.rubric.rows.some(r => r.k === 'doses'),
      'kit: the pour is gone, and so is the row that graded it');
    assert(cur.buildQ >= 0 && cur.buildQ <= 1, 'kit: final quality is a valid 0..1 score');
    const evenBalance = m.balance;

    /* THE MECHANIC ITSELF. Balance has to be a real consequence of WHERE things
       went, or the whole craft is decoration. Same number of remedies, all piled
       into one outer column, must hang measurably worse than the spread load
       above — otherwise the player's aim never mattered. */
    const cv2 = setupCanvas(window, P, 'pack');
    const takeAndDrop2 = async (i, x) => {
      ptr(window, cv2, 'pointerdown', cardX(i), cardY);
      await sleep(40);
      ptr(window, cv2, 'pointerdown', x, dropY);
      await sleep(560);
    };
    await takeAndDrop2(0, W2 * 0.30);
    await takeAndDrop2(1, W2 * 0.30);
    ptr(window, cv2, 'pointerdown', W2 / 2, closeY);
    await sleep(60);
    const lop = (P._dbg().cur.craftMeta || {}).balance;
    assert(typeof lop === 'number' && lop < evenBalance,
      `kit: a case loaded all down one side hangs worse than an even one (${lop}% vs ${evenBalance}%)`);
  }

  /* ================= ROPE — The Braid Rhythm ================= */
  {
    const cv = setupCanvas(window, P, 'weave');
    // choose "fast" tempo (3rd button) to keep the test's real-time wait short
    ptr(window, cv, 'pointerdown', W2 / 2, H2 * 0.32 + 16 + 2 * 43);
    ptr(window, cv, 'pointerup', W2 / 2, H2 * 0.32 + 16 + 2 * 43);
    const bpm = 138, period = 60 / bpm * 2.1, seat = 0.24;   // fast tempo's seat window
    const ry = H2 * 0.42;
    // STRIKE, THEN SEAT. Each beat is a pointerdown on the beat followed by a hold
    // of roughly `seat` seconds before release — releasing early leaves the strand
    // loose, holding on overworks the fibre, and both are graded separately.
    for (let i = 0; i < 8; i++) {
      await sleep(period * 1000 * 0.78);
      const side = i % 2 === 0 ? 'L' : 'R';
      const x = side === 'L' ? W2 * 0.3 : W2 * 0.7;
      ptr(window, cv, 'pointerdown', x, ry);
      await sleep(seat * 1000);          // hold to seat the strand
      ptr(window, cv, 'pointerup', x, ry);
      await sleep(220); // clear the post-beat settle delay before the next beat starts
    }
    await sleep(50);
    const cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.tempo === 'fast', 'rope: chosen tempo is recorded');
    assert(Array.isArray(cur.craftMeta.weakSpots), 'rope: weak spots (missed beats) are tracked by position');
    assert(cur.craftMeta.weakSpots.length <= 8, 'rope: hitting beats on time and on the correct side keeps weak spots low');
    assert(Array.isArray(cur.craftMeta.looseSpots), 'rope: badly seated strands are tracked separately from missed ones');
    assert(cur.craftMeta.weakSpots.length <= 2,
      `rope: striking on the beat on the right side keeps the rope nearly scar-free (got ${cur.craftMeta.weakSpots.length})`);
    assert(cur.buildQ >= 0 && cur.buildQ <= 1, 'rope: final quality is a valid 0..1 score');
  }

  /* ================= UNIVERSAL HEAT ================= */
  {
    setupCanvas(window, P, 'trace');
    const h0 = P._heat();
    assert(h0 && h0.v >= 0 && h0.v <= 1, 'heat: a fresh craft starts with a valid heat value');
    const startV = h0.v;
    for (let i = 0; i < 20; i++) P._heatTick(true, 60); // simulate 20 active frames
    assert(P._heat().v > startV, 'heat: rises while the player is actively working');
    const hotV = P._heat().v;
    for (let i = 0; i < 20; i++) P._heatTick(false, 60); // simulate 20 idle frames
    assert(P._heat().v < hotV, 'heat: cools while the player pauses — pausing is a real, valid choice');
  }

  /* ================= VISIBLE ITEM ACTIVATION ================= */
  // let any straggling delayed finishBuild→stepTest callbacks from earlier crafts
  // resolve against the benign placeholder flow before switching to the real one
  await sleep(800);
  {
    const ch = D.CHAPTERS[1];
    E.S().unlockedBps = ['kit', 'blade', 'hook', 'smoke', 'rope', 'claws', 'bow'];
    const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
    E.setFlow(flow);
    P.openForge();
    await until(() => P._commission().step === 'commission', 6000, 'commission board for item-identity test');
    P._pickBlueprint('blade');
    P._forceDecode(true);
    P._pickMaterial(0);
    P._finishBuild(0.95);
    // this blade's dominant axis is power (heavy tempered edge material) — "hyper-"
    // ("above, excessive") is a genuine semantic match for a hard-hitting blade
    await until(() => P._pickMark('hyper'), 8000, 'maker\'s mark offered and a matching part stamped');
    await until(() => flow.forged.length === 1, 8000, 'blade committed');
    const item = flow.forged[0];
    assert(typeof item.genName === 'string' && item.genName.length > 0, 'item identity: a forged item gets a generated name');
    assert(item.tally && typeof item.tally === 'object', 'item identity: every forged item starts with a usage tally');
    assert('wear' in item, 'item identity: every forged item tracks wear');
    assert(item.makerMark && item.makerMark.partId === 'hyper' && item.makerMark.matched === true,
      'maker\'s marks: a semantically matching part is recorded as a true match');
    assert(item.traits.power > 4, `maker's marks: a true match grants a real trait bonus on top of the craft (power=${item.traits.power})`);

    // now put it to work on the road and confirm the SPECIFIC item is credited
    const MI = window.__RD_MISSION;
    flow.roadPlan = MI.buildRoadPlan(flow);
    P._depart();
    await until(() => !!MI._state(), 6000, 'mission start for item-identity test');
    const forge = MI._state().forge;
    assert(forge.itemFor && forge.itemFor.cut && forge.itemFor.cut.id === item.id, 'item identity: the road credits the EXACT forged item for its capability, not a generic passive');
  }

  summary(errors);
})();
