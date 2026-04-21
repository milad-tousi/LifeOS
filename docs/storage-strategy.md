# Storage Strategy

## Primary storage

LifeOS uses IndexedDB through Dexie as the main local persistence layer. This is a strong fit for offline-first web and future hybrid mobile builds because it supports structured records, indexing, and versioned schemas without requiring a server.

## Efficient local storage guidelines

To keep the device footprint low:

- store normalized, compact records
- avoid large duplicated blobs in IndexedDB
- keep text fields concise by default
- prefer event logs over repeatedly rewriting large summary documents
- compute derived views in memory when possible instead of persisting every aggregate

## Recommended usage split

### IndexedDB

Use for durable user data such as tasks, goals, expenses, health logs, reviews, and settings.

### `localStorage`

Use only for tiny UI preferences and non-critical cached values. Do not store core user data there.

## Data lifecycle

The app should favor:

1. direct local writes
2. small indexed records
3. explicit schema migrations
4. optional export and restore flows

For future growth, archive strategies should be added for completed or old records rather than letting active tables grow without limits.

## Backup and restore

The starter includes placeholder services for exporting and importing local data. Future implementations should:

- validate payload versions
- avoid blind destructive restores
- support selective import where practical
- keep export formats simple and portable

## Future mobile considerations

When Capacitor is added later:

- keep large attachments outside IndexedDB when a native file system is more efficient
- compress exports only when it clearly reduces size enough to justify the complexity
- preserve the repository layer so storage engines can evolve without rewriting the UI

