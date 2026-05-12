<template>
  <div
    class="relative grid min-h-[100dvh] w-full place-items-center overflow-y-auto overflow-x-hidden px-4 py-10 text-white animated-gradient-bg"
  >
    <div
      aria-hidden
      class="absolute inset-0 pointer-events-none animated-gradient-bg"
    />

    <div
      class="relative z-10 flex flex-col items-center w-full max-w-md p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
    >
      <h1 class="mb-2 text-2xl font-extrabold tracking-tight text-emerald-300">
        Verifica tu correo
      </h1>

      <p class="w-full text-sm text-white/70">
        Te enviamos un correo a
        <span class="font-semibold">{{ emailLabel }}</span
        >. Abre el correo, pulsa el enlace de verificación, y luego vuelve aquí
        y pulsa <span class="font-semibold">"Ya verifiqué"</span>.
      </p>

      <div
        v-if="info"
        class="w-full p-4 mt-4 border rounded-2xl border-sky-400/20 bg-sky-500/10"
      >
        <div class="text-sm font-semibold text-sky-100">{{ info }}</div>
      </div>

      <div
        v-if="error"
        class="w-full p-4 mt-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
      >
        <div class="text-sm font-semibold text-rose-100">{{ error }}</div>
      </div>

      <div class="flex w-full gap-3 mt-6">
        <button
          :disabled="loading"
          @click="onReload"
          class="flex-1 rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {{ loading ? "Comprobando..." : "Ya verifiqué" }}
        </button>

        <button
          :disabled="resendLoading"
          @click="onResend"
          class="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {{ resendLoading ? "Enviando..." : "Reenviar" }}
        </button>
      </div>

      <button
        class="mt-6 text-sm underline transition text-sky-300 hover:text-sky-200"
        type="button"
        @click="$emit('back')"
      >
        Volver
      </button>

      <p class="w-full mt-4 text-xs text-white/50">
        Nota: Firebase Email Verification no usa un "código" numérico de 6
        dígitos por defecto, sino un enlace seguro enviado por email. Para OTP
        real por email hay que montar backend.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { auth } from "../firebase";
import { sendEmailVerification, reload } from "firebase/auth";
import { toast } from "../services/toasts";

const emit = defineEmits(["verified", "back"]);

const loading = ref(false);
const resendLoading = ref(false);
const error = ref("");
const info = ref("");

const emailLabel = computed(() => auth.currentUser?.email ?? "tu email");

async function onResend() {
  error.value = "";
  info.value = "";
  resendLoading.value = true;
  try {
    if (!auth.currentUser) throw new Error("No hay usuario autenticado.");
    await sendEmailVerification(auth.currentUser);
    info.value = "Email reenviado. Revisa tu bandeja de entrada y spam.";
    toast.success(info.value);
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    toast.error(error.value);
  } finally {
    resendLoading.value = false;
  }
}

async function onReload() {
  error.value = "";
  info.value = "";
  loading.value = true;
  try {
    if (!auth.currentUser) throw new Error("No hay usuario autenticado.");
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      toast.success("Email verificado");
      emit("verified");
      return;
    }
    error.value =
      "Aún no está verificado. Abre el email y vuelve a intentarlo.";
    toast.warning(error.value);
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

let timer;
onMounted(() => {
  // Auto-check cada 5s (solo UX)
  timer = setInterval(async () => {
    if (!auth.currentUser) return;
    if (auth.currentUser.emailVerified) return;
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) emit("verified");
  }, 5000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
