# LifeOS Architecture

## Overview

LifeOS is structured as a single frontend application with a local-first architecture. The browser database is the source of truth for the MVP, and the UI is organized around features rather than technical layers alone.

## Folder responsibilities

### `public/`

Static web assets such as manifest metadata and app icons.

### `src/app/`

App bootstrap, providers, and route registration.

### `src/assets/`

Shared visual resources and global styles.

### `src/components/`

Reusable UI building blocks that are not owned by a single feature.

### `src/config/`

Static app configuration for navigation, storage, and application metadata.

### `src/constants/`

Stable constants and storage key definitions.

### `src/db/`

Dexie database setup, schema registration, versioning entrypoints, and future migrations.

### `src/domains/`

Domain-level types, simple model factories, and repository contracts for tasks, habits, goals, finance, health, and settings.

### `src/features/`

Feature-owned UI, hooks, and pages. This keeps each product area easy to evolve without mixing all screens together.

### `src/hooks/`

Cross-feature hooks such as safe live queries and local settings helpers.

### `src/lib/`

Small pure helpers for dates, identifiers, validation, and formatting.

### `src/services/`

Cross-cutting services with clear integration boundaries, such as notifications, backup, restore, and analytics.

### `src/state/`

Lightweight app and UI state placeholders that can evolve without forcing an external state library too early.

### `src/types/`

Shared TypeScript contracts used across layers.

### `src/utils/`

Runtime utilities for logging, platform checks, and performance measurement.

### `docs/`

Project-level documentation that explains architectural intent and future evolution.

## Dependency direction

The intended dependency flow is:

1. `features` depend on `domains`, `components`, `hooks`, and `services`
2. `domains` depend on shared `types`, `lib`, and `db`
3. `db`, `config`, `constants`, and `utils` remain low-level modules

This keeps business-facing screens from reaching arbitrarily into infrastructure details.

## Mobile readiness

The current app stays a standard web frontend, but it is prepared for Capacitor by:

- keeping storage local
- isolating service boundaries for native integrations
- using a mobile-first shell and navigation pattern
- avoiding backend assumptions in feature code

