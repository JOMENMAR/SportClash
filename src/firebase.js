// Configuración de Firebase para SportClash
// Rellena los valores con los datos de tu proyecto desde la consola de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function mustEnv(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Crea un .env (ver .env.example).`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: mustEnv("VITE_FIREBASE_API_KEY"),
  authDomain: mustEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: mustEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: mustEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: mustEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: mustEnv("VITE_FIREBASE_APP_ID"),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
