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

- `NEXT_PUBLIC_BASE_PATH` is used at image build time and runtime.
- `APP_PORT` is the host port.
- `PORT` is the container app port.
- `USER_DB`, `PASSWORD_DB`, `SERVER_DB`, `PORT_DB`, `NAME_DB`, and `DATABASE_NAME_BY_PATH` configure SQL Server. `DATABASE_NAME_BY_PATH` supports either the old `"Part":"Database"` format or per-part objects with `database`, `server`, `port`, `user`, and `password`.
- `/setting` saves runtime per-part database settings in `/app/.runtime/database-paths.json`; password values are stored server-side and are not returned in the settings list.
- `SESSION_SECRET`, `SETTINGS_ADMIN_USER`, and `SETTINGS_ADMIN_PASSWORD` are required in production.
- `PROMOTION_URL_ALLOWLIST` is required when promotion URLs point to private/internal hosts.

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
