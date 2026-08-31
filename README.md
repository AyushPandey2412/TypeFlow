# Typeflow

A typing-speed and multiplayer racing application built with Next.js 15, Vercel Functions, Socket.IO, Redis, MongoDB/Mongoose, strict TypeScript, and shared deterministic race logic.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the production deployment, DNS, security, and search-indexing checklist.

## Monorepo

```text
apps/
  web/             Next.js UI, same-origin APIs, and Vercel WebSocket entrypoint
  server/          Shared domain services plus the optional local Express runtime
packages/
  config/          Shared TypeScript configuration
  shared-types/    Auth, race, player, WordPacket, and socket contracts
  word-lists/      Shared deterministic word-bank boundary
```

Turborepo coordinates tasks and npm remains the package manager.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install` at the repository root.
3. Copy `apps/server/.env.example` to `apps/server/.env` and configure MongoDB.
4. Optionally copy `apps/web/.env.example` to `apps/web/.env` to override the local API URL.
5. Run `npm run dev`.

The web application runs at `http://localhost:3000`; the server defaults to `http://localhost:5000`.

## Commands

- `npm run dev` or `npx turbo dev` - run all development services
- `npm run build` or `npx turbo build` - build all workspaces
- `npm run lint` or `npx turbo lint` - lint all workspaces
- `npm run typecheck` or `npx turbo typecheck` - type-check all workspaces
- `npm start` - start the Express server only

## Architecture

- MongoDB and Mongoose remain the database layer. Existing user documents and embedded test results are preserved.
- Shared server services remain the source of truth for authentication and application rules.
- Next.js route handlers call those services directly with cached MongoDB connections; there is no production localhost proxy.
- Rotating refresh tokens use secure httpOnly cookies; short-lived access tokens authenticate race sockets.
- Existing bcrypt hashes will be accepted during a transition and upgraded to Argon2id after a successful login.
- Race, race-result, auth-session, and guest-session collections support matchmaking, validation, leaderboards, token rotation, and guest expiry.
- The server follows route -> controller -> service -> repository/model boundaries; Zod validators guard HTTP and socket inputs.

## Application flows

- Solo typing uses deterministic shared word generation with Normal, Pro, and Phone modes, 15/30/60/120-second options, 25/50/100-word options, and punctuation/number variants.
- Results include raw WPM, correct WPM, accuracy, errors, and per-second chart data.
- Multiplayer uses the authenticated Socket.IO `/race` namespace, three-player matchmaking, a ten-second fallback start, server-issued packets, live progress, and server-recalculated results.
- Valid authenticated results are stored for `/races/leaderboard`; guest results remain session-only.
- Registered users receive an eight-character friend code on first use. Adding a code creates a mutual friendship.
- Friends can create expiring private two-player invitations and inspect head-to-head races, wins, losses, draws, accuracy, and average WPM.
- Friend invitations expire after 15 minutes; completed statistics are derived from validated multiplayer results rather than separate duplicated counters.

## Security and operations

- Passwords use Argon2id. Legacy bcrypt hashes are upgraded after a successful login.
- Same-origin APIs keep access and refresh credentials in httpOnly cookies, enforce origin checks on mutations, and never expose tokens to browser state.
- Refresh tokens rotate in server-side session families; reuse revokes the entire family.
- Solo and multiplayer clocks are server-owned, and submitted text is scored again before leaderboard persistence.
- Vercel multiplayer uses Redis-backed rooms and the Socket.IO Redis adapter so Function instances share matchmaking and race events.
- Production requires HTTPS, strong 32+ character JWT secrets, a restricted MongoDB account, Redis, and exact `FRONTEND_URL` and `NEXT_PUBLIC_SITE_URL` values.

## Verification

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` before deployment. Backend runtime verification additionally requires a reachable MongoDB URI and populated JWT secrets.
