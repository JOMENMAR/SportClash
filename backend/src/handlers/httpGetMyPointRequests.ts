import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { POINT_REQ_STATUS } from "../shared/constants.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { requireEnum } from "../shared/validation.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin", "member"]);

  const statusParam = event.queryStringParameters?.status;
  const status = statusParam
    ? requireEnum(statusParam, POINT_REQ_STATUS, "status")
    : null;

  const res = await ddb.send(
    new QueryCommand({
      TableName: Tables.pointRequests,
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeNames: status ? { "#status": "status" } : undefined,
      ExpressionAttributeValues: status
        ? {
            ":leagueId": leagueId,
            ":uid": uid,
            ":status": status,
          }
        : { ":leagueId": leagueId, ":uid": uid },
      FilterExpression: status
        ? "uid = :uid AND #status = :status"
        : "uid = :uid",
    }),
  );

  return json(200, { pointRequests: res.Items ?? [] });
};

export const handler = httpHandler(inner);
