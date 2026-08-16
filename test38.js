/* test38.js — THE WORD HAS TO BE EARNED.

   The game is named for building words and building a word was the one act
   in it that was not a game. Four systems, one file:

     1. THE TRAY IS THE QUESTION. A tier-1 builder was handed zero
        distractors while the line above the tray named both parts it wanted
        and what each one meant, so the tray held exactly two tiles, both of
        them named a second earlier. Every tier carries look-alikes now, and
        they are dealt one-per-position before two anywhere — gastritis used
        to be able to draw both its distractors as suffixes and leave the
        root position with a single candidate, which is half the word not
        being asked about.
     2. THE SCREEN STOPS ANSWERING ITSELF. Tier 2 printed "the clue points
        to inflammation of the skin" underneath a clue written specifically
        to pose that question. The clue is the prompt now and nothing
        repeats it; the definition is the Recall charge you spend.
     3. THE PRETEST REACHES TIER 2. Its `tier < 3` gate was never about the
        tier — it was about that printed hint. The hint is gone, so the gate
        moves, and a corpus check keeps it honest: a pretest with no sibling
        to be confused with silently does not fire.
     4. THE SEAL. accuracy has been computed at the bench for a long time and
        is the single largest term in the road's `overall`, and nothing ever
        said so. Four named grades, on the wax and in the debrief.

   Plus the junction: the combining vowel is the one piece of knowledge that
   belongs to this subject and to nothing else, and it was a three-pixel bar
   revealed only after the player had already finished the word. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const E = window.__RD_ENG, D = window.__RD_DATA, SC = window.__RD_SCREENS;
  const AR = window.__RD_ARCADE;
  assert(E && D && SC && AR, 'modules exposed');

  const travelersOfTier = (n) =>
    Object.keys(D.TRAVELERS).filter((k) => D.TRAVELERS[k].tier === n && D.TERMS[D.TRAVELERS[k].term]);

  /* Waiting on "#tray has tiles" is waiting on nothing after the first
     builder: the previous traveler's tray is still in the DOM and satisfies
     it immediately, so every assertion after the first reads a stale screen.
     Wait for the builder STATE to be the one asked for, and for the tray to
     have been re-rendered to match it. */
  const openFor = async (tid) => {
    E.setFlow({ chapter: D.CHAPTERS[3], builders: [tid], members: [tid], idx: 0,
      results: {}, forged: [], route: null, stats: {} });
    SC.openBuilder();
    await until(() => {
      const b = SC._builderState();
      return b && b.term === D.TRAVELERS[tid].term && b.placed.length === 0
        && doc.querySelectorAll('#tray .tile').length === b.trayIds.length;
    }, 4000, 'the builder opened for ' + tid);
  };
  const trayIds = () => [...doc.querySelectorAll('#tray .tile')].map((t) => t.dataset.id);
  const place = (id) => {
    const t = doc.querySelector(`#tray .tile[data-id="${id}"]`);
    if (t) t.click();
    return !!t;
  };
  /* Same trap on the way out: the reveal from the previous stamp is still
     showing, so "wait for .show" passes before this one has been built. */
  const stampAndOpen = async (label) => {
    const rev = doc.getElementById('reveal');
    rev.classList.remove('show');
    doc.getElementById('build-check').click();
    await until(() => rev.classList.contains('show'), 4000, 'the reveal opened' + (label ? ' for ' + label : ''));
  };

  /* ================= 1. THE TRAY IS THE QUESTION ================= */
  console.log('\n== every tier puts look-alikes on the tray ==');

  for (const tier of [1, 2, 3]) {
    const tid = travelersOfTier(tier)[0];
    await openFor(tid);
    const need = D.TERMS[D.TRAVELERS[tid].term].build;
    const tray = trayIds();
    const extra = tray.filter((id) => !need.includes(id));
    assert(extra.length > 0,
      `a tier-${tier} tray holds parts the word does not want — placement is a choice, not a transcription`);
    assert(tray.length === need.length + extra.length,
      `and holds nothing else: tier ${tier} tray is the word's parts plus its distractors (${tray.length})`);
  }

  /* the ladder is felt: 2 / 3 / 4 */
  const counts = {};
  for (const tier of [1, 2, 3]) {
    const tid = travelersOfTier(tier)[0];
    await openFor(tid);
    const need = D.TERMS[D.TRAVELERS[tid].term].build;
    counts[tier] = trayIds().filter((id) => !need.includes(id)).length;
  }
  assert(counts[1] < counts[2] && counts[2] < counts[3],
    `the number of look-alikes climbs with the tier (${counts[1]} / ${counts[2]} / ${counts[3]}) — the tray is the difficulty curve`);

  console.log('\n== one wrong answer per position before two anywhere ==');
  /* The bug this replaces: one flat pool, sorted and sliced, so a two-kind
     word could draw every distractor into one kind and leave the other
     position uncontested. */
  {
    let checked = 0, uncontested = [];
    for (const tier of [1, 2, 3]) {
      for (const tid of travelersOfTier(tier).slice(0, 6)) {
        await openFor(tid);
        const need = D.TERMS[D.TRAVELERS[tid].term].build;
        const kindsNeeded = [...new Set(need.map((id) => D.PARTS[id].kind))];
        // only meaningful where the corpus actually has spare parts of that kind
        if (kindsNeeded.length < 2) continue;
        const tray = trayIds();
        kindsNeeded.forEach((k) => {
          const rivals = tray.filter((id) => !need.includes(id) && D.PARTS[id].kind === k);
          if (!rivals.length) uncontested.push(`${tid}/${k}`);
        });
        checked++;
      }
    }
    assert(checked > 0, `multi-kind builds were actually examined (${checked})`);
    assert(uncontested.length === 0,
      'every position a word needs has at least one wrong answer standing next to the right one: '
      + (uncontested.join(', ') || 'none uncontested'));
  }

  /* ================= 2. THE SCREEN STOPS ANSWERING ITSELF ================= */
  console.log('\n== the definition is not printed where it is being asked for ==');
  {
    for (const tier of [2, 3]) {
      for (const tid of travelersOfTier(tier).slice(0, 8)) {
        await openFor(tid);
        const def = D.TERMS[D.TRAVELERS[tid].term].def;
        const onScreen = doc.getElementById('build-question').textContent
          + ' ' + doc.getElementById('build-hintline').textContent;
        assert(onScreen.indexOf(def) < 0,
          `tier ${tier} (${tid}) asks for the term without printing "${def}" on the same screen`);
      }
    }
  }

  {
    /* The DOM sweep above only reaches the first few of each tier, and the
       two clues it did catch — cardiology's "the study of the heart" and
       ophthalmology's "the study of the eyes" — were giving the answer away
       inside the clue itself, which is the same reading test one layer down:
       the pretest then asked the player to guess a definition still printed
       on the screen behind the card. This one is pure data, so it covers
       every traveler in the game. */
    const leaks = [];
    Object.keys(D.TRAVELERS).forEach((k) => {
      const t = D.TRAVELERS[k], T = D.TERMS[t.term];
      if (!T || t.tier < 2 || !t.clue) return;
      if (t.clue.indexOf(T.def) >= 0) leaks.push(`${k} (${T.spell}): "${T.def}"`);
    });
    assert(leaks.length === 0,
      'no tier-2 or tier-3 clue contains its own term\'s definition word for word: '
      + (leaks.join(', ') || 'all ' + Object.keys(D.TRAVELERS).length + ' clues pose the question'));
  }

  console.log('\n== tier 1 pays for the withdrawn hint with glosses on the tiles ==');
  {
    const tid = travelersOfTier(1)[0];
    await openFor(tid);
    const glossed = [...doc.querySelectorAll('#tray .tile .kind.gloss')];
    assert(glossed.length === doc.querySelectorAll('#tray .tile').length,
      'every tier-1 tile says what it means — that is what makes withdrawing "you need X and Y" fair rather than cruel');
    const means = glossed.map((g) => g.textContent);
    const need = D.TERMS[D.TRAVELERS[tid].term].build;
    need.forEach((id) => assert(means.includes(D.PARTS[id].mean),
      `the meaning the player has to reason toward is on a tile (${D.PARTS[id].mean})`));
  }
  {
    const tid = travelersOfTier(2)[0];
    await openFor(tid);
    assert(doc.querySelectorAll('#tray .tile .kind.gloss').length === 0,
      'and tiers above 1 take the glosses away — that removal is the difficulty curve');
  }

  /* ================= 3. THE JUNCTION IS LIVE ================= */
  console.log('\n== the combining vowel is taught while it can still be acted on ==');
  {
    // hypoglycemia: hypo- + glyc/o + -emia, and the o dies before the vowel
    const tid = Object.keys(D.TRAVELERS).find((k) => {
      const T = D.TERMS[D.TRAVELERS[k].term];
      return T && T.build.length >= 3 && T.build.some((id) => D.PARTS[id].cv);
    });
    await openFor(tid);
    const need = D.TERMS[D.TRAVELERS[tid].term].build;
    need.forEach(place);
    await sleep(60);

    const cons = [...doc.querySelectorAll('#slotted .connector')];
    assert(cons.length === need.length - 1, `one junction between each pair of pieces (${cons.length})`);
    assert(cons.every((c) => c.classList.contains('drawn')),
      'every junction is drawn as soon as the pieces are adjacent — it used to appear only in onBuildSuccess, '
      + 'which is to say only after the player could no longer act on it');

    const reads = doc.getElementById('build-reads');
    assert(reads && !reads.hidden, 'the assembly reads back what the pieces currently spell');
    assert(reads.textContent.indexOf(D.TERMS[D.TRAVELERS[tid].term].spell) >= 0,
      `and spells it the way the corpus does (${reads.textContent.trim()})`);

    const struck = [...doc.querySelectorAll('#slotted .cv-gone')];
    assert(struck.length > 0,
      'the vowel this junction takes away is struck through on the tile that owns it, not quietly deleted');
  }

  console.log('\n== the bench and the Hall spell a build the same way ==');
  {
    /* Two places in the game join word-parts into a word. They must not be
       able to disagree, which is why the bench borrows the Hall's speller
       rather than growing a second one. */
    assert(typeof AR.wordOf === 'function', 'wordOf is a public export, not only a test hook');
    let mismatched = [];
    Object.keys(D.TERMS).forEach((id) => {
      const r = AR.wordOf(D.TERMS[id].build);
      if (!r || r.word !== D.TERMS[id].spell) mismatched.push(id);
    });
    assert(mismatched.length === 0,
      'the speller the assembly reads back reproduces every term in the corpus letter for letter: '
      + (mismatched.join(', ') || 'all ' + Object.keys(D.TERMS).length + ' agree'));
  }

  /* ================= 4. THE SCRIBE'S SEAL ================= */
  console.log('\n== the naming earns a named grade ==');
  {
    const SG = SC.SEAL_GRADES;
    assert(Array.isArray(SG) && SG.length === 4, `four grades (${SG && SG.length})`);
    assert(SG.every((g) => g.id && g.name && g.mark && g.why), 'each carries an id, a name, a mark and a reason');
    /* the table is read with `accuracy >= at`, so it only works descending */
    const ats = SG.map((g) => g.at);
    assert(ats.every((v, i) => i === 0 || ats[i - 1] > v),
      `the thresholds descend, which is what sealFor's find() depends on (${ats.join(' > ')})`);
    assert(SG[SG.length - 1].at === 0, 'and the last one catches everything, so a seal is never undefined');

    // accuracy is clamped to [0.35, 1] at the bench; every value in range lands
    for (let a = 0; a <= 1.0001; a += 0.05) {
      const g = SC.sealFor(Math.min(1, a));
      assert(!!g, `accuracy ${a.toFixed(2)} has a seal (${g && g.name})`);
    }
    assert(SC.sealFor(1).id === 'unbroken', 'a first-time unaided naming is Unbroken');
    assert(SC.sealFor(0.35).id === 'overwritten', 'and the floor of the clamp is Overwritten');
    assert(SC.sealFor(1).id !== SC.sealFor(0.78).id,
      'one wrong attempt is a different seal from none — the grade has to be able to move');
  }

  console.log('\n== the seal is earned, shown, and remembered ==');
  {
    const tid = travelersOfTier(2)[0];
    await openFor(tid);
    const need = D.TERMS[D.TRAVELERS[tid].term].build;
    need.forEach(place);
    await stampAndOpen(tid);

    const f = E.getFlow();
    assert(f.results[tid] && f.results[tid].seal === 'unbroken',
      'a clean naming records its seal on the result the road reads');

    const sealEl = doc.getElementById('reveal-seal');
    assert(sealEl && !sealEl.hidden, 'and the card shows it');
    assert(sealEl.dataset.seal === 'unbroken', 'tagged so the colour can deepen what the words already say');
    assert(/unbroken/i.test(sealEl.textContent), 'by name, not by colour alone');

    const stamp = doc.getElementById('reveal-stamp');
    assert(stamp.textContent === SC.SEAL_GRADES.find((g) => g.id === 'unbroken').mark,
      'the wax carries the grade the naming earned rather than a fixed sigma');
    assert(stamp.classList.contains('hit'), 'and it still lands');

    const seals = E.S().seals;
    assert(seals && seals.unbroken >= 1, 'a lifetime tally counts it');
  }

  console.log('\n== the seal sits inside the card, not over the question ==');
  {
    /* The pretest deliberately shows the word and nothing else. A verdict
       printed above that question is exactly the clutter it exists to
       remove, so the seal lives inside reveal-body and arrives with it. */
    const sealEl = doc.getElementById('reveal-seal');
    const body = doc.getElementById('reveal-body');
    assert(body && body.contains(sealEl),
      'the seal is a child of the body the pretest holds shut');
  }

  /* ================= 5. THE PRETEST REACHES TIER 2 ================= */
  console.log('\n== a guess is asked wherever the answer is not already on screen ==');
  {
    const tid = travelersOfTier(2)[0];
    await openFor(tid);
    D.TERMS[D.TRAVELERS[tid].term].build.forEach(place);
    await stampAndOpen(tid);
    const pre = doc.getElementById('reveal-pretest'), body = doc.getElementById('reveal-body');
    assert(!pre.hidden, 'a tier-2 term now asks what the player thinks it means before it opens');
    assert(body.hidden, 'and holds the breakdown, the definition and the seal shut while it asks');
    assert([...doc.querySelectorAll('.rp-opt')].length === 3, 'three candidate meanings');
  }
  {
    const tid = travelersOfTier(1)[0];
    await openFor(tid);
    D.TERMS[D.TRAVELERS[tid].term].build.forEach(place);
    await stampAndOpen(tid);
    assert(doc.getElementById('reveal-pretest').hidden,
      'tier 1 still does not, because it prints the definition as its own prompt — asking there is a reading test');
    assert(!doc.getElementById('reveal-body').hidden, 'so its card opens straight away');
  }

  console.log('\n== and the corpus can actually answer it everywhere it is now asked ==');
  {
    /* The pretest needs a sibling — a term sharing a word-part — or it
       silently does not fire. Moving the gate from tier 3 to tier 2 more
       than tripled the number of builds that depend on that. */
    const sibless = [];
    Object.keys(D.TRAVELERS).forEach((k) => {
      const t = D.TRAVELERS[k], T = D.TERMS[t.term];
      if (!T || t.tier < 2) return;
      const mine = new Set(T.build);
      const sibs = Object.keys(D.TERMS).filter((id) =>
        D.TERMS[id].spell !== T.spell && D.TERMS[id].build.some((p) => mine.has(p)));
      if (!sibs.length) sibless.push(`${k} (${T.spell})`);
    });
    assert(sibless.length === 0,
      'every tier-2 and tier-3 term has a near miss to be confused with: ' + (sibless.join(', ') || 'all covered'));
  }

  /* ================= 6. THE DEBRIEF NAMES THE SEAL ================= */
  console.log('\n== the road tells the player which seal each name carried ==');
  {
    assert(typeof SC.sealPayoff === 'function', 'the seal knows what it bought');
    SC.SEAL_GRADES.forEach((g) =>
      assert(typeof SC.sealPayoff(g) === 'string' && SC.sealPayoff(g).length > 10,
        `${g.name} says what it means for the walk ahead`));
  }

  /* ================= 7. SAVE COMPATIBILITY ================= */
  console.log('\n== an older save grows the tally rather than needing a migration ==');
  {
    const st = E.S();
    const before = JSON.parse(JSON.stringify(st.seals || {}));
    delete st.seals;                       // a save written before this pass
    const tid = travelersOfTier(3)[0];
    await openFor(tid);
    D.TERMS[D.TRAVELERS[tid].term].build.forEach(place);
    await stampAndOpen(tid);
    assert(E.S().seals && Object.keys(E.S().seals).length > 0,
      'a state with no seals shelf at all grows one on the next named term instead of throwing');
    assert(typeof before === 'object', 'and the pass did not need a migration step to do it');
  }

  assert(errors.length === 0, 'no window errors: ' + (errors.join(' | ') || 'clean'));
  summary(errors);
})();
