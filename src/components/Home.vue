<template>
  <BasePage>
    <div class="mx-auto w-full max-w-5xl">
      <header
        class="relative overflow-hidden flex flex-col gap-3 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl p-5 sm:p-6"
      >
        <div aria-hidden class="pointer-events-none absolute inset-0">
          <div
            class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
          />
          <div
            class="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
          />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1
              class="text-2xl font-extrabold tracking-tight leading-none text-emerald-300"
            >
              SportClash
            </h1>
            <p class="mt-0 text-sm leading-snug text-white/60">
              Bienvenido. Compite en ligas mensuales con tu gente.
            </p>
          </div>
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
            @click="$emit('create-league')"
          >
            <span v-html="iconSvg('plus')" />
            Crear liga
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
            @click="$emit('open-leagues')"
          >
            <span v-html="iconSvg('leagues')" />
            Ver ligas
          </button>
        </div>
      </header>

      <main class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Liga reciente -->
        <section
          class="lg:col-span-2 rounded-2xl border border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl p-5 sm:p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold tracking-tight text-white">
                Liga reciente
              </h2>
              <p class="mt-1 text-sm text-white/60">
                Aquí verás la liga en la que estés más activo este mes.
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
              @click="$emit('open-leagues')"
            >
              Ver ligas
            </button>
          </div>

          <div class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div v-if="recentLeague" class="flex items-start gap-3">
                <div
                  class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/15 ring-1 ring-emerald-200/20"
                  aria-hidden
                >
                  <span class="text-emerald-200" v-html="iconSvg('leagues')" />
                </div>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs text-white/60">
                      {{
                        recentLeague.visibility === "public"
                          ? "Pública"
                          : "Privada"
                      }}
                    </span>

                    <span
                      v-if="recentLeague.role"
                      class="inline-flex items-center rounded-lg bg-emerald-300/15 px-2 py-1 text-[11px] font-semibold text-emerald-100 ring-1 ring-emerald-200/20"
                      :title="`Tu rol: ${recentLeague.role}`"
                    >
                      {{ recentLeague.role }}
                    </span>
                  </div>
                  <div
                    class="mt-1 text-base font-semibold text-white truncate"
                    :title="recentLeague.name"
                  >
                    {{ recentLeague.name }}
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      class="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10"
                      title="Límite diario"
                    >
                      <span class="text-white/70">Límite</span>
                      <span class="text-white">{{
                        recentLeague.dailyPointsLimit
                      }}</span>
                      <span class="text-white/70">pts</span>
                    </span>

                    <span
                      class="inline-flex items-center rounded-lg bg-black/20 px-2 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/10"
                      title="Regla"
                    >
                      diario por usuario
                    </span>
                  </div>
                </div>
              </div>

              <div v-else class="flex items-start gap-3">
                <div
                  class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/15 ring-1 ring-emerald-200/20"
                  aria-hidden
                >
                  <span class="text-emerald-200" v-html="iconSvg('leagues')" />
                </div>

                <div>
                  <div class="text-base font-semibold text-white">
                    Aún no estás en ninguna liga
                  </div>
                  <div class="mt-1 text-sm text-white/60">
                    Crea una con tu gente o explora ligas públicas.
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                  @click="
                    recentLeague
                      ? $emit('open-leagues')
                      : $emit('create-league')
                  "
                >
                  <span v-html="iconSvg('plus')" />
                  {{ recentLeague ? "Abrir ligas" : "Crear liga" }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                  @click="$emit('open-leagues')"
                >
                  <span v-html="iconSvg('link')" />
                  {{ recentLeague ? "Ver ligas" : "Solicitar unirme" }}
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                <div class="text-xs text-white/60">Puntos (mes)</div>
                <div class="mt-1 text-lg font-bold">0</div>
              </div>
              <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                <div class="text-xs text-white/60">Posición</div>
                <div class="mt-1 text-lg font-bold">—</div>
              </div>
              <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                <div class="text-xs text-white/60">Victorias</div>
                <div class="mt-1 text-lg font-bold">0</div>
              </div>
              <div class="rounded-xl border border-white/10 bg-black/20 p-3">
                <div class="text-xs text-white/60">Racha</div>
                <div class="mt-1 text-lg font-bold">0</div>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <div class="text-sm font-semibold text-white">¿Cómo funciona?</div>
            <ul class="mt-2 space-y-1 text-sm text-white/70 list-disc pl-5">
              <li>
                Dentro de tu liga, registras un <strong>punto</strong> cuando
                haces un deporte.
              </li>
              <li>
                Los administradores lo <strong>verifican</strong> para evitar
                trampas.
              </li>
              <li>
                Al final del mes, gana quien más puntos tenga (y se guardan tus
                stats).
              </li>
            </ul>
          </div>
        </section>

        <!-- Stats -->
        <section
          class="rounded-2xl border border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl p-5 sm:p-6"
        >
          <h2 class="text-lg font-bold tracking-tight text-white">
            Tus estadísticas
          </h2>
          <p class="mt-1 text-sm text-white/60">
            De momento son valores mock. Luego los calculamos desde Firestore.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3">
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Récord de puntos (mes)</div>
              <div class="mt-1 text-2xl font-bold">0</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Victorias totales</div>
              <div class="mt-1 text-2xl font-bold">0</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Mejor racha</div>
              <div class="mt-1 text-2xl font-bold">0</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Puntos totales</div>
              <div class="mt-1 text-2xl font-bold">0</div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              class="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
              @click="$emit('open-history')"
            >
              Ver historial
            </button>
          </div>
        </section>

        <!-- Logros de atletas -->
        <section
          class="lg:col-span-3 rounded-2xl border border-white/10 bg-gray-950/40 ring-1 ring-white/5 backdrop-blur-xl p-5 sm:p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold tracking-tight text-white">
                Logros de atletas
              </h2>
              <p class="mt-1 text-sm text-white/60">
                Top por puntos aprobados (cálculo simple en cliente).
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition disabled:opacity-60"
              :disabled="achLoading"
              @click="loadAchievements"
            >
              {{ achLoading ? "Cargando…" : "Actualizar" }}
            </button>
          </div>

          <div v-if="achError" class="mt-3 text-sm text-rose-200">
            {{ achError }}
          </div>

          <div v-else-if="achLoading" class="mt-3 text-sm text-white/70">
            Calculando…
          </div>

          <div v-else-if="!activeLeagueId" class="mt-3 text-sm text-white/70">
            Únete a una liga para ver logros.
          </div>

          <div v-else-if="!achTop" class="mt-3 text-sm text-white/70">
            Aún no hay puntos aprobados en esta liga.
          </div>

          <div v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Atleta top</div>
              <div class="mt-1 text-sm font-semibold break-words">
                {{ userLabel(achTop.uid) }}
              </div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Puntos aprobados</div>
              <div class="mt-1 text-2xl font-bold">{{ achTop.points }}</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Aprobaciones analizadas</div>
              <div class="mt-1 text-2xl font-bold">{{ achCount }}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </BasePage>
</template>

<script setup>
import BasePage from "./BasePage.vue";
import { computed, onMounted, ref } from "vue";
import { useLeaguesStore } from "../services/leaguesStore";
import { fetchLeagueAthleteAchievementsFirestore } from "../services/leaguesFirestore";
import {
  fetchUserProfileLabel,
  formatUidShort,
} from "../services/userProfiles";

defineEmits(["create-league", "join-league", "open-leagues", "open-history"]);

const store = useLeaguesStore();

const achLoading = ref(false);
const achError = ref("");
const achTop = ref(null);
const achCount = ref(0);

const nameCache = ref({});

const activeLeagueId = computed(() => {
  // Heurística v1: liga más reciente del usuario
  const mine = store.state?.myLeagues || [];
  return mine[0]?.id || "";
});

const recentLeague = computed(() => {
  const mine = store.state?.myLeagues || [];
  return mine[0] || null;
});

async function loadAchievements() {
  achError.value = "";
  achTop.value = null;
  achCount.value = 0;

  if (!activeLeagueId.value) return;

  achLoading.value = true;
  try {
    const res = await fetchLeagueAthleteAchievementsFirestore({
      leagueId: activeLeagueId.value,
      maxRequests: 500,
    });
    achTop.value = res?.top || null;
    achCount.value = res?.approvalsCount || 0;

    if (achTop.value?.uid) {
      const uid = String(achTop.value.uid);
      if (!nameCache.value[uid]) {
        const r = await fetchUserProfileLabel(uid);
        nameCache.value = { ...nameCache.value, [uid]: r?.nombre || "" };
      }
    }
  } catch (e) {
    achError.value = e?.message || "No se pudieron calcular logros";
  } finally {
    achLoading.value = false;
  }
}

function userLabel(uid) {
  const u = String(uid || "");
  const n = nameCache.value?.[u] || "";
  return n || formatUidShort(u);
}

function iconSvg(name) {
  if (name === "plus") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z"/></svg>`;
  }
  if (name === "link") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path d="M12.586 7.414a2 2 0 010 2.828l-2.344 2.344a2 2 0 01-2.828 0 .999.999 0 111.414-1.414l2.344-2.344a1 1 0 10-1.414-1.414L7.414 10A4 4 0 1013 15.586l1.414-1.414A4 4 0 109.586 6L8.172 7.414a1 1 0 01-1.414-1.414L8.172 4.586A6 6 0 1116.414 12.828L15 14.242A6 6 0 116.758 6l1.414-1.414A1 1 0 119.586 6L12.586 7.414z"/></svg>`;
  }
  if (name === "leagues") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path d="M4 3.5A1.5 1.5 0 015.5 2h9A1.5 1.5 0 0116 3.5v12A1.5 1.5 0 0114.5 17h-9A1.5 1.5 0 014 15.5v-12zM6 6a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h6a1 1 0 100-2H6z"/></svg>`;
  }
  return "";
}

onMounted(async () => {
  // asegura que hay ligas cargadas antes de calcular
  store.seedIfEmpty();
  store.refresh?.();
  // pequeño delay lógico: si refresh es async, esto puede correr antes;
  // aun así, el botón manual siempre lo permite.
  setTimeout(() => {
    loadAchievements();
  }, 0);
});
</script>
