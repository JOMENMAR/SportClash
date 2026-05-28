import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { verifyTokenToUid } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { nowIso } from "../shared/http.js";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const token = (event as any).queryStringParameters?.token as
    | string
    | undefined;
  if (!token) return { statusCode: 401, body: "missing token" };

  const uid = await verifyTokenToUid(token);
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: "missing connectionId" };

  await ddb.send(
    new PutCommand({
      TableName: Tables.connections,
      Item: {
        connectionId,
        uid,
        connectedAt: nowIso(),
      },
    }),
  );

  return { statusCode: 200, body: "ok" };
};
