import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Cache simple en memoria (por sesión)
const cache = new Map();

function pickDisplayName(data) {
  // Preferimos apodo (nombre público en ligas), luego nombre.
  const apodo = (data?.apodo || "").trim();
  if (apodo) return apodo;
  const nombre = (data?.nombre || "").trim();
  if (nombre) return nombre;
  return "";
}

export function formatUidShort(uid) {
  const s = String(uid || "");
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

/**
 * Devuelve { uid, nombre } (nombre puede ser "" si no existe perfil)
 */
export async function fetchUserProfileLabel(uid) {
  const u = String(uid || "");
  if (!u) return { uid: "", nombre: "" };

  if (cache.has(u)) return cache.get(u);

  const snap = await getDoc(doc(db, "users", u));
  const nombre = snap.exists() ? pickDisplayName(snap.data()) : "";
  const out = { uid: u, nombre };
  cache.set(u, out);
  return out;
}

/**
 * Carga varios uids y devuelve un map { [uid]: nombre }
 */
export async function fetchUserProfileLabels(uids) {
  const list = Array.from(
    new Set((uids || []).map((x) => String(x || "")).filter(Boolean)),
  );
  const out = {};

  await Promise.all(
    list.map(async (u) => {
      try {
        const r = await fetchUserProfileLabel(u);
        out[u] = r.nombre || "";
      } catch {
        out[u] = "";
      }
    }),
  );

  return out;
}
