import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../shared/dynamodb.js";
import { parseJsonBody } from "../shared/http.js";
import { getMemberRole } from "../shared/leagueAuth.js";

type ClientMessage =
  | { action: "subscribe"; leagueId: string }
  | { action: "unsubscribe"; leagueId?: string }
  | { action: string };

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: "missing connectionId" };

  const connRes = await ddb.send(
    new GetCommand({ TableName: Tables.connections, Key: { connectionId } }),
  );
  const conn = connRes.Item as any;
  if (!conn?.uid) return { statusCode: 401, body: "missing uid" };

  let msg: ClientMessage;
  try {
    msg = parseJsonBody<ClientMessage>(event.body);
  } catch {
    return { statusCode: 400, body: "invalid json" };
  }

  if (msg.action === "subscribe") {
    const leagueId = (msg as any).leagueId as string | undefined;
    if (!leagueId) return { statusCode: 400, body: "missing leagueId" };

    const role = await getMemberRole(leagueId, conn.uid);
    if (!role) return { statusCode: 403, body: "forbidden" };

    await ddb.send(
      new UpdateCommand({
        TableName: Tables.connections,
        Key: { connectionId },
        UpdateExpression: "SET leagueId = :leagueId",
        ExpressionAttributeValues: { ":leagueId": leagueId },
      }),
    );

    return { statusCode: 200, body: "subscribed" };
  }

  if (msg.action === "unsubscribe") {
    await ddb.send(
      new UpdateCommand({
        TableName: Tables.connections,
        Key: { connectionId },
        UpdateExpression: "REMOVE leagueId",
      }),
    );

    return { statusCode: 200, body: "unsubscribed" };
  }

  return { statusCode: 200, body: "ok" };
};
