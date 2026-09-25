import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
const form = document.getElementById("form-prospect");
const tbody = document.getElementById("lista-prospects");
const erro = document.getElementById("prospects-erro");
const estados = ["Novo prospect", "Dúvida", "Em negociação", "Negócio fechado", "Recusado", "Retomar futuramente"];
const safe = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let unsubscribe = null;
onAuthStateChanged(auth, user => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  if (user?.email !== "lideranca@raizesdosertao.app") return;
  unsubscribe = onSnapshot(query(collection(db, "prospects"), orderBy("criadoEm", "desc")), snap => {
    tbody.replaceChildren();
    snap.forEach(item => {
      const p = item.data(), tr = document.createElement("tr");
      tr.innerHTML = `<td>${safe(p.nome)}</td><td>${safe(p.telefone)}</td><td>${safe(p.instagram)}</td><td></td><td>${safe(p.motivo)}</td><td>${safe(p.observacoes)}</td><td><button type="button" class="danger">Excluir</button></td>`;
      const select = document.createElement("select");
      estados.forEach(status => { const option = new Option(status, status); select.add(option); });
      select.value = p.status || estados[0];
      select.setAttribute("aria-label", "Status de " + p.nome);
      select.addEventListener("change", async () => {
        try { await updateDoc(doc(db, "prospects", item.id), { status: select.value }); }
        catch (e) { erro.textContent = "Erro ao atualizar status."; }
      });
      ["Nome", "Telefone", "Instagram", "Status", "Motivo", "Observações", "Ações"].forEach((label, index) => tr.children[index].dataset.label = label);
      tr.children[3].append(select);
      tr.querySelector("button").addEventListener("click", async () => {
        if (!confirm("Excluir este cliente?")) return;
        try { await deleteDoc(doc(db, "prospects", item.id)); }
        catch (e) { erro.textContent = "Erro ao excluir cliente."; }
      });
      tbody.append(tr);
    });
  }, () => { erro.textContent = "Não foi possível carregar os clientes. Confira as regras do Firestore."; });
});
form?.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true; erro.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  try {
    await addDoc(collection(db, "prospects"), { ...data, criadoEm: serverTimestamp() });
    form.reset();
    erro.textContent = "Cliente salvo.";
  } catch (e) { erro.textContent = "Não foi possível salvar. Verifique a conexão e as regras do Firebase."; }
  finally { button.disabled = false; }
});
