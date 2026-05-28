export function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`invalid:${field}`);
  }
  return value.trim();
}

export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`invalid:${field}`);
  }
  return value as T;
}

export function requirePositiveInt(
  value: unknown,
  field: string,
  { min = 1, max = 9999 } = {},
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(`invalid:${field}`);
  }
  return value;
}

export function requireDateYYYYMMDD(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`invalid:${field}`);
  }
  return value;
}
