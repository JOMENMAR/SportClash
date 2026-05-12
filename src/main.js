import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

// Dev-only: helper para depurar permission-denied rápidamente desde la consola.
// En el navegador, ejecuta: await window.__debugFirestoreReads?.()
if (import.meta.env.DEV) {
  import("./debugFirestoreReads.js");
}

createApp(App).mount("#app");
