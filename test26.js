/* test26 — the things that shut people out.
   Each assertion is a defect that was found by tabbing through the game or by
   measuring it, not by reading the markup and imagining a user. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const SC = window.__RD_SCREENS;

  /* ---------- landmarks ---------- */
  assert(doc.querySelectorAll('main').length === 1,
    'the game exposes exactly one main landmark (it had none, so region navigation had nothing to navigate)');
  const skip = doc.querySelector('.skip-link');
  assert(!!skip, 'a skip link exists');
  assert(skip && skip.getAttribute('href') === '#frame', 'the skip link points at the frame');
  assert(window.getComputedStyle(skip).position === 'fixed', 'the skip link is parked off-screen until focused');

  /* ---------- the campaign map ---------- */
  SC.showHub();
  await until(() => doc.querySelectorAll('.map-node').length > 0, 4000, 'the campaign map');
  const nodes = Array.from(doc.querySelectorAll('.map-node'));
  assert(nodes.length >= 8, 'the map draws every chapter: ' + nodes.length);
  assert(nodes.every(n => n.getAttribute('role') === 'button'),
    'every map node is announced as a button — they carry Enter/Space handlers and were announced as list items');
  assert(nodes.every(n => (n.getAttribute('aria-label') || '').length > 8),
    'every map node has a spelled-out name (the visible glyph is "P" or a padlock)');
  const focusable = nodes.filter(n => n.getAttribute('tabindex') === '0');
  assert(focusable.length >= 1 && focusable.length < nodes.length,
    'locked chapters are out of the tab order and the reachable one is in it: ' + focusable.length + ' of ' + nodes.length);
  const cur = nodes.filter(n => n.getAttribute('aria-current') === 'step');
  assert(cur.length === 1, 'exactly one chapter is announced as the current step: ' + cur.length);
  const svg = doc.querySelector('.map-svg');
  assert(svg && svg.getAttribute('role') !== 'list',
    'the map is not claiming to be a list when its children are buttons');

  /* ---------- the Lexicon's filters ---------- */
  SC.openGloss();
  await until(() => doc.querySelectorAll('#gloss-filter .filter').length > 0, 4000, 'the Lexicon filters');
  const chips = Array.from(doc.querySelectorAll('#gloss-filter .filter'));
  assert(chips.length >= 5, 'the Lexicon offers its filters: ' + chips.length);
  assert(chips.every(c => c.hasAttribute('aria-pressed')),
    'filter selection is exposed, not carried as a CSS class only');
  assert(chips.filter(c => c.getAttribute('aria-pressed') === 'true').length === 1,
    'exactly one filter reads as pressed');
  chips[2].onclick();
  assert(chips[2].getAttribute('aria-pressed') === 'true' && chips[0].getAttribute('aria-pressed') === 'false',
    'pressing a filter moves the pressed state with it');

  /* ---------- the Lexicon actually teaches now ---------- */
  const rows = Array.from(doc.querySelectorAll('#gloss-list .gloss-row'));
  assert(rows.length > 0, 'the Lexicon lists entries: ' + rows.length);
  const withOrigin = rows.filter(r => r.querySelector('.gloss-src')).length;
  const withFamily = rows.filter(r => r.querySelector('.gloss-used')).length;
  assert(withOrigin >= rows.length * 0.9,
    'nearly every part shows the ancestor word it came from: ' + withOrigin + '/' + rows.length);
  assert(withFamily >= rows.length * 0.9,
    'nearly every part shows the terms that use it: ' + withFamily + '/' + rows.length);
  const langTags = rows.filter(r => r.querySelector('.gloss-lang')).length;
  assert(langTags >= rows.length * 0.9, 'and which tongue it speaks: ' + langTags + '/' + rows.length);

  /* ---------- the road's lesson beat can be dismissed ---------- */
  assert(!!doc.querySelector('#mini-teach'), 'the road has a block for the explanation');
  const go = doc.querySelector('#mini-go');
  assert(!!go && go.tagName === 'BUTTON', 'and a button to leave it with, rather than only a timer');

  /* ---------- the primer arrives before the first question about it ---------- */
  SC.startIntro();
  await until(() => doc.querySelector('#s-intro .primer'), 4000, 'the primer');
  const primer = doc.querySelector('#s-intro .primer');
  assert(!!primer, 'the prologue carries the combining-vowel primer');
  const txt = primer.textContent;
  assert(/combining vowel/i.test(txt), 'the primer names the combining vowel');
  assert(/cardiomegaly/.test(txt) && /carditis/.test(txt),
    'and proves the rule with the two cases that go opposite ways');
  assert(!doc.querySelector('#intro-dots .d'), 'the seven-panel pager is gone — it is one page now');

  summary(errors);
})();
