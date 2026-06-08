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
        class="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
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
            class="flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            @click="onSocial(item.provider, item.scopes)"
            :title="item.label"
          >
            <span class="sr-only">{{ item.label }}</span>

            <svg
              v-if="item.key === 'microsoft'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="8" height="8" fill="#F35325" />
              <rect x="13" y="3" width="8" height="8" fill="#81BC06" />
              <rect x="3" y="13" width="8" height="8" fill="#05A6F0" />
              <rect x="13" y="13" width="8" height="8" fill="#FFBA08" />
            </svg>

            <svg
              v-else-if="item.key === 'google'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M21.6 12.23c0-.72-.06-1.25-.2-1.8H12v3.42h5.52c-.11.85-.7 2.12-2 2.98l-.02.11 2.9 2.25.2.02c1.86-1.72 2.94-4.25 2.94-7Z"
                fill="#4285F4"
              />
              <path
                d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.14-2.43c-.84.59-1.97 1-3.47 1a5.99 5.99 0 0 1-5.67-4.14l-.1.01-3.02 2.34-.03.1A9.99 9.99 0 0 0 12 22Z"
                fill="#34A853"
              />
              <path
                d="M6.33 13.98A6.3 6.3 0 0 1 6 12c0-.69.12-1.35.32-1.98l-.01-.13-3.05-2.38-.1.05A10 10 0 0 0 2 12c0 1.6.38 3.1 1.06 4.43l3.27-2.45Z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.88c1.9 0 3.18.82 3.91 1.5l2.86-2.79C16.95 2.9 14.7 2 12 2a9.99 9.99 0 0 0-8.84 5.56l3.16 2.46A5.99 5.99 0 0 1 12 5.88Z"
                fill="#EA4335"
              />
            </svg>

            <svg
              v-else-if="item.key === 'facebook'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.43H7.08v-3.5h3.05V9.4c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.98h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.5h-2.79V24C19.6 23.1 24 18.1 24 12.07Z"
                fill="#1877F2"
              />
            </svg>

            <svg
              v-else-if="item.key === 'discord'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.8l-.24.44a13.82 13.82 0 0 1 4.12 2.02 13.28 13.28 0 0 0-4.14-2.09 18.67 18.67 0 0 0-6.28 0 13.39 13.39 0 0 0-4.16 2.1A13.89 13.89 0 0 1 8.85 3.2l-.24-.43a19.75 19.75 0 0 0-4.94 1.6C.52 9.05-.31 13.6.1 18.08a19.9 19.9 0 0 0 6.06 3.08l.49-.8a12.97 12.97 0 0 1-1.95-.96c.16.12.33.23.5.34 3.76 2.18 7.84 2.18 11.56 0 .17-.1.34-.22.5-.34a12.97 12.97 0 0 1-1.95.96l.49.8a19.87 19.87 0 0 0 6.06-3.08c.5-5.2-.86-9.71-1.54-13.71Zm-12.4 11.36c-1.16 0-2.1-1.07-2.1-2.39 0-1.32.93-2.39 2.1-2.39s2.1 1.07 2.1 2.4c0 1.31-.93 2.38-2.1 2.38Zm8.16 0c-1.16 0-2.1-1.07-2.1-2.39 0-1.32.93-2.39 2.1-2.39s2.1 1.07 2.1 2.4c0 1.31-.94 2.38-2.1 2.38Z"
                fill="#5865F2"
              />
            </svg>

            <span v-else>{{ item.label }}</span>
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
