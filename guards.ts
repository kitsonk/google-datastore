// Copyright 2022-2024 Kitson P. Kelly. All rights reserved. MIT License

/**
 * A set of type guards used by the library.
 *
 * @module
 */

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
} from "./types.ts";

/** Determines if a value is a {@linkcode Key}. */
export function isKey(value: unknown): value is Key {
  return value !== null && typeof value === "object" && "path" in value &&
    // deno-lint-ignore no-explicit-any
    Array.isArray((value as any).path) &&
    // deno-lint-ignore no-explicit-any
    (value as any).path.length >= 1;
}

/** Determines if a value is a {@linkcode LatLng}. */
export function isLatLng(value: unknown): value is LatLng {
  return value !== null && typeof value === "object" && "latitude" in value &&
    "longitude" in value;
}

/** Determines if the value is a {@linkcode ValueArray}. */
export function isValueArray(value: Value): value is ValueArray {
  return "arrayValue" in value;
}

/** Determines if the value is a {@linkcode ValueBlob}. */
export function isValueBlob(value: Value): value is ValueBlob {
  return "blobValue" in value;
}

/** Determines if the value is a {@linkcode ValueBoolean}. */
export function isValueBoolean(value: Value): value is ValueBoolean {
  return "booleanValue" in value;
}

/** Determines if the value is a {@linkcode ValueDouble}. */
export function isValueDouble(value: Value): value is ValueDouble {
  return "doubleValue" in value;
}

/** Determines if the value is a {@linkcode ValueEntity}. */
export function isValueEntity(value: Value): value is ValueEntity {
  return "entityValue" in value;
}

/** Determines if the value is a {@linkcode ValueGeoPoint}. */
export function isValueGeoPoint(value: Value): value is ValueGeoPoint {
  return "geoPointValue" in value;
}

/** Determines if the value is a {@linkcode ValueInteger}. */
export function isValueInteger(value: Value): value is ValueInteger {
  return "integerValue" in value;
}

/** Determines if the value is a {@linkcode ValueKey}. */
export function isValueKey(value: Value): value is ValueKey {
  return "keyValue" in value;
}

/** Determines if the value is a {@linkcode ValueNull}. */
export function isValueNull(value: Value): value is ValueNull {
  return "nullValue" in value;
}

/** Determines if the value is a {@linkcode ValueString}. */
export function isValueString(value: Value): value is ValueString {
  return "stringValue" in value;
}

/** Determines if the value is a {@linkcode ValueTimestamp}. */
export function isValueTimestamp(value: Value): value is ValueTimestamp {
  return "timestampValue" in value;
}
