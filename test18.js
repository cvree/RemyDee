/* test18.js — THE MAKER'S PASS.

   Five claims, one per section:
     1. THE RUBRIC — every craft grades itself on three NAMED rows, live, and the
        grade is gated on the weakest of them rather than a flattering average.
     2. THE MASTERWORK GATE — a perfect piece needs every row clear, an uncracked
        piece, AND a clean decode. Any one of those missing denies it.
     3. THE SCRAP APRON — breakable offcuts below the work area vent heat when
        smashed, and never leak a tap into the craft underneath.
     4. THE SPEC — how a piece was built reaches the road: folds set the strike
        corridor, pleats set the phase window, a scarred rope really can slip.
     5. NO ZOMBIE BENCHES — starting a craft retires the previous one's render
        loop, so a stale piece can never overwrite the live piece's grade. */
const { boot, sleep, until, assert, summary } = require('./testlib');

const APRON = 54, WORK_H = 360, CV_H = WORK_H + APRON;

function ptr(win, cv, type, x, y) {
  cv.dispatchEvent(new win.PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }));
}
function setupCanvas(window, P, type) {
  P._testCraft(type);
  const cvs = window.document.querySelectorAll('#craftCanvas');
  const cv = cvs[cvs.length - 1];
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 560, height: CV_H, right: 560, bottom: CV_H });
  return cv;
}
/* drive a craft's rubric straight to a chosen value per row — the grade gate is
   what is under test here, not the seven ways of earning the numbers */
function forceRub(P, val) {
  const r = P._craftRub();
  r.defs.forEach(d => { r.v[d.k] = val; });
  return r;
}

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP;
  assert(E && D && P, 'modules exposed');
  assert(typeof P.craftSpec === 'function', 'the bench exports craftSpec — the road can ask HOW a piece was built');
  const S = E.newGame(); E.setS(S); E.applySettings();
  const W2 = 560, H2 = WORK_H;
  E.setFlow({ chapter: D.CHAPTERS[0], builders: [], members: D.CHAPTERS[0].members.slice(0, 1), idx: 0, results: {}, forged: [], route: null, stats: {} });

  /* ================= 1. THE RUBRIC ================= */
  {
    const CRAFTS = ['trace', 'align', 'tension', 'fold', 'fit', 'pack', 'weave'];
    for (const type of CRAFTS) {
      setupCanvas(window, P, type);
      await sleep(30);
      const r = P._craftRub();
      assert(r && r.defs.length === 3, `${type}: declares exactly three graded rows`);
      assert(r.defs.every(d => d.label && d.hint), `${type}: every row is NAMED and explains itself`);
      assert(r.defs.some(d => d.k === 'temper'), `${type}: heat discipline is one of the graded rows`);
      const wsum = r.defs.reduce((a, d) => a + d.w, 0);
      assert(Math.abs(wsum - 1) < 1e-6, `${type}: row weights are normalised (sum=${wsum})`);
    }
  }
  {
    // THE WEAKEST-LINK RULE. Two pieces with the same average must NOT grade the
    // same when one of them has a weak row — that asymmetry is the whole reason
    // a perfect piece takes tact instead of persistence.
    setupCanvas(window, P, 'trace');
    await sleep(30);
    const r = P._craftRub();
    const keys = r.defs.map(d => d.k);
    r.defs.forEach(d => { r.v[d.k] = 0.75; });
    const even = P._rubBuildScore();
    // same weighted mean, redistributed into one strong row and one weak one
    r.v[keys[0]] = 0.75 + 0.25 * (r.defs[1].w / r.defs[0].w);
    r.v[keys[1]] = 0.50;
    r.v[keys[2]] = 0.75;
    const lopsided = P._rubBuildScore();
    assert(lopsided < even,
      `the weakest row drags the piece: lopsided ${lopsided.toFixed(3)} scores below even ${even.toFixed(3)} at the same average`);
    forceRub(P, 0.95);
    assert(P._rubBuildScore() > 0.9, 'every row high grades high');
  }

  /* ================= 2. THE MASTERWORK GATE ================= */
  {
    setupCanvas(window, P, 'fit');
    await sleep(30);
    const bar = P._masterBar();
    assert(bar > 0.7 && bar <= 0.95, `the masterwork bar is a real, stated threshold (${bar})`);

    forceRub(P, bar + 0.01);
    assert(P._rubIsMaster(), 'every row above the bar = masterwork work');

    // one weak row is enough to deny it, however good the rest are
    const r = P._craftRub();
    r.v[r.defs[1].k] = bar - 0.05;
    assert(!P._rubIsMaster(), 'a single row below the bar denies the masterwork — an average cannot buy it');

    // a cracked piece can never be perfect, no matter how clean the rows are
    forceRub(P, 0.99);
    assert(P._rubIsMaster(), 'all rows at 99% qualifies');
    P._craftHeat().cracked = true;
    assert(!P._rubIsMaster(), 'a cracked piece can never be a masterwork, whatever the rows say');
    P._craftHeat().cracked = false;
  }
  {
    // AND THE DECODE HAS TO BE CLEAN. This is the clause that keeps the game a
    // vocabulary game: you cannot hammer your way to a perfect tool without
    // having understood the term it was commissioned against.
    const ch = D.CHAPTERS[1];
    E.S().unlockedBps = ['kit', 'blade', 'hook', 'smoke', 'rope', 'claws', 'bow'];

    const runOne = async (decodeOk, rubVal) => {
      const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
      E.setFlow(flow);
      P.openForge();
      await until(() => P._commission().step === 'commission', 6000, 'commission board');
      P._pickBlueprint('blade');
      P._forceDecode(decodeOk);
      P._pickMaterial(0);
      await sleep(30);
      forceRub(P, rubVal);
      P._finishBuild(P._rubBuildScore());
      await until(() => !!P._dbg().cur.qtier, 6000, 'test step graded the piece');
      return P._dbg().cur;
    };

    const perfect = await runOne(true, 0.99);
    assert(perfect.qtier === 'masterwork',
      `a clean decode + every row clear ships a MASTERWORK (got ${perfect.qtier} at q=${perfect.finalQ})`);
    assert(perfect.rubric && perfect.rubric.master, 'the masterwork carries a rubric snapshot that says so');

    const sloppyWord = await runOne(false, 0.99);
    assert(sloppyWord.qtier !== 'masterwork',
      `a flawless BUILD with a fumbled decode is not a masterwork (got ${sloppyWord.qtier})`);

    const sloppyHands = await runOne(true, 0.62);
    assert(sloppyHands.qtier !== 'masterwork',
      `a clean decode with mediocre hands is not a masterwork either (got ${sloppyHands.qtier})`);

    // the grade is not cosmetic: a masterwork's traits are scaled harder than a fine one's
    assert(perfect.scaledTraits.power > sloppyHands.scaledTraits.power,
      'masterwork traits genuinely outscale a lesser build of the same blueprint');
  }

  /* ================= 3. THE SCRAP APRON ================= */
  {
    const cv = setupCanvas(window, P, 'trace');
    const scrap = P._craftScrap();
    assert(scrap && scrap.items.length >= 4, `the apron spawns breakable offcuts (${scrap && scrap.items.length})`);
    assert(P.APRON === APRON, `the apron height the test assumes matches the game (${P.APRON})`);
    assert(scrap.items.every(it => it.y > WORK_H),
      'every piece of scrap sits BELOW the work area — it can never overlap the craft');
    assert(cv.height === CV_H, `the canvas reserves the apron on top of the work area (${cv.height})`);

    // smashing scrap vents heat — the active alternative to standing still
    const heat = P._craftHeat();
    heat.v = 0.90;
    const before = heat.v;
    const target = scrap.items.find(i => i.hp > 0);
    assert(P._scrapTap(cv, target.x, target.y), 'a tap on the apron is consumed by the apron');
    assert(target.hp === 1, 'the first hit cracks the piece rather than destroying it');
    assert(P._craftHeat().v === before, 'a cracked-but-whole piece has not vented heat yet');
    P._scrapTap(cv, target.x, target.y);
    assert(target.hp === 0, 'the second hit breaks it');
    assert(P._craftHeat().v < before,
      `smashing scrap vents real heat (${before.toFixed(3)} → ${P._craftHeat().v.toFixed(3)})`);
    assert(scrap.smashed === 1, 'smashed scrap is counted');

    // a tap in the apron must never also register as a stroke on the piece
    const rub = P._craftRub();
    rub.defs.forEach(d => { rub.v[d.k] = 0; });
    ptr(window, cv, 'pointerdown', 20, WORK_H + APRON / 2);
    ptr(window, cv, 'pointermove', 300, WORK_H + APRON / 2);
    ptr(window, cv, 'pointerup', 300, WORK_H + APRON / 2);
    await sleep(30);
    assert(P._craftRub().v.line === 0,
      'dragging across the apron leaves no mark on the blade — the smash never leaks into the craft');

    // and heat discipline is a measured share of working time, not a guess
    const h = P._craftHeat();
    h.activeT = 10; h.inBandT = 9; h.cracked = false;
    assert(Math.abs(P._heatTemper() - 0.9) < 0.02, 'Temper is the measured share of working time spent in the band');
    h.cracked = true;
    assert(P._heatTemper() <= 0.42, 'a crack caps Temper hard, so the row can never be starred after one');
  }
  {
    /* THE CLOCK STARTS ON THE FIRST STROKE. Every craft opens on something to
       read — an angle to pick, a tempo to choose, a guide to look at — and heat
       used to bleed away underneath all of it, so the player was charged Temper
       for a warm-up they had no way to skip and began the real work cold. */
    setupCanvas(window, P, 'weave');   // opens on a tempo choice, so nothing is actionable
    const h = P._craftHeat();
    assert(h.started === false, 'a fresh bench has not started its heat clock');
    const opening = h.v;
    assert(opening >= h.band[0] && opening <= h.band[1],
      `the piece comes off the coals already workable (v=${opening}, band=${h.band.map(x => x.toFixed(2))})`);
    await sleep(140);   // several frames of sitting on the choice screen
    assert(P._craftHeat().v === opening, 'heat does not drain while the player is reading a choice screen');
    assert(P._craftHeat().activeT === 0, 'and none of that counts as working time');

    // once working, it moves in both directions again
    P._heatTick(true, false);
    assert(P._craftHeat().started === true, 'the first stroke starts the clock');
    for (let i = 0; i < 12; i++) P._heatTick(true, 60);
    assert(P._craftHeat().v > opening, 'working heats the piece');
    const hot = P._craftHeat().v;
    for (let i = 0; i < 12; i++) P._heatTick(false, 60);
    assert(P._craftHeat().v < hot, 'pausing mid-work still cools it — the strategic pause survives');
    // ...but a frozen beat is neither
    const held = P._craftHeat().v;
    for (let i = 0; i < 12; i++) P._heatTick(false, 60, true);
    assert(P._craftHeat().v === held, 'a frozen beat (watching a fold order play back) neither heats nor cools');
  }

  /* ================= 4. THE SPEC REACHES THE ROAD ================= */
  {
    const spec = P.craftSpec;

    // BLADE — how many times you folded it sets how much road a Strike sweeps
    const thin = spec({ craft: 'trace', qtier: 'fine', craftMeta: { folds: 1 } });
    const razor = spec({ craft: 'trace', qtier: 'fine', craftMeta: { folds: 5 } });
    assert(razor.strikeSpan > thin.strikeSpan,
      `five folds sweeps more road than one (${thin.strikeSpan.toFixed(3)} → ${razor.strikeSpan.toFixed(3)})`);
    assert(razor.momentumFloor > thin.momentumFloor, 'more folds hold momentum higher');
    assert(razor.notes.length > 0 && /5/.test(razor.notes[0].txt), 'the spec sheet names the fold count in plain language');

    // SMOKE — pleats set the phase window, and a mis-remembered pleat really leaks
    const dense = spec({ craft: 'fold', qtier: 'fine', craftMeta: { pleats: 6, leaks: 0 } });
    const light = spec({ craft: 'fold', qtier: 'fine', craftMeta: { pleats: 3, leaks: 0 } });
    const leaky = spec({ craft: 'fold', qtier: 'fine', craftMeta: { pleats: 6, leaks: 2 } });
    assert(dense.phaseSec > light.phaseSec, `six pleats hold smoke longer than three (${light.phaseSec.toFixed(2)} → ${dense.phaseSec.toFixed(2)})`);
    assert(leaky.phaseSec < dense.phaseSec, 'pleats folded out of order shorten the phase window — the leak is real');

    // ROPE — weakSpots was recorded and never read by anything. Now it bites.
    const clean = spec({ craft: 'weave', qtier: 'fine', craftMeta: { tempo: 'fast', weakSpots: [], looseSpots: [] } });
    const scarred = spec({ craft: 'weave', qtier: 'fine', craftMeta: { tempo: 'fast', weakSpots: [2, 5], looseSpots: [1] } });
    assert(clean.slipChance === 0, 'a rope braided without a missed beat cannot slip');
    assert(scarred.slipChance > 0.2, `a scarred rope carries a real slip chance (${scarred.slipChance.toFixed(2)})`);
    assert(spec({ craft: 'weave', qtier: 'masterwork', craftMeta: { tempo: 'fast', weakSpots: [2, 5], looseSpots: [] } }).slipChance === 0,
      'a masterwork removes the failure mode entirely, not just softens it');
    assert(spec({ craft: 'weave', qtier: 'flawed', craftMeta: { tempo: 'slow', weakSpots: [], looseSpots: [] } }).slipChance > 0,
      'a flawed piece can fail outright even with a clean braid');

    // BOW — which draw you gave your steadiest hand to changes what Strike does
    const pow = spec({ craft: 'tension', qtier: 'fine', craftMeta: { bestDraw: 'power' } });
    const acc = spec({ craft: 'tension', qtier: 'fine', craftMeta: { bestDraw: 'control' } });
    const fast = spec({ craft: 'tension', qtier: 'fine', craftMeta: { bestDraw: 'speed' } });
    assert(pow.strikeSpan > acc.strikeSpan, 'a power bow clears more road');
    assert(acc.strikeMomentum > 0, 'an accuracy bow surges momentum on every Strike');
    assert(fast.extraStrike >= 1, 'a speed bow earns an extra Strike charge');

    // CLAWS — the bite angle buys grip or ledge speed, and a mismatched set skates
    const steep = spec({ craft: 'fit', qtier: 'fine', craftMeta: { angle: 'steep', consistency: 95 } });
    const shallow = spec({ craft: 'fit', qtier: 'fine', craftMeta: { angle: 'shallow', consistency: 95 } });
    assert(steep.hazardShrug > shallow.hazardShrug, 'a steep bite buys hazard resistance');
    assert(shallow.ledgeSpeed > steep.ledgeSpeed, 'a shallow bite buys ledge speed');
    assert(spec({ craft: 'fit', qtier: 'fine', craftMeta: { angle: 'steep', consistency: 30 } }).slipChance > 0,
      'three claws that disagree with each other can skate on a climb');

    // HOOK — which side of the balance you committed to changes the road
    const reach = spec({ craft: 'align', qtier: 'fine', craftMeta: { balanceLean: 'reach', balanceRead: 95, probesUsed: 2 } });
    const stable = spec({ craft: 'align', qtier: 'fine', craftMeta: { balanceLean: 'stability', balanceRead: 95, probesUsed: 2 } });
    assert(reach.gateLeadMult > 1, `a hook balanced for reach buys gate reading time (${reach.gateLeadMult.toFixed(2)}×)`);
    assert(stable.hazardShrug > 0 && stable.gateLeadMult === 1, 'a hook balanced for stability buys hazard resistance instead');

    // KIT — WHAT went in the case decides the shape of a Mend
    const tonics = spec({ craft: 'pack', qtier: 'fine', craftMeta: { packed: { bandage: 0, salve: 0, splint: 0, tonic: 3 }, balance: 90 } });
    const bandages = spec({ craft: 'pack', qtier: 'fine', craftMeta: { packed: { bandage: 5, salve: 0, splint: 0, tonic: 0 }, balance: 90 } });
    assert(tonics.mendPer > 1.3, `a tonic case mends deeply (${tonics.mendPer.toFixed(2)}×)`);
    assert(bandages.mendCharges >= 2 && bandages.mendPer < 1, 'a bandage case mends more often and more lightly');

    // an unbuilt / unknown piece must still return a safe, complete spec
    const bare = spec(null), unknown = spec({ craft: 'nope', qtier: 'ok', craftMeta: {} });
    [bare, unknown].forEach((sp, i) => {
      assert(typeof sp.strikeSpan === 'number' && typeof sp.phaseSec === 'number' && Array.isArray(sp.notes),
        `spec ${i === 0 ? 'of nothing' : 'of an unknown craft'} is still complete and safe to read`);
    });
  }

  /* ============ the spec actually lands on a running road ============ */
  {
    const ch = D.CHAPTERS[1];
    const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
    E.setFlow(flow);
    // a five-fold masterwork blade and a scarred rope, handed straight to the road
    flow.forged = [
      { id: 'blade_x', bpId: 'blade', craft: 'trace', name: 'Blade', genName: 'Razor Blade', icon: 'blade', gear: 'blade',
        grants: ['cut'], perks: [], quality: 0.97, qtier: 'masterwork', traits: { power: 4, control: 2 },
        craftMeta: { folds: 5, worstFold: 92 }, assignedTo: null, tally: {}, wear: 0 },
      { id: 'rope_x', bpId: 'rope', craft: 'weave', name: 'Rope', genName: 'Scarred Rope', icon: 'rope', gear: 'rope',
        grants: ['climb', 'descend'], perks: [], quality: 0.7, qtier: 'ok', traits: { protect: 2 },
        craftMeta: { tempo: 'fast', weakSpots: [1, 4, 6], looseSpots: [] }, assignedTo: null, tally: {}, wear: 0 },
      { id: 'smoke_x', bpId: 'smoke', craft: 'fold', name: 'Shell', genName: 'Dense Shell', icon: 'smoke', gear: 'smoke',
        grants: ['smoke'], perks: [], quality: 0.8, qtier: 'fine', traits: { stealth: 3 },
        craftMeta: { pleats: 6, leaks: 0 }, assignedTo: null, tally: {}, wear: 0 }
    ];
    const MI = window.__RD_MISSION;
    flow.roadPlan = MI.buildRoadPlan(flow);
    P._depart();
    await until(() => !!MI._state(), 6000, 'mission started with pre-built gear');
    const F = MI._state().forge;

    assert(Math.abs(F.momentumFloor - (1.20 + 5 * 0.10)) < 1e-6,
      `the road's momentum floor comes from the blade's FOLD COUNT, not a constant (${F.momentumFloor})`);
    assert(F.slipChance > 0.25, `the road carries the scarred rope's real slip chance (${F.slipChance.toFixed(2)})`);
    assert(Math.abs(F.phaseSec - (2.0 + 6 * 0.68)) < 1e-6, `the road's phase window comes from the shell's PLEAT COUNT (${F.phaseSec})`);
    assert(F.gainMult > 1, 'a masterwork on the bench speeds momentum on every step');

    const txt = F.chips.map(c => `${c.label} ${c.desc}`).join(' | ');
    assert(/5 folds/.test(txt), `the gear readout names how the blade was built, not just what it is (${txt.slice(0, 120)})`);
    assert(/6 pleats/.test(txt), 'the gear readout names the pleat count too');
    assert(F.chips.some(c => /slip|gives/i.test(c.desc)), 'the road warns about the rope it was handed');
    assert(F.chips.some(c => c.ic === '★'), 'the masterwork gets its own chip on the road');
  }

  /* ================= 5. NO ZOMBIE BENCHES ================= */
  {
    // starting a second craft must retire the first one's render loop, or a stale
    // piece keeps publishing its own grade over the live one
    setupCanvas(window, P, 'trace');
    await sleep(30);
    const stale = P._craftRub();
    stale.defs.forEach(d => { stale.v[d.k] = 0.9; });

    setupCanvas(window, P, 'pack');
    await sleep(60);
    const live = P._craftRub();
    assert(live !== stale, 'a new craft installs its own rubric');
    assert(live.defs.some(d => d.k === 'capacity'), 'the live rubric is the new craft\'s, not the retired one\'s');

    await sleep(80);
    assert(P._craftRub() === live, 'the retired bench did not swap the rubric back');

    /* THE REGRESSION ITSELF. `craftAnim` only ever held the LAST scheduled frame,
       so a retired bench's final frame used to clobber it — leaving the live
       bench's loop uncancellable. finishBuild() then banked a quality that the
       still-running loop immediately overwrote with its own near-zero grade, and
       the piece shipped flawed no matter how well it was built. A committed
       quality must survive every frame after it is banked. */
    setupCanvas(window, P, 'trace');   // retire the pack bench mid-flight
    await sleep(20);
    setupCanvas(window, P, 'fit');     // and retire the trace bench too
    await sleep(20);
    forceRub(P, 0.93);
    P._finishBuild(0.93);
    const banked = P._dbg().cur.buildQ;
    assert(Math.abs(banked - 0.93) < 1e-9, `a banked quality is recorded as given (${banked})`);
    await sleep(120);   // several frames' worth of any zombie loop
    assert(Math.abs(P._dbg().cur.buildQ - 0.93) < 1e-9,
      `a banked quality survives every following frame — no retired bench overwrites it (got ${P._dbg().cur.buildQ})`);
  }

  summary(errors);
})();
