# CodeStrike Deployment Guide

## Docker (Recommended)

### Prerequisites
- Docker 24+
- Docker Compose v2+

### Quick Deploy

```bash
# Clone the repository
git clone https://github.com/codestrike/codestrike.git
cd codestrike

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Server | 4000 | Fastify API server |
| Web | 3000 | Next.js web UI |
| Redis | 6379 | Caching & BullMQ |
| ChromaDB | 8000 | Vector database |

## Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/codestrike)

1. Click the deploy button
2. Connect your GitHub repository
3. Set environment variables:
   - `OPENROUTER_API_KEY`
   - `GROQ_API_KEY`
   - `HUGGINGFACE_API_KEY`
4. Deploy

## Coolify

1. Create a new project in Coolify
2. Set up a new resource (Docker Compose)
3. Paste the `docker-compose.yml` content
4. Configure environment variables
5. Deploy

## Vercel (Web UI only)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/codestrike/codestrike)

1. Import the `apps/web` directory
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL` — Your server URL
3. Deploy

## Desktop App (Electron)

```bash
cd apps/desktop
npm install
npm run build     # Builds main + preload with tsup
npm start         # Launches Electron window loading http://localhost:3000
```

Requires a display server (macOS/Windows/Linux — not available on Termux).

For production builds with packaging:

```bash
npx electron-builder build
# Outputs: dist/CodeStrike AI-0.1.0.dmg (macOS)
#          dist/CodeStrike AI Setup 0.1.0.exe (Windows)
#          dist/CodeStrike AI-0.1.0.AppImage (Linux)
```

## Manual Deployment

### Server

```bash
cd apps/server
npm install
npm run build
npm start
```

### Web UI

```bash
cd apps/web
npm install
npx next build
npx next start
```

### Using PM2

```bash
npm install -g pm2

# Start server
pm2 start apps/server/dist/index.js --name codestrike-server

# Start web
pm2 start apps/web/node_modules/.bin/next --name codestrike-web -- start -p 3000

# Save PM2 config
pm2 save
pm2 startup
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `GROQ_API_KEY` | No | Groq API key (fallback) |
| `HUGGINGFACE_API_KEY` | No | Hugging Face API key (fallback) |
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | production/development |
| `REDIS_URL` | No | Redis connection string |
| `DATABASE_URL` | No | PostgreSQL connection string |
| `JWT_SECRET` | No | JWT signing secret |

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name codestrike.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d codestrike.example.com
```

## Monitoring

```bash
# Check health
curl http://localhost:4000/health

# View logs
docker-compose logs -f server
docker-compose logs -f web

# Resource usage
docker stats
```

## Backups

```bash
# Backup configuration
cp .env .env.backup
cp codestrike.json codestrike.json.backup

# Backup Redis
docker exec codestrike-redis-1 redis-cli SAVE
cp data/redis/dump.rdb backup/
