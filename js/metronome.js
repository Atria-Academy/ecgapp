/* ============================================================
   PALS Rhythm Quest · Metrônomo de RCP
   Áudio Web Audio com agendamento por lookahead (tempo estável),
   pulso visual, contador de compressões e logo da STOP.
   Alvo PALS: 100–120 compressões/min. Componente reutilizável.
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.metro = (function () {

  function create(container, opts) {
    opts = opts || {};
    var bpm = opts.bpm || 110;
    var logo = (PRQ.STOP && PRQ.STOP.logo) || '';

    container.innerHTML =
      '<div class="metro">' +
        '<div class="metro-head">' +
          (logo ? '<img class="metro-logo" src="' + logo + '" alt="Sociedade Tocantinense de Pediatria" width="' + (PRQ.STOP.logoW || 594) + '" height="' + (PRQ.STOP.logoH || 304) + '" loading="lazy">' : '') +
          '<div class="metro-id"><span class="metro-kicker">Guia de RCP</span><h3>Metrônomo</h3></div>' +
        '</div>' +
        '<div class="metro-pulse" data-pulse>' +
          '<span class="metro-ring"></span>' +
          '<span class="metro-center"><b data-bpm>' + bpm + '</b><small>compressões/min</small></span>' +
        '</div>' +
        '<div class="metro-counter"><span>ciclo 30:2</span><b data-count>0</b><span>/ 30</span></div>' +
        '<button class="metro-toggle" data-toggle>▶ Iniciar</button>' +
        '<div class="metro-rate">' +
          '<button class="metro-step" data-step="-5" aria-label="diminuir">−</button>' +
          '<input type="range" class="metro-range" data-range min="60" max="150" step="1" value="' + bpm + '" aria-label="Frequência em compressões por minuto">' +
          '<button class="metro-step" data-step="5" aria-label="aumentar">+</button>' +
        '</div>' +
        '<div class="metro-presets">' +
          '<button data-preset="100">100</button>' +
          '<button data-preset="110">110</button>' +
          '<button data-preset="120">120</button>' +
        '</div>' +
        '<label class="metro-302"><input type="checkbox" data-302> Avisar a cada 30 (pausa para ventilar)</label>' +
        '<p class="metro-hint">Alvo PALS: <b>100–120/min</b>, profundidade de cerca de ⅓ do tórax, permita o retorno total do tórax e minimize as interrupções.</p>' +
      '</div>';

    var elPulse = container.querySelector('[data-pulse]');
    var elBpm = container.querySelector('[data-bpm]');
    var elCount = container.querySelector('[data-count]');
    var elToggle = container.querySelector('[data-toggle]');
    var elRange = container.querySelector('[data-range]');
    var el302 = container.querySelector('[data-302]');

    var ctx = null, running = false, nextTime = 0, beat = 0, timer = null;
    var lookahead = 0.12, tickMs = 25, mode302 = false;

    function ensureCtx() {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; ctx = AC ? new AC() : null; }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function click(time, accent) {
      if (!ctx) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = accent ? 1560 : 1040;
      o.connect(g); g.connect(ctx.destination);
      var vol = accent ? 0.85 : 0.5;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(vol, time + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      o.start(time); o.stop(time + 0.06);
    }

    function flash(delayMs, accent, count) {
      setTimeout(function () {
        if (!running) return;
        elPulse.classList.remove('beat', 'accent');
        void elPulse.offsetWidth;                 // reinicia a animação
        elPulse.classList.add(accent ? 'accent' : 'beat');
        if (count != null) elCount.textContent = count;
      }, Math.max(0, delayMs));
    }

    function scheduler() {
      if (!running) return;
      if (!container.isConnected) { stop(); return; }   // trocou de página (SPA)
      var spb = 60 / bpm;
      while (nextTime < ctx.currentTime + lookahead) {
        var pos = beat % 30;                             // 0..29
        var accent = mode302 && pos === 29;              // 30ª compressão: pausa p/ ventilar
        var delay = (nextTime - ctx.currentTime) * 1000;
        click(nextTime, accent);
        flash(delay, accent, pos + 1);
        beat++;
        nextTime += spb;
      }
      timer = setTimeout(scheduler, tickMs);
    }

    function start() {
      ensureCtx();
      if (!ctx) { alert('Áudio não suportado neste navegador. Atualize o navegador ou use outro.'); return; }
      running = true; beat = 0; nextTime = ctx.currentTime + 0.1;
      elToggle.textContent = '⏸ Parar'; elToggle.classList.add('on');
      scheduler();
    }

    function stop() {
      running = false;
      if (timer) { clearTimeout(timer); timer = null; }
      elToggle.textContent = '▶ Iniciar'; elToggle.classList.remove('on');
      elPulse.classList.remove('beat', 'accent');
    }

    function setBpm(v) {
      bpm = Math.max(60, Math.min(150, Math.round(v)));
      elBpm.textContent = bpm; elRange.value = bpm;
      elBpm.classList.toggle('inzone', bpm >= 100 && bpm <= 120);
      container.querySelectorAll('.metro-presets button').forEach(function (b) {
        b.classList.toggle('on', +b.dataset.preset === bpm);
      });
    }

    elToggle.addEventListener('click', function () { running ? stop() : start(); });
    elRange.addEventListener('input', function () { setBpm(+elRange.value); });
    container.querySelectorAll('.metro-step').forEach(function (b) {
      b.addEventListener('click', function () { setBpm(bpm + (+b.dataset.step)); });
    });
    container.querySelectorAll('.metro-presets button').forEach(function (b) {
      b.addEventListener('click', function () { setBpm(+b.dataset.preset); });
    });
    el302.addEventListener('change', function () { mode302 = el302.checked; });
    // pausa o áudio se a aba for escondida
    document.addEventListener('visibilitychange', function () { if (document.hidden && running) stop(); });

    setBpm(bpm);
    return { start: start, stop: stop, setBpm: setBpm };
  }

  return { create: create };
})();
