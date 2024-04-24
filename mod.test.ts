// Copyright 2022-2024 Kitson P. Kelly. All rights reserved. MIT License

import { assertEquals } from "jsr:@std/assert@0.223/assert-equals";

import { objectToEntity } from "./mod.ts";

Deno.test({
  name: "objectToEntity - simple map",
  fn() {
    const d = new Date();
    const actual = objectToEntity({
      s: "s",
      a: ["s", "t"],
      e: { s: "s" },
      f: 3.1415926,
      g: { longitude: 1, latitude: -1 },
      i: 9223372036854775807n,
      k: { path: [{ id: "a", kind: "A" }] },
      n: 1,
      o: null,
      b: true,
      d,
      t: {
        toJSON() {
          return "t";
        },
      },
      u: new Uint8Array([1, 2, 3, 4]),
    });
    assertEquals(actual, {
      properties: {
        s: { stringValue: "s" },
        a: {
          arrayValue: { values: [{ stringValue: "s" }, { stringValue: "t" }] },
        },
        e: { entityValue: { properties: { s: { stringValue: "s" } } } },
        f: { doubleValue: 3.1415926 },
        g: { geoPointValue: { latitude: -1, longitude: 1 } },
        i: { integerValue: "9223372036854775807" },
        k: { keyValue: { path: [{ id: "a", kind: "A" }] } },
        n: { integerValue: "1" },
        o: { nullValue: "NULL_VALUE" },
        b: { booleanValue: true },
        d: { timestampValue: d.toISOString() },
        t: { stringValue: "t" },
        u: { blobValue: "AQIDBA==", excludeFromIndexes: true },
      },
    });
  },
});
