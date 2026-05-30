<template>
  <div
    class="relative grid min-h-[100dvh] w-full place-items-center overflow-y-auto overflow-x-hidden px-4 py-10 text-white"
  >
    <div
      aria-hidden
      class="absolute inset-0 pointer-events-none animated-gradient-bg"
    />

    <div
      class="relative z-10 flex flex-col items-center w-full max-w-md p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
    >
      <h1 class="mb-2 text-2xl font-extrabold tracking-tight text-emerald-300">
        Verificación
      </h1>

      <p class="w-full text-sm text-white/70">
        La verificación de correo se gestiona en AWS Cognito (Hosted UI). Si
        acabas de registrarte, completa el flujo en Cognito y vuelve a iniciar
        sesión aquí.
      </p>

      <div
        v-if="error"
        class="w-full p-4 mt-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
      >
        <div class="text-sm font-semibold text-rose-100">{{ error }}</div>
      </div>

      <button
        type="button"
        :disabled="loading"
        class="w-full mt-6 rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        @click="onLogin"
      >
        {{ loading ? "Abriendo…" : "Abrir login" }}
      </button>

      <button
        class="mt-6 text-sm underline transition text-sky-300 hover:text-sky-200"
        type="button"
        @click="$emit('back')"
      >
        Volver
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { startLoginRedirect } from "../services/cognitoAuth";

defineEmits(["back"]);

const loading = ref(false);
const error = ref("");

async function onLogin() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    await startLoginRedirect({ screen: "login" });
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    loading.value = false;
  }
}
</script>
