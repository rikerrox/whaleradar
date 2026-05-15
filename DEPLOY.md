# WhaleRadar AI — Deployment Guide

This guide covers all production deployment options for WhaleRadar AI, from VPS with Docker to managed platforms.

---

## Table of Contents

1. [Option A: VPS Deployment with Docker (Recommended)](#option-a-vps-deployment-with-docker-recommended)
2. [Option B: VPS Deployment with PM2 (Non-Docker)](#option-b-vps-deployment-with-pm2-non-docker)
3. [Option C: Vercel + Supabase (Easiest)](#option-c-vercel--supabase-easiest)
4. [Option D: Railway / Render (Simple PaaS)](#option-d-railway--render-simple-paas)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Troubleshooting](#troubleshooting)

---

## Option A: VPS Deployment with Docker (Recommended)

**Best for**: Full control, cost-effective at scale, DigitalOcean/Hetzner/Vultr VPS.

### Prerequisites

- VPS with Ubuntu 22.04+ (minimum 2GB RAM, 2 vCPU)
- Domain name pointing to your VPS IP
- SSH access to the server

### Step 1: Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl git ufw

# Configure firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Step 2: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (optional, for non-root access)
usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### Step 3: Clone Repository & Configure

```bash
# Clone the repository
git clone https://github.com/your-org/whaleradar-ai.git /opt/whaleradar
cd /opt/whaleradar

# Copy the production environment template
cp .env.production .env

# Edit the environment file with your values
nano .env
```

**Important environment variables to set:**

```env
# Change the PostgreSQL password
DATABASE_URL=postgresql://whaleradar:YOUR_STRONG_PASSWORD@db:5432/whaleradar?schema=public
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD

# Generate a random secret (use: openssl rand -base64 48)
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-domain.com
```

### Step 4: Switch Prisma to PostgreSQL

Edit `prisma/schema.prisma` and change the provider:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite" for production
  url      = env("DATABASE_URL")
}
```

### Step 5: Update Caddyfile for Your Domain

Edit `Caddyfile.prod` and replace `{YOUR_DOMAIN}` with your actual domain:

```
whaleradar.yourdomain.com {
    # ... (rest of the config stays the same)
}
```

### Step 6: Deploy

```bash
# Build and start all services
docker compose up -d --build

# Check that all containers are running
docker compose ps

# View logs (follow mode)
docker compose logs -f app
```

### Step 7: Initialize the Database

```bash
# Run Prisma migrations to create the database schema
docker compose exec app npx prisma migrate deploy

# Or if you prefer to push the schema (without migration history)
docker compose exec app npx prisma db push
```

### Step 8: Verify Deployment

- Visit `https://your-domain.com` in your browser
- Caddy will automatically provision an SSL certificate via Let's Encrypt
- Register a new account and claim admin access

### Updating

```bash
cd /opt/whaleradar

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Run any pending database migrations
docker compose exec app npx prisma migrate deploy
```

---

## Option B: VPS Deployment with PM2 (Non-Docker)

**Best for**: Developers who prefer direct process management, simpler debugging.

### Step 1: Server Setup

```bash
# Same as Option A, Step 1
ssh root@your-server-ip
apt update && apt upgrade -y
apt install -y curl git ufw
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
```

### Step 2: Install Bun, PostgreSQL, and PM2

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PostgreSQL 16
apt install -y postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2

# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

### Step 3: Set Up PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER whaleradar WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE whaleradar OWNER whaleradar;
GRANT ALL PRIVILEGES ON DATABASE whaleradar TO whaleradar;
\q
```

### Step 4: Clone & Build

```bash
# Create deploy directory
mkdir -p /home/deploy
cd /home/deploy

# Clone repository
git clone https://github.com/your-org/whaleradar-ai.git whaleradar
cd whaleradar

# Install dependencies
bun install

# Switch Prisma to PostgreSQL (edit prisma/schema.prisma)
# Change provider = "sqlite" to provider = "postgresql"

# Generate Prisma client
bun run db:generate

# Push schema to database
DATABASE_URL="postgresql://whaleradar:YOUR_STRONG_PASSWORD@localhost:5432/whaleradar?schema=public" bun run db:push

# Build the Next.js app
bun run build
```

### Step 5: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://whaleradar:YOUR_STRONG_PASSWORD@localhost:5432/whaleradar?schema=public
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
EOF
```

### Step 6: Start Services with PM2

```bash
# Copy the ecosystem config (adjust paths if needed)
# The ecosystem.config.js is already in the project root

# Start all services
pm2 start ecosystem.config.js

# Save the process list for auto-restart on reboot
pm2 save
pm2 startup
```

### Step 7: Configure Caddy

Create `/etc/caddy/Caddyfile`:

```
your-domain.com {
    handle /socket.io/* {
        reverse_proxy localhost:3003
    }

    handle {
        reverse_proxy localhost:3000 {
            header_up Host {host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Real-IP {remote_host}
        }
    }

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }

    encode gzip zstd

    log {
        output file /var/log/caddy/access.log
    }
}
```

```bash
# Start Caddy
systemctl restart caddy
systemctl enable caddy
```

### Useful PM2 Commands

```bash
pm2 status              # View all processes
pm2 logs                # View logs
pm2 logs whaleradar-app # View specific app logs
pm2 restart all         # Restart all
pm2 restart whaleradar-app  # Restart specific app
pm2 monit               # Real-time monitoring
```

### Updating

```bash
cd /home/deploy/whaleradar

git pull origin main
bun install
bun run db:generate
DATABASE_URL="..." bun run db:push
bun run build
pm2 restart all
```

---

## Option C: Vercel + Supabase (Easiest)

**Best for**: Quick deployment, no server management, free tier available.

### Step 1: Push to GitHub

```bash
git remote add origin https://github.com/your-org/whaleradar-ai.git
git push -u origin main
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project's connection string (Settings → Database → Connection string)
3. The format is: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" → Import your `whaleradar-ai` repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun run build`
   - **Output Directory**: `.next`

### Step 4: Set Environment Variables in Vercel

In the Vercel project settings → Environment Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 48` |
| `NEXTAUTH_URL` | Your Vercel deployment URL (e.g., `https://whaleradar.vercel.app`) |

### Step 5: Update Prisma Schema

Change `prisma/schema.prisma` provider to `postgresql` before deploying:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 6: Initialize Database

Run Prisma migration against your Supabase database:

```bash
# Set the DATABASE_URL locally
export DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Push the schema
npx prisma db push
```

### WebSocket Limitations

⚠️ **Vercel does not support WebSocket connections natively.** For the real-time features:

- Deploy the `mini-services/realtime-service` separately on Railway, Render, or Fly.io
- Update the frontend WebSocket URL to point to the external service
- Alternatively, use Supabase Realtime as a WebSocket alternative

### Custom Domain

In Vercel project settings → Domains → Add your custom domain.

---

## Option D: Railway / Render (Simple PaaS)

**Best for**: Simple managed hosting with WebSocket support.

### Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo" → Select your repo
3. Railway auto-detects Next.js and builds accordingly

**Add PostgreSQL:**
1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway provides the `DATABASE_URL` automatically

**Add the Realtime Service:**
1. Click "New" → "Deploy from GitHub repo" → Select the same repo
2. Set the root directory to `mini-services/realtime-service`
3. Set PORT to 3003

**Environment Variables:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-provided by Railway PostgreSQL |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 48` |
| `NEXTAUTH_URL` | Your Railway app URL |

### Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New" → "Web Service" → Connect your repo
3. Configure:
   - **Build Command**: `bun install && bun run db:generate && bun run build`
   - **Start Command**: `bun .next/standalone/server.js`

**Add PostgreSQL:**
1. Click "New" → "PostgreSQL"
2. Note the internal connection string

**Add the Realtime Service:**
1. Click "New" → "Web Service" → Same repo
2. Set root directory to `mini-services/realtime-service`
3. Set start command to `bun run index.ts`

---

## Post-Deployment Steps

### 1. Create Admin Account

1. Visit your deployed app
2. Register a new account with your email and password
3. If no admin exists, you'll see a "Claim Admin Access" button — click it
4. You now have full admin access to the platform

### 2. Change Default Passwords

If you used any default passwords during setup:

```bash
# For Docker: update .env file
nano /opt/whaleradar/.env

# Restart services after changing passwords
docker compose down && docker compose up -d
```

### 3. Set Up Monitoring

**Recommended: Uptime monitoring**

- [UptimeRobot](https://uptimerobot.com) — Free tier monitors your endpoint every 5 minutes
- [Pingdom](https://pingdom.com) — Enterprise-grade monitoring

**Recommended: Application monitoring**

- [Sentry](https://sentry.io) — Error tracking and performance monitoring
- [Grafana + Prometheus](https://grafana.com) — Self-hosted metrics and dashboards

**Docker health checks:**

```bash
# Add to your monitoring script or cron
curl -f http://localhost:3000 || echo "App is down!"
curl -f http://localhost:3003/socket.io/?EIO=4&transport=polling || echo "Realtime is down!"
```

### 4. Configure Database Backups

**PostgreSQL backup script:**

```bash
#!/bin/bash
# save as /opt/whaleradar/backup.sh

BACKUP_DIR="/opt/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/whaleradar_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

# For Docker deployment
docker compose -f /opt/whaleradar/docker-compose.yml exec -T db \
  pg_dump -U whaleradar whaleradar | gzip > $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup saved: $BACKUP_FILE"
```

**Set up cron for daily backups:**

```bash
chmod +x /opt/whaleradar/backup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /opt/whaleradar/backup.sh >> /var/log/whaleradar-backup.log 2>&1
```

**Offsite backup (S3):**

```bash
# Install AWS CLI
apt install -y awscli

# Add to backup.sh after creating the backup
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/whaleradar/
```

### 5. Security Hardening

```bash
# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (use SSH keys only)
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH
systemctl restart sshd

# Install fail2ban for brute-force protection
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## Troubleshooting

### App won't start

```bash
# Check container logs
docker compose logs app

# Common issues:
# - DATABASE_URL is incorrect → Verify the connection string
# - Prisma client not generated → Run: docker compose exec app npx prisma generate
# - Port already in use → Change the port mapping in docker-compose.yml
```

### Database connection errors

```bash
# Check if PostgreSQL is running
docker compose logs db

# Test connection from app container
docker compose exec app sh -c 'apt-get update && apt-get install -y postgresql-client'
docker compose exec app psql "$DATABASE_URL"

# Reset database (⚠️ DESTROYS ALL DATA)
docker compose exec app npx prisma migrate reset
```

### WebSocket not working

```bash
# Check realtime service
docker compose logs realtime

# Verify the service is listening
docker compose exec realtime sh -c 'curl -s http://localhost:3003/socket.io/?EIO=4&transport=polling'

# Check Caddy is forwarding WebSocket upgrades
docker compose logs caddy | rg websocket
```

### SSL/Certificate issues

```bash
# Check Caddy logs
docker compose logs caddy

# Caddy auto-provisions certificates, but may fail if:
# - Domain DNS doesn't point to the server IP
# - Port 80 or 443 is blocked by firewall
# - Rate limited by Let's Encrypt (too many reissues)

# Force certificate renewal (remove cached cert)
docker compose down
docker volume rm whaleradar_caddy_data
docker compose up -d
```

### High memory usage

```bash
# Check container resource usage
docker stats

# Limit memory in docker-compose.yml
# Add under each service:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

### Performance tuning

```bash
# For PostgreSQL: increase shared_buffers
# Add to docker-compose.yml under db service:
# command: postgres -c shared_buffers=256MB -c max_connections=200

# For the Next.js app: enable output file tracing
# Already configured in next.config.ts with output: "standalone"

# For Caddy: enable compression (already in Caddyfile.prod)
```

---

## Architecture Overview

```
                    ┌─────────────┐
                    │   Internet   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Caddy     │  ← Reverse proxy + SSL
                    │  (ports 80,  │
                    │    443)      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
     ┌────────▼────────┐     ┌─────────▼─────────┐
     │   Next.js App    │     │  Realtime Service  │
     │  (port 3000)     │     │  (port 3003)       │
     │                   │     │  Socket.io         │
     └────────┬─────────┘     └────────────────────┘
              │
     ┌────────▼─────────┐
     │   PostgreSQL 16   │
     │   (port 5432)     │
     └──────────────────┘
```

---

## Quick Reference

| Command | Description |
|---|---|
| `docker compose up -d --build` | Build and start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f app` | Follow app logs |
| `docker compose restart app` | Restart the app |
| `docker compose exec app npx prisma migrate deploy` | Run database migrations |
| `docker compose exec db psql -U whaleradar` | Open PostgreSQL shell |
| `pm2 status` | Check PM2 process status (non-Docker) |
| `pm2 restart all` | Restart all PM2 processes |

---

*WhaleRadar AI — Production Deployment Guide*
