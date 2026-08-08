/* test12.js — THE BENCH TRIALS: one fixed task per pattern.

   The bench used to carry seven hand-written canvas mini-games of its own —
   trace, align, tension, fold, fit, pack, weave — written before the trials
   library existed and never reconciled with it. They are gone. Every piece is
   now worked with a trial from __RD_MG, and the pairing is FIXED per pattern:
   a bow is always tillered by holding the limb, a field kit is always packed
   by pairing remedies, forever.

   Five claims:
     1. EVERY PATTERN DECLARES TWO TRIALS — one to work the piece, one to prove
        it — and both name real archetypes and teach themselves in a line.
     2. THE SAME EVERY TIME — the pairing never varies, not between calls and
        not between two real crafts of the same pattern. Nothing rolls dice.
     3. THE OLD BENCH IS GONE — no craft canvas, no scrap apron, no rubric, and
        no way to reach the seven removed crafts.
     4. THE PIECE REMEMBERS — the material chosen and the grade earned reach
        craftMeta, so two pieces of the same pattern still differ on the road.
     5. THE GRADE DECIDES — the same commission, worked well and worked badly,
        ships as two different pieces. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MG = window.__RD_MG;
  assert(E && D && P && MG, 'modules exposed');
  const S = E.newGame(); E.setS(S); E.applySettings();
  E.setFlow({ chapter: D.CHAPTERS[0], builders: [], members: D.CHAPTERS[0].members.slice(0, 1), idx: 0, results: {}, forged: [], route: null, stats: {} });

  const BPS = P._blueprints();
  const IDS = Object.keys(BPS);

  /* ================= 1. EVERY PATTERN DECLARES TWO TRIALS ================= */
  console.log('\n== a pattern is worked with a trial, and proved with one ==');
  assert(typeof P.benchTrial === 'function', 'the bench says which trial a pattern is built with');
  for (const id of IDS) {
    for (const phase of ['build', 'proof']) {
      const t = P.benchTrial(id, phase);
      assert(!!t, `${id}/${phase}: has a trial at all`);
      assert(typeof MG.ARCH[t.type] === 'function', `${id}/${phase}: names a real archetype (${t.type})`);
      assert(!!t.title && !!t.brief, `${id}/${phase}: names itself and teaches itself in one line`);
      /* FAILURE HAS TO MEAN SOMETHING, AND IT HAS TO BE SAID OUT LOUD. */
      assert(!!t.stakes, `${id}/${phase}: states what failing costs before a hand moves`);
    }
    /* The build screen also carries a sentence saying this is the pattern's
       permanent task — the whole point is that it can be learned. */
    assert(!!P.benchTrial(id, 'build').line, `${id}: the build step says what working this pattern always asks`);
  }
  /* An unknown pattern must still build something rather than throwing. */
  const fallback = P.benchTrial('no-such-pattern', 'build');
  assert(fallback && typeof MG.ARCH[fallback.type] === 'function',
    'a pattern the table has never heard of still gets a real trial');

  /* ================= 2. THE SAME EVERY TIME ================= */
  console.log('\n== the same pattern asks the same thing, every time ==');
  for (const id of IDS) {
    const a = P.benchTrial(id, 'build'), b = P.benchTrial(id, 'build');
    assert(a.type === b.type && a.title === b.title,
      `${id}: asked twice, the bench names the same task both times (${a.type})`);
  }
  /* And it is not one task wearing eight hats: the patterns genuinely differ. */
  const buildTypes = IDS.map((id) => P.benchTrial(id, 'build').type);
  assert(new Set(buildTypes).size >= 5,
    `the eight patterns are worked at least five different ways (${new Set(buildTypes).size})`);

  /* ================= 3. THE OLD BENCH IS GONE ================= */
  console.log('\n== the seven hand-written crafts are gone, root and branch ==');
  ['_testCraft', '_craftRub', '_craftScrap', '_craftHeat', '_heat', '_heatTick', '_scrapTap',
   '_heatTemper', '_rubIsMaster', '_rubBuildScore', 'APRON'].forEach((k) =>
    assert(P[k] === undefined, `the bench no longer exposes ${k} — the old craft went with its hooks`));
  /* The trials library stopped rolling dice for callers too: there are no
     activity pools left, because the only caller names its archetype. */
  ['run', 'ACTS', 'pickFor'].forEach((k) =>
    assert(MG[k] === undefined, `__RD_MG no longer offers ${k} — nothing picks a trial at random`));
  assert(typeof MG.play === 'function', 'play() is the whole public surface now');

  /* ================= 4 + 5. A REAL CRAFT, TWICE ================= */
  console.log('\n== the same commission, worked well and worked badly ==');
  const ch = D.CHAPTERS[1];
  E.S().unlockedBps = ['kit', 'blade', 'hook', 'smoke', 'rope', 'claws', 'bow'];
  /* Run one commission end to end at a chosen trial tier. jsdom has no hands,
     so setAuto stands in for them — everything else is the real bench. */
  const craft = async (bpId, matIdx, tier) => {
    MG.setAuto(tier);
    E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} });
    P.openForge();
    await until(() => P._commission().step === 'commission', 6000, 'commission board');
    P._pickBlueprint(bpId);
    P._forceDecode(true);
    P._pickMaterial(matIdx);
    await until(() => !!P._dbg().cur.qtier, 8000, 'the piece is graded');
    return P._dbg().cur;
  };

  const well = await craft('blade', 0, 4);
  const badly = await craft('blade', 0, 1);
  assert(!!well.build && !!badly.build, 'both pieces carry the grade the build trial came back with');
  assert(well.build.type === badly.build.type,
    `two blades in a row were ground by the same trial (${well.build.type})`);
  assert(well.build.type === P.benchTrial('blade', 'build').type,
    'and it is the trial the table names for that pattern');
  assert(well.finalQ > badly.finalQ,
    `a flawless hand ships a better blade than a rough one (${well.finalQ.toFixed(2)} vs ${badly.finalQ.toFixed(2)})`);
  assert(well.qtier === 'masterwork',
    `a clean decode + a flawless build + a clean proof is a MASTERWORK (got ${well.qtier})`);
  assert(badly.qtier !== 'masterwork', `and a rough one is not (got ${badly.qtier})`);

  /* THE PIECE REMEMBERS. craftMeta is what the road reads to make two pieces of
     the same pattern behave differently, and it now comes from the two decisions
     that survived the redesign: the stock chosen, and the hand that worked it. */
  console.log('\n== how a piece was made still reaches the road ==');
  assert(well.craftMeta && well.craftMeta.folds > badly.craftMeta.folds,
    `a steadier hand works the edge more times (${well.craftMeta.folds} folds vs ${badly.craftMeta.folds})`);
  const specWell = P.craftSpec({ craft: 'trace', craftMeta: well.craftMeta, qtier: well.qtier });
  const specBadly = P.craftSpec({ craft: 'trace', craftMeta: badly.craftMeta, qtier: badly.qtier });
  assert(specWell.strikeSpan > specBadly.strikeSpan,
    `and that reaches the road: Strike sweeps further for the better blade (${specWell.strikeSpan.toFixed(2)} vs ${specBadly.strikeSpan.toFixed(2)})`);

  /* THE MATERIAL IS THE OTHER DECISION. Two hooks built equally well but from
     different stock are balanced for different things. */
  const light = await craft('hook', 0, 3);
  const heavy = await craft('hook', 1, 3);
  assert(light.craftMeta.balanceLean !== heavy.craftMeta.balanceLean,
    `the stock decides what a hook is balanced for (${light.craftMeta.balanceLean} vs ${heavy.craftMeta.balanceLean})`);

  /* No blueprint may write craftMeta that craftSpec cannot read back. */
  for (const id of IDS) {
    const bp = BPS[id];
    const meta = P._buildMeta(bp, bp.materials[0], MG.result(0.9, false));
    const sp = P.craftSpec({ craft: bp.craft, craftMeta: meta, qtier: 'fine' });
    assert(sp.notes.length >= 1, `${id}: a finished piece has something to say on its spec sheet`);
  }

  MG.setAuto(2);
  summary(errors);
})();
