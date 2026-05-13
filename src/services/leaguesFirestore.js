import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { log, warn, error as logError, group, groupEnd } from "./logger";

function requireUser() {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Debes iniciar sesión");
  return user;
}

function localIsoDateToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Modelo Firestore (v1)
 * - leagues/{leagueId}
 *   - name, visibility ('public'|'private'), dailyPointsLimit, createdAt, createdBy, membersCount
 * - leagueMembers/{leagueId_uid}
 *   - leagueId, uid, role ('admin'|'member'), joinedAt
 */

export async function createLeagueFirestore({
  name,
  visibility,
  dailyPointsLimit,
}) {
  const user = requireUser();

  group("LeaguesFS", "createLeagueFirestore", {
    uid: user.uid,
    name,
    visibility,
    dailyPointsLimit,
  });

  const leaguesCol = collection(db, "leagues");

  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Nombre requerido");

  const limitNum = Number(dailyPointsLimit);
  if (!Number.isFinite(limitNum) || limitNum < 1) {
    throw new Error("El límite diario debe ser 1 o más");
  }

  const vis = visibility === "private" ? "private" : "public";

  const result = await runTransaction(db, async (tx) => {
    // IMPORTANTE: no usamos addDoc dentro de transaction.
    const leagueDocRef = doc(leaguesCol);
    tx.set(leagueDocRef, {
      name: cleanName,
      visibility: vis,
      dailyPointsLimit: limitNum,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      membersCount: 1,
    });

    // membership (admin)
    const memberId = `${leagueDocRef.id}_${user.uid}`;
    tx.set(doc(db, "leagueMembers", memberId), {
      leagueId: leagueDocRef.id,
      uid: user.uid,
      role: "owner",
      joinedAt: serverTimestamp(),
    });

    return { id: leagueDocRef.id };
  });

  // devolvemos doc completo
  const snap = await getDoc(doc(db, "leagues", result.id));
  const out = { id: snap.id, ...snap.data() };
  log("LeaguesFS", "create: success", { id: out.id });
  groupEnd();
  return out;
}

// join por código eliminado (ya no usamos codes).

export async function fetchPublicLeaguesFirestore({ max = 25 } = {}) {
  log("LeaguesFS", "fetchPublicLeaguesFirestore", {
    max,
    hasUser: !!auth.currentUser,
  });
  const q = query(
    collection(db, "leagues"),
    where("visibility", "==", "public"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchMyLeaguesFirestore({ max = 50 } = {}) {
  const user = requireUser();

  log("LeaguesFS", "fetchMyLeaguesFirestore", { max, uid: user.uid });

  // v1 simple: leemos memberships del usuario y luego cargamos las ligas.
  // (Más adelante: podemos desnormalizar para 1 query.)
  const membersQ = query(
    collection(db, "leagueMembers"),
    where("uid", "==", user.uid),
    limit(max),
  );
  const membersSnap = await getDocs(membersQ);

  const memberships = membersSnap.docs.map((d) => d.data());
  const leagues = [];

  for (const m of memberships) {
    const leagueId = m.leagueId;
    if (!leagueId) continue;
    const leagueSnap = await getDoc(doc(db, "leagues", leagueId));
    if (!leagueSnap.exists()) continue;
    leagues.push({ id: leagueSnap.id, ...leagueSnap.data(), role: m.role });
  }

  return leagues;
}

export async function ensureSeedPublicLeaguesFirestore() {
  // Seed solo si colección está vacía (para dev)
  const snap = await getDocs(query(collection(db, "leagues"), limit(1)));
  if (!snap.empty) return;

  const seeds = [
    { name: "Liga Pública Madrid", visibility: "public", dailyPointsLimit: 5 },
    { name: "Running + Gym", visibility: "public", dailyPointsLimit: 3 },
  ];

  for (const s of seeds) {
    // createLeagueFirestore ya crea membership admin; en dev no pasa nada.
    // Si no hay usuario, no seed.
    if (!auth.currentUser) return;
    await createLeagueFirestore(s);
  }
}

// --------------------------
// Interior de liga (v1)
// --------------------------

export async function fetchLeagueByIdFirestore(leagueId) {
  if (!leagueId) throw new Error("leagueId requerido");
  const snap = await getDoc(doc(db, "leagues", String(leagueId)));
  if (!snap.exists()) throw new Error("Liga no encontrada");
  return { id: snap.id, ...snap.data() };
}

export async function fetchMyMembershipInLeagueFirestore(leagueId) {
  const user = requireUser();
  const memberId = `${leagueId}_${user.uid}`;
  const snap = await getDoc(doc(db, "leagueMembers", memberId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function fetchLeagueMembersFirestore({
  leagueId,
  max = 200,
} = {}) {
  // Nota: esto requiere rules que permitan leer docs de leagueMembers por leagueId.
  // Si no, se puede dejar para más adelante.
  if (!leagueId) throw new Error("leagueId requerido");
  const q = query(
    collection(db, "leagueMembers"),
    where("leagueId", "==", String(leagueId)),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateMemberRoleFirestore({ leagueId, targetUid, role }) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  if (!targetUid) throw new Error("targetUid requerido");
  const newRole = String(role || "");
  if (!["admin", "member"].includes(newRole)) {
    throw new Error("Rol inválido");
  }

  const memberId = `${leagueId}_${targetUid}`;
  const memberRef = doc(db, "leagueMembers", memberId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(memberRef);
    if (!snap.exists()) throw new Error("Miembro no encontrado");
    const data = snap.data();

    // Nunca permitimos bajar/subir el owner desde cliente.
    if (data.role === "owner")
      throw new Error("No puedes cambiar el rol del owner");

    tx.update(memberRef, {
      role: newRole,
    });
  });
}

export async function removeMemberFromLeagueFirestore({ leagueId, targetUid }) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  if (!targetUid) throw new Error("targetUid requerido");

  const memberId = `${leagueId}_${targetUid}`;
  const memberRef = doc(db, "leagueMembers", memberId);
  const leagueRef = doc(db, "leagues", String(leagueId));

  await runTransaction(db, async (tx) => {
    const [memberSnap, leagueSnap] = await Promise.all([
      tx.get(memberRef),
      tx.get(leagueRef),
    ]);
    if (!memberSnap.exists()) throw new Error("Miembro no encontrado");
    if (!leagueSnap.exists()) throw new Error("Liga no encontrada");

    const member = memberSnap.data();
    if (member.role === "owner") throw new Error("No puedes expulsar al owner");

    tx.delete(memberRef);

    const currentCount = Number(leagueSnap.data()?.membersCount || 0);
    tx.update(leagueRef, {
      membersCount: Math.max(1, currentCount - 1),
    });
  });
}

export async function requestToJoinLeagueFirestore(leagueId) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");

  const reqId = `${leagueId}_${user.uid}`;
  const ref = doc(db, "leagueJoinRequests", reqId);

  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const status = String(data?.status || "");

    // Si ya está pendiente o aprobada, no re-escribimos (evita update no permitido por rules).
    if (status === "pending" || status === "approved") return;

    // Si fue rechazada, permitimos re-solicitar (rules lo limitarán a ligas públicas).
    await updateDoc(ref, {
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
    });
    return;
  }

  // Create inicial.
  await setDoc(ref, {
    leagueId: String(leagueId),
    uid: user.uid,
    status: "pending",
    createdAt: serverTimestamp(),
    decidedAt: null,
    decidedBy: null,
  });
}

export async function fetchMyJoinRequestInLeagueFirestore(leagueId) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  const reqId = `${leagueId}_${user.uid}`;
  const snap = await getDoc(doc(db, "leagueJoinRequests", reqId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function fetchPendingJoinRequestsFirestore({
  leagueId,
  max = 100,
} = {}) {
  if (!leagueId) throw new Error("leagueId requerido");
  const q = query(
    collection(db, "leagueJoinRequests"),
    where("leagueId", "==", String(leagueId)),
    where("status", "==", "pending"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function cancelMyJoinRequestFirestore(leagueId) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  const reqId = `${leagueId}_${user.uid}`;
  await deleteDoc(doc(db, "leagueJoinRequests", reqId));
}

export async function decideJoinRequestFirestore({
  leagueId,
  requestUid,
  status,
} = {}) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  if (!requestUid) throw new Error("requestUid requerido");
  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Estado inválido");
  }

  const joinReqId = `${leagueId}_${requestUid}`;
  const joinReqRef = doc(db, "leagueJoinRequests", joinReqId);
  const memberId = `${leagueId}_${requestUid}`;
  const memberRef = doc(db, "leagueMembers", memberId);
  const leagueRef = doc(db, "leagues", String(leagueId));

  await runTransaction(db, async (tx) => {
    const [reqSnap, leagueSnap, memberSnap] = await Promise.all([
      tx.get(joinReqRef),
      tx.get(leagueRef),
      tx.get(memberRef),
    ]);

    if (!reqSnap.exists()) throw new Error("Solicitud no encontrada");
    const req = reqSnap.data();
    if (req.status !== "pending") {
      throw new Error("La solicitud ya fue procesada");
    }

    if (!leagueSnap.exists()) throw new Error("Liga no encontrada");

    // Si ya es miembro, marcamos la request como approved y listo.
    if (memberSnap.exists()) {
      tx.update(joinReqRef, {
        status: "approved",
        decidedAt: serverTimestamp(),
        decidedBy: user.uid,
      });
      return;
    }

    if (status === "approved") {
      tx.set(memberRef, {
        leagueId: String(leagueId),
        uid: String(requestUid),
        role: "member",
        joinedAt: serverTimestamp(),
      });

      const currentCount = Number(leagueSnap.data()?.membersCount || 0);
      tx.update(leagueRef, {
        membersCount: currentCount + 1,
      });
    }

    tx.update(joinReqRef, {
      status,
      decidedAt: serverTimestamp(),
      decidedBy: user.uid,
    });
  });
}

// Solicitudes de puntos (v1 simple): pointRequests/{leagueId_uid_ts}
export async function createPointRequestFirestore({
  leagueId,
  note = "",
  performedOn,
} = {}) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  if (!performedOn) throw new Error("La fecha es obligatoria");
  const dateStr = String(performedOn).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("Fecha inválida");
  if (dateStr > localIsoDateToday()) {
    throw new Error("La fecha no puede ser futura");
  }
  // v2: cada solicitud vale 1 punto (no se envía cantidad)
  const pts = 1;

  const id = `${leagueId}_${user.uid}_${Date.now()}`;
  await setDoc(doc(db, "pointRequests", id), {
    leagueId: String(leagueId),
    uid: user.uid,
    points: pts,
    note: String(note || "").slice(0, 500),
    performedOn: dateStr, // YYYY-MM-DD (fecha del entrenamiento/actividad)
    status: "pending", // pending|approved|rejected
    createdAt: serverTimestamp(),
    decidedAt: null,
    decidedBy: null,
    rejectReason: null,
    rejectedOn: null,
  });

  return { id };
}

export async function fetchApprovedPointRequestsFirestore({
  leagueId,
  max = 500,
} = {}) {
  if (!leagueId) throw new Error("leagueId requerido");

  const q = query(
    collection(db, "pointRequests"),
    where("leagueId", "==", String(leagueId)),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchMyPointRequestsFirestore({
  leagueId,
  max = 50,
} = {}) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");
  const q = query(
    collection(db, "pointRequests"),
    where("leagueId", "==", String(leagueId)),
    where("uid", "==", user.uid),
    limit(max),
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // ids llevan ts, ordenamos desc por id
  items.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return items;
}

export async function updateMyPointRequestFirestore({ requestId, note = "" }) {
  const user = requireUser();
  if (!requestId) throw new Error("requestId requerido");

  const ref = doc(db, "pointRequests", String(requestId));
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Solicitud no encontrada");

  const data = snap.data();
  if (data.uid !== user.uid) throw new Error("No autorizado");
  if (data.status !== "pending")
    throw new Error("Solo puedes editar pendientes");

  await updateDoc(ref, {
    note: String(note || "").slice(0, 500),
  });
}

export async function deleteMyPointRequestFirestore({ requestId }) {
  const user = requireUser();
  if (!requestId) throw new Error("requestId requerido");

  const ref = doc(db, "pointRequests", String(requestId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.uid !== user.uid) throw new Error("No autorizado");
  if (data.status !== "pending")
    throw new Error("Solo puedes borrar pendientes");

  await deleteDoc(ref);
}

export async function fetchPendingPointRequestsFirestore({
  leagueId,
  max = 50,
} = {}) {
  if (!leagueId) throw new Error("leagueId requerido");
  const q = query(
    collection(db, "pointRequests"),
    where("leagueId", "==", String(leagueId)),
    where("status", "==", "pending"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchLeagueAthleteAchievementsFirestore({
  leagueId,
  maxRequests = 500,
} = {}) {
  // v1 simple: calcula agregados en cliente desde pointRequests aprobadas.
  // Nota: para escalar, lo ideal es una colección agregada (Cloud Function).
  if (!leagueId) throw new Error("leagueId requerido");

  const q = query(
    collection(db, "pointRequests"),
    where("leagueId", "==", String(leagueId)),
    where("status", "==", "approved"),
    limit(maxRequests),
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => d.data());

  const totalsByUid = {};
  for (const r of rows) {
    const u = String(r.uid || "");
    if (!u) continue;
    const pts = typeof r.points === "number" ? r.points : Number(r.points || 0);
    totalsByUid[u] = (totalsByUid[u] || 0) + (Number.isFinite(pts) ? pts : 0);
  }

  let topUid = null;
  let topPoints = 0;
  for (const u of Object.keys(totalsByUid)) {
    const v = totalsByUid[u] || 0;
    if (v > topPoints) {
      topPoints = v;
      topUid = u;
    }
  }

  return {
    leagueId: String(leagueId),
    totalsByUid,
    top: topUid ? { uid: topUid, points: topPoints } : null,
    approvalsCount: rows.length,
  };
}

// Historial (colección aparte): leagueHistory/{leagueId_type_ts_uid_rand}
export async function addLeagueHistoryEventFirestore({
  leagueId,
  type,
  actorUid,
  payload = {},
}) {
  if (!leagueId) throw new Error("leagueId requerido");
  if (!type) throw new Error("type requerido");
  if (!actorUid) throw new Error("actorUid requerido");

  // Id ordenable por tiempo: Date.now() delante.
  const id = `${leagueId}_${type}_${Date.now()}_${actorUid}_${Math.random()
    .toString(16)
    .slice(2, 10)}`;

  await setDoc(doc(db, "leagueHistory", id), {
    leagueId: String(leagueId),
    type: String(type),
    actorUid: String(actorUid),
    payload: payload && typeof payload === "object" ? payload : {},
    createdAt: serverTimestamp(),
  });
}

export async function fetchLeagueHistoryFirestore({
  leagueId,
  max = 50,
  viewerRole = "member",
} = {}) {
  const user = requireUser();
  if (!leagueId) throw new Error("leagueId requerido");

  // Query-safe: las rules exigen filtrar por visibleToUids.
  // viewerRole se mantiene por compatibilidad con llamadas existentes.
  void viewerRole;

  const q = query(
    collection(db, "leagueHistory"),
    where("leagueId", "==", String(leagueId)),
    where("visibleToUids", "array-contains", user.uid),
    limit(max),
  );
  const snap = await getDocs(q);

  // No hay orderBy porque requeriría índice y campo para ordenar.
  // Con ids que empiezan con timestamp, podemos ordenar en cliente.
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return items;
}

export async function decidePointRequestFirestore({
  requestId,
  status,
  leagueId,
  points,
  requestUid,
  rejectReason,
  rejectedOn,
}) {
  const user = requireUser();
  if (!requestId) throw new Error("requestId requerido");
  if (!["approved", "rejected"].includes(status))
    throw new Error("Estado inválido");

  const reason = String(rejectReason || "")
    .trim()
    .slice(0, 300);

  if (status === "rejected" && !reason) {
    throw new Error("Debes indicar un motivo para rechazar");
  }

  // Nota: el permiso real lo pondrán las rules (owner/admin).
  const patch = {
    status,
    decidedAt: serverTimestamp(),
    decidedBy: user.uid,
  };

  // Solo grabamos motivo si se rechaza.
  if (status === "rejected") {
    patch.rejectReason = reason;
    patch.rejectedOn = rejectedOn
      ? String(rejectedOn).trim().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  } else {
    // Si se aprueba, limpiamos por si antes se rechazó.
    patch.rejectReason = null;
    patch.rejectedOn = null;
  }

  await updateDoc(doc(db, "pointRequests", String(requestId)), patch);
}
