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
        SportClash
      </h1>

      <div class="w-full mb-5">
        <h2 class="mb-1 text-xl font-bold tracking-tight text-white">Login</h2>
        <p class="mt-1 text-sm text-white/60">Inicia sesión con AWS Cognito.</p>
      </div>

      <div class="flex items-center w-full mb-4">
        <input
          type="checkbox"
          v-model="remember"
          id="remember"
          class="mr-2 accent-emerald-300"
        />
        <label
          for="remember"
          class="text-sm cursor-pointer select-none text-white/70"
        >
          Recuérdame
        </label>
      </div>

      <div
        v-if="error"
        class="w-full p-4 mb-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5">
            <ExclamationTriangleIcon class="w-5 h-5 text-rose-200" />
          </div>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-rose-100">
              {{ error }}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        @click="onLogin"
      >
        {{ loading ? "Abriendo…" : "Entrar" }}
      </button>

      <button
        type="button"
        :disabled="loading"
        class="w-full mt-3 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        @click="onSignup"
      >
        {{ loading ? "Abriendo…" : "Crear cuenta" }}
      </button>

      <div v-if="socialProviders.length" class="w-full mt-5">
        <div class="flex items-center gap-3 mb-3 text-xs text-white/50">
          <div class="h-px flex-1 bg-white/10" />
          <span>o continúa con</span>
          <div class="h-px flex-1 bg-white/10" />
        </div>

        <div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            v-for="item in socialProviders"
            :key="item.key"
            type="button"
            :disabled="loading"
            class="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            @click="onSocial(item.provider, item.scopes)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="w-full mt-5 text-xs text-white/50">
        Nota: el registro, verificación y recuperación de contraseña se
        gestionan en Cognito.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { setRememberChoice, startLoginRedirect } from "../services/cognitoAuth";
import { getCognitoIdpConfig } from "../services/appConfig";

const remember = ref(true);
const loading = ref(false);
const error = ref("");

const idpCfg = getCognitoIdpConfig();
const socialProviders = computed(() => {
  const providers = [
    {
      key: "microsoft",
      label: "Microsoft",
      provider: String(idpCfg.microsoft || "").trim(),
      scopes: String(idpCfg.microsoftScopes || "").trim(),
    },
    {
      key: "google",
      label: "Google",
      provider: String(idpCfg.google || "").trim(),
      scopes: String(idpCfg.googleScopes || "").trim(),
    },
    {
      key: "facebook",
      label: "Facebook",
      provider: String(idpCfg.facebook || "").trim(),
      scopes: String(idpCfg.facebookScopes || "").trim(),
    },
    {
      key: "discord",
      label: "Discord",
      provider: String(idpCfg.discord || "").trim(),
      scopes: String(idpCfg.discordScopes || "").trim(),
    },
  ];
  return providers.filter((p) => p.provider);
});

onMounted(() => {
  setRememberChoice(remember.value);
});

async function onLogin() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    setRememberChoice(remember.value);
    await startLoginRedirect({ screen: "login", remember: remember.value });
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    loading.value = false;
  }
}

async function onSignup() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    setRememberChoice(remember.value);
    await startLoginRedirect({ screen: "signup", remember: remember.value });
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    loading.value = false;
  }
}

async function onSocial(provider, scopes = "") {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    setRememberChoice(remember.value);
    await startLoginRedirect({
      provider,
      scopes,
      remember: remember.value,
    });
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    loading.value = false;
  }
}
</script>
