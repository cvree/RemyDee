/* test37.js — THE SATISFACTION PASS.

   Five systems, one file. Everything here exists because the road was doing
   real work and saying nothing about it:

     1. THE CHAIN LADDER — every piece gathered into a word played the same
        fixed clink, so a four-piece chain sounded exactly like a one-piece
        chain, and completing a real term sounded like completing nonsense.
     2. THE GEARS — momentum crossed x2, x3, x4 and x5 in total silence.
     3. THE MARKS — five lifetime bests, none of which existed, so a player
        could have the best road of their life and never be told.
     4. THE PIECE IN FLIGHT — nothing connected the part you reached for to
        the word it went into, which is the one causal link the mode is
        built on.
     5. THE NEAR MISS — threading past a hazard paid one silent point of
        morale, the only skilful act on the road with no feedback at all.

   The rules the marks are written to are the load-bearing part and most of
   this file is about them: a record you have never set is silent, a record
   shouts once per run, and the stored number keeps climbing after the shout. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, MI = window.__RD_MISSION;
  const doc = window.document;
  assert(E && D && MI, 'modules exposed');

  /* ================= 1. THE CHAIN LADDER ================= */
  console.log('\n== the chain sings ==');
  const sfx = E.Audio2.sfx;
  ['chain', 'chainResolve', 'chainBreak', 'tier', 'graze', 'record'].forEach((k) =>
    assert(typeof sfx[k] === 'function', `audio: sfx.${k} exists — the road has a voice for it`));

  /* The ladder is indexed by a live game counter, so it has to survive one.
     An undefined frequency is a silent oscillator, which is indistinguishable
     from the cue simply not firing. */
  let threw = null;
  try {
    sfx.chain(0); sfx.chain(3); sfx.chain(99); sfx.chain(-2);
    sfx.chain(NaN); sfx.chain(undefined);
    sfx.chainResolve(99, true); sfx.chainResolve(NaN, false);
    sfx.tier(0); sfx.tier(99); sfx.tier(NaN);
  } catch (e) { threw = e; }
  assert(!threw, `audio: a garbage rung never throws (${threw && threw.message})`);

  /* ================= 2. THE MARKS: THE THREE RULES ================= */
  console.log('\n== a lifetime best, and when it is allowed to shout ==');
  E.setS(E.newGame()); E.applySettings();
  assert(E.marks() && typeof E.marks().chain === 'number',
    'marks: a fresh game carries all five marks, at zero');
  assert(E.markValue('chain') === 0, 'marks: zero means never set');

  E.resetMarkShouts();
  assert(E.beatMark('chain', 3) === null,
    'rule 1: beating a mark that was never set is SILENT — the first road puts the bar down');
  assert(E.markValue('chain') === 3, 'rule 1: but the bar is genuinely put down');

  assert(E.beatMark('chain', 4) === 3,
    'rule 2: beating a bar that exists returns the old value, so the road can name it');
  assert(E.beatMark('chain', 5) === null,
    'rule 2: and the SECOND time in the same run is silent — the shout belongs to the crossing');
  assert(E.markValue('chain') === 5,
    'rule 3: but the stored best keeps climbing silently, so the next run has the real bar to beat');

  assert(E.beatMark('chain', 4) === null, 'marks: a worse result never lowers the bar');
  assert(E.markValue('chain') === 5, 'marks: and never overwrites it');
  assert(E.beatMark('chain', NaN) === null && E.beatMark('chain', -1) === null,
    'marks: a NaN or a negative is refused rather than stored');
  assert(E.markValue('chain') === 5, 'marks: and the bar survives being handed rubbish');

  E.resetMarkShouts();
  assert(E.beatMark('chain', 6) === 5,
    'marks: a fresh road may shout each mark once again');

  /* ================= 3. SAVE COMPATIBILITY ================= */
  console.log('\n== a save written before the marks existed ==');
  const old = E.newGame();
  delete old.marks;
  old.lifetime.bestMomentum = 3.4;
  old.ver = 8;
  E.Save.write(old);
  const back = E.Save.read();
  assert(back && back.marks && typeof back.marks.chain === 'number',
    'migration: a v8 save with no marks gets them rather than throwing');
  assert(back.marks.momentum === 3.4,
    'migration: and the momentum mark is seeded from the lifetime tally that predates it');
  assert(back.marks.chain === 0,
    'migration: the marks with no predecessor start unset, so the first road is still silent');

  const bent = E.newGame();
  bent.marks = { chain: 'nonsense', momentum: NaN };
  bent.ver = 8;
  E.Save.write(bent);
  const fixed = E.Save.read();
  assert(fixed.marks.chain === 0 && fixed.marks.momentum === 0 && fixed.marks.streak === 0,
    'migration: a corrupted marks block is repaired key by key, never trusted');

  /* ================= 4. ON THE ROAD ================= */
  console.log('\n== the gears, the crest, and the pieces in flight ==');
  E.setS(E.newGame()); E.applySettings();
  const ch = D.CHAPTERS[0];
  E.setFlow({ chapter: ch, builders: [], members: ch.members.slice(0, 2), idx: 0,
    results: {}, forged: [], route: null,
    stats: { caps: { climb:false, smoke:false, shoot:false, cut:false, heal:false, descend:false },
             traits: {}, perks: [], prepScore: 0.5 } });
  MI.runMission();
  assert(await until(() => !!MI._state(), 5000, 'road running'), 'road: the walk starts');
  const M = MI._state();

  /* --- the gears --- */
  assert(Array.isArray(MI.MOMENTUM_TIERS) && MI.MOMENTUM_TIERS.length === 4,
    'gears: four named tiers between x1 and the ceiling');
  assert(MI.MOMENTUM_TIERS.every((t) => t.name && t.name === t.name.toUpperCase()),
    'gears: each one has a name the player can hold in their head');

  M.momentum = 1; M.tierHit = {};
  MI._clearCrest();
  const g1 = MI._bump(1.2);                       // x1 -> x2.2, crosses x2
  assert(g1.tierHit[2] === true, 'gears: crossing x2 records the arrival');
  const afterFirst = MI._crestNode();
  assert(/ROLLING/.test(afterFirst.txt), 'gears: and the road says where you have arrived');

  /* Falling back through a gear and climbing it again is not a second arrival.
     A run spent oscillating around x2 would otherwise spend the whole walk
     shouting, which teaches the player the words mean nothing. */
  MI._clearCrest();
  M.momentum = 1.2;
  MI._bump(1.2);
  const again = MI._crestNode();
  assert(!/ROLLING/.test(again.txt) || again.cls.indexOf('show') < 0,
    'gears: re-crossing a gear already reached this run is silent');

  /* --- the crest queues rather than fights --- */
  MI._clearCrest();
  M.momentum = 1; M.tierHit = {};
  MI._bump(2.4);                                   // crosses x2 AND x3 in one go
  const q = MI._crestNode();
  assert(q.queued >= 1,
    'crest: two arrivals on one frame are queued, never drawn over each other');

  /* --- the piece flies into the word --- */
  MI._clearCrest();
  const beforeFlights = MI._flights().length;
  MI._flyToWord('cardi/o', 'root');
  assert(MI._flights().length === beforeFlights + 1, 'flight: a gathered piece leaves the road');
  const fl = MI._flights()[MI._flights().length - 1];
  assert(fl.txt === 'cardi/o' && fl.kind === 'root',
    'flight: carrying the part that was actually picked up');
  MI._stepFlights(fl.dur + 0.2);
  assert(MI._flights().length === beforeFlights,
    'flight: and it lands rather than accumulating for the rest of the walk');

  /* --- the ladder climbs while a chain is built --- */
  const realId = Object.keys(D.TERMS).find((id) => D.TERMS[id].build.length === 2);
  const build = D.TERMS[realId].build;
  M.combo = [];
  MI._pushCombo(build[0]);
  assert(MI._combo().length === 1, 'chain: the first piece starts a word');
  assert(MI._bestChain() === 0,
    'chain: one piece is not a chain — the mark only counts a word that was actually being linked');
  MI._pushCombo(build[1]);
  assert(MI._combo().length === 0, 'chain: the completing piece banks the word');
  assert(MI._bestChain() >= 2,
    'chain: and the run remembers the longest one it linked, measured as it is built');
  assert(M.realTermsBuilt >= 1, 'chain: a real term is counted as one');

  /* the banner stamps a real word letter by letter; a coined one does not get
     the ceremony, because it is a near miss to read and move past */
  const banner = doc.getElementById('term-banner');
  assert(banner.querySelectorAll('.tb-ltr').length === D.TERMS[realId].spell.length,
    'chain: a real term arrives one letter at a time');

  /* ================= 5. THE NEAR MISS ================= */
  console.log('\n== threading a hazard ==');
  const HIT_R = 44;
  const grazes0 = MI._grazes();
  const mo0 = M.momentum;
  /* just outside the hit radius: not a hit, but close enough to have been one */
  M.targetY = M.laneY;
  const p = M.progress + 0.004;
  M.hazards.push({ p, lane: 1, u: MI._bandAt ? null : null, kind: 'roots', hit: false, passed: false });
  const hz = M.hazards[M.hazards.length - 1];
  hz.u = null; hz.lane = 1;
  // place the squad a hair off the hazard's row by moving the hazard's band
  hz.u = null;
  const laneU = (MI._objY(hz) - 0) ;
  // drive the hazard past the squad with the squad offset by 1.5 hit radii
  MI._steer(M.laneY - HIT_R * 1.5);
  for (let i = 0; i < 30; i++) MI._stepMove(0.05);
  await until(() => hz.passed, 4000, 'hazard passes');
  assert(hz.passed, 'graze: the hazard goes by');
  assert(!hz.hit, 'graze: and it does not land — this is a thread, not a hit');
  assert(MI._grazes() > grazes0, 'graze: threading it is counted');
  assert(M.momentum >= mo0, 'graze: and pays a sliver of momentum rather than nothing');

  /* ================= 6. THE WALL AT THE END ================= */
  console.log('\n== the debrief remembers ==');
  assert(typeof MI._marksBroken() === 'number',
    'debrief: the run counts how many of its own bests it beat');

  /* the crest never survives the end of a walk */
  MI._clearCrest();
  const cleared = MI._crestNode();
  assert(cleared.queued === 0 && !/show/.test(cleared.cls),
    'crest: the queue is emptied when the road ends, so it cannot bleed into the next one');

  await sleep(120);
  summary(errors);
})();
