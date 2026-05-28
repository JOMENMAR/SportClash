import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "./dynamodb.js";

export type LeagueEventEnvelope = {
  type: string;
  leagueId: string;
  ts: string;
  data: Record<string, unknown>;
};

export async function publishToLeague(
  leagueId: string,
  envelope: LeagueEventEnvelope,
): Promise<void> {
  const endpoint = process.env.WS_ENDPOINT;
  if (!endpoint) return; // allow running without websockets configured

  const connections = await ddb.send(
    new QueryCommand({
      TableName: Tables.connections,
      IndexName: "leagueId-index",
      KeyConditionExpression: "leagueId = :leagueId",
      ExpressionAttributeValues: { ":leagueId": leagueId },
      ProjectionExpression: "connectionId",
    }),
  );

  const items = connections.Items ?? [];
  if (items.length === 0) return;

  const mgmt = new ApiGatewayManagementApiClient({ endpoint });
  const payload = new TextEncoder().encode(JSON.stringify(envelope));

  await Promise.all(
    items.map(async (item) => {
      const connectionId = item.connectionId as string | undefined;
      if (!connectionId) return;
      try {
        await mgmt.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: payload,
          }),
        );
      } catch (err) {
        const statusCode = (err as any)?.$metadata?.httpStatusCode;
        const name = (err as any)?.name;
        const isGone = statusCode === 410 || name === "GoneException";
        if (isGone) {
          await ddb.send(
            new DeleteCommand({
              TableName: Tables.connections,
              Key: { connectionId },
            }),
          );
        }
      }
    }),
  );
}
