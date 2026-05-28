import { getUidFromBearer } from "../shared/auth.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { listLeagueHistory } from "../shared/leagueHistory.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin", "member"]);

  const limitParam = event.queryStringParameters?.limit;
  const limit = Math.max(
    1,
    Math.min(200, limitParam ? Number(limitParam) : 50),
  );
  if (!Number.isFinite(limit)) throw new Error("invalid:limit");

  const items = await listLeagueHistory({ leagueId, limit });

  return json(200, {
    history: items.map((it) => ({
      id: it.eventId,
      type: it.type,
      actorUid: it.actorUid,
      payload: it.payload,
      createdAt: it.createdAt,
    })),
  });
};

export const handler = httpHandler(inner);
