This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker Deploy

Build and run with Docker Compose:

```bash
docker compose --env-file .env.local up -d --build
```

Open:

```text
http://localhost:3001/AdaCheckStockSTD
```

Runtime settings saved from `/setting` are stored in the `adapos_runtime` Docker volume at `/app/.runtime`, so they survive container recreate.

Part/database setup guide: [docs/part-database-settings.md](docs/part-database-settings.md)

Important environment variables:

- The application release version is read from `version.txt`; do not store `NEXT_PUBLIC_VERSION` in `.env.local`.
- `NEXT_PUBLIC_BASE_PATH` is used at image build time and runtime.
- `APP_PORT` is the host port.
- `PORT` is the container app port.
- `USER_DB`, `PASSWORD_DB`, `SERVER_DB`, `PORT_DB`, `NAME_DB`, and `DATABASE_NAME_BY_PATH` configure SQL Server. `DATABASE_NAME_BY_PATH` supports either the old `"Part":"Database"` format or per-part objects with `database`, `server`, `port`, `user`, and `password`.
- `/setting` saves runtime per-part database settings in `/app/.runtime/database-paths.json`; password values are stored server-side and are not returned in the settings list.
- `SESSION_SECRET`, `SETTINGS_ADMIN_USER`, and `SETTINGS_ADMIN_PASSWORD` are required in production.
- `PROMOTION_URL_ALLOWLIST` is required when promotion URLs point to private/internal hosts.
- `PRICE_CHECK_URL_OBJECT_ID` optionally selects the preferred `TCNTUrlObject.FNUrlID` for price/promotion lookup; if it is missing, the app falls back to an `API2PSMaster` URL.

Useful commands:

```bash
docker compose --env-file .env.local ps
docker compose --env-file .env.local logs -f
docker compose --env-file .env.local down
```

When the image is built on another machine and loaded on the server, run the
server-only compose file so the server does not build:

```bash
docker compose -f docker-compose.server.yml --env-file .env.local up -d
```

## Offline Application Updates

Build with `npm run build` (not `next build` alone). The postbuild step writes
`.next/ada-release.json` with the version, build ID and checksums for all shipped
static assets. Deploy the complete build, `public`, `server.js` and
`scripts/app-release.cjs` together, then start with `npm start`. The Windows
build/start scripts and Docker image use the same release metadata. Production
startup rejects a build whose metadata does not match `version.txt` or `BUILD_ID`.
Never edit `version.txt` in place to represent an upgrade without rebuilding.

`/<Part>/api/app-release`, `/<Part>/sw.js`, HTML and API responses must bypass
proxy/CDN caching. Preserve the `X-Ada-Build-Id` response header on HTML.
Publish builds atomically and give each release a new build ID, even when the
displayed version stays unchanged. Do not overwrite a live `.next` directory.

The app checks for a release on startup, reconnect, focus and every minute while
visible. It prepares every offline page and static asset before offering an
update. A blank/remembered-name login page can update automatically. Other pages
offer an update button. Every open tab in that Part must be idle; unsaved fields,
scanning and in-flight operations defer the reload. Unknown/legacy tabs also
defer the update: close them after finishing their work, then reopen the app.
This one-time migration does not require deleting cookies or IndexedDB.

Failed downloads leave the active build available offline. Old caches are removed
only after all tabs report the new build. Pending records, sessions and other
Parts are not cleared. The fallback covers shipped application assets, not
external product images or data that has never been downloaded. PWA updates are
enabled in production builds on HTTPS (or localhost), not `npm run dev`.

The bottom-right network icon opens a manual update menu. Confirming downloads
and verifies the current release before removing old app caches for this Part.
If already on the latest build, repair and cleanup do not reload the page.
New builds still wait for all tabs to be ready. This action never clears offline
records, login data or another Part's caches; it is disabled while offline.

Verification:

```bash
npm test
npm run typecheck
npm run lint
npm run build
node tests/update-fixture.cjs
```

The optional fixture serves the real compiled UI and worker at
`http://127.0.0.1:3191/control`, with synthetic builds A/B/C and no backend access.
Open two application tabs, seed a pending test record, leave a typed field in
one tab and publish B. Confirm the update waits, then clear the field and apply.
Inspect that B is active and the pending record remains. Publish incomplete C,
disable the fixture network and reload an idle tab: B must still work. Restore
the network and C assets, retry, and inspect that C becomes active. Stop the
fixture after testing; never expose it on a production host.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
