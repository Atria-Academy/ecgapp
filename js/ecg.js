/* ============================================================
   PALS Rhythm Quest · gerador procedural de ECG
   Traçados sintéticos por ritmo, renderizados em canvas com
   grade de monitor e varredura animada. Placeholders: em
   produção, substituídos por tiras validadas.
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.ecg = (function () {

  /* rng determinístico (mulberry32) para variações reproduzíveis */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const gauss = (t, mu, sig, amp) =>
    amp * Math.exp(-((t - mu) * (t - mu)) / (2 * sig * sig));

  /* complexo estreito P-QRS-T; t relativo ao início do batimento (s) */
  function narrowBeat(t, o) {
    o = o || {};
    let v = 0;
    if (o.p !== false) v += gauss(t, 0.06, 0.018, o.pAmp || 0.14);
    v += gauss(t, 0.185, 0.011, -0.09);           // Q
    v += gauss(t, 0.205, 0.010, o.rAmp || 1.05);  // R
    v += gauss(t, 0.228, 0.012, -0.22);           // S
    v += gauss(t, 0.40, 0.045, o.tAmp || 0.26);   // T
    return v;
  }

  /* complexo largo e bizarro (TV / escape ventricular) */
  function wideBeat(t, o) {
    o = o || {};
    let v = 0;
    v += gauss(t, 0.10, 0.05, o.rAmp || 1.0);
    v += gauss(t, 0.20, 0.055, -(o.rAmp || 1.0) * 0.62); // S profundo arrastado
    v += gauss(t, 0.34, 0.06, -(o.tAmp || 0.30));        // T discordante
    return v;
  }

  /* onda P isolada (trem atrial do BAVT) */
  const pWave = (t, mu) => gauss(t, mu, 0.02, 0.16);

  /* ---------- geradores por ritmo ----------
     Retornam Float32Array de amostras (mV), fs Hz, dur s. */
  const GEN = {

    sinusal(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const rr = 60 / fc;
      const rAmp = 0.95 + r() * 0.25, pAmp = 0.12 + r() * 0.05;
      let beats = [], t = -rr * r();
      while (t < dur + 1) { beats.push(t); t += rr * (0.985 + r() * 0.03); }
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        let v = 0;
        for (const b of beats) {
          const dt = ti - b;
          if (dt >= -0.05 && dt < 0.62) v += narrowBeat(dt, { rAmp, pAmp });
        }
        out[i] = v + (r() - 0.5) * 0.02;
      }
      return out;
    },

    bradicardia(fc, seed, dur, fs) { return GEN.sinusal(fc, seed, dur, fs); },

    taqsinusal(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const rAmp = 0.9 + r() * 0.2;
      let beats = [], t = -0.2 * r();
      while (t < dur + 1) {
        beats.push(t);
        t += (60 / fc) * (0.94 + r() * 0.12); // variabilidade R-R marcada
      }
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        let v = 0;
        for (const b of beats) {
          const dt = ti - b;
          if (dt >= -0.05 && dt < 0.55) v += narrowBeat(dt, { rAmp, pAmp: 0.10, tAmp: 0.20 });
        }
        out[i] = v + (r() - 0.5) * 0.025;
      }
      return out;
    },

    tsv(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const rr = 60 / fc, rAmp = 0.85 + r() * 0.2;
      let beats = [], t = -rr * r();
      while (t < dur + 1) { beats.push(t); t += rr; } // metronômico: RR fixo
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        let v = 0;
        for (const b of beats) {
          const dt = ti - b;
          if (dt >= -0.02 && dt < 0.42) v += narrowBeat(dt, { p: false, rAmp, tAmp: 0.14 });
        }
        out[i] = v + (r() - 0.5) * 0.02;
      }
      return out;
    },

    tv(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const rr = 60 / fc, rAmp = 1.05 + r() * 0.3;
      let beats = [], t = -rr * r();
      while (t < dur + 1) { beats.push(t); t += rr * (0.99 + r() * 0.02); }
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        let v = 0;
        for (const b of beats) {
          const dt = ti - b;
          if (dt >= -0.02 && dt < 0.5) v += wideBeat(dt, { rAmp, tAmp: 0.32 });
        }
        out[i] = v + (r() - 0.5) * 0.03;
      }
      return out;
    },

    fv(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const f1 = 3.6 + r() * 1.6, f2 = 5.2 + r() * 2.2, f3 = 7.5 + r() * 2.5;
      const p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
      const coarse = 0.35 + r() * 0.4; // FV grossa ou fina
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        const envelope = 0.55 + 0.45 * Math.sin(ti * (0.7 + r() * 0.02) + p1 * 2);
        let v =
          Math.sin(ti * f1 * 6.28 + p1 + Math.sin(ti * 0.9) * 2.2) * 0.5 +
          Math.sin(ti * f2 * 6.28 + p2 + Math.sin(ti * 1.3) * 1.8) * 0.32 +
          Math.sin(ti * f3 * 6.28 + p3) * 0.18;
        out[i] = v * envelope * coarse + (r() - 0.5) * 0.05;
      }
      return out;
    },

    assistolia(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const ph = r() * 6.28;
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        out[i] = Math.sin(ti * 0.5 + ph) * 0.035 + (r() - 0.5) * 0.03;
      }
      return out;
    },

    bavt(fc, seed, dur, fs) {
      const r = rng(seed), n = Math.floor(dur * fs), out = new Float32Array(n);
      const rrV = 60 / fc;            // ventricular lento
      const rrA = 60 / (105 + r() * 30); // atrial independente
      let vBeats = [], t = -rrV * r();
      while (t < dur + 1.5) { vBeats.push(t); t += rrV * (0.99 + r() * 0.02); }
      let aBeats = []; t = -rrA * r();
      while (t < dur + 1) { aBeats.push(t); t += rrA * (0.985 + r() * 0.03); }
      const wide = r() > 0.35;
      for (let i = 0; i < n; i++) {
        const ti = i / fs;
        let v = 0;
        for (const b of vBeats) {
          const dt = ti - b;
          if (dt >= -0.02 && dt < 0.55) {
            v += wide ? wideBeat(dt, { rAmp: 0.9, tAmp: 0.25 })
                      : narrowBeat(dt, { p: false, rAmp: 0.85 });
          }
        }
        for (const b of aBeats) {
          const dt = ti - b;
          if (dt >= -0.08 && dt < 0.12) v += pWave(dt, 0.02);
        }
        out[i] = v + (r() - 0.5) * 0.02;
      }
      return out;
    }
  };

  function trace(ritmo, fc, seed, dur, fs) {
    dur = dur || 6; fs = fs || 240;
    const gen = GEN[ritmo] || GEN.sinusal;
    return { data: gen(fc || 100, seed || 1, dur, fs), fs, dur };
  }

  /* ---------- renderização ---------- */

  function sizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(10, rect.width), h = Math.max(10, rect.height);
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { w: canvas.width, h: canvas.height, dpr };
  }

  function drawGrid(ctx, w, h) {
    ctx.fillStyle = '#050a0e';
    ctx.fillRect(0, 0, w, h);
    const minor = Math.max(7, Math.round(w / 64));
    ctx.strokeStyle = 'rgba(58, 240, 172, 0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += minor) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y <= h; y += minor) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(58, 240, 172, 0.09)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += minor * 5) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y <= h; y += minor * 5) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
  }

  function drawTrace(ctx, tr, w, h, upTo) {
    const { data } = tr;
    const n = data.length;
    const baseline = h * 0.58;
    const scale = h * 0.30;
    const end = upTo == null ? n : Math.min(n, Math.floor(upTo * n));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(58, 240, 172, 0.55)';
    ctx.shadowBlur = Math.max(4, h * 0.045);
    ctx.strokeStyle = '#3af0ac';
    ctx.lineWidth = Math.max(1.5, h * 0.014);
    ctx.beginPath();
    for (let i = 0; i < end; i++) {
      const x = (i / (n - 1)) * w;
      const y = baseline - data[i] * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /* render estático (miniaturas da biblioteca, comparações) */
  function renderStatic(canvas, ritmo, fc, seed) {
    const { w, h } = sizeCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const tr = trace(ritmo, fc, seed, 5, 200);
    drawGrid(ctx, w, h);
    drawTrace(ctx, tr, w, h);
  }

  /* render animado com varredura de monitor; retorna handle.stop() */
  function renderLive(canvas, ritmo, fc, seed, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const tr = trace(ritmo, fc, seed, opts.dur || 6, 240);
    const speed = opts.sweepSeg || 3.2; // segundos por varredura completa
    let raf = null, t0 = null, stopped = false;

    function frame(ts) {
      if (stopped) return;
      if (t0 === null) t0 = ts;
      const { w, h } = sizeCanvas(canvas);
      const phase = ((ts - t0) / 1000 / speed) % 1;
      drawGrid(ctx, w, h);
      drawTrace(ctx, tr, w, h);
      // lacuna escura à frente do cursor + linha de varredura
      const x = phase * w;
      const gap = Math.max(26, w * 0.09);
      ctx.fillStyle = 'rgba(5, 10, 14, 0.88)';
      if (x + gap <= w) {
        ctx.fillRect(x, 0, gap, h);
      } else {
        ctx.fillRect(x, 0, w - x, h);
        ctx.fillRect(0, 0, gap - (w - x), h);
      }
      const grad = ctx.createLinearGradient(x - 3, 0, x, 0);
      grad.addColorStop(0, 'rgba(58, 240, 172, 0)');
      grad.addColorStop(1, 'rgba(58, 240, 172, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 3, 0, 3, h);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return {
      stop() { stopped = true; if (raf) cancelAnimationFrame(raf); }
    };
  }

  return { trace, renderStatic, renderLive };
})();
