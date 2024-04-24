# google-datastore

A set of APIs that allow interfacing to Google Datastore on GCP from Deno.

## Usage

The main interface is via a
[`Datastore`](https://doc.deno.land/https://deno.land/x/google_datastore/mod.ts/~/Datastore)
instance. To create an instance, provide
[service account keys JSON](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
which contains the information required to securely connect to your Google
Datastore instance:

```ts
import { Datastore } from "jsr:@kitsonk/google-datastore";
import keys from "./service-account.json" with { type: "json" };

const datastore = new Datastore(keys);
```

---

Copyright 2022-2024 Kitson P. Kelly. All rights reserved. MIT License.
