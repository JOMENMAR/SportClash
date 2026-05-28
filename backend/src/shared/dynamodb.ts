import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const Tables = {
  leagues: mustEnv("TABLE_LEAGUES"),
  leagueMembers: mustEnv("TABLE_LEAGUE_MEMBERS"),
  joinRequests: mustEnv("TABLE_JOIN_REQUESTS"),
  pointRequests: mustEnv("TABLE_POINT_REQUESTS"),
  users: mustEnv("TABLE_USERS"),
  connections: mustEnv("TABLE_CONNECTIONS"),
  leagueHistory: mustEnv("TABLE_LEAGUE_HISTORY"),
};

function mustEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}
