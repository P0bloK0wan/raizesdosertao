import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getAuth,
@@ -28,7 +16,7 @@ import {


/* =========================================================
   CONFIGURAÇÃO DO PROJETO FIREBASE
   CONFIGURAÇÃO DO PROJETO
   ========================================================= */

export const firebaseConfig = {
@@ -41,6 +29,64 @@ export const firebaseConfig = {
};


/* =========================================================
   STATUS
   ========================================================= */

export const firebaseConfigurado = true;


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);


/* =========================================================
   EMULADORES LOCAIS

   Ativação:

   http://localhost:5500/?emulator=1

   O modo normal do site NÃO usa emuladores.
   ========================================================= */

const usandoEmulador =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("emulator") === "1";


if (usandoEmulador) {

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

  console.log("Firebase Emulator ativado.");

}  projectId: "raizes-do-sertao-7d82c",
  storageBucket: "raizes-do-sertao-7d82c.firebasestorage.app",
  messagingSenderId: "983565125063",
  appId: "1:983565125063:web:2611f8afd77d652b8505e2"
};


/* =========================================================
   VERIFICAÇÃO DA CONFIGURAÇÃO
   ========================================================= */
