<template>
  <div
    class="relative grid min-h-[100dvh] w-full place-items-center overflow-y-auto overflow-x-hidden px-4 py-10 text-white"
  >
    <div
      aria-hidden
      class="absolute inset-0 pointer-events-none animated-gradient-bg"
    />

    <form
      @submit.prevent="enviarDatos"
      class="relative z-10 flex flex-col items-center w-full max-w-md p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
    >
      <h1 class="mb-2 text-2xl font-extrabold tracking-tight text-emerald-300">
        SportClash
      </h1>
      <div class="w-full mb-5">
        <h2 class="mb-1 text-xl font-bold tracking-tight text-white">
          Completa tus datos
        </h2>
        <p class="mt-1 text-sm text-white/60">
          Solo es un paso rápido para terminar de configurar tu perfil.
        </p>
      </div>

      <div class="flex flex-col w-full gap-2 mb-3">
        <label class="text-xs text-white/60" for="nombre">Nombre</label>
        <input
          id="nombre"
          v-model.trim="nombre"
          type="text"
          class="px-3 py-2 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
          placeholder="Tu nombre"
          autocomplete="given-name"
          required
        />
      </div>

      <div class="flex flex-col w-full gap-2 mb-3">
        <label class="text-xs text-white/60" for="apodo">Apodo</label>
        <input
          id="apodo"
          v-model.trim="apodo"
          type="text"
          class="px-3 py-2 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
          placeholder="Cómo te verán los demás"
          autocomplete="nickname"
          required
        />
      </div>

      <div class="flex flex-col w-full gap-2 mb-4">
        <label class="text-xs text-white/60" for="fechaNacimiento"
          >Fecha de nacimiento</label
        >
        <input
          id="fechaNacimiento"
          v-model="fechaNacimiento"
          type="date"
          class="px-3 py-2 text-base text-white border outline-none rounded-xl border-white/10 bg-black/20 placeholder:text-white/40 focus:border-emerald-300/30 focus:ring-2 focus:ring-emerald-300/10 sm:text-sm"
          required
        />
      </div>

      <div
        v-if="error"
        class="w-full p-4 mb-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
      >
        <div class="text-sm font-semibold text-rose-100">
          {{ error }}
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
        {{ loading ? "Guardando..." : "Guardar y continuar" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const emit = defineEmits(["done"]);

const nombre = ref("");
const apodo = ref("");
const fechaNacimiento = ref("");
const loading = ref(false);
const error = ref("");

const enviarDatos = async () => {
  loading.value = true;
  error.value = "";
  try {
    const user = auth.currentUser;
    if (!user?.uid) throw new Error("No hay usuario autenticado");

    // Guardamos perfil + marca de perfil completado.
    await setDoc(
      doc(db, "users", user.uid),
      {
        nombre: nombre.value,
        apodo: apodo.value,
        fechaNacimiento: fechaNacimiento.value,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // Fallback local para que con F5 no se repita aunque Firestore falle.
    try {
      localStorage.setItem(`sportclash:profileCompleted:${user.uid}`, "1");
    } catch {
      // ignore
    }

    loading.value = false;
    emit("done");
  } catch (e) {
    error.value = e?.message || "Error al guardar los datos";
    loading.value = false;
  }
};
</script>
