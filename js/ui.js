/* ============================================================
   PALS Rhythm Quest · UI compartilhada
   Topbar, navegação, ícones, toasts, partículas, onboarding.
   ============================================================ */
window.PRQ = window.PRQ || {};

/* ---------- service worker (só quando hospedado; nunca em file://) ---------- */
(function registrarSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  // no build de arquivo único não há sw.js separado: registro é ignorado se 404
  if (document.querySelector('#spa-root')) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline/indisponível: segue sem cache */ });
  });
})();

PRQ.ui = (function () {

  /* ---------- ícones SVG ---------- */
  const ICONS = {
    pulse: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.5-6 4 12 2.5-6h7"/></svg>',
    home: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.2 12 4l8 7.2"/><path d="M6 10v9h4.4v-5h3.2v5H18v-9"/></svg>',
    play: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.8v14.4l12-7.2z"/></svg>',
    trophy: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a1 1 0 0 0-1 1c0 2.2 1.6 3.6 3.5 3.9M17 6h2.5a1 1 0 0 1 1 1c0 2.2-1.6 3.6-3.5 3.9"/><path d="M12 14v3.4M8.5 20h7M10 17.4h4"/></svg>',
    book: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/><path d="M9 7.5h7"/></svg>',
    user: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.6"/><path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2"/></svg>',
    bolt: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5z"/></svg>',
    stetho: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v5.5a4.5 4.5 0 0 0 9 0V3"/><path d="M9.5 13v3.2a5 5 0 0 0 10 0v-2"/><circle cx="19.5" cy="11.5" r="2.2"/></svg>',
    target: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    coin: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></svg>',
    flame: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s1 2.4 1 4.2c2.2 1 4.5 3.3 4.5 6.8a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.3-5.4C9.9 7.5 12 5.4 12 3z"/><path d="M12 13.6c-1.2 1-1.8 1.9-1.8 3a1.8 1.8 0 0 0 3.6 0c0-1.1-.6-2-1.8-3z"/></svg>',
    check: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    x: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    lock: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="10.5" width="13" height="9" rx="2.2"/><path d="M8.5 10.5v-3a3.5 3.5 0 0 1 7 0v3"/></svg>',
    medal: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14.5" r="5.2"/><path d="m8.7 10.4-3-6h4.2L12 8.6l2.1-4.2h4.2l-3 6"/></svg>'
  };

  function icon(name) { return ICONS[name] || ICONS.pulse; }

  /* ---------- escape ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(n) {
    n = Math.round(n);
    return n.toLocaleString('pt-BR');
  }

  /* ---------- casca compartilhada ---------- */
  const NAV = [
    { href: 'index.html', label: 'Início', ic: 'home' },
    { href: 'modos.html', label: 'Jogar', ic: 'play' },
    { href: 'ranking.html', label: 'Ranking', ic: 'trophy' },
    { href: 'biblioteca.html', label: 'Ritmos', ic: 'book' },
    { href: 'dashboard.html', label: 'Perfil', ic: 'user' }
  ];

  function pageName() {
    if (PRQ.route && PRQ.route.page) return PRQ.route.page; // modo arquivo único
    const p = location.pathname.split('/').pop() || 'index.html';
    return p === '' ? 'index.html' : p;
  }

  function renderShell() {
    // idempotente: remove casca anterior (navegação em arquivo único)
    document.querySelectorAll('.topbar, .bottomnav, #toastwrap, #burstlayer').forEach(function (el) { el.remove(); });
    const cur = pageName();
    const S = PRQ.state.get();
    const top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML =
      '<div class="topbar-inner">' +
        '<a class="brand" href="index.html" aria-label="PALS Rhythm Quest, uma experiência educacional da STOP">' +
          '<span class="brand-pulse">' + icon('pulse') + '</span>' +
          '<span class="brand-lock">' +
            '<span class="brand-name">Rhythm<small>Quest</small></span>' +
            '<span class="brand-by">por STOP</span>' +
          '</span>' +
          (PRQ.STOP ? '<img class="brand-desktop-logo" src="' + PRQ.STOP.logo + '" width="' + PRQ.STOP.logoW + '" height="' + PRQ.STOP.logoH + '" alt="Logo da Sociedade Tocantinense de Pediatria" loading="lazy">' : '') +
        '</a>' +
        '<nav class="topnav-links">' +
          NAV.map(function (n) {
            return '<a href="' + n.href + '"' + (cur === n.href ? ' class="active"' : '') + '>' + n.label + '</a>';
          }).join('') +
        '</nav>' +
        '<div class="topbar-stats">' +
          '<span class="stat-pill streak" title="Sequência de dias">' + icon('flame') + '<span id="pill-streak">' + S.streak.dias + '</span></span>' +
          '<span class="stat-pill coins" title="Moedas">' + icon('coin') + '<span id="pill-coins">' + fmt(S.moedas) + '</span></span>' +
        '</div>' +
      '</div>';
    document.body.prepend(top);

    const nav = document.createElement('nav');
    nav.className = 'bottomnav';
    nav.innerHTML =
      '<div class="bottomnav-inner">' +
        NAV.map(function (n) {
          const act = cur === n.href;
          return '<a class="navitem' + (act ? ' active' : '') + '" href="' + n.href + '">' +
            icon(n.ic) + '<span>' + n.label + '</span><span class="navdot"></span></a>';
        }).join('') +
      '</div>';
    document.body.appendChild(nav);

    let toastwrap = document.createElement('div');
    toastwrap.className = 'toastwrap';
    toastwrap.id = 'toastwrap';
    document.body.appendChild(toastwrap);

    let burst = document.createElement('div');
    burst.className = 'burst-layer';
    burst.id = 'burstlayer';
    document.body.appendChild(burst);
  }

  function refreshPills() {
    const S = PRQ.state.get();
    const c = document.getElementById('pill-coins');
    const st = document.getElementById('pill-streak');
    if (c) c.textContent = fmt(S.moedas);
    if (st) st.textContent = S.streak.dias;
  }

  /* ---------- toast ---------- */
  function toast(msg, tipo, dur) {
    const wrap = document.getElementById('toastwrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (tipo ? ' ' + tipo : '');
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 320);
    }, dur || 2600);
  }

  /* ---------- partículas de moeda/XP ---------- */
  function burst(x, y, itens) {
    const layer = document.getElementById('burstlayer');
    if (!layer) return;
    itens.forEach(function (it, i) {
      const p = document.createElement('span');
      p.className = 'coin-p' + (it.tipo === 'xp' ? ' xp' : '');
      p.textContent = it.txt;
      const dx = (Math.random() - 0.5) * 120;
      p.style.setProperty('--dx0', (dx * 0.3) + 'px');
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', (-(70 + Math.random() * 70)) + 'px');
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.animationDelay = (i * 55) + 'ms';
      layer.appendChild(p);
      setTimeout(function () { p.remove(); }, 1400 + i * 55);
    });
  }

  /* ---------- modal genérico ---------- */
  function modal(html, opts) {
    opts = opts || {};
    const bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML = '<div class="modal">' + html + '</div>';
    document.body.appendChild(bd);
    requestAnimationFrame(function () { bd.classList.add('open'); });
    function close() {
      bd.classList.remove('open');
      setTimeout(function () { bd.remove(); }, 240);
    }
    if (!opts.bloqueante) {
      bd.addEventListener('click', function (e) { if (e.target === bd) close(); });
    }
    bd.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    return { el: bd, close: close };
  }

  /* ---------- anel de acurácia (SVG) ---------- */
  function ringSvg(pct, size, stroke, cls) {
    size = size || 158; stroke = stroke || 11;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle class="ringtrack" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="ringarc ' + (cls || '') + '" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"' +
      ' stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>';
  }

  /* ---------- barra de XP ---------- */
  function xpbarHtml() {
    const S = PRQ.state.get();
    const p = PRQ.state.progressoNivel();
    return '<div class="xpbar">' +
      '<div class="xpbar-track"><div class="xpbar-fill" style="width:' + p.pct.toFixed(1) + '%"></div></div>' +
      '<div class="xpbar-meta"><span>NV ' + S.nivel + ' · ' + esc(PRQ.titleFor(S.nivel)) + '</span>' +
      '<span>' + fmt(p.atual) + ' / ' + fmt(p.necessario) + ' XP</span></div>' +
    '</div>';
  }

  /* ---------- dificuldade (pontinhos) ---------- */
  function diffDots(n) {
    let h = '<span class="diff">';
    for (let i = 1; i <= 3; i++) h += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return h + '</span>';
  }

  /* ---------- contagem animada ---------- */
  function countUp(el, alvo, dur, sufixo) {
    const t0 = performance.now();
    dur = dur || 900;
    function tick(ts) {
      const k = Math.min(1, (ts - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(alvo * eased) + (sufixo || '');
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- onboarding ---------- */
  function garantirPerfil(cb) {
    const S = PRQ.state.get();
    if (S.nome) { cb && cb(); return; }
    const avs = PRQ.AVATARS;
    const m = modal(
      '<div class="center" style="margin-bottom:14px">' +
        '<span class="microlabel" style="color:var(--ok)">Monitor conectado · sinal estável</span>' +
        '<h3 class="display" style="font-size:22px;margin-top:6px">Bem-vindo ao plantão</h3>' +
        '<p class="muted small" style="margin-top:6px">Escolha seu avatar e como quer aparecer no ranking da turma.</p>' +
      '</div>' +
      '<div class="chiprow" id="ob-avs" style="justify-content:center;gap:8px;margin-bottom:16px">' +
        avs.map(function (a, i) {
          return '<button class="avatar" data-av="' + a + '" style="' + (i === 0 ? 'outline:2px solid var(--ok);' : '') + 'width:46px;height:46px;font-size:23px;border-radius:14px">' + a + '</button>';
        }).join('') +
      '</div>' +
      '<label class="microlabel" style="display:block;margin-bottom:6px">Seu nome ou apelido</label>' +
      '<input id="ob-nome" maxlength="22" placeholder="ex.: Dra. Ana" autocomplete="off">' +
      '<button class="btn btn-primary btn-block mt-14" id="ob-go">Entrar no plantão</button>',
      { bloqueante: true }
    );
    let av = avs[0];
    m.el.querySelectorAll('[data-av]').forEach(function (b) {
      b.addEventListener('click', function () {
        m.el.querySelectorAll('[data-av]').forEach(function (o) { o.style.outline = 'none'; });
        b.style.outline = '2px solid var(--ok)';
        av = b.dataset.av;
      });
    });
    m.el.querySelector('#ob-go').addEventListener('click', function () {
      const nome = m.el.querySelector('#ob-nome').value.trim() || 'Plantonista';
      PRQ.state.setPerfil(nome, av);
      m.close();
      refreshPills();
      cb && cb();
    });
  }

  /* ---------- celebração de emblema ---------- */
  function celebrarBadges(novos) {
    if (!novos || !novos.length) return;
    novos.forEach(function (b, i) {
      setTimeout(function () {
        toast('<span style="font-size:17px">' + b.emoji + '</span> Emblema desbloqueado: <b>' + esc(b.nome) + '</b>', b.special ? 'institutional' : 'reward', 3400);
      }, i * 900);
    });
  }

  /* ---------- rodapé institucional (logo + STOP + aviso) ---------- */
  function instFooterHtml(disclaimerHtml) {
    if (!PRQ.STOP) return '';
    return '<footer class="instfooter">' +
      '<div class="instfooter-brand">' +
        '<img class="instfooter-logo" src="' + PRQ.STOP.logo + '" width="' + PRQ.STOP.logoW + '" height="' + PRQ.STOP.logoH + '" alt="Logo STOP, Sociedade Tocantinense de Pediatria" loading="lazy">' +
        '<div class="instfooter-org">' +
          '<span class="microlabel">Realização</span>' +
          '<b>' + esc(PRQ.STOP.org) + '</b>' +
          '<span>' + esc(PRQ.STOP.assinatura) + '</span>' +
        '</div>' +
      '</div>' +
      (disclaimerHtml || '') +
    '</footer>';
  }

  /* ---------- splash institucional (só no primeiro acesso) ---------- */
  const SPLASH_KEY = 'prq_splash_v1';
  function splash(cb) {
    let visto = false;
    try { visto = localStorage.getItem(SPLASH_KEY) === '1'; } catch (e) {}
    if (visto || !PRQ.STOP) { cb && cb(); return; }
    try { localStorage.setItem(SPLASH_KEY, '1'); } catch (e) {}

    const reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.createElement('div');
    el.className = 'splash';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Abertura: ' + PRQ.STOP.org + ' apresenta PALS Rhythm Quest');
    el.innerHTML =
      '<button class="splash-skip" type="button" aria-label="Pular abertura">pular</button>' +
      '<span class="splash-apresenta">' + esc(PRQ.STOP.org) + ' apresenta</span>' +
      '<img class="splash-logo" src="' + PRQ.STOP.logo + '" width="' + PRQ.STOP.logoW + '" height="' + PRQ.STOP.logoH + '" alt="Logo STOP, Sociedade Tocantinense de Pediatria">' +
      '<div class="splash-game">' +
        '<h1 class="display">PALS Rhythm Quest</h1>' +
        '<span class="brand-by">uma experiência educacional da STOP</span>' +
      '</div>' +
      '<p class="splash-line">Reconhecimento rápido de arritmias pediátricas em tira de ECG.</p>';
    document.body.appendChild(el);

    let fechado = false;
    function fechar() {
      if (fechado) return;
      fechado = true;
      el.classList.add('out');
      setTimeout(function () { el.remove(); cb && cb(); }, reduz ? 0 : 500);
    }
    el.querySelector('.splash-skip').addEventListener('click', fechar);
    // duração máxima de 2 segundos; sem flashes
    setTimeout(fechar, reduz ? 700 : 2000);
  }

  return {
    icon: icon,
    esc: esc,
    fmt: fmt,
    renderShell: renderShell,
    refreshPills: refreshPills,
    toast: toast,
    burst: burst,
    modal: modal,
    ringSvg: ringSvg,
    xpbarHtml: xpbarHtml,
    diffDots: diffDots,
    countUp: countUp,
    garantirPerfil: garantirPerfil,
    celebrarBadges: celebrarBadges,
    instFooterHtml: instFooterHtml,
    splash: splash
  };
})();
