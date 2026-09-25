// Execute: node tests/smoke.mjs (Node 20+). Sem acesso ao Firebase de produção.
import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const pages=["index.html","historia.html","unidades.html","agenda.html","aventuras.html","projetos.html","participar.html","midia.html","campori.html","lava-jato.html","redes.html","painel-unidade.html","painel-lideranca.html","agenda-admin.html"];
test("todas as páginas públicas e internas existem",()=>{for(const p of pages)assert.ok(existsSync(new URL("../"+p,import.meta.url)),p)});
test("páginas possuem idioma e viewport",()=>{for(const p of pages){const s=read(p);assert.match(s,/<html[^>]+lang="pt-BR"/i,p);assert.match(s,/name="viewport"/i,p)}});
test("agenda pública só exibe eventos publicados",()=>assert.match(read("assets/js/agenda-publica.js"),/publicado\s*===\s*true/));
test("agenda administrativa exige autenticação da liderança",()=>assert.match(read("assets/js/agenda-admin.js"),/exigirSessao\("lideranca"/));
test("Firestore protege edição da agenda pública",()=>{const s=read("firestore.rules");assert.match(s,/match \/eventosPublicos\/\{eventoId\}/);assert.match(s,/allow create, update: if eLideranca\(\)/)});
test("importação não é automática",()=>{const s=read("assets/js/painel-unidade.js");assert.doesNotMatch(s,/queueMicrotask\(\(\)=>importarNomesConfirmados/);assert.match(s,/importarMembroConfirmado/)});
test("cache contém arquivos únicos",()=>{const s=read("sw.js");const a=s.match(/const APP_SHELL = \[([\s\S]*?)\];/);assert.ok(a);const entries=[...a[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);assert.equal(entries.length,new Set(entries).size);for(const p of ["./agenda-admin.html","./assets/js/agenda-admin.js","./agenda.html"])assert.ok(entries.includes(p),p)});
test("JavaScript local compila sem imports remotos",()=>{for(const p of ["assets/js/painel-unidade.js","assets/js/painel-lideranca.js","assets/js/store.js","assets/js/agenda-admin.js","assets/js/agenda-publica.js"]){const s=read(p).replace(/^\s*import[\s\S]*?from\s*["'][^"']+["'];?/gm,"").replace(/^\s*export\s+/gm,"");new vm.Script(s,{filename:p})}});
