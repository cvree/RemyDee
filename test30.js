/* test30.js — WHAT THE BENCH BOUGHT.

   Three claims:
     1. THE MULTIPLIERS COMPOUND. The Vigil's study bonus, a masterwork on the
        bench, and a build's control/reach traits are three separate
        preparations, and preparing all three must be better than preparing one.
        They used to be assignments, so the last one won and the other two were
        silently thrown away.
     2. THE GRADE REACHES THE PASSIVES. "Whatever it does, it does at 150%" was
        true of Strike, Vanish and Mend and of nothing else — the momentum
        floor, the braced shrug, the reading room and the fast ledge all read
        the raw spec. A masterwork and a serviceable piece of the same pattern
        anchored the line identically.
     3. THE PASSIVES ARE CREDITED. A piece that only ever works passively used
        to finish the road with an empty tally and a debrief line reading
        "never came into play", which is how a perfectly braided rope reads as
        wasted embers. Passive help is tallied against the piece that bought it,
        and announced exactly once per road so it never becomes noise. */
const { boot, sleep, until, assert, summary } = require('./testlib');

function blade(qtier, folds) {
  return { id: 'blade_' + qtier, bpId: 'blade', craft: 'trace', name: 'Blade', genName: qtier + ' Blade',
    icon: 'blade', gear: 'blade', grants: ['cut'], perks: [], quality: 0.9, qtier,
    traits: { power: 2, control: 1 }, craftMeta: { folds, worstFold: 90 },
    assignedTo: null, tally: {}, wear: 0 };
}

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');

  /* ============ 1. the grade reaches the passives ============ */
  {
    const plain = P.craftSpec(blade('ok', 5));
    const master = P.craftSpec(blade('masterwork', 5));
    const flawed = P.craftSpec(blade('flawed', 5));

    assert(Math.abs(plain.momentumFloor - 1.70) < 1e-6,
      `five folds on an ordinary blade give the raw floor (${plain.momentumFloor})`);
    assert(master.momentumFloor > plain.momentumFloor,
      `a masterwork blade holds a higher floor than the same five folds built merely well (${master.momentumFloor.toFixed(2)} vs ${plain.momentumFloor.toFixed(2)})`);
    assert(Math.abs(master.momentumFloor - (1 + 0.70 * 1.5)) < 1e-6,
      'the masterwork scales the ADVANTAGE over no floor, not the whole number');
    assert(flawed.momentumFloor > 1 && flawed.momentumFloor < plain.momentumFloor,
      `a flawed blade still holds SOME floor — scaling the raw value would have wiped it out entirely (${flawed.momentumFloor.toFixed(2)})`);
    assert(master.strikeSpan > plain.strikeSpan && plain.strikeSpan > flawed.strikeSpan,
      'the strike corridor is graded the same way, and the ladder runs the right direction');

    // and the promise on the card is not made twice: phaseSec and mendPer are
    // multiplied by tierMult where they are USED, so grading them here would pay
    // the grade twice over
    const shell = (q) => P.craftSpec({ bpId: 'smoke', craft: 'fold', qtier: q, grants: ['smoke'],
      craftMeta: { pleats: 5, leaks: 0 }, tally: {} });
    assert(Math.abs(shell('masterwork').phaseSec - shell('ok').phaseSec) < 1e-6,
      'the phase window is NOT graded in the spec — its call site already applies the grade');
  }

  /* ============ 2. the multipliers compound ============ */
  {
    const ch = D.CHAPTERS[1];
    const focusItem = Object.assign(blade('ok', 2), { traits: { control: 2, reach: 1 } });
    const masterItem = Object.assign(blade('masterwork', 2), { traits: { power: 2, protect: 1 } });

    // computeForgePassives is internal; drive it through a real departure instead
    const run = async (forged, vigil) => {
      const f = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {},
        forged, route: null, stats: {}, vigil };
      E.setFlow(f);
      f.roadPlan = MI.buildRoadPlan(f);
      P._depart();
      await until(() => !!MI._state(), 6000, 'a road started');
      const F = MI._state().forge;
      MI._state().done = true;
      return F;
    };

    const bare = await run([Object.assign(blade('ok', 2), { traits: {} })], null);
    const focus = await run([focusItem], null);
    const both = await run([focusItem, masterItem], { gain: 0.15, floor: 1, value: 0.1, charges: 0 });

    assert(focus.gainMult > bare.gainMult,
      `control and reach on a build speed momentum (${focus.gainMult.toFixed(3)} vs ${bare.gainMult.toFixed(3)})`);
    assert(both.gainMult > focus.gainMult,
      `studying at the Vigil AND forging a masterwork adds to the trait bonus instead of being erased by it (${both.gainMult.toFixed(3)} vs ${focus.gainMult.toFixed(3)})`);
    assert(Math.abs(both.valueMult - 1.1 * 1.3) < 1e-9,
      `the Vigil's ink bonus survives a build that also carries power and protect — it used to be overwritten by the flat 1.3 (${both.valueMult.toFixed(3)})`);
  }

  /* ============ 3. passive help is credited to the piece that bought it ============ */
  {
    const ch = D.CHAPTERS[1];
    const it = blade('masterwork', 5);
    const f = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {},
      forged: [it], route: null, stats: {} };
    E.setFlow(f);
    f.roadPlan = MI.buildRoadPlan(f);
    P._depart();
    await until(() => !!MI._state(), 6000, 'a road started for the credit test');
    const M = MI._state();

    assert(M.forge.ownerFor && M.forge.ownerFor.floor && M.forge.ownerFor.floor.id === it.id,
      'the road knows WHICH piece is holding the momentum floor');

    M.momentum = 3;
    MI._drop(0.4);   // 3 × 0.4 = 1.2, well under this blade's floor
    assert(Math.abs(M.momentum - M.forge.momentumFloor) < 1e-6,
      'the floor caught a fall that would have gone below it');
    assert((it.tally['held the floor'] || 0) === 1,
      'the blade is credited by name for catching it — the debrief can stop saying "never came into play"');

    M.momentum = 3; MI._drop(0.4);
    M.momentum = 3; MI._drop(0.4);
    assert((it.tally['held the floor'] || 0) === 3, 'every later catch is tallied too');
    assert(MI._passives()['held the floor'] === 3,
      'the road counts how many times each passive fired, so it can speak only on the first');

    M.momentum = 1.2;
    const before = it.tally['held the floor'];
    MI._drop(0.9);   // 1.08 — still under the floor, so this one counts as well
    assert(it.tally['held the floor'] === before + 1, 'a shallow fall the floor still catches is credited');

    M.momentum = M.forge.momentumFloor + 2;
    const held = it.tally['held the floor'];
    MI._drop(0.95);  // lands comfortably above the floor: nothing to credit
    assert(it.tally['held the floor'] === held,
      'a fall that never reaches the floor is NOT credited — the ledger has to be honest to be worth reading');
    M.done = true;
  }

  summary(errors);
})();
