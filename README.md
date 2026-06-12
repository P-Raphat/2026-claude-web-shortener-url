# URL Shortener

A full-stack URL shortener with admin dashboard and high-performance redirect engine.

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| **web** | Next.js 16 + Prisma + Bun | 3000 | Admin UI + REST API |
| **redirect** | Go 1.26 + Gin | 8080 | Redirect engine with Redis caching |
| **mysql** | MySQL 8.0 | 3306 | Primary database |
| **redis** | Redis 7 | 6379 | Redirect cache |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| Bun | >= 1.3 | https://bun.sh (for local dev only) |
| Go | >= 1.23 | https://go.dev/dl (for local dev only) |

---

## Quick Start (Docker)

```bash
# 1. Copy env file
cp .env.example .env

# 2. Edit .env — change passwords and secrets
#    NEXTAUTH_SECRET=<random string>  (generate: openssl rand -base64 32)

# 3. Start everything
docker compose up --build -d

# 4. Run database migration (first time only)
docker compose exec web bunx prisma migrate deploy
```

Open http://localhost:3000 (admin) and http://localhost:8080/health (redirect health check).

---

## Project Structure

```
url-shortener/
├── web/                 # Next.js admin + API
│   ├── Dockerfile
│   ├── src/
│   ├── prisma/          # Schema & migrations
│   └── package.json
├── redirect/            # Go redirect service
│   ├── Dockerfile
│   ├── main.go
│   └── go.mod
├── docker-compose.yml   # Full stack orchestration
├── .env.example         # Environment template
└── README.md
```

---

## Docker Concepts Explained

### Dockerfile

Dockerfile is a recipe that tells Docker how to build an **image** (a snapshot of your app + dependencies).

**web/Dockerfile** — multi-stage build:

```
Stage 1 (deps)    → Install node_modules with bun
Stage 2 (builder) → Generate Prisma client + build Next.js
Stage 3 (runner)  → Copy only production files, run as non-root user
```

Multi-stage build keeps the final image small — build tools and source code are discarded, only the compiled output remains.

**redirect/Dockerfile** — multi-stage build:

```
Stage 1 (builder) → Download Go modules + compile binary
Stage 2 (runner)  → Alpine Linux + the single binary
```

The Go binary is statically compiled (`CGO_ENABLED=0`), so the final image is extremely small (~20 MB).

### docker-compose.yml

Docker Compose defines **multiple containers** that work together as a single stack.

Key concepts:
- **services** — each service becomes a container (web, redirect, mysql, redis)
- **build** — tells Compose to build the image from a Dockerfile
- **image** — uses a pre-built image from Docker Hub (e.g., `mysql:8.0`)
- **ports** — maps container port to host port (`"3000:3000"`)
- **environment** — sets env vars inside the container
- **depends_on** — controls startup order (web waits for mysql to be healthy)
- **volumes** — persists data across container restarts (database files)
- **healthcheck** — lets other services know when a dependency is ready

### Common Docker Compose Commands

```bash
# Start all services (build if needed)
docker compose up --build -d

# Start only infra (for local dev)
docker compose up mysql redis -d

# View logs
docker compose logs -f              # all services
docker compose logs -f web          # specific service

# Stop all services (keep data)
docker compose down

# Stop and delete all data
docker compose down -v

# Rebuild a specific service
docker compose up --build web -d

# Check service status
docker compose ps
```

---

## Local Development (without Docker for app services)

Start only the database and cache via Docker:

```bash
docker compose up mysql redis -d
```

### Web (Next.js)

```bash
cd web
cp .env.example .env           # edit connection strings
bun install
bunx prisma migrate dev --name init   # first time
bunx prisma generate                  # generate client
bun dev                               # http://localhost:3000
```

### Redirect (Go)

```bash
cd redirect
cp .env.example .env           # edit connection strings
go run .                       # http://localhost:8080
```

---

## Database Migrations (Prisma)

```bash
cd web

# Create a new migration
bunx prisma migrate dev --name <describe_change>

# Apply migrations (production)
bunx prisma migrate deploy

# Regenerate client only
bunx prisma generate

# Open DB browser
bunx prisma studio
```

---

## Production Build

### Option 1: Docker Compose (recommended)

```bash
# Build and run all services
docker compose up --build -d

# Or build images separately for pushing to a registry
docker build -t url-shortener-web ./web
docker build -t url-shortener-redirect ./redirect
```

### Option 2: Build manually

**Next.js:**

```bash
cd web
bunx prisma generate
bun run build
bun run start
```

**Go redirect:**

```bash
cd redirect
CGO_ENABLED=0 go build -o redirect .
./redirect
```

---

## Deploy to a Server (Docker)

1. Install Docker on the server
2. Clone the repo
3. Create `.env` from `.env.example` — set production passwords and `NEXTAUTH_SECRET`
4. Run:

```bash
docker compose up --build -d
cd web && bunx prisma migrate deploy && cd ..
```

5. Set up a reverse proxy (Nginx/Caddy) to route:
   - `yourdomain.com` → `localhost:3000` (admin)
   - `short.domain` → `localhost:8080` (redirects)

---

## How Redirect Caching Works

1. Browser hits `GET http://short.domain/<code>`
2. Go service checks Redis key `url:<code>`
   - **Cache hit** → redirect immediately (no DB query)
   - **Cache miss** → query MySQL, cache for 24h, then redirect
3. Unknown code → cache `__not_found__` for 5 min (negative cache)
4. URL updated/deleted via admin API → Redis key invalidated immediately

---

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | mysql | MySQL root password |
| `MYSQL_DATABASE` | mysql | Database name |
| `DATABASE_URL` | web | MySQL connection string (URL format) |
| `REDIS_URL` | web, redirect | Redis connection string |
| `NEXTAUTH_SECRET` | web | Auth encryption key |
| `NEXTAUTH_URL` | web | App base URL |
| `NEXT_PUBLIC_REDIRECT_URL` | web | Public redirect base URL |
| `PORT` | redirect | Redirect service port |

---

## Troubleshooting

**MySQL not ready yet**
Container takes ~20s to initialize. Check: `docker compose ps` — wait until mysql shows "healthy".

**Cannot find module '@/generated/prisma'**
Run `bunx prisma generate` inside `web/`.

**Port already in use (Windows)**
```bash
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

**View Redis cache**
```bash
docker compose exec redis redis-cli KEYS "url:*"
```
