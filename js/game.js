/* ============================================================
   PALS Rhythm Quest · motor de partida
   Usado por partida.html. Controla setup, rodada, pontuação,
   feedback educacional, casos do Plantão e bots da Arena.
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.game = (function () {
  const ui = () => PRQ.ui;
  const st = () => PRQ.state;

  let modo = null;          // objeto de PRQ.MODES
  let fila = [];            // tiras ou casos da rodada
  let idx = 0;
  let liveHandle = null;
  let timerRaf = null;
  let tInicioTira = 0;
  let travado = false;

  const R = {               // resultado acumulado da rodada
    acertos: 0, total: 0, xp: 0, moedas: 0,
    combo: 0, melhorCombo: 0, tempos: [],
    porRitmo: {}, bonusFinal: 0, condutasOk: 0, arenaPts: 0
  };

  let bots = [];            // arena
  let ritmoFoco = null;

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function multCombo(c) {
    if (c >= 25) return 2.0;
    if (c >= 20) return 1.8;
    if (c >= 15) return 1.6;
    if (c >= 10) return 1.4;
    if (c >= 5) return 1.2;
    return 1.0;
  }

  /* ---------- montagem da fila ---------- */
  function montarFila(n, dif) {
    if (modo.id === 'plantao') {
      return shuffle(PRQ.CASES).slice(0, n);
    }
    let pool = PRQ.STRIPS.slice();
    if (ritmoFoco) pool = pool.filter(s => s.ritmo === ritmoFoco);
    else if (dif) pool = pool.filter(s => s.dificuldade === dif);
    if (!pool.length) pool = PRQ.STRIPS.slice();

    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 600) {
      let cand;
      if (modo.id === 'adaptativo' && !ritmoFoco) {
        // sorteia ritmo por peso (fraqueza + revisão), depois uma tira dele
        const ids = Object.keys(PRQ.RHYTHMS);
        const pesos = ids.map(id => st().pesoRitmo(id));
        let soma = pesos.reduce((a, b) => a + b, 0), r = Math.random() * soma;
        let rid = ids[0];
        for (let i = 0; i < ids.length; i++) { r -= pesos[i]; if (r <= 0) { rid = ids[i]; break; } }
        const doRitmo = PRQ.STRIPS.filter(s => s.ritmo === rid);
        cand = pick(doRitmo.length ? doRitmo : pool);
      } else {
        cand = pick(pool);
      }
      // trava anti-fadiga: nunca a mesma tira, máx. 2 do mesmo ritmo seguidas
      const prev1 = out[out.length - 1], prev2 = out[out.length - 2];
      if (prev1 && prev1.base.id === cand.id) continue;
      if (prev1 && prev2 && prev1.base.ritmo === cand.ritmo && prev2.base.ritmo === cand.ritmo) continue;
      out.push({ base: cand, seed: cand.seed + out.length * 997 });
    }
    return out;
  }

  function opcoesResposta(correto, pulso) {
    // 4 alternativas: correta + distratores por confusão clássica
    let ids;
    if (correto === 'aesp') {
      ids = ['aesp', 'sinusal', 'assistolia', 'bradicardia'];
    } else {
      const conf = (PRQ.CONFUSIONS[correto] || []).slice();
      ids = [correto].concat(conf.slice(0, 3));
      if (pulso === false && ids.indexOf('aesp') < 0) {
        ids[ids.length - 1] = 'aesp'; // caso sem pulso sempre oferece AESP
      }
    }
    return shuffle(ids);
  }

  function nomeRitmo(id) {
    if (id === 'aesp') return PRQ.AESP.nome;
    const r = PRQ.RHYTHMS[id];
    return r ? r.nome : id;
  }

  /* ---------- views ---------- */
  function mostrarView(qual) {
    ['view-setup', 'view-play', 'view-result'].forEach(function (v) {
      $(v).classList.toggle('hidden', v !== qual);
    });
  }

  /* ============ SETUP ============ */
  function renderSetup() {
    const m = modo;
    const S = st().get();
    const foco = ritmoFoco ? PRQ.RHYTHMS[ritmoFoco] : null;
    const opcoesTiras = m.id === 'plantao' ? [3, 5, 8] : [6, m.tiras, 20];

    $('view-setup').innerHTML =
      '<div class="game-top">' +
        '<a class="game-exit" href="modos.html" aria-label="Voltar">' + ui().icon('back') + '</a>' +
        '<div class="game-progress"><span class="microlabel">preparar partida</span></div>' +
      '</div>' +
      '<div class="card" style="--mode-color:' + m.cor + '">' +
        '<div class="modecard-head">' +
          '<div class="modecard-icon" style="background:color-mix(in srgb, ' + m.cor + ' 13%, transparent);color:' + m.cor + '">' + ui().icon(m.icone) + '</div>' +
          '<div class="modecard-title">' +
            '<span class="microlabel" style="color:' + m.cor + '">Modo ' + m.num + ' · ' + ui().esc(m.tag) + '</span>' +
            '<h3>' + ui().esc(m.nome) + '</h3>' +
          '</div>' +
        '</div>' +
        '<p class="desc" style="color:var(--ink-2);font-size:14px;margin-top:10px">' + ui().esc(m.desc) + '</p>' +
        '<div class="chiprow mt-14">' + m.chips.map(c => '<span class="chip">' + ui().esc(c) + '</span>').join('') + '</div>' +
        (foco
          ? '<div class="tipbox mt-14"><b>Sessão focada:</b> só tiras de ' + ui().esc(foco.nome) + '. Bom para consertar um ponto fraco.</div>'
          : '') +
        (m.id !== 'plantao' && !foco
          ? '<div class="setup-row"><span class="microlabel">Dificuldade</span>' +
            '<div class="seg" id="seg-dif">' +
              '<button data-v="0" class="active">Mista</button>' +
              '<button data-v="1">Básico</button>' +
              '<button data-v="2">Interm.</button>' +
              '<button data-v="3">Avançado</button>' +
            '</div></div>'
          : '') +
        '<div class="setup-row"><span class="microlabel">' + (m.id === 'plantao' ? 'Casos clínicos' : 'Tiras na rodada') + '</span>' +
          '<div class="seg" id="seg-n">' +
            opcoesTiras.map(function (n, i) {
              return '<button data-v="' + n + '"' + (i === 1 ? ' class="active"' : '') + '>' + n + '</button>';
            }).join('') +
          '</div></div>' +
        '<button class="btn btn-primary btn-block mt-20" id="btn-start">' +
          (S.bestScores[m.id] ? 'Jogar de novo' : 'Começar') + '</button>' +
        (S.bestScores[m.id]
          ? '<p class="center small muted mt-8 mono">melhor pontuação: ' + ui().fmt(S.bestScores[m.id]) + ' XP</p>'
          : '') +
      '</div>';

    ['seg-dif', 'seg-n'].forEach(function (sid) {
      const seg = $(sid);
      if (!seg) return;
      seg.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          seg.querySelectorAll('button').forEach(o => o.classList.remove('active'));
          b.classList.add('active');
        });
      });
    });

    $('btn-start').addEventListener('click', function () {
      const dif = $('seg-dif') ? parseInt($('seg-dif').querySelector('.active').dataset.v, 10) : 0;
      const n = parseInt($('seg-n').querySelector('.active').dataset.v, 10);
      iniciarRodada(n, dif || null);
    });
  }

  /* ============ RODADA ============ */
  function iniciarRodada(n, dif) {
    Object.assign(R, {
      acertos: 0, total: 0, xp: 0, moedas: 0, combo: 0,
      melhorCombo: 0, tempos: [], porRitmo: {}, bonusFinal: 0, condutasOk: 0, arenaPts: 0
    });
    idx = 0;
    fila = montarFila(n, dif);
    if (modo.id === 'arena') {
      bots = PRQ.ARENA_BOTS.map(function (b) {
        return Object.assign({ pts: 0 }, b);
      });
    }
    st().tocarStreak();
    ui().refreshPills();
    mostrarView('view-play');
    proximaTira();
  }

  function renderPlayShell(item) {
    const m = modo;
    const timed = m.timerSeg > 0;
    const isCase = modo.id === 'plantao';
    const caso = isCase ? item : null;
    const strip = isCase ? item.strip : item.base;
    const seed = isCase ? item.strip.seed : item.seed;

    let html =
      '<div class="game-top">' +
        '<a class="game-exit" href="modos.html" aria-label="Sair">' + ui().icon('back') + '</a>' +
        '<div class="game-progress">' +
          '<span class="microlabel">' + (isCase ? 'caso' : 'tira') + ' ' + (idx + 1) + ' de ' + fila.length + ' · ' + ui().esc(m.nome) + '</span>' +
          '<div class="meter"><i style="width:' + ((idx / fila.length) * 100).toFixed(1) + '%;background:' + m.cor + '"></i></div>' +
        '</div>' +
        (timed
          ? '<div class="timer-ring" id="timer"><svg viewBox="0 0 54 54">' +
              '<circle class="track" cx="27" cy="27" r="23" fill="none" stroke-width="5"/>' +
              '<circle class="arc" id="timer-arc" cx="27" cy="27" r="23" fill="none" stroke-width="5" stroke-linecap="round"/>' +
            '</svg><b id="timer-num">' + m.timerSeg + '</b></div>'
          : '') +
      '</div>' +
      '<div class="hud">' +
        '<div class="hud-box h-xp"><span class="microlabel">XP rodada</span><b id="hud-xp">' + ui().fmt(R.xp) + '</b></div>' +
        '<div class="hud-box h-combo" id="hud-combo-box"><span class="microlabel">combo</span><b id="hud-combo">×' + R.combo + '</b></div>' +
        '<div class="hud-box h-coin"><span class="microlabel">moedas</span><b id="hud-coin">' + ui().fmt(R.moedas) + '</b></div>' +
      '</div>';

    if (isCase) {
      html +=
        '<div class="casecard">' +
          '<span class="microlabel">Caso clínico · Plantão PALS</span>' +
          '<p>' + ui().esc(caso.vinheta) + '</p>' +
          '<div class="case-vitals">' +
            '<span class="chip info">' + ui().esc(caso.idade) + '</span>' +
            '<span class="chip info">monitor: ' + (caso.fcMonitor ? caso.fcMonitor + ' bpm' : 'ver tira') + '</span>' +
            '<span class="chip ' + (caso.pulso ? 'info' : 'bad') + '">' + (caso.pulso ? 'pulso presente' : 'PULSO AUSENTE') + '</span>' +
          '</div>' +
          '<p class="small" style="margin-top:8px;color:var(--ink-3)">' + ui().esc(caso.perfusao) + '</p>' +
        '</div>';
    }

    html +=
      '<div class="scope game-strip">' +
        '<span class="scope-label">DII · 25 mm/s</span>' +
        (strip.fc ? '<span class="scope-hr"><span class="beat-heart">♥</span>' + strip.fc + '</span>' : '') +
        '<canvas id="strip-canvas"></canvas>' +
      '</div>' +
      '<div class="strip-meta">' +
        '<span>' + (isCase ? 'avalie ritmo + conduta' : 'paciente: ' + ui().esc(item.base.idade)) + '</span>' +
        '<span>' + (isCase ? '' : 'dificuldade ' + '·'.repeat(item.base.dificuldade)) + '</span>' +
      '</div>' +
      '<p class="microlabel center mb-8" id="pergunta">Qual é o ritmo?</p>' +
      '<div class="answers" id="answers"></div>';

    if (modo.id === 'arena') {
      html += '<div class="card card-tight mt-14" id="arena-board"></div>';
    }

    $('view-play').innerHTML = html;
    if (liveHandle) liveHandle.stop();
    liveHandle = PRQ.ecg.renderLive($('strip-canvas'), strip.ritmo, strip.fc || 100, seed);
  }

  function renderRespostas(ids, onPick) {
    const box = $('answers');
    box.innerHTML = ids.map(function (id, i) {
      return '<button class="answer-btn" data-id="' + id + '">' + ui().esc(nomeRitmo(id)) + '</button>';
    }).join('');
    box.querySelectorAll('.answer-btn').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        if (travado) return;
        travado = true;
        onPick(b.dataset.id, b, ev);
      });
    });
  }

  function renderArenaBoard() {
    const board = $('arena-board');
    if (!board) return;
    const meu = { nome: st().get().nome || 'Você', avatar: st().get().avatar, pts: R.arenaPts, eu: true };
    const todos = [meu].concat(bots).sort((a, b) => b.pts - a.pts);
    board.innerHTML =
      '<span class="microlabel" style="display:block;margin-bottom:8px">Arena ao vivo · mesmas tiras para todos</span>' +
      todos.map(function (p, i) {
        return '<div class="row" style="padding:5px 0;' + (p.eu ? 'color:var(--signal);font-weight:700' : '') + '">' +
          '<span class="mono" style="width:18px;font-size:12px;color:var(--ink-3)">' + (i + 1) + '</span>' +
          '<span style="font-size:16px">' + p.avatar + '</span>' +
          '<span class="grow" style="font-size:13.5px">' + ui().esc(p.nome) + '</span>' +
          '<span class="mono" style="font-size:13px">' + ui().fmt(p.pts) + '</span>' +
        '</div>';
      }).join('');
  }

  /* ---------- cronômetro ---------- */
  function iniciarTimer(seg, onTimeout) {
    const arc = $('timer-arc'), num = $('timer-num'), ring = $('timer');
    if (!arc) return;
    const C = 2 * Math.PI * 23;
    arc.style.strokeDasharray = C;
    const t0 = performance.now();
    function tick(ts) {
      const dec = (ts - t0) / 1000;
      const resta = Math.max(0, seg - dec);
      arc.style.strokeDashoffset = C * (1 - resta / seg);
      num.textContent = Math.ceil(resta);
      ring.classList.toggle('warn', resta / seg < 0.5 && resta / seg >= 0.25);
      ring.classList.toggle('danger', resta / seg < 0.25);
      if (resta <= 0) { onTimeout(); return; }
      timerRaf = requestAnimationFrame(tick);
    }
    timerRaf = requestAnimationFrame(tick);
  }
  function pararTimer() {
    if (timerRaf) cancelAnimationFrame(timerRaf);
    timerRaf = null;
  }

  /* ============ fluxo por tira ============ */
  function proximaTira() {
    travado = false;
    if (idx >= fila.length) { finalizarRodada(); return; }
    const item = fila[idx];
    renderPlayShell(item);
    if (modo.id === 'arena') { renderArenaBoard(); agendarBots(item); }

    const isCase = modo.id === 'plantao';
    const correto = isCase ? item.ritmoCorreto : item.base.ritmo;
    const pulso = isCase ? item.pulso : undefined;
    renderRespostas(opcoesResposta(correto, pulso), function (resposta, btnEl, ev) {
      pararTimer();
      const tempoMs = performance.now() - tInicioTira;
      if (isCase) responderCaso(item, resposta, tempoMs, btnEl);
      else responderTira(item, resposta, tempoMs, btnEl, ev);
    });

    tInicioTira = performance.now();
    if (modo.timerSeg > 0) {
      iniciarTimer(modo.timerSeg, function () {
        if (travado) return;
        travado = true;
        responderTira(item, null, modo.timerSeg * 1000, null, null); // tempo esgotado
      });
    }
  }

  function marcarBotoes(correto, escolhido) {
    document.querySelectorAll('#answers .answer-btn').forEach(function (b) {
      if (b.dataset.id === correto) b.classList.add('correct');
      else if (b.dataset.id === escolhido) b.classList.add('wrong');
      else b.classList.add('faded');
    });
  }

  /* ---------- resposta em modos de tira ---------- */
  function responderTira(item, resposta, tempoMs, btnEl, ev) {
    const correto = item.base.ritmo;
    const acertou = resposta === correto;
    marcarBotoes(correto, resposta);

    const ganho = computarGanho(acertou, tempoMs);
    aplicarGanho(ganho, acertou, item.base.ritmo, resposta, tempoMs);

    if (acertou && btnEl) {
      const rect = btnEl.getBoundingClientRect();
      const itens = [{ txt: '+' + ganho.xp + ' XP', tipo: 'xp' }];
      if (ganho.moedas) itens.push({ txt: '+' + ganho.moedas + ' ◉' });
      if (ganho.veloc) itens.push({ txt: 'rápido!', tipo: 'xp' });
      ui().burst(rect.left + rect.width / 2, rect.top, itens);
    }
    if (modo.id === 'arena') { pontuarArenaJogador(acertou, tempoMs); renderArenaBoard(); }

    setTimeout(function () {
      abrirFeedbackTira(item, resposta, acertou, ganho, tempoMs);
    }, acertou ? 620 : 780);
  }

  function computarGanho(acertou, tempoMs) {
    if (!acertou) return { xp: -20, moedas: 0, base: 0, veloc: 0, comboB: 0, mult: 1 };
    const timed = modo.timerSeg > 0;
    const base = 100;
    let veloc = 0;
    if (timed && tempoMs < 3000) veloc = 50;
    else if (timed && tempoMs < 6000) veloc = 25;
    const comboNovo = R.combo + 1;
    const comboB = Math.min(100, 10 * (comboNovo - 1));
    const mult = multCombo(comboNovo);
    const xp = Math.round((base + veloc + comboB) * mult * modo.xpFator);
    const moedas = 10 * modo.moedasFator;
    return { xp, moedas, base, veloc, comboB, mult };
  }

  function aplicarGanho(g, acertou, ritmo, resposta, tempoMs) {
    R.total++;
    if (acertou) {
      R.acertos++;
      R.combo++;
      if (R.combo > R.melhorCombo) R.melhorCombo = R.combo;
    } else {
      R.combo = 0;
    }
    R.xp += g.xp;
    R.moedas += g.moedas;
    R.tempos.push(tempoMs);
    const pr = R.porRitmo[ritmo] || (R.porRitmo[ritmo] = { hits: 0, total: 0 });
    pr.total++; if (acertou) pr.hits++;

    st().addXp(g.xp);
    if (g.moedas) st().addMoedas(g.moedas);
    st().registrarTentativa({
      ritmo: ritmo, resposta: resposta || 'tempo esgotado',
      correta: acertou, tempoMs: tempoMs, modo: modo.id, combo: R.combo
    });
    ui().refreshPills();
    atualizarHud();
    ui().celebrarBadges(st().checarBadges());
  }

  function atualizarHud() {
    if ($('hud-xp')) $('hud-xp').textContent = ui().fmt(R.xp);
    if ($('hud-coin')) $('hud-coin').textContent = ui().fmt(R.moedas);
    const cb = $('hud-combo'), box = $('hud-combo-box');
    if (cb) cb.textContent = '×' + R.combo + (multCombo(R.combo) > 1 ? ' · ' + multCombo(R.combo).toFixed(1) : '');
    if (box) {
      box.classList.toggle('hot', R.combo >= 5);
      if (R.combo >= 5) {
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
      }
    }
  }

  /* ---------- feedback: modos de tira ---------- */
  function abrirFeedbackTira(item, resposta, acertou, g, tempoMs) {
    const rit = PRQ.RHYTHMS[item.base.ritmo];
    const timeout = resposta === null;
    let html = '<div class="sheet-grip"></div>';

    if (acertou) {
      html +=
        '<div class="verdict ok">' +
          '<div class="verdict-icon">' + ui().icon('check') + '</div>' +
          '<div><h3>' + ui().esc(rit.nome) + '</h3>' +
          '<span class="microlabel">correto · ' + (tempoMs / 1000).toFixed(1) + 's</span></div>' +
        '</div>' +
        '<div class="gainrow">' +
          '<div class="gain g-xp"><b>+' + ui().fmt(g.xp) + '</b><span>XP total</span></div>' +
          (g.veloc ? '<div class="gain g-speed"><b>+' + g.veloc + '</b><span>velocidade</span></div>' : '') +
          (g.comboB ? '<div class="gain g-xp"><b>+' + g.comboB + '</b><span>combo ×' + g.mult.toFixed(1) + '</span></div>' : '') +
          '<div class="gain g-coin"><b>+' + g.moedas + '</b><span>moedas</span></div>' +
        '</div>' +
        '<div class="teachblock"><span class="microlabel txt-ok">Achados-chave desta tira</span><ul>' +
          rit.achados.map(a => '<li>' + ui().esc(a) + '</li>').join('') +
        '</ul></div>' +
        '<div class="tipbox"><b>Dica rápida:</b> ' + ui().esc(pick(rit.dicas)) + '</div>';
    } else {
      html +=
        '<div class="verdict bad">' +
          '<div class="verdict-icon">' + ui().icon('x') + '</div>' +
          '<div><h3>' + (timeout ? 'Tempo esgotado' : 'Ainda não') + '</h3>' +
          '<span class="microlabel">o correto era ' + ui().esc(rit.nome) + ' · −20 XP</span></div>' +
        '</div>' +
        '<div class="compare">' +
          '<div class="yours"><span class="microlabel">sua resposta</span><b>' + ui().esc(timeout ? 'sem resposta' : nomeRitmo(resposta)) + '</b></div>' +
          '<div class="right"><span class="microlabel">correto</span><b>' + ui().esc(rit.nome) + '</b></div>' +
        '</div>' +
        '<div class="teachblock trap"><span class="microlabel txt-bad">A armadilha aqui</span><ul>' +
          '<li>' + ui().esc(pick(rit.armadilhas)) + '</li>' +
        '</ul></div>' +
        '<div class="teachblock"><span class="microlabel txt-ok">Como reconhecer ' + ui().esc(rit.nome) + '</span><ul>' +
          rit.achados.slice(0, 3).map(a => '<li>' + ui().esc(a) + '</li>').join('') +
        '</ul></div>' +
        '<div class="tipbox"><b>Guarde isso:</b> ' + ui().esc(pick(rit.dicas)) + '</div>';
    }

    html += '<button class="btn btn-primary btn-block" id="btn-next">' +
      (idx + 1 >= fila.length ? 'Ver resultado' : 'Próxima tira') + '</button>';
    abrirSheet(html);
    $('btn-next').addEventListener('click', function () {
      fecharSheet();
      idx++;
      setTimeout(proximaTira, 260);
    });
  }

  /* ---------- Plantão PALS: duas etapas ---------- */
  function responderCaso(caso, respRitmo, tempoMs, btnEl) {
    const ritmoOk = respRitmo === caso.ritmoCorreto;
    marcarBotoes(caso.ritmoCorreto, respRitmo);
    if (ritmoOk && btnEl) {
      const rect = btnEl.getBoundingClientRect();
      ui().burst(rect.left + rect.width / 2, rect.top, [{ txt: 'ritmo ✓', tipo: 'xp' }]);
    }
    // etapa 2: conduta
    setTimeout(function () {
      $('pergunta').textContent = 'Conduta inicial (PALS)?';
      const box = $('answers');
      const ordem = shuffle(caso.condutas.map((c, i) => ({ c, i })));
      box.innerHTML = ordem.map(function (o) {
        return '<button class="answer-btn" style="grid-column:1/-1;min-height:52px;text-align:left;padding:12px 16px" data-i="' + o.i + '">' + ui().esc(o.c) + '</button>';
      }).join('');
      travado = false;
      box.querySelectorAll('.answer-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          if (travado) return;
          travado = true;
          const condOk = parseInt(b.dataset.i, 10) === caso.condutaCorreta;
          box.querySelectorAll('.answer-btn').forEach(function (o) {
            const i = parseInt(o.dataset.i, 10);
            if (i === caso.condutaCorreta) o.classList.add('correct');
            else if (o === b) o.classList.add('wrong');
            else o.classList.add('faded');
          });
          setTimeout(function () {
            fecharCaso(caso, respRitmo, ritmoOk, condOk, tempoMs);
          }, 720);
        });
      });
    }, 850);
  }

  function fecharCaso(caso, respRitmo, ritmoOk, condOk, tempoMs) {
    const tudoOk = ritmoOk && condOk;
    // pontuação: ritmo vale como tira; conduta correta soma bônus
    const g = computarGanho(ritmoOk, tempoMs);
    if (condOk) g.xp += Math.round(80 * modo.xpFator);
    if (tudoOk) { R.condutasOk++; st().get().counters.plantaoCondutas++; st().save(); }
    aplicarGanho(g, ritmoOk, caso.ritmoCorreto, respRitmo, tempoMs);

    let html = '<div class="sheet-grip"></div>' +
      '<div class="verdict ' + (tudoOk ? 'ok' : 'bad') + '">' +
        '<div class="verdict-icon">' + ui().icon(tudoOk ? 'check' : 'x') + '</div>' +
        '<div><h3>' + (tudoOk ? 'Caso resolvido' : ritmoOk ? 'Ritmo certo, conduta não' : 'Caso para revisar') + '</h3>' +
        '<span class="microlabel">' + ui().esc(nomeRitmo(caso.ritmoCorreto)) + '</span></div>' +
      '</div>' +
      '<div class="compare">' +
        '<div class="' + (ritmoOk ? 'right' : 'yours') + '"><span class="microlabel">ritmo</span><b>' + (ritmoOk ? 'correto ✓' : ui().esc(nomeRitmo(respRitmo))) + '</b></div>' +
        '<div class="' + (condOk ? 'right' : 'yours') + '"><span class="microlabel">conduta</span><b>' + (condOk ? 'correta ✓' : 'incorreta') + '</b></div>' +
      '</div>' +
      '<div class="teachblock"><span class="microlabel txt-info">Raciocínio do caso</span><ul>' +
        '<li>' + ui().esc(caso.explicacao) + '</li>' +
        '<li><b style="color:var(--ink)">Conduta esperada:</b> ' + ui().esc(caso.condutas[caso.condutaCorreta]) + '</li>' +
      '</ul></div>' +
      (ritmoOk ? '<div class="gainrow">' +
        '<div class="gain g-xp"><b>' + (g.xp >= 0 ? '+' : '') + ui().fmt(g.xp) + '</b><span>XP</span></div>' +
        '<div class="gain g-coin"><b>+' + g.moedas + '</b><span>moedas</span></div>' +
      '</div>' : '') +
      (caso.ritmoCorreto === 'aesp'
        ? '<div class="tipbox"><b>AESP:</b> ' + ui().esc(PRQ.AESP.dicas[0]) + '</div>'
        : '') +
      '<button class="btn btn-primary btn-block" id="btn-next">' +
      (idx + 1 >= fila.length ? 'Ver resultado' : 'Próximo caso') + '</button>';
    abrirSheet(html);
    $('btn-next').addEventListener('click', function () {
      fecharSheet();
      idx++;
      setTimeout(proximaTira, 260);
    });
  }

  /* ---------- arena: bots ---------- */
  function agendarBots(item) {
    bots.forEach(function (b) {
      const dif = item.base ? item.base.dificuldade : 2;
      const pAcerto = Math.max(0.25, b.skill - (dif - 1) * 0.09);
      const t = b.tMin + Math.random() * (b.tMax - b.tMin);
      b._timeout = setTimeout(function () {
        if (Math.random() < pAcerto) {
          const speed = t < 3000 ? 50 : t < 6000 ? 25 : 0;
          b.pts += 100 + speed;
        }
        renderArenaBoard();
      }, t);
    });
  }
  function pontuarArenaJogador(acertou, tempoMs) {
    // mesma régua dos bots: acurácia + velocidade + sequência
    if (!acertou) return;
    const speed = tempoMs < 3000 ? 50 : tempoMs < 6000 ? 25 : 0;
    R.arenaPts += 100 + speed + Math.min(50, (R.combo - 1) * 5);
  }
  function limparBots() {
    bots.forEach(function (b) { if (b._timeout) clearTimeout(b._timeout); });
  }

  /* ---------- sheet ---------- */
  function abrirSheet(html) {
    $('sheet').innerHTML = html;
    $('sheet-backdrop').classList.add('open');
    $('sheet').classList.add('open');
    $('sheet').scrollTop = 0;
  }
  function fecharSheet() {
    $('sheet-backdrop').classList.remove('open');
    $('sheet').classList.remove('open');
  }

  /* ============ RESULTADO ============ */
  function finalizarRodada() {
    if (liveHandle) liveHandle.stop();
    pararTimer();
    limparBots();

    const acc = R.total ? (R.acertos / R.total) * 100 : 0;
    let bonus = 0, moedasX2 = false;
    if (acc > 95) { bonus = 700; moedasX2 = true; }
    else if (acc > 90) bonus = 400;
    else if (acc > 80) bonus = 200;
    if (bonus) { R.bonusFinal = bonus; st().addXp(bonus); R.xp += bonus; }
    if (moedasX2 && R.moedas > 0) { st().addMoedas(R.moedas); R.moedas *= 2; }

    if (modo.id === 'treino') {
      st().get().counters.treinoSessoes++;
      st().save();
    }
    st().get().rodadas++;
    st().save();
    const recorde = R.xp > 0 ? st().setBestScore(modo.id, R.xp) : false;
    ui().refreshPills();
    ui().celebrarBadges(st().checarBadges());

    const tempoMedio = R.tempos.length
      ? (R.tempos.reduce((a, b) => a + b, 0) / R.tempos.length / 1000).toFixed(1)
      : '0.0';

    let arenaHtml = '';
    if (modo.id === 'arena') {
      const meu = { nome: st().get().nome || 'Você', avatar: st().get().avatar, pts: R.arenaPts, eu: true };
      const podio = [meu].concat(bots).sort((a, b) => b.pts - a.pts);
      const pos = podio.indexOf(meu) + 1;
      arenaHtml =
        '<div class="card mt-14"><span class="microlabel" style="display:block;margin-bottom:10px">Resultado da arena</span>' +
        podio.map(function (p, i) {
          return '<div class="row" style="padding:7px 0;' + (p.eu ? 'color:var(--signal);font-weight:700' : '') + '">' +
            '<span class="mono" style="width:20px">' + (i + 1) + 'º</span>' +
            '<span style="font-size:17px">' + p.avatar + '</span>' +
            '<span class="grow">' + ui().esc(p.nome) + '</span>' +
            '<span class="mono">' + ui().fmt(p.pts) + '</span></div>';
        }).join('') +
        '<p class="small muted mt-8">' + (pos === 1 ? 'Vitória! As mesmas tiras, o melhor tempo.' : 'Ficou em ' + pos + 'º. Velocidade conta tanto quanto acurácia.') + '</p></div>';
    }

    const porRitmoHtml = Object.keys(R.porRitmo).map(function (id) {
      const pr = R.porRitmo[id];
      const nome = nomeRitmo(id);
      const pct = (pr.hits / pr.total) * 100;
      return '<div class="masteryrow' + (pct < 60 ? ' weak' : '') + '">' +
        '<span class="mname">' + ui().esc(nome) + '</span>' +
        '<div class="meter"><i style="width:' + pct.toFixed(0) + '%"></i></div>' +
        '<span class="mval">' + pr.hits + '/' + pr.total + '</span></div>';
    }).join('');

    $('view-result').innerHTML =
      '<div class="result-hero">' +
        '<span class="microlabel">' + ui().esc(modo.nome) + ' · rodada concluída</span>' +
        '<h2>' + (acc >= 80 ? 'Sinal firme.' : acc >= 50 ? 'No caminho.' : 'Hora de revisar.') + '</h2>' +
        '<div class="ring-wrap">' + ui().ringSvg(0, 158, 11) +
          '<div class="ring-center"><b id="res-acc">0%</b><span>acurácia</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="card card-tight">' +
        '<div class="bonusline"><span>XP da rodada</span><b id="res-xp">0</b></div>' +
        (R.bonusFinal ? '<div class="bonusline"><span>Bônus de acurácia ' + (acc > 95 ? '>95%' : acc > 90 ? '>90%' : '>80%') + '</span><b>+' + R.bonusFinal + ' XP</b></div>' : '') +
        '<div class="bonusline"><span>Moedas' + (moedasX2 ? ' (×2 pela acurácia)' : '') + '</span><b class="gold">+' + ui().fmt(R.moedas) + ' ◉</b></div>' +
        '<div class="bonusline"><span>Melhor combo</span><b>×' + R.melhorCombo + '</b></div>' +
        (modo.timerSeg ? '<div class="bonusline"><span>Tempo médio por tira</span><b>' + tempoMedio + 's</b></div>' : '') +
        (modo.id === 'plantao' ? '<div class="bonusline"><span>Condutas PALS corretas</span><b>' + R.condutasOk + '/' + R.total + '</b></div>' : '') +
        (recorde && R.xp > 0 ? '<div class="bonusline"><span>Recorde pessoal</span><b class="gold">novo!</b></div>' : '') +
      '</div>' +
      '<div class="card card-tight mt-14"><span class="microlabel" style="display:block;margin-bottom:6px">Desempenho por ritmo</span>' + porRitmoHtml + '</div>' +
      arenaHtml +
      '<div class="card card-tight mt-14">' + ui().xpbarHtml() + '</div>' +
      '<div class="row mt-14" style="gap:10px">' +
        '<button class="btn btn-ghost grow" id="btn-modos">Modos</button>' +
        '<button class="btn btn-primary grow" id="btn-again">Jogar de novo</button>' +
      '</div>' +
      '<a class="btn btn-ghost btn-block mt-8" href="dashboard.html">Ver meu dashboard</a>';

    mostrarView('view-result');
    window.scrollTo(0, 0);

    setTimeout(function () {
      const svgArc = $('view-result').querySelector('.ringarc');
      if (svgArc) {
        const size = 158, stroke = 11, r = (size - stroke) / 2, c = 2 * Math.PI * r;
        svgArc.style.strokeDashoffset = (c * (1 - acc / 100)).toFixed(1);
      }
      ui().countUp($('res-acc'), acc, 1000, '%');
      ui().countUp($('res-xp'), R.xp, 1100);
    }, 120);

    $('btn-again').addEventListener('click', function () { renderSetup(); mostrarView('view-setup'); window.scrollTo(0, 0); });
    $('btn-modos').addEventListener('click', function () { location.href = 'modos.html'; });
  }

  /* ============ init ============ */
  function init() {
    const params = new URLSearchParams(location.search);
    const mid = params.get('modo') || 'treino';
    ritmoFoco = params.get('ritmo') || null;
    modo = PRQ.MODES[mid] || PRQ.MODES.treino;

    const S = st().get();
    if (S.nivel < modo.nivelMin) {
      PRQ.ui.toast('Modo bloqueado: alcance o nível ' + modo.nivelMin, 'gold');
      setTimeout(function () { location.href = 'modos.html'; }, 1200);
      return;
    }
    renderSetup();
    mostrarView('view-setup');
  }

  return { init: init };
})();
