import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "./dynamodb.js";

export async function countApprovedPointsForDay(params: {
  leagueId: string;
  uid: string;
  performedOn: string;
}): Promise<number> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: Tables.pointRequests,
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":leagueId": params.leagueId,
        ":approved": "approved",
        ":uid": params.uid,
        ":performedOn": params.performedOn,
      },
      FilterExpression:
        "#status = :approved AND uid = :uid AND performedOn = :performedOn",
      Select: "COUNT",
    }),
  );

  return res.Count ?? 0;
}
