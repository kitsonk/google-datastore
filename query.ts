/**
 * Contains the {@linkcode Query} class which provides an abstraction over the
 * native Google Datastore Query.
 *
 * @module
 */

import { encodeBase64 } from "@std/encoding/base64";

import type { Auth } from "./auth.ts";
import { DatastoreError } from "./error.ts";
import type {
  Entity,
  Filter,
  Key,
  PartitionId,
  PropertyFilter,
  PropertyOrder,
  QueryResultBatch,
  RunQueryRequest,
  RunQueryResponse,
} from "./types.ts";
import { assert, getRequestHeaders, toValue } from "./utils.ts";

export const getQueryRequest = Symbol.for("google.datastore.getQueryRequest");

export interface QueryRequestGenerator {
  [getQueryRequest](): RunQueryRequest;
}

export function isQueryGenerator(
  value: unknown,
): value is QueryRequestGenerator {
  return value !== null && typeof value === "object" &&
    getQueryRequest in value;
}

const OPERATORS = {
  "=": "EQUAL",
  "<": "LESS_THAN",
  ">": "GREATER_THAN",
  "<=": "LESS_THAN_OR_EQUAL",
  ">=": "GREATER_THAN_OR_EQUAL",
} as const;

/** The types of operators supported when querying. */
export type Operator = keyof typeof OPERATORS;

type QueryFilterOperator = typeof OPERATORS[Operator] | "HAS_ANCESTOR";

function isOperator(value: unknown): value is Operator {
  return typeof value === "string" && value in OPERATORS;
}

function asStringBytes(value: string | ArrayBufferView): string {
  if (typeof value === "string") {
    return value;
  }
  return encodeBase64(value.buffer);
}

function asPropertyFilter(
  tuple: [string, QueryFilterOperator, unknown],
): PropertyFilter {
  const [name, op, filterValue] = tuple;
  const value = toValue(filterValue);
  assert(value, "Value cannot be undefined");
  return { op, property: { name }, value };
}

function asFilter(value: [string, QueryFilterOperator, unknown][]): Filter {
  if (value.length === 1) {
    return { propertyFilter: asPropertyFilter(value[0]) };
  }
  return {
    compositeFilter: {
      filters: value.map((v) => ({ propertyFilter: asPropertyFilter(v) })),
      op: "AND",
    },
  };
}

/** A class which abstracts the native Google Datastore Query interface and
 * provides a fluent interface for building a query. */
export class Query implements QueryRequestGenerator {
  #end?: string | ArrayBufferView;
  #filters: [string, QueryFilterOperator, unknown][] = [];
  #groupBy: string[] = [];
  #kinds: string[];
  #limit?: number;
  #offset?: number;
  #order: [string, boolean | undefined][] = [];
  #partition?: PartitionId;
  #select: string[] = [];
  #start?: string | ArrayBufferView;

  constructor(kind: string | string[] = [], partition?: PartitionId) {
    this.#kinds = Array.isArray(kind) ? kind : [kind];
    this.#partition = partition;
  }

  /** Provide an end cursor for the query. */
  end(cursor: string | ArrayBufferView): this {
    this.#end = cursor;
    return this;
  }

  /** Filter the results where the supplied property equals the value.
   *
   * To filter by ancestors see {@linkcode Query.hasAncestor}. */
  filter(property: string, value: unknown): this;
  /** Filter the results where the supplied property matches the operator.
   *
   * The operators `"="`, `"<"`, `">"`, `"<="`, and `">="` are supported. To
   * filter by ancestors see {@linkcode Query.hasAncestor}. */
  filter(property: string, op: Operator, value: unknown): this;
  filter(
    property: string,
    valueOrOp: Operator | unknown,
    value?: unknown,
  ): this {
    let op: Operator = "=";
    if (value) {
      if (!isOperator(valueOrOp)) {
        throw new TypeError("op is invalid.");
      }
      op = valueOrOp;
    } else {
      value = valueOrOp;
    }
    this.#filters.push([property, OPERATORS[op], value]);
    return this;
  }

  /** Group query results by a list of properties. */
  groupBy(fieldNames: string | string[]): this {
    if (Array.isArray(fieldNames)) {
      this.#groupBy.push(...fieldNames);
    } else {
      this.#groupBy.push(fieldNames);
    }
    return this;
  }

  /** Filter query by ancestors. */
  hasAncestor(key: Key): this {
    this.#filters.push(["__key__", "HAS_ANCESTOR", key]);
    return this;
  }

  /** Limit the number of results returned. */
  limit(limit: number): this {
    if (limit < 1) {
      throw new TypeError("Limit must be greater than 1.");
    }
    this.#limit = limit;
    return this;
  }

  /** Start returning results after the offset, the value must be > 1. */
  offset(offset: number): this {
    if (offset < 1) {
      throw new TypeError("Offset must be greater than 1.");
    }
    this.#offset = offset;
    return this;
  }

  /** Sort the results by a property name in ascending or descending order.
   *
   * By default, the results will be in ascending order. Set `descending` to
   * `true` to sort in descending order. */
  order(property: string, descending?: boolean): this {
    this.#order.push([property, descending]);
    return this;
  }

  /** Retrieve only select properties from the matched entities. */
  select(fieldNames: string | string[]): this {
    if (Array.isArray(fieldNames)) {
      this.#select.push(...fieldNames);
    } else {
      this.#select.push(fieldNames);
    }
    return this;
  }

  /** Set a start cursor for the query. */
  start(cursor: string | ArrayBufferView): this {
    this.#start = cursor;
    return this;
  }

  [getQueryRequest](): RunQueryRequest {
    const request: RunQueryRequest = {};
    if (this.#partition) {
      request.partitionId = this.#partition;
    }
    const query: Required<RunQueryRequest>["query"] = {};
    request.query = query;
    if (this.#groupBy.length) {
      query.distinctOn = this.#groupBy.map((name) => ({ name }));
    }
    if (this.#end) {
      query.endCursor = asStringBytes(this.#end);
    }
    if (this.#filters.length) {
      query.filter = asFilter(this.#filters);
    }
    if (this.#kinds.length) {
      query.kind = this.#kinds.map((name) => ({ name }));
    }
    if (this.#limit) {
      query.limit = this.#limit;
    }
    if (this.#offset) {
      query.offset = this.#offset;
    }
    if (this.#order.length) {
      query.order = this.#order.map(([name, desc]) => {
        const propertyOrder: PropertyOrder = { property: { name } };
        if (desc !== undefined) {
          propertyOrder.direction = desc ? "DESCENDING" : "ASCENDING";
        }
        return propertyOrder;
      });
    }
    if (this.#select.length) {
      query.projection = this.#select.map((name) => ({ property: { name } }));
    }
    if (this.#start) {
      query.startCursor = asStringBytes(this.#start);
    }
    return request;
  }
}

export interface RunQueryOptions {
  query: QueryRequestGenerator;
  auth: Auth;
}

function enqueueBatch(
  controller: ReadableStreamDefaultController<Entity>,
  batch: QueryResultBatch,
): string | undefined {
  if (!batch.entityResults) {
    return;
  }
  for (const { entity } of batch.entityResults) {
    controller.enqueue(entity);
  }
  if (batch.moreResults === "NOT_FINISHED") {
    return batch.endCursor;
  }
}

export function asStream(
  { query, auth }: RunQueryOptions,
): ReadableStream<Entity> {
  const stream = new ReadableStream({
    async start(controller) {
      let more: string | undefined;
      do {
        let token = auth.token;
        if (!token || token.expired) {
          token = await auth.setToken();
        }
        const q = query[getQueryRequest]();
        if (more && q.query && !(q.query.startCursor)) {
          q.query.startCursor = more;
        }
        const body = JSON.stringify(q);
        const res = await fetch(
          `${auth.baseEndpoint}:runQuery`,
          { method: "POST", body, headers: getRequestHeaders(token) },
        );
        if (res.status !== 200) {
          controller.error(
            new DatastoreError(`Query error: ${res.statusText}`, {
              status: res.status,
              statusText: res.statusText,
              statusInfo: await res.json(),
            }),
          );
        }
        const queryResponse: RunQueryResponse = await res.json();
        more = enqueueBatch(controller, queryResponse.batch);
      } while (more);
      controller.close();
    },
  });
  return stream;
}
