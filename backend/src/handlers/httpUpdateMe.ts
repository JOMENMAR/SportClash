import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getUidFromBearer } from "../shared/auth.js";
import { ddb, Tables } from "../shared/dynamodb.js";
import { httpHandler, type AsyncHttpHandler } from "../shared/httpHandler.js";
import { nowIso, parseJsonBody, json } from "../shared/http.js";

const PROFILE_ACCENT_KEYS = ["emerald", "sky", "rose", "neutral"] as const;
const PROFILE_BANNER_KEYS = ["none", "classic", "emerald", "sky", "rose"] as const;
const PROFILE_PAGE_BG_KEYS = ["none", "classic", "emerald", "sky", "rose"] as const;

type UpdateMeBody = {
  nombre?: unknown;
  apodo?: unknown;
  fechaNacimiento?: unknown;
  profileIconKey?: unknown;
  profileBanner?: unknown;
  profileAccent?: unknown;
  profileAccentHex?: unknown;
  profilePageBg?: unknown;
  profilePageBgHex?: unknown;
  status?: unknown;
  bio?: unknown;
  profileCompleted?: unknown;
};

function hasOwn(obj: unknown, key: string): boolean {
  return !!obj && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, key);
}

function optTrimmedString(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") throw new Error(`invalid:${field}`);
  return value.trim().slice(0, maxLen);
}

function optStringAllowEmpty(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") throw new Error(`invalid:${field}`);
  return value.trim().slice(0, maxLen);
}

function optDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`invalid:${field}`);
  }
  return value;
}

function optHexAllowEmpty(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`invalid:${field}`);
  const v = value.trim();
  if (!v) return "";
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error(`invalid:${field}`);
  return v;
}

function optEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`invalid:${field}`);
  }
  return value as T[number];
}

function optBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`invalid:${field}`);
  return value;
}

const inner: AsyncHttpHandler = async (event) => {
  const uid = await getUidFromBearer(event);
  const body = parseJsonBody<UpdateMeBody>(event.body);

  const set: Record<string, unknown> = {};

  if (hasOwn(body, "nombre")) set.nombre = optStringAllowEmpty(body.nombre, "nombre", 60);
  if (hasOwn(body, "apodo")) set.apodo = optStringAllowEmpty(body.apodo, "apodo", 40);
  if (hasOwn(body, "fechaNacimiento"))
    set.fechaNacimiento = optDate(body.fechaNacimiento, "fechaNacimiento");

  if (hasOwn(body, "profileIconKey"))
    set.profileIconKey = optStringAllowEmpty(body.profileIconKey, "profileIconKey", 40);
  if (hasOwn(body, "profileBanner"))
    set.profileBanner = optEnum(body.profileBanner, PROFILE_BANNER_KEYS, "profileBanner");
  if (hasOwn(body, "profileAccent"))
    set.profileAccent = optEnum(body.profileAccent, PROFILE_ACCENT_KEYS, "profileAccent");
  if (hasOwn(body, "profileAccentHex"))
    set.profileAccentHex = optHexAllowEmpty(body.profileAccentHex, "profileAccentHex");

  if (hasOwn(body, "profilePageBg"))
    set.profilePageBg = optEnum(body.profilePageBg, PROFILE_PAGE_BG_KEYS, "profilePageBg");
  if (hasOwn(body, "profilePageBgHex"))
    set.profilePageBgHex = optHexAllowEmpty(body.profilePageBgHex, "profilePageBgHex");

  if (hasOwn(body, "status")) set.status = optTrimmedString(body.status, "status", 40);
  if (hasOwn(body, "bio")) set.bio = optTrimmedString(body.bio, "bio", 200);

  const completedAt = nowIso();
  if (hasOwn(body, "profileCompleted")) {
    const v = optBool(body.profileCompleted, "profileCompleted");
    set.profileCompleted = v;
    if (v) set.profileCompletedAt = completedAt;
  }

  set.updatedAt = nowIso();

  const keys = Object.keys(set);
  if (!keys.length) throw new Error("invalid:body");

  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, unknown> = {};
  const parts: string[] = [];

  for (const k of keys) {
    ExpressionAttributeNames[`#${k}`] = k;
    ExpressionAttributeValues[`:${k}`] = set[k];
    parts.push(`#${k} = :${k}`);
  }

  const res = await ddb.send(
    new UpdateCommand({
      TableName: Tables.users,
      Key: { uid },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW",
    }),
  );

  return json(200, { user: res.Attributes ?? { uid } });
};

export const handler = httpHandler(inner);
