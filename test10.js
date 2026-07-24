/* test10.js — the campaign map (spot-to-spot progression, values/traits hinted,
   locked steps visibly locked) and the Jian Radicida title-progression rename
   (Lord Jian -> Jian Radicida, the Root-Slayer -> Verbum Ultimum). */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  assert(E && D && P && MI, 'modules exposed');
  const doc = window.document;

  /* ================= THE CAMPAIGN MAP ================= */
  const S = E.newGame();
  E.setS(S); E.applySettings();
  window.__RD_SCREENS.showHub();
  await until(() => doc.querySelectorAll('#campaign-map .map-node').length > 0, 6000, 'campaign map renders');

  let nodes = doc.querySelectorAll('#campaign-map .map-node');
  assert(nodes.length === D.CHAPTERS.length, 'the map shows a spot for every chapter, start to finish — nothing hidden');
  assert(doc.querySelectorAll('#campaign-map .map-node.now').length === 1, 'exactly one spot is the current, playable one');
  assert(doc.querySelectorAll('#campaign-map .map-node.locked').length === D.CHAPTERS.length - 1,
    'every other spot is visibly present but locked on a fresh game');
  assert(doc.querySelectorAll('#campaign-map .map-node.done').length === 0, 'nothing is marked recovered yet');

  // each node hints its value/traits without a click — glyph + terrain icon are always in the markup
  const firstNode = nodes[0];
  assert(firstNode.querySelector('.mn-glyph'), 'a spot shows its state at a glance (number, lock, or check)');
  assert(firstNode.querySelector('.mn-traits').textContent.length > 0, 'a spot hints its terrain-driven traits without opening it');
  assert(firstNode.querySelector('title'), 'a spot exposes its full risk/traits detail on hover via a native tooltip');

  // a locked spot still shows a trait hint, just visibly dimmed (never fully hidden)
  const lockedNode = doc.querySelector('#campaign-map .map-node.locked');
  assert(lockedNode.querySelector('.mn-glyph').textContent === '🔒', 'a locked spot reads as locked, not just greyed out');
  assert(lockedNode.querySelector('.mn-traits').textContent.length > 0, 'a locked spot still hints at what it holds — locks gate access, not information');

  // clicking a locked spot refuses, with a clear reason, and does not start a chapter
  const flowBefore = E.getFlow();
  lockedNode.dispatchEvent(new window.Event('click', { bubbles: true }));
  await sleep(50);
  assert(E.current() === 's-hub', 'clicking a locked spot does not leave the hub');

  // clicking the "now" spot opens that chapter, same as the ordinary "prepare" button
  const nowNode = doc.querySelector('#campaign-map .map-node.now');
  nowNode.dispatchEvent(new window.Event('click', { bubbles: true }));
  await until(() => E.current() === 's-case', 6000, 'the current spot opens its chapter');
  assert(E.getFlow().chapter.id === D.CHAPTERS[0].id, 'the now-spot opens exactly the chapter it represents');

  // simulate finishing the prologue and reopening the hub — the map should shift by one
  S.servedChapterIds = [D.CHAPTERS[0].id];
  S.chapter = 1;
  window.__RD_SCREENS.showHub();
  await until(() => doc.querySelectorAll('#campaign-map .map-node.done').length === 1, 6000, 'map reflects a completed chapter');
  nodes = doc.querySelectorAll('#campaign-map .map-node');
  assert(nodes[0].classList.contains('done'), 'the finished spot is marked recovered');
  assert(nodes[0].querySelector('.mn-glyph').textContent === '✓', 'a recovered spot shows a check, not its number');
  assert(nodes[1].classList.contains('now'), 'progression moves the "now" marker to the next spot');
  assert(nodes[2].classList.contains('locked'), 'everything past the frontier stays locked');

  /* ================= THE ROOT-SLAYER'S TITLE PROGRESSION ================= */
  assert(D.ENEMIES.eraser.name === 'Jian Radicida', 'the revealed title is Jian Radicida');
  assert(/root-slayer/i.test(D.ENEMIES.eraser.note), 'his epithet, the Root-Slayer, is present in his description');
  assert(D.ENEMIES.eraser.raidName && D.ENEMIES.eraser.raidName !== D.ENEMIES.eraser.name,
    'his enforcers raid under a distinct name — he does not personally storm every ambush');
  assert(D.INTRO.some(l => /Lord Jian/.test(l) && !/Radicida/.test(l)),
    'the opening cinematic still knows him only as Lord Jian — the reveal has not happened yet');
  const ch7 = D.CHAPTERS.find(c => c.id === 'ch7');
  assert(/Radicida/.test(ch7.story) && /Verbum Ultimum/.test(ch7.story),
    'chapter seven\'s aftermath names both Jian Radicida and his final form, Verbum Ultimum');

  const boss = ch7;
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
  await until(() => !!MI._state(), 6000, 'boss mission start');
  const caption1 = doc.getElementById('mission-caption').textContent;
  assert(/Radicida/.test(caption1) && /root/i.test(caption1), 'the mission opens with his reveal — the Radicida name, tied to roots');

  MI._setProgress(MI.BOSS_CHORUS_AT);
  MI._updateBossPhase(0.03);
  await sleep(50);
  const chorusText = doc.getElementById('chorus-lede').textContent;
  assert(/Verbum Ultimum/.test(chorusText), 'the Chorus phase is explicitly framed as his final form, Verbum Ultimum');

  summary(errors);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
