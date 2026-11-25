# earmark-server

Ingestion worker and admin API for Earmark, a podcast player for two daily shows.
It watches a folder of finished episodes, encodes the audio to Opus, renders covers,
uploads everything to object storage and publishes a static JSON catalog the mobile
app reads. The app never talks to this machine, so the catalog and the audio stay
reachable when the server is off.

## Stack

- NestJS 12 with TypeScript
- PostgreSQL 16 with TypeORM (source of truth for podcasts and episodes)
- S3 compatible object storage (Cloudflare R2, Backblaze B2 as a fallback)
- Vitest and oxlint

## Getting started

```bash
cp .env.example .env        # set ADMIN_TOKEN (32+ characters) and DATABASE_PASSWORD
docker compose up -d db
npm install
npm run start:dev
```

The server binds to `127.0.0.1` by default. Change `HOST` only if you know why.

## Scripts

| Script | What it does |
| ------ | ------------ |
| `npm run check` | Type check, lint, tests and build, in that order. |
| `npm run audit:deps` | Fails on high severity advisories in production dependencies. |

## Security notes

- No secret lives in the repository. Configuration comes from the environment and `.env` is ignored.
- Responses carry `helmet` headers and request bodies are validated with a whitelist.
- CORS stays closed unless `CORS_ORIGINS` lists explicit origins.

## Roadmap

- [x] Project scaffold, environment validation, health endpoint
- [x] PostgreSQL connection and database health check
- [x] TypeORM entities and migrations for podcasts and episodes
- [ ] Episode discovery from the output folder (`meta.json` plus `READY`)
- [ ] Opus encoding and S3 upload
- [ ] Static catalog export (index plus monthly shards)
- [ ] Cover rendering for podcasts and episodes
- [ ] Scheduled publishing and push notifications by topic
- [ ] Admin API with token auth, rate limiting and audit logging
- [ ] systemd user units for ingest and publish

## License

MIT
