/* test31.js — THE ROOTS, AND WHY THEY STICK.

   Two claims:
     1. EVERY PART CARRIES A FACT. ORIGINS said where a part came from and
        stopped there. PART_FACTS says why that is worth knowing, for all
        eighty-four of them, and the Lexicon shows it.
     2. THE PRETEST IS ASKED WHERE IT COSTS SOMETHING. A guess made before
        the answer appears improves recall of that answer even when the guess
        is wrong — but only if the answer is not already on the screen. The
        tier-1 builder prints the definition as its prompt and the tier-2
        builder prints it as its hint, so the pretest belongs to tier 3
        alone, and at least one of its wrong answers must be a term sharing a
        word-part with the right one. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const E = window.__RD_ENG, D = window.__RD_DATA, SC = window.__RD_SCREENS;
  assert(E && D && SC, 'modules exposed');

  /* ============ 1. every part carries a fact ============ */
  {
    const ids = Object.keys(D.PARTS);
    const missing = ids.filter(id => !D.PART_FACTS[id]);
    assert(missing.length === 0, `every word-part has a fact behind it (missing: ${missing.join(', ') || 'none'})`);
    const orphan = Object.keys(D.PART_FACTS).filter(id => !D.PARTS[id]);
    assert(orphan.length === 0, `no fact describes a part the game does not teach (${orphan.join(', ') || 'none'})`);

    const short = ids.filter(id => D.PART_FACTS[id].length < 60);
    assert(short.length === 0, `no fact is a stub (${short.join(', ') || 'none'})`);
    const long = ids.filter(id => D.PART_FACTS[id].length > 340);
    assert(long.length === 0, `no fact is long enough to be scrolled past (${long.join(', ') || 'none'})`);

    // the twin pairs are the Two Tongues pillar; each half should say so
    const twinIds = ['nephr', 'ren', 'phleb', 'ven', 'ot', 'aur', 'rhin', 'nas', 'pulmon', 'pneumon', 'hypo', 'sub'];
    const silent = twinIds.filter(id => !/twin|Latin|Greek/i.test(D.PART_FACTS[id]));
    assert(silent.length === 0, `both halves of every Greek/Latin twin name the other half (${silent.join(', ') || 'none'})`);
  }

  /* ============ the Lexicon shows them ============ */
  {
    SC.openGloss();
    await sleep(120);
    const facts = doc.querySelectorAll('#gloss-list .gloss-fact');
    assert(facts.length > 20, `the Lexicon prints the fact under each part, not only its meaning (${facts.length} shown)`);
    const modal = doc.getElementById('modal-gloss');
    if (modal) modal.classList.remove('show');
  }

  /* ============ 2. the pretest ============ */
  {
    // every tier-3 traveler's term must have a sibling, or its pretest silently
    // never appears and the mode that most needs it is the one that never gets it
    const t3 = Object.keys(D.TRAVELERS).filter(k => D.TRAVELERS[k].tier === 3);
    assert(t3.length > 0, 'the cast contains tier-3 travelers — the recall-from-clue mode');
    const noSibling = t3.filter(k => {
      const term = D.TERMS[D.TRAVELERS[k].term];
      if (!term) return false;
      const mine = new Set(term.build);
      return !Object.keys(D.TERMS).some(id =>
        D.TERMS[id].spell !== term.spell && D.TERMS[id].build.some(p => mine.has(p)));
    });
    assert(noSibling.length === 0,
      `every tier-3 term has at least one sibling to be confused with (${noSibling.join(', ') || 'none'})`);
  }

  const openTerm = async (tid) => {
    const t = D.TRAVELERS[tid];
    E.setFlow({ chapter: D.CHAPTERS[3], builders: [tid], members: [tid], idx: 0,
      results: {}, forged: [], route: null, stats: {} });
    SC.openBuilder();
    await until(() => doc.querySelectorAll('#tray .tile').length > 0, 4000, 'the builder opened for ' + tid);
    D.TERMS[t.term].build.forEach(id => {
      const tile = [...doc.querySelectorAll('#tray .tile')].find(x => x.dataset.id === id);
      if (tile) tile.click();
    });
    doc.getElementById('build-check').click();
    await until(() => doc.getElementById('reveal').classList.contains('show'), 4000, 'the reveal opened for ' + tid);
  };

  {
    const t3 = Object.keys(D.TRAVELERS).find(k => D.TRAVELERS[k].tier === 3 && D.TERMS[D.TRAVELERS[k].term]);
    await openTerm(t3);
    const pre = doc.getElementById('reveal-pretest'), body = doc.getElementById('reveal-body');
    assert(!pre.hidden, 'a tier-3 term asks for a guess before it opens');
    assert(body.hidden, 'and the breakdown, the definition and the rule are all still shut while it asks');

    const opts = [...doc.querySelectorAll('.rp-opt')];
    assert(opts.length === 3, `three candidate meanings, no more (${opts.length})`);
    const term = D.TERMS[D.TRAVELERS[t3].term];
    const texts = opts.map(o => o.textContent);
    assert(texts.includes(term.def), 'the true meaning is one of them');
    const mine = new Set(term.build);
    const sibDefs = Object.keys(D.TERMS)
      .filter(id => D.TERMS[id].spell !== term.spell && D.TERMS[id].build.some(p => mine.has(p)))
      .map(id => D.TERMS[id].def);
    assert(texts.some(t => sibDefs.includes(t)),
      'at least one wrong answer shares a word-part with the right one — the near miss is the point');

    const fact = doc.getElementById('reveal-fact');
    assert(fact && !fact.hidden && fact.innerHTML.length > 40,
      'the card carries the fact behind one of its parts, chosen as the least-seen one');

    // answering opens the card
    opts.find(o => o.textContent === term.def).click();
    await until(() => !body.hidden, 3000, 'choosing an answer opens the breakdown');
    assert(pre.hidden, 'and puts the question away');
    const guess = doc.querySelector('.reveal-guess');
    assert(guess && /had it/i.test(guess.textContent), 'a right guess is told it was right');
    const stamp = doc.getElementById('reveal-stamp');
    assert(stamp.classList.contains('hit'),
      "the seal actually lands — the CSS animates .stamp.hit and the code used to add .go, so the game's signature beat never played");
  }

  {
    // tier 1 prints the definition as its own prompt; asking for a guess there
    // is a reading test, not retrieval
    const t1 = Object.keys(D.TRAVELERS).find(k => D.TRAVELERS[k].tier === 1 && D.TERMS[D.TRAVELERS[k].term]);
    await openTerm(t1);
    const pre = doc.getElementById('reveal-pretest'), body = doc.getElementById('reveal-body');
    assert(pre.hidden && !body.hidden,
      'a tier-1 term opens straight to the answer — its builder already printed the definition on screen');
    assert(doc.getElementById('reveal-fact').innerHTML.length > 40,
      'it still gets the fact: skipping the guess is not skipping the teaching');
  }

  summary(errors);
})();
