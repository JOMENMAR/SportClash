import { getAwsApiBaseUrl } from "./appConfig";
import { getBearerToken } from "./cognitoAuth";

function getBaseUrl() {
  return String(getAwsApiBaseUrl() || "").replace(/\/+$/, "");
}

export function isAwsEnabled() {
  return !!getBaseUrl();
}

function buildUrl(path, query) {
  const base = getBaseUrl();
  if (!base) {
    throw new Error(
      "Falta VITE_AWS_API_BASE_URL (.env) o AWS_API_BASE_URL (public/runtime-config.js)",
    );
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const isRelativeBase = /^\//.test(base);
  const url = isRelativeBase
    ? new URL(base + cleanPath, window.location.origin)
    : new URL(base + cleanPath);

  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  return url.toString();
}

// getBearerToken viene de Cognito (Hosted UI)

export async function awsFetchJson(path, opts = {}) {
  const method = String(opts.method || "GET").toUpperCase();
  const url = buildUrl(path, opts.query);

  const token = await getBearerToken();

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body ? { "Content-Type": "application/json" } : null),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const code = data?.error?.code;
    const message =
      data?.error?.message ||
      (res.status === 401 ? "No autenticado" : null) ||
      "Error de servidor";

    const err = new Error(message);
    err.code = code;
    err.status = res.status;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
