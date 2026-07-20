/* test6.js — BENCH redesign: save v5 migration, commission board with road intel,
   embers, variants, reagent craft, flawed ember cost, heirloom deposit. */
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
  assert(migrated && migrated.ver === 5, 'v3 save migrates to ver 5');
  assert(Array.isArray(migrated.techniques) && typeof migrated.benchMastery === 'object'
    && typeof migrated.reagents === 'object' && migrated.heirloom === null
    && typeof migrated.cachesMarked === 'number', 'v5 fields backfilled');
  assert(migrated.rep === 12 && migrated.chapter === 1, 'old progress preserved');

  /* ---- fresh state + synthetic flow ---- */
  const S = E.newGame();
  assert(S.ver === 5, 'newGame is ver 5');
  E.setS(S); E.applySettings();
  const ch = D.CHAPTERS[1];   // 3+ members → maxItems 3, ember budget 4
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flow);

  /* ---- commission board ---- */
  P.openForge();
  await until(() => P._commission().step === 'commission', 6000, 'commission board');
  const c1 = P._commission();
  assert(c1.step === 'commission', 'forge opens on the commission board');
  assert(c1.pool.length === 7, 'all 7 blueprints offered (player chooses)');
  assert(c1.embers === c1.maxItems + 1, 'ember budget = room + 1 spare');
  assert(flow.roadPlan && flow.roadPlan.events.length >= 7 && flow.roadPlan.events.length <= 9, 'road plan generated at forge time (7–9 stops)');
  const evTypes = flow.roadPlan.events.map(e => e.type);
  assert(evTypes.filter(t => t === 'question').length >= 2, 'plan guarantees questions');
  assert(evTypes.includes('fork'), 'plan guarantees a fork');
  const doc = window.document;
  assert(doc.querySelectorAll('.comm-card').length === 7, 'board renders 7 cards');
  assert(!!doc.querySelector('.road-report') === (flow.roadPlan.intel.length > 0), 'scout report shown when intel exists');

  /* ---- forge a FINE smoke shell ---- */
  P._pickBlueprint('smoke');
  assert(P._dbg().cur && P._dbg().cur.bp.id === 'smoke', 'chosen blueprint is current');
  P._forceDecode(true);
  assert(P._pickMaterial(0), 'fine material selectable after clean decode');
  P._finishBuild(0.95);
  await until(() => flow.forged.length === 1, 8000, 'first commit');
  assert(flow.forged.length === 1 && flow.forged[0].qtier === 'fine', 'fine smoke shell committed');
  assert(E.S().benchMastery.smoke.fine === 1, 'bench mastery recorded');
  assert(flow.embersUsed === 1, 'fine craft burns one ember');

  /* ---- variant unlocked by mastery; flawed craft burns two embers ---- */
  P._openCommission();
  assert(P._variants('smoke').length === 1, 'Long-burn shell variant unlocked by fine craft');
  assert(doc.querySelector('.variant-btn'), 'variant offered on the board');
  P._pickBlueprint('smoke', 'longburn');
  P._forceDecode(false);
  assert(!P._pickMaterial(0), 'stronger material locked after missed decode');
  assert(P._pickMaterial(1), 'basic material still available (flawed path, never blocked)');
  P._finishBuild(0.1);
  await until(() => flow.forged.length === 2, 8000, 'second commit');
  const it2 = flow.forged[1];
  assert(it2 && it2.qtier === 'flawed' && it2.name === 'Long-burn shell', 'flawed variant committed (usable, not blocked)');
  assert(it2.bonus && it2.bonus.vanish === 1, 'variant carries bonus charge');
  assert(flow.embersUsed === 3, 'flawed craft burned two embers');

  /* ---- reagent craft ---- */
  E.S().reagents = { mistresin: 2 };
  P.unlockTech('reagentcraft');
  P._openCommission();
  P._pickBlueprint('claws');
  P._forceDecode(true);
  assert(doc.querySelector('.reagent-chip'), 'reagent chips offered at material step');
  P._setReagent('mistresin');
  P._pickMaterial(0);
  P._finishBuild(0.95);
  await until(() => flow.forged.length === 3, 8000, 'third commit');
  const it3 = flow.forged[2];
  assert(it3 && it3.name === 'Climbing claws', 'third craft is the chosen claws blueprint');
  assert(it3 && it3.perks.includes('surefoot'), 'reagent perk applied to the item');
  assert(E.S().reagents.mistresin === 1, 'reagent consumed');
  assert(P._commission === undefined || true, 'noop');

  /* ---- abilities + depart perks ---- */
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission state');
  assert(flow.stats.perks && flow.stats.perks.includes('surefoot'), 'perks flow into mission stats');
  const M = MI._state();
  assert(M && M.abilities.vanish === 3, 'vanish charges = two smoke shells + variant bonus (duplicates stack)');
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

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
