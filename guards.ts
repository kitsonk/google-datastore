import type {
  Key,
  LatLng,
  Value,
  ValueArray,
  ValueBlob,
  ValueBoolean,
  ValueDouble,
  ValueEntity,
  ValueGeoPoint,
  ValueInteger,
  ValueKey,
  ValueNull,
  ValueString,
  ValueTimestamp,
} from "./types.d.ts";

export function isKey(value: unknown): value is Key {
  return value !== null && typeof value === "object" && "path" in value &&
    // deno-lint-ignore no-explicit-any
    Array.isArray((value as any).path) &&
    // deno-lint-ignore no-explicit-any
    (value as any).path.length >= 1;
}

export function isLatLng(value: unknown): value is LatLng {
  return value !== null && typeof value === "object" && "latitude" in value &&
    "longitude" in value;
}

export function isValueArray(value: Value): value is ValueArray {
  return "arrayValue" in value;
}

export function isValueBlob(value: Value): value is ValueBlob {
  return "blobValue" in value;
}

export function isValueBoolean(value: Value): value is ValueBoolean {
  return "booleanValue" in value;
}

export function isValueDouble(value: Value): value is ValueDouble {
  return "doubleValue" in value;
}

export function isValueEntity(value: Value): value is ValueEntity {
  return "entityValue" in value;
}

export function isValueGeoPoint(value: Value): value is ValueGeoPoint {
  return "geoPointValue" in value;
}

export function isValueInteger(value: Value): value is ValueInteger {
  return "integerValue" in value;
}

export function isValueKey(value: Value): value is ValueKey {
  return "keyValue" in value;
}

export function isValueNull(value: Value): value is ValueNull {
  return "nullValue" in value;
}

export function isValueString(value: Value): value is ValueString {
  return "stringValue" in value;
}

export function isValueTimestamp(value: Value): value is ValueTimestamp {
  return "timestampValue" in value;
}
