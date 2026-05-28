import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);

  const membershipRes = await ddb.send(
    new QueryCommand({
      TableName: Tables.leagueMembers,
      IndexName: "uid-index",
      KeyConditionExpression: "uid = :uid",
      ExpressionAttributeValues: { ":uid": uid },
      ProjectionExpression: "leagueId, #role",
      ExpressionAttributeNames: { "#role": "role" },
    }),
  );

  const memberships = (membershipRes.Items ?? []) as any[];
  const roleByLeagueId = new Map<string, string>();
  const leagueIds = memberships
    .map((it) => {
      const leagueId = it.leagueId as string | undefined;
      if (leagueId) roleByLeagueId.set(leagueId, String(it.role || ""));
      return leagueId;
    })
    .filter((x): x is string => Boolean(x));

  if (leagueIds.length === 0) return json(200, { leagues: [] });

  const leagues: any[] = [];
  for (const batch of chunk(leagueIds, 100)) {
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [Tables.leagues]: {
            Keys: batch.map((leagueId) => ({ leagueId })),
          },
        },
      }),
    );

    const items = res.Responses?.[Tables.leagues] ?? [];
    for (const league of items) {
      leagues.push({
        leagueId: league.leagueId,
        name: league.name,
        iconKey: league.iconKey,
        visibility: league.visibility,
        dailyPointsLimit: league.dailyPointsLimit,
        membersCount: league.membersCount,
        createdAt: league.createdAt,
        role: roleByLeagueId.get(String(league.leagueId)) || "member",
      });
    }
  }

  return json(200, { leagues });
};

export const handler = httpHandler(inner);
