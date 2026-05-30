function readRuntimeConfig() {
  // Definida por `public/runtime-config.js` (si existe).
  // En Vite, `public/` se sirve tal cual y no pasa por el bundle.
  const cfg = globalThis?.__SPORTCLASH_CONFIG__;
  return cfg && typeof cfg === "object" ? cfg : null;
}

export function getAwsApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_AWS_API_BASE_URL || "").trim();
  if (fromEnv) return fromEnv;

  const runtime = readRuntimeConfig();
  const fromRuntime = String(runtime?.AWS_API_BASE_URL || "").trim();
  if (fromRuntime) return fromRuntime;

  // DX: en dev, permite arrancar sin `.env` usando proxy de Vite en `/api`.
  if (import.meta.env.DEV) return "/api";

  return "";
}

export function getAwsWsUrl() {
  const fromEnv = String(import.meta.env.VITE_AWS_WS_URL || "").trim();
  if (fromEnv) return fromEnv;

  const runtime = readRuntimeConfig();
  const fromRuntime = String(runtime?.AWS_WS_URL || "").trim();
  if (fromRuntime) return fromRuntime;

  return "";
}

function readCognitoField(name, envKey) {
  const fromEnv = String(import.meta.env[envKey] || "").trim();
  if (fromEnv) return fromEnv;
  const runtime = readRuntimeConfig();
  const fromRuntime = String(runtime?.[name] || "").trim();
  return fromRuntime;
}

export function getCognitoConfig() {
  const domain = readCognitoField("COGNITO_DOMAIN", "VITE_COGNITO_DOMAIN");
  const clientId = readCognitoField(
    "COGNITO_CLIENT_ID",
    "VITE_COGNITO_CLIENT_ID",
  );
  const redirectUriRaw = readCognitoField(
    "COGNITO_REDIRECT_URI",
    "VITE_COGNITO_REDIRECT_URI",
  );
  const logoutUriRaw = readCognitoField(
    "COGNITO_LOGOUT_URI",
    "VITE_COGNITO_LOGOUT_URI",
  );
  const scopes = readCognitoField("COGNITO_SCOPES", "VITE_COGNITO_SCOPES");

  const redirectUri = redirectUriRaw || window.location.origin;
  const logoutUri = logoutUriRaw || window.location.origin;

  return {
    domain: domain.replace(/\/+$/, ""),
    clientId: String(clientId || "").trim(),
    redirectUri,
    logoutUri,
    scopes: String(scopes || "openid email profile").trim(),
  };
}
