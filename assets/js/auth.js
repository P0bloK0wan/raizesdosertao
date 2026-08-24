/* =========================================================
   Autenticação simples do lado do cliente.

   Aviso importante: como o site é 100% estático (sem servidor),
   este login serve para ORGANIZAR o acesso das unidades e da
   liderança — não é um sistema de segurança à prova de invasão.
   Não recomendamos usar senhas que a diretoria usa em outros
   lugares (banco, e-mail etc.).
   ========================================================= */

const RS_AUTH = (() => {
  async function loginLideranca(usuario, senha) {
    const conta = RS_CONTAS.lideranca;
    if (usuario.trim().toLowerCase() !== conta.usuario) {
      throw new Error("Usuário não encontrado.");
    }
    const hash = await RS.sha256(senha);
    const hashValido = RS.getPasswordHash(conta.usuario) || conta.passwordHash;
    if (hash !== hashValido) throw new Error("Senha incorreta.");

    RS.setSession({ papel: "lideranca", usuario: conta.usuario, nome: conta.nome });
    return true;
  }

  async function loginUnidade(unidadeId, senha) {
    const conta = RS_CONTAS.unidades[unidadeId];
    if (!conta) throw new Error("Selecione uma unidade válida.");
    const hash = await RS.sha256(senha);
    const hashValido = RS.getPasswordHash(conta.usuario) || conta.passwordHash;
    if (hash !== hashValido) throw new Error("Senha incorreta.");

    RS.setSession({ papel: "unidade", usuario: conta.usuario, unidadeId, nome: conta.nome });
    return true;
  }

  async function trocarSenha(usuario, senhaAtual, senhaNova) {
    const contas = [RS_CONTAS.lideranca, ...Object.values(RS_CONTAS.unidades)];
    const conta = contas.find((c) => c.usuario === usuario);
    if (!conta) throw new Error("Conta não encontrada.");

    const hashAtual = await RS.sha256(senhaAtual);
    const hashValido = RS.getPasswordHash(conta.usuario) || conta.passwordHash;
    if (hashAtual !== hashValido) throw new Error("Senha atual incorreta.");
    if (senhaNova.length < 6) throw new Error("A nova senha precisa ter pelo menos 6 caracteres.");

    const novoHash = await RS.sha256(senhaNova);
    RS.setPasswordHash(conta.usuario, novoHash);
    return true;
  }

  function logout() {
    RS.clearSession();
    window.location.href = "index.html";
  }

  /* Protege uma página: redireciona se não estiver logado com o
     papel esperado ("lideranca" ou "unidade"). Retorna a sessão. */
  function exigirSessao(papelEsperado) {
    const sessao = RS.getSession();
    if (!sessao || sessao.papel !== papelEsperado) {
      const destino = papelEsperado === "lideranca" ? "login-lideranca.html" : "login-unidade.html";
      window.location.href = destino;
      return null;
    }
    return sessao;
  }

  return { loginLideranca, loginUnidade, trocarSenha, logout, exigirSessao };
})();
