# Publicar o PALS Rhythm Quest na internet

O site é **estático** (HTML, CSS e JavaScript puro, sem build). Você sobe os
arquivos da raiz do repositório em qualquer hospedagem e já funciona em celular,
tablet e desktop. Ele também é um **PWA**: o congressista pode tocar em
"Adicionar à tela inicial" e usar como app, inclusive com o wifi instável do evento.

## O que subir

Tudo na raiz do repositório:

```
index.html  modos.html  partida.html  dashboard.html
ranking.html  emblemas.html  biblioteca.html
manifest.webmanifest  sw.js
css/   js/   assets/
```

Não precisa subir `demo/`, `tools/`, `CO-BRANDING-STOP.md`, `README.md` nem `DEPLOY.md`.

## Requisito importante: servir por HTTPS

O PWA (instalação na tela inicial + cache offline via service worker) só liga em
**HTTPS**. Todas as opções abaixo já entregam HTTPS automático. Abrir o arquivo
direto do celular (`file://`) mostra o código no iPhone e não instala o app; por
isso hospede em vez de mandar o arquivo solto.

## Opções de hospedagem (da mais rápida para a mais completa)

### Netlify (arrastar e soltar, ~1 min)
1. Entre em app.netlify.com, aba "Sites".
2. Arraste a pasta do projeto para a área de deploy.
3. Pronto: recebe uma URL `https://seu-site.netlify.app`. Mande essa URL.

### Vercel / Cloudflare Pages
1. Conecte o repositório `Atria-Academy/ecgapp`.
2. Framework preset: "Other" (nenhum). Build command: vazio. Output: raiz (`.`).
3. Deploy. URL HTTPS automática.

### GitHub Pages (usa o próprio repositório)
1. No GitHub: Settings > Pages.
2. Source: "Deploy from a branch". Branch: a que tiver o código; pasta `/ (root)`.
3. Salvar. Em ~1 min a URL fica em `https://atria-academy.github.io/ecgapp/`.

### Servidor próprio (nginx/Apache)
Copie os arquivos para a pasta pública e sirva por HTTPS. Nenhuma config especial;
apenas garanta que `index.html` seja o documento padrão.

## Atualizar depois de publicar

Ao mudar qualquer arquivo, suba de novo. Se usar service worker, incremente a
versão do cache em `sw.js` (troque `prq-v1` por `prq-v2`) para os celulares
pegarem a versão nova sem limpar cache na mão.

## Onde plugar um backend / banco de dados

Hoje cada aparelho guarda o progresso localmente (localStorage). Para ranking real,
contas e validação clínica dos ECGs, o código já está isolado nos pontos certos.
Você só troca a implementação, sem mexer nas telas:

| O que quer no servidor | Onde está hoje | Como conectar |
| --- | --- | --- |
| Progresso do aluno (XP, moedas, streak, domínio) | `js/state.js` → `save()` / `load()` | Faça `save()` também dar `POST /api/estado` e `load()` buscar `GET /api/estado` (com fallback local). |
| Registro de cada tentativa (para adaptativo/relatórios) | `js/state.js` → `registrarTentativa()` | Adicione um `fetch('POST /api/tentativa', ...)` no fim da função. O modelo de dados está em `CO-BRANDING-STOP.md`/design. |
| Ranking / Liga STOP | `js/data.js` → `PRQ.RANKING_MOCK` | Troque o array fixo por `GET /api/ranking` e renderize igual em `ranking.html`. |
| Banco de ECGs validados | `js/data.js` → `PRQ.STRIPS` / `PRQ.RHYTHMS` | Carregue de `GET /api/ecgs` (só status "validado") no lugar das tiras sintéticas. |
| Contas / login | onboarding em `js/ui.js` → `garantirPerfil()` | Substitua por um fluxo de login que preencha nome/avatar a partir da sessão. |

Sugestão leve para começar: um backend fino (por exemplo Supabase, Firebase ou uma
API própria em Node) atendendo esses cinco endpoints. As telas não mudam.

## Lembrete clínico

Antes de usar com público real, cada ECG precisa de validação por cardiologista
pediátrico ou instrutor PALS. As tiras atuais são sintéticas, de demonstração.
