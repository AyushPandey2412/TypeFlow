# Typeflow single-Vercel deployment

Typeflow deploys as one Vercel project. Next.js serves the UI and HTTP APIs, a Vercel WebSocket Function serves Socket.IO, MongoDB Atlas stores durable data, and Redis coordinates active multiplayer rooms across Function instances.

## 1. Rotate secrets

1. Rotate any database password pasted into chat, logs, screenshots, or commits.
2. Create two different random JWT secrets of at least 32 bytes.
3. Confirm `.env` and `.env.local` files are ignored by Git.

## 2. Configure Atlas

1. Keep the `typeflow` database and a restricted application database user.
2. Add Vercel egress access in Atlas Network Access. Hobby deployments do not have a stable outbound IP; use `0.0.0.0/0` only with a strong restricted user, or use Vercel Secure Compute when static egress is required.
3. Use the Atlas `mongodb+srv://.../typeflow` URI as `MONGO_URI`.

## 3. Create the Vercel project

1. Import `AyushPandey2412/TypeFlow` in Vercel.
2. Select `develop` for the first Preview deployment.
3. Set **Root Directory** to `apps/web`.
4. Enable **Include source files outside of the Root Directory** so shared packages and server services are bundled.
5. Keep Next.js framework detection and `npm run build`.
6. Enable Fluid Compute. The Socket.IO endpoint is `api/socket.ts` and follows Vercel Function duration limits.

## 4. Add Redis

1. Open the project Storage or Marketplace tab.
2. Add an Upstash Redis integration close to the Vercel Functions and Atlas cluster.
3. Connect it to this project and expose its connection string as `REDIS_URL`.

Redis contains short-lived matchmaking, room, presence, and pub/sub state. MongoDB remains the source of truth for accounts and validated results.

## 5. Environment variables

Add these to Production and Preview:

```text
MONGO_URI=mongodb+srv://.../typeflow
REDIS_URL=rediss://...
JWT_ACCESS_SECRET=<private-random-secret>
JWT_REFRESH_SECRET=<different-private-random-secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
FRONTEND_URL=https://your-project.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

Do not set `API_URL` or `NEXT_PUBLIC_SOCKET_URL` in Vercel. Production APIs and WebSockets use the same origin. Never upload local `.env` files.

After attaching a custom domain, update `FRONTEND_URL` and `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin and redeploy.

## 6. Deploy and verify

Deploy `develop` as a Preview and test:

1. Register, login, refresh after reload, and logout.
2. Solo completion, history, and leaderboard persistence.
3. Friend codes, friendships, invitations, and statistics.
4. Three browser sessions joining a public race.
5. Ten-second auto-start, progress, validation, and reconnect behavior.
6. SEO endpoints, legal pages, and responsive layouts.

Before promotion run:

```text
npm test
npm run lint
npm run typecheck
npm run build
```

When Preview checks pass, merge `develop` into `main` and promote the production deployment.
