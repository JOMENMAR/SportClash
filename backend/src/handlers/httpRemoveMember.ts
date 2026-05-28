import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { recordLeagueHistory } from "../shared/leagueHistory.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  const targetUid = event.pathParameters?.targetUid;
  if (!leagueId) throw new Error("invalid:leagueId");
  if (!targetUid) throw new Error("invalid:targetUid");

  const actorRole = await getMemberRole(leagueId, uid);
  requireRole(actorRole, ["owner", "admin"]);

  const targetRes = await ddb.send(
    new GetCommand({
      TableName: Tables.leagueMembers,
      Key: { leagueId, uid: targetUid },
    }),
  );
  const target = targetRes.Item as any;
  if (!target) throw new Error("not_found");
  if (target.role === "owner") throw new Error("forbidden");

  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: Tables.leagueMembers,
            Key: { leagueId, uid: targetUid },
          },
        },
        {
          Update: {
            TableName: Tables.leagues,
            Key: { leagueId },
            UpdateExpression:
              "SET membersCount = if_not_exists(membersCount, :one) - :one",
            ExpressionAttributeValues: { ":one": 1 },
          },
        },
      ],
    }),
  );

  await recordLeagueHistory({
    leagueId,
    type: "member.remove",
    actorUid: uid,
    payload: { targetUid },
  });

  return json(200, { ok: true });
};

export const handler = httpHandler(inner);
