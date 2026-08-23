/* test43.js — THE ETYMOLOGY GOES WHERE THE PLAYER IS ALREADY LOOKING.

   All 85 word-parts carry one verified line about where they came from — mys
   meant mouse, neuron meant bowstring, elektron is amber — and those lines are
   the difference between a root that is memorised and a root that is known.
   They lived in two places: the Lexicon, which has to be opened on purpose,
   and the reveal card of a term just built. Around twenty parts are in no term
   any traveler asks for, so for those the line was reachable only by browsing.

   The Vigil and the Daily Trial already stop after every answer to say what
   the question was about — the one moment the player is thinking about that
   exact part, right or wrong, with no clock running. The line goes there too,
   under the explanation and quieter than it. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => Array.from(doc.querySelectorAll(s));
  const E = window.__RD_ENG, D = window.__RD_DATA, META = window.__RD_META, SC = window.__RD_SCREENS;
  assert(E && D && META && SC, 'modules exposed');

  /* ---------- the corpus keeps its promise ---------- */
  const parts = Object.keys(D.PARTS);
  const missing = parts.filter((id) => !D.PART_FACTS[id]);
  assert(missing.length === 0,
    `every word-part carries a line about where it came from (${parts.length} parts, ${missing.length} without)`);
  const stray = Object.keys(D.PART_FACTS).filter((id) => !D.PARTS[id]);
  assert(stray.length === 0, `and no line is written for a part that does not exist (${stray.join(', ')})`);
  assert(parts.every((id) => D.PART_FACTS[id].replace(/<[^>]+>/g, '').trim().length > 40),
    'each line says something, rather than restating the meaning');

  /* ---------- the Vigil shows the line for the part it just asked about ---------- */
  const st = E.newGame(); st.settings.diffAsked = true; E.setS(st); E.applySettings();
  SC.openChapter(D.CHAPTERS[3]);
  await until(() => !!E.getFlow(), 5000, 'a road to study for');
  META.openVigil(() => {});
  await until(() => $$('#vigil-opts .trial-opt').length > 0, 5000, 'the Vigil');

  const focusOf = () => {
    const label = $('#vigil-body .tq-type');
    const b = label && label.querySelector('b');
    if (!b) return null;
    const text = b.textContent.trim();
    return Object.keys(D.PARTS).find((id) => D.PARTS[id].text === text) || null;
  };
  let seen = 0, carried = 0;
  for (let round = 0; round < 4; round++) {
    const opts = $$('#vigil-opts .trial-opt');
    if (!opts.length) break;
    const id = focusOf();
    // answer wrong on purpose the first time: the line has to be there when it
    // is most needed, not only as a reward
    const pick = round === 0 ? (opts.find((o) => !o.dataset.ok) || opts[0])
                             : (opts.find((o) => o.dataset.ok) || opts[0]);
    pick.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(240);
    if (id) {
      seen++;
      const fact = $('#vigil-teach .tt-fact');
      if (fact) {
        carried++;
        if (round === 0) {
          assert(fact.textContent.indexOf(D.PARTS[id].text) === 0,
            `a wrong answer is met with the part's own story, named first (${D.PARTS[id].text})`);
          const body = $('#vigil-teach .tt-b');
          assert(!!body && (body.compareDocumentPosition(fact) & window.Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            'and it sits under the explanation rather than in place of it');
        }
      }
    }
    await until(() => $$('#vigil-opts .trial-opt').some((o) => !o.disabled), 4000, 'the next question');
  }
  assert(seen > 0, 'the Vigil asks about named parts');
  assert(carried === seen,
    `every one of those answers carried the part's story (${carried}/${seen})`);

  await sleep(150);
  summary(errors);
})();
