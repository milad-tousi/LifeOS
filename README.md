# LifeOS

LifeOS is a lightweight local-first personal life management app built for offline use from the start. This MVP foundation focuses on a clean frontend architecture, small bundle size, and simple on-device data storage.

## Local-first architecture

LifeOS uses IndexedDB through Dexie as the local source of truth. There is no backend, no cloud sync, and no API dependency in the MVP. The app is designed to remain fast, private, and usable without an internet connection.

Core ideas:

- all user data stays on the device
- pages read from local repositories
- Dexie handles IndexedDB persistence
- UI stays responsive through live local queries

## Why there is no backend

The MVP is intentionally frontend-only:

- lower complexity
- faster iteration
- better privacy by default
- offline usage works immediately

If synchronization is needed later, it can be introduced behind the repository layer without rewriting the app.

## Tech stack

- React
- TypeScript
- Vite
- React Router DOM
- Dexie
- dexie-react-hooks
- Zustand
- ESLint
- Prettier

## How to run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```
