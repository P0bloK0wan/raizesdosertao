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
