// Copyright 2022 Kitson P. Kelly. All rights reserved. MIT License

/** APIs for using [Google Datastore](https://cloud.google.com/datastore) from
 * Deno.
 *
 * Google Datastore is Firestore in Datastore under the hood these days, but has
 * a more concise API and lacks the complex rule system that Firestore running
 * in its native mode provides.
 *
 * Users should create an instance of {@linkcode Datastore} to connect to an
 * instance of Google Datastore. Converting a datastore {@linkcode Entity} to
 * a JavaScript object can be done with {@linkcode entityToObject} and a
 * JavaScript object can be converted to an {@linkcode Entity} via
 * {@linkcode objectToEntity}.
 *
 * You can associate a datastore {@linkcode Key} with a JavaScript object via
 * the {@linkcode objectSetKey} function. Any entities that were converted to
 * objects with {@linkcode entityToObject} will already have their key set, so
 * can be mutated and then converted back to an entity and not lose their key.
 *
 * @module
 */

import { Auth } from "./auth.ts";
import { base64 } from "./deps.ts";
import { DatastoreError } from "./error.ts";
export { DatastoreError } from "./error.ts";
import {
  isValueArray,
  isValueBlob,
  isValueBoolean,
  isValueDouble,
  isValueEntity,
  isValueGeoPoint,
  isValueInteger,
  isValueKey,
  isValueNull,
  isValueString,
  isValueTimestamp,
} from "./guards.ts";
import {
  asStream,
  getQueryRequest,
  Query,
  type QueryRequestGenerator,
} from "./query.ts";
import type {
  CommitRequest,
  CommitResponse,
  Entity,
  GoogleDatastoreAdminV1Index,
  GoogleDatastoreAdminV1IndexOutput,
  GoogleDatastoreAdminV1ListIndexesResponse,
  GoogleLongrunningListOperationsResponse,
  GoogleLongrunningOperation,
  GqlQuery,
  Key,
  LookupRequest,
  LookupResponse,
  Mutation,
  PathElement,
  ReadOptions,
  ReserveIdsRequest,
  RunQueryResponse,
  TransactionOptions,
  Value,
} from "./types.d.ts";
import { datastoreKey, getRequestHeaders } from "./util.ts";
export { objectToEntity, toEntity } from "./util.ts";

/** The information from a service account JSON file that is used by the
 * {@linkcode Datastore} to be able to securely connect. */
export interface DatastoreInit {
  client_email: string;
  private_key: string;
  private_key_id: string;
  project_id: string;
}

interface ListOptions {
  filter?: string;
  /** The maximum number of items to return. If zero, then all results will be returned. */
  pageSize?: number;
  /** The next_page_token value returned from a previous List request, if any. */
  pageToken?: string;
}

// deno-lint-ignore ban-types
function optionsToQueryString<O extends object>(options?: O): string {
  return options
    ? `?${new URLSearchParams(Object.entries(options)).toString()}`
    : "";
}

/** Provides the APIs for `indexes` for {@linkcode Datastore} instances.
 * Exported for documentation purposes and should not be instantiated by users.
 *
 * @private */
export class DatastoreIndexes {
  #auth: Auth;

  constructor(auth: Auth) {
    this.#auth = auth;
  }

  /** Creates the specified index.
   *
   * A newly created index's initial state is `CREATING`. On completion of the
   * returned google.longrunning.Operation, the state will be `READY`.
   *
   * If the index already exists, the call will return an `ALREADY_EXISTS`
   * status. During index creation, the process could result in an error, in
   * which case the index will move to the `ERROR` state. The process can be
   * recovered by fixing the data that caused the error, removing the index with
   * delete, then re-creating the index with create.
   *
   * Indexes with a single property cannot be created. */
  async create(
    index: GoogleDatastoreAdminV1Index,
  ): Promise<
    GoogleLongrunningOperation<GoogleDatastoreAdminV1IndexOutput>
  > {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/indexes`,
      {
        method: "POST",
        body: JSON.stringify(index),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Indexes.create error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Deletes an existing index.
   *
   * An index can only be deleted if it is in a `READY` or `ERROR` state. On
   * successful execution of the request, the index will be in a `DELETING`
   * state. And on completion of the returned google.longrunning.Operation, the
   * index will be removed. During index deletion, the process could result in
   * an error, in which case the index will move to the `ERROR` state. The
   * process can be recovered by fixing the data that caused the error, followed
   * by calling delete again. */
  async delete(
    indexId: string | { indexId: string },
  ): Promise<
    GoogleLongrunningOperation<GoogleDatastoreAdminV1IndexOutput>
  > {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const id = typeof indexId === "string" ? indexId : indexId.indexId;
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/indexes/${id}`,
      { method: "DELETE", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Indexes.delete error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Gets an index. */
  async get(
    indexId: string | { indexId: string },
  ): Promise<GoogleDatastoreAdminV1IndexOutput> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const id = typeof indexId === "string" ? indexId : indexId.indexId;
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/indexes/${id}`,
      { method: "GET", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Indexes.get error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Lists the indexes that match the specified filters.
   *
   * Datastore uses an eventually consistent query to fetch the list of indexes
   * and may occasionally return stale results. */
  async list(
    options?: ListOptions,
  ): Promise<GoogleDatastoreAdminV1ListIndexesResponse> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/indexes${
        optionsToQueryString(options)
      }`,
      { method: "GET", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Indexes.list error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }
}

/** Provides the `operations` APIs on the {@linkcode Datastore} instances.
 * Exported for documentation purposes and should not be instantiated by users.
 *
 * @private */
export class DatastoreOperations {
  #auth: Auth;

  constructor(auth: Auth) {
    this.#auth = auth;
  }

  /** Starts asynchronous cancellation on a long-running operation.
   *
   * The server makes a best effort to cancel the operation, but success is not
   * guaranteed. If the server doesn't support this method, it returns
   * `google.rpc.Code.UNIMPLEMENTED`.
   *
   * Clients can use Operations.GetOperation or other methods to check whether
   * the cancellation succeeded or whether the operation completed despite
   * cancellation. On successful cancellation, the operation is not deleted;
   * instead, it becomes an operation with an Operation.error value with a
   * google.rpc.Status.code of 1, corresponding to `Code.CANCELLED`. */
  async cancel(name: string | { name: string }): Promise<void> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const operationsId = typeof name === "string" ? name : name.name;
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/operations/${operationsId}:cancel`,
      { method: "POST", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Operations.cancel error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
  }

  /** Deletes a long-running operation.
   *
   * This method indicates that the client is no longer interested in the
   * operation result. It does not cancel the operation.
   *
   * If the server doesn't support this method, it returns
   * `google.rpc.Code.UNIMPLEMENTED`. */
  async delete(name: string | { name: string }): Promise<void> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const operationsId = typeof name === "string" ? name : name.name;
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/operations/${operationsId}`,
      { method: "DELETE", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Operations.cancel error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
  }

  /** Gets the latest state of a long-running operation.
   *
   * Clients can use this method to poll the operation result at intervals as
   * recommended by the API service. */
  async get(
    name: string | { name: string },
  ): Promise<
    GoogleLongrunningOperation<GoogleDatastoreAdminV1IndexOutput>
  > {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const operationsId = typeof name === "string" ? name : name.name;
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/operations/${operationsId}`,
      { method: "GET", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Operations.cancel error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Lists operations that match the specified filter in the request. */
  async list(
    options?: ListOptions,
  ): Promise<GoogleLongrunningListOperationsResponse> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}/operations${
        optionsToQueryString(options)
      }`,
      { method: "GET", headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Indexes.list error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }
}

interface KeyInitObject {
  namespace: string;
  path: [string, number | bigint | string][];
}

function isKeyInitObject(value: unknown): value is KeyInitObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export type KeyInit =
  | [string, string | number | bigint]
  | string
  | KeyInitObject;

function tupleToPathElement(
  tuple: [string, string | number | bigint],
): PathElement {
  const [kind, nameOrId] = tuple;
  if (typeof nameOrId === "string") {
    return { kind, name: nameOrId };
  }
  return {
    kind,
    id: typeof nameOrId === "bigint"
      ? nameOrId.toString()
      : String(nameOrId.toFixed()),
  };
}

/** An interface to [Google Datastore](https://cloud.google.com/datastore). This
 * is the main class users should use to connect to a Google Datastore instance.
 *
 * ### Example
 *
 * ```ts
 * import { Datastore } from "https://deno.land/x/google_datastore/mod.ts";
 * import keys from "./service-account.json" assert { type: "json" };
 *
 * const datastore = new Datastore(keys);
 *
 * const result = await datastore.query({ kind: "book" });
 * ```
 */
export class Datastore {
  #auth: Auth;
  #indexes: DatastoreIndexes;
  #operations: DatastoreOperations;

  /** APIs related to creating and managing indexes. */
  get indexes(): DatastoreIndexes {
    return this.#indexes;
  }

  /** APIs related to managing operations (long running processes). */
  get operations(): DatastoreOperations {
    return this.#operations;
  }

  constructor(datastoreInit: DatastoreInit) {
    this.#auth = new Auth(datastoreInit, Datastore.SCOPES);
    this.#indexes = new DatastoreIndexes(this.#auth);
    this.#operations = new DatastoreOperations(this.#auth);
  }

  /** Allocates IDs for the given keys, which is useful for referencing an
   * entity before it is inserted. */
  async allocateIds(...keys: Key[]): Promise<Key[]> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:allocateIds`,
      {
        method: "POST",
        body: JSON.stringify({ keys }),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Allocate Ids error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return (await res.json()).keys;
  }

  /** Begins a new transaction. */
  async beginTransaction(
    transactionOptions: TransactionOptions = { readWrite: {} },
  ): Promise<string> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:beginTransaction`,
      {
        method: "POST",
        body: JSON.stringify({ transactionOptions }),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Allocate Ids error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return (await res.json()).transaction;
  }

  /** Commits a transaction, optionally creating, deleting or modifying some
   * entities. */
  async commit(
    mutations: Mutation[],
    transactional = true,
    transaction?: string,
  ): Promise<CommitResponse> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const body: CommitRequest = {
      mode: transactional ? "TRANSACTIONAL" : "NON_TRANSACTIONAL",
      mutations,
      transaction,
    };
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:commit`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Commit error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Create a query. */
  createQuery(kind?: string | string[]): Query;
  createQuery(namespace: string, kind: string | string[]): Query;
  createQuery(
    namespaceOrKind?: string | string[],
    kind?: string | string[],
  ): Query {
    let namespaceId;
    if (kind) {
      if (Array.isArray(namespaceOrKind)) {
        throw new TypeError("Namespace must be a string.");
      }
      namespaceId = namespaceOrKind;
    } else {
      kind = namespaceOrKind;
    }
    return new Query(
      kind,
      namespaceId
        ? {
          projectId: this.#auth.init.project_id,
          namespaceId,
        }
        : undefined,
    );
  }

  /** Generate a key. */
  key(...keyInit: KeyInit[]): Key {
    const [keyInitObject] = keyInit;
    if (isKeyInitObject(keyInitObject)) {
      if (keyInit.length > 1) {
        throw new TypeError("Only one key init object can be passed.");
      }
      return {
        partitionId: {
          projectId: this.#auth.init.project_id,
          namespaceId: keyInitObject.namespace,
        },
        path: keyInitObject.path.map(tupleToPathElement),
      };
    }
    return {
      path: keyInit.map((kindOrTuple) =>
        Array.isArray(kindOrTuple)
          ? tupleToPathElement(kindOrTuple)
          : { kind: kindOrTuple as string }
      ),
    };
  }

  /** Looks up entities by key. */
  async lookup(
    keys: Key | Key[],
    readOptions?: ReadOptions,
  ): Promise<LookupResponse> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    keys = Array.isArray(keys) ? keys : [keys];
    const body: LookupRequest = readOptions ? { keys, readOptions } : { keys };
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:lookup`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Lookup error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Prevents the supplied keys' IDs from being auto-allocated by Cloud
   * Datastore. */
  async reserveIds(keys: Key[], databaseId?: string): Promise<void> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const body: ReserveIdsRequest = databaseId
      ? { databaseId, keys }
      : { keys };
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:reserveIds`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`ReserveIds error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
  }

  /** Rolls back a transaction. */
  async rollback(transaction: string): Promise<void> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:rollback`,
      {
        method: "POST",
        body: JSON.stringify({ transaction }),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Rollback error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
  }

  /** Queries for entities. */
  async runQuery(
    query: Query | QueryRequestGenerator,
  ): Promise<RunQueryResponse> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const body = JSON.stringify(query[getQueryRequest]());
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:runQuery`,
      { method: "POST", body, headers: getRequestHeaders(token) },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Query error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Queries for entities. */
  async runGqlQuery(gqlQuery: GqlQuery): Promise<RunQueryResponse> {
    let token = this.#auth.token;
    if (!token || token.expired) {
      token = await this.#auth.setToken();
    }
    const res = await fetch(
      `${Datastore.API_ROOT}${this.#auth.init.project_id}:runQuery`,
      {
        method: "POST",
        body: JSON.stringify({ gqlQuery }),
        headers: getRequestHeaders(token),
      },
    );
    if (res.status !== 200) {
      throw new DatastoreError(`Query error: ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
        statusInfo: await res.json(),
      });
    }
    return res.json();
  }

  /** Perform a query and return the entities as a stream. */
  streamQuery(query: Query | QueryRequestGenerator): ReadableStream<Entity> {
    return asStream({ query, apiUrl: Datastore.API_ROOT, auth: this.#auth });
  }

  /** The root of the API endpoint. Used when forming request URLs. */
  static readonly API_ROOT = "https://datastore.googleapis.com/v1/projects/";
  /** The scopes provided when obtaining an API token. */
  static readonly SCOPES = "https://www.googleapis.com/auth/datastore";
}

function stringAsInteger(value: string): number | bigint {
  const num = parseInt(value, 10);
  return num > Number.MAX_SAFE_INTEGER ? BigInt(value) : num;
}

/** Convert a Datastore {@linkcode Value} to a JavaScript value. */
export function datastoreValueToValue(value: Value): unknown {
  if (isValueArray(value)) {
    return value.arrayValue.values
      ? value.arrayValue.values.map(datastoreValueToValue)
      : [];
  }
  if (isValueBlob(value)) {
    return base64.decode(value.blobValue);
  }
  if (isValueBoolean(value)) {
    return value.booleanValue;
  }
  if (isValueDouble(value)) {
    return value.doubleValue;
  }
  if (isValueEntity(value)) {
    return entityToObject(value.entityValue);
  }
  if (isValueGeoPoint(value)) {
    return value.geoPointValue;
  }
  if (isValueInteger(value)) {
    return stringAsInteger(value.integerValue);
  }
  if (isValueKey(value)) {
    return value.keyValue;
  }
  if (isValueNull(value)) {
    return null;
  }
  if (isValueString(value)) {
    return value.stringValue;
  }
  if (isValueTimestamp(value)) {
    return new Date(value.timestampValue);
  }
}

interface EntityMetaData {
  [datastoreKey]: Key;
}

/** Convert a Datastore {@linkcode Entity} to a JavaScript object,
 * which can then be serialized easily back into an {@linkcode Entity}. */
export function entityToObject<O>(entity: Entity): O & EntityMetaData {
  // deno-lint-ignore no-explicit-any
  const o: any = Object.create(null);
  for (const [key, value] of Object.entries(entity.properties)) {
    o[key] = datastoreValueToValue(value);
  }
  Object.defineProperty(o, datastoreKey, {
    value: entity.key,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  return o as O & EntityMetaData;
}

/** Assign a datastore {@linkcode Key} to a JavaScript object. This key will
 * then be set in any resulting {@linkcode Entity}. */
export function objectSetKey(obj: unknown, key: Key): void {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    throw new TypeError("Only objects can have the datastore key set.");
  }
  Object.defineProperty(obj, datastoreKey, {
    value: key,
    writable: false,
    enumerable: false,
    configurable: true,
  });
}
