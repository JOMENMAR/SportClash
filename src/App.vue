<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { awsFetchJson } from "./services/awsHttp";
import {
  initAuthFromRedirectIfNeeded,
  initAuthFromStorage,
  getCurrentUser,
  onAuthChange,
  signOut,
} from "./services/cognitoAuth";

import { toast } from "./services/toasts";

import {
  log,
  warn,
  error as logError,
  group,
  groupEnd,
} from "./services/logger";

import Login from "./components/Login.vue";
import CompletarDatos from "./components/CompletarDatos.vue";
import Home from "./components/Home.vue";
import Leagues from "./components/Leagues.vue";
import CreateLeague from "./components/CreateLeague.vue";
import JoinLeague from "./components/JoinLeague.vue";
import LeagueDetail from "./components/LeagueDetail.vue";
import TopNav from "./components/TopNav.vue";
import AppFooter from "./components/AppFooter.vue";
import Profile from "./components/Profile.vue";
import ToastHost from "./components/ToastHost.vue";
import { useLeaguesStore } from "./services/leaguesStore";

// Secuencia sin router: login -> register -> verify -> completar -> home
const step = ref("login");
const previousStep = ref("home");
const activeLeagueId = ref("");
const activeLeagueInitialTab = ref("");
const activeLeagueName = ref("");
const activeProfileUid = ref("");
const activeProfileLeagueId = ref("");

const leaguesStore = useLeaguesStore();

const pendingJoinLeagueId = ref("");

const authRedirectFinishing = ref(false);

function consumeCognitoErrorFromUrlIfAny() {
  try {
    const url = new URL(window.location.href);
    const err = url.searchParams.get("error");
    if (!err) return false;

    const desc = url.searchParams.get("error_description") || "";

    const msg = desc ? `${err}: ${desc}` : String(err);
    toast.error(`Login falló: ${msg}`);

    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.toString());
    return true;
  } catch {
    return false;
  }
}

// Evita el flash del login al refrescar: esperamos al primer onAuthStateChanged
// y, si hay usuario, a la comprobación de perfil.
const appBooting = ref(true);
const appBootMessage = ref("Cargando…");

const chromeSteps = [
  "home",
  "leagues",
  "myLeagues",
  "global",
  "createLeague",
  "joinLeague",
  "leagueDetail",
  "profile",
];

const showsChrome = computed(
  () => !appBooting.value && chromeSteps.includes(step.value),
);

watch(
  step,
  (to, from) => {
    log("Nav", "step", { from, to });
  },
  { immediate: true },
);

function setPendingJoinLeagueId(id) {
  pendingJoinLeagueId.value = id ? String(id) : "";
  try {
    if (pendingJoinLeagueId.value) {
      sessionStorage.setItem(
        "sportclash:pendingJoinLeagueId",
        pendingJoinLeagueId.value,
      );
    } else {
      sessionStorage.removeItem("sportclash:pendingJoinLeagueId");
    }
  } catch {
    // ignore
  }
}

function hydratePendingJoinLeagueId() {
  if (pendingJoinLeagueId.value) return;
  try {
    const v = sessionStorage.getItem("sportclash:pendingJoinLeagueId") || "";
    if (v) pendingJoinLeagueId.value = v;
  } catch {
    // ignore
  }
}

function consumeJoinParamFromUrl() {
  try {
    const url = new URL(window.location.href);
    const join = url.searchParams.get("join");
    if (!join) return;

    setPendingJoinLeagueId(join);

    // Limpiamos la URL para que no re-navegue en cada refresh.
    url.searchParams.delete("join");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

function openPendingJoinIfReady() {
  if (!pendingJoinLeagueId.value) return;
  if (step.value !== "home") return;

  previousStep.value = "home";
  activeLeagueId.value = pendingJoinLeagueId.value;
  activeLeagueInitialTab.value = "";
  activeLeagueName.value = "";
  setPendingJoinLeagueId("");
  step.value = "leagueDetail";
}

async function hasCompletedProfile(user) {
  if (!user?.uid) return false;

  log("Profile", "hasCompletedProfile: start", { uid: user.uid });

  // 1) AWS (fuente de verdad)
  try {
    const res = await awsFetchJson("/me");
    const completed = res?.user?.profileCompleted === true;
    log("Profile", "hasCompletedProfile: aws", {
      uid: user.uid,
      profileCompleted: completed,
    });
    if (completed) return true;
  } catch (e) {
    warn("Profile", "hasCompletedProfile: aws failed, using local", {
      uid: user.uid,
      code: e?.code,
      message: e?.message,
    });
    // si AWS falla (offline), usamos fallback
  }

  // 2) Fallback local (evita el problema del F5 mientras no tengamos rules perfectas)
  try {
    const v =
      localStorage.getItem(`sportclash:profileCompleted:${user.uid}`) === "1";
    log("Profile", "hasCompletedProfile: local", { uid: user.uid, value: v });
    return v;
  } catch (e) {
    warn("Profile", "hasCompletedProfile: local failed", {
      uid: user.uid,
      message: e?.message,
    });
    return false;
  }
}

async function markProfileCompleted(user) {
  if (!user?.uid) return;

  log("Profile", "markProfileCompleted: start", { uid: user.uid });

  try {
    await awsFetchJson("/me", {
      method: "PUT",
      body: { profileCompleted: true },
    });
    log("Profile", "markProfileCompleted: aws OK", { uid: user.uid });
  } catch (e) {
    warn("Profile", "markProfileCompleted: aws failed", {
      uid: user.uid,
      code: e?.code,
      message: e?.message,
    });
    // si AWS falla, al menos persistimos local
  }

  try {
    localStorage.setItem(`sportclash:profileCompleted:${user.uid}`, "1");
    log("Profile", "markProfileCompleted: local OK", { uid: user.uid });
  } catch (e) {
    warn("Profile", "markProfileCompleted: local failed", {
      uid: user.uid,
      message: e?.message,
    });
    // ignore
  }
}

function userFromAuth() {
  return getCurrentUser();
}

async function bootFromAuthUser(user) {
  appBooting.value = true;
  appBootMessage.value = "Cargando…";

  if (!user?.uid) {
    step.value = "login";
    appBooting.value = false;
    return;
  }

  try {
    appBootMessage.value = "Preparando tu sesión…";
    const completed = await hasCompletedProfile(user);
    step.value = completed ? "home" : "complete";
    if (completed) openPendingJoinIfReady();
  } finally {
    appBooting.value = false;
  }
}

onMounted(() => {
  log("App", "mounted", { url: window.location.href });

  // Si Cognito devuelve un error (?error=...), lo consumimos para evitar bucles.
  consumeCognitoErrorFromUrlIfAny();

  consumeJoinParamFromUrl();
  hydratePendingJoinLeagueId();

  // Cognito: si venimos de Hosted UI con `?code=...`, intercambiamos por tokens.
  // Mostramos un estado de "finalizando" para evitar pantallazo en blanco.
  authRedirectFinishing.value = true;
  Promise.resolve()
    .then(async () => {
      try {
        await initAuthFromRedirectIfNeeded();
      } catch (e) {
        group("Auth", "Cognito redirect failed");
        logError("Auth", "error", e);
        groupEnd();
      }
    })
    .finally(() => {
      authRedirectFinishing.value = false;
      // Si no venimos de redirect, cargamos desde storage.
      initAuthFromStorage();
      bootFromAuthUser(userFromAuth());
    });

  // Mantiene la UI en sync si cambia el auth (logout, refresh token, etc.)
  onAuthChange(({ user }) => {
    bootFromAuthUser(user);
  });
});

watch(step, (to) => {
  if (to === "home") openPendingJoinIfReady();
});

function goLogin() {
  step.value = "login";
}

async function logout() {
  await signOut();
  step.value = "login";
}

function goHome() {
  step.value = "home";
}

function goLeagues() {
  previousStep.value = step.value;
  step.value = "leagues";
}

function goMyLeagues() {
  previousStep.value = step.value;
  step.value = "myLeagues";
}

function goGlobal() {
  previousStep.value = step.value;
  step.value = "global";
}

function goLeagueDetail(leagueId, initialTab) {
  previousStep.value = step.value;
  activeLeagueId.value = leagueId ? String(leagueId) : "";
  activeLeagueInitialTab.value = initialTab ? String(initialTab) : "";
  activeLeagueName.value = "";
  step.value = activeLeagueId.value ? "leagueDetail" : "myLeagues";
}

function goCreateLeague() {
  previousStep.value = step.value;
  step.value = "createLeague";
}

function goJoinLeague(leagueId) {
  previousStep.value = step.value;
  if (!leagueId) {
    step.value = "global";
    return;
  }
  activeLeagueId.value = String(leagueId);
  activeLeagueInitialTab.value = "";
  activeLeagueName.value = "";
  step.value = "leagueDetail";
}

function goOpenLeague(league) {
  previousStep.value = step.value;
  activeLeagueId.value = league?.id ? String(league.id) : "";
  activeLeagueInitialTab.value = "";
  activeLeagueName.value = league?.name ? String(league.name) : "";
  step.value = "leagueDetail";
}

function onLeagueLoaded(payload) {
  const name = payload?.name ? String(payload.name) : "";
  if (name) activeLeagueName.value = name;
}

async function onLeagueDeleted() {
  activeLeagueId.value = "";
  activeLeagueInitialTab.value = "";
  activeLeagueName.value = "";
  await leaguesStore.refresh();
}

function goBack() {
  step.value = previousStep.value || "home";
}

function goProfile(uid, leagueId) {
  previousStep.value = step.value;
  activeProfileUid.value = uid ? String(uid) : "";
  activeProfileLeagueId.value = leagueId ? String(leagueId) : "";
  step.value = "profile";
}

function navActive() {
  if (step.value === "home") return "home";
  if (step.value === "myLeagues") return "myLeagues";
  if (step.value === "global") return "global";
  if (step.value === "leagues") return "myLeagues";
  return "home";
}
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col">
    <ToastHost />
    <TopNav
      v-if="showsChrome"
      :active="navActive()"
      :leagueName="step === 'leagueDetail' ? activeLeagueName : ''"
      @go-home="goHome"
      @go-my-leagues="goMyLeagues"
      @go-global="goGlobal"
      @go-profile="goProfile"
      @logout="logout"
    />

    <!--
      Importante: muchas pantallas internas usan `pt-12/pb-8` pensando que están solas.
      Como TopNav es sticky y el footer ocupa espacio, aquí reservamos ese hueco para
      que el contenido no quede tapado al hacer scroll.
    -->
    <main :class="['flex-1', showsChrome ? 'sc-screen' : '']">
      <div
        v-if="authRedirectFinishing"
        class="min-h-[100dvh] grid place-items-center px-4"
      >
        <div
          class="w-full max-w-md p-6 text-white border rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl"
        >
          <div class="text-lg font-semibold">Finalizando inicio de sesión…</div>
          <div class="mt-1 text-sm text-white/70">
            Si tarda mucho, revisa la consola (F12) para ver el error del
            redirect.
          </div>
        </div>
      </div>

      <div
        v-else-if="appBooting"
        class="min-h-[100dvh] grid place-items-center px-4"
      >
        <div
          class="w-full max-w-md p-6 text-white border rounded-2xl border-white/10 bg-gray-950/60 ring-1 ring-white/5 backdrop-blur-xl"
        >
          <div class="text-lg font-semibold">{{ appBootMessage }}</div>
          <div class="mt-1 text-sm text-white/70">Un momento por favor…</div>
        </div>
      </div>

      <Login v-else-if="step === 'login'" />
      <CompletarDatos v-else-if="step === 'complete'" @done="step = 'home'" />

      <Home
        v-else-if="step === 'home'"
        @create-league="goCreateLeague"
        @join-league="goJoinLeague"
        @open-leagues="goMyLeagues"
        @open-global="goGlobal"
        @open-league="goLeagueDetail"
        @open-history="() => {}"
        @open-profile="goProfile"
      />
      <Leagues
        v-else-if="step === 'myLeagues'"
        initialTab="my"
        @back="goBack"
        @create="goCreateLeague"
        @join="goJoinLeague"
        @open="goOpenLeague"
      />
      <Leagues
        v-else-if="step === 'global'"
        initialTab="public"
        @back="goBack"
        @create="goCreateLeague"
        @join="goJoinLeague"
        @open="goOpenLeague"
      />
      <CreateLeague
        v-else-if="step === 'createLeague'"
        @back="goBack"
        @created="goMyLeagues"
      />
      <JoinLeague
        v-else-if="step === 'joinLeague'"
        @back="goBack"
        @joined="goMyLeagues"
      />
      <LeagueDetail
        v-else-if="step === 'leagueDetail'"
        :leagueId="activeLeagueId"
        :initialTab="activeLeagueInitialTab"
        @back="goBack"
        @league-loaded="onLeagueLoaded"
        @league-deleted="onLeagueDeleted"
        @open-profile="goProfile"
      />
      <Profile
        v-else-if="step === 'profile'"
        :uid="activeProfileUid"
        :leagueId="activeProfileLeagueId"
        @back="goBack"
        @logout="logout"
      />
      <Home
        v-else
        @create-league="goCreateLeague"
        @join-league="goJoinLeague"
        @open-leagues="goMyLeagues"
        @open-global="goGlobal"
        @open-league="goLeagueDetail"
        @open-history="() => {}"
        @open-profile="goProfile"
      />
    </main>

    <div class="shrink-0">
      <AppFooter v-if="showsChrome" />
    </div>
  </div>
</template>
