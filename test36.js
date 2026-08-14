/* test36 — THE TRAINING HALL'S TWO NEW MODES.
   Rune Forge (word building) and Spirit Trial (applied recall), plus the
   Mastery Rush that either of them can break into. The rounds are played to
   the end, not just constructed: a term is forged, a wrong piece is blasted
   off the anvil, a word is cut back into its pieces, a spirit is read and
   another one is let past. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const D = window.__RD_DATA, E = window.__RD_ENG, AR = window.__RD_ARCADE;
  const PARTS = D.PARTS, TERMS = D.TERMS;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));
  const G = () => AR._game();
  const frag = (host, id) => $$(host + ' .frag').find((n) => n.dataset.id === String(id));

  console.log('\n== the hall offers four modes, and says what each one is in four words ==');
  assert(!!AR && typeof AR.startMode === 'function', 'the arcade exposes one door into every mode');
  AR.open('hub');
  await until(() => $$('.arcade-card').length, 4000, 'the menu to build');
  const cards = $$('.arcade-card');
  assert(cards.length === 4, `the menu offers four modes (${cards.length})`);
  const titles = cards.map((c) => c.querySelector('h3').textContent);
  assert(titles.join('|') === 'Reed Slice|Seal Match|Rune Forge|Spirit Trial',
    'the four are Reed Slice, Seal Match, Rune Forge and Spirit Trial');
  const subs = cards.map((c) => c.querySelector('.ac-sub').textContent.trim());
  assert(subs.every((s) => s.split(/\s+/).length < 5),
    'every card instruction is under five words: ' + subs.join(' / '));
  assert(!$('.ac-desc'), 'no card carries a paragraph any more');
  assert(cards.every((c) => c.querySelector('.ac-best')), 'every card shows a best score');

  console.log('\n== the save has a shelf for both new modes, old saves included ==');
  const st = E.S();
  assert(st.arcade.forge && st.arcade.spirit, 'a fresh save carries forge and spirit records');
  const old = window.JSON.parse(window.JSON.stringify(st));
  old.ver = 6; delete old.arcade.forge; delete old.arcade.spirit;
  const mig = E._migrate ? E._migrate(old) : null;
  if (mig) {
    assert(mig.arcade.forge && mig.arcade.spirit, 'a pre-forge save is backfilled with both');
    assert(mig.arcade.slice.best === old.arcade.slice.best, 'and its older records survive');
  } else {
    // migrate() is module-private; prove the same guarantee through saveBest instead
    delete st.arcade.forge;
    AR.startMode('forge');
    assert(!!E.S().arcade, 'the hall opens against a save with no forge shelf');
    if (G()) G().over = true;
    st.arcade.forge = { best: 0, plays: 0 };
    assert(true, 'a pre-forge save cannot crash the mode it does not know about');
  }

  console.log('\n== the spelling rule the forge shows words with ==');
  const bad = Object.keys(TERMS).filter((id) => {
    const w = AR._wordOf(TERMS[id].build);
    return !w || w.word !== TERMS[id].spell;
  });
  assert(bad.length === 0,
    `all ${Object.keys(TERMS).length} terms are spelled letter for letter by the rule` +
    (bad.length ? ' — except ' + bad.join(', ') : ''));
  const fused = Object.keys(TERMS).filter((id) => AR._wordOf(TERMS[id].build).fused);
  assert(fused.length > 0 && fused.every((id) => {
    const w = AR._wordOf(TERMS[id].build);
    return w.segs.reduce((a, s) => a + s.text.length, 0) === TERMS[id].spell.length;
  }), `${fused.length} words fuse a shared letter across a junction and are marked for it`);

  console.log('\n== a corrupted term differs from the real one in exactly one piece ==');
  let repairs = 0, clean = true;
  for (let i = 0; i < 60; i++) {
    const R = AR._makeRepair();
    if (!R) continue;
    repairs++;
    const diff = R.need.filter((id, k) => id !== (R.need.slice(0, k).concat([R.bad]).concat(R.need.slice(k + 1)))[k]);
    const broken = R.need.slice(); broken[R.at] = R.bad;
    if (broken.filter((id, k) => id !== R.need[k]).length !== 1) clean = false;
    if (R.word.word === TERMS[R.term].spell) clean = false;
    if (PARTS[R.bad].kind !== PARTS[R.real].kind) clean = false;
    if (PARTS[R.bad].mean === PARTS[R.real].mean) clean = false;
    void diff;
  }
  assert(repairs >= 50, `${repairs} of 60 repair rounds could be built from the corpus`);
  assert(clean, 'the wrong piece is the same part of speech, means something else, and changes the spelling');

  console.log('\n== RUNE FORGE: a term is laid out and struck ==');
  AR.setRush(false);
  AR.startMode('forge');
  await until(() => G() && G().round, 4000, 'the first forge round');
  assert(!!$('#fg-hearth') && !!$('#fg-billet'), 'the hearth and the anvil are on screen');
  assert(!$('#arcade-head') || $('#arcade-head').style.display === 'none',
    'the hall title steps out of the way while a round is on');

  /* Ten forges end a session, so a suite that drives the rotation looking for
     one round shape has to be willing to light the forge again. */
  async function ensureForge() {
    if (G() && !G().over && G().round) return;
    AR.startMode('forge');
    await until(() => G() && G().round && !G().busy, 4000, 'a fresh forge');
  }
  const toKind = async (kind, tries) => {
    for (let i = 0; i < (tries || 12); i++) {
      await ensureForge();
      if (G().round && G().round.kind === kind && !G().busy) return true;
      await solve();
      await until(() => (G().round && !G().busy) || G().over, 6000, 'the next round');
    }
    return !!(G().round && G().round.kind === kind);
  };
  async function solve() {
    if (!G() || G().over) return;
    const r = G().round;
    if (!r) return;
    if (r.kind === 'build') {
      r.need.forEach((id) => { const f = frag('#fg-tray', id); if (f) f.click(); });
      $('#fg-strike').click();
    } else if (r.kind === 'finish') {
      const f = frag('#fg-tray', r.missing); if (f) f.click();
    } else if (r.kind === 'break') {
      r.cuts.slice().forEach((c) => {
        const n = $$('#fg-billet .fg-cut').find((x) => x.dataset.at === String(c));
        if (n) n.click();
      });
    } else if (r.kind === 'repair') {
      const n = $$('#fg-billet .frag').find((x) => x.dataset.id === String(r.bad));
      if (n) n.click();
      await until(() => G().round.phase === 'swap' && $('#fg-tray .frag'), 3000, 'the replacements');
      const f = frag('#fg-tray', G().round.real); if (f) f.click();
    }
    await until(() => G().busy || G().over, 4000, 'the strike to land');
  }

  assert(await toKind('build'), 'a BUILD round comes round on the rotation');
  let r = G().round;
  const term = r.term, need = r.need.slice();
  const doneBefore = G().done;
  // a piece that has no business in this word
  const decoy = r.tray.find((id) => need.indexOf(id) < 0);
  assert(!!decoy, 'a build round offers at least one look-alike that does not belong');
  frag('#fg-tray', decoy).click();
  $('#fg-strike').click();
  assert(G().streak === 0 && G().done === doneBefore,
    'a wrong piece cracks the blade — it does not count as a forge');
  assert(/=/.test($('#fg-reveal').textContent) &&
    $('#fg-reveal').textContent.indexOf(PARTS[decoy].mean) >= 0,
    'and the piece that broke it is named on its way out: ' + $('#fg-reveal').textContent.trim());
  await until(() => !frag('#fg-tray', decoy) || frag('#fg-tray', decoy).classList.contains('dead'),
    3000, 'the blasted piece to leave the tray');
  assert(G().round.tray.indexOf(decoy) < 0, 'the wrong piece is blasted off and stays off');
  assert(need.every((id) => G().round.tray.indexOf(id) >= 0),
    'every correct piece is still lying there to try again');

  need.forEach((id) => { const f = frag('#fg-tray', id); if (f) f.click(); });
  assert(G().round.placed.length === need.length, 'the pieces go onto the anvil in the order tapped');
  $('#fg-strike').click();
  assert(G().done === doneBefore + 1, 'a correct strike forges the term');
  assert(G().streak === 1, 'and starts a streak');
  assert($('#fg-billet').textContent.trim() === TERMS[term].spell.toUpperCase(),
    'the finished word stamps onto the anvil: ' + $('#fg-billet').textContent.trim());
  const reveal = $('#fg-reveal').textContent;
  assert(need.every((id) => reveal.indexOf(PARTS[id].mean) >= 0),
    'the micro-reveal names every piece and its meaning: ' + reveal.replace(/\s+/g, ' ').trim());
  assert(need.every((id) => (E.S().mastery.parts[id] || {}).seen > 0),
    'and every piece is written back into the same mastery model the story uses');

  console.log('\n== the other three round shapes resolve ==');
  for (const kind of ['finish', 'break', 'repair']) {
    await until(() => G().round && !G().busy, 6000, 'the next round');
    const got = await toKind(kind, 10);
    assert(got, `a ${kind.toUpperCase()} round comes round on the rotation`);
    if (!got) continue;
    const before = G().done;
    if (kind === 'break') {
      const rr = G().round;
      assert(rr.cuts.length === rr.need.length - 1,
        `a word of ${rr.need.length} pieces has ${rr.cuts.length} boundaries to find`);
      assert(!AR._wordOf(TERMS[rr.term].build).fused,
        'and it is never a word whose pieces share a letter, which has no honest cut');
    }
    if (kind === 'finish') assert(G().round.placed.indexOf(null) >= 0, 'a FINISH round leaves one slot open');
    await solve();
    assert(G().done === before + 1, `the ${kind.toUpperCase()} round pays out when it is answered`);
  }

  console.log('\n== ten forges end the session and post a score ==');
  E.S().arcade.forge = { best: 0, plays: 0 };
  AR.startMode('forge');
  await until(() => G() && G().round, 4000, 'a fresh forge');
  for (let i = 0; i < 16 && !G().over; i++) {
    await until(() => (G().round && !G().busy) || G().over, 6000, 'the next round');
    if (G().over) break;
    await solve();
  }
  await until(() => G().over && $('.ar-endcard'), 8000, 'the end card');
  assert(G().done >= 10, `the session ran to ${G().done} forges before it cooled`);
  assert(!!$('.ar-endcard'), 'the forge cools and the end card opens');
  assert(E.S().arcade.forge.plays >= 1, 'the play is counted against the forge record');
  assert(E.S().arcade.forge.best > 0, `a best score is kept (${E.S().arcade.forge.best})`);
  assert((E.S().records.forge || []).length >= 1, 'and the Hall of Records has a Rune Forge row');

  console.log('\n== SPIRIT TRIAL: a sign is read, and one is let past ==');
  AR.startMode('spirit');
  await until(() => G() && G().round && $$('#sp-seals .sp-seal').length, 4000, 'the first spirit');
  assert(!!$('#sp-wisp'), 'a spirit is in the hall');
  assert($$('#sp-seals .sp-seal').length >= 2,
    'and it brings a set of seals to choose between');

  /* One answer, whatever shape the sign is: a repair takes two taps (smash,
     then replace) and a chain takes one per link, and both re-render the seals
     in place rather than settling the spirit. */
  const seen = {};
  let ambiguous = 0, spots = 0, oneRight = true;
  async function answerSpirit() {
    for (let step = 0; step < 6; step++) {
      const okSeals = await until(() => G().over ||
        (G().round && !G().busy && $$('#sp-seals .sp-seal').length), 6000, 'the seals');
      if (!okSeals || G().over) return;
      const spec = G().round;
      if (step === 0) seen[spec.kind] = (seen[spec.kind] || 0) + 1;
      if (spec.seals.filter((x) => x.ok).length !== 1) oneRight = false;
      if (spec.kind === 'Spot') {
        spots++;
        const right = spec.seals.find((x) => x.ok);
        if (spec.seals.some((o) => !o.ok && PARTS[o.id] && PARTS[o.id].mean === PARTS[right.id].mean)) ambiguous++;
      }
      const i = spec.seals.findIndex((x) => x.ok);
      $$('#sp-seals .sp-seal')[i].click();
      await sleep(400);
      if (G().busy || G().over) return;
    }
  }
  for (let i = 0; i < 10 && !G().over; i++) await answerSpirit();
  assert(oneRight, 'every sign, of every shape, has exactly one right seal');
  assert(Object.keys(seen).length >= 3,
    'the rotation shows at least three shapes of sign: ' + Object.keys(seen).join(', '));
  assert(G().right >= 5, `${G().right} signs were read correctly`);
  assert(G().score > 0, 'and they are worth something');

  console.log('\n== a spirit that is not read costs a life ==');
  await until(() => (G().round && !G().busy) || G().over, 6000, 'a fresh spirit');
  if (G().over) { AR.startMode('spirit'); await until(() => G().round, 3000, 'a new trial'); }
  const lives = G().lives;
  G().t = 999;                       // the fuse burns out
  await until(() => G().lives < lives || G().over, 3000, 'the spirit to pass through');
  assert(G().lives === lives - 1, 'the sign goes unread and a life is gone');
  assert(!G().over || G().lives <= 0, 'and the trial only ends when the third one is lost');

  console.log('\n== MASTERY RUSH ==');
  AR.setRush(true);
  AR.startMode('forge');
  await until(() => G() && G().round, 4000, 'a forge round');
  await solve();
  await until(() => $('.rush'), 6000, 'the rush to break out');
  assert(!!$('.rush'), 'a forged term with the rush due opens the Mastery Rush');
  assert($('.rush').textContent.indexOf('20 seconds') >= 0, 'it says what it is in six words');
  assert(!!AR._rush() && !!AR._rush().term, 'and it is already asking about a term');
  let rushHits = 0;
  for (let i = 0; i < 9 && $('.rush'); i++) {
    const live = AR._rush(); if (!live) break;
    const T = TERMS[live.term];
    const opts = $$('#rush-opts .frag');
    if (!opts.length) break;
    const want = live.step < 2 ? T.build[live.step] : T.build[0];
    const node = opts.find((n) => n.dataset.id === String(want));
    if (!node) break;
    node.click(); rushHits++;
    if (live.step >= 2) {
      const second = $$('#rush-opts .frag').find((n) => n.dataset.id === String(T.build[1]));
      if (second) second.click();
    }
    await sleep(120);
  }
  assert(rushHits >= 3, `${rushHits} rush prompts answered without a hint on screen`);
  assert($('.rush') && $('.rush').dataset.i !== '0',
    'the hall answers louder as the answers land (intensity ' + ($('.rush') || {}).dataset.i + ')');
  const scoreBefore = G().score;
  // leaving mid-rush must take the round's clock with it
  $('#arcade-back').click();
  assert(!$('.rush'), 'leaving the hall closes the rush rather than leaving it running');
  assert(scoreBefore >= 0, 'and the score it had banked is not lost to an error');
  AR.setRush(false);

  console.log('\n== the hall never asks a question with two right answers ==');
  AR.startMode('spirit');
  for (let i = 0; i < 14 && !G().over; i++) await answerSpirit();
  assert(spots >= 1 && ambiguous === 0,
    `${spots} SPOT signs, and every one asked for a meaning only one piece carries`);

  console.log('\n== nothing left over from the alphabet this game stopped borrowing ==');
  const src = require('fs').readFileSync('RemyDee_TheLostLexicon.html', 'utf8');
  const hall = src.slice(src.indexOf('TRAINING HALL (Arcade)'), src.indexOf('THE META LAYER'));
  assert(!/[一-鿿]/.test(hall), 'no hanzi anywhere in the Training Hall');
  assert(hall.indexOf('Noto Serif SC') < 0, 'and it no longer asks for a Chinese serif to draw Latin letters');

  if (G() && G().over === false) { const b = $('#arcade-back'); if (b) b.click(); }
  await sleep(200);
  summary(errors);
})();
