# Quick Deployment Guide -- The Scene

**Condensed steps for deploying The Scene to the VPS. For the full guide with troubleshooting, see `serverSetup.md`.**

---

## Prerequisites on VPS
- Node.js 22+ installed
- PM2 installed globally
- Nginx configured for thescene.jeffsquier.dev
- SSL via Certbot
- Git clone of the repo in `/var/www/theScene/html`

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
NEXT_PUBLIC_SITE_URL="https://thescene.jeffsquier.dev"
NEXT_PUBLIC_SITE_DOMAIN="thescene.jeffsquier.dev"
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

The Nginx config at `/etc/nginx/sites-available/thescene.jeffsquier.dev` should reverse proxy to port 3001:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name thescene.jeffsquier.dev www.thescene.jeffsquier.dev;

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
sudo ln -s /etc/nginx/sites-available/thescene.jeffsquier.dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d thescene.jeffsquier.dev
```

---

## Ongoing Deployments

After initial setup, every deploy is:

```bash
cd /var/www/theScene/html
git pull origin main
npm install
npm run build
pm2 restart the-scene
```

Or just push to GitHub -- the GitHub Actions workflow handles this automatically.

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
| 502 Bad Gateway | PM2 isn't running. `pm2 restart the-scene` |
| Can't find server | DNS not propagated. Check `dig @8.8.8.8 thescene.jeffsquier.dev +short` |
| VPS can't ping domain | Normal. Test from your Mac browser instead. |

For the full troubleshooting guide, see `serverSetup.md`.
