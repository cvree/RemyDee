/* test6.js — BENCH: save v6 migration, the blueprint unlock ladder, the
   recommended commission board, embers, variants, reagent craft, the RUINED
   craft tier, flawed ember cost, heirloom deposit. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');

  /* ---- save migration: a v3 save loads and gains v5 fields ---- */
  window.localStorage.setItem('remydee_lost_lexicon_v3', JSON.stringify({
    ver: 3, chapter: 1, rep: 12, coin: 30, pages: 1, servedChapterIds: ['ch0'],
    completedTerms: [], valeRescued: false, mastery: { terms: {}, parts: {} },
    settings: { motion: false, contrast: false, textSize: 'md', vol: { master: .8, music: .4, sfx: .8, voice: 1 }, muted: false, timerRelax: false },
    support: { hint: 3, consult: 2, recall: 3 }, finished: false
  }));
  const migrated = E.Save.read();
  assert(migrated && migrated.ver === 7, 'v3 save migrates to ver 7');
  assert(Array.isArray(migrated.techniques) && typeof migrated.benchMastery === 'object'
    && typeof migrated.reagents === 'object' && migrated.heirloom === null
    && typeof migrated.cachesMarked === 'number', 'v5 fields backfilled');
  assert(Array.isArray(migrated.pending) && Array.isArray(migrated.studied)
    && Array.isArray(migrated.unlockedBps) && migrated.unlockedBps.length >= 1
    && typeof migrated.emberDebt === 'number', 'v6 progression fields backfilled');
  assert(migrated.rep === 12 && migrated.chapter === 1, 'old progress preserved');

  /* ---- fresh state + synthetic flow ---- */
  const S = E.newGame();
  assert(S.ver === 7, 'newGame is ver 7');
  assert(S.unlockedBps.length === 1 && S.unlockedBps[0] === 'kit',
    'a new game opens with exactly ONE pattern on the board');
  E.setS(S); E.applySettings();

  /* ---- the blueprint unlock ladder: one new pattern per finished chapter ---- */
  assert(D.blueprintsEarnedBy([]).length === 1, 'ladder: nothing finished → one pattern');
  assert(D.blueprintsEarnedBy(['prologue']).includes('blade'), 'ladder: prologue opens the blade');
  assert(D.blueprintsEarnedBy(['prologue', 'ch1']).includes('hook'), 'ladder: chapter one opens the hook');
  assert(D.blueprintsEarnedBy(D.CHAPTERS.map(c => c.id)).length === 8, 'ladder: a full campaign opens all eight');

  /* ---- the party ladder: the prologue fields ONE, chapter one THREE ---- */
  const p0 = E.partyFor(D.CHAPTERS[0]), p1 = E.partyFor(D.CHAPTERS[1]);
  assert(p0.builders.length === 1, 'prologue fields one builder');
  assert(p1.builders.length === 3, 'chapter one fields three builders, not six');
  assert(p1.pending.length >= 1, 'travelers who do not fit go on the waiting list');
  assert(E.benchCapacityFor(D.CHAPTERS[0]) === 1, 'the prologue bench holds one piece');
  assert(E.benchCapacityFor(D.CHAPTERS[1]) === 2, 'chapter one holds two');

  // open the whole board for the rest of the bench tests
  E.S().unlockedBps = ['kit', 'blade', 'hook', 'smoke', 'rope', 'claws', 'bow'];
  const ch = D.CHAPTERS[1];
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flow);

  /* ---- commission board ---- */
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'commission board');
  const c1 = P._commission();
  assert(c1.step === 'commission', 'forge opens on the commission board');
  assert(c1.pool.length === 7, 'the board offers exactly the patterns the player knows');
  assert(c1.embers === c1.maxItems + 1, 'ember budget = room + 1 spare');
  assert(flow.roadPlan && flow.roadPlan.events.length >= 7 && flow.roadPlan.events.length <= 9, 'road plan generated at forge time (7–9 stops)');
  const evTypes = flow.roadPlan.events.map(e => e.type);
  assert(evTypes.filter(t => t === 'gate').length >= 3, 'plan guarantees rune gates');
  assert(evTypes.includes('gate'), 'plan guarantees a rune gate');
  const doc = window.document;
  assert(doc.querySelectorAll('.rec-grid .comm-card').length <= 2
    && doc.querySelectorAll('.rec-grid .comm-card').length >= 1,
    'the board recommends one or two patterns, never a wall of seven');
  assert(!!doc.querySelector('.comm-more'), 'the rest of the board stays available behind a toggle');
  assert(doc.querySelectorAll('.comm-card').length === 7, 'every known pattern is still reachable');
  assert(!!doc.querySelector('.comm-why'), 'the recommendation says WHY');
  assert(!!doc.querySelector('.road-report') === (flow.roadPlan.intel.length > 0), 'scout report shown when intel exists');

  /* ---- forge a FINE smoke shell ---- */
  P._pickBlueprint('smoke');
  assert(P._dbg().cur && P._dbg().cur.bp.id === 'smoke', 'chosen blueprint is current');
  P._forceDecode(true);
  assert(P._pickMaterial(0), 'fine material selectable after clean decode');
  P._finishBuild(0.95);
  await until(() => P._skipMark(), 8000, 'maker\'s mark offered and skipped (fine smoke shell)');
  await until(() => flow.forged.length === 1, 8000, 'first commit');
  assert(flow.forged.length === 1 && flow.forged[0].qtier === 'fine', 'fine smoke shell committed');
  assert(E.S().benchMastery.smoke.fine === 1, 'bench mastery recorded');
  assert(flow.embersUsed === 1, 'fine craft burns one ember');

  /* ---- variant unlocked by mastery; flawed craft burns two embers ---- */
  P._openCommission();
  assert(P._variants('smoke').length === 1, 'Long-burn shell variant unlocked by fine craft');
  assert(doc.querySelector('.variant-btn'), 'variant offered on the board');

  /* ---- RUINED: a careless build now genuinely costs you the slot ---- */
  P._pickBlueprint('bow');
  P._forceDecode(false);
  assert(!P._pickMaterial(0), 'stronger material locked after missed decode');
  assert(P._pickMaterial(1), 'basic material still available (flawed path, never blocked)');
  P._finishBuild(0.1);
  await until(() => flow.embersUsed === 3, 8000, 'ruined craft burns two embers');
  assert(flow.forged.length === 1, 'a RUINED piece never reaches the tray');
  assert(flow.embersUsed === 3, 'the ruined craft still burned two embers');

  /* ---- flawed: usable, never blocked, but visibly weaker ---- */
  // the ruined craft ate the last ember — restoke the forge for the next test
  flow.embersUsed = 0;
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'restoked commission board');
  P._pickBlueprint('smoke', 'longburn');
  P._forceDecode(false);
  P._pickMaterial(1);
  P._finishBuild(0.45);
  await until(() => P._skipMark(), 8000, 'maker\'s mark offered and skipped (flawed variant)');
  await until(() => flow.forged.length === 2, 8000, 'second commit');
  const it2 = flow.forged[1];
  assert(it2 && it2.qtier === 'flawed' && it2.name === 'Long-burn shell', 'flawed variant committed (usable, not blocked)');
  assert(it2.bonus && it2.bonus.vanish === 1, 'variant carries bonus charge');
  assert(it2.traits.stealth < flow.forged[0].traits.stealth,
    'flawed work is genuinely weaker than fine work — the grade is not cosmetic');
  assert(flow.embersUsed === 2, 'flawed craft burned two embers');

  /* ---- reagent craft (fresh bench: the last one is out of embers) ---- */
  E.S().reagents = { mistresin: 2 };
  P.unlockTech('reagentcraft');
  flow.embersUsed = 0; flow.forged.length = 0;
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'reagent commission board');
  P._pickBlueprint('claws');
  P._forceDecode(true);
  assert(doc.querySelector('.reagent-chip'), 'reagent chips offered at material step');
  P._setReagent('mistresin');
  P._pickMaterial(0);
  P._finishBuild(0.95);
  await until(() => P._skipMark(), 8000, 'maker\'s mark offered and skipped (reagent claws)');
  await until(() => flow.forged.length === 1, 8000, 'third commit');
  const it3 = flow.forged[0];
  assert(it3 && it3.name === 'Climbing claws', 'third craft is the chosen claws blueprint');
  assert(it3 && it3.perks.includes('surefoot'), 'reagent perk applied to the item');
  assert(E.S().reagents.mistresin === 1, 'reagent consumed');
  assert(P._commission === undefined || true, 'noop');

  /* ---- abilities + depart perks ---- */
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission state');
  assert(flow.stats.perks && flow.stats.perks.includes('surefoot'), 'perks flow into mission stats');
  const M = MI._state();
  assert(M && typeof M.abilities.vanish === 'number', 'ability charges computed from the bench');
  /* free movement: the squad is no longer clamped to three lane positions */
  assert(typeof M.targetY === 'number' && typeof M.laneY === 'number', 'the road tracks a continuous height');
  assert(M.phaseT === 0 && typeof M.keyUp === 'boolean', 'free-movement state initialised');
  assert(M.events.length === flow.roadPlan.events.length, 'mission consumes the pre-scouted road plan');

  /* ---- heirloom deposit wears a tier ---- */
  E.S().heirloom = { bpId: 'hook', name: 'Grappling hook', icon: 'hook', gear: 'hook',
    grants: ['climb'], qtier: 'fine', traits: { reach: 2 }, perks: [], bonus: null };
  const flow2 = { chapter: ch, builders: [], members: ch.members.slice(0, 2), idx: 0, results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flow2);
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'second commission board');
  assert(flow2.forged.length === 1 && flow2.forged[0].heirloom === true, 'heirloom waits on the bench');
  assert(flow2.forged[0].qtier === 'ok', 'heirloom arrives one tier more worn');
  assert(E.S().heirloom === null, 'heirloom slot cleared after deposit');
  const c2 = P._commission();
  assert(c2.roomLeft === c2.maxItems, 'heirloom does not eat bench room');
  assert(c2.maxItems === E.benchCapacityFor(ch), 'bench room comes from the chapter ladder, not party size');

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
