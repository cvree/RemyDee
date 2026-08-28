/* browsercheck.js — the two things jsdom cannot see.

   `test40.js` reads the stylesheet and proves what the CSS *says*. It cannot
   prove what the browser *does*: jsdom has no layout, so it cannot tell you that
   a control is 40px tall after five media queries and a flex direction have
   finished arguing, and it cannot tell you that turning a settings row into a
   column silently turned `flex:0 0 58px` from a width into a height.

   Both of those were real, and both were found here rather than in a suite.

   Run:  node browsercheck.js            # measure, report, exit non-zero on a fault
         node browsercheck.js --shots    # also write PNGs of every screen to ./shots

   It uses the preinstalled Chromium, so it works with the CDN blocked — which is
   the path every player on a locked-down network gets anyway.
*/
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FILE = 'file://' + path.resolve('RemyDee_TheLostLexicon.html');
const WANT_SHOTS = process.argv.includes('--shots');
const SHOT_DIR = path.resolve('shots');

/* Every control the player can hit. Kept in one place so a new one can be added
   here and measured everywhere at once. */
const CONTROLS = [
  '.btn', '.icon-btn', '.seg-btn', '.rec-tab', '.switch', '.tag.filter',
  '.small-btn', '.variant-btn', '.support-btn', '.decode-opt', '.trial-opt',
  '.mm-opt', '.sp-seal', '.reagent-chip', '.rp-opt'
].join(',');

let faults = 0;
const fail = (m) => { faults++; console.error('  FAULT -', m); };
const ok = (m) => console.log('  ok  -', m);

/* Boot the game to a playable hub. `newGame` is the same entry the suites use. */
async function toHub(page) {
  await page.goto(FILE);
  await page.waitForTimeout(1600);
  await page.evaluate(() => {
    const E = window.__RD_ENG;
    E.setS(E.newGame()); E.applySettings();
    window.__RD_SCREENS.showHub();
  });
  await page.waitForTimeout(900);
}

/* Measure every visible control on the page as it stands. */
const measure = (page) => page.evaluate((sel) => {
  return [...document.querySelectorAll(sel)]
    .filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
    .map(e => {
      const r = e.getBoundingClientRect();
      return { cls: e.className.toString().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
    })
    .filter(x => x.w > 0 && x.h > 0);
}, CONTROLS);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  if (WANT_SHOTS && !fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR);

  /* ---- 1. the 44px floor, on a real coarse-pointer device ---- */
  console.log('\n1. every control clears 44x44 on a touch screen');
  const touch = await browser.newContext({ ...devices['iPhone 13'], isMobile: true, hasTouch: true });
  const tp = await touch.newPage();
  const terrs = []; tp.on('pageerror', e => terrs.push(String(e)));
  await toHub(tp);

  const screens = [
    ['hub', async () => {}],
    ['settings', async () => { await tp.evaluate(() => window.__RD_SCREENS.openSettings()); }],
    ['lexicon', async () => {
      await tp.evaluate(() => { const c = document.getElementById('settings-close'); if (c) c.click(); });
      await tp.waitForTimeout(300);
      await tp.evaluate(() => window.__RD_SCREENS.openGloss());
    }],
  ];
  const small = [];
  for (const [name, go] of screens) {
    await go(); await tp.waitForTimeout(700);
    if (WANT_SHOTS) await tp.screenshot({ path: `${SHOT_DIR}/touch-${name}.png` });
    (await measure(tp)).filter(c => c.h < 44 || c.w < 44)
      .forEach(c => small.push(`${name}: .${c.cls} ${c.w}x${c.h}`));
  }
  if (small.length) small.forEach(fail); else ok('nothing on the hub, the settings card or the Lexicon is under a thumb');
  if (terrs.length) fail('window errors on touch: ' + terrs.slice(0, 3).join(' / '));
  else ok('and the touch pass boots clean');
  await touch.close();

  /* ---- 2. no control gets stretched by a layout it did not expect ---- */
  console.log('\n2. no control is deformed by its container');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await toHub(page);

  /* The latch is the canary: it is the one control whose flex-basis means
     different things in a row and in a column, which is exactly how it ended up
     58px tall on a phone with its bolt in the corner. */
  for (const [label, w, h] of [['desktop', 1440, 900], ['tablet', 820, 1180], ['phone', 390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => window.__RD_SCREENS.openSettings());
    await page.waitForTimeout(600);
    const latch = await page.evaluate(() => {
      const s = document.querySelector('#settings-body .switch');
      if (!s) return null;
      const r = s.getBoundingClientRect();
      const bolt = s.querySelector('i').getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), bh: Math.round(bolt.height) };
    });
    if (!latch) { fail(`${label}: no latch found in settings`); continue; }
    // the bolt has to fill its channel — if the track grew and the bolt did not,
    // the track was stretched by something that is not the control's own rule
    if (latch.h > latch.w) fail(`${label}: the latch is taller than it is wide (${latch.w}x${latch.h}) — its flex-basis became a height`);
    else if (latch.bh < latch.h - 12) fail(`${label}: the bolt (${latch.bh}px) does not fill its ${latch.h}px channel`);
    else ok(`${label}: the latch is ${latch.w}x${latch.h} with a ${latch.bh}px bolt`);
    if (WANT_SHOTS) await page.screenshot({ path: `${SHOT_DIR}/settings-${label}.png` });
    await page.evaluate(() => { const c = document.getElementById('settings-close'); if (c) c.click(); });
    await page.waitForTimeout(300);
  }

  /* ---- 3. nothing overflows the card it lives in ---- */
  console.log('\n3. no control is cut off by the card it lives in');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__RD_SCREENS.openSettings());
  await page.waitForTimeout(700);
  const clipped = await page.evaluate(() => {
    const card = document.querySelector('#modal-settings .modal-card');
    if (!card) return ['no settings card'];
    const cr = card.getBoundingClientRect();
    return [...card.querySelectorAll('.seg-btn,.btn,.switch,input[type=range]')]
      .filter(e => e.offsetParent !== null)
      .filter(e => { const r = e.getBoundingClientRect(); return r.right > cr.right + 1 || r.left < cr.left - 1; })
      .map(e => e.className.toString() + ' (' + (e.textContent || '').trim().slice(0, 16) + ')');
  });
  if (clipped.length) clipped.forEach(c => fail('runs past the edge of the settings card: ' + c));
  else ok('the settings card holds all of its own controls on a 390px phone');

  /* ---- 4. the ranks are actually different sizes ---- */
  console.log('\n4. the three button ranks are visibly three sizes');
  await page.setViewportSize({ width: 1440, height: 900 });
  /* Begin and Continue trade ranks depending on whether a save exists, so the
     save is cleared first — otherwise this measures Begin after it has correctly
     stepped down, and reports the hierarchy as broken when it is working. */
  await page.evaluate(() => { window.__RD_ENG.Save.clear(); window.__RD_SCREENS.showTitle(); });
  await page.waitForTimeout(800);
  const ranks = await page.evaluate(() => {
    const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
    return { lg: h('#btn-begin'), ghost: h('#btn-glossary-title'),
      lgCls: document.querySelector('#btn-begin').className };
  });
  if (ranks.lg > ranks.ghost + 3) ok(`the primary is ${ranks.lg}px against the second rank's ${ranks.ghost}px`);
  else fail(`the ranks are the same size (${ranks.lg} vs ${ranks.ghost}, classes "${ranks.lgCls}") — .lg is not landing`);

  if (errs.length) fail('window errors: ' + errs.slice(0, 3).join(' / '));
  else ok('and the desktop pass boots clean');

  await browser.close();
  console.log(faults === 0 ? '\nPASS (browser)' : `\nFAIL (${faults} faults)`);
  process.exit(faults === 0 ? 0 : 1);
})();
