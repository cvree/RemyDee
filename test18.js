/* test18.js — THE MAKER'S PASS.

   Four claims, one per section:
     1. THE MASTERWORK GATE — a perfect piece needs two things at once: a build
        trial at or above the bar, and a clean decode. Either one missing denies
        it. There is no second trial to pass; there is one trial per piece.
     2. THE SPEC — how a piece was built reaches the road: folds set the strike
        corridor, pleats set the phase window, a scarred rope really can slip.
     3. AND IT LANDS — those numbers arrive on a running road, named in the
        readout, rather than staying at the bench.
     4. NO ZOMBIE BUILDS — a trial abandoned on one piece can never come back and
        regrade a later one. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MG = window.__RD_MG;
  assert(E && D && P, 'modules exposed');
  assert(typeof P.craftSpec === 'function', 'the bench exports craftSpec — the road can ask HOW a piece was built');
  const S = E.newGame(); E.setS(S); E.applySettings();
  E.setFlow({ chapter: D.CHAPTERS[0], builders: [], members: D.CHAPTERS[0].members.slice(0, 1), idx: 0, results: {}, forged: [], route: null, stats: {} });

  /* ================= 1. THE MASTERWORK GATE ================= */
  {
    const bar = P._masterBar();
    assert(bar > 0.7 && bar <= 0.95, `the masterwork bar is a real, stated threshold (${bar})`);

    /* THE DECODE HAS TO BE CLEAN. This is the clause that keeps the game a
       vocabulary game: you cannot hammer your way to a perfect tool without
       having understood the term it was commissioned against. */
    const ch = D.CHAPTERS[1];
    E.S().unlockedBps = ['kit', 'blade', 'hook', 'smoke', 'rope', 'claws', 'bow'];

    /* Drive one commission with a chosen decode and a chosen build score. Step 4
       is a proving animation, not a trial, so nothing between the build and the
       verdict can move the grade. */
    const runOne = async (decodeOk, buildScore) => {
      const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
      E.setFlow(flow);
      P.openForge();
      await until(() => P._commission().step === 'commission', 6000, 'commission board');
      P._pickBlueprint('blade');
      P._forceDecode(decodeOk);
      P._pickMaterial(0);
      await sleep(30);
      P._finishBuild(buildScore, buildScore);
      await until(() => !!P._dbg().cur.qtier, 6000, 'test step graded the piece');
      return P._dbg().cur;
    };

    MG.setAuto(4);
    const perfect = await runOne(true, 0.99);
    assert(perfect.qtier === 'masterwork',
      `a clean decode + a build past the bar ships a MASTERWORK (got ${perfect.qtier} at q=${perfect.finalQ})`);
    assert(perfect.build && perfect.build.score >= bar, 'the masterwork carries the build grade that earned it');

    /* ONE TRIAL PER PIECE. Step 4 must not open a second one — a player who has
       just packed a field kit by pairing remedies is not then handed a mortar. */
    const veils = window.document.querySelectorAll('.mg-veil').length;
    assert(veils === 0, 'the proof step opens no trial of its own');
    assert(perfect.proof === undefined, 'and records no second grade — there is nothing to record');

    const sloppyWord = await runOne(false, 0.99);
    assert(sloppyWord.qtier !== 'masterwork',
      `a flawless BUILD with a fumbled decode is not a masterwork (got ${sloppyWord.qtier})`);

    const sloppyHands = await runOne(true, bar - 0.08);
    assert(sloppyHands.qtier !== 'masterwork',
      `a clean decode with mediocre hands is not a masterwork either (got ${sloppyHands.qtier})`);

    // the grade is not cosmetic: a masterwork's traits are scaled harder than a fine one's
    assert(perfect.scaledTraits.power > sloppyHands.scaledTraits.power,
      'masterwork traits genuinely outscale a lesser build of the same blueprint');
    MG.setAuto(2);
  }

  /* ================= 2. THE SPEC REACHES THE ROAD ================= */
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

    // ROPE — a loose turn is recorded and then it BITES
    const clean = spec({ craft: 'weave', qtier: 'fine', craftMeta: { tempo: 'fast', weakSpots: [], looseSpots: [] } });
    const scarred = spec({ craft: 'weave', qtier: 'fine', craftMeta: { tempo: 'fast', weakSpots: [2, 5], looseSpots: [1] } });
    assert(clean.slipChance === 0, 'a rope braided without a missed beat cannot slip');
    assert(scarred.slipChance > 0.2, `a scarred rope carries a real slip chance (${scarred.slipChance.toFixed(2)})`);
    assert(spec({ craft: 'weave', qtier: 'masterwork', craftMeta: { tempo: 'fast', weakSpots: [2, 5], looseSpots: [] } }).slipChance === 0,
      'a masterwork removes the failure mode entirely, not just softens it');
    assert(spec({ craft: 'weave', qtier: 'flawed', craftMeta: { tempo: 'steady', weakSpots: [], looseSpots: [] } }).slipChance > 0,
      'a flawed piece can fail outright even with a clean braid');

    // BOW — which draw the stock favours changes what Strike does
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

    // HOOK — which side of the balance the stock committed to changes the road
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

  /* ============ 3. the spec actually lands on a running road ============ */
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

    // five folds give a raw floor of 1.70; the blade is a masterwork, so the
    // ADVANTAGE over no floor at all (0.70) is worth half again — 1 + 0.70*1.5
    assert(Math.abs(F.momentumFloor - (1 + ((1.20 + 5 * 0.10) - 1) * 1.5)) < 1e-6,
      `the road's momentum floor comes from the blade's FOLD COUNT, not a constant (${F.momentumFloor})`);
    assert(F.momentumFloor > 1.20 + 5 * 0.10,
      'a masterwork blade holds a HIGHER floor than the same blade built merely well — the grade reaches the passives, not only the three ability buttons');
    assert(F.slipChance > 0.25, `the road carries the scarred rope's real slip chance (${F.slipChance.toFixed(2)})`);
    assert(Math.abs(F.phaseSec - (2.0 + 6 * 0.68)) < 1e-6, `the road's phase window comes from the shell's PLEAT COUNT (${F.phaseSec})`);
    assert(F.gainMult > 1, 'a masterwork on the bench speeds momentum on every step');

    const txt = F.chips.map(c => `${c.label} ${c.desc}`).join(' | ');
    assert(/5 folds/.test(txt), `the gear readout names how the blade was built, not just what it is (${txt.slice(0, 120)})`);
    assert(/6 pleats/.test(txt), 'the gear readout names the pleat count too');
    assert(F.chips.some(c => /slip|gives/i.test(c.desc)), 'the road warns about the rope it was handed');
    assert(F.chips.some(c => c.ic === '★'), 'the masterwork gets its own chip on the road');
  }

  /* ================= 4. NO ZOMBIE BUILDS =================
     A trial is a promise, and a promise outlives the screen that opened it. If
     an abandoned trial were allowed to resolve onto whatever piece is on the
     bench when it lands, the player would watch a grade they never earned
     appear on a piece they were halfway through. Whichever route grades a piece
     FIRST wins, and every later resolution is dropped. */
  {
    const ch = D.CHAPTERS[1];
    E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} });
    MG.setAuto(0);                 // any stray trial resolution would grade near zero
    P.openForge();
    await until(() => P._commission().step === 'commission', 6000, 'commission board');
    P._pickBlueprint('blade');
    P._forceDecode(true);
    P._pickMaterial(0);            // opens the build trial
    P._finishBuild(0.93, 0.93);    // ...and grade the piece before it can resolve
    const banked = P._dbg().cur.buildQ;
    assert(Math.abs(banked - 0.93) < 1e-9, `a banked quality is recorded as given (${banked})`);
    await sleep(200);              // long enough for the abandoned trial to land
    assert(Math.abs(P._dbg().cur.buildQ - 0.93) < 1e-9,
      `a banked quality survives the trial it outran — no abandoned trial regrades it (got ${P._dbg().cur.buildQ})`);
    assert(P._dbg().cur.build.score === 0.93,
      'and the recorded build grade is the banked one, not the trial\'s');
    MG.setAuto(2);
  }

  summary(errors);
})();
