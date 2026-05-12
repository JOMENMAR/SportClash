<template>
  <BasePage>
    <div class="w-full max-w-lg mx-auto">
      <div
        class="p-6 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl"
      >
        <div class="pt-2">
          <h1 class="text-2xl font-extrabold tracking-tight text-emerald-300">
            Crear liga
          </h1>
          <p class="mt-0.5 text-sm text-white/60">
            Pública o privada, y con un límite de puntos diarios para el torneo.
          </p>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="text-sm text-white/70">Nombre</label>
            <input
              v-model.trim="name"
              type="text"
              class="w-full px-4 py-3 mt-1 text-sm text-white rounded-xl bg-white/10 placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              placeholder="Ej: Los del Gym"
              required
            />
          </div>

          <div>
            <label class="text-sm text-white/70">Visibilidad</label>
            <div class="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
              <button
                type="button"
                class="px-4 py-3 text-sm font-semibold transition rounded-xl ring-1"
                :class="
                  visibility === 'public'
                    ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
                    : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
                "
                @click="visibility = 'public'"
              >
                Pública
                <div class="mt-1 text-xs font-normal opacity-80">
                  Aparece en “Explorar”.
                </div>
              </button>

              <button
                type="button"
                class="px-4 py-3 text-sm font-semibold transition rounded-xl ring-1"
                :class="
                  visibility === 'private'
                    ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
                    : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
                "
                @click="visibility = 'private'"
              >
                Privada
                <div class="mt-1 text-xs font-normal opacity-80">
                  Solo con código.
                </div>
              </button>
            </div>
          </div>

          <div>
            <label class="text-sm text-white/70">
              Límite de puntos diarios (por usuario)
            </label>
            <input
              v-model.number="dailyPointsLimit"
              type="number"
              min="1"
              max="50"
              step="1"
              class="w-full px-4 py-3 mt-1 text-sm text-white rounded-xl bg-white/10 placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              required
            />
            <p class="mt-1 text-xs text-white/50">
              Esto limitará cuántos puntos puede registrar un usuario al día en
              esta liga.
            </p>
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
            {{ busy ? "Creando…" : "Crear liga" }}
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
import { useLeaguesStore } from "../services/leaguesStore";
import BasePage from "./BasePage.vue";
import { toast } from "../services/toasts";

const emit = defineEmits(["back", "created"]);
const store = useLeaguesStore();

const name = ref("");
const visibility = ref("public");
const dailyPointsLimit = ref(5);

const busy = ref(false);
const error = ref("");

async function onSubmit() {
  error.value = "";

  const limit = Number(dailyPointsLimit.value);
  if (!Number.isFinite(limit) || limit < 1) {
    error.value = "El límite diario debe ser 1 o más";
    toast.warning(error.value);
    return;
  }

  busy.value = true;
  try {
    const league = await store.createLeague({
      name: name.value,
      visibility: visibility.value,
      dailyPointsLimit: limit,
    });
    toast.success("Liga creada");
    emit("created", league);
  } catch (e) {
    error.value = e?.message || "No se pudo crear la liga";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }
}
</script>
