/* =========================================================
   Autenticação — Firebase Authentication de verdade.

   Cada unidade e a liderança têm uma conta (e-mail "sintético" +
   senha) criada uma única vez no Console do Firebase. O site
   nunca vê nem guarda a senha de ninguém — quem cuida disso é o
   Firebase.
   ========================================================= */

import { auth, firebaseConfigurado } from "./firebase.js";
import { RS_UNIDADES, RS_EMAIL_LIDERANCA, RS_NOME_LIDERANCA, emailDaUnidade } from "./data.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export { firebaseConfigurado };

export function loginLideranca(senha) {
  return signInWithEmailAndPassword(auth, RS_EMAIL_LIDERANCA, senha);
}

export function loginUnidade(unidadeId, senha) {
  return signInWithEmailAndPassword(auth, emailDaUnidade(unidadeId), senha);
}

export function logout() {
  return signOut(auth).then(() => { window.location.href = "index.html"; });
}

export function papelDoUsuario(user) {
  if (!user || !user.email) return null;
  if (user.email === RS_EMAIL_LIDERANCA) {
    return { papel: "lideranca", usuario: user.email, nome: RS_NOME_LIDERANCA };
  }
  const unidade = RS_UNIDADES.find((u) => emailDaUnidade(u.id) === user.email);
  if (unidade) {
    return { papel: "unidade", usuario: user.email, unidadeId: unidade.id, nome: unidade.nome };
  }
  return null;
}

/* Protege uma página: chama onOk(sessao) quando confirmar o papel
   esperado ("lideranca" ou "unidade"), ou redireciona pro login. */
export function exigirSessao(papelEsperado, onOk) {
  return onAuthStateChanged(auth, (user) => {
    const info = papelDoUsuario(user);
    if (!info || info.papel !== papelEsperado) {
      window.location.href = papelEsperado === "lideranca" ? "login-lideranca.html" : "login-unidade.html";
      return;
    }
    onOk(info);
  });
}

export async function trocarSenha(senhaAtual, senhaNova) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sessão expirada. Saia e entre novamente.");
  if (senhaNova.length < 6) throw new Error("A nova senha precisa ter pelo menos 6 caracteres.");
  const credencial = EmailAuthProvider.credential(user.email, senhaAtual);
  await reauthenticateWithCredential(user, credencial);
  await updatePassword(user, senhaNova);
}

/* Aplica uma troca de senha já aprovada pela liderança — chamada
   logo após um login bem-sucedido (a sessão está "recente", o
   Firebase não exige reautenticar de novo nesse momento). */
export function aplicarSenhaAprovada(senhaNova) {
  return updatePassword(auth.currentUser, senhaNova);
}

export function mensagemErroFirebase(err) {
  const codigo = err && err.code;
  const mapa = {
    "auth/invalid-credential": "Usuário ou senha incorretos.",
    "auth/invalid-login-credentials": "Usuário ou senha incorretos.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/user-not-found": "Conta não encontrada. Ela já foi criada no Firebase?",
    "auth/too-many-requests": "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.",
    "auth/network-request-failed": "Sem conexão com a internet.",
    "auth/invalid-api-key": "O site ainda não foi configurado com as chaves do Firebase.",
  };
  return mapa[codigo] || (err && err.message) || "Não foi possível entrar. Tente novamente.";
}
