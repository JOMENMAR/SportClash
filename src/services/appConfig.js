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
