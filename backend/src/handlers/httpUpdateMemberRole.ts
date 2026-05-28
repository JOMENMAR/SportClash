import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, parseJsonBody } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { recordLeagueHistory } from "../shared/leagueHistory.js";

type Body = {
  role: "admin" | "member";
};

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  const targetUid = event.pathParameters?.targetUid;
  if (!leagueId) throw new Error("invalid:leagueId");
  if (!targetUid) throw new Error("invalid:targetUid");

  const actorRole = await getMemberRole(leagueId, uid);
  requireRole(actorRole, ["owner", "admin"]);

  const body = parseJsonBody<Body>(event.body);
  if (body.role !== "admin" && body.role !== "member") {
    throw new Error("invalid:role");
  }

  const memberRes = await ddb.send(
    new GetCommand({
      TableName: Tables.leagueMembers,
      Key: { leagueId, uid: targetUid },
    }),
  );
  const member = memberRes.Item as any;
  if (!member) throw new Error("not_found");
  if (member.role === "owner") throw new Error("forbidden");

  await ddb.send(
    new UpdateCommand({
      TableName: Tables.leagueMembers,
      Key: { leagueId, uid: targetUid },
      UpdateExpression: "SET #role = :role",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: { ":role": body.role },
    }),
  );

  await recordLeagueHistory({
    leagueId,
    type: "member.role.update",
    actorUid: uid,
    payload: { targetUid, role: body.role },
  });

  return json(200, { ok: true });
};

export const handler = httpHandler(inner);
