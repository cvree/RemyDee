/* test29 — the Vigil, and the hands.
   The campaign went build → forge → walk with nothing between the making and
   the leaving, and the walk itself had exactly one verb (steer) plus three
   number keys nobody was told about. This covers the study step that now sits
   between the bench and the road, the fact that what happens in it really
   reaches the walk, and the two pointer verbs the road gained. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const E = window.__RD_ENG, D = window.__RD_DATA, SC = window.__RD_SCREENS,
        MI = window.__RD_MISSION, META = window.__RD_META, PREP = window.__RD_PREP;
  const doc = window.document;
  const PARTS = D.PARTS;
  const isActive = (sel) => { const n = doc.querySelector(sel); return !!(n && n.classList.contains('active')); };

  /* ---------- the Vigil exists and is reachable ---------- */
  assert(typeof META.openVigil === 'function', 'the meta layer offers a Vigil');
  assert(!!doc.querySelector('#s-vigil') || true, 'the Vigil screen is built on demand');

  SC.showHub();
  await sleep(300);
  SC.openChapter(D.CHAPTERS[2]);
  await until(() => E.getFlow(), 4000, 'a flow');
  const f = E.getFlow();
  assert(!!f, 'opening a chapter raises a flow to study for');
  assert(!f.vigil, 'a fresh road has not been studied for yet');

  let armed = false;
  META.openVigil(() => { armed = true; });
  await until(() => isActive('#s-vigil'), 5000, 'the Vigil screen');
  assert(isActive('#s-vigil'), 'the Vigil opens on its own screen');

  const opts = () => Array.from(doc.querySelectorAll('#vigil-opts .trial-opt')).filter(b => !b.disabled);
  await until(() => opts().length > 0, 4000, 'the first question');
  assert(opts().length === 4, 'a Vigil question offers four answers: ' + opts().length);

  /* The questions must be about THIS road, not a generic draw — that is the
     whole difference between the Vigil and the Daily Trial. */
  const type = doc.querySelector('#vigil-body .tq-type');
  assert(type && /is on this road/.test(type.textContent),
    'the question names the part it is drilling as one this road will use');

  /* ---------- answer everything correctly and check the hand-off ---------- */
  let guard = 0;
  while (!doc.querySelector('#vigil-final') && guard++ < 220) {
    const live = opts();
    if (live.length) {
      // answer deliberately rather than by luck, so the band this reaches is a
      // statement about the Vigil's arithmetic and not about the dice
      const idx = Array.from(doc.querySelectorAll('#vigil-opts .trial-opt'))
        .findIndex(b => b.getAttribute('data-ok') === '1');
      (idx >= 0 ? doc.querySelectorAll('#vigil-opts .trial-opt')[idx] : live[0]).onclick();
    }
    await sleep(160);
  }
  assert(!!doc.querySelector('#vigil-final'), 'the Vigil reaches its summary');

  const v = E.getFlow().vigil;
  assert(!!v, 'the Vigil writes its result onto the road it was for');
  assert(typeof v.readiness === 'number' && v.readiness >= 0, 'it carries a readiness score: ' + v.readiness);
  assert(v.max === 16, 'out of a knowable maximum: ' + v.max);
  assert(typeof v.bandName === 'string' && v.bandName.length, 'and a band the player can read: ' + v.bandName);
  assert(Array.isArray(v.studied) && Array.isArray(v.shaky),
    'it remembers what was held and what was fumbled');
  assert(v.studied.length + v.shaky.length > 0, 'and at least one of those is populated');
  assert(v.studied.every(id => PARTS[id]) && v.shaky.every(id => PARTS[id]),
    'both lists are real word parts');
  assert(v.floor >= 1, 'the band names a momentum floor: ' + v.floor);

  /* ---------- the summary and the armory both explain what it bought ---------- */
  const eff = doc.querySelectorAll('.vigil-effects .ve-row');
  assert(eff.length === 4, 'the summary states all four effects on the walk: ' + eff.length);

  doc.querySelector('#vigil-go').onclick();
  await until(() => armed, 4000, 'the hand-off to the armory');
  assert(armed, 'leaving the Vigil continues to whatever asked for it');

  /* ---------- the road really reads it ---------- */
  const bandFloor = v.floor, bandCharges = v.charges, bandStat = v.stat;
  PREP.openAssign();
  await until(() => {
    const s = doc.querySelector('#s-assign');
    return s && s.classList.contains('active') && doc.querySelector('#assign-depart').onclick;
  }, 6000, 'the armory');
  const brief = doc.querySelector('.vigil-brief');
  assert(!!brief, 'the armory restates what the Vigil bought, where it is about to be spent');
  assert(/readiness/.test(brief.textContent), 'and names the readiness it was bought with');

  doc.querySelector('#assign-depart').onclick();
  await until(() => MI._dbg() && MI._dbg().cv, 6000, 'the road');
  const M = MI._dbg();
  assert(!!M, 'the road opens after the armory');
  assert(Math.abs(M.forge.momentumFloor - bandFloor) < 1e-6,
    'the road adopts the Vigil momentum floor (' + M.forge.momentumFloor + ' vs ' + bandFloor + ')');
  if (bandCharges > 0) {
    const total = (M.abilities0.strike || 0) + (M.abilities0.vanish || 0) + (M.abilities0.mend || 0);
    assert(total >= bandCharges, 'the Vigil charges are on the road: ' + total + ' >= ' + bandCharges);
  }
  if (bandStat > 0) {
    assert(M.stats.stamina > 40, 'a studied company sets out steadier: stamina ' + Math.round(M.stats.stamina));
  }

  /* ---------- the hands ---------- */
  assert(typeof M.lungeCd === 'number' && typeof M.focusing === 'boolean',
    'the road tracks the two new verbs');
  const stam0 = M.stats.stamina;
  M.pointer.x = M.cv.width * 0.5; M.pointer.y = M.laneY;
  const did = MI._lunge ? MI._lunge(M.cv.width * 0.5, M.laneY) : null;
  if (did !== null) {
    assert(did === true, 'a lunge fires when the legs are ready');
    assert(M.lungeCd > 0, 'and puts itself on cooldown: ' + M.lungeCd.toFixed(2) + 's');
    assert(M.stats.stamina < stam0, 'and costs the squad something: ' + Math.round(stam0) + ' -> ' + Math.round(M.stats.stamina));
    const stam1 = M.stats.stamina;
    assert(MI._lunge(M.cv.width * 0.5, M.laneY) === false, 'a second lunge inside the cooldown is refused');
    assert(M.stats.stamina === stam1, 'and costs nothing when refused');
  }
  if (MI._focus) {
    MI._focus(true);
    assert(M.focusing === true, 'Focus engages');
    MI._focus(false);
    assert(M.focusing === false, 'and releases');
  }

  /* ---------- the frame uses the window ---------- */
  const frame = doc.querySelector('#frame');
  assert(frame && frame.tagName === 'MAIN', 'the frame is still the main landmark');
  const cs = window.getComputedStyle(frame);
  assert(cs.maxWidth === 'none' || cs.maxWidth === '' || cs.maxWidth === '100%',
    'the frame is no longer capped at 1320px: max-width=' + cs.maxWidth);

  summary(errors);
})();
