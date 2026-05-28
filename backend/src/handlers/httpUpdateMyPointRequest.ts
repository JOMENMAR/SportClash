import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, parseJsonBody } from "../shared/http.js";
import { getMemberRole, requireRole } from "../shared/leagueAuth.js";
import {
  requireDateYYYYMMDD,
  requireNonEmptyString,
} from "../shared/validation.js";
import { publishToLeague } from "../shared/wsPublish.js";

type Body = {
  performedOn?: string;
  note?: string;
};

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const leagueId = event.pathParameters?.leagueId;
  const requestId = event.pathParameters?.requestId;
  if (!leagueId) throw new Error("invalid:leagueId");
  if (!requestId) throw new Error("invalid:requestId");

  const role = await getMemberRole(leagueId, uid);
  requireRole(role, ["owner", "admin", "member"]);

  const body = parseJsonBody<Body>(event.body);

  const updates: string[] = [];
  const exprValues: Record<string, unknown> = {
    ":uid": uid,
    ":pending": "pending",
  };

  if (body.performedOn !== undefined) {
    const performedOn = requireDateYYYYMMDD(body.performedOn, "performedOn");
    updates.push("performedOn = :performedOn");
    exprValues[":performedOn"] = performedOn;
  }
  if (body.note !== undefined) {
    const note = body.note ? requireNonEmptyString(body.note, "note") : "";
    updates.push("note = :note");
    exprValues[":note"] = note;
  }

  if (updates.length === 0) throw new Error("invalid:body");

  // Validación de ownership: uid debe coincidir, y status debe ser pending.
  const existing = await ddb.send(
    new GetCommand({
      TableName: Tables.pointRequests,
      Key: { leagueId, requestId },
    }),
  );
  const item = existing.Item as any;
  if (!item) throw new Error("not_found");
  if (item.uid !== uid) throw new Error("forbidden");
  if (item.status !== "pending") throw new Error("conflict");

  await ddb.send(
    new UpdateCommand({
      TableName: Tables.pointRequests,
      Key: { leagueId, requestId },
      UpdateExpression: `SET ${updates.join(", ")}`,
      ConditionExpression: "uid = :uid AND #status = :pending",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: exprValues,
    }),
  );

  await publishToLeague(leagueId, {
    type: "pointRequest.updated",
    leagueId,
    ts: new Date().toISOString(),
    data: { requestId, status: "pending", updatedBy: uid },
  });

  return json(200, { ok: true });
};

export const handler = httpHandler(inner);
