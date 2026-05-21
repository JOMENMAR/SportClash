import { reactive } from "vue";
import { log, warn, error as logError, group, groupEnd } from "./logger";
import {
  createLeagueFirestore,
  fetchMyLeaguesFirestore,
} from "./leaguesFirestore";

/**
 * Store Firestore (v1):
 * - Mantiene state reactivo para UI.
 * - Expone una API simple para crear y refrescar ligas.
 *   para cambiar lo mínimo.
 */
const state = reactive({
  myLeagues: [],
  loaded: false,
  loading: false,
  error: "",
});

async function refresh() {
  group("LeaguesStore", "refresh()");
  state.error = "";
  state.loading = true;
  try {
    log("LeaguesStore", "refresh: fetching mine");
    const mine = await fetchMyLeaguesFirestore();
    // Orden simple: más nuevas primero (si createdAt es string/ts)
    state.myLeagues = [...mine].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    state.loaded = true;
    log("LeaguesStore", "refresh: done", {
      myLeagues: state.myLeagues.length,
    });
  } catch (e) {
    logError("LeaguesStore", "refresh: failed", e);
    log("LeaguesStore", "refresh: failed meta", {
      code: e?.code,
      message: e?.message,
    });
    state.error = e?.message || "No se pudieron cargar las ligas";
  } finally {
    state.loading = false;
    groupEnd();
  }
}

async function createLeague({ name, visibility, dailyPointsLimit, iconKey }) {
  group("LeaguesStore", "createLeague()", {
    name,
    visibility,
    dailyPointsLimit,
    iconKey,
  });
  const league = await createLeagueFirestore({
    name,
    visibility,
    dailyPointsLimit,
    iconKey,
  });
  log("LeaguesStore", "createLeague: created", {
    id: league?.id,
  });
  await refresh();
  groupEnd();
  return league;
}

function seedIfEmpty() {
  // En Firestore no hacemos seed automático desde el cliente (evita escritura inesperada).
  // Solo refrescamos.
  if (!state.loaded && !state.loading) {
    refresh();
  }
}

export function useLeaguesStore() {
  return {
    state,
    refresh,
    seedIfEmpty,
    createLeague,
  };
}
