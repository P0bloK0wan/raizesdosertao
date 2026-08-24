/* =========================================================
   Configuração do Firebase — projeto Raízes do Sertão

   Esses valores NÃO são segredo: é normal e seguro eles
   aparecerem no código de um site Firebase — quem protege os
   dados de verdade são as regras do Firestore, não esconder
   essas chaves.
   ========================================================= */


/* =========================================================
   IMPORTAÇÕES DO FIREBASE
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getAuth,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


/* =========================================================
   CONFIGURAÇÃO DO PROJETO FIREBASE
   ========================================================= */

export const firebaseConfig = {
  apiKey: "AIzaSyBPqAi0WzOzACn-heh6tNo73cdhzTaWjDA",
  authDomain: "raizes-do-sertao-7d82c.firebaseapp.com",
  projectId: "raizes-do-sertao-7d82c",
  storageBucket: "raizes-do-sertao-7d82c.firebasestorage.app",
  messagingSenderId: "983565125063",
  appId: "1:983565125063:web:2611f8afd77d652b8505e2"
};


/* =========================================================
   VERIFICAÇÃO DA CONFIGURAÇÃO
   ========================================================= */

export const firebaseConfigurado = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);


/* =========================================================
   INICIALIZAÇÃO DO FIREBASE
   ========================================================= */

export const app = initializeApp(firebaseConfig);


/* =========================================================
   FIREBASE AUTHENTICATION
   ========================================================= */

export const auth = getAuth(app);


/* =========================================================
   CLOUD FIRESTORE
   ========================================================= */

export const db = getFirestore(app);


/* =========================================================
   MODO EMULADOR LOCAL

   Para ativar, abra o site com:

   ?emulator=1

   Exemplo:

   http://localhost:5500/?emulator=1

   ou:

   http://127.0.0.1:5500/?emulator=1

   No site publicado normalmente, os emuladores NÃO serão usados.
   ========================================================= */

const usandoEmulador =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("emulator") === "1";


if (usandoEmulador) {

  try {

    connectAuthEmulator(
      auth,
      "http://127.0.0.1:9099",
      {
        disableWarnings: true
      }
    );


    connectFirestoreEmulator(
      db,
      "127.0.0.1",
      8080
    );


    console.log(
      "Firebase conectado aos emuladores locais."
    );

  } catch (erro) {

    console.warn(
      "Não foi possível conectar aos emuladores locais:",
      erro
    );

  }
}


/* =========================================================
   EXPORTAÇÃO FINAL

   Os seguintes itens podem ser importados em outros arquivos:

   import {
     app,
     auth,
     db,
     firebaseConfig,
     firebaseConfigurado
   } from "./firebase.js";

   ========================================================= */
