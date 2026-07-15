# PALS Rhythm Quest

Uma experiência educacional da STOP (Sociedade Tocantinense de Pediatria).

Jogo educacional de reconhecimento rápido de arritmias pediátricas em tira de ECG,
pensado para treino de PALS em congressos e salas de aula. Protótipo funcional (MVP),
mobile-first, com estética de monitor de UTI e co-branding STOP.

O detalhamento da repaginação de marca (paleta dessaturada, tokens semânticos,
substituições de cor, splash, Liga STOP, Desafio STOP da Semana e emblema institucional)
está em `CO-BRANDING-STOP.md`. Os assets da logo ficam em `assets/`.

## Como rodar

É um site estático, sem build e sem dependências. Qualquer uma das opções funciona:

```bash
# opção 1: qualquer servidor estático
python3 -m http.server 8080
# e abra http://localhost:8080

# opção 2: abrir index.html direto no navegador
```

Também funciona hospedado em GitHub Pages, Netlify, Vercel etc. (basta apontar para a raiz).

### Demo em arquivo único

`demo/pals-rhythm-quest.html` é o site inteiro empacotado num só HTML (CSS, JS e
todas as páginas embutidos, com roteador interno). Serve para mandar por WhatsApp
ou e-mail e abrir direto no celular, sem servidor. Para regenerar após mudanças:

```bash
node tools/build-single.mjs
```

## Páginas

| Página | Conteúdo |
| --- | --- |
| `index.html` | Home: monitor vivo, nível/XP, streak, atalhos de jogo, prévia de ranking e emblemas |
| `modos.html` | Seleção dos 5 modos com bloqueio por nível, recordes e chips de mecânica |
| `partida.html` | Setup da rodada, tela de partida, feedback pós-resposta e resultado |
| `dashboard.html` | Acurácia global, domínio por ritmo, revisão dirigida, últimos erros, conta |
| `ranking.html` | Ranking semanal mockado com pódio e posição do jogador |
| `emblemas.html` | Coleção de emblemas com filtros, progresso e modal de detalhe |
| `biblioteca.html` | Enciclopédia dos 8 ritmos com busca, filtros e ficha completa |

## Modos de jogo

1. **Treino Guiado** (nível 1): sem tempo, feedback completo, XP reduzido.
2. **Arcade ECG** (nível 1): cronômetro, combo, moedas em dobro.
3. **Plantão PALS** (nível 3): caso clínico + ritmo + conduta. Único modo com AESP.
4. **Desafio Adaptativo** (nível 5): seleção ponderada pelos seus pontos fracos.
5. **Arena em Tempo Real** (nível 8): mesmas tiras contra 3 residentes simulados.

Os níveis de desbloqueio estão encurtados em relação ao design original
(6/11/16) para que a progressão caiba numa demo de congresso. Para restaurar,
ajuste `nivelMin` em `js/data.js`.

## Pontuação (conforme o design doc)

- Acerto: +100 XP e +10 moedas; bônus de velocidade +50 XP (<3s) ou +25 XP (<6s), só em modos cronometrados.
- Erro: −20 XP, nunca desconta moedas.
- Combo: +10 XP crescente por acerto consecutivo; multiplicador ×1,2 a ×2,0 a cada 5 acertos.
- Fim de rodada: bônus de acurácia (+200 / +400 / +700 XP; moedas ×2 acima de 95%).
- Anti-chute: velocidade só bonifica resposta correta.

## Arquitetura

```
css/style.css   design tokens + componentes (dark ICU)
js/data.js      ritmos, tiras mockadas, casos PALS, emblemas, ranking, modos
js/ecg.js       gerador procedural de ECG (canvas) + varredura de monitor
js/state.js     estado do jogador em localStorage (XP, nível, streak, domínio, emblemas)
js/ui.js        casca compartilhada (topbar, nav, toasts, modais, partículas)
js/game.js      motor de partida (fila, timer, pontuação, feedback, Plantão, Arena)
*.html          páginas (scripts clássicos, sem bundler; funciona via file://)
```

O estado fica em `localStorage` (`prq_state_v1`). O botão "Zerar progresso"
no dashboard reinicia a demo entre um visitante e outro do estande.

## Aviso clínico

Os ECGs deste protótipo são sintéticos (gerados proceduralmente) e existem apenas
para demonstração. A versão de produção exige validação de cada tira por
cardiologista pediátrico ou instrutor PALS. AESP nunca é identificável pela tira
isolada: aparece somente no Plantão PALS, com pulso ausente e atividade elétrica
organizada.
