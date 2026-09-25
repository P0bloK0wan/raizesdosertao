import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const exists=p=>existsSync(new URL("../"+p,import.meta.url));
const pages=["index.html","historia.html","participar.html","midia.html","campori.html","lava-jato.html","redes.html","login.html","login-unidade.html","login-lideranca.html","painel-lideranca.html","painel-unidade.html","calendario.html","agenda-admin.html"];
test("páginas do site existem",()=>{for(const p of pages)assert.ok(exists(p),p)});
test("páginas retiradas não aparecem no menu",()=>{for(const p of ["agenda.html","unidades.html","aventuras.html","projetos.html"]){assert.ok(!exists(p),p);assert.ok(!read("assets/js/main.js").includes('href: "'+p+'"'),p)}});
test("navegação pública independe do Firebase",()=>{const js=read("assets/js/main.js");assert.ok(!js.includes('from "./store.js"'));assert.match(js,/data-nav-toggle/);assert.match(js,/pageshow/)});
test("páginas públicas têm viewport e entrada de navegação",()=>{for(const p of pages.slice(0,8)){const s=read(p);assert.match(s,/name="viewport"/,p);assert.match(s,/data-site-header/,p)}});
test("referências locais de CSS e JS existem",()=>{for(const p of pages){const s=read(p);for(const m of s.matchAll(/(?:src|href)="(assets\/(?:css|js)\/[^"#?]+\.(?:css|js))(?:\?[^"]*)?"/g))assert.ok(exists(m[1]),p+" -> "+m[1])}});
test("service worker não tenta armazenar arquivos inexistentes",()=>{const sw=read("sw.js");const shell=sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);assert.ok(shell);for(const m of shell[1].matchAll(/"\.\/([^"]+)"/g))assert.ok(exists(m[1]),"cache: "+m[1])});
test("localização oficial disponível em Quero Participar",()=>{assert.ok(read("participar.html").includes("https://maps.app.goo.gl/DDrkQvhriKhxUoJQA"))});
test("calendário interno preservado",()=>{assert.ok(read("painel-lideranca.html").includes("planejamento-clube"))});
test("login e painéis mantidos",()=>{for(const p of ["login-lideranca.html","login-unidade.html","painel-lideranca.html","painel-unidade.html"])assert.ok(exists(p))});
test("menu acessível em todas as larguras",()=>{const css=read("assets/css/nordeste.css");assert.match(css,/v77: um único menu/);assert.match(css,/nav-links\.open/)});

test("álbuns aceitam vídeos sem apagar fotos existentes",()=>{const store=read("assets/js/store.js");const panel=read("assets/js/painel-lideranca.js");const media=read("midia.html");assert.match(store,/adicionarVideosMidia/);assert.match(panel,/enviarVideoCloudinary/);assert.match(media,/videosValidos/);assert.match(media,/playsInline/)});

test("galeria: prévia e botão de reprodução acessível",()=>{const s=read("midia.html");assert.match(s,/midia-video-assistir/);assert.match(s,/baixarVideo/);assert.match(s,/pararVideos/);assert.match(s,/IntersectionObserver/)});
test("acréscimos de fotos e vídeos são atômicos",()=>{const s=read("assets/js/store.js");const p=read("assets/js/painel-lideranca.js");assert.match(s,/arrayUnion/);assert.match(p,/acrescentarFotosMidia/);assert.match(p,/acrescentarVideosMidia/)});
test("painéis usam CSS atual",()=>{for(const p of ["painel-lideranca.html","painel-unidade.html"])assert.ok(read(p).includes("nordeste.css?v=85"),p)});
test("módulos JavaScript passam na verificação de sintaxe",()=>{for(const p of readdirSync(new URL("../assets/js/",import.meta.url)).filter(x=>x.endsWith(".js"))){const result=spawnSync(process.execPath,["--check",new URL("../assets/js/"+p,import.meta.url).pathname],{encoding:"utf8"});assert.equal(result.status,0,p+": "+result.stderr)}});

// Regressões do agendamento público (sem Firebase em produção).
test("lava-jato não oferece Pix automático sem backend",()=>{const s=read("lava-jato.html");assert.ok(!/pagar agora com pix|mercado pago/i.test(s));assert.ok(s.includes("pague no dia da lavagem"))});
test("lava-jato valida placa, evita duplo envio e não injeta motivo da agenda como HTML",()=>{const s=read("lava-jato.html");assert.match(s,/btn\.disabled = true/);assert.match(s,/\^\[A-Z\]/);assert.match(s,/motivo\.textContent = s\.motivo/);assert.match(s,/rsProximosDomingos\(8\)/)});
test("datas de domingos usam calendário local, sem conversão UTC",()=>{const s=read("assets/js/data.js");assert.match(s,/rsDataLocalISO/);assert.ok(!s.includes("toISOString().slice(0, 10)"))});

// Recursos públicos adicionados na versão 89.
test("galeria tem busca, filtros, compartilhamento e apresentação",()=>{const html=read("midia.html");for(const id of ["rs-album-search","rs-album-type","rs-album-year","rs-share-album","rs-slideshow"])assert.ok(html.includes(id),id);assert.match(html,/new URLSearchParams\(location.search\)/);assert.match(html,/video\.controls=true/)});
test("páginas públicas carregam estilos responsivos",()=>{for(const p of ["index.html","historia.html","participar.html","midia.html","campori.html","lava-jato.html","redes.html"])assert.ok(read(p).includes("assets/css/publico.css"),p)});
test("acessibilidade pública, navegação rápida e fallback sem IntersectionObserver",()=>{const js=read("assets/js/main.js");for(const id of ["rs-font-minus","rs-font-plus","rs-contrast","rs-top","rs-bottom-nav"])assert.ok(js.includes(id),id);assert.ok(js.includes('"IntersectionObserver" in window'))});
test("reserva pública continua sem cobrança online",()=>{const html=read("lava-jato.html");assert.match(html,/Sem pagamento online/);assert.ok(!html.includes("Pagar agora com Pix"))});
