import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const res = await ddb.send(
    new QueryCommand({
      TableName: Tables.joinRequests,
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeValues: { ":leagueId": leagueId, ":uid": uid },
      FilterExpression: "uid = :uid",
    }),
  );

  const items = (res.Items ?? []) as any[];
  if (items.length === 0) return json(200, { joinRequest: null });

  // Devolvemos el más reciente por createdAt ISO
  const latest = items.reduce((best, cur) => {
    const a = String(best?.createdAt || "");
    const b = String(cur?.createdAt || "");
    return b.localeCompare(a) > 0 ? cur : best;
  }, items[0]);

  return json(200, { joinRequest: latest });
};

export const handler = httpHandler(inner);
