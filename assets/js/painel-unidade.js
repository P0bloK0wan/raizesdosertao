/* =========================================================
   Painel da Unidade
   ========================================================= */

import { RS_UNIDADES, RS_TOPICOS_PADRAO, RS_PLANEJAMENTO_STATUS } from "./data.js";
import { exigirSessao, logout } from "./auth.js";
import {
  watchMembros, addMembro, deleteMembro,
  watchConselheiros, addConselheiro, deleteConselheiro,
  watchRegistrosMembro, addRegistro, deleteRegistro,
  watchEspecialidadesMembro, addEspecialidade, updateEspecialidade, deleteEspecialidade,
  watchMateriaisMembro, addMaterial, toggleMaterial, deleteMaterial,
  watchPresencas, salvarPresenca, deletePresenca,
  watchPontuacaoAcampamento,
  watchPlanejamentos, addPlanejamento, editarPlanejamento,
  watchNotificacoesUnidade, marcarNotificacoesUnidadeLidas, deleteNotificacaoUnidade,
  criarNotificacaoLideranca,
  watchPedidoSenha, solicitarTrocaSenha,
  watchIdentidadeUnidade,
  verificarDesbloqueio,
  watchAvisos,
} from "./store.js";
import { criarCalendarioClube } from "./calendario-clube.js";
import { mostrarToast, tocarSomNotificacao } from "./main.js";
import { iniciarConvitePwa } from "./pwa-install.js";

exigirSessao("unidade", (sessao) => {
  const unidade = RS_UNIDADES.find((u) => u.id === sessao.unidadeId);
  document.getElementById("quem").textContent = sessao.nome;
  document.getElementById("unidade-nome").textContent = "Unidade " + unidade.nome;
  document.getElementById("mobile-title").textContent = "Unidade " + unidade.nome;
  iniciarPainel(sessao.unidadeId);
  iniciarConvitePwa();
});

document.getElementById("btn-sair").addEventListener("click", logout);

function fmtDataBr(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR");
}
function fmtData(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/* Observa uma subcoleção por-desbravador (registros, especialidades,
   materiais...), adicionando/removendo watchers conforme membros
   são cadastrados/excluídos. */
function criarFanOutPorMembro(unidadeId, watchFn, onChange) {
  const unsubs = new Map();
  const dados = {};
  return {
    dados,
    sincronizar(membros) {
      const idsAtuais = new Set(membros.map((m) => m.id));
      for (const [mid, unsub] of unsubs) {
        if (!idsAtuais.has(mid)) {
          unsub();
          unsubs.delete(mid);
          delete dados[mid];
        }
      }
      membros.forEach((m) => {
        if (unsubs.has(m.id)) return;
        const unsub = watchFn(unidadeId, m.id, (items) => {
          dados[m.id] = items;
          onChange();
        });
        unsubs.set(m.id, unsub);
      });
    },
  };
}

function iniciarPainel(unidadeId) {
  const estado = { membros: [], conselheiros: [], planejamentos: [], notificacoes: [], presencas: [], pontuacao: [] };

  /* Frequência é uma visualização das chamadas existentes, sem duplicar dados. */
  const freqSelect = document.getElementById("freq-membro");
  const freqGrid = document.getElementById("freq-calendario");
  const freqResumo = document.getElementById("freq-resumo");
  const freqDetalhe = document.getElementById("freq-detalhe");
  const freqMesTitulo = document.getElementById("freq-mes");
  let freqMes = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let freqDiaSelecionado = "";
  function freqISO(ano,mes,dia){return ano+"-"+String(mes+1).padStart(2,"0")+"-"+String(dia).padStart(2,"0")}
  function renderFrequencia(){
    const id = freqSelect.value;
    const ano=freqMes.getFullYear(),mes=freqMes.getMonth();
    freqMesTitulo.textContent=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(freqMes);
    const chamadas=new Map(estado.presencas.map(p=>[p.data||p.id,p]));
    const diasNoMes=new Date(ano,mes+1,0).getDate();
    let presentes=0,ausentes=0;
    freqGrid.replaceChildren();
    ["D","S","T","Q","Q","S","S"].forEach(d=>{const el=document.createElement("span");el.className="unidade-freq-dia-semana";el.textContent=d;freqGrid.append(el)});
    for(let n=0;n<new Date(ano,mes,1).getDay();n++){const el=document.createElement("span");el.setAttribute("aria-hidden","true");freqGrid.append(el)}
    for(let dia=1;dia<=diasNoMes;dia++){
      const data=freqISO(ano,mes,dia),chamada=chamadas.get(data);
      const veio=!!chamada&&(chamada.presentes||[]).includes(id);
      const estadoDia=!id?"":chamada?(veio?"freq-presente":"freq-ausente"):(new Date(ano,mes,dia).getDay()===0?"freq-sem":"");
      if(id&&chamada){if(veio)presentes++;else ausentes++}
      const btn=document.createElement("button");btn.type="button";btn.className="unidade-freq-dia "+estadoDia;btn.textContent=String(dia);
      btn.disabled=!id;btn.setAttribute("aria-label",data+": "+(!id?"selecione um desbravador":chamada?(veio?"presente":"ausente"):"sem chamada"));
      btn.setAttribute("aria-pressed",String(freqDiaSelecionado===data));
      btn.addEventListener("click",()=>{freqDiaSelecionado=data;freqDetalhe.textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date(ano,mes,dia))+": "+(chamada?(veio?"Presença registrada.":"Ausência registrada."):"Não há chamada salva neste dia.");renderFrequencia()});
      freqGrid.append(btn);
    }
    const total=presentes+ausentes,porcentagem=total?Math.round(100*presentes/total):0;
    freqResumo.replaceChildren();
    [[presentes,"Presenças"],[ausentes,"Faltas"],[total?porcentagem+"%":"—","Frequência"]].forEach(([numero,rotulo])=>{const card=document.createElement("div"),valor=document.createElement("strong"),label=document.createElement("span");valor.textContent=String(numero);label.textContent=rotulo;card.append(valor,label);freqResumo.append(card)});
    if(!id)freqDetalhe.textContent="Escolha um desbravador para consultar sua frequência.";
    else if(!freqDiaSelecionado)freqDetalhe.textContent="Toque em um dia para consultar a situação. Apenas chamadas salvas entram no cálculo.";
  }
  function atualizarOpcoesFrequencia(){
    const anterior=freqSelect.value;
    freqSelect.replaceChildren();
    const vazio=document.createElement("option");vazio.value="";vazio.textContent="Selecione um desbravador";freqSelect.append(vazio);
    estado.membros.forEach(m=>{const op=document.createElement("option");op.value=m.id;op.textContent=m.nome||"Sem nome";freqSelect.append(op)});
    if(estado.membros.some(m=>m.id===anterior))freqSelect.value=anterior;
    renderFrequencia();
  }
  freqSelect.addEventListener("change",()=>{freqDiaSelecionado="";renderFrequencia()});
  document.getElementById("freq-anterior").addEventListener("click",()=>{freqMes=new Date(freqMes.getFullYear(),freqMes.getMonth()-1,1);freqDiaSelecionado="";renderFrequencia()});
  document.getElementById("freq-proximo").addEventListener("click",()=>{freqMes=new Date(freqMes.getFullYear(),freqMes.getMonth()+1,1);freqDiaSelecionado="";renderFrequencia()});
  renderFrequencia();
  const abertosRequisitos = new Set();
  const abertosEspecialidades = new Set();
  const abertosMateriais = new Set();

  const nomeUnidade = (RS_UNIDADES.find((u) => u.id === unidadeId) || {}).nome || unidadeId;

  /* Avisa a liderança (sino de notificações dela) de qualquer alteração
     que a unidade fizer no próprio painel. */
  function avisarLideranca(mensagem) {
    criarNotificacaoLideranca({ tipo: "unidade_alterou", mensagem: `${nomeUnidade}: ${mensagem}`, unidadeId });
  }

  /* Excluir desbravador/conselheiro exige uma senha temporária de 24h
     gerada pela liderança. Uma vez validada, fica guardada no localStorage
     (só conveniência — quem garante o limite de 24h de verdade é a regra
     do Firestore) até expirar, sem precisar digitar de novo. */
  async function pedirDesbloqueioSeNecessario() {
    const chaveCache = `rs_desbloqueio_${unidadeId}`;
    const validoAte = localStorage.getItem(chaveCache);
    if (validoAte && new Date(validoAte) > new Date()) return true;

    const codigo = prompt(
      "Excluir um desbravador ou conselheiro exige uma senha temporária da diretoria (válida por 24h). Peça a senha à liderança e digite aqui:"
    );
    if (!codigo) return false;
    const expiraEm = await verificarDesbloqueio(unidadeId, codigo.trim());
    if (!expiraEm) {
      mostrarToast("Senha inválida ou expirada.");
      return false;
    }
    localStorage.setItem(chaveCache, expiraEm.toISOString());
    return true;
  }

  const fanOutRegistros = criarFanOutPorMembro(unidadeId, watchRegistrosMembro, () => { renderRequisitos(); renderStats(); });
  const fanOutEspecialidades = criarFanOutPorMembro(unidadeId, watchEspecialidadesMembro, () => { renderEspecialidades(); renderStats(); });
  const fanOutMateriais = criarFanOutPorMembro(unidadeId, watchMateriaisMembro, () => { renderMateriais(); });

  watchMembros(unidadeId, (membros) => {
    estado.membros = membros;
    fanOutRegistros.sincronizar(membros);
    fanOutEspecialidades.sincronizar(membros);
    fanOutMateriais.sincronizar(membros);

    renderMembros();
    atualizarOpcoesFrequencia();
    renderChamadaAtual();
    renderHistoricoPresencas();
    renderFrequencia();
    renderRequisitos();
    renderEspecialidades();
    renderMateriais();
    renderStats();
  });

  /* Nomes confirmados pela direção. Importação manual, idempotente e sem criar contas. */
  const NOMES_UNIDADES={"carcara":["ADRIEL LUCAS DUARTE DA SILVA","ADRYAN LEVI GONÇALVES DOS SANTOS","ANDRÉ GABRIEL DOS ANJOS RODRIGUES","BERNARDO LEVI CARVALHO SILVA","GUSTAVO DIMAS DA SILVA","JOÃO MIGUEL SANTOS BARROS","LUCAS GABRIEL DE LIMA SANTOS","NEEMIAS ALBANO FURTADO","PAULO DAVI AMARAL DOS SANTOS","PEDRO ARTHUR FERREIRA DOS SANTOS FERRAZ"],"tarantula":["ANTONIO EDUARDO RIBEIRO ALVES","ARTHUR OLIVEIRA SANTOS","ERIK FELIPE DE SOUZA SANTOS","IAN BARROS AZEVEDO","JOÃO PEDRO CORDEIRO FEITOSA","JOÃO PEDRO GOMES CARNEIRO","JONATAS RIAN DA SILVA SOUSA","LUIZ HENRIQUE RODRIQUES ALVES","NICKOLLAS TAYLLOR TORRES DELMONDES","PEDRO HENRIQUE DE BARROS TORRES","PEDRO RYAN FARIAS CAVALCANTE","PIETRO ALEXANDER TENORIO BANDEIRA"],"raposa":["ADELLE SOFIA DA SILVA SOUSA","AYLA BARROS AZEVEDO","BRIZA LETÍCIA FERREIRA LINO","HELOÍSA RIBEIRO AZEVEDO DE SOUZA","JANINE OLIVEIRA SILVA","LARA EMYLLY PEREIRA ARAÚJO","NARA BELLY TORRES DELMONDES","REBECA NOGUEIRA PEDROZA"],"beijaflor":["ALICE APARECIDA AMARAL DOS SANTOS","ALICIA MEDRADO GOMES","IANDRA ALVES RODRIGUES","MARIA JÚLIA GIL BARBOSA","NANDA VALÉRIA FERREIRA LINO"],"andorinha":["ANNY GABRIELA NUNES RIBEIRO","LORENA SOUZA COSTA","YASMIM DE SOUZA ARAUJO"]};
  const normalizarNome=nome=>String(nome||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim().toLocaleUpperCase("pt-BR");
  const btnImportar=document.getElementById("btn-importar-membros");
  const statusImportar=document.getElementById("importacao-membros-status");
  btnImportar.addEventListener("click",async()=>{
    const nomes=NOMES_UNIDADES[unidadeId]||[];
    const existentes=new Set(estado.membros.map(m=>normalizarNome(m.nome)));
    const pendentes=nomes.filter(nome=>!existentes.has(normalizarNome(nome)));
    if(!pendentes.length){statusImportar.hidden=false;statusImportar.textContent="Todos os nomes confirmados desta unidade já constam no cadastro.";return}
    if(!confirm("Adicionar "+pendentes.length+" desbravador(es) à unidade "+nomeUnidade+"? Somente nomes serão preenchidos; os demais dados poderão ser completados depois."))return;
    btnImportar.disabled=true;statusImportar.hidden=false;
    let adicionados=0;const falhas=[];
    for(const nome of pendentes){
      try{await addMembro(unidadeId,{nome,nascimento:"",idade:null,classe:"",tipoSanguineo:"",responsavel:"",parentesco:"",telefone:"",responsavel2Nome:"",responsavel2Telefone:"",observacoesResponsavel:""});adicionados++}
      catch(err){falhas.push(nome);console.error("Falha ao adicionar membro",err)}
    }
    statusImportar.textContent=adicionados+" nome(s) adicionado(s). "+(falhas.length?falhas.length+" não foram salvos; tente novamente.":"Complete os dados pessoais nos cadastros quando necessário.");
    btnImportar.disabled=false;
    if(adicionados)avisarLideranca("importou "+adicionados+" desbravador(es) para o cadastro da unidade.");
  });

  /* ---------------- Membros ---------------- */
  /* A lista mostra só nome e classe. Os dados pessoais aparecem apenas no perfil aberto. */
  let membroSelecionado = null;
  const buscaMembros = document.getElementById("busca-membros");
  buscaMembros.addEventListener("input", renderMembros);
  function textoSeguro(v) { return String(v ?? "—"); }
  function renderMembros() {
    const cards = document.getElementById("cards-membros");
    const perfil = document.getElementById("perfil-membro");
    const vazio = document.getElementById("membros-vazio");
    const termo = buscaMembros.value.trim().toLocaleLowerCase("pt-BR");
    const filtrados = estado.membros.filter(m => (m.nome || "").toLocaleLowerCase("pt-BR").includes(termo));
    document.getElementById("contagem-membros").textContent = filtrados.length + (filtrados.length === 1 ? " desbravador" : " desbravadores");
    vazio.style.display = estado.membros.length ? "none" : "block";
    cards.replaceChildren();
    filtrados.forEach(m => {
      const botao = document.createElement("button");
      botao.type = "button"; botao.className = "unidade-membro-card";
      const avatar = document.createElement("span"); avatar.className = "unidade-membro-avatar";
      avatar.textContent = "👤"; avatar.setAttribute("aria-hidden", "true");
      const info = document.createElement("span"); info.className = "unidade-membro-info";
      const nome = document.createElement("strong"); nome.textContent = m.nome || "Sem nome";
      const classe = document.createElement("small"); classe.textContent = m.classe || "Classe não informada";
      info.append(nome, classe);
      const seta = document.createElement("span"); seta.className = "unidade-membro-seta"; seta.textContent = "›"; seta.setAttribute("aria-hidden","true");
      botao.append(avatar,info,seta);
      botao.addEventListener("click", () => { membroSelecionado = m.id; renderMembros(); perfil.scrollIntoView({block:"start",behavior:"smooth"}); });
      cards.append(botao);
    });
    const m = estado.membros.find(item => item.id === membroSelecionado);
    if (!m || (termo && !filtrados.some(item => item.id === m.id))) {
      membroSelecionado = null; perfil.hidden = true; cards.hidden = false; perfil.replaceChildren(); return;
    }
    cards.hidden = true; perfil.hidden = false; perfil.replaceChildren();
    const voltar = document.createElement("button"); voltar.type = "button"; voltar.className = "btn btn-outline btn-sm";
    voltar.textContent = "← Voltar aos desbravadores";
    voltar.addEventListener("click", () => { membroSelecionado = null; renderMembros(); });
    const cab = document.createElement("div"); cab.className = "unidade-perfil-cabecalho";
    const avatar = document.createElement("span"); avatar.className = "unidade-membro-avatar"; avatar.textContent = "👤"; avatar.setAttribute("aria-hidden", "true");
    const nome = document.createElement("h3"); nome.textContent = m.nome || "Sem nome"; cab.append(avatar,nome);
    const dados = document.createElement("div"); dados.className = "unidade-perfil-dados";
    [["Classe",m.classe],["Nascimento",m.nascimento ? fmtDataBr(m.nascimento) : "—"],["Idade",m.idade],["Responsável",m.responsavel],["Parentesco",m.parentesco],["Telefone",m.telefone],["Segundo responsável",m.responsavel2Nome],["Telefone adicional",m.responsavel2Telefone],["Tipo sanguíneo",m.tipoSanguineo],["Observações",m.observacoesResponsavel]].forEach(([rotulo,valor]) => {
      const campo = document.createElement("div"); campo.className = "unidade-perfil-dado";
      const label = document.createElement("small"); label.textContent = rotulo;
      const conteudo = document.createElement("strong"); conteudo.textContent = textoSeguro(valor);
      campo.append(label,conteudo); dados.append(campo);
    });
    const acoes = document.createElement("div"); acoes.className = "unidade-perfil-acoes";
    const compras = document.createElement("button"); compras.type = "button"; compras.className = "btn btn-outline btn-sm"; compras.textContent = "🛒 Ver materiais";
    compras.addEventListener("click", () => { location.hash = "materiais"; });
    const excluir = document.createElement("button"); excluir.type = "button"; excluir.className = "danger"; excluir.textContent = "Excluir cadastro";
    excluir.addEventListener("click", async () => {
      if (!(await pedirDesbloqueioSeNecessario())) return;
      if (!confirm("Excluir este desbravador? Todo o histórico dele também será perdido.")) return;
      await deleteMembro(unidadeId,m.id);
      membroSelecionado = null;
      avisarLideranca('excluiu o desbravador "' + (m.nome || m.id) + '".');
      mostrarToast("Desbravador removido.");
    });
    const requisitos = document.createElement("button"); requisitos.type="button"; requisitos.className="btn btn-outline btn-sm"; requisitos.textContent="📚 Ver requisitos"; requisitos.addEventListener("click",()=>{location.hash="topicos";});
    const especialidades = document.createElement("button"); especialidades.type="button"; especialidades.className="btn btn-outline btn-sm"; especialidades.textContent="🎖️ Ver especialidades"; especialidades.addEventListener("click",()=>{location.hash="especialidades";});
    acoes.prepend(requisitos,especialidades);
    acoes.append(compras,excluir); perfil.append(voltar,cab,dados,acoes);
  }

  const modalMembro=document.getElementById("modal-membro"),formMembro=document.getElementById("form-membro");
  const cm=id=>document.getElementById(id),passos=[...formMembro.querySelectorAll("[data-passo]")];
  let passoCadastro=0,salvandoCadastro=false;
  function idadeCadastro(v){if(!v)return null;const [a,m,d]=v.split("-").map(Number),dt=new Date(a,m-1,d),hoje=new Date();if(dt.getFullYear()!==a||dt.getMonth()!==m-1||dt.getDate()!==d||dt>hoje)return null;return hoje.getFullYear()-a-(hoje.getMonth()<m-1||(hoje.getMonth()===m-1&&hoje.getDate()<d)?1:0)}
  cm("m-nascimento").addEventListener("change",()=>{const idade=idadeCadastro(cm("m-nascimento").value);cm("m-idade").value=idade===null?"":idade;cm("m-idade").readOnly=idade!==null});
  function etapaCadastro(n){
    passoCadastro=Math.max(0,Math.min(2,n));passos.forEach((p,i)=>p.hidden=i!==passoCadastro);
    document.querySelectorAll("#modal-membro .cadastro-passos i").forEach((p,i)=>p.classList.toggle("ativo",i<=passoCadastro));
    cm("cadastro-etapa-texto").textContent="Etapa "+(passoCadastro+1)+" de 3 · "+["Dados pessoais","Responsáveis","Revisão"][passoCadastro];
    cm("cadastro-voltar").hidden=passoCadastro===0;cm("cadastro-proximo").hidden=passoCadastro===2;cm("cadastro-salvar").hidden=passoCadastro!==2;cm("cadastro-erro").hidden=true;
    if(passoCadastro===2){const box=cm("cadastro-revisao");box.replaceChildren();[["Nome","m-nome"],["Nascimento","m-nascimento"],["Idade","m-idade"],["Classe","m-classe"],["Responsável","m-responsavel"],["Parentesco","m-parentesco"],["Telefone","m-telefone"],["Segundo responsável","m-responsavel2"],["Telefone adicional","m-telefone2"]].forEach(([label,id])=>{const row=document.createElement("div"),a=document.createElement("span"),b=document.createElement("strong");a.textContent=label;b.textContent=cm(id).value||"Não informado";row.append(a,b);box.append(row)})}
  }
  function validaCadastro(n){
    for(const el of passos[n].querySelectorAll("input,select,textarea"))if(!el.checkValidity()){cm("cadastro-erro").textContent="Preencha ou corrija os campos desta etapa.";cm("cadastro-erro").hidden=false;el.focus();return false}
    if(n===0&&cm("m-nascimento").value&&idadeCadastro(cm("m-nascimento").value)===null){cm("cadastro-erro").textContent="Data de nascimento inválida.";cm("cadastro-erro").hidden=false;return false}
    if(n===1)for(const id of ["m-telefone","m-telefone2"]){const el=cm(id);if(el.value.trim()&&el.value.replace(/[^0-9]/g,"").length<10){if(id==="m-telefone2")cm("cadastro-segundo").open=true;cm("cadastro-erro").textContent="Informe o telefone com DDD.";cm("cadastro-erro").hidden=false;el.focus();return false}}
    cm("cadastro-erro").hidden=true;return true;
  }
  function fecharCadastro(){if(!salvandoCadastro)modalMembro.classList.remove("show")}
  cm("btn-novo-membro").addEventListener("click",()=>{formMembro.reset();cm("m-idade").readOnly=false;cm("cadastro-segundo").open=false;etapaCadastro(0);modalMembro.classList.add("show")});
  cm("btn-cancelar-membro").addEventListener("click",fecharCadastro);cm("cadastro-fechar").addEventListener("click",fecharCadastro);
  cm("cadastro-voltar").addEventListener("click",()=>etapaCadastro(passoCadastro-1));
  cm("cadastro-proximo").addEventListener("click",()=>{if(validaCadastro(passoCadastro))etapaCadastro(passoCadastro+1)});
  formMembro.addEventListener("submit",async e=>{
    e.preventDefault();if(salvandoCadastro)return;
    for(let n=0;n<3;n++)if(!validaCadastro(n)){etapaCadastro(n);validaCadastro(n);return}
    const nome=cm("m-nome").value.trim(),outro=cm("cadastro-salvar-outro").checked;
    salvandoCadastro=true;cm("cadastro-salvar").disabled=true;
    try{
      await addMembro(unidadeId,{nome,nascimento:cm("m-nascimento").value,idade:cm("m-idade").value?Number(cm("m-idade").value):null,classe:cm("m-classe").value,tipoSanguineo:cm("m-tipo-sanguineo").value,responsavel:cm("m-responsavel").value.trim(),parentesco:cm("m-parentesco").value.trim(),telefone:cm("m-telefone").value.trim(),responsavel2Nome:cm("m-responsavel2").value.trim(),responsavel2Telefone:cm("m-telefone2").value.trim(),observacoesResponsavel:cm("m-observacoes-responsavel").value.trim()});
      formMembro.reset();cm("m-idade").readOnly=false;cm("cadastro-segundo").open=false;if(outro)etapaCadastro(0);else modalMembro.classList.remove("show");
      avisarLideranca('cadastrou o desbravador "'+nome+'".');mostrarToast("Desbravador cadastrado.");
    }catch(err){cm("cadastro-erro").textContent="Não foi possível salvar. Tente novamente.";cm("cadastro-erro").hidden=false;console.error(err)}
    finally{salvandoCadastro=false;cm("cadastro-salvar").disabled=false}
  });

  /* ---------------- Conselheiros ---------------- */
  watchConselheiros(unidadeId, (conselheiros) => {
    estado.conselheiros = conselheiros;
    renderConselheiros();
  });

  function renderConselheiros() {
    const tbody = document.getElementById("tbody-conselheiros");
    const vazio = document.getElementById("conselheiros-vazio");
    vazio.style.display = estado.conselheiros.length ? "none" : "block";

    tbody.innerHTML = estado.conselheiros
      .map(
        (c) => `<tr>
        <td>${c.nome}</td>
        <td>${c.idade ?? "—"}</td>
        <td>${c.telefone || "—"}</td>
        <td class="row-actions"><button class="danger" data-del-cs="${c.id}">Excluir</button></td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-del-cs]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const c = estado.conselheiros.find((x) => x.id === btn.dataset.delCs);
        if (!(await pedirDesbloqueioSeNecessario())) return;
        if (!confirm("Excluir este conselheiro?")) return;
        await deleteConselheiro(unidadeId, btn.dataset.delCs);
        avisarLideranca(`excluiu o conselheiro "${c ? c.nome : btn.dataset.delCs}".`);
        mostrarToast("Conselheiro removido.");
      })
    );
  }

  const modalConselheiro = document.getElementById("modal-conselheiro");
  document.getElementById("btn-novo-conselheiro").addEventListener("click", () => modalConselheiro.classList.add("show"));
  document.getElementById("btn-cancelar-conselheiro").addEventListener("click", () => modalConselheiro.classList.remove("show"));
  document.getElementById("form-conselheiro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nomeCs = document.getElementById("cs-nome").value.trim();
    await addConselheiro(unidadeId, {
      nome: nomeCs,
      idade: document.getElementById("cs-idade").value ? Number(document.getElementById("cs-idade").value) : null,
      telefone: document.getElementById("cs-telefone").value.trim(),
    });
    modalConselheiro.classList.remove("show");
    e.target.reset();
    avisarLideranca(`cadastrou o conselheiro "${nomeCs}".`);
    mostrarToast("Conselheiro cadastrado.");
  });

  /* ---------------- Presença / chamada por reunião ---------------- */
  watchPresencas(unidadeId, (presencas) => {
    estado.presencas = presencas;
    renderChamadaAtual();
    renderHistoricoPresencas();
  });

  const inputDataChamada = document.getElementById("pr-data");
  /* Datas locais: evita o deslocamento de um dia causado por UTC. */
  function dataLocalISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
  }
  function ultimoDomingo(data = new Date()) {
    const domingo = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    domingo.setDate(domingo.getDate() - domingo.getDay());
    return domingo;
  }
  inputDataChamada.value = dataLocalISO(ultimoDomingo());
  inputDataChamada.addEventListener("change", renderChamadaAtual);
  function navegarDomingo(direcao) {
    const atual = inputDataChamada.value
      ? new Date(inputDataChamada.value + "T12:00:00")
      : ultimoDomingo();
    const domingo = ultimoDomingo(atual);
    domingo.setDate(domingo.getDate() + 7 * direcao);
    inputDataChamada.value = dataLocalISO(domingo);
    renderChamadaAtual();
  }
  document.getElementById("domingo-anterior").addEventListener("click", () => navegarDomingo(-1));
  document.getElementById("domingo-proximo").addEventListener("click", () => navegarDomingo(1));

  function atualizarContagemChamada() {
    const checks = [...document.querySelectorAll("#lista-chamada input[data-presente]")];
    const total = checks.length, presentes = checks.filter(c => c.checked).length;
    const contagem = document.getElementById("chamada-contagem");
    if (contagem) contagem.textContent = presentes + " presentes · " + (total - presentes) + " ausentes";
  }
  function renderChamadaAtual() {
    const wrap = document.getElementById("lista-chamada");
    const vazio = document.getElementById("chamada-vazio");
    if (!wrap) return;
    vazio.style.display = estado.membros.length ? "none" : "block";
    const existente = estado.presencas.find(p => p.id === inputDataChamada.value);
    const presentesAtuais = new Set(existente ? existente.presentes : []);
    wrap.replaceChildren();
    estado.membros.forEach(m => {
      const linha = document.createElement("label"); linha.className = "unidade-chamada-card";
      const avatar = document.createElement("span"); avatar.className = "unidade-membro-avatar";
      avatar.textContent = "👤"; avatar.setAttribute("aria-hidden", "true");
      const nome = document.createElement("span"); nome.className = "unidade-chamada-nome"; nome.textContent = m.nome || "Sem nome";
      const check = document.createElement("input"); check.type = "checkbox"; check.dataset.presente = m.id;
      check.checked = presentesAtuais.has(m.id); check.addEventListener("change", () => {
        linha.classList.toggle("is-present",check.checked); atualizarContagemChamada();
      });
      const status = document.createElement("span"); status.className = "unidade-chamada-status"; status.textContent = "Presente";
      linha.classList.toggle("is-present",check.checked);
      linha.append(avatar,nome,check,status);wrap.append(linha);
    });
    atualizarContagemChamada();
  }
  document.getElementById("btn-marcar-todos").addEventListener("click", () => {
    document.querySelectorAll("#lista-chamada input[data-presente]").forEach(c => {
      c.checked = true; c.closest(".unidade-chamada-card")?.classList.add("is-present");
    }); atualizarContagemChamada();
  });
  document.getElementById("btn-limpar-chamada").addEventListener("click", () => {
    document.querySelectorAll("#lista-chamada input[data-presente]").forEach(c => {
      c.checked = false; c.closest(".unidade-chamada-card")?.classList.remove("is-present");
    }); atualizarContagemChamada();
  });

  document.getElementById("btn-salvar-presenca").addEventListener("click", async () => {
    const data = inputDataChamada.value;
    if (!data) { mostrarToast("Escolha uma data."); return; }
    const presentes = Array.from(document.querySelectorAll("#lista-chamada input:checked")).map((el) => el.dataset.presente);
    await salvarPresenca(unidadeId, data, presentes);
    avisarLideranca(`fez a chamada de ${fmtDataBr(data)} (${presentes.length} de ${estado.membros.length} presentes).`);
    mostrarToast("Chamada salva.");
  });

  function renderHistoricoPresencas() {
    const tbody = document.getElementById("tbody-presencas");
    const vazio = document.getElementById("presencas-vazio");
    if (!tbody) return;
    vazio.style.display = estado.presencas.length ? "none" : "block";
    tbody.innerHTML = estado.presencas
      .map(
        (p) => `<tr>
          <td>${fmtDataBr(p.data)}</td>
          <td>${(p.presentes || []).length} de ${estado.membros.length}</td>
          <td class="row-actions"><button class="danger" data-del-presenca="${p.id}">Excluir</button></td>
        </tr>`
      )
      .join("");
    tbody.querySelectorAll("[data-del-presenca]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const p = estado.presencas.find((x) => x.id === btn.dataset.delPresenca);
        if (!confirm("Excluir esta chamada?")) return;
        await deletePresenca(unidadeId, btn.dataset.delPresenca);
        avisarLideranca(`excluiu a chamada de ${fmtDataBr(p ? p.data : "")}.`);
        mostrarToast("Chamada removida.");
      })
    );
  }

  /* ---------------- Placar do Acampamento (só leitura) ---------------- */
  watchPontuacaoAcampamento((lancamentos) => {
    estado.pontuacao = lancamentos;
    renderPlacar();
  });

  function renderPlacar() {
    const ranking = document.getElementById("placar-ranking");
    const historico = document.getElementById("placar-historico");
    if (!ranking) return;
    const totais = RS_UNIDADES.map((u) => {
      const doUnidade = estado.pontuacao.filter((l) => l.unidadeId === u.id);
      const total = doUnidade.reduce((soma, l) => soma + (l.tipo === "perdeu" ? -l.pontos : l.pontos), 0);
      return { ...u, total };
    }).sort((a, b) => b.total - a.total);

    ranking.innerHTML = totais
      .map(
        (u, i) => `<div class="placar-linha ${u.id === unidadeId ? "placar-minha" : ""}">
          <span class="placar-pos">${i + 1}º</span>
          <span class="placar-nome">${u.nome}${u.id === unidadeId ? " (sua unidade)" : ""}</span>
          <span class="placar-pontos">${u.total} pts</span>
        </div>`
      )
      .join("");

    historico.innerHTML = estado.pontuacao.length
      ? estado.pontuacao
          .map((l) => {
            const nomeUnidade = RS_UNIDADES.find((u) => u.id === l.unidadeId)?.nome || l.unidadeId;
            return `<div class="placar-log-item">
              <span class="pill ${l.tipo === "perdeu" ? "pill-closed" : "pill-open"}">${l.tipo === "perdeu" ? "−" : "+"}${l.pontos} — ${nomeUnidade}</span>
              ${l.motivo ? `<span class="muted">${l.motivo}</span>` : ""}
            </div>`;
          })
          .join("")
      : `<div class="empty-state">Nenhum lançamento ainda.</div>`;
  }

  /* ---------------- Requisitos: histórico individual por desbravador ---------------- */
  function renderRequisitos() {
    const wrap = document.getElementById("lista-requisitos");
    const vazio = document.getElementById("requisitos-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const regs = fanOutRegistros.dados[m.id] || [];
        const linhas = regs
          .map(
            (r) => `<li data-reg="${r.id}">
              <span class="rg-criterio">${r.criterio}</span>
              <span class="rg-data">${fmtDataBr(r.data)}</span>
              <button data-del-registro="${m.id}:${r.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
            </li>`
          )
          .join("");
        return `
        <details class="month-acc" data-membro-acc="${m.id}"${abertosRequisitos.has(m.id) ? " open" : ""}>
          <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${regs.length} registro(s))</span></summary>
          <div class="unidade-acc-conteudo">
            <ul class="registro-list">${linhas || "<li class='muted' style='border:none;'>Nenhum registro lançado ainda.</li>"}</ul>
            <form class="registro-add-form" data-form-registro="${m.id}">
              <div class="field">
                <label>Requisito</label>
                <select class="rg-criterio-select">
                  ${RS_TOPICOS_PADRAO.map((t) => `<option value="${t}">${t}</option>`).join("")}
                  <option value="__outro">Outro...</option>
                </select>
              </div>
              <div class="field rg-outro-wrap" style="display:none;">
                <label>Qual?</label>
                <input type="text" class="rg-outro-input" placeholder="Nome do requisito">
              </div>
              <div class="field">
                <label>Data</label>
                <input type="date" class="rg-data-input" value="${hojeISO()}" required>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </details>`;
      })
      .join("");

    wrap.querySelectorAll("[data-membro-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) abertosRequisitos.add(det.dataset.membroAcc);
        else abertosRequisitos.delete(det.dataset.membroAcc);
      })
    );

    wrap.querySelectorAll("[data-del-registro]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, rid] = btn.dataset.delRegistro.split(":");
        const m = estado.membros.find((x) => x.id === mid);
        if (!confirm("Excluir este registro?")) return;
        await deleteRegistro(unidadeId, mid, rid);
        avisarLideranca(`excluiu um registro de requisito de ${m ? m.nome : mid}.`);
        mostrarToast("Registro removido.");
      })
    );

    wrap.querySelectorAll("[data-form-registro]").forEach((form) => {
      const select = form.querySelector(".rg-criterio-select");
      const outroWrap = form.querySelector(".rg-outro-wrap");
      const outroInput = form.querySelector(".rg-outro-input");
      select.addEventListener("change", () => {
        outroWrap.style.display = select.value === "__outro" ? "block" : "none";
      });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const membroId = form.dataset.formRegistro;
        const criterio = select.value === "__outro" ? outroInput.value.trim() : select.value;
        const data = form.querySelector(".rg-data-input").value;
        if (!criterio || !data) return;
        await addRegistro(unidadeId, membroId, { criterio, data });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`lançou o requisito "${criterio}" pra ${m ? m.nome : membroId}.`);
        mostrarToast("Registro adicionado.");
      });
    });
  }

  /* ---------------- Especialidades ---------------- */
  function renderEspecialidades() {
    const wrap = document.getElementById("lista-especialidades");
    const vazio = document.getElementById("especialidades-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const lista = fanOutEspecialidades.dados[m.id] || [];
        const itens = lista
          .map(
            (e) => `
          <li class="esp-item" data-esp="${m.id}:${e.id}">
            <div class="esp-linha">
              <input class="esp-nome" value="${e.nome || ""}" placeholder="Nome da especialidade">
              <select class="esp-status">
                <option value="pendente" ${e.status === "pendente" ? "selected" : ""}>Pendente</option>
                <option value="andamento" ${e.status === "andamento" ? "selected" : ""}>Em andamento</option>
                <option value="concluida" ${e.status === "concluida" ? "selected" : ""}>Concluída</option>
              </select>
            </div>
            <div class="esp-linha">
              <input class="esp-instrutor" value="${e.instrutor || ""}" placeholder="Instrutor/responsável">
              <input type="date" class="esp-data-inicio" value="${e.dataInicio || ""}">
            </div>
            <textarea class="esp-concluido" rows="2" placeholder="O que já foi concluído">${e.concluido || ""}</textarea>
            <textarea class="esp-falta" rows="2" placeholder="O que ainda falta">${e.falta || ""}</textarea>
            <textarea class="esp-materiais" rows="2" placeholder="Materiais necessários">${e.materiais || ""}</textarea>
            <textarea class="esp-observacoes" rows="2" placeholder="Observações">${e.observacoes || ""}</textarea>
            <div class="esp-linha">
              <button type="button" class="btn btn-outline btn-sm esp-salvar">Salvar alterações</button>
              <button type="button" class="danger" data-del-esp="${m.id}:${e.id}">Excluir</button>
            </div>
          </li>`
          )
          .join("");
        return `
        <details class="month-acc" data-esp-acc="${m.id}"${abertosEspecialidades.has(m.id) ? " open" : ""}>
          <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${lista.length} especialidade(s))</span></summary>
          <div class="unidade-acc-conteudo">
            <ul class="esp-list">${itens || "<li class='muted' style='border:none;'>Nenhuma especialidade cadastrada ainda.</li>"}</ul>
            <form class="registro-add-form" data-form-esp="${m.id}">
              <div class="field"><label>Nova especialidade</label><input type="text" class="esp-nova-nome" placeholder="ex.: Acampamento" required></div>
              <button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </details>`;
      })
      .join("");

    wrap.querySelectorAll("[data-esp-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) abertosEspecialidades.add(det.dataset.espAcc);
        else abertosEspecialidades.delete(det.dataset.espAcc);
      })
    );

    wrap.querySelectorAll("[data-form-esp]").forEach((form) =>
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const membroId = form.dataset.formEsp;
        const nome = form.querySelector(".esp-nova-nome").value.trim();
        if (!nome) return;
        await addEspecialidade(unidadeId, membroId, { nome, status: "pendente", instrutor: "", dataInicio: "", concluido: "", falta: "", materiais: "", observacoes: "" });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`cadastrou a especialidade "${nome}" pra ${m ? m.nome : membroId}.`);
        mostrarToast("Especialidade adicionada.");
      })
    );

    wrap.querySelectorAll("[data-esp]").forEach((li) => {
      const [membroId, espId] = li.dataset.esp.split(":");
      li.querySelector(".esp-salvar").addEventListener("click", async () => {
        const nomeEsp = li.querySelector(".esp-nome").value.trim();
        await updateEspecialidade(unidadeId, membroId, espId, {
          nome: nomeEsp,
          status: li.querySelector(".esp-status").value,
          instrutor: li.querySelector(".esp-instrutor").value.trim(),
          dataInicio: li.querySelector(".esp-data-inicio").value,
          concluido: li.querySelector(".esp-concluido").value.trim(),
          falta: li.querySelector(".esp-falta").value.trim(),
          materiais: li.querySelector(".esp-materiais").value.trim(),
          observacoes: li.querySelector(".esp-observacoes").value.trim(),
        });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`atualizou a especialidade "${nomeEsp}" de ${m ? m.nome : membroId}.`);
        mostrarToast("Especialidade atualizada.");
      });
    });
    wrap.querySelectorAll("[data-del-esp]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, eid] = btn.dataset.delEsp.split(":");
        const m = estado.membros.find((x) => x.id === mid);
        if (!confirm("Excluir esta especialidade?")) return;
        await deleteEspecialidade(unidadeId, mid, eid);
        avisarLideranca(`excluiu uma especialidade de ${m ? m.nome : mid}.`);
        mostrarToast("Especialidade removida.");
      })
    );
  }

  let filtroCompras = "pendente";
  document.querySelectorAll("[data-filtro-compras]").forEach(botao => botao.addEventListener("click", () => {
    filtroCompras = botao.dataset.filtroCompras;
    document.querySelectorAll("[data-filtro-compras]").forEach(b => {
      const ativo = b.dataset.filtroCompras === filtroCompras;
      b.setAttribute("aria-pressed",String(ativo));
      b.classList.toggle("btn-primary",ativo); b.classList.toggle("btn-outline",!ativo);
    });
    renderResumoCompras();
  }));
  function renderResumoCompras() {
    const wrap = document.getElementById("compras-resumo");
    const todos = estado.membros.flatMap(m => (fanOutMateriais.dados[m.id] || []).map(item => ({m,item})));
    const filtrados = todos.filter(({item}) => filtroCompras === "todos" || (filtroCompras === "comprado" ? item.status === "comprado" : item.status !== "comprado"));
    document.getElementById("home-compras").textContent = todos.filter(({item}) => item.status !== "comprado").length;
    document.getElementById("compras-contagem").textContent = filtrados.length + (filtrados.length === 1 ? " item" : " itens") + " · " + todos.filter(({item}) => item.status !== "comprado").length + " pendentes";
    wrap.replaceChildren();
    if (!filtrados.length) {
      const vazio = document.createElement("p"); vazio.className = "muted"; vazio.textContent = "Nenhum material nesta categoria."; wrap.append(vazio); return;
    }
    filtrados.forEach(({m,item}) => {
      const linha = document.createElement("div"); linha.className = "unidade-compra-item";
      const info = document.createElement("div");
      const nome = document.createElement("strong"); nome.textContent = item.nome || "Material";
      const detalhe = document.createElement("small"); detalhe.textContent = m.nome + (item.especialidade ? " · " + item.especialidade : "");
      info.append(nome,detalhe);
      const botao = document.createElement("button"); botao.type = "button";
      botao.className = "btn btn-sm " + (item.status === "comprado" ? "btn-outline" : "btn-primary");
      botao.textContent = item.status === "comprado" ? "✓ Comprado" : "Marcar comprado";
      botao.addEventListener("click",async () => {
        botao.disabled = true;
        const novoStatus = item.status === "comprado" ? "pendente" : "comprado";
        try {
          await toggleMaterial(unidadeId,m.id,item.id,novoStatus);
          avisarLideranca('marcou "' + item.nome + '" (' + m.nome + ') como ' + novoStatus + '.');
        } catch (erro) { mostrarToast("Não foi possível atualizar o material."); botao.disabled = false; }
      });
      linha.append(info,botao);wrap.append(linha);
    });
  }
  /* ---------------- Materiais: o que falta comprar ---------------- */
  function renderMateriais() {
    const wrap = document.getElementById("lista-materiais");
    const vazio = document.getElementById("materiais-vazio");
    vazio.style.display = estado.membros.length ? "none" : "block";

    wrap.innerHTML = estado.membros
      .map((m) => {
        const lista = fanOutMateriais.dados[m.id] || [];
        const pendentes = lista.filter((it) => it.status !== "comprado").length;
        const itens = lista
          .map(
            (it) => `<li data-mat="${m.id}:${it.id}" class="${it.status === "comprado" ? "comprado" : ""}">
              <span class="mat-nome">${it.nome}</span>
              ${it.especialidade ? `<span class="muted">(${it.especialidade})</span>` : ""}
              <button type="button" class="btn btn-sm ${it.status === "comprado" ? "btn-outline" : "btn-primary"}" data-toggle-mat="${m.id}:${it.id}:${it.status}">${it.status === "comprado" ? "✓ Comprado" : "Marcar comprado"}</button>
              <button type="button" data-del-mat="${m.id}:${it.id}" style="background:none; border:none; color:#c1443a; font-weight:700; cursor:pointer;">Excluir</button>
            </li>`
          )
          .join("");
        return `
        <details class="month-acc" data-mat-acc="${m.id}"${abertosMateriais.has(m.id) ? " open" : ""}>
          <summary>${m.nome} <span class="muted" style="font-weight:600; font-size:.8rem;">(${pendentes} pendente(s) de ${lista.length})</span></summary>
          <div class="unidade-acc-conteudo">
            <ul class="mat-list">${itens || "<li class='muted' style='border:none;'>Nenhum item cadastrado ainda.</li>"}</ul>
            <form class="registro-add-form" data-form-mat="${m.id}">
              <div class="field"><label>Item</label><input type="text" class="mat-novo-nome" placeholder="ex.: Cantil" required></div>
              <div class="field"><label>Especialidade (opcional)</label><input type="text" class="mat-nova-esp" placeholder="ex.: Acampamento"></div>
              <button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
            </form>
          </div>
        </details>`;
      })
      .join("");

    renderResumoCompras();
    wrap.querySelectorAll("[data-mat-acc]").forEach((det) =>
      det.addEventListener("toggle", () => {
        if (det.open) abertosMateriais.add(det.dataset.matAcc);
        else abertosMateriais.delete(det.dataset.matAcc);
      })
    );
    wrap.querySelectorAll("[data-form-mat]").forEach((form) =>
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const membroId = form.dataset.formMat;
        const nome = form.querySelector(".mat-novo-nome").value.trim();
        if (!nome) return;
        await addMaterial(unidadeId, membroId, { nome, especialidade: form.querySelector(".mat-nova-esp").value.trim() });
        const m = estado.membros.find((x) => x.id === membroId);
        avisarLideranca(`adicionou "${nome}" na lista de compras de ${m ? m.nome : membroId}.`);
        mostrarToast("Item adicionado.");
      })
    );
    wrap.querySelectorAll("[data-toggle-mat]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, iid, statusAtual] = btn.dataset.toggleMat.split(":");
        const novoStatus = statusAtual === "comprado" ? "pendente" : "comprado";
        await toggleMaterial(unidadeId, mid, iid, novoStatus);
        const item = (fanOutMateriais.dados[mid] || []).find((x) => x.id === iid);
        const m = estado.membros.find((x) => x.id === mid);
        avisarLideranca(`marcou "${item ? item.nome : iid}" (${m ? m.nome : mid}) como ${novoStatus}.`);
      })
    );
    wrap.querySelectorAll("[data-del-mat]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [mid, iid] = btn.dataset.delMat.split(":");
        const item = (fanOutMateriais.dados[mid] || []).find((x) => x.id === iid);
        const m = estado.membros.find((x) => x.id === mid);
        if (!confirm("Excluir este item?")) return;
        await deleteMaterial(unidadeId, mid, iid);
        avisarLideranca(`excluiu "${item ? item.nome : iid}" da lista de compras de ${m ? m.nome : mid}.`);
        mostrarToast("Item removido.");
      })
    );
  }

  /* ---------------- Planejamento ---------------- */
  watchPlanejamentos(unidadeId, (lista) => { estado.planejamentos = lista; renderPlanejamento(); renderStats(); });

  function renderPlanejamento() {
    const wrap = document.getElementById("lista-planejamento");
    const vazio = document.getElementById("planejamento-vazio");
    vazio.style.display = estado.planejamentos.length ? "none" : "block";

    wrap.innerHTML = estado.planejamentos
      .map((p) => {
        const pillClasse = p.status === "aprovado" ? "pill-open" : p.status === "recusado" ? "pill-closed" : "pill-pending";
        return `
        <div class="card" style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
            <h3 style="margin:0;">${p.titulo}</h3>
            <span class="pill ${pillClasse}">${RS_PLANEJAMENTO_STATUS[p.status] || p.status}</span>
          </div>
          <p class="muted" style="margin:6px 0 0;">${fmtDataBr(p.data)} às ${p.horario || "—"} · ${p.local || "—"}</p>
          <p style="margin:8px 0 0;"><strong>Objetivo:</strong> ${p.objetivo || "—"}</p>
          <p style="margin:6px 0 0;">${p.descricao || ""}</p>
          ${p.observacoes ? `<p class="muted" style="margin:6px 0 0;"><strong>Observações:</strong> ${p.observacoes}</p>` : ""}
          ${p.status === "recusado" ? `<div class="alert alert-error show" style="margin-top:10px;"><strong>Motivo da recusa:</strong> ${p.motivoRecusa}</div>` : ""}
          ${p.status !== "aprovado" ? `<button type="button" class="btn btn-outline btn-sm" style="margin-top:10px;" data-editar-planejamento="${p.id}">Editar${p.status === "recusado" ? " e reenviar" : ""}</button>` : ""}
        </div>`;
      })
      .join("");

    wrap.querySelectorAll("[data-editar-planejamento]").forEach((btn) =>
      btn.addEventListener("click", () => abrirModalPlanejamento(btn.dataset.editarPlanejamento))
    );
  }

  const modalPlanejamento = document.getElementById("modal-planejamento");
  const formPlanejamento = document.getElementById("form-planejamento");
  let planejamentoEmEdicao = null;

  function abrirModalPlanejamento(planId) {
    planejamentoEmEdicao = planId || null;
    const titulo = document.getElementById("modal-planejamento-titulo");
    if (planId) {
      const p = estado.planejamentos.find((x) => x.id === planId);
      titulo.textContent = "Editar proposta de planejamento";
      document.getElementById("pl-titulo").value = p.titulo || "";
      document.getElementById("pl-data").value = p.data || "";
      document.getElementById("pl-horario").value = p.horario || "";
      document.getElementById("pl-local").value = p.local || "";
      document.getElementById("pl-objetivo").value = p.objetivo || "";
      document.getElementById("pl-descricao").value = p.descricao || "";
      document.getElementById("pl-observacoes").value = p.observacoes || "";
    } else {
      titulo.textContent = "Nova proposta de planejamento";
      formPlanejamento.reset();
    }
    modalPlanejamento.classList.add("show");
  }

  document.getElementById("btn-novo-planejamento").addEventListener("click", () => abrirModalPlanejamento(null));
  document.getElementById("btn-cancelar-planejamento").addEventListener("click", () => modalPlanejamento.classList.remove("show"));
  formPlanejamento.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      titulo: document.getElementById("pl-titulo").value.trim(),
      data: document.getElementById("pl-data").value,
      horario: document.getElementById("pl-horario").value,
      local: document.getElementById("pl-local").value.trim(),
      objetivo: document.getElementById("pl-objetivo").value.trim(),
      descricao: document.getElementById("pl-descricao").value.trim(),
      observacoes: document.getElementById("pl-observacoes").value.trim(),
    };
    if (planejamentoEmEdicao) {
      await editarPlanejamento(unidadeId, planejamentoEmEdicao, dados);
      avisarLideranca(`editou e reenviou a proposta "${dados.titulo}" pra aprovação.`);
      mostrarToast("Proposta atualizada e reenviada pra aprovação.");
    } else {
      await addPlanejamento(unidadeId, dados);
      mostrarToast("Proposta enviada pra aprovação.");
    }
    modalPlanejamento.classList.remove("show");
  });

  /* ---------------- Planejamento do Clube (só leitura) ---------------- */
  const modalDetalheEvento = document.getElementById("modal-evento-detalhe");
  criarCalendarioClube({
    aoClicarEvento: (ev) => {
      document.getElementById("detalhe-nome").textContent = ev.nome;
      document.getElementById("detalhe-data").textContent =
        `${fmtDataBr(ev.data)}${ev.dataFim && ev.dataFim !== ev.data ? " a " + fmtDataBr(ev.dataFim) : ""}${ev.horario ? " · " + ev.horario : ""}`;
      document.getElementById("detalhe-categoria").textContent = ev.categoria;
      document.getElementById("detalhe-descricao").textContent = ev.descricao || "";
      document.getElementById("detalhe-observacoes").textContent = ev.observacoes ? "Observações: " + ev.observacoes : "";
      modalDetalheEvento.classList.add("show");
    },
  });
  document.getElementById("btn-fechar-detalhe").addEventListener("click", () => modalDetalheEvento.classList.remove("show"));

  /* ---------------- Notificações ---------------- */
  const notifDropdown = document.getElementById("notif-dropdown");
  watchNotificacoesUnidade(unidadeId, (lista) => { estado.notificacoes = lista; renderNotificacoes(); });

  function renderNotificacoes() {
    const naoLidas = estado.notificacoes.filter((n) => !n.lida);
    const badge = document.getElementById("notif-badge");
    badge.textContent = naoLidas.length;
    badge.style.display = naoLidas.length ? "inline-block" : "none";

    const listaEl = document.getElementById("notif-lista");
    const vazio = document.getElementById("notif-vazio");
    vazio.style.display = estado.notificacoes.length ? "none" : "block";
    listaEl.innerHTML = estado.notificacoes
      .map((n) => `<div class="notif-item ${n.lida ? "" : "nao-lida"}">
        <span>${n.tipo === "planejamento_aprovado" ? "✅" : "⚠️"}</span>
        <div><p>${n.mensagem}</p>${n.motivo ? `<p class="muted">Motivo: ${n.motivo}</p>` : ""}</div>
        <button type="button" class="notif-del" data-del-notif="${n.id}" aria-label="Remover notificação">✕</button>
      </div>`)
      .join("");
    listaEl.querySelectorAll("[data-del-notif]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNotificacaoUnidade(unidadeId, btn.dataset.delNotif);
      })
    );
  }

  document.getElementById("btn-notif").addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
    if (notifDropdown.classList.contains("show")) {
      const idsNaoLidas = estado.notificacoes.filter((n) => !n.lida).map((n) => n.id);
      if (idsNaoLidas.length) marcarNotificacoesUnidadeLidas(unidadeId, idsNaoLidas);
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".notif-wrap")) notifDropdown.classList.remove("show");
  });

  /* ---------------- Mural de Avisos (leitura) ----------------
     Como o mural é compartilhado (não é por unidade), "visto" fica
     só no localStorage deste navegador — é conveniência de exibição
     (zera o badge, evita tocar o som de novo), não controla acesso. */
  let avisosPrimeiraCarga = true;
  const chaveAvisosVisto = `rs_avisos_visto_${unidadeId}`;
  function avisoMillis(a) {
    return a.criadoEm && a.criadoEm.toMillis ? a.criadoEm.toMillis() : 0;
  }
  watchAvisos((lista) => {
    const ultimoVistoMs = Number(localStorage.getItem(chaveAvisosVisto) || 0);
    const novos = lista.filter((a) => avisoMillis(a) > ultimoVistoMs);
    const badgeAvisos = document.getElementById("badge-avisos");
    badgeAvisos.textContent = novos.length;
    badgeAvisos.style.display = novos.length ? "inline-block" : "none";

    if (avisosPrimeiraCarga) {
      avisosPrimeiraCarga = false;
      if (novos.length) {
        tocarSomNotificacao();
        const extras = novos.length > 1 ? ` (+${novos.length - 1})` : "";
        mostrarToast(`📰 Novo aviso da diretoria: ${novos[0].titulo}${extras}`);
      }
    }

    const listaEl = document.getElementById("lista-avisos-unidade");
    const vazio = document.getElementById("avisos-unidade-vazio");
    vazio.style.display = lista.length ? "none" : "block";
    listaEl.innerHTML = lista
      .map((a) => `<div class="card" style="margin-bottom:10px;">
        <strong>${a.titulo}</strong>
        <p style="margin:4px 0;">${a.mensagem}</p>
        <span class="muted" style="font-size:.78rem;">${fmtData(a.criadoEm)}</span>
      </div>`)
      .join("");
  });
  const linkMuralAvisos = document.querySelector('a[href="#mural-avisos"]');
  if (linkMuralAvisos) {
    linkMuralAvisos.addEventListener("click", () => {
      localStorage.setItem(chaveAvisosVisto, String(Date.now()));
      document.getElementById("badge-avisos").style.display = "none";
    });
  }

  /* ---------------- Estatísticas ---------------- */
  function renderStats() {
    document.getElementById("s-membros").textContent = estado.membros.length;
    document.getElementById("home-membros").textContent = estado.membros.length;
    const totalRegistros = Object.values(fanOutRegistros.dados).reduce((acc, regs) => acc + regs.length, 0);
    document.getElementById("s-topicos").textContent = totalRegistros;
    document.getElementById("home-registros").textContent = totalRegistros;
    document.getElementById("s-planejamentos").textContent = estado.planejamentos.length;
    const emAndamento = Object.values(fanOutEspecialidades.dados).flat().filter((e) => e.status === "andamento").length;
    document.getElementById("s-especialidades").textContent = emAndamento;
  }

  /* ---------------- Identidade da unidade (logo/grito/cor) — só leitura;
     quem define é a liderança, em "Identidade das Unidades". ---------------- */
  const gritoEl = document.getElementById("grito-de-guerra");
  watchIdentidadeUnidade(unidadeId, (identidade) => {
    if (identidade.logoUrl) document.getElementById("brand-logo").src = identidade.logoUrl;
    if (identidade.gritoDeGuerra) {
      gritoEl.textContent = `"${identidade.gritoDeGuerra}"`;
      gritoEl.style.display = "block";
    } else {
      gritoEl.style.display = "none";
    }
    if (identidade.cor) {
      document.documentElement.style.setProperty("--cor-unidade", identidade.cor);
    }
  });

  /* ---------------- Trocar senha (por aprovação da liderança) ---------------- */
  if (new URLSearchParams(window.location.search).has("senha-trocada")) {
    mostrarToast("Sua senha foi trocada com sucesso, conforme aprovado pela liderança.");
  }

  const senhaPendenteAviso = document.getElementById("senha-pendente-aviso");
  const btnPedirSenha = document.getElementById("btn-pedir-senha");
  watchPedidoSenha(unidadeId, (pedido) => {
    if (pedido && pedido.status === "pendente") {
      senhaPendenteAviso.textContent = "Pedido de troca de senha enviado — aguardando aprovação da liderança.";
      senhaPendenteAviso.style.display = "block";
      btnPedirSenha.disabled = true;
    } else if (pedido && pedido.status === "recusada") {
      senhaPendenteAviso.textContent = `Seu pedido de troca de senha foi recusado. Motivo: ${pedido.motivoRecusa || "não informado"}. Você pode pedir de novo.`;
      senhaPendenteAviso.style.display = "block";
      btnPedirSenha.disabled = false;
    } else {
      senhaPendenteAviso.style.display = "none";
      btnPedirSenha.disabled = false;
    }
  });

  document.getElementById("form-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("senha-erro");
    const ok = document.getElementById("senha-ok");
    erro.classList.remove("show"); ok.classList.remove("show");
    try {
      await solicitarTrocaSenha(unidadeId, document.getElementById("senha-nova").value);
      ok.textContent = "Pedido enviado! Assim que a liderança aprovar, a troca acontece sozinha no seu próximo login.";
      ok.classList.add("show");
      e.target.reset();
    } catch (err) {
      erro.textContent = err.message;
      erro.classList.add("show");
    }
  });
}
