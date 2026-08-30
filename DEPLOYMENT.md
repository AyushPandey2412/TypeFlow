# Typeflow deployment guide

This setup uses Vercel for Next.js, Render for the stateful Express/Socket.IO service, and MongoDB Atlas. An equivalent Node host is fine if it supports long-running processes and WebSockets.

## 1. Before launch

1. Check trademark, social-handle, and domain availability for `Typeflow` before the public launch.
2. Update the draft legal pages with the real operator, jurisdiction, infrastructure providers, and effective date.
3. Generate two different random JWT secrets of at least 32 characters. Never commit them.
4. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## 2. MongoDB Atlas

1. Create an Atlas project and production cluster.
2. Create a dedicated database user with read/write access only to the production database.
3. Allow the backend host's outbound addresses in Network Access. Avoid `0.0.0.0/0` where stable addresses are available.
4. Copy the `mongodb+srv://.../typeflow` connection string into the backend host as `MONGO_URI`.

## 3. Express and Socket.IO on Render

Create a Web Service from the repository root:

```text
Build: npm ci && npm run build --workspace @typing/server
Start: npm run start --workspace @typing/server
Health check: /health
```

Set the following secrets and configuration:

```text
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<unique-random-secret>
JWT_REFRESH_SECRET=<different-random-secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
FRONTEND_URL=https://your-domain.example
```

Use the host-provided `PORT`. Confirm `/health` and a WebSocket connection to `/race` both work.

The current matchmaking and active-race state are process-local. Keep one backend instance. Before horizontal scaling, add a Socket.IO Redis adapter and shared race-state store; sticky sessions alone do not preserve in-memory matchmaking state.

## 4. Next.js on Vercel

Import the same repository with these settings:

```text
Framework: Next.js
Root directory: apps/web
Include source files outside root directory: enabled
Install: npm install
Build: npm run build
```

Set these for Production and the appropriate Preview environments:

```text
API_URL=https://api.your-domain.example
NEXT_PUBLIC_SOCKET_URL=https://api.your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

`API_URL` is used by the server-side BFF. `NEXT_PUBLIC_*` values are visible to browsers and must never contain secrets. Redeploy after changing them.

## 5. Domain and security

1. Point the primary domain to Vercel and an `api` subdomain to Render using their supplied DNS records.
2. Wait for HTTPS certificates on both origins.
3. Set `FRONTEND_URL` to the exact frontend origin, then redeploy the backend.
4. Test register, refresh after reload, logout, saved solo results, leaderboard, matchmaking, and private friend races.
5. Enable provider logs and alerts. Back up MongoDB and restrict production access.

## 6. Search launch checklist

1. Verify `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, the favicon, and the social preview image in production.
2. Add a Google Search Console domain property with DNS verification.
3. Submit `/sitemap.xml`; request indexing for the home page, WPM guide, About page, and leaderboard.
4. Run Lighthouse on mobile and desktop and fix Core Web Vitals, contrast, broken links, and layout shifts.
5. Publish genuinely useful typing guidance and product improvements over time. Earn relevant links through communities, schools, documentation, and open-source work. Do not buy links or create keyword-stuffed doorway pages.
6. Monitor indexed pages, queries, crawl errors, uptime, database limits, and WebSocket failures.

Technical SEO makes a site crawlable and understandable; it cannot guarantee a top-10 result. Rankings also depend on search intent, competition, content quality, reputation, links, performance, geography, and time.
