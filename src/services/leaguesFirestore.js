import { awsFetchJson, isAwsEnabled } from "./awsHttp";
import { getCurrentUser } from "./cognitoAuth";
import { isLeagueIconKey } from "./leagueIcons";

function requireAws() {
  if (!isAwsEnabled()) {
    throw new Error(
      "Falta configuración de AWS (VITE_AWS_API_BASE_URL o public/runtime-config.js)",
    );
  }
}

function requireUser() {
  const user = getCurrentUser();
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

// --------------------------
// Ligas
// --------------------------

export async function createLeagueFirestore({
  name,
  visibility,
  dailyPointsLimit,
  iconKey,
} = {}) {
  requireAws();
  requireUser();

  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Nombre requerido");
  if (cleanName.length < 4)
    throw new Error("El nombre debe tener mínimo 4 caracteres");

  const limitNum = Number(dailyPointsLimit);
  if (!Number.isFinite(limitNum) || limitNum < 1 || limitNum > 10) {
    throw new Error("El límite diario debe ser 1 a 10");
  }

  const vis = visibility === "private" ? "private" : "public";
  const cleanIconKey = isLeagueIconKey(iconKey) ? String(iconKey).trim() : "";

  const created = await awsFetchJson("/leagues", {
    method: "POST",
    body: {
      name: cleanName,
      visibility: vis,
      dailyPointsLimit: limitNum,
      iconKey: cleanIconKey || "weights",
    },
  });

  const leagueId = created?.league?.leagueId;
  if (!leagueId) throw new Error("No se pudo crear la liga");
  return await fetchLeagueByIdFirestore(leagueId);
}

export async function fetchMyLeaguesFirestore({ max = 50 } = {}) {
  requireAws();
  requireUser();

  const res = await awsFetchJson("/me/leagues");
  const leagues = Array.isArray(res?.leagues) ? res.leagues : [];
  return leagues.slice(0, max).map((l) => ({
    id: l.leagueId,
    ...l,
  }));
}

export async function fetchLeagueByIdFirestore(leagueId) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}`,
  );
  const league = res?.league;
  if (!league?.leagueId) throw new Error("Liga no encontrada");
  return { id: league.leagueId, ...league };
}

export async function deleteLeagueFirestore(leagueId) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  await awsFetchJson(`/leagues/${encodeURIComponent(String(leagueId))}`, {
    method: "DELETE",
  });
}

// --------------------------
// Miembros
// --------------------------

export async function fetchLeagueMembersFirestore({
  leagueId,
  max = 200,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/members`,
  );
  const members = Array.isArray(res?.members) ? res.members : [];
  return members.slice(0, max).map((m) => ({
    id: `${leagueId}_${m.uid}`,
    ...m,
  }));
}

export async function fetchMyMembershipInLeagueFirestore(leagueId) {
  requireAws();
  const user = requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  try {
    const res = await awsFetchJson(
      `/leagues/${encodeURIComponent(String(leagueId))}/members`,
    );
    const members = Array.isArray(res?.members) ? res.members : [];
    const mine = members.find((m) => String(m?.uid || "") === user.uid);
    if (!mine) return null;
    return { id: `${leagueId}_${user.uid}`, ...mine };
  } catch (e) {
    if (String(e?.code || "") === "forbidden") return null;
    throw e;
  }
}

export async function updateMemberRoleFirestore({
  leagueId,
  targetUid,
  role,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!targetUid) throw new Error("targetUid requerido");
  const newRole = String(role || "");
  if (!["admin", "member"].includes(newRole)) throw new Error("Rol inválido");

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/members/${encodeURIComponent(String(targetUid))}`,
    { method: "PATCH", body: { role: newRole } },
  );
}

export async function removeMemberFromLeagueFirestore({
  leagueId,
  targetUid,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!targetUid) throw new Error("targetUid requerido");

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/members/${encodeURIComponent(String(targetUid))}`,
    { method: "DELETE" },
  );
}

// --------------------------
// Solicitudes de unión
// --------------------------

export async function requestToJoinLeagueFirestore(leagueId) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/join-requests`,
    {
      method: "POST",
      body: {},
    },
  );
}

export async function fetchMyJoinRequestInLeagueFirestore(leagueId) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/join-requests/me`,
  );
  const jr = res?.joinRequest;
  if (!jr) return null;
  return { id: jr.requestId, ...jr };
}

export async function fetchPendingJoinRequestsFirestore({
  leagueId,
  max = 100,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/join-requests`,
    {
      query: { status: "pending" },
    },
  );

  const items = Array.isArray(res?.joinRequests) ? res.joinRequests : [];
  return items.slice(0, max).map((r) => ({ id: r.requestId, ...r }));
}

export async function decideJoinRequestFirestore({
  leagueId,
  requestUid,
  requestId,
  status,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!requestUid) throw new Error("requestUid requerido");
  if (!["approved", "rejected"].includes(status))
    throw new Error("Estado inválido");

  let resolvedRequestId = requestId || null;
  if (!resolvedRequestId) {
    const pending = await fetchPendingJoinRequestsFirestore({ leagueId });
    const match = (pending || []).find(
      (r) => String(r?.uid || "") === String(requestUid),
    );
    resolvedRequestId = match?.id || match?.requestId || null;
  }
  if (!resolvedRequestId) throw new Error("Solicitud no encontrada");

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/join-requests/${encodeURIComponent(String(resolvedRequestId))}/decide`,
    {
      method: "POST",
      body: { decision: status === "approved" ? "approve" : "reject" },
    },
  );
}

// --------------------------
// Solicitudes de puntos
// --------------------------

export async function createPointRequestFirestore({
  leagueId,
  note = "",
  performedOn,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!performedOn) throw new Error("La fecha es obligatoria");

  const dateStr = String(performedOn).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("Fecha inválida");
  if (dateStr > localIsoDateToday())
    throw new Error("La fecha no puede ser futura");

  const cleanNote = String(note || "")
    .trim()
    .slice(0, 500);

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests`,
    {
      method: "POST",
      body: {
        performedOn: dateStr,
        ...(cleanNote ? { note: cleanNote } : null),
      },
    },
  );
}

export async function fetchApprovedPointRequestsFirestore({
  leagueId,
  max = 500,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests`,
    {
      query: { status: "approved" },
    },
  );

  const items = Array.isArray(res?.pointRequests) ? res.pointRequests : [];
  return items.slice(0, max).map((r) => ({ id: r.requestId, ...r }));
}

export async function fetchPendingPointRequestsFirestore({
  leagueId,
  max = 50,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests`,
    {
      query: { status: "pending" },
    },
  );

  const items = Array.isArray(res?.pointRequests) ? res.pointRequests : [];
  return items.slice(0, max).map((r) => ({ id: r.requestId, ...r }));
}

export async function fetchMyPointRequestsFirestore({
  leagueId,
  max = 50,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests/me`,
  );
  const items = Array.isArray(res?.pointRequests) ? res.pointRequests : [];

  const mapped = items.map((r) => ({ id: r.requestId, ...r }));
  mapped.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return mapped.slice(0, max);
}

export async function updateMyPointRequestFirestore({
  leagueId,
  requestId,
  note = "",
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!requestId) throw new Error("requestId requerido");

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests/${encodeURIComponent(String(requestId))}`,
    { method: "PATCH", body: { note: String(note || "").slice(0, 500) } },
  );
}

export async function deleteMyPointRequestFirestore({
  leagueId,
  requestId,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!requestId) throw new Error("requestId requerido");

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests/${encodeURIComponent(String(requestId))}`,
    { method: "DELETE" },
  );
}

export async function decidePointRequestFirestore({
  requestId,
  status,
  leagueId,
  rejectReason,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");
  if (!requestId) throw new Error("requestId requerido");
  if (!["approved", "rejected"].includes(status))
    throw new Error("Estado inválido");

  const decision = status === "approved" ? "approve" : "reject";
  const reason = String(rejectReason || "")
    .trim()
    .slice(0, 300);
  if (decision === "reject" && !reason) {
    throw new Error("Debes indicar un motivo para rechazar");
  }

  await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/point-requests/${encodeURIComponent(String(requestId))}/decide`,
    { method: "POST", body: { decision, ...(reason ? { reason } : null) } },
  );
}

// --------------------------
// Ranking / logros
// --------------------------

export async function fetchLeagueAthleteAchievementsFirestore({
  leagueId,
  maxRequests = 500,
} = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  const rows = await fetchApprovedPointRequestsFirestore({
    leagueId: String(leagueId),
    max: maxRequests,
  });

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

export async function fetchUserApprovedPointRequestsFirestore({
  uid,
  max = 500,
} = {}) {
  requireAws();
  requireUser();

  const userId = String(uid || "");
  if (!userId) throw new Error("uid requerido");

  // Backend actualmente lista por liga; agregamos en cliente.
  const res = await awsFetchJson("/me/leagues");
  const leagues = Array.isArray(res?.leagues) ? res.leagues : [];

  const out = [];
  for (const l of leagues) {
    const leagueId = l?.leagueId;
    if (!leagueId) continue;

    let pr;
    try {
      const r = await awsFetchJson(
        `/leagues/${encodeURIComponent(String(leagueId))}/point-requests`,
        { query: { status: "approved" } },
      );
      pr = Array.isArray(r?.pointRequests) ? r.pointRequests : [];
    } catch {
      pr = [];
    }

    for (const row of pr) {
      if (String(row?.uid || "") !== userId) continue;
      out.push({ id: row.requestId, ...row, leagueId: String(leagueId) });
      if (out.length >= max) return out;
    }
  }

  return out;
}

// --------------------------
// Historial
// --------------------------

export async function fetchLeagueHistoryFirestore({ leagueId, max = 50 } = {}) {
  requireAws();
  requireUser();

  if (!leagueId) throw new Error("leagueId requerido");

  const res = await awsFetchJson(
    `/leagues/${encodeURIComponent(String(leagueId))}/history`,
    {
      query: { limit: max },
    },
  );

  const items = Array.isArray(res?.history) ? res.history : [];
  return items;
}

export async function addLeagueHistoryEventFirestore() {
  throw new Error("leagueHistory es backend-only");
}
