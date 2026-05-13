<template>
  <div
    class="relative grid min-h-[100dvh] w-full place-items-center overflow-y-auto overflow-x-hidden px-4 py-10 text-white animated-gradient-bg"
  >
    <!-- Fondo animado -->
    <div
      aria-hidden
      class="absolute inset-0 pointer-events-none animated-gradient-bg"
    />

    <form
      @submit.prevent="onSubmit"
      class="relative z-10 flex flex-col items-center w-full max-w-md p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
    >
      <h1 class="mb-2 text-2xl font-extrabold tracking-tight text-emerald-300">
        SportClash
      </h1>
      <div class="w-full mb-5">
        <h2 class="mb-1 text-xl font-bold tracking-tight text-white">Login</h2>
        <p class="mt-1 text-sm text-white/60">Entra para ver el reto.</p>
      </div>

      <!-- Email y Password mejorados -->
      <div class="flex flex-col w-full gap-2 mb-2">
        <label class="text-xs text-white/60" for="login-email">Email</label>
        <input
          id="login-email"
          v-model="email"
          inputmode="email"
          enterkeyhint="next"
          @keydown.enter.prevent="focusPass"
          class="px-3 py-2 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
          placeholder="tu@gmail.com"
          autocomplete="email"
        />
      </div>
      <div class="flex flex-col w-full gap-2 mb-2">
        <label class="text-xs text-white/60" for="login-pass">Contraseña</label>
        <div class="relative flex items-center">
          <input
            id="login-pass"
            ref="passInput"
            v-model="pass"
            :type="showPass ? 'text' : 'password'"
            enterkeyhint="go"
            @keydown.enter.prevent="onSubmit"
            class="w-full px-3 py-2 pr-10 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
            placeholder="••••••••"
            autocomplete="current-password"
          />
          <button
            type="button"
            @click="showPass = !showPass"
            class="absolute text-gray-400 -translate-y-1/2 right-2 top-1/2 focus:outline-none"
            tabindex="-1"
          >
            <template v-if="!showPass">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                  stroke="#a78bfa"
                  stroke-width="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="#a78bfa"
                  stroke-width="2"
                />
              </svg>
            </template>
            <template v-else>
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="#a78bfa" stroke-width="2" />
                <path
                  d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42"
                  stroke="#a78bfa"
                  stroke-width="2"
                />
                <path
                  d="M9.88 5.08A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a17.64 17.64 0 0 1-3.06 4.3"
                  stroke="#a78bfa"
                  stroke-width="2"
                />
                <path
                  d="M6.11 6.11C3.61 8.05 2 12 2 12s3.5 7 10 7c1.2 0 2.32-.2 3.35-.55"
                  stroke="#a78bfa"
                  stroke-width="2"
                />
              </svg>
            </template>
          </button>
        </div>
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
          >Recuérdame</label
        >
      </div>

      <!-- Error box -->
      <div
        v-if="error"
        class="p-4 mb-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 text-lg">⚠️</div>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-rose-100">
              {{ error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <button
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
        {{ loading ? "Entrando..." : "Entrar" }}
      </button>

      <!-- Social Login -->
      <div class="flex flex-row justify-center w-full gap-6 mt-6">
        <button
          type="button"
          @click="loginWithGoogle"
          :disabled="loading"
          class="flex items-center justify-center p-3 transition rounded-full shadow bg-white/90 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <IconGoogle class="w-7 h-7" />
        </button>
        <button
          type="button"
          @click="loginWithFacebook"
          :disabled="loading"
          class="flex items-center justify-center rounded-full bg-[#1877f2] hover:bg-[#145db2] shadow p-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <IconFacebook class="w-7 h-7" />
        </button>
        <button
          type="button"
          @click="loginWithMicrosoft"
          :disabled="loading"
          class="flex items-center justify-center rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] shadow p-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <IconMicrosoft class="w-7 h-7" />
        </button>
        <button
          type="button"
          @click="loginWithDiscord"
          :disabled="loading"
          class="flex items-center justify-center rounded-full bg-[#5865F2] hover:bg-[#404eed] shadow p-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <IconDiscord class="w-7 h-7" />
        </button>
      </div>
      <div class="flex flex-col items-center w-full gap-1 mt-6">
        <span class="text-sm text-white/70">
          ¿No tienes cuenta?
          <a
            href="#"
            @click.prevent="$emit('register')"
            class="underline transition text-emerald-300 hover:text-emerald-200"
            >Crear cuenta</a
          >
        </span>
        <a
          href="#"
          @click.prevent="$emit('forgot-password')"
          class="mt-1 text-sm underline transition text-sky-300 hover:text-sky-200"
          >¿Olvidaste tu contraseña?</a
        >
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, h } from "vue";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { group, groupEnd, error as logError } from "../services/logger";

async function loginWithPopup(provider, label) {
  if (loading.value) return;
  loading.value = true;
  error.value = "";

  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // Si el navegador bloquea popups, usamos redirect como fallback.
    if (
      e?.code === "auth/popup-blocked" ||
      e?.code === "auth/popup-closed-by-user"
    ) {
      try {
        sessionStorage.setItem("sportclash:authRedirectPending", "1");
        sessionStorage.setItem("sportclash:authRedirectProvider", label);
      } catch {
        // ignore
      }

      await signInWithRedirect(auth, provider);
      return;
    }

    group("Auth", `${label} signInWithPopup failed`, {
      code: e?.code,
      message: e?.message,
      customData: e?.customData,
      email: e?.customData?.email,
    });
    logError("Auth", "error", e);
    groupEnd();

    const code = e?.code ? `${e.code} - ` : "";
    let hint = "";
    if (e?.code === "auth/unauthorized-domain") {
      hint =
        "\n\nPista: añade tu dominio en Firebase Console → Authentication → Settings → Authorized domains.";
    }
    if (e?.code === "auth/popup-blocked") {
      hint =
        "\n\nPista: el navegador ha bloqueado el popup. Permite popups para este sitio (o se intentará redirect).";
    }
    if (e?.code === "auth/operation-not-allowed") {
      hint =
        "\n\nPista: activa este proveedor en Firebase Console → Authentication → Sign-in method.";
    }
    error.value = `Error con ${label}: ${code}${e?.message || e}${hint}`;
  }

  loading.value = false;
}

const email = ref("");
const pass = ref("");
const remember = ref(true);
const loading = ref(false);
const showPass = ref(false);
const error = ref("");
const passInput = ref(null);

// Iconos SVG como componentes render function
const IconGoogle = (props, { attrs }) =>
  h("svg", { ...attrs, viewBox: "0 0 48 48", "aria-hidden": "true" }, [
    h("path", {
      fill: "#EA4335",
      d: "M24 9.5c3.54 0 6.74 1.23 9.27 3.65l6.9-6.9C36.08 2.39 30.46 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.02 6.23C12.57 13.1 17.86 9.5 24 9.5z",
    }),
    h("path", {
      fill: "#4285F4",
      d: "M46.5 24.5c0-1.57-.14-3.08-.41-4.54H24v9.07h12.67c-.55 2.95-2.2 5.45-4.68 7.14l7.17 5.56C43.3 38.17 46.5 31.9 46.5 24.5z",
    }),
    h("path", {
      fill: "#FBBC05",
      d: "M10.58 28.45c-.5-1.48-.78-3.06-.78-4.7s.28-3.22.78-4.7l-8.02-6.23C.92 15.6 0 19.68 0 23.75s.92 8.15 2.56 11.93l8.02-6.23z",
    }),
    h("path", {
      fill: "#34A853",
      d: "M24 47.5c6.46 0 12.08-2.13 16.16-5.77l-7.17-5.56c-1.99 1.34-4.54 2.13-8.99 2.13-6.14 0-11.43-3.6-13.42-8.75l-8.02 6.23C6.51 42.62 14.62 47.5 24 47.5z",
    }),
  ]);

const IconFacebook = (props, { attrs }) =>
  h("svg", { ...attrs, viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("path", {
      fill: "currentColor",
      d: "M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07C2 17.09 5.66 21.2 10.44 22v-7.03H7.9v-2.9h2.54V9.84c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22C18.34 21.2 22 17.09 22 12.07z",
    }),
  ]);

const IconDiscord = (props, { attrs }) =>
  h("svg", { ...attrs, viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("path", {
      fill: "currentColor",
      d: "M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.249.077.077 0 00-.079-.037 19.736 19.736 0 00-4.885 1.515.07.07 0 00-.032.027C.533 9.045-.32 13.579.099 18.057a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.041-.105 13.14 13.14 0 01-1.872-.9.077.077 0 01-.008-.127c.126-.094.252-.192.371-.291a.074.074 0 01.077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.009c.119.099.245.198.372.292a.077.077 0 01-.006.127 12.3 12.0 0 01-1.873.899.076.076 0 00-.04.106c.36.698.772 1.363 1.225 1.993a.077.077 0 00.084.028 19.852 19.852 0 006.002-3.03.077.077 0 00.032-.055c.5-5.177-.838-9.673-3.548-13.662a.061.061 0 00-.031-.028zM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.955 2.419-2.157 2.419zm7.975 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.211 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z",
    }),
  ]);

const IconMicrosoft = (props, { attrs }) =>
  h("svg", { ...attrs, viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("path", { fill: "#F25022", d: "M2 2h10v10H2z" }),
    h("path", { fill: "#7FBA00", d: "M12 2h10v10H12z" }),
    h("path", { fill: "#00A4EF", d: "M2 12h10v10H2z" }),
    h("path", { fill: "#FFB900", d: "M12 12h10v10H12z" }),
  ]);

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/>
  </filter>
  <rect width='100%25' height='100%25' filter='url(%23n)'/>
</svg>`;
const noiseStyle = computed(() => ({
  backgroundImage: `url("data:image/svg+xml;utf8,${NOISE_SVG}")`,
}));

function focusPass() {
  nextTick(() => {
    passInput.value?.focus?.();
  });
}

function onSubmit() {
  // Aquí puedes poner la lógica de login con email/pass usando Firebase si quieres
  // Por ahora, solo demo
  loading.value = true;
  error.value = "";
  setTimeout(() => {
    loading.value = false;
    error.value =
      "Funcionalidad de login con email y contraseña aún no implementada.";
  }, 800);
}

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  await loginWithPopup(provider, "Google");
}

async function loginWithFacebook() {
  const provider = new FacebookAuthProvider();
  await loginWithPopup(provider, "Facebook");
}

async function loginWithMicrosoft() {
  const provider = new OAuthProvider("microsoft.com");
  await loginWithPopup(provider, "Microsoft");
}

async function loginWithDiscord() {
  const provider = new OAuthProvider("oidc.discord");
  await loginWithPopup(provider, "Discord");
}
</script>

<style scoped>
/* No custom styles needed, todo con Tailwind y SVG animado */
@keyframes float1 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(18px, 10px);
  }
}
@keyframes float2 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-16px, 12px);
  }
}
@keyframes float3 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(10px, -14px);
  }
}
@keyframes fondo-ola {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: 1000px;
  }
}

.fondo-animado {
  animation: fondo-ola 10s linear infinite; /* Quita alternate o alternate-reverse */
}
</style>
