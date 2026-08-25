/* =========================================================
   Firebase — Raízes do Sertão
   ========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


/* =========================================================
   CONFIGURAÇÃO DO FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBPqAi0WzOzACn-heh6tNo73cdhzTaWjDA",

  authDomain: "raizes-do-sertao-7d82c.firebaseapp.com",

  projectId: "raizes-do-sertao-7d82c",

  storageBucket: "raizes-do-sertao-7d82c.firebasestorage.app",

  messagingSenderId: "983565125063",

  appId: "1:983565125063:web:2611f8afd77d652b8505e2"
};


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
