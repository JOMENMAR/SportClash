import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin", "member"]);

  const res = await ddb.send(
    new QueryCommand({
      TableName: Tables.leagueMembers,
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeValues: { ":leagueId": leagueId },
    }),
  );

  return json(200, { members: res.Items ?? [] });
};

export const handler = httpHandler(inner);
