import {
  GetCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, nowIso, parseJsonBody } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import { recordLeagueHistory } from "../shared/leagueHistory.js";
import { publishToLeague } from "../shared/wsPublish.js";

type DecideBody = {
  decision: "approve" | "reject";
};

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  const requestId = event.pathParameters?.requestId;
  if (!leagueId) throw new Error("invalid:leagueId");
  if (!requestId) throw new Error("invalid:requestId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin"]);

  const body = parseJsonBody<DecideBody>(event.body);
  if (body.decision !== "approve" && body.decision !== "reject") {
    throw new Error("invalid:decision");
  }

  const reqRes = await ddb.send(
    new GetCommand({
      TableName: Tables.joinRequests,
      Key: { leagueId, requestId },
    }),
  );
  const joinReq = reqRes.Item as any;
  if (!joinReq) throw new Error("not_found");
  if (joinReq.status !== "pending") throw new Error("conflict");

  const decidedAt = nowIso();

  if (body.decision === "approve") {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: Tables.joinRequests,
              Key: { leagueId, requestId },
              UpdateExpression:
                "SET #status = :approved, decidedAt = :decidedAt, decidedBy = :decidedBy",
              ConditionExpression: "#status = :pending",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":approved": "approved",
                ":pending": "pending",
                ":decidedAt": decidedAt,
                ":decidedBy": uid,
              },
            },
          },
          {
            Put: {
              TableName: Tables.leagueMembers,
              Item: {
                leagueId,
                uid: joinReq.uid,
                role: "member",
                joinedAt: decidedAt,
              },
              ConditionExpression: "attribute_not_exists(uid)",
            },
          },
          {
            Update: {
              TableName: Tables.leagues,
              Key: { leagueId },
              UpdateExpression:
                "SET membersCount = if_not_exists(membersCount, :zero) + :one",
              ExpressionAttributeValues: { ":zero": 0, ":one": 1 },
            },
          },
        ],
      }),
    );

    await publishToLeague(leagueId, {
      type: "joinRequest.updated",
      leagueId,
      ts: decidedAt,
      data: { requestId, status: "approved", decidedBy: uid },
    });
    await publishToLeague(leagueId, {
      type: "member.created",
      leagueId,
      ts: decidedAt,
      data: { uid: joinReq.uid, role: "member" },
    });

    await recordLeagueHistory({
      leagueId,
      type: "joinRequest.decide",
      actorUid: uid,
      payload: { requestUid: joinReq.uid, status: "approved" },
      createdAt: decidedAt,
    });

    return json(200, {
      joinRequest: { requestId, leagueId, status: "approved" },
    });
  }

  await ddb.send(
    new UpdateCommand({
      TableName: Tables.joinRequests,
      Key: { leagueId, requestId },
      UpdateExpression:
        "SET #status = :rejected, decidedAt = :decidedAt, decidedBy = :decidedBy",
      ConditionExpression: "#status = :pending",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":rejected": "rejected",
        ":pending": "pending",
        ":decidedAt": decidedAt,
        ":decidedBy": uid,
      },
    }),
  );

  await publishToLeague(leagueId, {
    type: "joinRequest.updated",
    leagueId,
    ts: decidedAt,
    data: { requestId, status: "rejected", decidedBy: uid },
  });

  await recordLeagueHistory({
    leagueId,
    type: "joinRequest.decide",
    actorUid: uid,
    payload: { requestUid: joinReq.uid, status: "rejected" },
    createdAt: decidedAt,
  });

  return json(200, {
    joinRequest: { requestId, leagueId, status: "rejected" },
  });
};

export const handler = httpHandler(inner);
