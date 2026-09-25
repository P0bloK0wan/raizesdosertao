/* Execute: node --test tests/site-integridade.test.mjs
   Verifica integridade estática sem Firebase e sem alterar dados. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['index.html','historia.html','unidades.html','agenda.html','aventuras.html','projetos.html','participar.html','midia.html','campori.html','lava-jato.html','redes.html'];
test('todas as páginas públicas existem e incluem cabeçalho, rodapé e título',()=>{
 for(const p of pages){assert.ok(existsSync(new URL('../'+p,import.meta.url)),p);const s=read(p);for(const required of ['<title>','data-site-header','data-site-footer'])assert.ok(s.includes(required),p+': '+required)}
});
test('links da navegação apontam para arquivos existentes e não se repetem',()=>{
 const js=read('assets/js/main.js');const nav=js.slice(js.indexOf('const NAV_ITEMS = ['),js.indexOf('];',js.indexOf('const NAV_ITEMS = [')));
 const links=[...nav.matchAll(/href:\s*"([^"]+)"/g)].map(m=>m[1]);
 assert.equal(links.length,new Set(links).size,'links duplicados');
 for(const href of links)assert.ok(existsSync(new URL('../'+href,import.meta.url)),href);
});
test('homepage referencia todas as novas áreas',()=>{
 const home=read('index.html');
 for(const p of ['unidades.html','agenda.html','aventuras.html','projetos.html','participar.html'])assert.ok(home.includes(p),p);
});
test('cache inclui as páginas e os estilos públicos',()=>{
 const sw=read('sw.js');
 for(const p of [...pages,'assets/css/publico.css'])assert.ok(sw.includes('"./'+p+'"'),p);
});
test('nenhuma página pública contém lista de nomes de desbravadores',()=>{
 const roster=read('assets/js/painel-unidade.js');
 assert.ok(roster.includes('NOMES_UNIDADES'));
 for(const p of pages)assert.ok(!read(p).includes('NOMES_UNIDADES'),p);
});
