/* =========================================================
   Dados fixos do clube (não sensíveis) + credenciais padrão.
   Tudo roda 100% no navegador — sem servidor, sem custo.

   Para trocar as senhas padrão, gere um novo hash SHA-256 no
   console do navegador com:
     await RS.sha256("novaSenha")
   e substitua o valor de passwordHash abaixo.
   ========================================================= */

const RS_CLUBE = {
  nome: "Raízes do Sertão",
  sede: "Vila Eduardo",
  regiao: "Região 13 — 4º Distrito — APeC",
  fundacao: "04/04/2004",
  whatsapp: "5587981474224",
  whatsappExibicao: "(87) 98147-4224",
  contato: "Pablo Kawan Farias Cavalcante",
  logo: "assets/img/logo.png",
};

const RS_UNIDADES = [
  { id: "tarantula", nome: "Tarântula", img: "assets/img/unit_tarantula.png" },
  { id: "andorinha", nome: "Andorinha", img: "assets/img/unit_andorinha2.png" },
  { id: "carcara",   nome: "Carcará",   img: "assets/img/unit_carcara.png" },
  { id: "raposa",    nome: "Raposa",    img: "assets/img/unit_raposa.png" },
];

const RS_DIRETORES = [
  { periodo: "2004",       nome: "Edílson Leitão", nota: "Fundador do clube (in memoriam)" },
  { periodo: "2005",       nome: "Saulo Rubens" },
  { periodo: "2006–2009",  nome: "Rogilmar Simplício" },
  { periodo: "2010–2011",  nome: "Acácio Gerson" },
  { periodo: "2012",       nome: "Arisvalda Alencar" },
  { periodo: "2013–2014",  nome: "Fábio Barbosa" },
  { periodo: "2015",       nome: "Max" },
  { periodo: "2016",       nome: "Acácio Gerson" },
  { periodo: "2017–2018",  nome: "Eliana" },
  { periodo: "2019",       nome: "Arisvalda" },
  { periodo: "2020–2023",  nome: "Fernanda Sales" },
  { periodo: "2024",       nome: "Matheus Henry" },
  { periodo: "2025–atual", nome: "Edmar" },
];

const RS_HISTORIA = `Com certeza Deus planejou a fundação desse clube e até aqui ele tem nos ajudado a cumprir a nossa missão. Todos que passam pelo clube deixam sua marca e estarão em nossos corações.

Fundado no dia 04 de abril de 2004, pelo diretor da época Edílson Leitão (in memoriam) e seus associados Viviane Ribeiro e Saulo Rubens, o clube iniciou sua trajetória com quatro unidades: Carcará, Águia, Flor do Mandacaru e Andorinha.

Durante os 22 anos de existência do clube, vários diretores deram sua contribuição — cada um deixando um pouco de si na história do Raízes do Sertão.`;

const RS_CALENDARIO = [
  {
    mes: "Julho",
    itens: [
      { data: "04/07", texto: "Classe bíblica" },
      { data: "05/07", texto: "Folga / Lava Jato", folga: true, destaque: true },
      { data: "11/07", texto: "Classe bíblica" },
      { data: "12/07", texto: "Reunião" },
      { data: "18/07", texto: "Classe bíblica" },
      { data: "19/07", texto: "Folga", folga: true },
      { data: "25/07", texto: "Classe bíblica" },
      { data: "26/07", texto: "Reunião" },
    ],
  },
  {
    mes: "Agosto",
    itens: [
      { data: "01/08", texto: "Classe bíblica" },
      { data: "02/08", texto: "Folga", folga: true },
      { data: "08/08", texto: "Classe bíblica" },
      { data: "09/08", texto: "Reunião do clube com participação dos pais (Dia dos Pais)", destaque: true },
      { data: "15/08", texto: "Classe bíblica" },
      { data: "16/08", texto: "Reunião" },
      { data: "22/08", texto: "Classe bíblica" },
      { data: "23/08", texto: "Reunião" },
      { data: "29/08", texto: "Classe bíblica" },
      { data: "30/08", texto: "Folga", folga: true },
    ],
  },
  {
    mes: "Setembro",
    itens: [
      { data: "05/09", texto: "Classe bíblica" },
      { data: "06/09", texto: "Folga", folga: true },
      { data: "12/09", texto: "Classe bíblica" },
      { data: "13/09", texto: "Reunião" },
      { data: "19/09", texto: "Dia mundial dos desbravadores — investidura", destaque: true },
      { data: "20/09", texto: "Folga", folga: true },
      { data: "27/09", texto: "Reunião" },
    ],
  },
  {
    mes: "Outubro",
    itens: [
      { data: "04/10", texto: "Reunião" },
      { data: "09–11/10", texto: "Acampamento", destaque: true },
      { data: "18/10", texto: "Folga", folga: true },
      { data: "25/10", texto: "Reunião" },
    ],
  },
  {
    mes: "Novembro",
    itens: [
      { data: "01/11", texto: "Reunião" },
      { data: "08/11", texto: "Reunião (ENEM)", destaque: true },
      { data: "15/11", texto: "Folga", folga: true },
      { data: "22/11", texto: "Reunião" },
      { data: "29/11", texto: "Folga", folga: true },
    ],
  },
  {
    mes: "Dezembro",
    itens: [
      { data: "05/12", texto: "Encerramento das atividades", destaque: true },
    ],
  },
];

/* Metas de arrecadação exibidas na home — a liderança pode
   atualizar pelo painel (fica salvo em localStorage). */
const RS_META_PADRAO = { alvo: 15000, arrecadado: 4200 };

/* O Lava Jato acontece todo domingo, até o fim de dezembro.
   Esta função gera automaticamente uma vaga para cada domingo
   entre hoje e 31/12 — a liderança pode ajustar horário/vagas
   ou adicionar datas extras pelo painel. */
function rsGerarVagasPadrao() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const cursor = new Date(hoje);
  cursor.setDate(cursor.getDate() + ((7 - cursor.getDay()) % 7)); // próximo domingo (ou hoje, se já for domingo)
  const fimDoAno = new Date(hoje.getFullYear(), 11, 31);

  const vagas = [];
  while (cursor <= fimDoAno) {
    vagas.push({
      id: "v" + cursor.getTime(),
      data: cursor.toLocaleDateString("pt-BR"),
      horario: "07:00 – 11:00",
      vagas: 4,
      unidadeId: null,
      membros: [],
      responsavel: "",
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return vagas;
}

/* Critérios avaliados semanalmente pela unidade para cada
   desbravador (nota de 0 a 10 em cada um). */
const RS_CRITERIOS = [
  { id: "pontualidade", label: "Pontualidade" },
  { id: "biblia", label: "Bíblia / Lição" },
  { id: "uniforme", label: "Uniforme" },
  { id: "participacao", label: "Participação" },
  { id: "comportamento", label: "Comportamento" },
];

/* Contas padrão (senha em texto puro só existe aqui, no seu
   código-fonte — nunca é salva em lugar nenhum). O login compara
   o hash SHA-256 do que a pessoa digita com o hash abaixo.
     lideranca  -> raizes2026
     <unidade>  -> sertao123   (ex.: usuário "carcara") */
const RS_CONTAS = {
  lideranca: {
    usuario: "lideranca",
    nome: "Diretoria — Raízes do Sertão",
    passwordHash: "f46955679c74beb0ef3e2edf9ea1a7b5879ad44b2fd97c0aa4457008ca2e5cd2",
  },
  unidades: RS_UNIDADES.reduce((acc, u) => {
    acc[u.id] = {
      usuario: u.id,
      nome: u.nome,
      passwordHash: "7d9faca6ba46f7f763064d858bfdfd7892b149d588eec119e10cba221b2592dd",
    };
    return acc;
  }, {}),
};
