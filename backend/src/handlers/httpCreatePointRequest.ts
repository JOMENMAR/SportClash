import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, nowIso, parseJsonBody, randomId } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import type { PointRequestItem } from "../shared/types.js";
import {
  requireDateYYYYMMDD,
  requireNonEmptyString,
} from "../shared/validation.js";
import { publishToLeague } from "../shared/wsPublish.js";

type Body = {
  performedOn: string;
  note?: string;
};

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  if (!leagueId) throw new Error("invalid:leagueId");

  const leagueRes = await ddb.send(
    new GetCommand({ TableName: Tables.leagues, Key: { leagueId } }),
  );
  if (!leagueRes.Item) throw new Error("not_found");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin", "member"]);

  const body = parseJsonBody<Body>(event.body);
  const performedOn = requireDateYYYYMMDD(body.performedOn, "performedOn");
  const note = body.note ? requireNonEmptyString(body.note, "note") : undefined;

  const createdAt = nowIso();
  const requestId = randomId("pr");

  const item: PointRequestItem = {
    leagueId,
    requestId,
    uid,
    status: "pending",
    points: 1,
    note,
    performedOn,
    createdAt,
  };

  await ddb.send(
    new PutCommand({
      TableName: Tables.pointRequests,
      Item: item,
      ConditionExpression: "attribute_not_exists(requestId)",
    }),
  );

  await publishToLeague(leagueId, {
    type: "pointRequest.created",
    leagueId,
    ts: createdAt,
    data: { requestId, uid, performedOn },
  });

  return json(201, {
    pointRequest: {
      requestId,
      leagueId,
      uid,
      status: "pending",
      points: 1,
      performedOn,
      createdAt,
    },
  });
};

export const handler = httpHandler(inner);
