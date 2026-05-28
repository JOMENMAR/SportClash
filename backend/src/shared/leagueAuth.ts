import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "./dynamodb.js";

export type MemberRole = "owner" | "admin" | "member";

export async function getMemberRole(
  leagueId: string,
  uid: string,
): Promise<MemberRole | null> {
  const res = await ddb.send(
    new GetCommand({
      TableName: Tables.leagueMembers,
      Key: { leagueId, uid },
    }),
  );
  const role = res.Item?.role;
  if (role === "owner" || role === "admin" || role === "member") return role;
  return null;
}

export function requireRole(
  role: MemberRole | null,
  allowed: MemberRole[],
): void {
  if (!role) throw new Error("forbidden");
  if (!allowed.includes(role)) throw new Error("forbidden");
}
