/* test21 — THE LIEUTENANTS.
   Three mid-campaign bosses. Each must actually pressure the player, be
   beatable by knowing things, and be impossible to lose a run to outright. */
const { boot, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const MI = window.__RD_MISSION, D = window.__RD_DATA, E = window.__RD_ENG;
  const { PARTS, CHAPTERS } = D;

  console.log('\n== the roster ==');
  const L = MI.LIEUTENANTS;
  const chIds = CHAPTERS.map(c => c.id);
  assert(Object.keys(L).length === 3, 'three lieutenants');
  assert(Object.keys(L).every(c => chIds.includes(c)), 'each is assigned to a real chapter');
  assert(!L.ch7, 'the finale chapter is left to Radicida alone');
  const modes = Object.keys(L).map(k => L[k].mode);
  assert(new Set(modes).size === 3, `each attacks a different thing (${modes.join(', ')})`);
  let incomplete = 0;
  Object.keys(L).forEach(k => {
    const x = L[k];
    ['id','name','title','mode','open','onset','meter','strike','reel','hurt'].forEach(f => {
      if (!x[f]) { incomplete++; console.error('  missing', f, 'on', k); }
    });
    if (!(x.hurt.stamina < 0 || x.hurt.morale < 0 || x.hurt.safety < 0)) {
      incomplete++; console.error('  a strike that does not hurt:', k);
    }
  });
  assert(incomplete === 0, 'every lieutenant has a full script and a real bite');

  console.log('\n== lieutenantFor picks the right one ==');
  assert(MI.lieutenantFor({ chapter: { id: 'ch2' } }).id === 'praefixa', 'ch2 → Praefixa');
  assert(MI.lieutenantFor({ chapter: { id: 'ch4' } }).id === 'terminus', 'ch4 → Terminus');
  assert(MI.lieutenantFor({ chapter: { id: 'ch6' } }).id === 'bilingua', 'ch6 → Bilingua');
  assert(MI.lieutenantFor({ chapter: { id: 'ch1' } }) === null, 'ch1 has none');
  assert(MI.lieutenantFor({ chapter: { id: 'ch7' } }) === null, 'ch7 has none — Radicida holds it');
  assert(MI.lieutenantFor(null) === null, 'a null flow does not throw');
  assert(MI.lieutenantFor({}) === null, 'a flow with no chapter does not throw');

  console.log('\n== Bilingua alternates tongues, and both are answerable ==');
  const wants = [0,1,2,3,4,5].map(n => MI.bilinguaWants({ cuts: n }));
  assert(wants.join(',') === 'Gk,L,Gk,L,Gk,L', 'she alternates Greek and Latin');
  const gk = Object.keys(PARTS).filter(p => PARTS[p].lang === 'Gk');
  const la = Object.keys(PARTS).filter(p => PARTS[p].lang === 'L');
  assert(gk.length >= 3, `enough Greek parts to fill a gate (${gk.length})`);
  assert(la.length >= 3, `enough Latin parts to fill a gate (${la.length})`);

  console.log('\n== both prefix and suffix pools can fill a three-lane gate ==');
  ['prefix','suffix'].forEach(k => {
    const n = Object.keys(PARTS).filter(p => PARTS[p].kind === k).length;
    assert(n >= 3, `${n} ${k}es available`);
  });

  console.log('\n== a fight: pressure climbs, right answers push it back ==');
  // drive a synthetic ch2 road
  const ch2 = CHAPTERS.find(c => c.id === 'ch2');
  const flow = { chapter: ch2, builders: [], members: ch2.members.slice(0, 3), idx: 0,
                 results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flow);
  MI.runMission();
  await new Promise(r => setTimeout(r, 700));
  let B = MI._boss();
  assert(!!B && !!B.lt, 'a lieutenant took the field on chapter two');
  assert(B.lt.id === 'praefixa', 'and it is the right one');
  // it starts at zero and climbs on its own, so by the time the road has been
  // running for a moment it is low but no longer exactly empty
  assert(B.erosion >= 0 && B.erosion < 0.2, `the meter starts near empty (${B.erosion.toFixed(3)})`);

  // let the clock run: the meter must climb on its own
  for (let i = 0; i < 40; i++) MI._updateLieutenant(0.05);
  B = MI._boss();
  assert(B.erosion > 0, `pressure climbs unattended (${B.erosion.toFixed(2)})`);
  const peak = B.erosion;

  // a correct answer must push it back
  MI._pressLieutenant(0.3, false);
  B = MI._boss();
  assert(B.erosion < peak, `a right answer pushes it back (${peak.toFixed(2)} → ${B.erosion.toFixed(2)})`);

  console.log('\n== it can be felled, and only by being right ==');
  for (let i = 0; i < 12; i++) MI._pressLieutenant(0.5, true);
  B = MI._boss();
  assert(B.felled === true, 'enough correct answers drive the lieutenant off');
  assert(B.erosion === 0, 'and the meter is emptied');
  const already = B.cuts;
  MI._updateLieutenant(5);
  B = MI._boss();
  assert(B.erosion === 0, 'a felled lieutenant stops applying pressure');
  MI._pressLieutenant(0.5, true);
  assert(MI._boss().cuts === already, 'and stops accepting hits');

  console.log('\n== a strike hurts but can never end the run ==');
  const ch6 = CHAPTERS.find(c => c.id === 'ch6');
  const flow2 = { chapter: ch6, builders: [], members: ch6.members.slice(0, 3), idx: 0,
                  results: {}, forged: [], route: null, stats: {} };
  E.setFlow(flow2);
  MI.runMission();
  await new Promise(r => setTimeout(r, 700));
  const M0 = MI._dbg();
  const before = M0.stats.stamina;
  // run the meter to overflow repeatedly, answering nothing at all
  let strikes = 0;
  for (let i = 0; i < 4000; i++) {
    const prev = MI._boss().erosion;
    MI._updateLieutenant(0.05);
    if (MI._boss().erosion < prev) strikes++;
  }
  assert(strikes >= 3, `the meter overflowed repeatedly (${strikes} strikes)`);
  assert(MI._boss().erosion <= 1, 'the meter never exceeds full');
  assert(MI._boss().erosion >= 0, 'and never goes negative');
  const M1 = MI._dbg();
  assert(M1.stats.stamina < before, 'strikes genuinely cost the squad');
  assert(isFinite(M1.stats.stamina) && !isNaN(M1.stats.stamina), 'stamina stays a real number');
  assert(M1.stats.stamina >= 0, 'stamina never goes negative');
  assert(isFinite(M1.momentum) && M1.momentum >= 1, `momentum stays sane (${M1.momentum})`);

  console.log('\n== a lieutenant road can actually be finished ==');
  // The road holds at BOSS_CHORUS_AT (0.90) so Radicida's Chorus can play before
  // the waystation. That hold was keyed on `M.boss` existing at all, so the
  // moment lieutenants started setting M.boss, chapters two, four and six could
  // never arrive — a silent soft-lock on three of the eight chapters.
  const ch2b = CHAPTERS.find(c => c.id === 'ch2');
  E.setFlow({ chapter: ch2b, builders: [], members: ch2b.members.slice(0, 3), idx: 0,
    results: {}, forged: [], route: null,
    stats: { tot:{stamina:5,safety:4,speed:4,morale:5,weather:3,health:3},
             prepScore:0.6, caps:{}, overall:0.6, shortfalls:[], termScore:0.7 } });
  MI.runMission();
  await new Promise(r => setTimeout(r, 700));
  const Mr = MI._dbg();
  assert(!!(Mr.boss && Mr.boss.lt), 'the lieutenant road is running');
  Mr.gate = null; Mr.paused = false; Mr.questionOpen = false; Mr.progress = 0.995;
  const doc = window.document;
  const t0 = Date.now();
  while (Date.now() - t0 < 12000 && !doc.querySelector('#s-result').classList.contains('active')) {
    await new Promise(r => setTimeout(r, 100));
  }
  assert(doc.querySelector('#s-result').classList.contains('active'),
    'a lieutenant road reaches the waystation and the result screen');
  const Mend = MI._dbg();
  assert(!Mend || Mend.progress >= 1 || Mend.done, 'progress was never capped below the destination');

  console.log('\n== the finale is untouched ==');
  assert(MI.isBossRoad({ chapter: { id: 'ch7' } }) === true, 'ch7 is still the boss road');
  assert(MI.isBossRoad({ chapter: { id: 'ch2' } }) === false, 'a lieutenant road is not the boss road');

  summary(errors);
})();
