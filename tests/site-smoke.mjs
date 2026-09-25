// Execute com: node tests/site-smoke.mjs
// Verificações estáticas, sem alterar o Firestore nem depender de credenciais.
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['index.html','historia.html','agenda.html','unidades.html','aventuras.html','projetos.html','participar.html','midia.html','campori.html','lava-jato.html','redes.html'];
for(const p of pages){
  assert.ok(existsSync(new URL('../'+p,import.meta.url)),p+' ausente');
  const html=read(p);
  assert.match(html,/<title>[^<]+<\/title>/,p+' sem título');
  assert.match(html,/<meta name="viewport"/,p+' sem viewport');
  assert.match(html,/data-site-header/,p+' sem cabeçalho');
  assert.match(html,/data-site-footer/,p+' sem rodapé');
}
const nav=read('assets/js/main.js');
for(const p of ['agenda.html','unidades.html','aventuras.html','projetos.html','participar.html'])assert.ok(nav.includes(p),'navegação sem '+p);
const sw=read('sw.js');
for(const p of [...pages,'assets/css/publico.css'])assert.ok(sw.includes('"./'+p+'"'),'cache sem '+p);
assert.match(read('assets/js/store.js'),/runTransaction\(db, async tx =>/,'importação sem transação');
assert.doesNotMatch(read('assets/js/painel-unidade.js'),/queueMicrotask\(\(\)=>importarNomesConfirmados/,'importação automática inesperada');
assert.match(read('assets/js/painel-unidade.js'),/requisitos-membro-select/,'seletor de requisitos ausente');
assert.match(read('assets/js/painel-unidade.js'),/especialidades-membro-select/,'seletor de especialidades ausente');
assert.match(read('assets/js/painel-unidade.js'),/materiais-membro-select/,'seletor de materiais ausente');
console.log('PASS: '+pages.length+' páginas, navegação, cache e verificações dos painéis.');

/* Regressões de navegação, página inicial e PWA. */
const home=read('index.html');
assert.equal(home.split('href="assets/css/publico.css"').length-1,1,'CSS público duplicado');
assert.equal(home.split('class="public-links"').length-1,1,'vitrines públicas duplicadas');
const shell=read('sw.js');
const cached=shell.split(String.fromCharCode(10)).filter(line=>line.trim().startsWith('"./')).map(line=>line.trim().split('"')[1].slice(2));
assert.equal(new Set(cached).size,cached.length,'arquivos repetidos no cache');
for(const p of cached)assert.ok(existsSync(new URL('../'+p,import.meta.url)),'cache aponta para arquivo ausente: '+p);
console.log('PASS: vitrine única, CSS e cache sem duplicações.');
