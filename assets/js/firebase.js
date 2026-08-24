/* =========================================================
   Configuração do Firebase — projeto Raízes do Sertão.

   Esses valores NÃO são segredo: é normal e seguro eles
   aparecerem no código de um site Firebase — quem protege os
   dados de verdade são as regras do Firestore (firestore.rules),
   não esconder essas chaves.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBPqAi0WzOzACn-heh6tNo73cdhzTaWjDA",
  authDomain: "raizes-do-sertao-7d82c.firebaseapp.com",
  projectId: "raizes-do-sertao-7d82c",
  storageBucket: "raizes-do-sertao-7d82c.firebasestorage.app",
  messagingSenderId: "983565125063",
  appId: "1:983565125063:web:2611f8afd77d652b8505e2",
};

export const firebaseConfigurado = true;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* Modo de testes com o emulador local do Firebase — só ativa se
   a página for aberta com ?emulator=1 na URL. Não afeta o site
   publicado normalmente. */
if (typeof location !== "undefined" && new URLSearchParams(location.search).has("emulator")) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
