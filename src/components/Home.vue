<template>
  <BasePage>
    <div class="w-full max-w-5xl mx-auto">
      <header
        class="relative flex flex-col gap-3 p-5 overflow-hidden border shadow-2xl rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <div aria-hidden class="absolute inset-0 pointer-events-none">
          <div
            class="absolute w-64 h-64 rounded-full -top-24 -right-24 bg-emerald-400/10 blur-3xl"
          />
          <div
            class="absolute rounded-full -bottom-28 -left-24 h-72 w-72 bg-sky-400/10 blur-3xl"
          />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1
              class="text-2xl font-extrabold leading-none tracking-tight text-emerald-300"
            >
              SportClash
            </h1>
            <p class="mt-0 text-sm leading-snug text-white/60">
              Bienvenido. Compite en ligas mensuales con tu gente.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-2">
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
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
            @click="$emit('open-global')"
          >
            <span v-html="iconSvg('link')" />
            Explorar ligas
          </button>
        </div>
      </header>

      <main class="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        <!-- Liga reciente -->
        <section
          class="p-5 border lg:col-span-2 rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
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
              class="px-3 py-2 text-sm font-semibold text-white transition shrink-0 rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
              @click="$emit('open-leagues')"
            >
              Mis ligas
            </button>
          </div>

          <div class="p-4 mt-4 border rounded-2xl border-white/10 bg-black/20">
            <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <div v-if="leaguesLoading" class="flex items-start gap-3">
                  <div
                    class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/15 ring-1 ring-emerald-200/20"
                    aria-hidden
                  />

                  <div class="flex-1 min-w-0">
                    <div class="w-24 h-3 rounded bg-white/10" />
                    <div
                      class="mt-2 h-4 w-64 max-w-[85%] rounded bg-white/10"
                    />
                    <div class="flex flex-wrap gap-2 mt-3">
                      <div class="w-20 h-6 rounded-lg bg-white/10" />
                      <div class="h-6 rounded-lg w-28 bg-white/10" />
                    </div>
                  </div>
                </div>

                <div v-else-if="recentLeague" class="flex items-start gap-3">
                  <div
                    class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/15 ring-1 ring-emerald-200/20"
                    aria-hidden
                  >
                    <span class="text-lg text-emerald-100">{{
                      leagueBadge(recentLeague)
                    }}</span>
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

                    <div class="flex flex-wrap gap-2 mt-2">
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
                    <span
                      class="text-emerald-200"
                      v-html="iconSvg('leagues')"
                    />
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
              </div>

              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
              >
                <button
                  type="button"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                  :disabled="leaguesLoading"
                  @click="
                    recentLeague
                      ? $emit('open-league', recentLeague.id)
                      : $emit('create-league')
                  "
                >
                  <span v-html="iconSvg(recentLeague ? 'leagues' : 'plus')" />
                  {{ recentLeague ? "Entrar a la liga" : "Crear liga" }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-white transition sm:w-auto rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                  :disabled="leaguesLoading"
                  @click="
                    recentLeague
                      ? $emit('open-league', recentLeague.id, 'points')
                      : $emit('open-global')
                  "
                >
                  <span v-html="iconSvg(recentLeague ? 'plus' : 'link')" />
                  {{ recentLeague ? "Registrar punto" : "Explorar ligas" }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
              <div class="p-3 border rounded-xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Puntos (mes)</div>
                <div
                  class="mt-1 text-lg font-bold text-white/80"
                  title="Próximamente"
                >
                  —
                </div>
              </div>
              <div class="p-3 border rounded-xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Posición</div>
                <div
                  class="mt-1 text-lg font-bold text-white/80"
                  title="Próximamente"
                >
                  —
                </div>
              </div>
              <div class="p-3 border rounded-xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Victorias</div>
                <div
                  class="mt-1 text-lg font-bold text-white/80"
                  title="Próximamente"
                >
                  —
                </div>
              </div>
              <div class="p-3 border rounded-xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Racha</div>
                <div
                  class="mt-1 text-lg font-bold text-white/80"
                  title="Próximamente"
                >
                  —
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 mt-4 border rounded-2xl border-white/10 bg-black/10">
            <details v-if="recentLeague" class="group">
              <summary
                class="text-sm font-semibold text-white cursor-pointer select-none"
              >
                ¿Cómo funciona?
              </summary>
              <ul class="pl-5 mt-2 space-y-1 text-sm list-disc text-white/70">
                <li>
                  Dentro de tu liga, registras un <strong>punto</strong> cuando
                  haces un deporte.
                </li>
                <li>
                  Los administradores lo <strong>verifican</strong> para evitar
                  trampas.
                </li>
                <li>
                  Al final del mes, gana quien más puntos tenga (y se guardan
                  tus stats).
                </li>
              </ul>
            </details>

            <template v-else>
              <div class="text-sm font-semibold text-white">
                ¿Cómo funciona?
              </div>
              <ul class="pl-5 mt-2 space-y-1 text-sm list-disc text-white/70">
                <li>
                  Dentro de tu liga, registras un <strong>punto</strong> cuando
                  haces un deporte.
                </li>
                <li>
                  Los administradores lo <strong>verifican</strong> para evitar
                  trampas.
                </li>
                <li>
                  Al final del mes, gana quien más puntos tenga (y se guardan
                  tus stats).
                </li>
              </ul>
            </template>
          </div>
        </section>

        <!-- Stats -->
        <section
          class="p-5 border rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
        >
          <h2 class="text-lg font-bold tracking-tight text-white">
            Tus estadísticas
          </h2>
          <p class="mt-1 text-sm text-white/60">
            De momento son valores mock. Luego los calculamos desde Firestore.
          </p>

          <div class="grid grid-cols-1 gap-3 mt-4">
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-xs text-white/60">Récord de puntos (mes)</div>
              <div
                class="mt-1 text-2xl font-bold text-white/80"
                title="Próximamente"
              >
                —
              </div>
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-xs text-white/60">Victorias totales</div>
              <div
                class="mt-1 text-2xl font-bold text-white/80"
                title="Próximamente"
              >
                —
              </div>
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-xs text-white/60">Mejor racha</div>
              <div
                class="mt-1 text-2xl font-bold text-white/80"
                title="Próximamente"
              >
                —
              </div>
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-xs text-white/60">Puntos totales</div>
              <div
                class="mt-1 text-2xl font-bold text-white/80"
                title="Próximamente"
              >
                —
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2 mt-4">
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
          v-if="showAchievements"
          class="p-5 border lg:col-span-3 rounded-2xl border-white/10 bg-gray-950/40 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
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
              class="px-3 py-2 text-sm font-semibold text-white transition shrink-0 rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
              :disabled="achLoading || leaguesLoading"
              @click="loadAchievements"
            >
              {{ achLoading ? "Cargando…" : "Actualizar" }}
            </button>
          </div>

          <div
            v-if="achError"
            class="p-4 mt-4 text-sm border rounded-2xl border-white/10 bg-black/20 text-rose-200"
          >
            {{ achError }}
          </div>

          <div
            v-else-if="achLoading || leaguesLoading"
            class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3"
            aria-busy="true"
          >
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="w-24 h-3 rounded bg-white/10" />
              <div class="w-40 h-4 mt-2 rounded bg-white/10" />
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="w-32 h-3 rounded bg-white/10" />
              <div class="w-20 h-8 mt-2 rounded bg-white/10" />
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="h-3 rounded w-36 bg-white/10" />
              <div class="w-20 h-8 mt-2 rounded bg-white/10" />
            </div>
          </div>

          <div v-else class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3">
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-xs text-white/60">Atleta top</div>
              <div class="mt-1 text-sm font-semibold break-words">
                <button
                  type="button"
                  class="text-left hover:underline"
                  :title="userLabel(achTop.uid)"
                  @click="$emit('open-profile', achTop.uid, activeLeagueId)"
                >
                  {{ userLabel(achTop.uid) }}
                </button>
              </div>
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-xs text-white/60">Puntos aprobados</div>
              <div class="mt-1 text-2xl font-bold">{{ achTop.points }}</div>
            </div>
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
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
import { computed, onMounted, ref, watch } from "vue";
import { useLeaguesStore } from "../services/leaguesStore";
import { fetchLeagueAthleteAchievementsFirestore } from "../services/leaguesFirestore";
import { fetchUserProfileLabel } from "../services/userProfiles";
import { leagueBadgeText } from "../services/leagueIcons";

defineEmits([
  "create-league",
  "join-league",
  "open-leagues",
  "open-global",
  "open-league",
  "open-history",
  "open-profile",
]);

const store = useLeaguesStore();

const achLoading = ref(false);
const achError = ref("");
const achTop = ref(null);
const achCount = ref(0);
const achAutoLoadedForLeague = ref("");

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

const leaguesLoading = computed(
  () => store.state?.loading === true && store.state?.loaded !== true,
);

const showAchievements = computed(() => {
  if (!activeLeagueId.value) return false;
  if (achLoading.value) return true;
  if (leaguesLoading.value) return true;
  if (achError.value) return true;
  return !!achTop.value;
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
  return n || "Atleta";
}

function leagueBadge(league) {
  return (
    leagueBadgeText({ name: league?.name, iconKey: league?.iconKey }) || "·"
  );
}

function iconSvg(name) {
  if (name === "plus") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z"/></svg>`;
  }
  if (name === "link") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M12.586 7.414a2 2 0 010 2.828l-2.344 2.344a2 2 0 01-2.828 0 .999.999 0 111.414-1.414l2.344-2.344a1 1 0 10-1.414-1.414L7.414 10A4 4 0 1013 15.586l1.414-1.414A4 4 0 109.586 6L8.172 7.414a1 1 0 01-1.414-1.414L8.172 4.586A6 6 0 1116.414 12.828L15 14.242A6 6 0 116.758 6l1.414-1.414A1 1 0 119.586 6L12.586 7.414z"/></svg>`;
  }
  if (name === "leagues") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M4 3.5A1.5 1.5 0 015.5 2h9A1.5 1.5 0 0116 3.5v12A1.5 1.5 0 0114.5 17h-9A1.5 1.5 0 014 15.5v-12zM6 6a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h6a1 1 0 100-2H6z"/></svg>`;
  }
  return "";
}

onMounted(async () => {
  // asegura que hay ligas cargadas antes de calcular
  store.seedIfEmpty();
});

watch(
  [activeLeagueId, leaguesLoading],
  ([leagueId, isLoading]) => {
    if (isLoading) return;
    if (!leagueId) return;
    if (achLoading.value) return;
    if (achAutoLoadedForLeague.value === leagueId) return;

    achAutoLoadedForLeague.value = leagueId;
    loadAchievements();
  },
  { immediate: true },
);
</script>
