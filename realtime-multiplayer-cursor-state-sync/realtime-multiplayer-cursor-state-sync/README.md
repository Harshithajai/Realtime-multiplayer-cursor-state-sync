# Real-Time Multiplayer Cursor & State Sync

A job-ready full-stack real-time collaboration platform using React, TypeScript, Node.js, Socket.IO, Redis, and PostgreSQL.

## Quick start

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:4000`.

For Redis/PostgreSQL:

```bash
docker compose up -d postgres redis
```

Copy `.env.example` to `.env`.

## Features
- Room creation/joining
- Real-time multiplayer cursors
- Server-authoritative shared state
- Version-based conflict detection
- Reconnection and disconnect cleanup
- Zod validation
- Rate limiting
- PostgreSQL persistence
- Redis-ready event bus
- Responsive UI
- Unit tests
