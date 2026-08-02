/* test23 — PRESENTATION.
   The backdrop scene table, the ink filters, the impact layer and the music
   state machine. Sound in particular must never be able to take the game
   down: it is the most optional thing in the build. */
const { boot, sleep, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const $ = (s, r) => (r || doc).querySelector(s);
  const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));
  const E = window.__RD_ENG, FX = window.FX, A = E.Audio2;

  console.log('\n== every screen gets its own scene ==');
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  const scenes = ['valley','title','workshop','forge','road','archive','hall','trial'];
  const shapes = {};
  scenes.forEach(v => {
    E.buildBackdrop(host, v);
    shapes[v] = {
      layers: $$('.layer', host).length,
      lanterns: $$('.lantern', host).length,
      mist: $$('.mist', host).length,
      paths: $$('.layer svg path', host).map(p => p.getAttribute('d')).join('|')
    };
    assert($$('.paper-grain', host).length === 1, `${v}: paper grain present`);
  });
  const sigs = scenes.map(v => `${shapes[v].layers}/${shapes[v].lanterns}/${shapes[v].mist}`);
  assert(new Set(sigs).size >= 5,
    `the scenes are structurally distinct (${new Set(sigs).size} of ${scenes.length} silhouettes differ)`);
  assert(shapes.forge.lanterns > 0, 'the forge is lit by lanterns');
  assert(shapes.valley.lanterns === 0, 'the open valley is not');
  assert(shapes.forge.layers < shapes.title.layers, 'an interior has less distance than a vista');
  assert(shapes.title.mist >= shapes.forge.mist, 'the title carries more mist than the workshop');

  console.log('\n== the skyline is stable, not reshuffled every navigation ==');
  E.buildBackdrop(host, 'valley');
  const first = $$('.layer svg path', host).map(p => p.getAttribute('d')).join('|');
  E.buildBackdrop(host, 'valley');
  const second = $$('.layer svg path', host).map(p => p.getAttribute('d')).join('|');
  assert(first === second, 'the same scene draws the same ridges every time');
  E.buildBackdrop(host, 'road');
  const other = $$('.layer svg path', host).map(p => p.getAttribute('d')).join('|');
  assert(other !== first, 'a different scene draws different ridges');

  console.log('\n== ridges are brushed, not sawtoothed ==');
  assert(/C[\d.]/.test(first), 'ridge paths use cubic segments');
  assert(!/L\d+ \d+ L\d+ \d+ L/.test(first), 'and are not a chain of straight lines');
  assert(!!doc.getElementById('ink-defs'), 'the ink filter defs were injected');
  assert($$('#ink-defs filter').length === 3, 'three depth-graded ink filters');
  assert($$('.layer svg[filter]', host).length > 0, 'and the layers actually reference them');

  console.log('\n== the impact layer exists and is safe ==');
  ['shake','impact','pop'].forEach(fn => assert(typeof FX[fn] === 'function', `FX.${fn} is exported`));
  let threw = null;
  try {
    FX.shake(9, 200); FX.impact('#b5322b', 0.3, 150);
    FX.pop(doc.body, '+120'); FX.pop(null, 'x');
    FX.shake(5, 100); FX.shake(5, 100);          // overlapping shakes must not stack
  } catch (e) { threw = e; }
  assert(!threw, `the impact calls do not throw${threw ? ' — ' + threw.message : ''}`);
  await sleep(400);
  const frame = doc.getElementById('frame');
  assert(!frame.style.transform || frame.style.transform === '',
    'the frame transform is cleaned up after a shake');

  console.log('\n== the music is a state machine, and the road is not silent ==');
  assert(typeof A.setMood === 'function' && typeof A.getMood === 'function', 'moods are exported');
  const moods = ['calm','hub','flow','danger','boss','trial','urgent'];
  let mThrew = null;
  try { moods.forEach(m => { A.startMusic(); A.setMood(m); }); } catch (e) { mThrew = e; }
  assert(!mThrew, `every mood can be entered${mThrew ? ' — ' + mThrew.message : ''}`);
  A.setMood('flow');
  assert(A.getMood() === 'flow', 'the mood is readable');
  A.setMood('nonsense-mood');
  assert(A.getMood() === 'flow', 'an unknown mood is ignored rather than breaking the state');
  // entering the road must not stop the music any more
  E.go('s-mission', { instant: true });
  await sleep(120);
  assert(A.getMood() === 'flow', 'the road has its own mood instead of silence');
  E.go('s-hub', { instant: true });
  await sleep(120);
  assert(A.getMood() === 'hub', 'and the workshop has another');

  console.log('\n== sound can fail without taking the game with it ==');
  // replace the audio engine with one that throws on everything it is asked
  const hostile = function () {
    const boom = () => { throw new Error('audio is broken'); };
    const p = new Proxy({}, { get: () => boom });
    return { state: 'running', currentTime: 0, destination: p, sampleRate: 44100,
      resume: () => Promise.resolve(), createGain: boom, createOscillator: boom,
      createBiquadFilter: boom, createBuffer: boom, createBufferSource: boom };
  };
  const realCtx = window.AudioContext;
  window.AudioContext = window.webkitAudioContext = hostile;
  let sThrew = null;
  try {
    A.setMood('boss'); A.setMood('urgent');
    Object.keys(A.sfx).forEach(k => { try { A.sfx[k](); } catch (e) { sThrew = e; } });
    A.startMusic(); A.stopMusic();
  } catch (e) { sThrew = e; }
  window.AudioContext = window.webkitAudioContext = realCtx;
  assert(!sThrew, `a hostile audio engine never escapes into the game${sThrew ? ' — ' + sThrew.message : ''}`);

  console.log('\n== the new cues exist and are wired ==');
  ['trophy','chestRattle','chestOpen','relic','tock'].forEach(k =>
    assert(typeof A.sfx[k] === 'function', `sfx.${k} exists`));
  const src = require('fs').readFileSync('RemyDee_TheLostLexicon.html', 'utf8');
  ['sfx.tock','sfx.relic','sfx.trophy','sfx.chestOpen','sfx.chestRattle'].forEach(c => {
    // one definition plus at least one call site
    const n = src.split(c).length - 1;
    assert(n >= 2, `${c} has a caller (${n} references)`);
  });

  console.log('\n== reduced motion suppresses the loud things ==');
  FX.setReduced(true);
  const before = $$('.fx-pop').length;
  FX.pop(doc.body, '+1'); FX.shake(9, 200); FX.impact('#fff', 0.4, 100);
  assert($$('.fx-pop').length === before, 'no floating numbers under reduced motion');
  assert(!frame.style.transform, 'and no shake');
  FX.setReduced(false);

  host.remove();
  summary(errors);
})();
