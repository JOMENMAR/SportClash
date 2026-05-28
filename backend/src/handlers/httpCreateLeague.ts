import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { getUidFromBearer } from "../shared/auth.js";
import { VISIBILITIES } from "../shared/constants.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json, nowIso, parseJsonBody } from "../shared/http.js";
import type { LeagueItem, LeagueMemberItem } from "../shared/types.js";
import {
  requireEnum,
  requireNonEmptyString,
  requirePositiveInt,
} from "../shared/validation.js";

type CreateLeagueBody = {
  name: string;
  iconKey: string;
  visibility: (typeof VISIBILITIES)[number];
  dailyPointsLimit: number;
};

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const body = parseJsonBody<CreateLeagueBody>(event.body);

  const name = requireNonEmptyString(body.name, "name");
  const iconKey = requireNonEmptyString(body.iconKey, "iconKey");
  const visibility = requireEnum(body.visibility, VISIBILITIES, "visibility");
  const dailyPointsLimit = requirePositiveInt(
    body.dailyPointsLimit,
    "dailyPointsLimit",
    { min: 1, max: 10 },
  );

  const leagueId = randomUUID();
  const createdAt = nowIso();

  const league: LeagueItem = {
    leagueId,
    name,
    iconKey,
    visibility,
    dailyPointsLimit,
    membersCount: 1,
    createdAt,
    createdBy: uid,
  };

  const member: LeagueMemberItem = {
    leagueId,
    uid,
    role: "owner",
    joinedAt: createdAt,
  };

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: Tables.users,
              Key: { uid },
              UpdateExpression: "SET ownedLeagueId = :leagueId",
              ConditionExpression: "attribute_not_exists(ownedLeagueId)",
              ExpressionAttributeValues: { ":leagueId": leagueId },
            },
          },
          {
            Put: {
              TableName: Tables.leagues,
              Item: league,
              ConditionExpression: "attribute_not_exists(leagueId)",
            },
          },
          {
            Put: {
              TableName: Tables.leagueMembers,
              Item: member,
              ConditionExpression: "attribute_not_exists(uid)",
            },
          },
        ],
      }),
    );
  } catch (e: any) {
    const name = e?.name as string | undefined;
    if (name === "TransactionCanceledException") {
      throw new Error("conflict");
    }
    throw e;
  }

  return json(201, { league: { leagueId } });
};

export const handler = httpHandler(inner);
