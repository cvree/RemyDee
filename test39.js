/* test39.js — THE WALK, VAMPED.

   The road had all its systems and too much of its furniture, and its
   feedback was saying the wrong things with the wrong body. Five changes,
   one file:

     1. SHAKE IS DAMAGE, AND ONLY DAMAGE. Flow, a gear change, a lifetime
        best, a real medical term and an item landing all used to arrive as
        a screen shake — one of them washed in cinnabar, the colour the game
        uses for a wound. The camera has a second verb now (swell: a lean-in
        with a warm radial bloom) and every good moment on the road uses it.
     2. THE CURSOR IS FOR STEERING. Hover-to-study is gone — a card that
        followed the pointer through the middle of the playfield, on the one
        hand the player steers with. Gathering a part you have never met
        READS it instead, and pays more for it than hovering ever did.
     3. A WRONG RUNE GATE IS A WALL. It cost 45% of momentum and five
        stamina, on a road where one chained word paid both back inside ten
        seconds. It craters momentum, scatters the chain in hand, takes real
        stamina and bars the road for two seconds.
     4. THE THING YOU MADE LANDS. Spending a forged charge gets a shockwave,
        a hold, and the piece naming itself and its tier — scaled by that
        tier, so a masterwork visibly is one.
     5. LESS ON THE SCREEN. One reach ring instead of every reach ring, one
        voice per event instead of four, and the pops step clear of each
        other rather than smearing.
*/
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION, FX = window.FX;
  assert(E && D && P && MI && FX, 'modules exposed');

  /* ================= 1. THE CAMERA HAS TWO VERBS ================= */
  console.log('\n== a good moment does not shake the frame ==');
  assert(typeof FX.swell === 'function', 'the camera has a positive verb');
  assert(typeof FX.bloom === 'function', 'and a positive wash to go with it');
  // both must survive being called with reduced motion on, and leave no transform
  FX.setReduced(true);
  FX.swell(3, 400); FX.shake(20, 400); FX.bloom('rgba(255,255,255,.5)', 0.5, 200);
  assert(!window.document.getElementById('frame').style.transform,
    'reduced motion means the frame is never moved at all');
  FX.setReduced(false);

  const S = E.newGame(); E.setS(S); E.applySettings();

  const ch = D.CHAPTERS[2];
  const mk = (bpId, name, grants, traits, qtier) => ({
    id: bpId + '_t39', bpId, name, genName: name, icon: bpId, gear: bpId, grants,
    material: 'basic', variant: null, reagent: null, perks: [], bonus: null,
    quality: qtier === 'masterwork' ? 1 : 0.6, qtier, traits, assignedTo: null
  });
  const flow = { chapter: ch, builders: [], members: ch.members.slice(0, 3), idx: 0, results: {}, forged: [], route: null, stats: {} };
  flow.forged = [
    mk('blade', 'Ashfold Cleaver', ['cut'], { power: 2 }, 'masterwork'),
    mk('smoke', 'Pleatshell', ['smoke'], { stealth: 2 }, 'fine'),
    mk('kit', 'Field kit', ['heal'], { recover: 2 }, 'ok')
  ];
  E.setFlow(flow);
  flow.roadPlan = MI.buildRoadPlan(flow);
  P._depart();
  await until(() => !!MI._state(), 6000, 'mission start');
  const M = MI._state();

  /* ================= 2. GATHERING IS READING ================= */
  console.log('\n== the cursor steers; the road teaches ==');
  assert(!window.document.getElementById('study-card'), 'the hover card is gone from the DOM');
  assert(!/Hover a part/i.test(window.document.body.innerHTML), 'and nothing on screen still asks for a hover');

  const partId = Object.keys(D.PARTS)[5];
  const studied0 = E.studiedCount(), mo0 = MI._momentum();
  const res = MI._study(partId);
  assert(res.studied === studied0 + 1, 'gathering a part new to the player reads it into the Lexicon');
  assert(MI._momentum() > mo0, 'meeting a new word nudges momentum');
  assert(M.newWordT > 0, 'and rings the road so the player sees it land');
  const again = MI._study(partId);
  assert(again.studied === studied0 + 1, 'a part already read is not read again — affinity counts distinct words');

  /* ================= 3. THE ITEM MOMENT ================= */
  console.log('\n== the thing you made, landing ==');
  MI._spawnHazardAt(M.progress + 0.06, 1, 'rock');
  MI._use('strike');
  assert(M.itemFlare && M.itemFlare.name === 'Ashfold Cleaver',
    'spending a charge announces the piece by the name the player gave it');
  const masterHeft = M.itemFlare.heft;
  assert(masterHeft > 1.3, 'a masterwork lands with real heft');
  assert(M.itemFlare.head && /cut from the road/.test(M.itemFlare.head),
    'and says what it actually did, not just that it did something');
  await sleep(60);
  MI._use('mend');
  assert(M.itemFlare.kind === 'mend', 'mend gets a moment of its own');
  assert(M.itemFlare.heft < masterHeft, 'an ok-tier kit lands lighter than a masterwork blade — the bench choice shows');
  await sleep(60);
  MI._use('vanish');
  assert(M.itemFlare.kind === 'vanish', 'so does vanish');
  // a spent charge is a locked door, not silence
  M.abilities.strike = 0;
  MI._use('strike');
  assert(/No <b>Strike<\/b> left/.test(window.document.getElementById('mission-caption').innerHTML),
    'pressing an empty charge says why nothing happened');

  /* ================= 4. A WRONG GATE IS A WALL ================= */
  console.log('\n== the thinking beat has teeth ==');
  M.forge.smokeSaves = 0;                  // the smoke reprieve is tested elsewhere
  M.momentum = 3.4; M.stats.stamina = 90; M.stats.power = 90;
  MI._setProgress(0.4);                    // far enough along to be thrown back from
  let g = MI._forceGate();
  assert(g, 'a rune gate opened');
  const rootId = Object.keys(D.PARTS).find(id => D.PARTS[id].kind === 'root');
  MI._pushCombo(rootId);
  assert(MI._combo().length === 1, 'a word is half-built in the squad\'s hands');
  const wrong = [1, 2].find(l => l !== g.ansLane && g.laneIds[l]);
  MI._setLane(wrong);
  const moBefore = MI._momentum(), stBefore = M.stats.stamina, pBefore = M.progress;
  MI._resolveGate();
  assert(MI._momentum() < moBefore * 0.55,
    `a wrong gate craters momentum (${moBefore.toFixed(2)} → ${MI._momentum().toFixed(2)})`);
  assert(stBefore - M.stats.stamina >= 12, 'and takes real stamina, not a token five points');
  assert(MI._combo().length === 0, 'the word in hand is scattered on the stones');
  assert(M.gateSlamT > 1, 'the road is barred for a couple of seconds afterwards');
  assert(M.progress < pBefore, 'they are physically thrown back down the road');
  assert(M.streak === 0 && !M.flow, 'and the streak — and any flow — ends with it');

  /* the right answer is still the good moment, and pays like one */
  await sleep(1100);
  M.gate = null;
  M.momentum = 2.0;
  g = MI._forceGate();
  MI._setLane(g.ansLane);
  const moRight = MI._momentum(), stamRight = M.stats.stamina;
  MI._resolveGate();
  assert(MI._momentum() > moRight, 'a right gate pays momentum');
  assert(M.stats.stamina >= stamRight, 'and never costs the squad anything');
  assert(M.gate.flareOk && M.gate.burst === 1, 'the arch itself bursts open on the road');

  /* ================= 5. LESS ON THE SCREEN ================= */
  console.log('\n== one voice per event ==');
  /* Pops step clear of each other rather than smearing, and the road never
     carries more of them than can be read. Ten new words in one frame is what
     a Surge through a cluster actually looks like. */
  M.pops.length = 0;
  const fresh = Object.keys(D.PARTS).filter(id => !(E.S().studied || []).includes(id)).slice(0, 10);
  assert(fresh.length === 10, 'the Lexicon has ten unread parts to gather in one breath');
  fresh.forEach(id => MI._study(id));
  assert(M.pops.length <= 6, `no more than six pops are ever on the road at once (${M.pops.length})`);
  const ys = new Set(M.pops.map(p => Math.round(p.y)));
  assert(ys.size === M.pops.length, 'and no two of them are drawn on top of each other');

  // the chain readout is a stake, not an essay
  MI._pushCombo(rootId);
  const cb = window.document.getElementById('combo-build').textContent;
  assert(/ink at stake/.test(cb), 'the chain says what is at stake');
  assert(!/a hit now loses it/.test(cb), 'and no longer explains it in a sentence under a moving road');

  assert(errors.length === 0, 'no window errors: ' + (errors.join(' | ') || 'clean'));
  summary(errors);
})();
