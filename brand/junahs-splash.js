/*!
 * Junahs splash — "a junahs game" intro.
 * Usage: <script src="junahs-splash.js"></script> as the first script in <body>.
 * Plays ~2.2s on ink, then removes itself. Any key, click or tap skips it.
 * When it finishes, it fires `junahs:splash-done` on window, so a game can wait for it:
 *   window.addEventListener('junahs:splash-done', startGame, { once: true });
 * Options (set before the script loads): window.JUNAHS_SPLASH = { duration: 2200, disabled: false, sound: true, volume: 0.18 }
 * window.JunahsChime() plays the chime on its own (e.g. from a Start button).
 */
(function () {
  var opts = window.JUNAHS_SPLASH || {};
  function done() { window.dispatchEvent(new Event('junahs:splash-done')); }
  if (opts.disabled) { setTimeout(done, 0); return; }

  var duration = opts.duration || 2200;
  var soundOn = opts.sound !== false;
  var volume = opts.volume == null ? 0.18 : opts.volume;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.querySelector('link[data-junahs-font]')) {
    var font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap';
    font.setAttribute('data-junahs-font', '');
    document.head.appendChild(font);
  }

  var css = document.createElement('style');
  css.textContent =
    '#junahs-splash{position:fixed;inset:0;z-index:2147483647;background:#17171f;color:#fff6e6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3vmin;font-family:Fredoka,Nunito,system-ui,sans-serif;cursor:pointer;transition:opacity .35s ease}' +
    '#junahs-splash.out{opacity:0}' +
    '#junahs-splash svg{width:22vmin;height:22vmin;max-width:160px;max-height:160px}' +
    '#junahs-splash .t{font-size:clamp(18px,4.2vmin,32px);font-weight:500}' +
    '#junahs-splash .t b{font-weight:700}' +
    '@keyframes jn-in{0%{transform:rotate(-180deg) scale(.4);opacity:0}100%{transform:none;opacity:1}}' +
    '@keyframes jn-up{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}' +
    '#junahs-splash .s{transform-box:view-box;transform-origin:32px 32px;animation:jn-in .9s cubic-bezier(.3,1.4,.5,1) both}' +
    '#junahs-splash .t{animation:jn-up .5s ease-out .6s both}' +
    '@media (prefers-reduced-motion:reduce){#junahs-splash .s,#junahs-splash .t{animation:none}}';
  document.head.appendChild(css);

  var el = document.createElement('div');
  el.id = 'junahs-splash';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'a junahs game');
  el.innerHTML =
    '<svg viewBox="0 0 64 64" aria-hidden="true"><g class="s">' +
    '<path d="M30.5 30.5H6.5A24 24 0 0 1 30.5 6.5Z" fill="#ff3b3b"/>' +
    '<circle cx="45.5" cy="18.5" r="11" fill="#ffc21a"/>' +
    '<rect x="35" y="35" width="21.5" height="21.5" rx="5" fill="#2f6bff"/>' +
    '<path d="M18.5 36.5L29 55H8Z" fill="#fff6e6" stroke="#fff6e6" stroke-width="3" stroke-linejoin="round"/>' +
    '</g></svg><div class="t">a <b>junahs</b> game</div>';

  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    removeEventListener('keydown', onKey, true);
    el.classList.add('out');
    setTimeout(function () { el.remove(); css.remove(); done(); }, reduce ? 0 : 350);
  }

  // Sonic logo: four notes, one per shape (C5 E5 G5 C6), rising with the spin.
  // Browsers only allow sound after the player has interacted with the page,
  // so if audio is blocked the splash simply plays silently.
  function chime() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC(), asked = Date.now();
      var go = function () {
        var t0 = ctx.currentTime + 0.05, master = ctx.createGain();
        master.gain.value = volume;
        master.connect(ctx.destination);
        [[523.25, 0, 0.5], [659.25, 0.13, 0.5], [783.99, 0.26, 0.5], [1046.5, 0.55, 1.1]].forEach(function (n) {
          [[0, 'sine', 0.6], [4, 'triangle', 0.25]].forEach(function (v) {
            var o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + n[1];
            o.type = v[1]; o.frequency.value = n[0]; o.detune.value = v[0];
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(v[2], t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + n[2]);
            o.connect(g); g.connect(master);
            o.start(t); o.stop(t + n[2] + 0.05);
          });
        });
        setTimeout(function () { ctx.close(); }, 2000);
      };
      if (ctx.state === 'running') go();
      else ctx.resume().then(function () {
        if (ctx.state === 'running' && Date.now() - asked < 400) go(); else ctx.close();
      }, function () {});
    } catch (e) {}
  }
  window.JunahsChime = function () { chime(); };

  function onKey(e) { e.stopImmediatePropagation(); e.preventDefault(); finish(); }

  function mount() {
    document.body.appendChild(el);
    if (soundOn) chime();
    el.addEventListener('pointerdown', finish);
    addEventListener('keydown', onKey, true);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  var timer = setTimeout(finish, duration);
})();
