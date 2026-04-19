# Quick Deployment Guide -- The Scene

**Condensed steps for deploying The Scene to the VPS. For the full guide with troubleshooting, see `serverSetup.md`. For PM2 operations + process migration history, see `pm2.md`.**

> **2026-04-18:** `the-scene` runs under `deploy`'s PM2 daemon, NOT root. GitHub Actions SSHes as `deploy` and `pm2 restart`s there. Every operational step below assumes `deploy` owns `/var/www/theScene/html`. If you see permission errors, see `pm2.md` for the root→deploy migration procedure.

---

## Prerequisites on VPS
- Node.js 22+ installed (Node 25 breaks the build — keep pinned)
- PM2 installed and running under `deploy` (systemd unit `pm2-deploy`)
- Nginx configured for thescene.fyi
- SSL via Certbot
- Git clone of the repo in `/var/www/theScene/html`, owned by `deploy:deploy`

---

## First-Time Deployment

```bash
# 1. Pull the code
cd /var/www/theScene/html
git pull origin main

# 2. Fix git ownership warning if running as root
git config --global --add safe.directory /var/www/theScene/html

# 3. Create .env.local (NOT in git -- must be created manually)
nano .env.local
```

Paste your Supabase keys:

```
NEXT_PUBLIC_SITE_NAME="The Scene"
NEXT_PUBLIC_SITE_URL="https://thescene.fyi"
NEXT_PUBLIC_SITE_DOMAIN="thescene.fyi"
NEXT_PUBLIC_SUPABASE_URL="https://ehnijylwegzlrydlzicp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-key"
NEXT_PUBLIC_GOOGLE_MAPS_KEY=""
```

Save (Ctrl+O, Enter, Ctrl+X). Then:

```bash
# 4. Install dependencies
npm install

# 5. Build the app
npm run build

# 6. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Verify it's running
curl http://localhost:3001
```

---

## Nginx Configuration

The Nginx config at `/etc/nginx/sites-available/thescene.fyi` should reverse proxy to port 3001:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name thescene.fyi www.thescene.fyi;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location ~ /\.git { deny all; }
    location ~ /\.env { deny all; }
}
```

After Certbot runs, it will add SSL directives automatically.

```bash
sudo ln -s /etc/nginx/sites-available/thescene.fyi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d thescene.fyi
```

---

## Ongoing Deployments

Normally you just **push to `main`** — `.github/workflows/deploy.yml` SSHes in as the `deploy` user and runs the full cycle automatically:

```bash
cd /var/www/theScene/html
git pull origin main
npm install --production=false
npm run build
pm2 restart the-scene
```

Manual deploy (as `deploy`) only needed if the workflow fails or something exploded on the server. If the build output looks stale after a successful push, it's almost always `.next/cache/images/` ownership from an old root-run build — see `pm2.md` troubleshooting.

---

## Useful PM2 Commands

```bash
pm2 status              # See running processes
pm2 logs the-scene      # View logs (live tail)
pm2 restart the-scene   # Restart the app
pm2 stop the-scene      # Stop the app
pm2 monit               # Live monitoring dashboard
```

---

## Quick Troubleshooting

| Problem | Fix |
|---|---|
| Build fails: "Supabase URL required" | `.env.local` is missing. Create it manually with your keys. |
| Git: "dubious ownership" | `git config --global --add safe.directory /var/www/theScene/html` |
| Git: "Invalid username or token" | Generate new GitHub PAT with `repo` scope, update remote URL |
| 502 Bad Gateway | PM2 isn't running. `pm2 restart the-scene` (as `deploy`). If it restarts into a crash loop, see `pm2.md`. |
| Can't find server | DNS not propagated. Check `dig @8.8.8.8 thescene.fyi +short` |
| VPS can't ping domain | Normal. Test from your Mac browser instead. |
| Code pushed but site still stale | `.next/cache/images/` ownership drift. `sudo chown -R deploy:deploy /var/www/theScene/html && rm -rf .next && npm run build && pm2 restart the-scene`. |
| Port 3001 already in use | Leftover root-owned process. See `pm2.md` → Migrating the process between users. |

For the full troubleshooting guide, see `serverSetup.md`. For PM2-specific ops, see `pm2.md`.
