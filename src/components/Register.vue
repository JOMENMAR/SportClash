<template>
  <div
    class="relative grid min-h-[100dvh] w-full place-items-center overflow-y-auto overflow-x-hidden px-4 py-10 text-white"
  >
    <div
      aria-hidden
      class="absolute inset-0 pointer-events-none animated-gradient-bg"
    />

    <form
      @submit.prevent="onRegister"
      class="relative z-10 flex flex-col items-center w-full max-w-md p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
    >
      <h1 class="mb-2 text-2xl font-extrabold tracking-tight text-emerald-300">
        SportClash
      </h1>

      <div class="w-full mb-5">
        <h2 class="mb-1 text-xl font-bold tracking-tight text-white">
          Crear cuenta
        </h2>
        <p class="mt-1 text-sm text-white/60">
          Regístrate con email y contraseña. Luego tendrás que verificar tu
          correo.
        </p>
      </div>

      <div class="flex flex-col w-full gap-2 mb-2">
        <label class="text-xs text-white/60" for="reg-email">Email</label>
        <input
          id="reg-email"
          v-model.trim="email"
          inputmode="email"
          class="px-3 py-2 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
          placeholder="tu@email.com"
          autocomplete="email"
          required
        />
      </div>

      <div class="flex flex-col w-full gap-2 mb-2">
        <label class="text-xs text-white/60" for="reg-pass">Contraseña</label>
        <div class="relative flex items-center">
          <input
            id="reg-pass"
            v-model="pass"
            :type="showPass ? 'text' : 'password'"
            class="w-full px-3 py-2 pr-10 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            minlength="6"
            required
          />
          <button
            type="button"
            @click="showPass = !showPass"
            class="absolute text-gray-400 -translate-y-1/2 right-2 top-1/2 focus:outline-none"
            tabindex="-1"
          >
            <template v-if="!showPass">
              <EyeIcon class="w-5 h-5" />
            </template>
            <template v-else>
              <EyeSlashIcon class="w-5 h-5" />
            </template>
          </button>
        </div>
      </div>

      <div class="flex flex-col w-full gap-2 mb-4">
        <label class="text-xs text-white/60" for="reg-pass2"
          >Repetir contraseña</label
        >
        <input
          id="reg-pass2"
          v-model="pass2"
          type="password"
          class="px-3 py-2 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
          placeholder="Repite tu contraseña"
          autocomplete="new-password"
          minlength="6"
          required
        />
      </div>

      <div
        v-if="error"
        class="w-full p-4 mb-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
      >
        <div class="text-sm font-semibold text-rose-100">{{ error }}</div>
      </div>

      <button
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
        {{ loading ? "Creando..." : "Crear cuenta" }}
      </button>

      <button
        class="mt-6 text-sm underline transition text-sky-300 hover:text-sky-200"
        type="button"
        @click="$emit('back')"
      >
        Volver al login
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { toast } from "../services/toasts";
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";

const emit = defineEmits(["registered", "back"]);

const email = ref("");
const pass = ref("");
const pass2 = ref("");
const loading = ref(false);
const error = ref("");
const showPass = ref(false);

async function onRegister() {
  error.value = "";
  if (pass.value !== pass2.value) {
    error.value = "Las contraseñas no coinciden.";
    toast.warning(error.value);
    return;
  }

  loading.value = true;
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.value,
      pass.value,
    );
    await sendEmailVerification(cred.user);
    toast.success("Cuenta creada. Revisa tu correo para verificar.");
    emit("registered");
  } catch (e) {
    error.value = e?.message ? String(e.message) : String(e);
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>
