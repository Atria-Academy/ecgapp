/* ============================================================
   PALS Rhythm Quest · estado do jogador
   Persistência em localStorage. XP, nível, moedas, streak,
   domínio por ritmo, contadores de emblema e histórico.
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.state = (function () {
  const KEY = 'prq_state_v1';

  function freshState() {
    const rhythmStats = {};
    Object.keys(PRQ.RHYTHMS).forEach(function (id) {
      rhythmStats[id] = { hits: 0, total: 0, mastery: 0.5, msSum: 0 };
    });
    return {
      v: 1,
      nome: null,
      avatar: '🩺',
      xp: 0,
      nivel: 1,
      moedas: 0,
      streak: { dias: 0, ultimo: null },
      weekly: { xp: 0, semana: weekKey() },
      rhythmStats: rhythmStats,
      counters: {
        treinoSessoes: 0,
        acertosComP: 0,
        acertosQrs: 0,
        melhorCombo: 0,
        acertosTsv: 0,
        fvRapidas: 0,
        plantaoCondutas: 0
      },
      badges: [],
      badgesNovos: [],
      bestScores: {},
      erros: [],        // últimos erros p/ revisão
      tirasRespondidas: 0,
      acertosTotais: 0,
      rodadas: 0
    };
  }

  function weekKey() {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // segunda = 0
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  }

  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      const s = JSON.parse(raw);
      const base = freshState();
      // merge defensivo p/ upgrades de schema
      const merged = Object.assign(base, s);
      merged.counters = Object.assign(base.counters, s.counters || {});
      merged.rhythmStats = Object.assign(base.rhythmStats, s.rhythmStats || {});
      if (merged.weekly.semana !== weekKey()) {
        merged.weekly = { xp: 0, semana: weekKey() };
      }
      merged.nivel = nivelPorXp(merged.xp); // nível sempre deriva do XP
      return merged;
    } catch (e) {
      return freshState();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* quota */ }
  }

  function reset() {
    S = freshState();
    save();
  }

  /* ---------- nível ---------- */
  function xpParaNivel(n) {
    // XP para ir do nível n ao n+1; cresce ~15% por nível
    return Math.round(500 * Math.pow(1.15, n - 1));
  }
  function xpAcumuladoAte(n) {
    let total = 0;
    for (let i = 1; i < n; i++) total += xpParaNivel(i);
    return total;
  }
  function nivelPorXp(xp) {
    let n = 1;
    while (xp >= xpAcumuladoAte(n + 1) && n < 60) n++;
    return n;
  }
  function progressoNivel() {
    const base = xpAcumuladoAte(S.nivel);
    const next = xpParaNivel(S.nivel);
    return {
      atual: S.xp - base,
      necessario: next,
      pct: Math.min(100, Math.max(0, ((S.xp - base) / next) * 100))
    };
  }

  function addXp(qtd) {
    S.xp = Math.max(0, S.xp + qtd);
    if (qtd > 0) S.weekly.xp += qtd;
    const novo = nivelPorXp(S.xp);
    const subiu = novo > S.nivel;
    const antes = S.nivel;
    S.nivel = novo;
    save();
    return subiu ? { de: antes, para: novo } : null;
  }

  function addMoedas(qtd) {
    S.moedas = Math.max(0, S.moedas + qtd);
    save();
  }

  /* ---------- streak diário ---------- */
  function tocarStreak() {
    const hoje = new Date().toISOString().slice(0, 10);
    if (S.streak.ultimo === hoje) return S.streak.dias;
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    S.streak.dias = (S.streak.ultimo === ontem) ? S.streak.dias + 1 : 1;
    S.streak.ultimo = hoje;
    save();
    return S.streak.dias;
  }

  /* ---------- tentativas ---------- */
  function registrarTentativa(att) {
    // att: { ritmo, resposta, correta, tempoMs, modo, combo, fvRapida }
    S.tirasRespondidas++;
    if (att.correta) S.acertosTotais++;

    const rs = S.rhythmStats[att.ritmo];
    if (rs) {
      rs.total++;
      if (att.correta) rs.hits++;
      rs.msSum += att.tempoMs || 0;
      rs.mastery = 0.78 * rs.mastery + 0.22 * (att.correta ? 1 : 0);
    }

    const rit = PRQ.RHYTHMS[att.ritmo];
    if (att.correta && rit) {
      if (rit.temP) S.counters.acertosComP++;
      S.counters.acertosQrs++;
      if (att.ritmo === 'tsv') S.counters.acertosTsv++;
      if (att.ritmo === 'fv' && att.tempoMs > 0 && att.tempoMs < 2000) S.counters.fvRapidas++;
    }
    if (att.combo > S.counters.melhorCombo) S.counters.melhorCombo = att.combo;

    if (!att.correta) {
      S.erros.unshift({
        ritmo: att.ritmo,
        resposta: att.resposta,
        modo: att.modo,
        quando: Date.now()
      });
      S.erros = S.erros.slice(0, 30);
    }
    save();
  }

  function acuraciaGlobal() {
    if (!S.tirasRespondidas) return 0;
    return (S.acertosTotais / S.tirasRespondidas) * 100;
  }

  /* ---------- emblemas ---------- */
  function progressoBadge(b) {
    if (b.contador === 'instrutor') {
      return (S.nivel >= 21 && acuraciaGlobal() >= 95) ? 1 : 0;
    }
    return S.counters[b.contador] || 0;
  }

  function checarBadges() {
    const novos = [];
    PRQ.BADGES.forEach(function (b) {
      if (S.badges.indexOf(b.id) >= 0) return;
      if (progressoBadge(b) >= b.meta) {
        S.badges.push(b.id);
        S.badgesNovos.push(b.id);
        novos.push(b);
      }
    });
    if (novos.length) save();
    return novos;
  }

  function consumirBadgesNovos() {
    const list = S.badgesNovos.slice();
    S.badgesNovos = [];
    save();
    return list;
  }

  /* ---------- seleção adaptativa ---------- */
  function pesoRitmo(id) {
    const rs = S.rhythmStats[id];
    const fraqueza = 1 - (rs ? rs.mastery : 0.5);
    const novidade = rs && rs.total < 4 ? 0.35 : 0;
    return 0.25 + fraqueza + novidade;
  }

  function ritmosFracos(n) {
    return Object.keys(S.rhythmStats)
      .filter(function (id) { return S.rhythmStats[id].total >= 2; })
      .sort(function (a, b) { return S.rhythmStats[a].mastery - S.rhythmStats[b].mastery; })
      .slice(0, n || 3);
  }

  /* ---------- perfil ---------- */
  function setPerfil(nome, avatar) {
    S.nome = nome;
    S.avatar = avatar;
    save();
  }

  function setBestScore(modo, pts) {
    if (!S.bestScores[modo] || pts > S.bestScores[modo]) {
      S.bestScores[modo] = pts;
      save();
      return true;
    }
    return false;
  }

  return {
    get: function () { return S; },
    save: save,
    reset: reset,
    xpParaNivel: xpParaNivel,
    progressoNivel: progressoNivel,
    addXp: addXp,
    addMoedas: addMoedas,
    tocarStreak: tocarStreak,
    registrarTentativa: registrarTentativa,
    acuraciaGlobal: acuraciaGlobal,
    progressoBadge: progressoBadge,
    checarBadges: checarBadges,
    consumirBadgesNovos: consumirBadgesNovos,
    pesoRitmo: pesoRitmo,
    ritmosFracos: ritmosFracos,
    setPerfil: setPerfil,
    setBestScore: setBestScore
  };
})();
