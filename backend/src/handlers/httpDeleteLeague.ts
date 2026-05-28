import {
  BatchWriteCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

type Key = Record<string, any>;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function batchDelete(tableName: string, keys: Key[]): Promise<void> {
  if (keys.length === 0) return;

  for (const batch of chunk(keys, 25)) {
    let unprocessed: any = {
      [tableName]: batch.map((Key) => ({ DeleteRequest: { Key } })),
    };

    // retry simple (hasta 3) por throughput
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await ddb.send(
        new BatchWriteCommand({
          RequestItems: unprocessed,
        }),
      );
      const next = res.UnprocessedItems?.[tableName] ?? [];
      if (next.length === 0) {
        unprocessed = null;
        break;
      }
      unprocessed = { [tableName]: next };
    }

    // Si aún quedan unprocessed, no fallamos duro (best-effort)
  }
}

async function queryAllKeys(params: {
  tableName: string;
  leagueId: string;
  rangeKeyName: string;
  maxItems: number;
}): Promise<Key[]> {
  const keys: Key[] = [];
  let lastKey: any = undefined;

  while (true) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: params.tableName,
        KeyConditionExpression: "leagueId = :leagueId",
        ExpressionAttributeValues: { ":leagueId": params.leagueId },
        ProjectionExpression: `leagueId, ${params.rangeKeyName}`,
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const it of res.Items ?? []) {
      const rk = (it as any)[params.rangeKeyName];
      if (!rk) continue;
      keys.push({ leagueId: params.leagueId, [params.rangeKeyName]: rk });
      if (keys.length >= params.maxItems) return keys;
    }

    lastKey = res.LastEvaluatedKey;
    if (!lastKey) break;
  }

  return keys;
}

async function queryConnectionIdsByLeagueId(params: {
  leagueId: string;
  maxItems: number;
}): Promise<string[]> {
  const ids: string[] = [];
  let lastKey: any = undefined;

  while (true) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: Tables.connections,
        IndexName: "leagueId-index",
        KeyConditionExpression: "leagueId = :leagueId",
        ExpressionAttributeValues: { ":leagueId": params.leagueId },
        ProjectionExpression: "connectionId",
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const it of res.Items ?? []) {
      const id = (it as any).connectionId;
      if (!id) continue;
      ids.push(String(id));
      if (ids.length >= params.maxItems) return ids;
    }

    lastKey = res.LastEvaluatedKey;
    if (!lastKey) break;
  }

  return ids;
}

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const leagueRes = await ddb.send(
    new GetCommand({
      TableName: Tables.leagues,
      Key: { leagueId },
    }),
  );
  const league = leagueRes.Item as any;
  if (!league) throw new Error("not_found");
  if (league.createdBy !== uid) throw new Error("forbidden");

  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: Tables.users,
            Key: { uid },
            UpdateExpression: "REMOVE ownedLeagueId",
            ConditionExpression: "ownedLeagueId = :leagueId",
            ExpressionAttributeValues: { ":leagueId": leagueId },
          },
        },
        {
          Delete: {
            TableName: Tables.leagues,
            Key: { leagueId },
            ConditionExpression: "createdBy = :uid",
            ExpressionAttributeValues: { ":uid": uid },
          },
        },
      ],
    }),
  );

  // Limpieza best-effort (ligas pequeñas):
  const max = 2000;

  const [memberKeys, joinKeys, pointKeys, historyKeys, connectionIds] =
    await Promise.all([
      queryAllKeys({
        tableName: Tables.leagueMembers,
        leagueId,
        rangeKeyName: "uid",
        maxItems: max,
      }),
      queryAllKeys({
        tableName: Tables.joinRequests,
        leagueId,
        rangeKeyName: "requestId",
        maxItems: max,
      }),
      queryAllKeys({
        tableName: Tables.pointRequests,
        leagueId,
        rangeKeyName: "requestId",
        maxItems: max,
      }),
      queryAllKeys({
        tableName: Tables.leagueHistory,
        leagueId,
        rangeKeyName: "eventId",
        maxItems: max,
      }),
      queryConnectionIdsByLeagueId({ leagueId, maxItems: max }),
    ]);

  await Promise.all([
    batchDelete(Tables.leagueMembers, memberKeys),
    batchDelete(Tables.joinRequests, joinKeys),
    batchDelete(Tables.pointRequests, pointKeys),
    batchDelete(Tables.leagueHistory, historyKeys),
    batchDelete(
      Tables.connections,
      connectionIds.map((connectionId) => ({ connectionId })),
    ),
  ]);

  return json(200, { ok: true });
};

export const handler = httpHandler(inner);
