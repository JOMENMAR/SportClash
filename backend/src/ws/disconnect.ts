import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../shared/dynamodb.js";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: "missing connectionId" };

  await ddb.send(
    new DeleteCommand({
      TableName: Tables.connections,
      Key: { connectionId },
    }),
  );

  return { statusCode: 200, body: "ok" };
};
