/* ============================================================
   PALS Rhythm Quest · dados do jogo
   Ritmos, tiras mockadas, casos clínicos, emblemas, ranking.
   Conteúdo clínico conforme o design doc (protótipo educacional,
   requer validação por cardiologista pediátrico / instrutor PALS).
   ============================================================ */
window.PRQ = window.PRQ || {};

PRQ.RHYTHMS = {
  sinusal: {
    id: 'sinusal',
    nome: 'Ritmo sinusal normal',
    nomeEn: 'Normal Sinus Rhythm',
    dificuldade: 1,
    categoria: 'basico',
    fc: '80 a 130 (varia por idade)',
    qrs: 'Estreito (<0,09s)',
    ritmo: 'Regular',
    ondaP: 'Presente, positiva em DII',
    pqrs: '1:1',
    temP: true,
    qrsLargo: false,
    achados: [
      'Onda P antes de cada QRS',
      'PR constante',
      'QRS estreito e regular',
      'FC compatível com a idade'
    ],
    dicas: [
      'Toda P seguida de QRS estreito, ritmo regular e FC de acordo com a idade: é sinusal.',
      'Confirme o eixo da P positivo em DII para descartar ritmo ectópico.'
    ],
    armadilhas: [
      'Confundir a taquicardia sinusal fisiológica do lactente (FC alta normal) com TSV.'
    ]
  },
  bradicardia: {
    id: 'bradicardia',
    nome: 'Bradicardia sinusal',
    nomeEn: 'Sinus Bradycardia',
    dificuldade: 1,
    categoria: 'basico',
    fc: 'Abaixo do esperado para a idade',
    qrs: 'Estreito',
    ritmo: 'Regular',
    ondaP: 'Presente, 1:1',
    pqrs: '1:1',
    temP: true,
    qrsLargo: false,
    achados: [
      'Morfologia sinusal preservada, porém lenta',
      'P, QRS e T normais e espaçados',
      'PR constante'
    ],
    dicas: [
      'É sinusal, só que devagar: mesma morfologia com intervalos maiores.',
      'Em criança, bradicardia sintomática é hipóxia até prova em contrário. Oxigene e ventile PRIMEIRO.'
    ],
    armadilhas: [
      'Dar atropina antes de corrigir a hipóxia.',
      'Esquecer que a causa mais comum na criança é respiratória.'
    ]
  },
  taqsinusal: {
    id: 'taqsinusal',
    nome: 'Taquicardia sinusal',
    nomeEn: 'Sinus Tachycardia',
    dificuldade: 2,
    categoria: 'intermediario',
    fc: 'Alta, <220 lactente / <180 criança',
    qrs: 'Estreito',
    ritmo: 'Regular com variabilidade',
    ondaP: 'Presente (pode ser difícil de ver)',
    pqrs: '1:1',
    temP: true,
    qrsLargo: false,
    achados: [
      'P visível precedendo o QRS',
      'Variabilidade batimento a batimento',
      'FC responde ao contexto (febre, dor, hipovolemia)',
      'Início e término graduais'
    ],
    dicas: [
      'Taquicardia sinusal "conta uma história" clínica. Procure a P e a variabilidade R-R.',
      'Costuma respeitar o teto: <220 no lactente, <180 na criança.'
    ],
    armadilhas: [
      'Confundir com TSV. A chave é P visível, FC variável e abaixo do teto de frequência.'
    ]
  },
  tsv: {
    id: 'tsv',
    nome: 'Taquicardia supraventricular',
    nomeEn: 'SVT',
    dificuldade: 2,
    categoria: 'intermediario',
    fc: '>220 lactente / >180 criança',
    qrs: 'Estreito',
    ritmo: 'Extremamente regular',
    ondaP: 'Ausente / não identificável',
    pqrs: 'Indefinida',
    temP: false,
    qrsLargo: false,
    achados: [
      'Ritmo "metronômico", R-R fixo',
      'Sem P visível',
      'Início e término súbitos',
      'FC não varia com o contexto'
    ],
    dicas: [
      'TSV é regular como metrônomo, sem P, FC fixa e altíssima.',
      'Estável: manobra vagal / adenosina. Instável: cardioversão sincronizada.'
    ],
    armadilhas: [
      'Confundir com taquicardia sinusal.',
      'Com aberrância de condução o QRS alarga e imita TV.'
    ]
  },
  tv: {
    id: 'tv',
    nome: 'Taquicardia ventricular',
    nomeEn: 'VT',
    dificuldade: 3,
    categoria: 'avancado',
    fc: 'Rápida',
    qrs: 'LARGO (≥0,09s), monomórfico',
    ritmo: 'Regular',
    ondaP: 'Ausente / dissociada',
    pqrs: 'Dissociação AV possível',
    temP: false,
    qrsLargo: true,
    achados: [
      'Complexos largos e bizarros',
      'Sem P conduzida',
      'Pode haver dissociação AV',
      'Monomórfica e rápida'
    ],
    dicas: [
      'QRS largo e rápido: trate como TV até prova em contrário.',
      'Com pulso e instável: cardioversão sincronizada. Sem pulso: desfibrilação e RCP.'
    ],
    armadilhas: [
      'Assumir "TSV com aberrância" e retardar o tratamento de um QRS largo.'
    ]
  },
  fv: {
    id: 'fv',
    nome: 'Fibrilação ventricular',
    nomeEn: 'VF',
    dificuldade: 3,
    categoria: 'avancado',
    fc: 'Indeterminável',
    qrs: 'Sem QRS organizado',
    ritmo: 'Caótico',
    ondaP: 'Ausente',
    pqrs: 'Não se aplica',
    temP: false,
    qrsLargo: true,
    achados: [
      'Ondulações caóticas e irregulares',
      'Amplitude variável',
      'Nenhum complexo identificável',
      'Sem linha de base organizada'
    ],
    dicas: [
      'Tudo tremido, sem linha organizada: é FV. Desfibrilação imediata e RCP.',
      'É ritmo de PCR sem pulso: não perca tempo "medindo".'
    ],
    armadilhas: [
      'Tratar artefato de movimento como FV. Verifique o PACIENTE e o pulso, não a tela.'
    ]
  },
  assistolia: {
    id: 'assistolia',
    nome: 'Assistolia',
    nomeEn: 'Asystole',
    dificuldade: 1,
    categoria: 'basico',
    fc: 'Ausente',
    qrs: 'Ausente',
    ritmo: 'Linha isoelétrica',
    ondaP: 'Ausente',
    pqrs: 'Não se aplica',
    temP: false,
    qrsLargo: false,
    achados: [
      'Ausência de atividade elétrica',
      'Linha quase reta',
      'Confirmar em 2 derivações',
      'Checar ganho e eletrodos'
    ],
    dicas: [
      'Antes de chamar assistolia: cheque ganho, cabos e outra derivação ("protocolo da linha reta").',
      'Ritmo não chocável: RCP de alta qualidade, adrenalina e tratar os H’s e T’s.'
    ],
    armadilhas: [
      'FV fina confundida com assistolia.',
      'Cabo ou eletrodo solto simulando linha reta.'
    ]
  },
  bavt: {
    id: 'bavt',
    nome: 'BAVT / idioventricular lento',
    nomeEn: 'Complete AV Block',
    dificuldade: 3,
    categoria: 'avancado',
    fc: 'Ventricular lenta',
    qrs: 'Largo (escape) ou estreito',
    ritmo: 'Regular ventricular',
    ondaP: 'Presente, dissociada',
    pqrs: 'Dissociação AV (mais P que QRS)',
    temP: true,
    qrsLargo: true,
    achados: [
      'P e QRS marcham independentes',
      'PR variável, sem relação',
      'Mais ondas P do que QRS',
      'FC ventricular fixa e lenta'
    ],
    dicas: [
      'P e QRS "andam" cada um no seu ritmo, sem relação: bloqueio total.',
      'Bradicardia com má perfusão: epinefrina/atropina e considerar marca-passo.'
    ],
    armadilhas: [
      'Confundir com bradicardia sinusal (nesta há relação P:QRS 1:1).',
      'Não perceber a dissociação AV.'
    ]
  }
};

/* AESP: nunca identificável pela tira isolada.
   Só aparece no Plantão PALS, com pulso ausente + atividade organizada. */
PRQ.AESP = {
  id: 'aesp',
  nome: 'AESP (atividade elétrica sem pulso)',
  nomeEn: 'PEA',
  dicas: [
    'AESP é diagnóstico CLÍNICO: atividade elétrica organizada no monitor com pulso ausente no paciente.',
    'Ritmo não chocável: RCP de alta qualidade, adrenalina e busca ativa dos H’s e T’s.'
  ],
  armadilhas: [
    'Tentar diagnosticar AESP só pela tira. Sem checar pulso, a tira parece um ritmo organizado comum.'
  ]
};

/* confusões clássicas: alimentam os distratores das alternativas */
PRQ.CONFUSIONS = {
  sinusal:    ['taqsinusal', 'bradicardia', 'bavt'],
  bradicardia:['bavt', 'sinusal', 'assistolia'],
  taqsinusal: ['tsv', 'sinusal', 'tv'],
  tsv:        ['taqsinusal', 'tv', 'sinusal'],
  tv:         ['tsv', 'fv', 'taqsinusal'],
  fv:         ['tv', 'assistolia', 'tsv'],
  assistolia: ['fv', 'bradicardia', 'bavt'],
  bavt:       ['bradicardia', 'sinusal', 'tv']
};

/* ---------- tiras mockadas de ECG ----------
   Cada tira referencia um ritmo, uma FC alvo e um seed que
   controla o gerador procedural (variações de morfologia).
   Em produção, cada uma é substituída por ECG validado. */
PRQ.STRIPS = (function () {
  const defs = [
    // [ritmo, fc, dificuldade, idade]
    ['sinusal', 96, 1, 'criança'], ['sinusal', 118, 1, 'lactente'],
    ['sinusal', 84, 1, 'escolar'], ['sinusal', 128, 2, 'lactente'],
    ['sinusal', 104, 2, 'pré-escolar'], ['sinusal', 90, 3, 'escolar'],
    ['bradicardia', 52, 1, 'criança'], ['bradicardia', 44, 1, 'escolar'],
    ['bradicardia', 58, 2, 'lactente'], ['bradicardia', 48, 2, 'criança'],
    ['bradicardia', 40, 3, 'lactente'],
    ['taqsinusal', 168, 2, 'criança'], ['taqsinusal', 196, 2, 'lactente'],
    ['taqsinusal', 152, 1, 'escolar'], ['taqsinusal', 210, 3, 'lactente'],
    ['taqsinusal', 174, 3, 'criança'],
    ['tsv', 238, 2, 'lactente'], ['tsv', 224, 2, 'lactente'],
    ['tsv', 198, 2, 'criança'], ['tsv', 252, 3, 'lactente'],
    ['tsv', 186, 3, 'criança'],
    ['tv', 172, 3, 'criança'], ['tv', 196, 3, 'escolar'],
    ['tv', 152, 2, 'criança'], ['tv', 208, 3, 'lactente'],
    ['fv', 0, 2, 'criança'], ['fv', 0, 2, 'escolar'],
    ['fv', 0, 3, 'lactente'], ['fv', 0, 3, 'criança'],
    ['assistolia', 0, 1, 'criança'], ['assistolia', 0, 1, 'lactente'],
    ['assistolia', 0, 2, 'escolar'],
    ['bavt', 42, 3, 'criança'], ['bavt', 38, 3, 'escolar'],
    ['bavt', 46, 2, 'lactente'], ['bavt', 35, 3, 'criança']
  ];
  return defs.map(function (d, i) {
    return {
      id: 'strip_' + (i + 1),
      ritmo: d[0],
      fc: d[1],
      dificuldade: d[2],
      idade: d[3],
      seed: 1000 + i * 137
    };
  });
})();

/* ---------- casos clínicos do Plantão PALS ---------- */
PRQ.CASES = [
  {
    id: 'caso_1',
    vinheta: 'Lactente de 4 meses com febre há 2 dias, irritado, mama pouco. Chega chorando forte no colo da mãe.',
    idade: '4 meses', fcMonitor: 188, perfusao: 'Perfusão adequada, pulso forte',
    pulso: true, strip: { ritmo: 'taqsinusal', fc: 188, seed: 4101 },
    ritmoCorreto: 'taqsinusal',
    condutas: [
      'Tratar a causa: antitérmico, hidratação e reavaliar',
      'Adenosina 0,1 mg/kg em bolus rápido',
      'Cardioversão sincronizada 0,5 a 1 J/kg',
      'Adrenalina IV e iniciar RCP'
    ],
    condutaCorreta: 0,
    explicacao: 'FC alta com P visível, variabilidade e contexto de febre e desidratação: taquicardia sinusal. A conduta é tratar a causa, não o ritmo.'
  },
  {
    id: 'caso_2',
    vinheta: 'Lactente de 2 meses, pálido, gemente, mamando mal desde ontem. FC não muda com o choro.',
    idade: '2 meses', fcMonitor: 246, perfusao: 'Perfusão limítrofe, irritado, mas responsivo',
    pulso: true, strip: { ritmo: 'tsv', fc: 246, seed: 4202 },
    ritmoCorreto: 'tsv',
    condutas: [
      'Manobra vagal (gelo na face) e preparar adenosina',
      'Antitérmico e observação',
      'Desfibrilação 2 J/kg',
      'Atropina 0,02 mg/kg'
    ],
    condutaCorreta: 0,
    explicacao: 'FC >220 fixa, sem P e sem variabilidade: TSV. Paciente estável ainda: manobra vagal enquanto prepara adenosina.'
  },
  {
    id: 'caso_3',
    vinheta: 'Criança de 6 anos em pós-operatório cardíaco, hipotensa, sonolenta, extremidades frias.',
    idade: '6 anos', fcMonitor: 182, perfusao: 'Má perfusão, hipotensão, pulso fino',
    pulso: true, strip: { ritmo: 'tv', fc: 182, seed: 4303 },
    ritmoCorreto: 'tv',
    condutas: [
      'Cardioversão sincronizada 0,5 a 1 J/kg',
      'Adenosina e manobra vagal',
      'Só monitorizar e chamar o cardiologista',
      'Desfibrilação 4 J/kg (não sincronizada)'
    ],
    condutaCorreta: 0,
    explicacao: 'QRS largo, rápido, monomórfico, COM pulso mas instável: TV instável. Cardioversão sincronizada.'
  },
  {
    id: 'caso_4',
    vinheta: 'Escolar de 8 anos colapsa na quadra da escola. Sem resposta, sem respiração, sem pulso. RCP em andamento.',
    idade: '8 anos', fcMonitor: 0, perfusao: 'PCR: sem pulso central',
    pulso: false, strip: { ritmo: 'fv', fc: 0, seed: 4404 },
    ritmoCorreto: 'fv',
    condutas: [
      'Desfibrilação 2 J/kg e retomar RCP imediatamente',
      'Adenosina em bolus rápido',
      'Cardioversão sincronizada',
      'Adrenalina e reavaliar em 2 minutos, sem choque'
    ],
    condutaCorreta: 0,
    explicacao: 'Ondulações caóticas sem QRS organizado em paciente sem pulso: FV. Ritmo chocável, desfibrile já.'
  },
  {
    id: 'caso_5',
    vinheta: 'Lactente encontrado hipotônico no berço. Sem pulso. RCP iniciada. Monitor mostra complexos organizados e lentos.',
    idade: '7 meses', fcMonitor: 74, perfusao: 'PCR: sem pulso central, atividade elétrica presente',
    pulso: false, strip: { ritmo: 'sinusal', fc: 74, seed: 4505, aesp: true },
    ritmoCorreto: 'aesp',
    condutas: [
      'RCP de alta qualidade, adrenalina e caçar os H’s e T’s',
      'Desfibrilação 2 J/kg',
      'Cardioversão sincronizada 1 J/kg',
      'Atropina e marca-passo transcutâneo'
    ],
    condutaCorreta: 0,
    explicacao: 'Atividade elétrica organizada no monitor com pulso AUSENTE: AESP. Não chocável. RCP, adrenalina e causas reversíveis.'
  },
  {
    id: 'caso_6',
    vinheta: 'Lactente de 3 meses com bronquiolite grave, saturação 78%, sonolento, FC caindo no monitor.',
    idade: '3 meses', fcMonitor: 48, perfusao: 'Má perfusão, cianose, esforço respiratório',
    pulso: true, strip: { ritmo: 'bradicardia', fc: 48, seed: 4606 },
    ritmoCorreto: 'bradicardia',
    condutas: [
      'Oxigenar e ventilar; se persistir <60 com má perfusão, iniciar compressões',
      'Atropina imediata antes de qualquer outra medida',
      'Desfibrilação 2 J/kg',
      'Adenosina 0,1 mg/kg'
    ],
    condutaCorreta: 0,
    explicacao: 'Bradicardia na criança é hipóxia até prova em contrário. Via aérea, oxigênio e ventilação vêm ANTES de drogas.'
  },
  {
    id: 'caso_7',
    vinheta: 'Criança de 5 anos em RCP há 4 minutos após afogamento. Monitor: linha quase reta. Eletrodos conferidos, ganho ajustado.',
    idade: '5 anos', fcMonitor: 0, perfusao: 'PCR: sem pulso, sem atividade elétrica',
    pulso: false, strip: { ritmo: 'assistolia', fc: 0, seed: 4707 },
    ritmoCorreto: 'assistolia',
    condutas: [
      'RCP de alta qualidade + adrenalina a cada 3 a 5 min',
      'Desfibrilação 4 J/kg',
      'Cardioversão sincronizada',
      'Marca-passo transcutâneo imediato'
    ],
    condutaCorreta: 0,
    explicacao: 'Linha isoelétrica confirmada (cabos, ganho, derivação): assistolia. Não chocável. RCP e adrenalina.'
  },
  {
    id: 'caso_8',
    vinheta: 'Recém-nascido de 20 dias, letárgico, mal perfundido. Monitor: ondas P rápidas e QRS lentos, sem relação entre eles.',
    idade: '20 dias', fcMonitor: 44, perfusao: 'Má perfusão, letargia, pulsos finos',
    pulso: true, strip: { ritmo: 'bavt', fc: 44, seed: 4808 },
    ritmoCorreto: 'bavt',
    condutas: [
      'Oxigenar, adrenalina/atropina e preparar marca-passo',
      'Adenosina em bolus',
      'Desfibrilação 2 J/kg',
      'Apenas observar: é variante do normal'
    ],
    condutaCorreta: 0,
    explicacao: 'P e QRS dissociados com ventricular lento: BAVT. Bradicardia sintomática: suporte, drogas e considerar marca-passo.'
  },
  {
    id: 'caso_9',
    vinheta: 'Adolescente de 12 anos desmaia durante treino. Acorda confuso. No PS, assintomático, corado, pulso cheio.',
    idade: '12 anos', fcMonitor: 92, perfusao: 'Boa perfusão, assintomático no momento',
    pulso: true, strip: { ritmo: 'sinusal', fc: 92, seed: 4909 },
    ritmoCorreto: 'sinusal',
    condutas: [
      'Monitorizar, ECG de 12 derivações e investigar a síncope',
      'Adenosina profilática',
      'Cardioversão sincronizada',
      'Alta imediata sem exames'
    ],
    condutaCorreta: 0,
    explicacao: 'Tira atual sinusal e paciente estável: investigue a síncope (ECG 12 derivações, história). Não trate o monitor, trate o paciente.'
  },
  {
    id: 'caso_10',
    vinheta: 'Criança de 4 anos com diarreia intensa há 3 dias, sem pulso ao chegar. RCP iniciada. Monitor com ritmo organizado estreito.',
    idade: '4 anos', fcMonitor: 118, perfusao: 'PCR: sem pulso central, atividade organizada no monitor',
    pulso: false, strip: { ritmo: 'sinusal', fc: 118, seed: 5010, aesp: true },
    ritmoCorreto: 'aesp',
    condutas: [
      'RCP + adrenalina + volume (hipovolemia é o H mais provável)',
      'Desfibrilação 2 J/kg',
      'Cardioversão sincronizada 0,5 J/kg',
      'Manobra vagal'
    ],
    condutaCorreta: 0,
    explicacao: 'Ritmo organizado sem pulso: AESP. Diarreia grave aponta hipovolemia como causa reversível: RCP, adrenalina e volume.'
  }
];

/* ---------- modos de jogo ---------- */
PRQ.MODES = {
  treino: {
    id: 'treino', num: '01', tag: 'Iniciante',
    nome: 'Treino Guiado',
    desc: 'Sem cronômetro. Feedback completo em cada tira: achados destacados, explicação e dica de reconhecimento. O terreno seguro para errar e aprender.',
    chips: ['sem tempo', 'feedback total', 'XP reduzido'],
    cor: '#2ad4a5', icone: 'book',
    nivelMin: 1, tiras: 8, timerSeg: 0, xpFator: 0.5, moedasFator: 1
  },
  arcade: {
    id: 'arcade', num: '02', tag: 'Fluência',
    nome: 'Arcade ECG',
    desc: 'Rodadas rápidas contra o relógio. Combo cresce a cada acerto, moedas chovem, XP multiplica. O foco é reconhecer em menos de 3s sem pensar demais.',
    chips: ['tempo', 'combo', 'moedas x2'],
    cor: '#ffc64a', icone: 'bolt',
    nivelMin: 1, tiras: 12, timerSeg: 12, xpFator: 1, moedasFator: 2
  },
  plantao: {
    id: 'plantao', num: '03', tag: 'Aplicação',
    nome: 'Plantão PALS',
    desc: 'Casos clínicos curtos: idade, FC, sinais de perfusão e contexto, mais o ECG. Identifique o ritmo e escolha a conduta inicial PALS. Único modo onde AESP aparece.',
    chips: ['caso clínico', 'conduta', 'AESP aqui'],
    cor: '#4f8cff', icone: 'stetho',
    nivelMin: 3, tiras: 5, timerSeg: 0, xpFator: 1.4, moedasFator: 1
  },
  adaptativo: {
    id: 'adaptativo', num: '04', tag: 'Personalizado',
    nome: 'Desafio Adaptativo',
    desc: 'O algoritmo ajusta a dificuldade em tempo real com base na sua acurácia, tempo médio e ritmos com maior taxa de erro. Nunca fácil demais, nunca frustrante.',
    chips: ['adaptativo', 'revisão espaçada'],
    cor: '#b78bff', icone: 'target',
    nivelMin: 5, tiras: 10, timerSeg: 15, xpFator: 1.2, moedasFator: 1
  },
  arena: {
    id: 'arena', num: '05', tag: 'PvP · tempo real',
    nome: 'Arena em Tempo Real',
    desc: 'Competição ao vivo: todos recebem as mesmas tiras simultaneamente. A pontuação combina acurácia, velocidade e sequência. Nesta demo, você enfrenta 3 residentes simulados.',
    chips: ['mesmas tiras p/ todos', 'pontuação combinada'],
    cor: '#ff5a6a', icone: 'trophy',
    nivelMin: 8, tiras: 8, timerSeg: 10, xpFator: 1, moedasFator: 1
  }
};

/* ---------- emblemas ---------- */
PRQ.BADGES = [
  {
    id: 'estagiario', emoji: '🩺', nome: 'Estagiário do Monitor',
    criterio: 'Concluir a 1ª sessão de Treino Guiado',
    descricao: 'Primeiro contato com a leitura sistemática de tiras. Onda P, QRS, ritmo, frequência.',
    meta: 1, contador: 'treinoSessoes'
  },
  {
    id: 'cacador_p', emoji: '🔍', nome: 'Caçador de P ondas',
    criterio: '25 acertos em ritmos com onda P',
    descricao: 'Treina localizar a P e sua relação com o QRS, o primeiro passo do algoritmo de leitura.',
    meta: 25, contador: 'acertosComP'
  },
  {
    id: 'mestre_qrs', emoji: '⚡', nome: 'Mestre do QRS',
    criterio: '50 acertos separando QRS estreito de largo',
    descricao: 'A largura do QRS separa supra de ventricular, e muda toda a conduta.',
    meta: 50, contador: 'acertosQrs'
  },
  {
    id: 'guardiao', emoji: '🛡️', nome: 'Guardião do Ritmo',
    criterio: '20 acertos consecutivos',
    descricao: 'Consistência sob pressão: reconhecer certo, muitas vezes, sem escorregar.',
    meta: 20, contador: 'melhorCombo'
  },
  {
    id: 'especialista_tsv', emoji: '🎯', nome: 'Especialista em TSV',
    criterio: '15 TSV diferenciadas de taquicardia sinusal',
    descricao: 'Vence a confusão clássica da pediatria: sinusal varia e "conta história"; TSV é fixa.',
    meta: 15, contador: 'acertosTsv'
  },
  {
    id: 'sobrevivente_fv', emoji: '🔥', nome: 'Sobrevivente da FV',
    criterio: 'Reconhecer FV em menos de 2s em 10 casos',
    descricao: 'Ritmo chocável: cada segundo importa. Velocidade de reconhecimento salva vida.',
    meta: 10, contador: 'fvRapidas'
  },
  {
    id: 'codigo_azul', emoji: '🔵', nome: 'Código Azul',
    criterio: '20 casos do Plantão PALS com conduta correta',
    descricao: 'Integra ritmo e decisão: não basta nomear, é preciso agir conforme o PALS.',
    meta: 20, contador: 'plantaoCondutas'
  },
  {
    id: 'instrutor', emoji: '🎖️', nome: 'Instrutor PALS',
    criterio: 'Nível 21+ com 95% de acurácia global',
    descricao: 'Domínio de nível de quem ensina: reconhecimento rápido, preciso e reproduzível.',
    meta: 1, contador: 'instrutor'
  }
];

/* ---------- títulos por faixa de nível ---------- */
PRQ.TITLES = [
  { min: 1, max: 5, titulo: 'Estagiário do Monitor', destrava: 'Treino Guiado + Arcade' },
  { min: 3, max: 5, titulo: 'Estagiário do Monitor', destrava: 'Plantão PALS' },
  { min: 6, max: 10, titulo: 'Leitor de Tiras', destrava: 'Desafio Adaptativo' },
  { min: 11, max: 15, titulo: 'Guardião do Ritmo', destrava: 'Arena em Tempo Real' },
  { min: 16, max: 20, titulo: 'Mestre do QRS', destrava: 'Dificuldade máxima' },
  { min: 21, max: 999, titulo: 'Instrutor PALS', destrava: 'Prestígio + criar salas' }
];

PRQ.titleFor = function (level) {
  if (level >= 21) return 'Instrutor PALS';
  if (level >= 16) return 'Mestre do QRS';
  if (level >= 11) return 'Guardião do Ritmo';
  if (level >= 6) return 'Leitor de Tiras';
  return 'Estagiário do Monitor';
};

/* ---------- ranking semanal mockado ---------- */
PRQ.RANKING_MOCK = [
  { nome: 'Marina Sotero', avatar: '🦉', turma: 'R2 Pediatria', pts: 4180, delta: 0 },
  { nome: 'Pedro Albuquerque', avatar: '🦈', turma: 'R1 Pediatria', pts: 3925, delta: 1 },
  { nome: 'Luiza Ferrão', avatar: '🐆', turma: 'Internato 6º ano', pts: 3710, delta: -1 },
  { nome: 'Kaique Munhoz', avatar: '🦅', turma: 'R2 Pediatria', pts: 3245, delta: 2 },
  { nome: 'Bianca Trindade', avatar: '🐬', turma: 'R3 UTI Ped', pts: 2980, delta: 0 },
  { nome: 'Otávio Sampaio', avatar: '🐺', turma: 'Internato 5º ano', pts: 2610, delta: -2 },
  { nome: 'Rebeca Vilaça', avatar: '🦊', turma: 'R1 Pediatria', pts: 2340, delta: 3 },
  { nome: 'Gustavo Peixoto', avatar: '🐙', turma: 'Enfermagem PICU', pts: 2110, delta: 0 },
  { nome: 'Talita Brandão', avatar: '🐝', turma: 'R2 Emergência', pts: 1875, delta: -1 },
  { nome: 'Ícaro Navarro', avatar: '🦂', turma: 'Internato 6º ano', pts: 1590, delta: 1 },
  { nome: 'Sofia Camargo', avatar: '🐢', turma: 'R1 Pediatria', pts: 1320, delta: -1 },
  { nome: 'Davi Rezende', avatar: '🦁', turma: 'Enfermagem PICU', pts: 980, delta: 0 }
];

/* nomes dos bots da Arena */
PRQ.ARENA_BOTS = [
  { nome: 'Dra. Marina', avatar: '🦉', skill: 0.86, tMin: 1600, tMax: 4200 },
  { nome: 'Dr. Pedro', avatar: '🦈', skill: 0.74, tMin: 2200, tMax: 5600 },
  { nome: 'Interna Luiza', avatar: '🐆', skill: 0.62, tMin: 2600, tMax: 7000 }
];

PRQ.AVATARS = ['🩺', '🚑', '🧠', '🫀', '🔬', '🦉', '🐆', '🦈', '🐬', '🦊', '🐙', '🦅'];
