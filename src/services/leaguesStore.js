import { reactive } from "vue";
import { log, warn, error as logError, group, groupEnd } from "./logger";
import {
  createLeagueFirestore,
  fetchMyLeaguesFirestore,
  fetchPublicLeaguesFirestore,
} from "./leaguesFirestore";

/**
 * Store Firestore (v1):
 * - Mantiene state reactivo para UI.
 * - Expone una API simple para crear y refrescar ligas.
 *   para cambiar lo mínimo.
 */
const state = reactive({
  myLeagues: [],
  publicLeagues: [],
  loaded: false,
  loading: false,
  error: "",
});

async function refresh() {
  group("LeaguesStore", "refresh()");
  state.error = "";
  state.loading = true;
  try {
    log("LeaguesStore", "refresh: fetching mine + public");
    const [mine, pubs] = await Promise.all([
      fetchMyLeaguesFirestore(),
      fetchPublicLeaguesFirestore(),
    ]);
    // Orden simple: más nuevas primero (si createdAt es string/ts)
    state.myLeagues = [...mine].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    state.publicLeagues = [...pubs].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    state.loaded = true;
    log("LeaguesStore", "refresh: done", {
      myLeagues: state.myLeagues.length,
      publicLeagues: state.publicLeagues.length,
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

async function createLeague({ name, visibility, dailyPointsLimit }) {
  group("LeaguesStore", "createLeague()", {
    name,
    visibility,
    dailyPointsLimit,
  });
  const league = await createLeagueFirestore({
    name,
    visibility,
    dailyPointsLimit,
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
