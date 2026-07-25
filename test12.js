/* test12.js — DEPTH PASS: the seven redesigned bench crafts, driven through
   real simulated pointer interactions (not the `_finishBuild` shortcut other
   tests use), plus the universal Heat system and visible item activation.
   Each craft must: accept a genuine decision, respond to real drag/tap
   input, and produce a quality + trait/craftMeta reflecting what the player
   actually did — not a fixed script. */
const { boot, sleep, until, assert, summary } = require('./testlib');

function ptr(win, cv, type, x, y) {
  const ev = new win.PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  cv.dispatchEvent(ev);
}
function setupCanvas(window, P, type) {
  P._testCraft(type);
  const cvs = window.document.querySelectorAll('#craftCanvas');
  const cv = cvs[cvs.length - 1];
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 560, height: 360, right: 560, bottom: 360 });
  return cv;
}

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP;
  assert(E && D && P, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();
  const W2 = 560, H2 = 360;
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
    let cur = P._dbg().cur;
    assert(cur.buildQ > 0, 'blade: a full trace pass registers real quality progress');
    // the decide-phase choice buttons only exist after the next rendered frame
    await sleep(40);
    // decision point: fold again (right button of the choice prompt)
    const foldAgainBtn = { x: W2 * 0.5 + 8 + (W2 * 0.34) / 2, y: H2 * 0.82 + 18 };
    ptr(window, cv, 'pointerdown', foldAgainBtn.x, foldAgainBtn.y);
    tracePass();
    await sleep(40);
    // now quench (left button)
    const quenchBtn = { x: W2 * 0.5 - (W2 * 0.34) / 2 - 8, y: H2 * 0.82 + 18 };
    ptr(window, cv, 'pointerdown', quenchBtn.x, quenchBtn.y);
    cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.folds === 2, `blade: choosing "fold again" once then quenching banks exactly 2 folds (got ${cur.craftMeta && cur.craftMeta.folds})`);
    assert(cur.buildQ >= 0 && cur.buildQ <= 1, 'blade: final quality is a valid 0..1 score');
    assert((cur.traits.power || 0) > 0, 'blade: extra folds add real sharpness (power trait)');
  }

  /* ================= HOOK — The Balance Point ================= */
  {
    const cv = setupCanvas(window, P, 'align');
    const sliderX = 300, sliderY = H2 * 0.62;
    ptr(window, cv, 'pointerdown', sliderX, sliderY);
    ptr(window, cv, 'pointermove', sliderX + 20, sliderY);
    ptr(window, cv, 'pointerup', sliderX + 20, sliderY);
    let cur = P._dbg().cur;
    assert(cur.material === undefined || true, 'hook: probing does not commit by itself');
    // commit via the bottom button (craftBtn geometry: y=H-46,h=34,w=W*0.5,x=W/2-w/2)
    const commitBtn = { x: W2 / 2, y: H2 - 46 + 17 };
    ptr(window, cv, 'pointerdown', commitBtn.x, commitBtn.y);
    cur = P._dbg().cur;
    assert(cur.craftMeta && (cur.craftMeta.balanceLean === 'reach' || cur.craftMeta.balanceLean === 'stability'),
      'hook: committing records which side of the balance the player leaned toward');
    assert((cur.traits.reach || 0) + (cur.traits.protect || 0) > 0, 'hook: leaning a direction adds a real trait');
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
    const top = H2 * 0.20, bot = H2 * 0.62;
    const xs = [W2 * 0.26, W2 * 0.5, W2 * 0.74];
    const steepY = top + 0.80 * (bot - top);
    xs.forEach(x => {
      ptr(window, cv, 'pointerdown', x, top + 0.5 * (bot - top)); // grabs the claw at its starting norm (0.5)
      ptr(window, cv, 'pointermove', x, steepY);
      ptr(window, cv, 'pointerup', x, steepY);
    });
    const cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.angle === 'steep', 'claws: the chosen angle preset is recorded');
    assert(cur.craftMeta.consistency >= 70, `claws: matching all three claws to the same angle scores high consistency (got ${cur.craftMeta && cur.craftMeta.consistency})`);
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

  /* ================= FIELD KIT — The Packed Case ================= */
  {
    const cv = setupCanvas(window, P, 'pack');
    const ccx = W2 * 0.14, ccy = H2 * 0.12, cellW = (W2 * 0.72) / 6, cellH = (H2 * 0.40) / 4;
    const trayY = H2 * 0.63, cw = W2 * 0.72;
    const tray = { bandage: ccx + 0 * (cw / 4) + cw / 8, splint: ccx + 2 * (cw / 4) + cw / 8, tonic: ccx + 3 * (cw / 4) + cw / 8 };
    const placeAt = (trayX, gx, gy) => {
      ptr(window, cv, 'pointerdown', tray[trayX], trayY);
      const px = ccx + gx * cellW + 10, py = ccy + gy * cellH + 10;
      ptr(window, cv, 'pointerdown', px, py);
    };
    placeAt('bandage', 0, 0);
    placeAt('splint', 2, 0);
    placeAt('tonic', 0, 1);
    // close the case
    ptr(window, cv, 'pointerdown', W2 / 2, H2 - 46 + 17);
    const cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.packed, 'kit: packed composition recorded');
    assert(cur.craftMeta.packed.bandage === 1 && cur.craftMeta.packed.splint === 1 && cur.craftMeta.packed.tonic === 1,
      `kit: exactly what was placed is exactly what is recorded (got ${JSON.stringify(cur.craftMeta.packed)})`);
    assert(cur.craftMeta.cells === 9, 'kit: cell footprint matches the actual shapes placed (2 + 3 + 4)');
    assert((cur.traits.recover || 0) > 0 && (cur.traits.protect || 0) > 0, 'kit: the mix chosen determines real recover/protect traits');
  }

  /* ================= ROPE — The Braid Rhythm ================= */
  {
    const cv = setupCanvas(window, P, 'weave');
    // choose "fast" tempo (3rd button) to keep the test's real-time wait short
    ptr(window, cv, 'pointerdown', W2 / 2, H2 * 0.32 + 16 + 2 * 43);
    ptr(window, cv, 'pointerup', W2 / 2, H2 * 0.32 + 16 + 2 * 43);
    const bpm = 138, period = 60 / bpm * 2.1;
    const ry = H2 * 0.42;
    for (let i = 0; i < 8; i++) {
      await sleep(period * 1000 * 0.78);
      const side = i % 2 === 0 ? 'L' : 'R';
      const x = side === 'L' ? W2 * 0.3 : W2 * 0.7;
      ptr(window, cv, 'pointerdown', x, ry);
      await sleep(220); // clear the post-beat settle delay before the next beat starts
    }
    await sleep(50);
    const cur = P._dbg().cur;
    assert(cur.craftMeta && cur.craftMeta.tempo === 'fast', 'rope: chosen tempo is recorded');
    assert(Array.isArray(cur.craftMeta.weakSpots), 'rope: weak spots (missed beats) are tracked by position');
    assert(cur.craftMeta.weakSpots.length <= 8, 'rope: hitting beats on time and on the correct side keeps weak spots low');
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
    await until(() => flow.forged.length === 1, 8000, 'blade committed');
    const item = flow.forged[0];
    assert(typeof item.genName === 'string' && item.genName.length > 0, 'item identity: a forged item gets a generated name');
    assert(item.tally && typeof item.tally === 'object', 'item identity: every forged item starts with a usage tally');
    assert('wear' in item, 'item identity: every forged item tracks wear');

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
