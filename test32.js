/* test32.js — THE JOURNEY, WITHOUT THE CLUTTER.

   Three claims:
     1. THE SKY IS ONE COLUMN. The momentum readout, the rune-gate prompt and
        the lieutenant's pressure meter used to sit at three fixed offsets over
        one element that grows — so a two-part combo pushed the gate prompt
        through the middle of the boss banner, and the one instruction that
        matters (which word the gate wants) was unreadable underneath it. They
        share a flex column now and cannot collide.
     2. INK MOTES ANSWER TO BUTTONS. clickSpark was bound to window and fired
        on every pointerdown anywhere: scrolling the Lexicon, dragging a tray
        tile, holding the mouse down to steer on the road.
     3. THE DECODE BELONGS TO THE THING BEING MADE. conceptBias resolved to a
        part of speech and nothing else, so a field kit whose order reads "read
        the suffix on the healer's list" asked which part means visual
        examination. */
const { boot, sleep, until, assert, summary } = require('./testlib');

(async () => {
  const { window, errors } = await boot();
  const doc = window.document;
  const E = window.__RD_ENG, D = window.__RD_DATA, P = window.__RD_PREP, MI = window.__RD_MISSION;
  const QE = window.__RD_QE;
  assert(E && D && P && MI && QE, 'modules exposed');

  /* ============ 1. the sky is one column ============ */
  {
    const hud = doc.getElementById('word-hud');
    const gate = doc.getElementById('gate-prompt');
    const eros = doc.getElementById('boss-erosion');
    assert(hud && gate && eros, 'the three sky elements exist');
    assert(gate.parentNode === hud,
      'the rune-gate prompt lives inside the momentum column instead of at its own fixed offset');
    assert(eros.parentNode === hud,
      "the lieutenant's pressure meter lives there too — it used to be pinned at top:166px under both of them");
    const order = [...hud.children].map(c => c.id);
    assert(order.indexOf('combo-build') < order.indexOf('gate-prompt'),
      'and they stack in reading order: what you are building, then what the gate wants');
    assert(order.indexOf('gate-prompt') < order.indexOf('boss-erosion'),
      'with the pressure meter last, under the instruction rather than over it');

    // nothing left in the stylesheet pins them
    const css = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
    assert(!/\.gate-prompt\{[^}]*position:absolute/.test(css),
      'the gate prompt no longer positions itself absolutely');
    assert(!/\.boss-erosion\{[^}]*top:166px/.test(css),
      'and the pressure meter has given up its fixed offset');
    assert(/\.word-hud\.hushed \.momentum/.test(css),
      'hushing the HUD for a term banner dims the momentum and the combo — not the gate prompt, which is asking for the next word');
  }

  /* ============ 2. ink motes answer to buttons ============ */
  {
    const before = doc.querySelectorAll('.spark').length;
    const fire = (el) => {
      const ev = new window.PointerEvent('pointerdown', { clientX: 40, clientY: 40, bubbles: true });
      el.dispatchEvent(ev);
    };
    const plain = doc.createElement('div');
    doc.body.appendChild(plain);
    fire(plain);
    assert(doc.querySelectorAll('.spark').length === before,
      'a click on ordinary page furniture makes no ink motes — this used to fire on every pointerdown in the document');

    const cv = doc.getElementById('missionCanvas');
    assert(cv && cv.hasAttribute('data-nospark'),
      'the road canvas is opted out by name: steering is a held pointer, and sparking it would fire on the frames the player most needs to watch');
  }

  /* ============ 3. the decode belongs to the thing being made ============ */
  {
    // give the player the whole corpus so the pool is not narrowed by what they
    // have met — the question here is whether the bias binds at all
    Object.keys(D.PARTS).forEach(id => { const m = E.S().mastery.parts[id]; if (m) m.seen = 1; });

    const RECOVER = ['plasty', 'stasis', 'poiesis', 'ant', 'penia', 'pathy', 'algia'];
    const CONTROL = ['tomy', 'ectomy', 'centesis', 'puncture', 'lysis', 'crit', 'scopy'];
    const sample = (bias, n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const q = QE.generate({ conceptBias: bias, allowTF: false, types: ['partMeaning', 'meaningPart'] });
        if (q.conceptIds && q.conceptIds[0]) out.push(q.conceptIds[0]);
      }
      return out;
    };
    const rec = sample('recover', 40);
    assert(rec.length > 20, 'the engine answers a biased request');
    const strayR = rec.filter(id => !RECOVER.includes(id));
    assert(strayR.length === 0,
      `a field kit's order asks about a healer's vocabulary, every time (${[...new Set(strayR)].join(', ') || 'none stray'})`);

    const con = sample('control', 40);
    const strayC = con.filter(id => !CONTROL.includes(id));
    assert(strayC.length === 0,
      `a blade's order asks about cutting words (${[...new Set(strayC)].join(', ') || 'none stray'})`);

    assert(new Set(rec).size > 1 && new Set(con).size > 1,
      'the pools are pools, not one part repeated — the bench does not ask the same question every road');

    // and the pool must never ask about something the campaign has not reached
    Object.keys(D.PARTS).forEach(id => { const m = E.S().mastery.parts[id]; if (m) { m.seen = 0; m.correct = 0; m.wrong = 0; } });
    const only = 'stasis';
    E.S().mastery.parts[only].seen = 1;
    const narrow = sample('recover', 20);
    assert(narrow.every(id => id === only),
      `with one recovery word met, that is the one the bench asks about (${[...new Set(narrow)].join(', ')})`);
  }

  summary(errors);
})();
