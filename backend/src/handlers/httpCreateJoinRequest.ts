import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, nowIso, randomId } from "../shared/http.js";
import { getMemberRole } from "../shared/leagueAuth.js";
import type { JoinRequestItem } from "../shared/types.js";
import { publishToLeague } from "../shared/wsPublish.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const leagueRes = await ddb.send(
    new GetCommand({ TableName: Tables.leagues, Key: { leagueId } }),
  );
  if (!leagueRes.Item) throw new Error("not_found");

  const existingRole = await getMemberRole(leagueId, uid);
  if (existingRole) throw new Error("forbidden");

  const existing = await ddb.send(
    new QueryCommand({
      TableName: Tables.joinRequests,
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":leagueId": leagueId,
        ":uid": uid,
        ":pending": "pending",
      },
      FilterExpression: "uid = :uid AND #status = :pending",
      ProjectionExpression: "requestId",
    }),
  );
  if ((existing.Items ?? []).length > 0) throw new Error("conflict");

  const createdAt = nowIso();
  const requestId = randomId("jr");

  const item: JoinRequestItem = {
    leagueId,
    requestId,
    uid,
    status: "pending",
    createdAt,
  };

  await ddb.send(
    new PutCommand({
      TableName: Tables.joinRequests,
      Item: item,
      ConditionExpression: "attribute_not_exists(requestId)",
    }),
  );

  await publishToLeague(leagueId, {
    type: "joinRequest.created",
    leagueId,
    ts: createdAt,
    data: { requestId, uid },
  });

  return json(201, {
    joinRequest: { requestId, leagueId, uid, status: "pending", createdAt },
  });
};

export const handler = httpHandler(inner);
