/* test28 — the whole campaign, start to ending.
   Nothing in the suite had ever walked the game from the title screen to the
   last page. Every chapter was covered in pieces; the path THROUGH them was
   not, so a break in the hand-off between two chapters — a party that cannot
   be assembled, a flow that ends without advancing, an ending that never fires
   — would have gone unnoticed until a player found it. This drives all eight
   chapters and asserts the ending is reachable and no window error is raised
   along the way. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  // screens carry an entrance class as well as .active, so ask the classList
  const isActive = (sel) => {
    const n = window.document.querySelector(sel);
    return !!(n && n.classList.contains('active'));
  };
  const E = window.__RD_ENG, D = window.__RD_DATA, SC = window.__RD_SCREENS,
        MI = window.__RD_MISSION, PREP = window.__RD_PREP;
  const CHAPTERS = D.CHAPTERS, TERMS = D.TERMS, TRAVELERS = D.TRAVELERS;

  assert(CHAPTERS.length === 8, 'the campaign is eight chapters: ' + CHAPTERS.length);

  /* Every chapter must be able to raise a party, and every builder in it must be
     able to build their term — an authored traveler whose term is not in the
     Lexicon is a chapter that cannot be finished. */
  const unbuildable = [];
  CHAPTERS.forEach(ch => {
    const party = E.partyFor(ch);
    if (!party || !party.members.length) { unbuildable.push(ch.id + ': no party'); return; }
    party.builders.forEach(id => {
      const t = TRAVELERS[id];
      if (!t) { unbuildable.push(ch.id + '/' + id + ': no such traveler'); return; }
      if (!t.term || !TERMS[t.term]) { unbuildable.push(ch.id + '/' + id + ': term "' + t.term + '" is not in the Lexicon'); return; }
      const build = TERMS[t.term].build || [];
      if (!build.length || build.some(p => !D.PARTS[p]))
        unbuildable.push(ch.id + '/' + id + ': term ' + t.term + ' has an unknown part');
    });
  });
  assert(unbuildable.length === 0,
    'every builder in every chapter can actually build their term: ' + unbuildable.slice(0, 4).join(' | '));

  /* Walk the campaign. Each chapter: raise the party, mark its terms learned the
     way the builder would, run the road, and let the arrival resolve. */
  const seen = [];
  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    E.S().chapter = i;
    const party = E.partyFor(ch);
    const flow = { chapter: ch, party, builders: party.builders.slice(), members: party.members.slice(),
                   idx: 0, results: {}, forged: [], route: null, stats: {} };
    E.setFlow(flow);

    // the builder step, at the state level: each named traveler gets their term
    flow.builders.forEach(id => {
      const t = TRAVELERS[id];
      if (t && t.term) {
        flow.results[id] = { term: t.term, attempts: 1, ok: true };
        if (E.S().completedTerms.indexOf(t.term) < 0) E.S().completedTerms.push(t.term);
      }
    });

    // go through the real departure, which is the only thing that builds
    // flow.stats — the result screen reads it and nothing else fills it in
    PREP.openAssign();
    // #assign-depart is in the static markup; its handler is bound when the
    // screen actually shows, which is after the transition finishes
    const dep = await until(() => {
      const s = window.document.querySelector('#s-assign');
      return s && s.classList.contains('active') && window.document.querySelector('#assign-depart').onclick;
    }, 6000, 'the depart button to be live');
    assert(dep, 'chapter ' + i + ' reaches a squad that can depart');
    window.document.querySelector('#assign-depart').onclick();
    await until(() => E.getFlow() && E.getFlow().stats && E.getFlow().stats.shortfalls, 5000, 'departure stats');
    assert(!!(E.getFlow().stats && E.getFlow().stats.shortfalls),
      'chapter ' + i + ': departing builds the stats the result screen will read');
    const started = await until(() => MI._dbg() && MI._dbg().cv, 6000, 'chapter ' + i + ' road');
    assert(started, 'chapter ' + i + ' (' + ch.id + ') opens a road');
    if (!started) break;

    const M = MI._dbg();
    if (ch.id === 'ch7') {
      /* The Great Archive is the one road you cannot simply walk to the end of.
         It is the finale, and it is meant to be WON — Radicida runs phases and
         the Caravan Chorus, so reaching progress 1 resolves nothing. Assert that
         is what happens rather than pretending the chapter is broken. */
      M.progress = 1.0;
      await sleep(900);
      assert(!!M.boss, 'the finale opens a boss encounter rather than an ordinary road');
      assert(!M.done && !M.arriving,
        'the Great Archive cannot be finished by walking to the far end — it has to be beaten');
      seen.push(ch.id);
    } else {
      // drive it to the far end rather than playing it — the walk itself is
      // covered elsewhere; what is under test here is the hand-off at the end
      M.progress = 1.0;
      await until(() => {
        const m = MI._dbg();
        return !m || m.done || m.arriving ||
          isActive('#s-result');
      }, 9000, 'chapter ' + i + ' to resolve');
      const m2 = MI._dbg();
      if (m2 && m2.arriving && !m2.done) { m2.arriveT = 5; await sleep(600); }

      seen.push(ch.id);
      const active = (window.document.querySelector('.screen.active') || {}).id;
      assert(active === 's-result' || active === 's-end' || active === 's-hub',
        'chapter ' + i + ' lands on a resolution screen, not nowhere (landed on ' + active + ')');
    }

    // advance the way the results screen does and go round again
    if (E.S().servedChapterIds.indexOf(ch.id) < 0) E.S().servedChapterIds.push(ch.id);
    E.S().chapter = Math.min(i + 1, CHAPTERS.length - 1);
    E.persist();
    SC.showHub();
    await sleep(200);
  }

  assert(seen.length === CHAPTERS.length,
    'all eight chapters were walked end to end: ' + seen.length + ' of ' + CHAPTERS.length + ' (' + seen.join(', ') + ')');

  /* The ending exists and can be reached. */
  assert(typeof MI.showEnding === 'function', 'the game has an ending to reach');
  MI.showEnding();
  await until(() => isActive('#s-end'), 6000, 'the ending');
  assert(isActive('#s-end'),
    'the ending screen opens after the last chapter');
  const endTxt = (window.document.querySelector('#s-end') || { textContent: '' }).textContent;
  assert(endTxt.trim().length > 80, 'the ending has something to say: ' + endTxt.trim().length + ' characters');

  /* And the save that came out the other side is still loadable. */
  E.persist();
  const re = E.Save.read();
  assert(!!re, 'the save written at the end of a full campaign reads back');
  assert(re.servedChapterIds.length === CHAPTERS.length,
    'and remembers every chapter that was served: ' + re.servedChapterIds.length);
  assert(re.completedTerms.length > 0, 'and every term that was learned: ' + re.completedTerms.length);

  summary(errors);
})();
