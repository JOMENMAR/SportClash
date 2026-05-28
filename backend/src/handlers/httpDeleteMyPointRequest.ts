import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { publishToLeague } from "../shared/wsPublish.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  const requestId = event.pathParameters?.requestId;
  if (!leagueId) throw new Error("invalid:leagueId");
  if (!requestId) throw new Error("invalid:requestId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin", "member"]);

  const existing = await ddb.send(
    new GetCommand({
      TableName: Tables.pointRequests,
      Key: { leagueId, requestId },
    }),
  );
  const item = existing.Item as any;
  if (!item) throw new Error("not_found");
  if (item.uid !== uid) throw new Error("forbidden");
  if (item.status !== "pending") throw new Error("conflict");

  await ddb.send(
    new DeleteCommand({
      TableName: Tables.pointRequests,
      Key: { leagueId, requestId },
      ConditionExpression: "uid = :uid AND #status = :pending",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":uid": uid, ":pending": "pending" },
    }),
  );

  await publishToLeague(leagueId, {
    type: "pointRequest.updated",
    leagueId,
    ts: new Date().toISOString(),
    data: { requestId, status: "deleted", deletedBy: uid },
  });

  return json(200, { ok: true });
};

export const handler = httpHandler(inner);
