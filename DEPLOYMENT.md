# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js >= 20

## Infrastructure Services

The `docker-compose.yml` at project root provides three infrastructure services:

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 | Database (spaces, pages, versions, templates) |
| **MinIO** | 9000 (API), 9001 (Console) | Object storage for images, videos, attachments |
| **NATS** | 4222 (client), 9222 (WebSocket) | Message queue for video conversion jobs |

## Quick Start (Development)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Run database migrations + seed templates
cd apps/api
npx prisma migrate deploy
npx prisma db seed

# 3. Start backend API (port 3001)
cd ../..
npm run dev:api

# 4. Start frontend (port 3002)
npm run dev:web
```

## Internal Network (Nexus Registry)

If your environment pulls Docker images from an internal Nexus registry instead of Docker Hub, create a `.env` file next to `docker-compose.yml`:

```bash
# .env
REGISTRY=nexus.your-company.com:8443/
```

This prefixes all image names, so `postgres:16-alpine` becomes `nexus.your-company.com:8443/postgres:16-alpine`.

Then start normally:

```bash
docker compose up -d
```

> **Note:** Your Nexus must have a Docker proxy repository configured to cache Docker Hub images. If Nexus is a hosted-only registry, the required images must be manually pushed first.

### Required Images

| Image | Tag |
|-------|-----|
| `postgres` | `16-alpine` |
| `minio/minio` | `latest` |
| `minio/mc` | `latest` |
| `nats` | `2-alpine` |

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/knowledge_base` | PostgreSQL connection string |
| `PORT` | `3001` | API server port |
| `DEFAULT_AUTHOR` | `Admin` | Default author name for new pages |

### Frontend (`apps/web/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:3001` | Backend API URL (server-side) |
| `MINIO_ENDPOINT` | `http://localhost:9000` | MinIO S3 endpoint |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | MinIO public URL for file access |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `videos` | MinIO bucket name |
| `NATS_URL` | `nats://localhost:4222` | NATS server URL |

## Data Persistence

Docker volumes store persistent data:

| Volume | Service | Data |
|--------|---------|------|
| `postgres-data` | PostgreSQL | Database files |
| `minio-data` | MinIO | Uploaded files |
| `nats-data` | NATS | JetStream state |

To reset all data:

```bash
docker compose down -v
```

## Verify Services

```bash
# PostgreSQL
docker compose exec postgres pg_isready -U postgres

# MinIO Console
open http://localhost:9001  # login: minioadmin / minioadmin

# NATS
curl http://localhost:8222/healthz
```
