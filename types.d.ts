// Copyright 2022 Kitson P. Kelly. All rights reserved. MIT License

/** Provides types and interfaces to operate with Google Datastore.
 *
 * This is based of off: https://datastore.googleapis.com/$discovery/rest?version=v1
 *
 * @module
 */

/** An array value. */
export interface ArrayValue {
  /** Values in the array.
   *
   * The order of values in an array is preserved as long as all values have
   * identical settings for 'exclude_from_indexes'. */
  values?: Value[];
}

/** The request for Datastore.Commit. */
export interface CommitRequest {
  /** The type of commit to perform. Defaults to `TRANSACTIONAL`. */
  mode?: "TRANSACTIONAL" | "NON_TRANSACTIONAL";
  mutations: Mutation[];
  transaction?: string;
}

/** A filter that merges multiple other filters using the given operator. */
export interface CompositeFilter {
  /** The list of filters to combine. Must contain at least one filter. */
  filters: Filter[];
  /** The operator for combining multiple filters. */
  op: "AND";
}

/** The response for Datastore.Commit. */
export interface CommitResponse {
  /** The number of index entries updated during the commit, or zero if none
   * were updated. */
  indexUpdates: number;
  /** The result of performing the mutations. The i-th mutation result
   * corresponds to the i-th mutation in the request. */
  mutationResults: MutationResult[];
}

/** A Datastore data object. An entity is limited to 1 megabyte when stored.
 *
 * That _roughly_ corresponds to a limit of 1 megabyte for the serialized form
 * of this message. */
export interface Entity {
  /** The entity's key. An entity must have a key, unless otherwise documented
   * (for example, an entity in `Value.entity_value` may have no key). An
   * entity's kind is its key path's last element's kind, or null if it has no
   * key. */
  key?: Key;
  /** The entity's properties. The map's keys are property names. A property
   * name matching regex `__.*__` is reserved. A reserved property name is
   * forbidden in certain documented contexts. The name must not contain more
   * than 500 characters. The name cannot be `""`. */
  properties: Record<string, Value>;
}

/** The result of fetching an entity from Datastore. */
export interface EntityResult {
  /** A cursor that points to the position after the result entity. Set only
   * when the `EntityResult` is part of a `QueryResultBatch` message. */
  cursor?: string;
  /** The resulting entity. */
  entity: Entity;
  /** The version of the entity, a strictly positive number that monotonically
   * increases with changes to the entity.
   *
   * This field is set for `FULL` entity results. For missing entities in
   * `LookupResponse`, this is the version of the snapshot that was used to look
   * up the entity, and it is always set except for eventually consistent
   * reads. */
  version?: string;
}

/** A holder for any type of filter. */
export interface Filter {
  /** A composite filter. */
  compositeFilter?: CompositeFilter;
  /** A filter on a property. */
  propertyFilter?: PropertyFilter;
}

/** Datastore composite index definition. */
export interface GoogleDatastoreAdminV1Index {
  /** Required. The index's ancestor mode.
   *
   * Must not be ANCESTOR_MODE_UNSPECIFIED. */
  ancestor: "NONE" | "ALL_ANCESTORS";
  /** Required. The entity kind to which this index applies. */
  kind: string;
  /** Required. An ordered sequence of property names and their index
   * attributes. */
  properties: GoogleDatastoreAdminV1IndexedProperty[];
}

export interface GoogleDatastoreAdminV1IndexOutput
  extends GoogleDatastoreAdminV1Index {
  /** Output only. The resource ID of the index. */
  readonly indexId: string;
  /** Output only. Project ID. */
  readonly projectId: string;
  /** Output only. The state of the index. */
  readonly state: "CREATING" | "READY" | "DELETING" | "ERROR";
}

/** A property of an index. */
export interface GoogleDatastoreAdminV1IndexedProperty {
  /** Required. The indexed property's direction. Must not be
   * DIRECTION_UNSPECIFIED. */
  direction: "ASCENDING" | "DESCENDING";
  /** Required. The property name to index. */
  name: string;
}

/** The response for google.datastore.admin.v1.DatastoreAdmin.ListIndexes. */
export interface GoogleDatastoreAdminV1ListIndexesResponse {
  /** The indexes. */
  indexes: GoogleDatastoreAdminV1IndexOutput[];
  /** The standard List next-page token. */
  nextPageToken?: string;
}

/** This resource represents a long-running operation that is the result of a
 * network API call. */
// deno-lint-ignore ban-types
export interface GoogleLongrunningOperation<Response extends object> {
  /** If the value is `false`, it means the operation is still in progress. If
   * `true`, the operation is completed, and either `error` or `response` is
   * available. */
  done: boolean;
  /** The error result of the operation in case of failure or cancellation. */
  error?: Status;
  /** Service-specific metadata associated with the operation.
   *
   * It typically contains progress information and common metadata such as
   * create time. Some services might not provide such metadata. Any method that
   * returns a long-running operation should document the metadata type, if
   * any. */
  metadata?: Record<string, unknown>;
  /** The server-assigned name, which is only unique within the same service
   * that originally returns it. If you use the default HTTP mapping, the `name`
   * should be a resource name ending with `operations/{unique_id}`. */
  name: string;
  /** The normal response of the operation in case of success.
   *
   * If the original method returns no data on success, such as `Delete`, the
   * response is `google.protobuf.Empty`. If the original method is standard
   * `Get`/`Create`/`Update`, the response should be the resource.
   *
   * For other methods, the response should have the type `XxxResponse`, where
   * `Xxx` is the original method name. For example, if the original method name
   * is `TakeSnapshot()`, the inferred response type is
   * `TakeSnapshotResponse`. */
  response?: Response;
}

/** The response message for Operations.ListOperations. */
export interface GoogleLongrunningListOperationsResponse {
  /** The standard List next-page token. */
  nextPageToken?: string;
  /** A list of operations that matches the specified filter in the request. */
  operations: GoogleLongrunningOperation<GoogleDatastoreAdminV1IndexOutput>[];
}

/** A
 * [GQL query](https://cloud.google.com/datastore/docs/apis/gql/gql_reference). */
export interface GqlQuery {
  /** When false, the query string must not contain any literals and instead
   * must bind all values. For example, `SELECT * FROM Kind WHERE a = 'string
   * literal'` is not allowed, while `SELECT * FROM Kind WHERE a = @value`
   * is. */
  allowLiterals?: boolean;
  /** For each non-reserved named binding site in the query string, there must
   * be a named parameter with that name, but not necessarily the inverse.
   *
   * Key must match regex `A-Za-z_$*`, must not match regex `__.*__`, and must
   * not be `""`. */
  namedBindings?: Record<string, GqlQueryParameter>;
  /** Numbered binding site @1 references the first numbered parameter,
   * effectively using 1-based indexing, rather than the usual 0.
   *
   * For each binding site numbered i in `query_string`, there must be an i-th
   * numbered parameter. The inverse must also be true. */
  positionalBindings?: GqlQueryParameter[];
  /** A string of the format described
   * [here](https://cloud.google.com/datastore/docs/apis/gql/gql_reference). */
  queryString: string;
}

/** A binding parameter for a GQL query. */
export interface GqlQueryParameter {
  /** A query cursor. Query cursors are returned in query result batches. */
  cursor?: string;
  /** A value parameter. */
  value?: Value;
}

/** A unique identifier for an entity. If a key's partition ID or any of its
 * path kinds or names are reserved/read-only, the key is reserved/read-only.
 *
 * A reserved/read-only key is forbidden in certain documented contexts. */
export interface Key {
  /** Entities are partitioned into subsets, currently identified by a project
   * ID and namespace ID. Queries are scoped to a single partition. */
  partitionId?: PartitionId;
  /** The entity path.
   *
   * An entity path consists of one or more elements composed of a kind and a
   * string or numerical identifier, which identify entities. The first element
   * identifies a _root entity_, the second element identifies a _child_ of the
   * root entity, the third element identifies a child of the second entity,
   * and so forth.
   *
   * The entities identified by all prefixes of the path are called the
   * element's _ancestors_. An entity path is always fully complete: *all* of
   * the entity's ancestors are required to be in the path along with the entity
   * identifier itself. The only exception is that in some documented cases, the
   * identifier in the last path element (for the entity) itself may be omitted.
   * For example, the last path element of the key of `Mutation.insert` may have
   * no identifier.
   *
   * A path can never be empty, and a path can have at most 100 elements. */
  path: PathElement[];
}

/** A representation of a kind. */
export interface KindExpression {
  /** The name of the kind. */
  name: string;
}

/** An object representing a latitude/longitude pair.
 *
 * This is expressed as a pair of doubles representing degrees latitude and
 * degrees longitude. Unless specified otherwise, this must conform to the WGS84
 * standard.
 *
 * Values must be within normalized ranges. */
export interface LatLng {
  /** The latitude in degrees.
   *
   * It must be in the range [-90.0, +90.0]. */
  latitude: number;
  /** The longitude in degrees.
   *
   * It must be in the range [-180.0, +180.0]. */
  longitude: number;
}

/** The request for Datastore.Lookup. */
export interface LookupRequest {
  /** Required. Keys of entities to look up. */
  keys: Key[];
  /** The options for this lookup request. */
  readOptions?: ReadOptions;
}

/** The response for Datastore.Lookup. */
export interface LookupResponse {
  /** A list of keys that were not looked up due to resource constraints.
   *
   * The order of results in this field is undefined and has no relation to the
   * order of the keys in the input. */
  deferred?: Key[];
  /** Entities found as `ResultType.FULL` entities.
   *
   * The order of results in this field is undefined and has no relation to the
   * order of the keys in the input. */
  found?: EntityResult[];
  /** Entities not found as `ResultType.KEY_ONLY` entities.
   *
   * The order of results in this field is undefined and has no relation to the
   * order of the keys in the input. */
  missing?: EntityResult[];
}

interface MutationBase {
  /** The version of the entity that this mutation is being applied to. If this
   * does not match the current version on the server, the mutation
   * conflicts. */
  baseVersion?: string;
}

interface MutationDelete extends MutationBase {
  /** The key of the entity to delete.
   *
   * The entity may or may not already exist. Must have a complete key path an
   *  must not be reserved/read-only. */
  delete: Key;
}

interface MutationInsert extends MutationBase {
  /** The entity to insert.
   *
   * The entity must not already exist. The entity key's final path element may
   * be incomplete. */
  insert: Entity;
}

interface MutationUpdate extends MutationBase {
  /** The entity to update.
   *
   * The entity must already exist. Must have a complete key path. */
  update: Entity;
}

interface MutationUpsert extends MutationBase {
  /** The entity to upsert.
   *
   * The entity may or may not already exist. The entity key's final path
   * element may be incomplete. */
  upsert: Entity;
}

/** A mutation to apply to an entity. */
export type Mutation =
  | MutationDelete
  | MutationInsert
  | MutationUpdate
  | MutationUpsert;

/** The result of applying a mutation. */
export interface MutationResult {
  /** Whether a conflict was detected for this mutation. Always `false` when a
   * conflict detection strategy field is not set in the mutation. */
  conflictDetected: boolean;
  /** The automatically allocated key. Set only when the mutation allocated a
   * key. */
  key?: Key;
  /** The version of the entity on the server after processing the mutation.
   *
   * If the mutation doesn't change anything on the server, then the version
   * will be the version of the current entity or, if no entity is present, a
   * version that is strictly greater than the version of any previous entity
   * and less than the version of any possible future entity. */
  version: string;
}

/** A partition ID identifies a grouping of entities.
 *
 * The grouping is always by project and namespace, however the namespace ID may
 * be empty. A partition ID contains several dimensions: project ID and
 * namespace ID.
 *
 * Partition dimensions:
 *   - May be `""`. - Must be valid UTF-8 bytes.
 *   - Must have values that match regex `[A-Za-z\\d\\.\\-_]{1,100}`
 *
 * If the value of any dimension matches regex `__.*__`, the partition is
 * reserved/read-only. A reserved/read-only partition ID is forbidden in certain
 * documented contexts.
 *
 * Foreign partition IDs (in which the project ID does not match the context
 * project ID ) are discouraged. Reads and writes of foreign partition IDs may
 * fail if the project is not in an active state. */
export interface PartitionId {
  /** If not empty, the ID of the namespace to which the entities belong. */
  namespaceId?: string;
  /** The ID of the project to which the entities belong. */
  projectId: string;
}

/** A (kind, ID/name) pair used to construct a key path.
 *
 * If either name or ID is set, the element is complete. If neither is set, the
 * element is incomplete. */
export interface PathElement {
  /** The auto-allocated ID of the entity.
   *
   * Never equal to zero. Values less than zero are discouraged and may not be
   * supported in the future. */
  id?: string;
  /** The kind of the entity. A kind matching regex `__.*__` is
   * reserved/read-only.
   *
   * A kind must not contain more than 1500 bytes when UTF-8 encoded. Cannot be
   * `""`. */
  kind: string;
  /** The name of the entity.
   *
   * A name matching regex `__.*__` is reserved/read-only. A name must not be
   * more than 1500 bytes when UTF-8 encoded. Cannot be `""`. */
  name?: string;
}

/** A representation of a property in a projection. */
export interface Projection {
  /** The property to project. */
  property: PropertyReference;
}

/** A filter on a specific property. */
export interface PropertyFilter {
  /** The operator to filter by. */
  op:
    | "LESS_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "GREATER_THAN"
    | "GREATER_THAN_OR_EQUAL"
    | "EQUAL"
    | "HAS_ANCESTOR";
  /** The property to filter by. */
  property: PropertyReference;
  /** The value to compare the property to. */
  value: Value;
}

/** The desired order for a specific property. */
export interface PropertyOrder {
  /** The direction to order by. Defaults to `ASCENDING`. */
  direction?: "ASCENDING" | "DESCENDING";
  /** The property to order by. */
  property: PropertyReference;
}

export interface PropertyReference {
  /** The name of the property.
   *
   * If name includes "."s, it may be interpreted as a property name path. */
  name: string;
}

/** A query for entities. */
export interface Query {
  /** The properties to make distinct.
   *
   * The query results will contain the first result for each distinct
   * combination of values for the given properties (if empty, all results are
   * returned). */
  distinctOn?: PropertyReference[];
  /** An ending point for the query results.
   *
   * Query cursors are returned in query result batches and [can only be used to
   * limit the same query](https://cloud.google.com/datastore/docs/concepts/queries#cursors_limits_and_offsets).
   */
  endCursor?: string;
  /** The filter to apply. */
  filter?: Filter;
  /** The kinds to query (if empty, returns entities of all kinds).
   *
   * Currently at most 1 kind may be specified. */
  kind?: KindExpression[];
  /** The maximum number of results to return.
   *
   * Applies after all other constraints. Optional. Unspecified is interpreted
   * as no limit.
   *
   * Must be >= 0 if specified. */
  limit?: number;
  /** The number of results to skip.
   *
   * Applies before limit, but after all other constraints. Optional.
   *
   * Must be >= 0 if specified. */
  offset?: number;
  /** The order to apply to the query results (if empty, order is
   * unspecified). */
  order?: PropertyOrder[];
  /** The projection to return.
   *
   * Defaults to returning all properties. */
  projection?: Projection[];
  /** A starting point for the query results.
   *
   * Query cursors are returned in query result batches and [can only be used to
   * continue the same query](https://cloud.google.com/datastore/docs/concepts/queries#cursors_limits_and_offsets).
   */
  startCursor?: string;
}

/** A batch of results produced by a query. */
export interface QueryResultBatch {
  /** A cursor that points to the position after the last result in the batch. */
  endCursor: string;
  /** The result type for every entity in `entity_results`. */
  entityResultType:
    | "RESULT_TYPE_UNSPECIFIED"
    | "FULL"
    | "PROJECTION"
    | "KEY_ONLY";
  /** The results for this batch. */
  entityResults?: EntityResult[];
  /** The state of the query after the current batch. */
  moreResults:
    | "MORE_RESULTS_TYPE_UNSPECIFIED"
    | "NOT_FINISHED"
    | "MORE_RESULTS_AFTER_LIMIT"
    | "MORE_RESULTS_AFTER_CURSOR"
    | "NO_MORE_RESULTS";
  /** A cursor that points to the position after the last skipped result. Will
   * be set when `skipped_results` != 0. */
  skippedCursor?: string;
  /** The number of results skipped, typically because of an offset. */
  skippedResults?: number;
  /** The version number of the snapshot this batch was returned from.
   *
   * This applies to the range of results from the query's `start_cursor` (or
   * the beginning of the query if no cursor was given) to this batch's
   * `end_cursor` (not the query's `end_cursor`).
   *
   * In a single transaction, subsequent query result batches for the same query
   * can have a greater snapshot version number. Each batch's snapshot version
   * is valid for all preceding batches.
   *
   * The value will be zero for eventually consistent queries. */
  snapshotVersion: string;
}

/** Options specific to read-only transactions. */
export type ReadOnly = Record<never, never>;

/** The options shared by read requests. */
export interface ReadOptions {
  /** The non-transactional read consistency to use. Cannot be set to `STRONG`
   * for global queries. */
  readConsistency?: "STRONG" | "EVENTUAL";
  /** The identifier of the transaction in which to read. A transaction
   * identifier is returned by a call to Datastore.BeginTransaction. */
  transaction?: string;
}

/** Options specific to read / write transactions. */
export interface ReadWrite {
  /** The transaction identifier of the transaction being retried. */
  previousTransaction?: string;
}

/** The response for Datastore.RunQuery. */
export interface RunQueryResponse {
  /** A batch of query results (always present). */
  batch: QueryResultBatch;
  /** The parsed form of the `GqlQuery` from the request, if it was set. */
  query?: Query;
}

/** The request for Datastore.ReserveIds. */
export interface ReserveIdsRequest {
  /** If not empty, the ID of the database against which to make the request. */
  databaseId?: string;
  /** Required. A list of keys with complete key paths whose numeric IDs should
   * not be auto-allocated. */
  keys: Key[];
}

/** The request for Datastore.RunQuery. */
export interface RunQueryRequest {
  /** The GQL query to run. */
  gqlQuery?: GqlQuery;
  /** Entities are partitioned into subsets, identified by a partition ID.
   *
   * Queries are scoped to a single partition.
   *
   * This partition ID is normalized with the standard default context partition
   * ID. */
  partitionId?: PartitionId;
  /** The query to run. */
  query?: Query;
  /** The options for this query. */
  readOptions?: ReadOptions;
}

export interface Status {
  /** The status code, which should be an enum value of google.rpc.Code. */
  code: number;
  /** A list of messages that carry the error details.
   *
   * There is a common set of message types for APIs to use. */
  details?: Record<string, unknown>;
  /** A developer-facing error message, which should be in English.
   *
   * Any user-facing error message should be localized and sent in the
   * google.rpc.Status.details field, or localized by the client. */
  message: string;
}

export interface TransactionOptions {
  /** The transaction should only allow reads. */
  readOnly?: ReadOnly;
  /** The transaction should allow both reads and writes. */
  readWrite?: ReadWrite;
}

export interface ValueBase {
  /** If the value should be excluded from all indexes including those defined
   * explicitly. */
  excludeFromIndexes?: boolean;
  /** The `meaning` field should only be populated for backwards
   * compatibility. */
  meaning?: number;
}

export interface ValueArray extends ValueBase {
  /** An array value.
   *
   * Cannot contain another array value. A `Value` instance that sets field
   * `array_value` must not set fields `meaning` or `exclude_from_indexes`. */
  arrayValue: ArrayValue;
}

export interface ValueBlob extends ValueBase {
  /** A blob value. May have at most 1,000,000 bytes.
   *
   * When `exclude_from_indexes` is false, may have at most 1500 bytes. In JSON
   * requests, must be base64-encoded. */
  blobValue: string;
}

export interface ValueBoolean extends ValueBase {
  /** A boolean value. */
  booleanValue: boolean;
}

export interface ValueDouble extends ValueBase {
  /** A double value. */
  doubleValue: number;
}

export interface ValueEntity extends ValueBase {
  /** An entity value.
   *
   * - May have no key.
   * - May have a key with an incomplete key path.
   * - May have a reserved/read-only key. */
  entityValue: Entity;
}

export interface ValueGeoPoint extends ValueBase {
  /** A geo point value representing a point on the surface of Earth. */
  geoPointValue: LatLng;
}

export interface ValueInteger extends ValueBase {
  /** An integer value. */
  integerValue: string;
}

export interface ValueKey extends ValueBase {
  /** A key value. */
  keyValue: Key;
}

export interface ValueNull extends ValueBase {
  /** A null value. */
  nullValue: "NULL_VALUE";
}

export interface ValueString extends ValueBase {
  /** A UTF-8 encoded string value.
   *
   * When `exclude_from_indexes` is false (it is indexed) , may have at most
   * 1500 bytes. Otherwise, may be set to at most 1,000,000 bytes. */
  stringValue: string;
}

export interface ValueTimestamp extends ValueBase {
  /** A timestamp value.
   *
   * When stored in the Datastore, precise only to microseconds; any additional
   * precision is rounded down. */
  timestampValue: string;
}

export type Value =
  | ValueArray
  | ValueBlob
  | ValueBoolean
  | ValueDouble
  | ValueEntity
  | ValueGeoPoint
  | ValueInteger
  | ValueKey
  | ValueNull
  | ValueString
  | ValueTimestamp;
