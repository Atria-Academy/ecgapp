/* ============================================================
   PALS Rhythm Quest · Monitor de simulação (modo apresentador)
   Motor do monitor multiparamétrico: 3 canais sincronizados
   (ECG, pletismografia/SpO2, capnografia/CO2), presets de ritmo
   pediátricos e renderização dos números. Reaproveita PRQ.ecg
   para o traçado de ECG por ritmo.
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.monitor = (function () {
  var FS = 240, DUR = 6;

  /* ---------- teclado de ritmos (foco pediátrico / PALS) ----------
     gen = gerador em PRQ.ecg; hr = 'rate' mostra FC, 'none' oculta.
     pulso: se há pulso central (define pleth/PA/SpO2 mensuráveis). */
  var RITMOS = [
    { id: 'sinusal',    sigla: 'RS',    nome: 'Ritmo sinusal',        gen: 'sinusal',    fc: 110, pulso: true,  hr: 'rate', tom: 'ok' },
    { id: 'brady',      sigla: 'BS',    nome: 'Bradicardia sinusal',  gen: 'bradicardia',fc: 52,  pulso: true,  hr: 'rate', tom: 'warn' },
    { id: 'taqsinusal', sigla: 'TS',    nome: 'Taquicardia sinusal',  gen: 'taqsinusal', fc: 165, pulso: true,  hr: 'rate', tom: 'warn' },
    { id: 'tsv',        sigla: 'TSV',   nome: 'TSV / PSVT',           gen: 'tsv',        fc: 235, pulso: true,  hr: 'rate', tom: 'bad' },
    { id: 'afib',       sigla: 'FA',    nome: 'Fibrilação atrial',    gen: 'afib',       fc: 150, pulso: true,  hr: 'rate', tom: 'bad' },
    { id: 'aflutter',   sigla: 'FLA',   nome: 'Flutter atrial',       gen: 'aflutter',   fc: 150, pulso: true,  hr: 'rate', tom: 'bad' },
    { id: 'extra',      sigla: 'ESV',   nome: 'Extrassístoles (PVC)', gen: 'extra',      fc: 96,  pulso: true,  hr: 'rate', tom: 'warn' },
    { id: 'tv',         sigla: 'TV',    nome: 'TV com pulso',         gen: 'tv',         fc: 200, pulso: true,  hr: 'rate', tom: 'bad' },
    { id: 'tvsp',       sigla: 'TVsp',  nome: 'TV sem pulso',         gen: 'tv',         fc: 200, pulso: false, hr: 'rate', tom: 'bad' },
    { id: 'fv',         sigla: 'FV',    nome: 'Fibrilação ventricular',gen: 'fv',        fc: 0,   pulso: false, hr: 'none', tom: 'bad' },
    { id: 'assistolia', sigla: 'ASS',   nome: 'Assistolia',           gen: 'assistolia', fc: 0,   pulso: false, hr: 'none', tom: 'bad' },
    { id: 'aesp',       sigla: 'AESP',  nome: 'AESP (atividade elétrica sem pulso)', gen: 'sinusal', fc: 68, pulso: false, hr: 'rate', tom: 'bad' },
    { id: 'bavt',       sigla: 'BAVT',  nome: 'BAV total',            gen: 'bavt',       fc: 44,  pulso: true,  hr: 'rate', tom: 'bad' }
  ];
  var BY_ID = {};
  RITMOS.forEach(function (r) { BY_ID[r.id] = r; });

  function ritmo(id) { return BY_ID[id] || RITMOS[0]; }

  /* vitais sugeridos ao escolher um ritmo (o apresentador pode sobrepor) */
  function preset(id) {
    var r = ritmo(id);
    var base = { ritmo: id, fc: r.fc, pulso: r.pulso, pas: 95, pad: 60, spo2: 98, etco2: 35, fr: 24, temp: 37.0 };
    var over = {
      sinusal:    {},
      brady:      { spo2: 95, fr: 20 },
      taqsinusal: { pas: 100, pad: 62, spo2: 96, fr: 34 },
      tsv:        { pas: 78, pad: 48, spo2: 94, fr: 40 },
      afib:       { pas: 92, pad: 58, spo2: 95 },
      aflutter:   { pas: 94, pad: 60, spo2: 96 },
      extra:      { spo2: 97 },
      tv:         { pas: 70, pad: 44, spo2: 90, fr: 36 },
      tvsp:       { spo2: 0, etco2: 14, fr: 0 },
      fv:         { spo2: 0, etco2: 12, fr: 0 },
      assistolia: { spo2: 0, etco2: 8,  fr: 0 },
      aesp:       { spo2: 0, etco2: 15, fr: 0 },
      bavt:       { pas: 80, pad: 50, spo2: 95, fr: 26 }
    }[id] || {};
    for (var k in over) base[k] = over[k];
    return base;
  }

  /* ---------- síntese de pletismografia (SpO2) ---------- */
  function plethBuf(fc, pulso, dur, fs) {
    var n = Math.floor(dur * fs), out = new Float32Array(n);
    if (!pulso || !fc) return out; // sem pulso: linha isoelétrica
    var rr = 60 / fc;
    for (var i = 0; i < n; i++) {
      var ti = i / fs;
      var ph = (ti % rr) / rr; // 0..1 no batimento
      // subida sistólica rápida + entalhe dicrótico
      var v = Math.exp(-Math.pow((ph - 0.16) / 0.085, 2)) * 1.0
            + Math.exp(-Math.pow((ph - 0.34) / 0.07, 2)) * 0.32;
      out[i] = v;
    }
    return out;
  }

  /* ---------- síntese de capnografia (EtCO2) ---------- */
  function capnoBuf(fr, etco2, dur, fs) {
    var n = Math.floor(dur * fs), out = new Float32Array(n);
    if (!fr || !etco2) return out; // apneia: sem onda
    var T = 60 / fr, lvl = Math.max(0, Math.min(1, etco2 / 60));
    for (var i = 0; i < n; i++) {
      var ti = i / fs, ph = (ti % T) / T, v = 0;
      if (ph < 0.32) v = 0;                                 // inspiração / base
      else if (ph < 0.40) v = lvl * (ph - 0.32) / 0.08;     // subida expiratória
      else if (ph < 0.92) v = lvl * (0.94 + 0.06 * (ph - 0.40) / 0.52); // platô alveolar
      else v = lvl * (1 - (ph - 0.92) / 0.08);              // queda inspiratória
      out[i] = v;
    }
    return out;
  }

  /* ---------- desenho ---------- */
  function sizeCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(10, rect.width), h = Math.max(10, rect.height);
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { w: canvas.width, h: canvas.height, dpr: dpr };
  }

  function grid(ctx, w, h, tint) {
    ctx.fillStyle = '#06090e';
    ctx.fillRect(0, 0, w, h);
    var m = Math.max(7, Math.round(w / 70));
    ctx.strokeStyle = tint.g1; ctx.lineWidth = 1; ctx.beginPath();
    for (var x = 0; x <= w; x += m) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (var y = 0; y <= h; y += m) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = tint.g2; ctx.beginPath();
    for (var X = 0; X <= w; X += m * 5) { ctx.moveTo(X + 0.5, 0); ctx.lineTo(X + 0.5, h); }
    for (var Y = 0; Y <= h; Y += m * 5) { ctx.moveTo(0, Y + 0.5); ctx.lineTo(w, Y + 0.5); }
    ctx.stroke();
  }

  function traceLane(ctx, data, w, h, color, baseFrac, scaleFrac, glow) {
    var n = data.length, baseline = h * baseFrac, scale = h * scaleFrac;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = glow; ctx.shadowBlur = Math.max(3, h * 0.05);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.6, h * 0.02);
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * w, yv = baseline - data[i] * scale;
      i === 0 ? ctx.moveTo(x, yv) : ctx.lineTo(x, yv);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function sweep(ctx, w, h, phase, color) {
    var x = phase * w, gap = Math.max(24, w * 0.06);
    ctx.fillStyle = 'rgba(6, 9, 14, 0.9)';
    if (x + gap <= w) ctx.fillRect(x, 0, gap, h);
    else { ctx.fillRect(x, 0, w - x, h); ctx.fillRect(0, 0, gap - (w - x), h); }
    var g = ctx.createLinearGradient(x - 3, 0, x, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.fillRect(x - 3, 0, 3, h);
  }

  var TINT = {
    ecg:   { color: '#46D6A2', glow: 'rgba(70,214,162,0.5)',  g1: 'rgba(70,214,162,0.05)',  g2: 'rgba(70,214,162,0.09)',  cur: 'rgba(70,214,162,0.95)' },
    pleth: { color: '#5AD1E6', glow: 'rgba(90,209,230,0.5)',  g1: 'rgba(90,209,230,0.05)',  g2: 'rgba(90,209,230,0.09)',  cur: 'rgba(90,209,230,0.95)' },
    capno: { color: '#E7C15A', glow: 'rgba(231,193,90,0.45)', g1: 'rgba(231,193,90,0.045)', g2: 'rgba(231,193,90,0.08)',  cur: 'rgba(231,193,90,0.9)' }
  };

  /* R-picos para marcadores de SYNC (cardioversão sincronizada) */
  function rPeaks(data, fs) {
    var peaks = [], n = data.length, thr = 0.55, refr = Math.floor(0.2 * fs), last = -refr;
    for (var i = 2; i < n - 2; i++) {
      if (data[i] > thr && data[i] >= data[i - 1] && data[i] > data[i + 1] && (i - last) > refr) {
        peaks.push(i); last = i;
      }
    }
    return peaks;
  }

  /* ---------- motor de animação ---------- */
  function createEngine(o) {
    var getState = o.getState;
    var ecgC = o.ecg, plethC = o.pleth, capnoC = o.capno;
    var sig = '', ecgB = null, plB = null, cpB = null, peaks = [];
    var raf = null, t0 = null, stopped = false, speed = o.sweepSeg || 4.0;

    function rebuild(s) {
      var r = ritmo(s.ritmo);
      ecgB = PRQ.ecg.trace(r.gen, r.fc || s.fc || 100, s.seed || 7, DUR, FS).data;
      plB = plethBuf(s.fc, s.pulso, DUR, FS);
      cpB = capnoBuf(s.fr, s.etco2, DUR, FS);
      peaks = rPeaks(ecgB, FS);
    }

    function frame(ts) {
      if (stopped) return;
      if (!ecgC.isConnected) { stopped = true; return; }
      var s = getState();
      var mySig = [s.ritmo, s.fc, s.pulso, s.fr, s.etco2, s.seed].join('|');
      if (mySig !== sig) { sig = mySig; rebuild(s); }
      if (t0 === null) t0 = ts;
      var running = s.running !== false;
      var phase = running ? (((ts - t0) / 1000 / speed) % 1) : ((sig ? 0.9999 : 0));
      if (!running && frame._frozen == null) frame._frozen = phase;
      var ph = running ? phase : (frame._frozen || 0.9999);
      if (running) frame._frozen = null;

      // ECG
      var ew = sizeCanvas(ecgC), ectx = ecgC.getContext('2d');
      grid(ectx, ew.w, ew.h, TINT.ecg);
      traceLane(ectx, ecgB, ew.w, ew.h, TINT.ecg.color, 0.56, 0.30, TINT.ecg.glow);
      if (s.sync && s.pulso) drawSync(ectx, ew.w, ew.h);
      if (s.pacer) drawPacer(ectx, ew.w, ew.h, s);
      if (running) sweep(ectx, ew.w, ew.h, ph, TINT.ecg.cur);
      drawFlash(ectx, ew.w, ew.h, s);

      // Pleth
      if (plethC) {
        var pw = sizeCanvas(plethC), pctx = plethC.getContext('2d');
        grid(pctx, pw.w, pw.h, TINT.pleth);
        traceLane(pctx, plB, pw.w, pw.h, TINT.pleth.color, 0.82, 0.62, TINT.pleth.glow);
        if (running) sweep(pctx, pw.w, pw.h, ph, TINT.pleth.cur);
      }
      // Capno
      if (capnoC) {
        var cw = sizeCanvas(capnoC), cctx = capnoC.getContext('2d');
        grid(cctx, cw.w, cw.h, TINT.capno);
        traceLane(cctx, cpB, cw.w, cw.h, TINT.capno.color, 0.86, 0.66, TINT.capno.glow);
        if (running) sweep(cctx, cw.w, cw.h, ph, TINT.capno.cur);
      }
      raf = requestAnimationFrame(frame);
    }

    function drawSync(ctx, w, h) {
      ctx.fillStyle = 'rgba(90,209,230,0.9)';
      for (var i = 0; i < peaks.length; i++) {
        var x = (peaks[i] / (ecgB.length - 1)) * w;
        ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x - 4, 12); ctx.lineTo(x + 4, 12); ctx.closePath(); ctx.fill();
      }
    }
    function drawPacer(ctx, w, h, s) {
      var rr = 60 / (s.pacerFc || 80), nSp = Math.floor(DUR / rr);
      ctx.strokeStyle = 'rgba(231,193,90,0.9)'; ctx.lineWidth = Math.max(1.4, h * 0.015);
      for (var k = 0; k < nSp; k++) {
        var x = ((k * rr) / DUR) * w;
        ctx.beginPath(); ctx.moveTo(x, h * 0.56); ctx.lineTo(x, h * 0.24); ctx.stroke();
      }
    }
    function drawFlash(ctx, w, h, s) {
      if (!s.flashAt) return;
      var dt = Date.now() - s.flashAt;
      if (dt < 0 || dt > 220) return;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - dt / 220)).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }

    raf = requestAnimationFrame(frame);
    return { stop: function () { stopped = true; if (raf) cancelAnimationFrame(raf); }, invalidate: function () { sig = ''; } };
  }

  /* ---------- render dos números (compartilhado com o espelho) ---------- */
  function fmtPA(s) { return s.pulso && s.pas ? (s.pas + '/' + s.pad) : '--'; }
  function fmtHR(s) {
    var r = ritmo(s.ritmo);
    if (r.hr === 'none') return '--';
    return s.fc ? String(s.fc) : '--';
  }
  function renderNumbers(root, s) {
    root = root || document;
    var r = ritmo(s.ritmo);
    function set(sel, val) { var el = root.querySelector(sel); if (el) el.textContent = val; }
    set('[data-m="hr"]', fmtHR(s));
    set('[data-m="pa"]', fmtPA(s));
    set('[data-m="spo2"]', (s.pulso && s.spo2) ? s.spo2 : '--');
    set('[data-m="etco2"]', s.etco2 ? s.etco2 : '--');
    set('[data-m="fr"]', s.fr ? s.fr : '--');
    set('[data-m="temp"]', s.temp ? s.temp.toFixed(1) : '--');
    set('[data-m="shocks"]', s.choques || 0);
    set('[data-m="ritmo"]', r.nome);
    // classe de alarme por parâmetro
    flag(root, 'hr', alarmHR(s, r));
    flag(root, 'spo2', s.pulso ? (s.spo2 < 90 ? 'crit' : s.spo2 < 94 ? 'warn' : '') : 'crit');
    flag(root, 'pa', s.pulso ? (s.pas < 70 ? 'crit' : '') : 'crit');
    flag(root, 'etco2', s.etco2 && s.etco2 < 20 ? 'warn' : '');
    var badge = root.querySelector('[data-m="ritmo"]');
    if (badge) { badge.className = badge.className.replace(/\btone-\w+\b/g, '').trim() + ' tone-' + r.tom; }
  }
  function alarmHR(s, r) {
    if (r.hr === 'none' || !s.pulso && r.id !== 'aesp') return 'crit';
    if (!s.fc) return 'crit';
    if (s.fc >= 180 || s.fc <= 50) return 'crit';
    if (s.fc >= 150 || s.fc <= 60) return 'warn';
    return '';
  }
  function flag(root, key, level) {
    var el = root.querySelector('[data-vital="' + key + '"]');
    if (!el) return;
    el.classList.remove('alarm-warn', 'alarm-crit');
    if (level === 'warn') el.classList.add('alarm-warn');
    if (level === 'crit') el.classList.add('alarm-crit');
  }

  return {
    RITMOS: RITMOS, ritmo: ritmo, preset: preset,
    createEngine: createEngine, renderNumbers: renderNumbers,
    fmtHR: fmtHR, fmtPA: fmtPA
  };
})();
