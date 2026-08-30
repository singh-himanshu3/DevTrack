# DevTrack

An early-stage full-stack issue tracker built with a React and TypeScript client, an Express REST API, Prisma, and PostgreSQL. The current version implements issue creation, listing, editing, and deletion end to end.

## Implemented Features

- Create and list issues
- Edit issue titles with client-side and server-side validation
- Delete issues with confirmation and loading states
- REST endpoints separated into routes, controllers, and services
- PostgreSQL persistence through Prisma migrations and the Prisma adapter for `pg`
- Typed client models and API functions

## Tech Stack

**Client:** React 19, TypeScript, Vite  
**Server:** Node.js, Express 5, TypeScript  
**Database:** PostgreSQL, Prisma 7

## Architecture

```text
client/
├── src/App.tsx                 issue UI and client state
├── src/services/issuesApi.ts   HTTP client
└── src/types/issues.ts         shared client-side shape

server/
├── src/routes/                 endpoint definitions
├── src/controllers/            validation and HTTP responses
├── src/services/               issue operations
├── src/lib/prisma.ts           database client
└── prisma/                     schema and migrations
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/issues` | List issues, newest first |
| `GET` | `/api/issues/:id` | Fetch one issue |
| `POST` | `/api/issues` | Create an issue |
| `PATCH` | `/api/issues/:id` | Update an issue title |
| `DELETE` | `/api/issues/:id` | Delete an issue |

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL

### Server

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

Generate the Prisma client, apply the committed migrations, and start the API:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The API listens on `http://localhost:3000`.

### Client

In another terminal:

```bash
cd client
npm install
npm run dev
```

The client expects the API at `http://localhost:3000/api/issues` and runs at `http://localhost:5173` by default.

## Project Status

DevTrack currently covers the issue CRUD foundation. The `User` database model exists, but authentication and user ownership are not implemented. There is no deployment or automated test suite yet.
