import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { countApprovedPointsForDay } from "../shared/dailyLimit.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, nowIso, parseJsonBody } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { recordLeagueHistory } from "../shared/leagueHistory.js";
import { publishToLeague } from "../shared/wsPublish.js";

type Body = {
  decision: "approve" | "reject";
  rejectReason?: string;
};

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  const requestId = event.pathParameters?.requestId;
  if (!leagueId) throw new Error("invalid:leagueId");
  if (!requestId) throw new Error("invalid:requestId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin"]);

  const body = parseJsonBody<Body>(event.body);
  if (body.decision !== "approve" && body.decision !== "reject")
    throw new Error("invalid:decision");

  const prRes = await ddb.send(
    new GetCommand({
      TableName: Tables.pointRequests,
      Key: { leagueId, requestId },
    }),
  );
  const pr = prRes.Item as any;
  if (!pr) throw new Error("not_found");
  if (pr.status !== "pending") throw new Error("conflict");

  if (role === "admin" && pr.uid === uid) throw new Error("forbidden");

  const decidedAt = nowIso();

  if (body.decision === "approve") {
    const leagueRes = await ddb.send(
      new GetCommand({ TableName: Tables.leagues, Key: { leagueId } }),
    );
    const league = leagueRes.Item as any;
    if (!league) throw new Error("not_found");

    const limit =
      typeof league.dailyPointsLimit === "number" ? league.dailyPointsLimit : 1;
    const approvedCount = await countApprovedPointsForDay({
      leagueId,
      uid: pr.uid,
      performedOn: pr.performedOn,
    });
    if (approvedCount >= limit) throw new Error("conflict");

    await ddb.send(
      new UpdateCommand({
        TableName: Tables.pointRequests,
        Key: { leagueId, requestId },
        UpdateExpression:
          "SET #status = :approved, decidedAt = :decidedAt, decidedBy = :decidedBy REMOVE rejectReason",
        ConditionExpression: "#status = :pending",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":approved": "approved",
          ":pending": "pending",
          ":decidedAt": decidedAt,
          ":decidedBy": uid,
        },
      }),
    );

    await publishToLeague(leagueId, {
      type: "pointRequest.updated",
      leagueId,
      ts: decidedAt,
      data: { requestId, status: "approved", decidedBy: uid },
    });

    await recordLeagueHistory({
      leagueId,
      type: "pointRequest.decide",
      actorUid: uid,
      payload: { requestUid: pr.uid, status: "approved", points: 1 },
      createdAt: decidedAt,
    });

    return json(200, {
      pointRequest: { requestId, leagueId, status: "approved" },
    });
  }

  await ddb.send(
    new UpdateCommand({
      TableName: Tables.pointRequests,
      Key: { leagueId, requestId },
      UpdateExpression:
        "SET #status = :rejected, decidedAt = :decidedAt, decidedBy = :decidedBy, rejectReason = :rejectReason",
      ConditionExpression: "#status = :pending",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":rejected": "rejected",
        ":pending": "pending",
        ":decidedAt": decidedAt,
        ":decidedBy": uid,
        ":rejectReason": body.rejectReason ?? null,
      },
    }),
  );

  await publishToLeague(leagueId, {
    type: "pointRequest.updated",
    leagueId,
    ts: decidedAt,
    data: { requestId, status: "rejected", decidedBy: uid },
  });

  await recordLeagueHistory({
    leagueId,
    type: "pointRequest.decide",
    actorUid: uid,
    payload: { requestUid: pr.uid, status: "rejected", points: 1 },
    createdAt: decidedAt,
  });

  return json(200, {
    pointRequest: { requestId, leagueId, status: "rejected" },
  });
};

export const handler = httpHandler(inner);
