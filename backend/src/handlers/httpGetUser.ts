import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { json } from "../shared/http.js";

function safeString(v: unknown, maxLen: number): string {
  return typeof v === "string" ? v.trim().slice(0, maxLen) : "";
}

const inner: AsyncHttpHandler = async (event) => {
  // Require auth to avoid open scraping.
  await getUidFromBearer(event);

  const uid = String(event.pathParameters?.uid || "").trim();
  if (!uid) throw new Error("invalid:uid");

  const res = await ddb.send(
    new GetCommand({
      TableName: Tables.users,
      Key: { uid },
    }),
  );

  const it = (res.Item as Record<string, unknown> | undefined) ?? { uid };

  const user = {
    uid,
    nombre: safeString(it.nombre, 60),
    apodo: safeString(it.apodo, 40),
    profileIconKey: safeString(it.profileIconKey, 40),
    profileBanner: safeString(it.profileBanner, 20),
    profileAccent: safeString(it.profileAccent, 20),
    profileAccentHex: safeString(it.profileAccentHex, 12),
    profilePageBg: safeString(it.profilePageBg, 20),
    profilePageBgHex: safeString(it.profilePageBgHex, 12),
    status: safeString(it.status, 40),
    bio: safeString(it.bio, 200),
  };

  return json(200, { user });
};

export const handler = httpHandler(inner);
