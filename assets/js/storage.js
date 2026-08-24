/* =========================================================
   Camada de armazenamento — tudo local (localStorage).
   Sem servidor, sem banco de dados, sem custo nenhum.

   Importante: como os dados ficam salvos no navegador de cada
   aparelho, o ideal é que cada unidade use sempre o mesmo
   computador/celular do clube para lançar as informações, e
   use os botões de Exportar / Importar para juntar tudo no
   aparelho da liderança quando precisar.
   ========================================================= */

const RS = (() => {
  const KEYS = {
    session: "rs_sessao",
    theme: "rs_tema",
    membros: (unidadeId) => `rs_membros_${unidadeId}`,
    avaliacoes: (unidadeId) => `rs_avaliacoes_${unidadeId}`,
    vagas: "rs_vagas",
    meta: "rs_meta",
    galeria: "rs_galeria",
    senhaOverride: (usuario) => `rs_senha_${usuario}`,
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /* ---------- sessão ---------- */
  function getSession() {
    return read(KEYS.session, null);
  }
  function setSession(session) {
    write(KEYS.session, session);
  }
  function clearSession() {
    localStorage.removeItem(KEYS.session);
  }

  /* ---------- tema ---------- */
  function getTheme() {
    return localStorage.getItem(KEYS.theme) || "light";
  }
  function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
  }

  /* ---------- membros por unidade ---------- */
  function getMembros(unidadeId) {
    return read(KEYS.membros(unidadeId), []);
  }
  function setMembros(unidadeId, lista) {
    write(KEYS.membros(unidadeId), lista);
  }
  function getTodosMembros() {
    const out = {};
    RS_UNIDADES.forEach((u) => (out[u.id] = getMembros(u.id)));
    return out;
  }

  /* ---------- avaliações semanais por unidade ---------- */
  function getAvaliacoes(unidadeId) {
    return read(KEYS.avaliacoes(unidadeId), []);
  }
  function setAvaliacoes(unidadeId, lista) {
    write(KEYS.avaliacoes(unidadeId), lista);
  }
  function getTodasAvaliacoes() {
    const out = {};
    RS_UNIDADES.forEach((u) => (out[u.id] = getAvaliacoes(u.id)));
    return out;
  }

  /* ---------- vagas do lava jato (todo domingo, até dezembro) ---------- */
  function getVagas() {
    return read(KEYS.vagas, rsGerarVagasPadrao());
  }
  function setVagas(lista) {
    write(KEYS.vagas, lista);
  }

  /* ---------- meta de arrecadação ---------- */
  function getMeta() {
    return read(KEYS.meta, { ...RS_META_PADRAO });
  }
  function setMeta(meta) {
    write(KEYS.meta, meta);
  }

  /* ---------- galeria de fotos/vídeos (links de álbum) ---------- */
  function getGaleria() {
    return read(KEYS.galeria, []);
  }
  function setGaleria(lista) {
    write(KEYS.galeria, lista);
  }

  /* ---------- senha customizada ---------- */
  function getPasswordHash(usuario) {
    return localStorage.getItem(KEYS.senhaOverride(usuario));
  }
  function setPasswordHash(usuario, hash) {
    localStorage.setItem(KEYS.senhaOverride(usuario), hash);
  }

  /* ---------- exportar / importar ---------- */
  function exportarUnidade(unidadeId) {
    const unidade = RS_UNIDADES.find((u) => u.id === unidadeId);
    const payload = {
      tipo: "rs-unidade",
      unidadeId,
      unidadeNome: unidade ? unidade.nome : unidadeId,
      exportadoEm: new Date().toISOString(),
      membros: getMembros(unidadeId),
      avaliacoes: getAvaliacoes(unidadeId),
      vagas: getVagas().filter((v) => v.unidadeId === unidadeId),
    };
    baixarJson(payload, `raizes-do-sertao-${unidadeId}.json`);
  }

  function exportarTudo() {
    const payload = {
      tipo: "rs-backup-completo",
      exportadoEm: new Date().toISOString(),
      membros: getTodosMembros(),
      avaliacoes: getTodasAvaliacoes(),
      vagas: getVagas(),
      meta: getMeta(),
      galeria: getGaleria(),
    };
    baixarJson(payload, "raizes-do-sertao-backup.json");
  }

  function baixarJson(obj, nome) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importarArquivo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          resolve(importarPayload(data));
        } catch (e) {
          reject(new Error("Arquivo inválido. Selecione um .json exportado pelo próprio site."));
        }
      };
      reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
      reader.readAsText(file);
    });
  }

  function importarPayload(data) {
    let resumo = [];
    if (data.tipo === "rs-unidade" && data.unidadeId) {
      setMembros(data.unidadeId, data.membros || []);
      resumo.push(`${(data.membros || []).length} desbravador(es) da unidade ${data.unidadeNome || data.unidadeId}`);

      if (Array.isArray(data.avaliacoes)) {
        setAvaliacoes(data.unidadeId, data.avaliacoes);
        resumo.push(`${data.avaliacoes.length} avaliação(ões)`);
      }

      if (Array.isArray(data.vagas) && data.vagas.length) {
        const atuais = getVagas();
        data.vagas.forEach((vImportada) => {
          const idx = atuais.findIndex((v) => v.id === vImportada.id);
          if (idx >= 0) atuais[idx] = vImportada;
          else atuais.push(vImportada);
        });
        setVagas(atuais);
        resumo.push(`${data.vagas.length} vaga(s) de lavagem`);
      }
    } else if (data.tipo === "rs-backup-completo") {
      if (data.membros) {
        Object.keys(data.membros).forEach((uid) => setMembros(uid, data.membros[uid]));
        resumo.push("todas as unidades");
      }
      if (data.avaliacoes) {
        Object.keys(data.avaliacoes).forEach((uid) => setAvaliacoes(uid, data.avaliacoes[uid]));
      }
      if (data.vagas) setVagas(data.vagas);
      if (data.meta) setMeta(data.meta);
      if (data.galeria) setGaleria(data.galeria);
      resumo.push("backup completo restaurado");
    } else {
      throw new Error("Este arquivo não parece ser um export do site Raízes do Sertão.");
    }
    return resumo.join(", ");
  }

  return {
    sha256,
    getSession, setSession, clearSession,
    getTheme, setTheme,
    getMembros, setMembros, getTodosMembros,
    getAvaliacoes, setAvaliacoes, getTodasAvaliacoes,
    getVagas, setVagas,
    getMeta, setMeta,
    getGaleria, setGaleria,
    getPasswordHash, setPasswordHash,
    exportarUnidade, exportarTudo, importarArquivo,
  };
})();
