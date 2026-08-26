/* =========================================================
   FIREBASE — RAÍZES DO SERTÃO
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getAuth,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


/* =========================================================
   CONFIGURAÇÃO
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
   FIREBASE
   ========================================================= */

export const firebaseConfigurado = true;

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);


/* =========================================================
   EMULADOR LOCAL
   ========================================================= */

const usandoEmulador =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("emulator");


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

    console.log("Firebase Emulator ativado.");

  } catch (erro) {

    console.warn(
      "Erro ao conectar aos emuladores:",
      erro
    );

  }

}
