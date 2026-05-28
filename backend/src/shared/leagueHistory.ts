import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "./dynamodb.js";
import { nowIso, randomId } from "./http.js";
import type { LeagueHistoryItem } from "./types.js";

export async function recordLeagueHistory(params: {
  leagueId: string;
  type: string;
  actorUid: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}): Promise<void> {
  const createdAt = params.createdAt ?? nowIso();
  const eventId = `${createdAt}_${randomId("ev")}`;

  const item: LeagueHistoryItem = {
    leagueId: params.leagueId,
    eventId,
    type: params.type,
    actorUid: params.actorUid,
    payload: params.payload ?? {},
    createdAt,
  };

  await ddb.send(
    new PutCommand({
      TableName: Tables.leagueHistory,
      Item: item,
    }),
  );
}

export async function listLeagueHistory(params: {
  leagueId: string;
  limit: number;
}): Promise<LeagueHistoryItem[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: Tables.leagueHistory,
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeValues: { ":leagueId": params.leagueId },
      ScanIndexForward: false,
      Limit: params.limit,
    }),
  );

  return (res.Items ?? []) as LeagueHistoryItem[];
}
