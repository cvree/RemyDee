/* test41.js — THE SAVE, WHEN THE BROWSER SAYS NO.

   Every path in this file was written down as never audited and never was.
   `Save.write` was `try{ setItem }catch(e){}`: exactly right about not taking
   the running game down with it, and silent about everything else. A player in
   a private window, with site data blocked, or against a full quota could walk
   a whole campaign and lose it at the first reload having been told nothing.

   Three guarantees:
     1. A refused write never throws, and the game keeps playing.
     2. It is said out loud — once, not on every persist.
     3. A refusal that looks like a full quota makes room from the parts of
        the save that are a luxury (leaderboards, old day-medals) before it
        gives up on the campaign that sits beside them. */
const { boot, sleep, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const E = window.__RD_ENG, D = window.__RD_DATA;
  assert(E && D, 'modules exposed');
  const KEY = 'remydee_lost_lexicon_v3';
  const real = window.localStorage;

  /* a storage that refuses everything, the way a private window used to */
  const install = (setItem) => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { setItem, getItem: (k) => real.getItem(k), removeItem: (k) => real.removeItem(k) }
    });
  };
  const restore = () => Object.defineProperty(window, 'localStorage',
    { configurable: true, value: real });
  const quota = () => { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; return e; };

  /* ---------- 1 · a refusal never throws ---------- */
  E.setS(E.newGame());
  E.Save.refused = false;
  install(() => { throw quota(); });
  let threw = null, ok = null;
  try { ok = E.Save.write(E.S()); } catch (e) { threw = e; }
  assert(!threw, 'a browser that refuses to store anything does not throw out of the save');
  assert(ok === false, 'and the write says plainly that it did not happen');

  let threw2 = null;
  try { E.persist(); } catch (e) { threw2 = e; }
  assert(!threw2, 'and persist(), which is called from everywhere, stays safe');

  /* ---------- 2 · said once, not on every persist ---------- */
  const toastText = () => { const t = doc.getElementById('toast'); return t ? t.textContent : ''; };
  assert(/will not save/i.test(toastText()),
    `the player is told the browser will not save (toast: "${toastText()}")`);
  doc.getElementById('toast').textContent = '';
  for (let i = 0; i < 5; i++) E.persist();
  assert(toastText() === '',
    'and told once — a warning on every autosave would be its own kind of broken');

  /* ---------- 3 · a full quota sheds the luxuries, not the campaign ---------- */
  restore();
  E.Save.refused = false;
  const st = E.newGame();
  st.chapter = 5;
  st.completedTerms = Object.keys(D.TERMS).slice(0, 30);
  st.records = {};
  ['endless', 'daily', 'slice', 'match', 'forge', 'spirit', 'road'].forEach((m) => {
    st.records[m] = [];
    for (let i = 0; i < 10; i++) st.records[m].push({ score: 1000 - i, at: Date.now() - i, label: 'x'.repeat(120) });
  });
  st.daily.medals = {}; for (let i = 0; i < 90; i++) st.daily.medals['2026-' + String(i).padStart(4, '0')] = 'gold';
  E.setS(st);

  const full = JSON.stringify(st).length;
  let written = null;
  // a quota that admits anything meaningfully smaller than what was first offered
  install((k, v) => { if (v.length >= full - 200) throw quota(); written = v; real.setItem(k, v); });
  const ok2 = E.Save.write(E.S());
  assert(ok2 === true, 'a save too big for the quota is retried smaller rather than dropped');
  const kept = JSON.parse(written);
  assert(kept.chapter === 5 && kept.completedTerms.length === 30,
    'the campaign itself is what survives — chapter and every term named');
  assert(kept.records.endless.length <= 3,
    `the leaderboards are what gives way (${kept.records.endless.length} rows kept)`);
  assert(Object.keys(kept.daily.medals).length <= 30,
    `and the oldest day-medals with them (${Object.keys(kept.daily.medals).length} kept)`);
  assert(E.Save.refused === false, 'and nobody is warned about a save that worked');
  assert(E.S().records.endless.length <= 3,
    'the shed is kept in the live state, so the next autosave is not the same oversized write again');

  restore();
  E.Save.refused = false;
  E.setS(E.newGame());
  E.persist();
  assert(E.Save.read() !== null, 'and an ordinary browser saves exactly as it always did');

  await sleep(120);
  summary(errors);
})();
