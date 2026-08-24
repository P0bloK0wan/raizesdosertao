/* =========================================================
   Configuração do Firebase.

   Troque os valores de firebaseConfig pelos do SEU projeto —
   veja o passo a passo completo no README.md ("Configurar o
   Firebase"). Esses valores NÃO são segredo: é normal e seguro
   eles aparecerem no código de um site Firebase — quem protege
   os dados de verdade são as regras do Firestore (firestore.rules),
   não esconder essas chaves.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "COLE_AQUI_A_API_KEY",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI_O_PROJECT_ID",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

export const firebaseConfigurado = firebaseConfig.apiKey !== "COLE_AQUI_A_API_KEY";

export const app = initializeApp(
  firebaseConfigurado ? firebaseConfig : { ...firebaseConfig, apiKey: "demo-key", projectId: "raizes-do-sertao-demo" }
);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* Modo de testes com o emulador local do Firebase — só ativa se
   a página for aberta com ?emulator=1 na URL. Não afeta o site
   publicado normalmente. */
if (typeof location !== "undefined" && new URLSearchParams(location.search).has("emulator")) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
