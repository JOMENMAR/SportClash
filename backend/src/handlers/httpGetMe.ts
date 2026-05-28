import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);

  const res = await ddb.send(
    new GetCommand({
      TableName: Tables.users,
      Key: { uid },
    }),
  );

  const user = (res.Item as Record<string, unknown> | undefined) ?? { uid };
  return json(200, { user });
};

export const handler = httpHandler(inner);
