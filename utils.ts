/**
 * Helper functions.
 *
 * @module
 */

import { encodeBase64 } from "@std/encoding/base64";

import type { OAuth2Token } from "./auth.ts";
import { isKey, isLatLng } from "./guards.ts";
import type { Entity, Key, Value } from "./types.ts";

/**
 * A symbol which can be used to provide a custom method to generate an
 * {@linkcode Entity} serialization for an object.  When performing
 * {@linkcode objectToEntity}, this method will be used instead of built in
 * serialization of objects to entities.
 *
 * @example
 *
 * ```ts
 * import { toEntity } from "jsr:@kitsonk/google-datastore";
 *
 * class A {
 *   a = "value";
 *   id = "a";
 *
 *   [toEntity]() {
 *     return {
 *       key: { path: [ { id: this.id, kind: A.KIND } ] },
 *       properties: { a: { stringValue: this.a }},
 *     }
 *   }
 *
 *   static KIND = "A";
 * }
 * ```
 */
export const toEntity = Symbol.for("google.datastore.toEntity");
export const datastoreKey = Symbol.for("google.datastore.key");

const encoder = new TextEncoder();

export function assert(
  cond: unknown,
  message = "Assertion failed.",
): asserts cond {
  if (!cond) {
    throw new Error(message);
  }
}

export function getRequestHeaders(token: OAuth2Token | undefined): Headers {
  const headers = new Headers({
    "accept": "application/json",
    "content-type": "application/json",
  });

  if (token) {
    headers.set("authorization", token.toString());
  }

  return headers;
}

function hasToEntity<T>(value: T): value is T & { [toEntity](): Entity } {
  return value !== null && typeof value === "object" && toEntity in value;
}

// deno-lint-ignore no-explicit-any
function isSerializeable(value: unknown): value is { toJSON(): any } {
  return value !== null && typeof value === "object" && "toJSON" in value;
}

export function toValue(value: unknown): Value | undefined {
  switch (typeof value) {
    case "bigint":
      return { integerValue: value.toString(10) };
    case "boolean":
      return { booleanValue: value };
    case "number":
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return { nullValue: "NULL_VALUE" };
      }
      if (Number.isInteger(value)) {
        return { integerValue: value.toString(10) };
      }
      return { doubleValue: value };
    case "object":
      if (value === null) {
        return { nullValue: "NULL_VALUE" };
      }
      if (ArrayBuffer.isView(value)) {
        if (value.byteLength >= 1_000_000) {
          throw new TypeError(
            "Array buffer exceeds 1,000,000 bytes, which is unsupported.",
          );
        }
        return {
          blobValue: encodeBase64(value.buffer),
          excludeFromIndexes: true,
        };
      }
      if (value instanceof Blob) {
        throw new TypeError(
          "Blob's cannot be serialized into Datastore values. Use an ArrayBuffer directly instead.",
        );
      }
      if (value instanceof ReadableStream) {
        throw new TypeError(
          "ReadableStream's cannot be serialized into Datastore values.",
        );
      }
      if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
      }
      if (Array.isArray(value)) {
        return {
          arrayValue: {
            values: value.map(toValue).filter((value) => !!value) as Value[],
          },
        };
      }
      if (isKey(value)) {
        return { keyValue: value };
      }
      if (isLatLng(value)) {
        return { geoPointValue: value };
      }
      if (isSerializeable(value)) {
        return toValue(value.toJSON());
      }
      return { entityValue: objectToEntity(value) };
    case "string":
      return encoder.encode(value).length >= 1500
        ? { stringValue: value, excludeFromIndexes: true }
        : { stringValue: value };
    case "function":
    case "symbol":
    case "undefined":
      return undefined;
  }
}

/** A function which converts most JavaScript objects to entities that can be
 * stored in Google Datastore. If the object as a {@linkcode toEntity} symbol
 * method, it will be used to serialize the entity. */
// deno-lint-ignore no-explicit-any
export function objectToEntity(obj: any): Entity {
  if (hasToEntity(obj)) {
    return obj.toEntity();
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    throw new TypeError("Only objects can be converted to entities");
  }
  const properties: Record<string, Value> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (key.match(/^__.*__$/)) {
      throw new TypeError("Entity property keys cannot match __.*__.");
    }
    const propertyValue = toValue(value);
    if (propertyValue) {
      properties[key] = propertyValue;
    }
  }
  const key: Key | undefined = obj[datastoreKey];
  return key ? { key, properties } : { properties };
}
