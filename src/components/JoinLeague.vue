<template>
  <BasePage>
    <div class="w-full max-w-lg mx-auto">
      <div
        class="p-6 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl"
      >
        <div class="pt-2">
          <h1 class="text-2xl font-extrabold tracking-tight text-emerald-300">
            Unirme a una liga
          </h1>
          <p class="mt-0.5 text-sm text-white/60">
            En SportClash, la entrada se hace por solicitud. El owner/admin la
            aprueba.
          </p>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="onSubmit">
          <div
            class="p-3 text-sm border rounded-xl border-white/10 bg-black/20 text-white/70"
          >
            Hemos eliminado los códigos. Para unirte a una liga (pública o
            privada) se hará mediante una solicitud, y el admin aprobará la
            entrada.
          </div>

          <div
            v-if="error"
            class="p-3 text-sm border rounded-xl border-rose-400/20 bg-rose-500/10 text-rose-100"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            class="w-full rounded-xl bg-emerald-300 py-3 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
            :disabled="busy"
          >
            {{ busy ? "Procesando…" : "Entendido" }}
          </button>

          <button
            type="button"
            class="w-full py-3 text-sm font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
            @click="$emit('back')"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  </BasePage>
</template>

<script setup>
import { ref } from "vue";
import BasePage from "./BasePage.vue";
import { toast } from "../services/toasts";
const emit = defineEmits(["back", "joined"]);
const busy = ref(false);
const error = ref("");

async function onSubmit() {
  error.value = "";
  busy.value = true;
  try {
    emit("joined", null);
    toast.success(
      "Perfecto. Vuelve a Ligas y abre la liga para solicitar unirte.",
    );
  } catch (e) {
    error.value = e?.message || "No se pudo unir";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }
}
</script>
