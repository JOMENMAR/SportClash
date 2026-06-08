import { getCognitoConfig } from "./appConfig";

const STORAGE_KEY = "sportclash:cognito:tokens";
const PKCE_VERIFIER_KEY = "sportclash:cognito:pkce_verifier";
const OAUTH_STATE_KEY = "sportclash:cognito:oauth_state";
const REMEMBER_KEY = "sportclash:cognito:remember";

let cachedTokens = null;
let cachedUser = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn({ user: cachedUser, tokens: cachedTokens });
    } catch {
      // ignore
    }
  }
}

export function onAuthChange(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function base64UrlEncode(bytes) {
  const bin = String.fromCharCode(...bytes);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Base64Url(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function randomString(len = 64) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function parseJwt(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function tokenExpMs(jwtPayload) {
  const exp = jwtPayload?.exp;
  if (!exp || typeof exp !== "number") return 0;
  return exp * 1000;
}

function getStorage(remember) {
  return remember ? localStorage : sessionStorage;
}

function readRememberChoice() {
  try {
    const v = localStorage.getItem(REMEMBER_KEY);
    if (v === "0" || v === "1") return v === "1";
  } catch {
    // ignore
  }
  return true;
}

export function setRememberChoice(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  } catch {
    // ignore
  }
}

function readTokensFromStorage() {
  const remember = readRememberChoice();
  const storages = [
    getStorage(remember),
    remember ? sessionStorage : localStorage,
  ];
  for (const s of storages) {
    try {
      const raw = s.getItem(STORAGE_KEY);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data && typeof data === "object") return data;
    } catch {
      // ignore
    }
  }
  return null;
}

function writeTokensToStorage(tokens, remember) {
  const storage = getStorage(remember);
  storage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  // limpia el otro para evitar inconsistencias
  try {
    (remember ? sessionStorage : localStorage).removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function clearTokensFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function setCached(tokens) {
  cachedTokens = tokens;
  const idToken = tokens?.id_token || tokens?.idToken || "";
  const payload = idToken ? parseJwt(idToken) : null;
  cachedUser = payload
    ? {
        uid: String(payload.sub || ""),
        email: typeof payload.email === "string" ? payload.email : "",
        emailVerified: payload.email_verified === true,
        claims: payload,
      }
    : null;
  notify();
}

export function getCurrentUser() {
  return cachedUser;
}

export function isSignedIn() {
  return !!(cachedTokens?.id_token || cachedTokens?.idToken);
}

function normalizeDomain(domain) {
  const d = String(domain || "")
    .trim()
    .replace(/\/+$/, "");
  if (!d) return "";
  return d.startsWith("http") ? d : `https://${d}`;
}

export async function startLoginRedirect({
  screen = "login",
  remember,
  provider = "",
  scopes = "",
} = {}) {
  const cfg = getCognitoConfig();
  const domain = normalizeDomain(cfg.domain);
  if (!domain || !cfg.clientId) {
    throw new Error(
      "Falta configuración de Cognito (COGNITO_DOMAIN/COGNITO_CLIENT_ID)",
    );
  }

  const resolvedRemember =
    typeof remember === "boolean" ? remember : readRememberChoice();
  setRememberChoice(resolvedRemember);

  const state = randomString(24);
  const verifier = randomString(64);
  const challenge = await sha256Base64Url(verifier);

  try {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
  } catch {
    // ignore
  }

  const url = new URL(`${domain}/oauth2/authorize`);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  const resolvedScopes = String(scopes || cfg.scopes || "openid email profile").trim();
  url.searchParams.set("scope", resolvedScopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const idp = String(provider || "").trim();
  if (idp) {
    // Fuerza un IdP concreto de Cognito (p.ej. Google, Microsoft, Discord).
    url.searchParams.set("identity_provider", idp);
  }

  if (!idp && screen === "signup") {
    // Cognito respeta screen_hint=signup en Hosted UI.
    url.searchParams.set("screen_hint", "signup");
  }

  window.location.assign(url.toString());
}

async function exchangeCodeForTokens(code) {
  const cfg = getCognitoConfig();
  const domain = normalizeDomain(cfg.domain);

  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) || "";
  if (!verifier) throw new Error("missing_pkce");

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", cfg.clientId);
  body.set("code", code);
  body.set("redirect_uri", cfg.redirectUri);
  body.set("code_verifier", verifier);

  const res = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      data?.error_description || data?.error || "token_exchange_failed";
    throw new Error(String(msg));
  }

  return data;
}

function cleanUrlAfterAuth() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

export async function initAuthFromRedirectIfNeeded() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return false;

  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY) || "";
  if (expectedState && state !== expectedState) {
    throw new Error("state_mismatch");
  }

  const tokens = await exchangeCodeForTokens(code);

  const remember = readRememberChoice();
  writeTokensToStorage(tokens, remember);

  // limpieza
  try {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
  } catch {
    // ignore
  }

  setCached(tokens);
  cleanUrlAfterAuth();
  return true;
}

export function initAuthFromStorage() {
  const tokens = readTokensFromStorage();
  if (!tokens) {
    setCached(null);
    return false;
  }
  setCached(tokens);
  return true;
}

async function refreshIfNeeded() {
  const tokens = cachedTokens;
  const idToken = tokens?.id_token || tokens?.idToken || "";
  const refreshToken = tokens?.refresh_token || tokens?.refreshToken || "";
  if (!idToken || !refreshToken) return;

  const payload = parseJwt(idToken);
  const exp = tokenExpMs(payload);
  const now = Date.now();
  if (!exp) return;

  // refresca si expira en < 60s
  if (exp - now > 60_000) return;

  const cfg = getCognitoConfig();
  const domain = normalizeDomain(cfg.domain);

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("client_id", cfg.clientId);
  body.set("refresh_token", refreshToken);

  const res = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok || !data) return;

  const merged = {
    ...tokens,
    ...data,
    refresh_token: refreshToken,
  };

  const remember = readRememberChoice();
  writeTokensToStorage(merged, remember);
  setCached(merged);
}

export async function getBearerToken() {
  if (!cachedTokens) initAuthFromStorage();
  if (!cachedTokens) throw new Error("Debes iniciar sesión");

  await refreshIfNeeded();

  const idToken = cachedTokens?.id_token || cachedTokens?.idToken || "";
  if (!idToken) throw new Error("Debes iniciar sesión");
  return String(idToken);
}

export async function signOut({ redirect = true } = {}) {
  const cfg = getCognitoConfig();
  const domain = normalizeDomain(cfg.domain);

  clearTokensFromStorage();
  setCached(null);

  if (!redirect) return;

  if (!domain || !cfg.clientId) {
    // si no hay config, al menos limpiamos local.
    window.location.reload();
    return;
  }

  const url = new URL(`${domain}/logout`);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("logout_uri", cfg.logoutUri);
  window.location.assign(url.toString());
}
