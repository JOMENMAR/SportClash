import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { getMemberRole } from "../shared/leagueAuth.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

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

  const league = leagueRes.Item;
  if (!league) throw new Error("not_found");

  if (league.visibility === "private") {
    const role = await getMemberRole(leagueId, uid);
    if (!role) throw new Error("forbidden");
  }

  return json(200, { league });
};

export const handler = httpHandler(inner);
