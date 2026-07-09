/* Empacota o site inteiro num único HTML autocontido (demo/pals-rhythm-quest.html).
   As páginas viram <template> e um roteador leve intercepta os links .html.
   Uso: node tools/build-single.mjs [--artifact saida.html]
   Com --artifact, gera também uma variante sem <head> e sem fontes externas
   (para hospedagens com CSP restrito). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const PAGES = ['index.html', 'modos.html', 'partida.html', 'dashboard.html',
  'ranking.html', 'emblemas.html', 'biblioteca.html'];

const css = read('css/style.css');
const core = ['js/data.js', 'js/ecg.js', 'js/state.js', 'js/ui.js', 'js/game.js']
  .map(read).join('\n;\n');

const templates = [];
const inits = [];
for (const page of PAGES) {
  const html = read(page);
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
  // conteúdo estático: tudo antes do primeiro <script src=
  const staticPart = body.split(/<script src=/)[0].trim();
  // script da página: último bloco <script> inline
  const inline = [...body.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop();
  templates.push(`<template data-page="${page}">\n${staticPart}\n</template>`);
  inits.push(`'${page}': function () {\n${inline ? inline[1] : ''}\n}`);
}

const router = `
(function () {
  window.PRQ = window.PRQ || {};
  PRQ.route = { page: 'index.html', search: '', hash: '' };
  var SPA_PAGES = {\n${inits.join(',\n')}\n};

  PRQ.nav = function (url) {
    if (PRQ.game && PRQ.game.teardown) PRQ.game.teardown();
    var m = String(url).match(/^([^?#]+)(\\?[^#]*)?(#.*)?$/) || [];
    var page = m[1] || 'index.html';
    if (!SPA_PAGES[page]) page = 'index.html';
    PRQ.route = { page: page, search: m[2] || '', hash: m[3] || '' };
    document.querySelectorAll('.topbar, .bottomnav, #toastwrap, #burstlayer, .modal-backdrop').forEach(function (el) { el.remove(); });
    var tpl = document.querySelector('template[data-page="' + page + '"]');
    var rootEl = document.getElementById('spa-root');
    rootEl.innerHTML = '';
    rootEl.appendChild(tpl.content.cloneNode(true));
    window.scrollTo(0, 0);
    SPA_PAGES[page]();
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:)/.test(href)) return;
    if (/\\.html/.test(href)) { e.preventDefault(); PRQ.nav(href); }
  });

  PRQ.nav('index.html');
})();
`;

const content = `<title>PALS Rhythm Quest</title>
<style>
${css}
</style>
<div id="spa-root"></div>
${templates.join('\n')}
<script>
${core}
;
${router}
</script>`;

const headPart = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#070b10">
<title>PALS Rhythm Quest</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${css}
</style>`;
const bodyPart = `<div id="spa-root"></div>
${templates.join('\n')}
<script>
${core}
;
${router}
</script>`;

const out = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
${headPart}
</head>
<body>
${bodyPart}
</body>
</html>`;

mkdirSync(join(root, 'demo'), { recursive: true });
writeFileSync(join(root, 'demo/pals-rhythm-quest.html'), out);
console.log('gerado: demo/pals-rhythm-quest.html (' + (out.length / 1024).toFixed(0) + ' KB)');

const flagIdx = process.argv.indexOf('--artifact');
if (flagIdx > -1 && process.argv[flagIdx + 1]) {
  writeFileSync(process.argv[flagIdx + 1], content);
  console.log('gerado (variante sem head/fontes): ' + process.argv[flagIdx + 1]);
}
