/* test40.js — THE CONTROL LAYER.

   Every button, latch, tab, chip and field in the game, asked one question:
   does it belong to the same object?

   The grammar was already written, once, for the Trial's answer stones — "a card
   that lifts toward the cursor is a webpage; a stone that presses in when you
   push it is an object" — and then nothing else in the file obeyed it, including,
   in the end, the answer stones. What this suite guards:

     1. ONE PRESS LANGUAGE. Nothing rises toward the cursor. The icon buttons
        went up 1px, the HUD pills 3px, the arcade cards 4px, the commission
        cards 2px, and STRIKE went up 2px and then dropped 2px below its own
        resting line. The carved-stone rule that forbade all of it named two
        selectors out of six, and a later <style> block overrode both.
     2. RADII COME FROM THE TOKENS. The token set says 2/3/4 and the controls
        said 7, 8, 9, 10, 12, 14, 16, 20, 100 and 999 — an 8px topbar chip and a
        16px iOS capsule on a screen whose panels are cut square.
     3. ONE DEFINITION PER CONTROL. `.seg` and `.gloss-search` were each declared
        twice, in different blocks, with different radii and different child
        selectors, so half of each was styling nothing and which half depended on
        the cascade. `.toggle` and `.setting-row` were styled and never used at
        all — the settings screen carried two of every control.
     4. THE FOCUS RING DOES NOT RESHAPE WHAT IT LANDS ON. `:focus-visible` set
        `border-radius:4px`, which is the element's radius and not the ring's, so
        every control in the game changed shape the moment the keyboard reached it.
     5. FORTY-FOUR PIXELS, EVERYWHERE, ONCE. `.btn.sm` was ~26px tall and
        `.small-btn` ~22px, both on the hub, which is the first screen a phone
        opens. The floor is a token now and a later media block cannot pull a
        control back under it.
     6. THREE RANKS, NOT FIVE COLOURS. A screen has to say which button is the
        way forward. The title screen offered three at one weight, and the case
        screen weighted `Not today` exactly as heavily as `Build their terms`.
*/
const fs = require('fs');
const { boot, sleep, until, assert, summary } = require('./testlib');

const SRC = fs.readFileSync('RemyDee_TheLostLexicon.html', 'utf8');

/* Every <style> block, concatenated — the cascade as the browser sees it. */
const CSS = (SRC.match(/<style>([\s\S]*?)<\/style>/g) || [])
  .map(b => b.replace(/^<style>/, '').replace(/<\/style>$/, '')).join('\n');
/* comments carry the reasoning and quote the very values under test, so they are
   stripped before anything is measured */
const CSS_BARE = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/* Rule blocks as [selector, body, inMedia] triples. A rule nested inside an
   at-rule is a deliberate override for one viewport, so the "declared once"
   checks below have to be able to tell it from a second base definition. */
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m, depth = 0, lastEnd = 0;
  while ((m = re.exec(css))) {
    // count at-rule opens between this match and the last, to know the nesting
    const between = css.slice(lastEnd, m.index);
    depth += (between.match(/@[a-z-]+[^{}]*\{/g) || []).length;
    depth -= (between.match(/\}/g) || []).length - (between.match(/[^{}]+\{[^{}]*\}/g) || []).length;
    if (depth < 0) depth = 0;
    lastEnd = re.lastIndex;
    const sel = m[1].trim().replace(/\s+/g, ' ').replace(/^.*\}/s, '').trim();
    if (!sel || sel.startsWith('@')) continue;
    out.push([sel, m[2], depth > 0]);
  }
  return out;
}
const RULES = rules(CSS_BARE);
/* A selector list, split, with every part matched exactly against a class —
   `.diff-card`, `.diff-card.on` and `.diff-card:hover` are the control itself;
   `.diff-card .dc-current` is a badge sitting on it and is not this layer's. */
const namesControl = (sel, cls) => sel.split(',').some(s =>
  new RegExp('^' + cls.replace(/[.]/g, '\\.') + '(?::[a-z-]+(\\([^)]*\\))?|::[a-z-]+|\\.[a-z-]+)*$', 'i')
    .test(s.trim()));
/* all declaration bodies whose selector matches a predicate */
const bodiesFor = (pred) => RULES.filter(([s]) => pred(s)).map(([, b]) => b);
const declOf = (body, prop) => {
  const m = body.match(new RegExp('(?:^|;)\\s*' + prop + '\\s*:([^;]*)'));
  return m ? m[1].trim() : null;
};

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];
  const E = window.__RD_ENG;

  console.log('\n1. ONE PRESS LANGUAGE — nothing rises toward the cursor');

  /* The controls the game is made of. A lift on any of their hover states is the
     defect this section exists to catch. */
  const CONTROLS = ['.btn', '.icon-btn', '.seg-btn', '.rec-tab', '.trial-opt', '.diff-card',
    '.arcade-card', '.comm-card', '.ability-btn', '.pace-btn', '.fg-strike', '.switch',
    '.variant-btn', '.tag.filter', '.reagent-chip'];
  const controlHoverBodies = RULES.filter(([sel]) =>
    sel.includes(':hover') && CONTROLS.some(c => sel.includes(c)));
  assert(controlHoverBodies.length >= 8,
    'the control layer has hover rules to check (the selectors did not silently stop matching)');
  const lifted = controlHoverBodies
    .filter(([, body]) => /transform\s*:[^;]*translateY\(\s*-/.test(body))
    .map(([sel]) => sel);
  assert(lifted.length === 0,
    'no control lifts toward the cursor on hover' + (lifted.length ? ' — ' + lifted.join(' / ') : ''));

  /* A press must go IN. Every control that declares an :active transform moves
     down, never up, and never past a hair — a button that travels is a spring. */
  const activeMoves = RULES.filter(([sel]) => sel.includes(':active') &&
    CONTROLS.some(c => sel.includes(c)))
    .map(([sel, body]) => [sel, declOf(body, 'transform')])
    .filter(([, t]) => t && t.includes('translateY'));
  assert(activeMoves.length >= 4, 'the controls declare a press displacement at all');
  const springs = activeMoves.filter(([, t]) => /translateY\(\s*-/.test(t)).map(([s]) => s);
  assert(springs.length === 0,
    'every press moves the face down, not up' + (springs.length ? ' — ' + springs.join(' / ') : ''));

  /* The line the pass drew: a thing you CHOOSE presses in, a thing you PICK UP
     lifts. The pieces of a word and the kit on a rack are picked up, and they
     are the only surfaces in the game still allowed to rise. This asserts the
     exception is still exactly that short — a sixth name joining it is a control
     that has quietly gone back to behaving like a web card. */
  const PICKED_UP = ['.tile', '.frag', '.rack-item', '.held-item', '.ct-tile'];
  const risers = RULES.filter(([sel]) => sel.includes(':hover') &&
    /transform\s*:[^;]*translateY\(\s*-/.test(RULES.find(r => r[0] === sel)[1]))
    .map(([sel]) => sel)
    .filter(sel => !PICKED_UP.some(c => sel.includes(c)))
    // portraits inside a party card and achievement plaques are display, not controls
    .filter(sel => !/\.party-card|\.ach-card|\.pp\b/.test(sel));
  assert(risers.length === 0,
    'only the things a player picks up rise' + (risers.length ? ' — ' + risers.join(' / ') : ''));

  /* The press language is one token, so a control cannot drift out of it by
     being written in a different <style> block. */
  assert(/--ctl-press\s*:/.test(CSS_BARE) && /--ctl-rest\s*:/.test(CSS_BARE),
    'the rest and press shadows are tokens, defined once');
  assert(/--ctl-sink\s*:\s*1px/.test(CSS_BARE),
    'the sink is one pixel — a press is felt, not watched');

  /* The carved-stone rule now covers all four choosing surfaces, and this is the
     assertion that fails if a fifth is added without joining them. */
  const carved = RULES.find(([sel]) => /^\.trial-opt\s*,/.test(sel) && sel.includes('.comm-card'));
  assert(!!carved, 'one rule gives every choosing surface its face');
  ['.trial-opt', '.diff-card', '.arcade-card', '.comm-card'].forEach(c =>
    assert(carved && carved[0].includes(c), `${c} takes its surface from the carved-stone rule`));

  /* The specific regression: `.trial-opt` was re-declared in a later block with
     its own background, border and hover lift, which beat the carved rule
     outright. Its later rule is allowed to set size and type, nothing else. */
  const lateTrial = RULES.filter(([sel]) => sel === '.trial-opt')
    .map(([, b]) => b).join(';');
  assert(!/background\s*:/.test(lateTrial) && !/border\s*:/.test(lateTrial),
    'the Trial does not restate the face it is given — that override put the lift back');

  console.log('\n2. RADII COME FROM THE TOKENS');

  /* Round is a meaning here — a seal, a pip, a bead on the HUD rail — so the
     check is not "no round anywhere", it is "no control invents its own corner". */
  const TOKENED = ['.icon-btn', '.seg', '.rec-tab', '.switch', '.seed-input', '.gloss-search',
    '.trial-opt', '.diff-card', '.arcade-card', '.comm-card', '.btn', '.fg-strike', '.seg-btn'];
  const strays = [];
  RULES.forEach(([sel, body]) => {
    const r = declOf(body, 'border-radius');
    if (!r) return;
    if (!TOKENED.some(c => namesControl(sel, c))) return;
    // var(--r-*), 0/1px, and `inherit` are the vocabulary; a bare 7/8/9/10/12/14/16/20 is not
    const ok = /var\(--r-/.test(r) || /^(0|1px|inherit)$/.test(r) ||
      /^var\(--r-sm\) var\(--r-sm\) 0 0$/.test(r);
    if (!ok) strays.push(sel + ' → ' + r);
  });
  assert(strays.length === 0,
    'no control invents its own corner' + (strays.length ? ' — ' + strays.join(' / ') : ''));

  ['.icon-btn', '.switch', '.seg', '.seed-input', '.gloss-search'].forEach(c => {
    const body = bodiesFor(s => s === c).join(';');
    assert(/border-radius\s*:\s*var\(--r-/.test(body), `${c} takes its radius from the token set`);
  });

  console.log('\n3. ONE DEFINITION PER CONTROL');

  /* A class declared as a sole selector in two places is two authors who cannot
     see each other. `.seg` and `.gloss-search` were exactly that. */
  ['.seg', '.gloss-search', '.icon-btn', '.switch', '.btn'].forEach(c => {
    const n = RULES.filter(([sel, , inMedia]) => sel === c && !inMedia).length;
    assert(n === 1, `${c} has one base definition, not ${n}`);
  });

  /* The segmented control's two definitions had two different child selectors,
     so whichever lost took its children with it. Only the used one survives. */
  assert(/class="seg-btn|"seg-btn"|,\s*"seg-btn"|el\("button","seg-btn/.test(SRC) ||
    /seg-btn/.test(SRC), 'the segmented control builds .seg-btn children');
  assert(!/\.seg\s+button\s*\{/.test(CSS_BARE),
    'the orphaned `.seg button` half of the duplicate is gone');

  /* Dead control CSS, deleted rather than left to be found and copied. */
  ['toggle', 'setting-row'].forEach(c => {
    assert(!new RegExp('\\.' + c + '\\s*\\{').test(CSS_BARE), `.${c} is not styled`);
    assert(!new RegExp('class="[^"]*\\b' + c + '\\b').test(SRC), `.${c} is not used`);
  });

  /* `--font-body` is not a token this file defines, and the one search box in
     the game asked for it — so it fell through to the browser default. */
  assert(!/--font-body/.test(CSS_BARE), 'no control asks for a font token that does not exist');

  /* `!important` three times over on a class whose only job was "smaller". */
  const smallBtn = bodiesFor(s => s === '.small-btn').join(';');
  assert(smallBtn.length > 0 && !/!important/.test(smallBtn),
    'the small button wins on the cascade, not by shouting');

  console.log('\n4. THE FOCUS RING DOES NOT RESHAPE WHAT IT LANDS ON');

  const fv = bodiesFor(s => s === ':focus-visible').join(';');
  assert(fv.length > 0, 'there is a global focus ring');
  assert(!/border-radius/.test(fv),
    'the focus ring does not set the radius of the control it lands on');
  assert(/outline\s*:/.test(fv) && /box-shadow\s*:/.test(fv),
    'the ring is still a dark outline with a gold inner edge');

  /* Two controls had talked their way out of the global ring with a local
     `outline:3px solid gold` (2.18:1 on parchment) or a flat `outline:none`. */
  const optedOut = RULES.filter(([sel, body]) =>
    CONTROLS.some(c => sel.includes(c)) && /outline\s*:\s*(none|3px solid var\(--gold\))/.test(body))
    .map(([s]) => s);
  assert(optedOut.length === 0,
    'no control opts out of the focus ring' + (optedOut.length ? ' — ' + optedOut.join(' / ') : ''));

  console.log('\n5. FORTY-FOUR PIXELS, EVERYWHERE, ONCE');

  assert(/--ctl-min\s*:\s*44px/.test(CSS_BARE), 'the touch floor is a token, set once');
  assert(/@media\s*\(pointer:coarse\)/.test(CSS), 'the floor is applied on coarse pointers');
  const btnBody = bodiesFor(s => s === '.btn').join(';');
  assert(/min-height\s*:\s*var\(--ctl-min\)/.test(btnBody), 'every .btn inherits the floor');
  ['.seed-input', '.gloss-search', '.fg-strike'].forEach(c => {
    const b = bodiesFor(s => s === c).join(';');
    assert(/min-height\s*:\s*var\(--ctl-min\)/.test(b), `${c} inherits the floor`);
  });

  /* The regression that made the floor a lie: a later media block set the icon
     buttons back to 40px — five pixels of good intention, and being later in the
     file it beat the pointer:coarse floor outright. A size between the desktop
     38px and the touch 44px is always that mistake: either a control is at its
     desk size or it is at thumb size, and 40 is neither. */
  const parked = RULES.filter(([sel]) => namesControl(sel, '.icon-btn'))
    .map(([sel, body]) => [sel, declOf(body, 'height')])
    .filter(([, h]) => h && /^(39|40|41|42|43)px$/.test(h)).map(([s]) => s);
  assert(parked.length === 0,
    'no rule parks an icon button between the desktop size and the touch floor' +
    (parked.length ? ' — ' + parked.join(' / ') : ''));

  /* `.icon-btn.sm` is deliberately small on a desk — it is the pronounce button
     beside a word in the Lexicon, not a primary action — so what has to hold is
     that the coarse floor reaches it too, not that it is never small. */
  assert(RULES.some(([sel, body, inMedia]) => inMedia && sel.includes('.icon-btn.sm') &&
    (declOf(body, 'height') || '') === '44px'),
    'the small icon button reaches thumb size on a touch screen too');

  /* Padding in px inside a media query would have collapsed .sm, the default and
     .lg into one size on a phone — the three ranks only exist in em. */
  ['.btn', '.btn.sm', '.btn.lg'].forEach(c => {
    const b = bodiesFor(s => s === c).join(';');
    const p = declOf(b, 'padding');
    assert(p && /em/.test(p), `${c} is sized in em, so the ranks survive a phone`);
  });

  console.log('\n6. THREE RANKS, NOT FIVE COLOURS');

  ['.btn.ghost', '.btn.quiet', '.btn.lg', '.btn.sm'].forEach(c => {
    assert(RULES.some(([sel]) => sel.split(',').some(s => s.trim() === c)),
      `the ${c.replace('.btn.', '')} rank exists`);
  });

  /* Disabled used to be `grayscale(.6) brightness(.9)` over cinnabar: a brown
     smear that still read as the loudest thing on the panel. */
  const dis = bodiesFor(s => s === '.btn:disabled').join(';');
  assert(!/grayscale/.test(dis), 'a disabled button looks like paper, not like mud');
  assert(/cursor\s*:\s*not-allowed/.test(dis), 'and it still says it cannot be pressed');

  /* The stock shiny-button gleam. It swept a white diagonal across the primary
     action on every hover, next to a hand-painted brush underline. */
  assert(!/\.btn::before\s*\{/.test(CSS_BARE), 'the glass sweep is gone');

  /* The ranks only exist if the row lets them. A flex row stretches its children
     to the tallest by default, so a large primary beside two second-rank buttons
     inflated the second rank to match and every button on the title screen
     measured out at exactly one height — the hierarchy was in the CSS and not on
     the screen. Every row that holds buttons has to centre them. */
  ['.title-actions', '.brief-actions', '.build-controls', '.temper-row'].forEach(row => {
    const b = bodiesFor(s => s === row).join(';');
    assert(/display\s*:\s*flex/.test(b), `${row} is a flex row`);
    assert(/align-items\s*:\s*center/.test(b),
      `${row} centres its buttons instead of stretching them to one height`);
  });

  /* The title screen: one way in, two ways aside. */
  const begin = $('#btn-begin'), gloss = $('#btn-glossary-title'), hall = $('#btn-arcade-title');
  assert(begin && begin.classList.contains('lg'), 'the way into the game is the large block');
  assert(gloss && gloss.classList.contains('ghost') && hall && hall.classList.contains('ghost'),
    'the Lexicon and the Training Hall are the second rank, not two more primaries');
  assert($$('#s-title .btn').length >= 3, 'and they are all still .btn');

  /* The case screen: declining is findable, not persuasive. */
  const decline = $('#case-decline'), accept = $('#case-accept');
  assert(decline && decline.classList.contains('quiet'), '`Not today` is the quiet rank');
  assert(accept && accept.classList.contains('lg'), '`Build their terms` is the large block');
  assert(accept && !accept.classList.contains('ghost') && !accept.classList.contains('quiet'),
    'and it is the primary, so the screen answers its own question');

  console.log('\n7. CONTINUE OUTRANKS BEGIN WHENEVER THERE IS A ROAD ALREADY WALKED');

  const S0 = E.newGame();
  E.setS(S0); E.applySettings();

  window.__RD_SCREENS.showTitle();
  await until(() => $('#s-title').classList.contains('active'), 3000, 'title');
  await sleep(120);
  E.Save.clear();
  window.__RD_SCREENS.showTitle();
  await sleep(180);
  assert($('#continue-wrap').style.display === 'none', 'with no save there is nothing to continue');
  assert(begin.classList.contains('lg') && !begin.classList.contains('ghost'),
    'so Begin is the way in, at full weight');

  E.Save.write(E.newGame());
  window.__RD_SCREENS.showTitle();
  await sleep(180);
  assert($('#continue-wrap').style.display === 'flex', 'with a save, Continue appears');
  assert(begin.classList.contains('ghost') && !begin.classList.contains('lg'),
    'and Begin steps down to the second rank rather than shouting over it');
  assert($('#btn-continue').classList.contains('lg'),
    'Continue takes the weight Begin gave up');

  /* Both are still buttons that work — the swap is cosmetic and must not have
     cost either of them its handler. */
  assert(typeof begin.onclick === 'function' && typeof $('#btn-continue').onclick === 'function',
    'both still do what they say');

  E.Save.clear();

  console.log('\n8. THE SETTINGS SCREEN IS MADE OF THIS GAME\'S PARTS');

  window.__RD_SCREENS.openSettings();
  await until(() => $('#modal-settings').classList.contains('show'), 3000, 'settings open');
  await sleep(200);

  const latches = $$('#settings-body .switch');
  assert(latches.length >= 3, 'the comfort and sound settings are latches');
  latches.forEach((sw, i) => {
    if (i > 0) return;
    assert(sw.getAttribute('role') === 'switch', 'a latch says what it is to a screen reader');
    assert(sw.hasAttribute('aria-checked'), 'and says which way it is thrown');
  });
  /* The state has to survive the colour being taken away — the old pill was hue
     and nothing else, which a red-green colourblind player reads as one state. */
  const swBody = bodiesFor(s => s === '.switch > i').join(';');
  assert(/transform\s*:\s*translateX/.test(bodiesFor(s => s === '.switch.on > i').join(';')),
    'throwing the latch MOVES the bolt — position is the state, not only colour');
  assert(swBody.length > 0, 'the bolt is a real element, not a pseudo on the track');

  /* The one piece of unstyled browser chrome left on screen. */
  assert(/::-webkit-slider-thumb/.test(CSS_BARE) && /::-moz-range-thumb/.test(CSS_BARE),
    'the volume sliders are drawn by this game on both engines');
  assert(!/accent-color/.test(CSS_BARE),
    'and no longer handed to the browser default widget');

  const before = latches[0].getAttribute('aria-checked');
  latches[0].click();
  await sleep(120);
  assert(latches[0].getAttribute('aria-checked') !== before,
    'and throwing one still changes the setting it is attached to');
  latches[0].click();
  await sleep(120);

  const closeBtn = $('#settings-close');
  assert(closeBtn && closeBtn.classList.contains('icon-btn'),
    'the close is the same icon button as every other close in the game');
  closeBtn.click();
  await sleep(200);

  console.log('\n9. THE HALL\'S SECTIONS ARE TABS, NOT FOUR EQUAL CLAIMS');

  const recTab = bodiesFor(s => s === '.rec-tab').join(';');
  assert(!/border-radius\s*:\s*100px/.test(recTab), 'the stock capsule pill is gone');
  assert(/border-bottom/.test(bodiesFor(s => s === '.rec-tabs').join(';')),
    'the row sits on a rule, the way index tabs do');
  const on = bodiesFor(s => s === '.rec-tab.on::after').join(';');
  assert(/scaleX\(1\)/.test(on), 'and the section you are reading is marked on that rule');

  summary(errors);
})();
