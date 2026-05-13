<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { auth, db } from "./firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import {
  log,
  warn,
  error as logError,
  group,
  groupEnd,
} from "./services/logger";

import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import VerifyCode from "./components/VerifyCode.vue";
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

// Secuencia sin router: login -> register -> verify -> completar -> home
const step = ref("login");
const needsEmailVerification = ref(false);
const previousStep = ref("home");
const activeLeagueId = ref("");

const pendingJoinLeagueId = ref("");

const authRedirectFinishing = ref(false);

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

const showsChrome = computed(() => chromeSteps.includes(step.value));

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
  setPendingJoinLeagueId("");
  step.value = "leagueDetail";
}

async function hasCompletedProfile(user) {
  if (!user?.uid) return false;

  log("Profile", "hasCompletedProfile: start", { uid: user.uid });

  // 1) Firestore (fuente de verdad)
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      log("Profile", "hasCompletedProfile: firestore", {
        uid: user.uid,
        exists: true,
        profileCompleted: data?.profileCompleted === true,
      });
      if (data?.profileCompleted === true) return true;
    } else {
      log("Profile", "hasCompletedProfile: firestore", {
        uid: user.uid,
        exists: false,
      });
    }
  } catch (e) {
    warn("Profile", "hasCompletedProfile: firestore failed, using local", {
      uid: user.uid,
      code: e?.code,
      message: e?.message,
    });
    // si Firestore falla (rules / offline), usamos fallback
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
    await setDoc(
      doc(db, "users", user.uid),
      { profileCompleted: true, profileCompletedAt: new Date().toISOString() },
      { merge: true },
    );
    log("Profile", "markProfileCompleted: firestore OK", { uid: user.uid });
  } catch (e) {
    warn("Profile", "markProfileCompleted: firestore failed", {
      uid: user.uid,
      code: e?.code,
      message: e?.message,
    });
    // si Firestore falla, al menos persistimos local
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

onMounted(() => {
  log("App", "mounted", { url: window.location.href });

  consumeJoinParamFromUrl();
  hydratePendingJoinLeagueId();

  // Si venimos de un login social con redirect, consumimos el resultado aquí (solo 1 vez).
  // Esto sirve para:
  // - Capturar errores de redirect y mostrarlos en consola.
  // - Evitar que la app "se quede" en login sin feedback.
  let pendingRedirect = false;
  try {
    pendingRedirect =
      sessionStorage.getItem("sportclash:authRedirectPending") === "1";
  } catch {
    pendingRedirect = false;
  }

  if (pendingRedirect) {
    authRedirectFinishing.value = true;
    let providerLabel = "(unknown)";
    try {
      providerLabel =
        sessionStorage.getItem("sportclash:authRedirectProvider") ||
        providerLabel;
    } catch {
      // ignore
    }

    log("Auth", "redirect pending detected", {
      provider: providerLabel,
      url: window.location.href,
    });

    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          log("Auth", "redirect result OK", {
            uid: res.user.uid,
            providerId: res?.providerId,
          });
        } else {
          // Esto suele pasar cuando:
          // - El redirect se completó pero el SDK no tiene un credential que resolver, o
          // - Ya se consumió en una carga anterior, o
          // - El login falló/abortó antes de volver.
          warn("Auth", "redirect result empty (not an error)");
        }
      })
      .catch((e) => {
        group("Auth", `getRedirectResult failed (${providerLabel})`);
        logError("Auth", "error", e);
        log("Auth", "code", e?.code);
        log("Auth", "message", e?.message);
        log("Auth", "customData", e?.customData);
        groupEnd();
      })
      .finally(() => {
        try {
          sessionStorage.removeItem("sportclash:authRedirectPending");
          sessionStorage.removeItem("sportclash:authRedirectProvider");
        } catch {
          // ignore
        }
        authRedirectFinishing.value = false;
      });
  }

  onAuthStateChanged(auth, async (user) => {
    log("Auth", "onAuthStateChanged", {
      hasUser: !!user,
      uid: user?.uid || null,
      emailVerified: user?.emailVerified ?? null,
      providerData: (user?.providerData || [])
        .map((p) => p?.providerId)
        .filter(Boolean),
    });

    if (!user) {
      step.value = "login";
      needsEmailVerification.value = false;
      return;
    }
    // La verificación la mostramos solo si venimos de Register.
    if (needsEmailVerification.value) {
      if (!user.emailVerified) {
        step.value = "verify";
        return;
      }
      needsEmailVerification.value = false;
    }
    // Completar datos solo la primera vez.
    const completed = await hasCompletedProfile(user);
    step.value = completed ? "home" : "complete";
    if (completed) openPendingJoinIfReady();
  });
});

watch(step, (to) => {
  if (to === "home") openPendingJoinIfReady();
});

function goLogin() {
  step.value = "login";
}

function goRegister() {
  step.value = "register";
}

function goVerify() {
  needsEmailVerification.value = true;
  step.value = "verify";
}

async function logout() {
  await auth.signOut();
  step.value = "login";
  needsEmailVerification.value = false;
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
  step.value = "leagueDetail";
}

function goOpenLeague(league) {
  previousStep.value = step.value;
  activeLeagueId.value = league?.id ? String(league.id) : "";
  step.value = "leagueDetail";
}

function goBack() {
  step.value = previousStep.value || "home";
}

function goProfile() {
  previousStep.value = step.value;
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
        class="min-h-[60dvh] grid place-items-center px-4"
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

      <Login v-if="step === 'login'" @register="goRegister" />
      <Register
        v-else-if="step === 'register'"
        @registered="goVerify"
        @back="goLogin"
      />
      <VerifyCode
        v-else-if="step === 'verify'"
        @verified="
          ((needsEmailVerification.value = false), (step = 'complete'))
        "
        @back="goLogin"
      />
      <CompletarDatos v-else-if="step === 'complete'" @done="step = 'home'" />

      <Home
        v-else-if="step === 'home'"
        @create-league="goCreateLeague"
        @join-league="goJoinLeague"
        @open-leagues="goMyLeagues"
        @open-history="() => {}"
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
        @back="goBack"
      />
      <Profile v-else-if="step === 'profile'" @back="goBack" @logout="logout" />
      <Home
        v-else
        @create-league="goCreateLeague"
        @join-league="goJoinLeague"
        @open-leagues="goMyLeagues"
        @open-history="() => {}"
      />
    </main>

    <div class="shrink-0">
      <AppFooter v-if="showsChrome" />
    </div>
  </div>
</template>
