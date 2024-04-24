// Copyright 2022-2024 Kitson P. Kelly. All rights reserved. MIT License

/**
 * Contains {@linkcode DatastoreError} which are raised by {@linkcode Datastore}
 * and contain additional information about the error.
 *
 * @module
 */

/** Options that can be set when creating a {@linkcode DatastoreError}. */
export interface DatastoreErrorOptions extends ErrorOptions {
  status?: number;
  statusInfo?: unknown;
  statusText?: string;
}

/**
 * Errors using {@linkcode Datastore} will by of this type, which includes
 * extra info about the error.
 */
export class DatastoreError extends Error {
  #status?: number;
  #statusInfo?: unknown;
  #statusText?: string;

  /** If the error was created as a result of a REST request, the status code
   * will be reflected here.
   */
  get status(): number | undefined {
    return this.#status;
  }

  /** If the error was created as a result of a REST request, the body of the
   * response will be set here. */
  get statusInfo(): unknown {
    return this.#statusInfo;
  }

  /** If the error was created as a result of a REST request, the status
   * text will be reflected here. */
  get statusText(): string | undefined {
    return this.#statusText;
  }

  constructor(message?: string, options: DatastoreErrorOptions = {}) {
    super(message, options);
    this.#status = options.status;
    this.#statusText = options.statusText;
    this.#statusInfo = options.statusInfo;
  }
}
