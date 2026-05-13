<template>
  <BasePage>
    <div class="w-full max-w-5xl mx-auto">
      <header
        class="flex flex-col gap-3 p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div class="min-w-0">
            <h1
              class="text-2xl font-extrabold leading-none tracking-tight text-emerald-300"
            >
              Ligas
            </h1>
            <p class="mt-0 text-sm leading-snug text-white/60">
              Tus ligas (públicas y privadas) y ligas públicas globales.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              class="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
              @click="$emit('create')"
            >
              Crear liga
            </button>
          </div>
        </div>
      </header>

      <main
        class="p-5 mt-6 border rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <div
          v-if="store.state.loading"
          class="p-4 border rounded-2xl border-white/10 bg-black/20"
        >
          <div class="text-sm text-white/70">Cargando ligas…</div>
        </div>

        <div
          v-else-if="store.state.error"
          class="p-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
        >
          <div class="text-sm font-semibold text-rose-100">
            {{ store.state.error }}
          </div>
          <button
            type="button"
            class="px-4 py-2 mt-3 text-sm font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
            @click="store.refresh()"
          >
            Reintentar
          </button>
        </div>

        <div v-else>
          <template v-if="showPublicFirst">
            <section>
              <div class="flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold tracking-tight text-white">
                    Explorar ligas públicas
                  </h2>
                  <p class="mt-0.5 text-sm text-white/60">
                    Listado global (solo públicas).
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                <article
                  v-for="league in publicLeagues"
                  :key="league.id"
                  class="p-4 border rounded-2xl border-white/10 bg-black/20"
                >
                  <div class="text-xs text-white/60">
                    Pública · {{ league.membersCount ?? 0 }} miembros
                  </div>
                  <div class="mt-1 text-base font-semibold text-white">
                    {{ league.name }}
                  </div>

                  <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div
                      class="p-3 border rounded-xl border-white/10 bg-black/20"
                    >
                      <div class="text-xs text-white/60">Límite diario</div>
                      <div class="mt-1 font-semibold">
                        {{ league.dailyPointsLimit }} pts
                      </div>
                    </div>
                  </div>

                  <div class="mt-3">
                    <button
                      v-if="isInMyLeagues(league)"
                      type="button"
                      class="w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                      @click="$emit('open', league)"
                    >
                      Ir a la liga
                    </button>
                    <button
                      v-else
                      type="button"
                      class="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                      @click="onPublicAction(league)"
                    >
                      Unirme
                    </button>
                  </div>
                </article>
              </div>
            </section>

            <section class="mt-8">
              <div class="flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold tracking-tight text-white">
                    Mis ligas
                  </h2>
                  <p class="mt-0.5 text-sm text-white/60">
                    Aquí salen tus ligas privadas y públicas.
                  </p>
                </div>
              </div>

              <div
                v-if="myLeagues.length === 0"
                class="p-4 mt-4 border rounded-2xl border-white/10 bg-black/20"
              >
                <div class="text-sm font-semibold text-white">
                  Aún no estás en ninguna liga
                </div>
                <div class="mt-1 text-sm text-white/60">
                  Empieza creando una liga con tus colegas o explora las
                  públicas.
                </div>
                <div class="mt-3">
                  <button
                    type="button"
                    class="w-full sm:w-auto rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                    @click="$emit('create')"
                  >
                    Crear liga
                  </button>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                <article
                  v-for="league in myLeagues"
                  :key="league.id"
                  class="p-4 border rounded-2xl border-white/10 bg-black/20"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-xs text-white/60">
                        {{
                          league.visibility === "public" ? "Pública" : "Privada"
                        }}
                        · {{ league.role === "admin" ? "Admin" : "Miembro" }}
                      </div>
                      <div class="mt-1 text-base font-semibold text-white">
                        {{ league.name }}
                      </div>
                    </div>

                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                      @click="$emit('open', league)"
                    >
                      Abrir
                    </button>
                  </div>

                  <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div
                      class="p-3 border rounded-xl border-white/10 bg-black/20"
                    >
                      <div class="text-xs text-white/60">Límite diario</div>
                      <div class="mt-1 font-semibold">
                        {{ league.dailyPointsLimit }} pts
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </template>

          <template v-else>
            <section>
              <div class="flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold tracking-tight text-white">
                    Mis ligas
                  </h2>
                  <p class="mt-0.5 text-sm text-white/60">
                    Aquí salen tus ligas privadas y públicas.
                  </p>
                </div>
              </div>

              <div
                v-if="myLeagues.length === 0"
                class="p-4 mt-4 border rounded-2xl border-white/10 bg-black/20"
              >
                <div class="text-sm font-semibold text-white">
                  Aún no estás en ninguna liga
                </div>
                <div class="mt-1 text-sm text-white/60">
                  Empieza creando una liga con tus colegas o explora las
                  públicas.
                </div>
                <div class="mt-3">
                  <button
                    type="button"
                    class="w-full sm:w-auto rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                    @click="$emit('create')"
                  >
                    Crear liga
                  </button>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                <article
                  v-for="league in myLeagues"
                  :key="league.id"
                  class="p-4 border rounded-2xl border-white/10 bg-black/20"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-xs text-white/60">
                        {{
                          league.visibility === "public" ? "Pública" : "Privada"
                        }}
                        · {{ league.role === "admin" ? "Admin" : "Miembro" }}
                      </div>
                      <div class="mt-1 text-base font-semibold text-white">
                        {{ league.name }}
                      </div>
                    </div>

                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                      @click="$emit('open', league)"
                    >
                      Abrir
                    </button>
                  </div>

                  <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div
                      class="p-3 border rounded-xl border-white/10 bg-black/20"
                    >
                      <div class="text-xs text-white/60">Límite diario</div>
                      <div class="mt-1 font-semibold">
                        {{ league.dailyPointsLimit }} pts
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section class="mt-8">
              <div class="flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold tracking-tight text-white">
                    Explorar ligas públicas
                  </h2>
                  <p class="mt-0.5 text-sm text-white/60">
                    Listado global (solo públicas).
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
                <article
                  v-for="league in publicLeagues"
                  :key="league.id"
                  class="p-4 border rounded-2xl border-white/10 bg-black/20"
                >
                  <div class="text-xs text-white/60">
                    Pública · {{ league.membersCount ?? 0 }} miembros
                  </div>
                  <div class="mt-1 text-base font-semibold text-white">
                    {{ league.name }}
                  </div>

                  <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div
                      class="p-3 border rounded-xl border-white/10 bg-black/20"
                    >
                      <div class="text-xs text-white/60">Límite diario</div>
                      <div class="mt-1 font-semibold">
                        {{ league.dailyPointsLimit }} pts
                      </div>
                    </div>
                  </div>

                  <div class="mt-3">
                    <button
                      v-if="isInMyLeagues(league)"
                      type="button"
                      class="w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                      @click="$emit('open', league)"
                    >
                      Ir a la liga
                    </button>
                    <button
                      v-else
                      type="button"
                      class="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                      @click="onPublicAction(league)"
                    >
                      Unirme
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </template>
        </div>
      </main>
    </div>
  </BasePage>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useLeaguesStore } from "../services/leaguesStore";
import BasePage from "./BasePage.vue";

const emit = defineEmits(["back", "create", "join", "open"]);

const props = defineProps({
  initialTab: {
    type: String,
    default: "my", // 'my' | 'public'
  },
});

const store = useLeaguesStore();

const showPublicFirst = computed(() => props.initialTab === "public");

onMounted(() => {
  store.seedIfEmpty();
  // En modo Firestore, seedIfEmpty() solo hace refresh si no está cargado,
  // pero llamarlo explícitamente evita que se quede vacío por timing.
  store.refresh?.();
});

const myLeagues = computed(() => store.state.myLeagues);
const publicLeagues = computed(() => store.state.publicLeagues);

function isInMyLeagues(league) {
  const id = league?.id;
  if (!id) return false;
  return store.state.myLeagues.some((l) => l.id === id);
}

function onPublicAction(league) {
  if (isInMyLeagues(league)) {
    emit("open", league);
    return;
  }
  // Sin códigos: por ahora mandamos al flujo de "join" genérico.
  emit("join", league?.id);
}
</script>
