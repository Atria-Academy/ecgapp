# Co-branding STOP · PALS Rhythm Quest

"PALS Rhythm Quest — uma experiência educacional da STOP"

Aplicação da direção visual aprovada (Sociedade Tocantinense de Pediatria) sobre o
protótipo existente, sem reescrever a estrutura, sem frameworks e preservando toda
a lógica de jogo (localStorage, XP, moedas, ranking, emblemas, rotas e algoritmos de ECG).

## Resumo das alterações

- Nova paleta STOP dessaturada aplicada por tokens semânticos; amarelo, dourado e
  laranja saturado removidos de todos os componentes.
- Verde do ECG separado do verde de acerto: `--ecg-signal` (traçado, menos neon) e
  `--success` (acerto) são variáveis distintas.
- Brand lockup responsivo no header: "RhythmQuest" + selo "por STOP" (turquesa); no
  desktop, versão compacta da logo ao lado da marca; abaixo de 400px o selo recolhe
  para não comprimir moedas e sequência.
- Hero com assinatura "Uma experiência educacional da STOP".
- Splash institucional só no primeiro acesso (logo STOP, "apresenta", marca do jogo,
  máx. 2s, botão pular, respeita prefers-reduced-motion, sem flashes).
- Seção "Desafio STOP da Semana" na home (ritmo-foco rotativo por semana, selo turquesa,
  bônus de XP e emblema ao concluir).
- Ranking semanal renomeado visualmente para "Liga STOP" (lógica interna intacta).
- Emblema especial "Selo STOP" com moldura roxo + turquesa (sem deformar a logo).
- Rodapé institucional com logo, nome completo da Sociedade e aviso clínico.
- Logo recortada e otimizada em `assets/` (PNG + WebP), proporção preservada.
- Selo textual "STOP" nas telas de preparação/resultado; a logo completa nunca entra
  na tela de perguntas nem sobre o traçado.

## Tabela dos novos tokens

| Token | Valor | Função |
| --- | --- | --- |
| `--success` | `#55C58F` | acerto / conclusão |
| `--success-soft` | `#86D7B0` | acerto (variante clara) |
| `--success-dim` | `rgba(85,197,143,.14)` | fundo de acerto |
| `--danger` | `#E4788A` | erro / crítico / PCR |
| `--danger-soft` | `#EFA3AF` | erro (variante clara) |
| `--danger-dim` | `rgba(228,120,138,.14)` | fundo de erro |
| `--information` | `#5E9EC9` | casos / contexto clínico |
| `--information-soft` | `#8FBBDA` | info (variante clara) |
| `--information-dim` | `rgba(94,158,201,.14)` | fundo de info |
| `--progress` | `#55C58F` | barra de XP / mastery |
| `--institutional` | `#4BBEC1` | selo / chancela STOP |
| `--institutional-dim` | `rgba(75,190,193,.14)` | fundo institucional |
| `--nivel` | `#9E82D6` | níveis / progressão / especial |
| `--nivel-soft` | `#B7A3E2` | nível (variante clara) |
| `--nivel-dim` | `rgba(158,130,214,.14)` | fundo de nível |
| `--reward` | `#C3B2E6` | moedas / XP / pódio / bônus |
| `--reward-soft` | `#D6CBEF` | recompensa (variante clara) |
| `--reward-dim` | `rgba(195,178,230,.14)` | fundo de recompensa |
| `--reward-ink` | `#F3EEF7` | texto sobre recompensa |
| `--streak` | `#B7A3E2` | sequência de dias (sem laranja) |
| `--locked` | `#6B7C8E` | bloqueado / indisponível |
| `--locked-dim` | `rgba(107,124,142,.14)` | fundo de bloqueio |
| `--ecg-signal` | `#46D6A2` | traçado do ECG (menos neon) |
| `--ecg-glow` | `rgba(70,214,162,.42)` | brilho contido do traçado |

Aliases mantidos para não quebrar componentes: `--ok`→`--success`, `--info`→`--information`,
`--bad`→`--danger`, `--signal`→`--progress`, com os respectivos `-dim`.

## Substituições de cor realizadas

| Antes | Depois | Onde |
| --- | --- | --- |
| `--gold #ffc64a` | removido → `--reward #C3B2E6` | todo o projeto |
| `--gold-dim` | removido → `--reward-dim` | todo o projeto |
| verde neon `#3af0ac` | `--ecg-signal #46D6A2` | traçado do ECG |
| glow ECG `rgba(58,240,172,.55)` | `rgba(70,214,162,.38)` + blur menor | canvas |
| `--ok #2ad4a5` | `--success #55C58F` | acerto / primária |
| `--info #4f8cff` | `--information #5E9EC9` | casos / clínico |
| `--bad #ff5a6a` | `--danger #E4788A` | erro / crítico |
| streak laranja `#ff9e6b` | `--streak #B7A3E2` | pílula de sequência |
| pódio 1º dourado | `--reward` (lavanda) | ranking |
| pódio 3º bronze `#d29a6b` | coral suave `#EFA3AF` | ranking |
| moedas amarelas | lavanda `--reward` | header, HUD, ganhos |
| partículas amarelas de XP | prata `#C6CFDA` | burst de recompensa |
| cronômetro amarelo (atenção) | azul-petróleo `--information` | partida |
| `chip.gold` | `chip.reward` (+ novas `institutional`, `nivel`, `locked`) | chips |
| `meter.gold` | `meter.reward` (+ `meter.nivel`) | barras |
| `toast.gold` | `toast.reward` (+ `toast.institutional`) | toasts |
| `txt-gold` | `txt-reward` (+ `txt-institutional`, `txt-nivel`) | textos |
| `stat-tile.t-gold` | `stat-tile.t-reward` | dashboard |
| tipbox dourada | azul-petróleo (informação) | feedback |
| aviso clínico com borda amarela | borda coral suave | disclaimer |
| cores dos modos (arcade dourado etc.) | verde/lavanda/petróleo/roxo/coral | seleção de modos |

## Modos: cor-código atualizado

| Modo | Cor antes | Cor depois |
| --- | --- | --- |
| Treino Guiado | `#2ad4a5` | `#55C58F` verde |
| Arcade ECG | `#ffc64a` (dourado) | `#C3B2E6` lavanda |
| Plantão PALS | `#4f8cff` | `#5E9EC9` azul-petróleo |
| Desafio Adaptativo | `#b78bff` | `#9E82D6` roxo |
| Arena em Tempo Real | `#ff5a6a` | `#E4788A` coral |

## Assets

- `assets/stop-logo.png` — logo recortada (594×304, margens transparentes removidas), otimizada.
- `assets/stop-logo.webp` — mesma logo em WebP (~12 KB), proporção 1,954 preservada.
- `assets/stop-logo.b64.txt` — data URI usada pelo build de arquivo único.
- No build `demo/pals-rhythm-quest.html` a logo é embutida como data URI (sem dependência externa).

Proporção e desenho da marca não foram alterados; a logo institucional mantém suas
cores originais e é usada apenas em splash e rodapé, conforme a direção.

## Testes realizados (navegador real, Chromium)

- Página inicial, splash (primeiro acesso), seleção de modos.
- Início de partida, resposta correta e incorreta, feedback educacional, resultado.
- Liga STOP (ranking), biblioteca, dashboard, emblemas (incl. Selo STOP especial).
- Desafio STOP da Semana (setup, bônus e selo no resultado).
- Navegação mobile (nav inferior) e desktop (nav no topo + logo compacta).
- Persistência do estado após recarregar (localStorage intacto).
- Layouts em 360px, 768px e acima de 1060px, sem overflow no header.
- prefers-reduced-motion (splash encurtada, animações neutralizadas).
- Varredura automática de pixels confirmando ausência de amarelo/laranja saturado.
- Zero erros de JavaScript em todas as telas.

## Pontos que ainda precisam de validação institucional

- Uso e proporção exatos da logo STOP oficial (o recorte veio do PDF de direção;
  o ideal é substituir pelo arquivo vetorial oficial da Sociedade).
- A logo institucional contém amarelo/laranja na própria marca; ela foi mantida
  intacta e confinada a splash e rodapé. Confirmar se a diretoria aceita a marca
  original nesses dois pontos ou se há uma versão monocromática preferida.
- Texto de assinatura, nome oficial completo e eventuais selos/links institucionais.
- Todo o conteúdo clínico (ritmos, condutas PALS, casos) continua exigindo validação
  por cardiologista pediátrico ou instrutor PALS antes de uso educacional real.
- Regras definitivas do Desafio STOP da Semana e da Liga STOP (premiação, cadência).
