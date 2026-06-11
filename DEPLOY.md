# WhaleRadar AI - Deploy Guide

## Server Info
- **IP:** 80.225.227.86
- **SSH Key:** ~/.ssh/oracle_key
- **SSH Command:** `ssh -i ~/.ssh/oracle_key ubuntu@80.225.227.86`
- **URL:** http://80.225.227.86

## Deploy Changes

### 1. Make changes locally
Edit code on your Mac, then test:
```bash
npm run dev
```

### 2. Push to GitHub
```bash
cd "/Users/vanishrees/Downloads/workspace-84b86d5c-302b-4d13-9524-52ba34eb97fe 2"
git add -A
git commit -m "your change description"
git push
```

### 3. Deploy to Oracle Cloud
```bash
ssh -i ~/.ssh/oracle_key ubuntu@80.225.227.86 "cd whaleradar && git pull && docker compose --env-file .env up -d --build"
```

## SSH into Server
```bash
ssh -i ~/.ssh/oracle_key ubuntu@80.225.227.86
```

## Useful Commands on Server
```bash
# Check container status
docker ps -a

# View app logs
docker logs whaleradar-app -f

# Restart app only
docker restart whaleradar-app

# Restart everything
cd whaleradar && docker compose --env-file .env down && docker compose --env-file .env up -d

# Check database
docker exec whaleradar-db psql -U whaleradar -d whaleradar -c "\dt"
```

## Adding a Domain + SSL
1. Buy a domain, point A record to `80.225.227.86`
2. SSH in and edit Caddyfile:
```bash
ssh -i ~/.ssh/oracle_key ubuntu@80.225.227.86
nano ~/whaleradar/Caddyfile.prod
```
3. Replace `:80` with your domain name:
```
yourdomain.com {
    ...
}
```
4. Open ports 443 in Oracle Cloud Security List
5. Restart Caddy: `docker restart whaleradar-caddy`
