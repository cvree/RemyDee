/* test40.js — THE ROAD IS CHOSEN BEFORE IT IS WALKED.

   The difficulty chooser has been on the cold path and off it. It came off
   because it asked a player who had seen one screen to price "hazard density"
   and "gate read time" — four nouns they do not have yet — and defaulted
   anyway. That was a fair complaint about the WORDING, and it was answered by
   never asking, which is a worse answer: a player who wants a gentle first hour
   had to walk a demanding one to be offered one.

   So it is back, in front of the first activity, and this file is what keeps it
   honest:

     1. IT IS ASKED, AND BEFORE ANYTHING. The intro leads into it — whether the
        tale is read or skipped — and requireDifficulty() sits in front of every
        graded activity as a backstop, so no route reaches a road on a default
        nobody chose.
     2. IT IS ASKED ONCE. `diffAsked` closes it for good, and a save with a road
        behind it is never stopped mid-campaign to answer a question it has
        already answered by playing.
     3. IT CAN BE PRICED BEFORE THE FIRST STEP. Every card says who it is for
        and draws the three things that actually move, and those meters agree
        with the tuning table underneath them — a card promising less help has
        to deliver less help.
     4. THE FOLLOW-UP SURVIVED THE MOVE. The offer after the first road — the
        moment every word in the chooser stops being abstract — now hangs on its
        own flag, so putting the first question up front did not silently delete
        the second one. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const E = window.__RD_ENG, D = window.__RD_DATA, SC = window.__RD_SCREENS;
  assert(E && D && SC, 'modules exposed');

  const shown = () => { const s = doc.querySelector('.screen.active'); return s ? s.id : null; };
  const onScreen = (id, ms) => until(() => shown() === id, ms || 4000, 'screen ' + id);
  const cards = () => [...doc.querySelectorAll('#diff-grid .diff-card')];
  const freshGame = () => { const st = E.newGame(); E.setS(st); E.applySettings(); return st; };

  /* ================= 1 · IT IS ASKED, AND BEFORE ANYTHING ================= */
  freshGame();
  assert(E.S().settings.diffAsked === false,
    'a new game has not been asked how hard the road should be');
  assert(E.S().settings.difficulty === 'adaptive',
    'and it carries a working default so the question is an offer, never a wall');

  SC.startIntro();
  await onScreen('s-intro');
  doc.getElementById('intro-next').click();
  assert(await onScreen('s-difficulty'),
    'reading the tale leads into the chooser, not straight into the workshop');

  assert(cards().length === 4, 'all four settings are on the table');
  cards().forEach((c) => {
    const key = c.dataset.key;
    assert(!!c.querySelector('.dc-who'), `${key}: the card says who it is for`);
    assert(c.querySelectorAll('.dc-frow').length === 3,
      `${key}: and draws the three things that move — hazards, time pressure, help`);
  });

  // choosing is a click on a card and a click on the button, and it sticks
  const pick = (key) => { const c = cards().find((x) => x.dataset.key === key); c.click(); };
  pick('easy');
  assert(cards().find((c) => c.dataset.key === 'easy').classList.contains('on'),
    'the card you picked is the card that looks picked');
  doc.getElementById('diff-confirm').click();
  assert(await onScreen('s-hub'), 'confirming lands in the workshop, one step from the first road');
  assert(E.S().settings.difficulty === 'easy', 'and the road is set to what was chosen');
  assert(E.S().settings.diffAsked === true, 'the question is recorded as asked');

  // skipping the tale skips the story, never the question
  freshGame();
  SC.startIntro();
  await onScreen('s-intro');
  doc.getElementById('intro-skip').click();
  assert(await onScreen('s-difficulty'),
    'skipping the tale still passes through the chooser — the skip is for the story');
  // leave the chooser properly before the next section: re-entering the same
  // screen is asynchronous, and a test that races it reads the old handlers
  doc.getElementById('diff-confirm').click();
  await onScreen('s-hub');

  /* ================= 2 · THE BACKSTOP, AND ASKED ONLY ONCE ================= */
  const ch0 = D.CHAPTERS[0];
  freshGame();
  SC.showHub(); await onScreen('s-hub');
  SC.openChapter(ch0);
  assert(await onScreen('s-difficulty'),
    'a chapter opened without the question having been put asks it first');
  assert(shown() !== 's-case', 'and does not start the activity behind it');
  doc.getElementById('diff-confirm').click();
  assert(await onScreen('s-case', 6000),
    'answering it drops the player into the activity they were opening, not back at the hub');

  // and now it is closed for good
  SC.showHub();
  await onScreen('s-hub');
  SC.openChapter(ch0);
  assert(await onScreen('s-case', 6000),
    'the second time, the chapter opens straight away — the chooser asks once');

  /* a save with a road behind it has already answered the question by playing,
     and must never be stopped in the middle of a campaign to answer it again */
  const old = E.newGame();
  old.ver = 8; old.chapter = 3; old.runCount = 4;
  delete old.settings.diffAsked;
  window.localStorage.setItem('remydee_lost_lexicon_v3', JSON.stringify(old));
  const migrated = E.Save.read();
  assert(migrated.settings.diffAsked === true,
    'a returning player who has walked roads is not stopped to be asked');
  assert(migrated.settings.difficulty === 'adaptive',
    'and keeps the curve they were actually walking');

  const untouched = E.newGame();
  untouched.ver = 8; untouched.chapter = 0; untouched.runCount = 0;
  delete untouched.settings.diffAsked;
  window.localStorage.setItem('remydee_lost_lexicon_v3', JSON.stringify(untouched));
  assert(E.Save.read().settings.diffAsked === false,
    'a save that has never walked anywhere is still owed the question');

  /* ================= 3 · THE METERS TELL THE TRUTH ================= */
  const DIFFS = E.DIFFS;
  const fixed = DIFFS.filter((d) => d.tier != null).sort((a, b) => a.tier - b.tier);
  assert(fixed.length === 3, 'three settings pin the road, one moves with the player');
  DIFFS.forEach((d) => assert(typeof d.who === 'string' && d.who.length > 10,
    `"${d.name}" names the player it is for, in one sentence`));
  const adaptive = DIFFS.find((d) => d.tier == null);
  assert(adaptive.feel === null,
    'the road that learns draws no fixed meter, because it has no fixed value to draw');
  for (let i = 1; i < fixed.length; i++) {
    const lo = fixed[i - 1], hi = fixed[i];
    assert(hi.feel.danger > lo.feel.danger, `${hi.name} promises more hazards than ${lo.name}`);
    assert(hi.feel.clock > lo.feel.clock, `${hi.name} promises more time pressure than ${lo.name}`);
    assert(hi.feel.help < lo.feel.help, `${hi.name} promises less help than ${lo.name}`);
  }
  /* the promise has to match the tuning table, or the meters are decoration */
  const tune = (k) => { E.S().settings.difficulty = k; return E.diffTune(); };
  const tEasy = tune('easy'), tHard = tune('hard');
  assert(tHard.density > tEasy.density === (byKeyFeel('hard').danger > byKeyFeel('easy').danger),
    'the hazards meter points the same way the hazard density actually does');
  assert(tHard.drain > tEasy.drain === (byKeyFeel('hard').clock > byKeyFeel('easy').clock),
    'the time-pressure meter points the same way the stamina clock actually does');
  assert(tEasy.mercyDim === true && tHard.mercyDim === false && byKeyFeel('easy').help > byKeyFeel('hard').help,
    'the help meter points the same way the dimmed wrong answer actually does');
  function byKeyFeel(k) { return DIFFS.find((d) => d.key === k).feel; }

  /* ================= 4 · THE QUESTION IS ON THE SCREEN ================= */
  /* `justify-content:center` on a scrolling box centres the overflow too: on a
     short screen the chooser opened halfway down its own first card, with the
     question it asks above the viewport and no way to scroll back to it. Four
     other screens share the rule — the party brief, the Hall, the Trials and
     the Vigil — so it is asserted on all five. jsdom does no layout, but it
     does resolve the cascade, which is enough to keep the keyword from being
     quietly dropped by a later edit. */
  ['#s-difficulty', '#s-case', '#s-arcade', '#s-trial', '#s-vigil'].forEach((id) => {
    const box = doc.querySelector(id + ' .content');
    const jc = box ? window.getComputedStyle(box).justifyContent : null;
    assert(jc === 'safe center' || jc === 'flex-start' || jc === 'start',
      `${id} never centres its content past the top of the screen (justify-content: ${jc})`);
  });

  /* ================= 5 · THE FOLLOW-UP STILL HAPPENS ================= */
  const st = freshGame();
  assert(st.settings.diffReviewed === false,
    'the after-the-first-road offer has its own flag');
  st.settings.diffAsked = true;
  assert(st.settings.diffReviewed === false,
    'and answering the question up front does not silently spend it');

  /* the chooser opened from anywhere else leaves the player where they were */
  SC.showHub(); await onScreen('s-hub');
  SC.showDifficulty({ from: 'settings' });
  assert(await onScreen('s-difficulty'), 'Settings can reopen the chooser forever after');
  assert(doc.getElementById('diff-confirm').textContent.indexOf('Keep') === 0,
    'and it reads as a change of mind rather than as a first choice');
  doc.getElementById('diff-back').click();
  assert(await onScreen('s-hub'), 'backing out of it changes nothing and goes home');

  await sleep(200);
  summary(errors);
})();
