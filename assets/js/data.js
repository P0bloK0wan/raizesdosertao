/* =========================================================
   Dados fixos do clube (não sensíveis).
   ========================================================= */

export const RS_CLUBE = {
  nome: "Raízes do Sertão",
  sede: "Vila Eduardo",
  regiao: "Região 13 — 4º Distrito — APeC",
  fundacao: "04/04/2004",
  whatsapp: "5587981474224",
  whatsappExibicao: "(87) 98147-4224",
  contato: "Pablo Kawan Farias Cavalcante",
  logo: "assets/img/logo.png",
};

export const RS_LINKS = {
  juntarSe: "https://wa.link/b84jhp",
  ajudarCampori: "https://wa.link/b84jh",
  instagramClube: "https://www.instagram.com/cluberaizesdosertao",
  instagramIgreja: "https://www.instagram.com/iasdvilaeduardo",
  youtubeIgreja: "https://youtube.com/@iasdvilaeduardo",
};

/* =========================================================
   Doação pro Campori DSA 2027: chama a API de pagamento do
   Mercado Pago (PIX, cartão e boleto, valor livre) através de um
   Cloudflare Worker — é ele que guarda a chave secreta do
   Mercado Pago e gera o link de pagamento na hora. Preencha com a
   URL do seu Worker depois de publicar — veja o passo a passo no
   README.md. Enquanto estiver vazio, o botão "Quero ajudar" cai
   de volta pro contato direto no WhatsApp.
   ========================================================= */
export const RS_API_DOACAO_CAMPORI = "";

export const RS_UNIDADES = [
  { id: "prea",      nome: "Preá",       img: "assets/img/unit_prea.png" },
  { id: "carcara",   nome: "Carcará",    img: "assets/img/unit_carcara.png" },
  { id: "tarantula", nome: "Tarântula",  img: "assets/img/unit_tarantula.png" },
  { id: "andorinha", nome: "Andorinha",  img: "assets/img/unit_andorinha2.png" },
  { id: "raposa",    nome: "Raposa",     img: "assets/img/unit_raposa.png" },
  { id: "beijaflor", nome: "Beija-Flor", img: "assets/img/unit_andorinha1.png" },
];

/* Linha do tempo da história do clube — usada na página
   "Nossa História". Cada marco mostra o período, quem dirigia o
   clube naquele momento, e o que aconteceu. */
export const RS_LINHA_DO_TEMPO = [
  {
    periodo: "2004",
    diretor: "Edílson Leitão (in memoriam)",
    texto: "Fundação do Clube Raízes do Sertão, no dia 04 de abril, ao lado de Viviane Ribeiro e Saulo Rubens. O clube inicia sua trajetória com quatro unidades: Carcará, Águia, Flor do Mandacaru e Andorinha.",
  },
  { periodo: "2005", diretor: "Saulo Rubens", texto: "Assumiu a direção do clube, dando continuidade à missão do Raízes do Sertão." },
  { periodo: "2006–2009", diretor: "Rogilmar Simplício", texto: "Conduziu o clube por quatro anos de crescimento." },
  { periodo: "2010–2011", diretor: "Acácio Gerson", texto: "Primeira gestão à frente da direção do clube." },
  { periodo: "2012", diretor: "Arisvalda Alencar", texto: "Assumiu a direção do clube." },
  { periodo: "2013–2014", diretor: "Fábio Barbosa", texto: "Assumiu a direção do clube." },
  { periodo: "2015", diretor: "Max", texto: "Assumiu a direção do clube." },
  { periodo: "2016", diretor: "Acácio Gerson", texto: "Segunda gestão à frente da direção do clube." },
  { periodo: "2017–2018", diretor: "Eliana", texto: "Assumiu a direção do clube." },
  { periodo: "2019", diretor: "Arisvalda", texto: "Segunda gestão à frente da direção do clube." },
  { periodo: "2020–2023", diretor: "Fernanda Sales", texto: "Conduziu o clube por quatro anos, incluindo o período de retomada das atividades presenciais." },
  { periodo: "2024", diretor: "Matheus Henry", texto: "Assumiu a direção do clube." },
  { periodo: "2025–atual", diretor: "Edmar", texto: "Está à frente da direção do clube, escrevendo o próximo capítulo dessa história." },
];

/* Critérios padrão usados como sugestão ao lançar um registro de
   requisito pra um desbravador (a unidade também pode digitar
   outro, via a opção "Outro..."). */
export const RS_TOPICOS_PADRAO = [
  "Pontualidade",
  "Bíblia / Lição",
  "Uniforme",
  "Participação",
  "Comportamento",
];

/* Data padrão do Campori (a liderança pode ajustar pelo painel). */
export const RS_CAMPORI_DATA_PADRAO = "2027-07-15";

/* =========================================================
   Lava Jato: agenda de domingos.
   ========================================================= */

/* Só aceitamos esse tanto de carros por domingo. */
export const RS_LAVAJATO_VAGAS_POR_DOMINGO = 5;

/* Gera os próximos N domingos (a partir de hoje, incluindo hoje se
   for domingo) no formato "AAAA-MM-DD", pra montar a agenda. */
export function rsProximosDomingos(qtd = 8) {
  const domingos = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximo = new Date(hoje);
  proximo.setDate(hoje.getDate() + ((7 - hoje.getDay()) % 7));
  for (let i = 0; i < qtd; i++) {
    const d = new Date(proximo);
    d.setDate(proximo.getDate() + i * 7);
    domingos.push(d.toISOString().slice(0, 10));
  }
  return domingos;
}

/* =========================================================
   Desbravadores: tipo sanguíneo (informação opcional).
   ========================================================= */
export const RS_TIPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* =========================================================
   Mídia: fotos enviadas direto no painel da liderança, guardadas
   no Cloudinary (sem redimensionar nada — baixar sempre pega o
   arquivo original). Preencha depois de criar uma conta grátis em
   cloudinary.com e um "upload preset" do tipo unsigned (veja o
   README.md) — sem isso, o upload de fotos não funciona.
   ========================================================= */
export const RS_CLOUDINARY_CLOUD_NAME = "yb6xrmhv";
export const RS_CLOUDINARY_UPLOAD_PRESET = "raizes-do-sertao";

/* Limite de tamanho por foto, conferido no navegador antes de
   enviar (o Cloudinary também pode ser configurado com o mesmo
   limite no próprio upload preset, como segunda trava). */
export const RS_MIDIA_TAMANHO_MAXIMO_MB = 10;

/* =========================================================
   Contas de acesso.

   O login usa o Firebase Authentication de verdade — cada conta
   é um e-mail "sintético" criado uma única vez no Console do
   Firebase (veja o README). O site nunca guarda senha nenhuma.
   ========================================================= */
export const RS_DOMINIO_CONTAS = "raizesdosertao.app";
export const RS_EMAIL_LIDERANCA = `lideranca@${RS_DOMINIO_CONTAS}`;
export const RS_NOME_LIDERANCA = "Diretoria — Raízes do Sertão";

export function emailDaUnidade(unidadeId) {
  return `${unidadeId}@${RS_DOMINIO_CONTAS}`;
}

/* =========================================================
   Planejamento das Unidades: rótulos de status.
   ========================================================= */
export const RS_PLANEJAMENTO_STATUS = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

/* =========================================================
   Planejamento do Clube: categorias fixas de evento.
   ========================================================= */
export const RS_PLANEJAMENTO_CLUBE_CATEGORIAS = [
  "Classe bíblica",
  "Reunião",
  "Folga",
  "Evento especial",
  "Acampamento",
];

/* Planejamento padrão do 2º semestre — carregado só quando a
   liderança clicar em "Carregar planejamento padrão" no painel
   (não é semeado automático). */
export const RS_PLANEJAMENTO_CLUBE_SEED = [
  { data: "2026-07-04", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-07-05", categoria: "Folga", nome: "Folga / Lava Jato" },
  { data: "2026-07-11", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-07-12", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-07-18", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-07-19", categoria: "Folga", nome: "Folga" },
  { data: "2026-07-25", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-07-26", categoria: "Reunião", nome: "Reunião" },

  { data: "2026-08-01", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-08-02", categoria: "Folga", nome: "Folga" },
  { data: "2026-08-08", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-08-09", categoria: "Evento especial", nome: "Reunião do clube com participação dos pais (Dia dos Pais)" },
  { data: "2026-08-15", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-08-16", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-08-22", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-08-23", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-08-29", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-08-30", categoria: "Folga", nome: "Folga" },

  { data: "2026-09-05", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-09-06", categoria: "Folga", nome: "Folga" },
  { data: "2026-09-12", categoria: "Classe bíblica", nome: "Classe bíblica" },
  { data: "2026-09-13", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-09-19", categoria: "Evento especial", nome: "Dia Mundial dos Desbravadores — Investidura" },
  { data: "2026-09-20", categoria: "Folga", nome: "Folga" },
  { data: "2026-09-27", categoria: "Reunião", nome: "Reunião" },

  { data: "2026-10-04", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-10-09", dataFim: "2026-10-11", categoria: "Acampamento", nome: "Acampamento" },
  { data: "2026-10-18", categoria: "Folga", nome: "Folga" },
  { data: "2026-10-25", categoria: "Reunião", nome: "Reunião" },

  { data: "2026-11-01", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-11-08", categoria: "Evento especial", nome: "Reunião (ENEM)" },
  { data: "2026-11-15", categoria: "Folga", nome: "Folga" },
  { data: "2026-11-22", categoria: "Reunião", nome: "Reunião" },
  { data: "2026-11-29", categoria: "Folga", nome: "Folga" },

  { data: "2026-12-05", categoria: "Evento especial", nome: "Encerramento das atividades" },
];
