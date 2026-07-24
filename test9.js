/* test9.js — THE FINAL BOSS: "The Erasure at the Great Archive" (Chapter Seven).
   Three phases, each a knowledge check wearing an action costume:
     Phase I   The Stripping        — gates force suffix-only recognition,
                                       an erosion meter rises and falls.
     Phase II  The Blank Page       — hover-to-study seals its definition;
                                       Lexicon Affinity levels are the mercy.
     Phase III The Caravan Chorus   — a final assembly puzzle, easier the
                                       more of the campaign you actually played. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');

  const S = E.newGame();
  E.setS(S); E.applySettings();

  /* ================= SETUP ================= */
  assert(MI.BOSS_TERM_ID === 'electrocardiogram', 'the finale term is a real, verified compound');
  const bossBuild = D.TERMS[MI.BOSS_TERM_ID].build;
  assert(bossBuild.length === 3, 'the finale term has three parts to assemble');
  assert(bossBuild.every(id => D.PARTS[id]), 'every part of the finale term exists in the Lexicon');
  const notBoss = D.CHAPTERS[2];
  const boss = D.CHAPTERS.find(c => c.id === 'ch7');
  assert(!MI.isBossRoad({ chapter: notBoss }), 'an ordinary chapter is not the boss road');
  assert(MI.isBossRoad({ chapter: boss }), 'chapter seven IS the boss road');

  function startBossMission(servedCount, affinityLevel) {
    S.servedChapterIds = D.CHAPTERS.slice(0, servedCount).map(c => c.id);
    S.studied = [];
    if (affinityLevel > 0) {
      const need = D.AFFINITY_LEVELS.find(l => l.n === affinityLevel).need;
      Object.keys(D.PARTS).slice(0, need).forEach(id => E.markStudied(id));
    }
    const mk = (bpId, grants, traits) => ({
      id: bpId + '_' + Math.random(), bpId, name: bpId, icon: bpId, gear: bpId, grants,
      material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
      quality: 0.7, qtier: 'ok', traits, assignedTo: null
    });
    const flow = { chapter: boss, builders: [], members: boss.members.slice(0, 4), idx: 0, results: {}, forged: [], route: null, stats: {} };
    flow.forged = [mk('blade', ['cut'], { power: 1 }), mk('smoke', ['smoke'], { stealth: 1 }), mk('kit', ['heal'], { recover: 1 })];
    E.setFlow(flow);
    flow.roadPlan = MI.buildRoadPlan(flow);
    P._depart();
    return flow;
  }

  /* ================= PHASE I: THE STRIPPING ================= */
  startBossMission(1, 0);
  await until(() => !!MI._state(), 6000, 'boss mission start');
  let M = MI._state();
  assert(M.boss && M.boss.active, 'a boss road carries boss state');
  assert(M.boss.phase === 0, 'the road opens in the grace window, before Phase I');

  MI._setProgress(0.1);
  MI._updateBossPhase(0.03);
  M = MI._state();
  assert(M.boss.phase === 1, 'crossing into the road enters Phase I: The Stripping');

  // gates in Phase I are forced to suffix-kind recognition
  for (let i = 0; i < 5; i++) {
    MI._state().gate = null;
    const g = MI._forceGate();
    assert(g && D.PARTS[g.targetId].kind === 'suffix', 'every Phase I gate asks for a suffix — nothing else');
    MI._resolveGate();
  }

  // the erosion meter rises with time...
  MI._state().boss.erosion = 0;
  for (let i = 0; i < 20; i++) MI._updateBossPhase(0.1);
  assert(MI._state().boss.erosion > 0, 'the Stripping applies steady pressure — erosion rises over time');

  // ...and falls when a suffix gate is answered correctly
  MI._state().gate = null;
  const g1 = MI._forceGate();
  MI._setLane(g1.ansLane);
  const erosionBefore = MI._state().boss.erosion;
  MI._resolveGate();
  assert(MI._state().boss.erosion < erosionBefore, 'naming a suffix correctly pushes the erasure back');

  // a full collapse costs the squad but never ends the run
  MI._state().boss.erosion = 0.999;
  const momoBefore = MI._momentum();
  const stamBefore = MI._state().stats.stamina;
  MI._updateBossPhase(0.05);
  assert(MI._state().boss.erosion < 1, 'a collapse resets erosion to a partial value, not a hard restart');
  assert(MI._momentum() < momoBefore, 'a collapse knocks momentum down hard');
  assert(MI._state().stats.stamina < stamBefore, 'a collapse costs the squad real strength');
  assert(!MI._state().done, 'a collapse is recoverable — it never ends the encounter');

  /* ================= PHASE II: THE BLANK PAGE ================= */
  // no affinity earned: every new part hovered during Phase II stays sealed
  startBossMission(1, 0);
  await until(() => !!MI._state(), 6000, 'boss mission restart (no affinity)');
  MI._setProgress(0.5);
  MI._updateBossPhase(0.03);
  M = MI._state();
  assert(M.boss.phase === 2, 'progress past the Stripping enters Phase II: The Blank Page');
  assert(M.boss.scaffold === 0, 'a player with no Lexicon Affinity carries no scaffolding into the Blank Page');
  const sealedPeek = MI._peekCard(bossBuild[0]);
  assert(sealedPeek.sealed, 'with zero affinity, the glossary stays sealed — recall without support');

  // Reader-level affinity (8 studied parts) grants exactly one scaffold charge
  startBossMission(1, 1);
  await until(() => !!MI._state(), 6000, 'boss mission restart (Reader affinity)');
  MI._setProgress(0.5);
  MI._updateBossPhase(0.03);
  M = MI._state();
  assert(M.boss.scaffold === 1, 'Reader-level affinity carries exactly one scaffold charge into the fight');
  const parts = Object.keys(D.PARTS);
  assert(parts.length > 10, 'the Lexicon has enough parts for this test to pick two unused ones');
  const firstPeek = MI._peekCard(parts[parts.length - 1]);
  assert(!firstPeek.sealed, 'the first new word draws on the one scaffold charge earned — its meaning is lit');
  assert(MI._boss().scaffoldUsed === 1, 'the charge is spent, precisely once');
  const secondPeek = MI._peekCard(parts[parts.length - 2]);
  assert(secondPeek.sealed, 'once the charges are spent, the NEXT new word goes dark — the mercy is earned, not infinite');

  /* ================= PHASE III: THE CARAVAN CHORUS ================= */
  // a player who rushed the campaign (few chapters served) faces it almost alone
  startBossMission(1, 0);
  await until(() => !!MI._state(), 6000, 'boss mission restart (chorus, rushed)');
  MI._setProgress(MI.BOSS_CHORUS_AT);
  MI._updateBossPhase(0.03);
  M = MI._state();
  assert(M.boss.chorusShown, 'reaching the threshold triggers the Chorus');
  assert(M.paused, 'the Chorus pauses the road for the finale puzzle');
  let Cs = MI._chorus();
  assert(Cs && Cs.preCount === 0, 'a rushed campaign (1 chapter served) gets no traveler help — nearly alone');
  assert(Cs.placed.filter(v => v == null).length === 3, 'all three parts are the player\'s to place');
  const doc = window.document;
  assert(doc.getElementById('boss-chorus').classList.contains('show'), 'the Chorus overlay is visible');
  assert(doc.querySelectorAll('#chorus-slots .cs-slot').length === 3, 'three assembly slots are rendered');
  assert(doc.querySelectorAll('#chorus-tray .ct-tile').length >= 3, 'a tray of candidate parts is offered');

  // a well-traveled campaign (6 chapters served) gets real help
  startBossMission(6, 0);
  await until(() => !!MI._state(), 6000, 'boss mission restart (chorus, well-traveled)');
  MI._setProgress(MI.BOSS_CHORUS_AT);
  MI._updateBossPhase(0.03);
  Cs = MI._chorus();
  assert(Cs.preCount === 2, 'six chapters served brings two travelers forward to offer their part');
  assert(Cs.placed.filter(v => v != null).length === 2, 'those two parts are pre-placed correctly');
  assert(Cs.locked[0] && Cs.locked[1] && !Cs.locked[2], 'the offered parts lock in place; one slot is left for the player');

  // wrong placement: caught, explained, and never punished beyond a retry
  const trayIdx = Cs.tray.findIndex(t => t.id !== Cs.build[2]);
  assert(trayIdx >= 0, 'a wrong candidate exists in the tray to test against');
  MI._chorusPlaceTray(trayIdx);
  MI._chorusCheck();
  assert(!MI._boss().chorusDone, 'a wrong final piece does not resolve the Chorus');
  assert(MI._state().paused, 'the road stays paused — no penalty beyond trying again');
  assert(doc.getElementById('chorus-feedback').textContent.length > 0, 'wrong placement is explained, not just rejected silently');

  // clear the wrong tile and place the correct one
  const wrongSlotIdx = MI._chorus().placed.findIndex((v, i) => !MI._chorus().locked[i] && v != null);
  doc.querySelectorAll('#chorus-slots .cs-slot')[wrongSlotIdx].click();
  assert(MI._chorus().placed[wrongSlotIdx] == null, 'clicking a placed (unlocked) tile returns it to the tray');
  const correctIdx = MI._chorus().tray.findIndex(t => t.id === Cs.build[2] && !t.used);
  MI._chorusPlaceTray(correctIdx);
  const termsBefore = MI._state().realTermsBuilt || 0;
  MI._chorusCheck();
  assert(MI._boss().chorusDone, 'the correct final piece resolves the Chorus');
  assert((MI._state().realTermsBuilt || 0) === termsBefore + 1, 'the finished finale term counts as a real term built');
  assert(S.completedTerms.includes(MI.BOSS_TERM_ID), 'the finale term is recorded as completed');

  await sleep(1900);
  assert(!MI._state().paused, 'the road resumes once the Chorus settles');
  assert(!doc.getElementById('boss-chorus').classList.contains('show'), 'the Chorus overlay closes');

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
