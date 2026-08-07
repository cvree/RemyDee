/* Shared jsdom harness for headless game tests (test.js–test7.js pattern):
   mocks AudioContext / canvas 2d / vibrate, strips CDN scripts, counts window errors. */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

function mockCtx() {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return { width: 560, height: 414 };  // 360 work area + 54px scrap apron
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (typeof k === 'string') {
        if (!(k in t)) t[k] = () => {};
        return t[k];
      }
      return undefined;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

async function boot(file) {
  let html = fs.readFileSync(file || 'RemyDee_TheLostLexicon.html', 'utf8');
  html = html.replace(/<script[^>]*\bsrc=[^>]*><\/script>/gi, ''); // drop CDN libs (all feature-detected)
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(String(e && e.message || e)));
  vc.on('error', (msg) => errors.push(String(msg)));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://localhost/',
    virtualConsole: vc,
    beforeParse(window) {
      window.AudioContext = window.webkitAudioContext = function () {
        const node = { connect() { return node; }, disconnect() {}, start() {}, stop() {},
          gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} },
          frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} },
          playbackRate: { value: 1 }, buffer: null, type: '', Q: { value: 0 }, detune: { value: 0 } };
        return { state: 'running', currentTime: 0, destination: node, sampleRate: 44100,
          resume: () => Promise.resolve(), suspend: () => Promise.resolve(), close: () => Promise.resolve(),
          createGain: () => node, createOscillator: () => node, createBiquadFilter: () => node,
          createBuffer: () => ({ getChannelData: () => new Float32Array(44100) }),
          createBufferSource: () => node, createDynamicsCompressor: () => Object.assign({}, node,
            { threshold:{value:0}, knee:{value:0}, ratio:{value:0}, attack:{value:0}, release:{value:0} }) };
      };
      window.HTMLCanvasElement.prototype.getContext = function () { return mockCtx(); };
      window.Element.prototype.animate = function (frames, opts) {
        const a = { cancel() {}, finished: Promise.resolve(), onfinish: null };
        const dur = (typeof opts === 'number' ? opts : (opts && opts.duration)) || 0;
        setTimeout(() => { if (a.onfinish) a.onfinish(); }, Math.min(dur, 60));
        return a;
      };
      window.navigator.vibrate = () => true;
      window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      window.scrollTo = () => {};
      window.addEventListener('error', (e) => errors.push(String(e.message)));
    }
  });
  // let boot() + loader timeout run
  await new Promise((r) => setTimeout(r, 700));
  /* The Trials are hand-skill challenges that sit in the middle of the chest,
     cache and forge flows. jsdom has no hands, so every trial resolves at a
     clean grade by default and the suites drive the flows around them. A test
     that wants to prove a grade CHANGES an outcome sets its own tier. */
  if (dom.window.__RD_MG && dom.window.__RD_MG.setAuto) dom.window.__RD_MG.setAuto(2);
  return { dom, window: dom.window, errors };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 5000)) {
    try { if (fn()) return true; } catch (e) {}
    await sleep(60);
  }
  console.error('  timeout waiting for', label || fn.toString().slice(0, 60));
  return false;
}

let passCt = 0, failCt = 0;
function assert(cond, label) {
  if (cond) { passCt++; console.log('  ok  -', label); }
  else { failCt++; console.error('  FAIL -', label); }
}
function summary(errors) {
  console.log(`\nwindow errors: ${errors.length}`);
  errors.slice(0, 10).forEach((e) => console.error('  window error:', e));
  console.log(failCt === 0 && errors.length === 0 ? `PASS (${passCt} assertions)` : `FAIL (${failCt} failed, ${errors.length} window errors)`);
  process.exit(failCt === 0 && errors.length === 0 ? 0 : 1);
}

module.exports = { boot, sleep, until, assert, summary };
