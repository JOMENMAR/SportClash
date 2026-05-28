import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "rate_limited"
  | "internal_error";

export function json(
  statusCode: number,
  body: unknown,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

export function error(
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): APIGatewayProxyResultV2 {
  return json(statusCode, {
    error: { code, message, details: details ?? undefined },
  });
}

export function parseJsonBody<T>(rawBody: string | undefined | null): T {
  if (!rawBody) throw new Error("Body vacío");
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error("JSON inválido");
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function randomId(prefix: string): string {
  const id = randomUUID().replace(/-/g, "");
  return `${prefix}_${id}`;
}
