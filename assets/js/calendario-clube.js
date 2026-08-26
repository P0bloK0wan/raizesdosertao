/* =========================================================
   Calendário do Planejamento do Clube — grade mensal
   reaproveitada pelo painel da liderança (com editar/excluir
   evento) e pelo painel das unidades (só leitura). Espera que a
   página tenha os elementos #cal-mes-atual, #cal-anterior,
   #cal-proximo e #calendario-grid.
   ========================================================= */

import { watchPlanejamentoClube } from "./store.js";

function categoriaClasse(categoria) {
  return "cat-" + (categoria || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}

/* `aoClicarEvento(evento)` é chamado ao clicar num evento da grade
   — quem chama decide o que fazer (abrir um modal de detalhe, com
   ou sem botões de editar/excluir). `aoAtualizarLista(lista)` é
   chamado toda vez que a lista de eventos muda, caso quem chamou
   precise manter sua própria referência (ex.: pra achar o evento
   ao abrir o modal de edição). */
export function criarCalendarioClube({ aoClicarEvento, aoAtualizarLista }) {
  const estado = {
    eventosClube: [],
    mesAtual: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  };

  function eventosNoDia(iso) {
    return estado.eventosClube.filter((ev) => {
      const fim = ev.dataFim || ev.data;
      return iso >= ev.data && iso <= fim;
    });
  }

  function render() {
    const ano = estado.mesAtual.getFullYear();
    const mes = estado.mesAtual.getMonth();
    document.getElementById("cal-mes-atual").textContent =
      estado.mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const offsetInicio = primeiroDia.getDay(); // 0 = domingo
    const totalDias = ultimoDia.getDate();

    const celulas = [];
    ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((d) => celulas.push(`<div class="cal-cabecalho">${d}</div>`));
    for (let i = 0; i < offsetInicio; i++) celulas.push(`<div class="cal-dia cal-vazio"></div>`);
    for (let dia = 1; dia <= totalDias; dia++) {
      const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      const eventos = eventosNoDia(iso);
      celulas.push(`<div class="cal-dia">
        <span class="cal-numero">${dia}</span>
        ${eventos.map((ev) => `<button type="button" class="cal-evento ${categoriaClasse(ev.categoria)}" data-evento="${ev.id}">${ev.nome}</button>`).join("")}
      </div>`);
    }

    document.getElementById("calendario-grid").innerHTML = celulas.join("");
    document.querySelectorAll("#calendario-grid [data-evento]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const ev = estado.eventosClube.find((x) => x.id === btn.dataset.evento);
        if (ev && aoClicarEvento) aoClicarEvento(ev);
      })
    );
  }

  document.getElementById("cal-anterior").addEventListener("click", () => {
    estado.mesAtual = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth() - 1, 1);
    render();
  });
  document.getElementById("cal-proximo").addEventListener("click", () => {
    estado.mesAtual = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth() + 1, 1);
    render();
  });

  watchPlanejamentoClube((lista) => {
    estado.eventosClube = lista;
    if (aoAtualizarLista) aoAtualizarLista(lista);
    render();
  });
}
