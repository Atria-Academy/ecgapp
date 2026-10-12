/* ============================================================
   PALS Rhythm Quest · Plantão ao vivo (monitor como espinha)
   O caso acontece no monitor real: o paciente deteriora em tempo
   real (EtCO2/SpO2/estabilidade caindo) e a sua conduta o
   estabiliza (ritmo converte, pulso volta) ou o perde.
   Reaproveita PRQ.monitor (motor) e PRQ.CASES (conteúdo PALS).
   Sobrevivência como placar — sem moedas nem combo.
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.vivo = (function () {
  var M = function () { return PRQ.monitor; };
  var st = function () { return PRQ.state; };
  var ui = function () { return PRQ.ui; };

  var engine = null, decayTimer = null, scene = null;
  var fila = [], idx = 0, salvos = 0, tempos = [], porRitmo = {};
  var etapa = 'ritmo';   // 'ritmo' | 'conduta' | 'resolvido'

  // urgência por ritmo apresentado no monitor: estabilidade inicial, queda/s,
  // se é parada (chocável/não), e vitais de abertura.
  var URG = {
    sinusal:     { estab: 92, decay: 0,   spo2: 98, etco2: 38, fr: 26 },
    taqsinusal:  { estab: 86, decay: 0,   spo2: 96, etco2: 36, fr: 34 },
    bradicardia: { estab: 58, decay: 1.1, spo2: 82, etco2: 30, fr: 16 },
    tsv:         { estab: 62, decay: 0.9, spo2: 93, etco2: 34, fr: 40 },
    tv:          { estab: 52, decay: 1.2, spo2: 88, etco2: 30, fr: 36 },
    bavt:        { estab: 56, decay: 1.1, spo2: 88, etco2: 30, fr: 24 },
    fv:          { estab: 46, decay: 1.6, spo2: 0,  etco2: 14, fr: 0, arrest: true },
    assistolia:  { estab: 40, decay: 1.7, spo2: 0,  etco2: 8,  fr: 0, arrest: true }
  };

  function $(id) { return document.getElementById(id); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function nomeRitmo(id) {
    if (id === 'aesp') return PRQ.AESP.nome;
    var r = PRQ.RHYTHMS[id];
    return r ? r.nome : id;
  }
  function opcoesRitmo(correto, pulso) {
    var ids;
    if (correto === 'aesp') ids = ['aesp', 'sinusal', 'assistolia', 'bradicardia'];
    else {
      var conf = (PRQ.CONFUSIONS[correto] || []).slice();
      ids = [correto].concat(conf.slice(0, 3));
      if (pulso === false && ids.indexOf('aesp') < 0) ids[ids.length - 1] = 'aesp';
    }
    return shuffle(ids);
  }

  /* estado lido pelo motor do monitor a cada frame */
  function getState() { return scene; }

  /* ---------- montar cena a partir de um caso ---------- */
  function montarCena(caso) {
    var monRitmo = caso.strip.ritmo;            // o que é desenhado (AESP = sinusal organizado)
    var u = URG[monRitmo] || URG.sinusal;
    return {
      caso: caso,
      ritmo: monRitmo,
      fc: caso.fcMonitor || caso.strip.fc || 100,
      pulso: caso.pulso,
      pas: caso.pulso ? 84 : 0, pad: caso.pulso ? 52 : 0,
      spo2: u.spo2, etco2: u.etco2, fr: u.fr, temp: 37.0,
      sync: false, pacer: false, pacerFc: 80, choques: 0, energia: 20,
      seed: (caso.strip.seed || 7),
      running: true,
      // simulação
      estab: u.estab, estab0: u.estab, decay: u.decay, arrest: !!u.arrest,
      inicio: Date.now(), resolvido: false
    };
  }

  /* ---------- loop de deterioração ---------- */
  function iniciarDecay() {
    var last = Date.now();
    decayTimer = setInterval(function () {
      if (!scene || scene.resolvido) return;
      var now = Date.now(), dt = (now - last) / 1000; last = now;
      if (scene.decay > 0) {
        scene.estab = Math.max(0, scene.estab - scene.decay * dt);
        // vitais acompanham a queda (quanto pior a estabilidade, pior o número)
        var k = scene.estab / scene.estab0;
        if (scene.pulso) {
          scene.spo2 = Math.round(Math.max(60, (URG[scene.ritmo] || {}).spo2 * (0.6 + 0.4 * k)));
          scene.pas = Math.round(Math.max(40, 84 * (0.5 + 0.5 * k)));
          scene.pad = Math.round(scene.pas * 0.62);
        }
        scene.etco2 = Math.round(Math.max(6, (URG[scene.ritmo] || {}).etco2 * (0.5 + 0.5 * k)));
      }
      atualizarMonitor();
      if (scene.estab <= 0 && !scene.resolvido) resolver(false, true); // deteriorou até o fim
    }, 220);
  }
  function pararDecay() { if (decayTimer) { clearInterval(decayTimer); decayTimer = null; } }

  function atualizarMonitor() {
    M().renderNumbers(document, scene);
    var bar = $('vivo-estab-fill'), lbl = $('vivo-estab-val'), wrap = $('vivo-estab');
    if (bar) bar.style.width = scene.estab.toFixed(0) + '%';
    if (lbl) lbl.textContent = scene.estab.toFixed(0) + '%';
    if (wrap) {
      wrap.classList.toggle('crit', scene.estab < 34);
      wrap.classList.toggle('warn', scene.estab >= 34 && scene.estab < 67);
    }
    var clk = $('vivo-clock');
    if (clk && !scene.resolvido) clk.textContent = ((Date.now() - scene.inicio) / 1000).toFixed(0) + 's';
  }

  /* ============ fluxo ============ */
  function proximoCaso() {
    etapa = 'ritmo';
    if (idx >= fila.length) { finalizar(); return; }
    scene = montarCena(fila[idx]);
    renderCena();
    if (engine) engine.invalidate();
    iniciarDecay();
    perguntarRitmo();
  }

  function renderCena() {
    var c = scene.caso;
    $('view-vivo').innerHTML =
      '<div class="game-top">' +
        '<a class="game-exit" href="modos.html" aria-label="Sair">' + ui().icon('back') + '</a>' +
        '<div class="game-progress">' +
          '<span class="microlabel">plantão ao vivo · caso ' + (idx + 1) + ' de ' + fila.length + '</span>' +
          '<div class="meter"><i style="width:' + ((idx / fila.length) * 100).toFixed(0) + '%;background:var(--danger)"></i></div>' +
        '</div>' +
        '<div class="vivo-clock-box"><span class="mon-mini">tempo</span><b id="vivo-clock">0s</b></div>' +
      '</div>' +
      '<div class="vivo-vinheta"><span class="mon-mini">' + ui().esc(c.idade) + ' · caso em andamento</span>' + ui().esc(c.vinheta) + '</div>' +
      '<section class="mon-screen vivo-monitor">' +
        '<div class="vivo-estab" id="vivo-estab">' +
          '<div class="vivo-estab-head"><span class="mon-mini">estabilidade do paciente</span><b id="vivo-estab-val">' + scene.estab.toFixed(0) + '%</b></div>' +
          '<div class="vivo-estab-bar"><i id="vivo-estab-fill" style="width:' + scene.estab.toFixed(0) + '%"></i></div>' +
        '</div>' +
        '<div class="mon-body">' +
          '<div class="mon-waves">' +
            '<div class="mon-lane"><span class="mon-lane-tag t-ecg">ECG · DII</span><canvas id="vivo-ecg"></canvas></div>' +
            '<div class="mon-lane"><span class="mon-lane-tag t-pleth">Pleth · SpO₂</span><canvas id="vivo-pleth"></canvas></div>' +
            '<div class="mon-lane"><span class="mon-lane-tag t-capno">Capno · CO₂</span><canvas id="vivo-capno"></canvas></div>' +
          '</div>' +
          '<div class="mon-vitals">' +
            '<div class="mon-vital v-hr" data-vital="hr"><span class="mon-vlabel">FC<small>bpm</small></span><b data-m="hr">--</b></div>' +
            '<div class="mon-vital v-pa" data-vital="pa"><span class="mon-vlabel">PA<small>mmHg</small></span><b data-m="pa">--</b></div>' +
            '<div class="mon-vital v-spo2" data-vital="spo2"><span class="mon-vlabel">SpO₂<small>%</small></span><b data-m="spo2">--</b></div>' +
            '<div class="mon-vital v-etco2" data-vital="etco2"><span class="mon-vlabel">EtCO₂<small>mmHg</small></span><b data-m="etco2">--</b></div>' +
            '<div class="mon-vital-row">' +
              '<div class="mon-vital v-fr small" data-vital="fr"><span class="mon-vlabel">FR<small>rpm</small></span><b data-m="fr">--</b></div>' +
              '<div class="mon-vital v-temp small"><span class="mon-vlabel">Temp<small>°C</small></span><b data-m="temp">--</b></div>' +
              '<div class="mon-vital v-shocks small" style="display:none"><span class="mon-vlabel">Choques</span><b data-m="shocks">0</b></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="vivo-chip-row">' +
        '<span class="chip ' + (scene.pulso ? 'info' : 'bad') + '">' + (scene.pulso ? 'pulso presente' : 'PULSO AUSENTE') + '</span>' +
        '<span class="chip">' + ui().esc(c.perfusao) + '</span>' +
      '</div>' +
      '<p class="vivo-pergunta" id="vivo-pergunta">Qual é o ritmo?</p>' +
      '<div class="answers" id="vivo-answers"></div>';

    engine = M().createEngine({
      ecg: $('vivo-ecg'), pleth: $('vivo-pleth'), capno: $('vivo-capno'),
      getState: getState, sweepSeg: 3.6
    });
    atualizarMonitor();
  }

  function marcar(box, correctSel, chosenEl) {
    box.querySelectorAll('.answer-btn').forEach(function (b) {
      if (correctSel(b)) b.classList.add('correct');
      else if (b === chosenEl) b.classList.add('wrong');
      else b.classList.add('faded');
    });
  }

  function perguntarRitmo() {
    var c = scene.caso;
    $('vivo-pergunta').textContent = 'Qual é o ritmo?';
    var ids = opcoesRitmo(c.ritmoCorreto, c.pulso);
    var box = $('vivo-answers');
    box.innerHTML = ids.map(function (id) {
      return '<button class="answer-btn" data-id="' + id + '">' + ui().esc(nomeRitmo(id)) + '</button>';
    }).join('');
    var travado = false;
    box.querySelectorAll('.answer-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (travado) return; travado = true;
        var ok = b.dataset.id === c.ritmoCorreto;
        scene.ritmoOk = ok;
        marcar(box, function (x) { return x.dataset.id === c.ritmoCorreto; }, b);
        setTimeout(perguntarConduta, 720);
      });
    });
  }

  function perguntarConduta() {
    if (!scene || scene.resolvido) return;
    etapa = 'conduta';
    var c = scene.caso;
    $('vivo-pergunta').textContent = 'Conduta imediata (PALS)?';
    var ordem = shuffle(c.condutas.map(function (t, i) { return { t: t, i: i }; }));
    var box = $('vivo-answers');
    box.innerHTML = ordem.map(function (o) {
      return '<button class="answer-btn vivo-cond" data-i="' + o.i + '">' + ui().esc(o.t) + '</button>';
    }).join('');
    var travado = false;
    box.querySelectorAll('.answer-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (travado) return; travado = true;
        var condOk = parseInt(b.dataset.i, 10) === c.condutaCorreta;
        marcar(box, function (x) { return parseInt(x.dataset.i, 10) === c.condutaCorreta; }, b);
        setTimeout(function () { resolver(condOk, false); }, 760);
      });
    });
  }

  /* ---------- desfecho ---------- */
  function resolver(condOk, timeout) {
    if (!scene || scene.resolvido) return;
    scene.resolvido = true;
    pararDecay();
    etapa = 'resolvido';
    var c = scene.caso;
    var tempoS = (Date.now() - scene.inicio) / 1000;
    var salvou = condOk && !timeout;

    // consequência no monitor
    if (salvou) {
      scene.ritmo = 'sinusal'; scene.pulso = true;
      scene.fc = c.idade.indexOf('ano') >= 0 ? 110 : 140;
      scene.spo2 = 98; scene.etco2 = 36; scene.fr = 26;
      scene.pas = 96; scene.pad = 60; scene.estab = Math.min(100, scene.estab + 55);
    } else {
      scene.estab = Math.max(0, scene.estab - 40);
      if (scene.arrest || scene.estab <= 8) { scene.ritmo = 'assistolia'; scene.pulso = false; scene.spo2 = 0; scene.etco2 = 6; scene.fr = 0; scene.estab = 0; }
    }
    if (engine) engine.invalidate();
    atualizarMonitor();

    // placar: sobrevivência + tempo até o tratamento
    total_registrar(c.ritmoCorreto, salvou);
    tempos.push(tempoS);
    if (salvou) {
      salvos++;
      var rapido = tempoS < (scene.arrest ? 10 : 18);
      var xp = Math.round((scene.arrest ? 160 : 120) + (rapido ? 60 : 0) + Math.round(scene.estab));
      st().addXp(xp); scene._xp = xp;
    } else { scene._xp = 0; }
    st().get().rodadas = st().get().rodadas; // noop p/ manter schema
    ui().refreshPills();

    mostrarDesfecho(salvou, timeout, tempoS);
  }

  function total_registrar(ritmo, ok) {
    var pr = porRitmo[ritmo] || (porRitmo[ritmo] = { ok: 0, total: 0 });
    pr.total++; if (ok) pr.ok++;
    st().registrarTentativa({ ritmo: ritmo, resposta: ok ? 'conduta correta' : 'conduta incorreta', correta: ok, tempoMs: 0, modo: 'vivo', combo: 0 });
  }

  function mostrarDesfecho(salvou, timeout, tempoS) {
    var c = scene.caso;
    var head = salvou ? 'Paciente estabilizado' : (scene.arrest || scene.estab <= 0 ? 'Paciente perdido' : 'Piorou — reavalie');
    var sub = salvou
      ? 'Ritmo convertido, pulso e perfusão de volta.'
      : (timeout ? 'O tempo correu e a conduta não veio a tempo.' : 'A conduta escolhida não reverteu o quadro.');
    var html = '<div class="sheet-grip"></div>' +
      '<div class="verdict ' + (salvou ? 'ok' : 'bad') + '">' +
        '<div class="verdict-icon">' + ui().icon(salvou ? 'check' : 'x') + '</div>' +
        '<div><h3>' + head + '</h3><span class="microlabel">' + sub + '</span></div>' +
      '</div>' +
      '<div class="vivo-outcome-stats">' +
        '<div class="gain"><b>' + tempoS.toFixed(0) + 's</b><span>até o tratamento</span></div>' +
        '<div class="gain"><b>' + scene.estab.toFixed(0) + '%</b><span>estabilidade final</span></div>' +
        (salvou ? '<div class="gain g-xp"><b>+' + ui().fmt(scene._xp) + '</b><span>XP</span></div>' : '') +
      '</div>' +
      '<div class="compare">' +
        '<div class="' + (scene.ritmoOk ? 'right' : 'yours') + '"><span class="microlabel">ritmo</span><b>' + (scene.ritmoOk ? 'correto ✓' : 'não reconhecido') + '</b></div>' +
        '<div class="' + (salvou ? 'right' : 'yours') + '"><span class="microlabel">conduta</span><b>' + (salvou ? 'correta ✓' : 'incorreta') + '</b></div>' +
      '</div>' +
      '<div class="teachblock"><span class="microlabel txt-info">Raciocínio</span><ul>' +
        '<li>' + ui().esc(c.explicacao) + '</li>' +
        '<li><b style="color:var(--ink)">Conduta esperada:</b> ' + ui().esc(c.condutas[c.condutaCorreta]) + '</li>' +
      '</ul></div>' +
      '<button class="btn btn-primary btn-block" id="vivo-next">' + (idx + 1 >= fila.length ? 'Ver plantão' : 'Próximo paciente') + '</button>';
    abrirSheet(html);
    var bn = $('vivo-next');
    if (bn) bn.addEventListener('click', function () { fecharSheet(); idx++; setTimeout(proximoCaso, 300); });
  }

  /* ---------- resultado do plantão ---------- */
  function finalizar() {
    if (engine) { engine.stop(); engine = null; }
    pararDecay();
    var n = fila.length;
    var tMed = tempos.length ? (tempos.reduce(function (a, b) { return a + b; }, 0) / tempos.length).toFixed(0) : '0';
    var taxa = n ? Math.round((salvos / n) * 100) : 0;
    var band = taxa >= 80 ? 'ring-ok' : taxa >= 50 ? 'ring-warn' : 'ring-bad';
    st().get().rodadas++; st().save();
    st().setBestScore('vivo', salvos * 100);
    ui().refreshPills();
    var novos = st().checarBadges();

    var porR = Object.keys(porRitmo).map(function (id) {
      var pr = porRitmo[id], pct = (pr.ok / pr.total) * 100;
      return '<div class="masteryrow' + (pct < 60 ? ' weak' : '') + '"><span class="mname">' + ui().esc(nomeRitmo(id)) +
        '</span><div class="meter"><i style="width:' + pct.toFixed(0) + '%"></i></div><span class="mval">' + pr.ok + '/' + pr.total + '</span></div>';
    }).join('');

    $('view-vivo').innerHTML =
      '<div class="game-top"><a class="game-exit" href="modos.html" aria-label="Sair">' + ui().icon('back') + '</a>' +
        '<div class="game-progress"><span class="microlabel">plantão concluído</span></div></div>' +
      '<div class="result-hero">' +
        '<h2>' + (taxa >= 80 ? 'Plantão firme.' : taxa >= 50 ? 'Alguns se foram.' : 'Plantão difícil.') + '</h2>' +
        '<div class="ring-wrap ' + band + '">' + ui().ringSvg(0, 158, 11) +
          '<div class="ring-center"><b id="vivo-res">0</b><span>de ' + n + ' salvos</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="card card-tight">' +
        '<div class="bonusline"><span>Pacientes estabilizados</span><b>' + salvos + ' / ' + n + '</b></div>' +
        '<div class="bonusline"><span>Tempo médio até o tratamento</span><b>' + tMed + 's</b></div>' +
      '</div>' +
      '<div class="card card-tight mt-14"><span class="microlabel" style="display:block;margin-bottom:6px">Desfechos por ritmo</span>' + porR + '</div>' +
      (novos.length ? '<div class="card card-tight mt-14"><span class="microlabel" style="display:block;margin-bottom:8px">Emblemas desbloqueados</span><div class="chiprow">' +
        novos.map(function (b) { return '<span class="chip">' + b.emoji + ' ' + ui().esc(b.nome) + '</span>'; }).join('') + '</div></div>' : '') +
      '<div class="row mt-14" style="gap:10px">' +
        '<button class="btn btn-ghost grow" id="vivo-modos">Modos</button>' +
        '<button class="btn btn-primary grow" id="vivo-again">Novo plantão</button>' +
      '</div>';
    window.scrollTo(0, 0);
    setTimeout(function () {
      var arc = $('view-vivo').querySelector('.ringarc');
      if (arc) { var size = 158, stroke = 11, r = (size - stroke) / 2, cc = 2 * Math.PI * r; arc.style.strokeDashoffset = (cc * (1 - taxa / 100)).toFixed(1); }
      ui().countUp($('vivo-res'), salvos, 900);
    }, 120);
    $('vivo-again').addEventListener('click', iniciar);
    $('vivo-modos').addEventListener('click', function () { if (PRQ.nav) PRQ.nav('modos.html'); else location.href = 'modos.html'; });
  }

  /* ---------- sheet ---------- */
  function abrirSheet(html) { var sh = $('sheet'), bd = $('sheet-backdrop'); if (!sh || !bd) return; sh.innerHTML = html; bd.classList.add('open'); sh.classList.add('open'); sh.scrollTop = 0; }
  function fecharSheet() { var sh = $('sheet'), bd = $('sheet-backdrop'); if (bd) bd.classList.remove('open'); if (sh) sh.classList.remove('open'); }

  function teardown() { pararDecay(); if (engine) { engine.stop(); engine = null; } fecharSheet(); }

  function iniciar() {
    fila = shuffle(PRQ.CASES).slice(0, Math.min(5, PRQ.CASES.length));
    idx = 0; salvos = 0; tempos = []; porRitmo = {};
    st().tocarStreak(); ui().refreshPills();
    proximoCaso();
  }

  function init() {
    var S = st().get();
    // nível mínimo leve (Plantão PALS costuma destravar cedo); segue se ok
    iniciar();
  }

  return { init: init, teardown: teardown, iniciar: iniciar };
})();
