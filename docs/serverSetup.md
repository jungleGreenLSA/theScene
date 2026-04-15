# Server Setup Guide -- thescene.jeffsquier.dev

**Complete VPS preparation for The Scene -- Node.js, PM2, Nginx, and Let's Encrypt.**

---

## Prerequisites

- Ubuntu 22.04+ VPS (Hostinger, DigitalOcean, etc.)
- Root or sudo access
- Domain `thescene.jeffsquier.dev` registered and managed via Cloudflare
- SSH key access to the server

---

## Step 1 -- DNS Configuration (Cloudflare)

Since the domain is on Cloudflare:

1. Log into Cloudflare dashboard
2. Select `thescene.jeffsquier.dev`
3. Go to **DNS > Records**
4. Add these records:

| Type | Name | Content | Proxy Status | TTL |
|---|---|---|---|---|
| A | @ | YOUR_SERVER_IP | DNS only (grey cloud) | Auto |
| A | www | YOUR_SERVER_IP | DNS only (grey cloud) | Auto |

**Important**: Set proxy status to **DNS only** (grey cloud, not orange). If you use Cloudflare's proxy (orange cloud), it will conflict with Let's Encrypt certificate validation. You can enable the proxy after SSL is set up if desired.

5. Verify DNS propagation:

```bash
dig thescene.jeffsquier.dev +short
dig www.thescene.jeffsquier.dev +short
```

Both should return your server IP. Wait 2-5 minutes for Cloudflare DNS to propagate.

---

## Step 2 -- System Update

SSH into your server:

```bash
ssh deploy@YOUR_SERVER_IP
```

Update packages:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 3 -- Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v    # Should show v22.x.x
npm -v     # Should show 10.x.x
```

---

## Step 4 -- Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

PM2 keeps your Next.js app running and restarts it on crashes or server reboots.

Verify:

```bash
pm2 -v
```

---

## Step 5 -- Install Git

```bash
sudo apt install -y git
git --version
```

---

## Step 6 -- Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Verify:

```bash
sudo systemctl status nginx
```

You should see `active (running)`.

---

## Step 7 -- Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

**Always allow OpenSSH before enabling UFW** or you will lock yourself out.

Expected output:

```
22/tcp (OpenSSH)       ALLOW   Anywhere
80/tcp (Nginx HTTP)    ALLOW   Anywhere
443/tcp (Nginx HTTPS)  ALLOW   Anywhere
```

---

## Step 8 -- Create Web Root Directory

```bash
sudo mkdir -p /var/www/theScene/html
sudo chown -R deploy:deploy /var/www/theScene
sudo chmod -R 755 /var/www/theScene
```

---

## Step 9 -- Clone the Repository

```bash
cd /var/www/theScene
git clone https://jungleGreenLSA:YOUR_GITHUB_TOKEN@github.com/jungleGreenLSA/theScene.git html
cd html
git config credential.helper store
```

Replace `YOUR_GITHUB_TOKEN` with a GitHub Personal Access Token (classic) with `repo` scope.

---

## Step 10 -- Create .env.local on the Server

```bash
nano /var/www/theScene/html/.env.local
```

Paste your production environment variables:

```
NEXT_PUBLIC_SITE_NAME="The Scene"
NEXT_PUBLIC_SITE_URL="https://thescene.jeffsquier.dev"
NEXT_PUBLIC_SITE_DOMAIN="thescene.jeffsquier.dev"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_GOOGLE_MAPS_KEY=""
```

Save and exit (Ctrl+O, Enter, Ctrl+X).

---

## Step 11 -- Install Dependencies and Build

```bash
cd /var/www/theScene/html
npm install
npm run build
```

The build takes 1-2 minutes. You should see `Creating an optimized production build` followed by a route table.

---

## Step 12 -- Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

- `pm2 start` launches the Next.js app on port 3001
- `pm2 save` remembers your process list so it restores after reboot
- `pm2 startup` generates a systemd script to auto-start PM2 on boot (follow the command it outputs)

Verify:

```bash
pm2 status
```

You should see `the-scene` with status `online`.

Test it's running:

```bash
curl http://localhost:3001
```

You should see HTML output.

---

## Step 13 -- Configure Nginx as Reverse Proxy

Create the Nginx server block:

```bash
sudo nano /etc/nginx/sites-available/thescene.jeffsquier.dev
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name thescene.jeffsquier.dev www.thescene.jeffsquier.dev;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

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
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Static assets from Next.js - cache them
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Deny access to .git
    location ~ /\.git {
        deny all;
    }

    # Deny access to .env files
    location ~ /\.env {
        deny all;
    }
}
```

**Key difference from the static sites**: This config uses `proxy_pass` to forward all requests to the Next.js server running on port 3001, instead of serving files directly from disk.

Save and exit.

---

## Step 14 -- Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/thescene.jeffsquier.dev /etc/nginx/sites-enabled/
```

Test the configuration:

```bash
sudo nginx -t
```

Expected output:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

At this point, visiting `http://thescene.jeffsquier.dev` should show the site (without SSL).

---

## Step 15 -- Install Let's Encrypt SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Run Certbot:

```bash
sudo certbot --nginx -d thescene.jeffsquier.dev -d www.thescene.jeffsquier.dev
```

When prompted:

1. **Email**: Enter your real email (for expiration notices)
2. **Terms**: Agree (Y)
3. **EFF**: Optional (N is fine)
4. **Redirect**: Choose **2** (redirect all HTTP to HTTPS)

Certbot automatically modifies your Nginx config to add SSL settings and HTTP-to-HTTPS redirect.

Verify:

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl list-timers | grep certbot
```

Visit `https://thescene.jeffsquier.dev` -- you should see the padlock icon and the site loads over HTTPS.

---

## Step 16 -- Cloudflare SSL Settings (Important)

Since you're using Cloudflare DNS, configure SSL mode properly:

1. In Cloudflare dashboard > **SSL/TLS** > **Overview**
2. Set SSL mode to **Full (strict)**

This tells Cloudflare that your origin server has a valid SSL certificate (from Let's Encrypt), so the full chain is encrypted.

**Optional**: If you want to enable Cloudflare's proxy (orange cloud) for DDoS protection and CDN:
1. Go to **DNS > Records**
2. Toggle the proxy status to **Proxied** (orange cloud) for both A records
3. This adds Cloudflare's CDN in front of your server

---

## Step 17 -- Security Hardening

### Disable root SSH login and password auth:

```bash
sudo nano /etc/ssh/sshd_config
```

Set:

```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

### Install Fail2Ban:

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Enable automatic security updates:

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Select **Yes**.

---

## Step 18 -- Set Up Supabase Event Auto-Close Cron

Events need to automatically close after their date passes. Set up a daily cron job:

```bash
crontab -e
```

Add this line (runs every day at 2 AM):

```
0 2 * * * curl -s -X POST 'https://YOUR_SUPABASE_URL/rest/v1/rpc/auto_close_expired_events' -H 'apikey: YOUR_ANON_KEY' -H 'Authorization: Bearer YOUR_ANON_KEY' > /dev/null 2>&1
```

Replace `YOUR_SUPABASE_URL` and `YOUR_ANON_KEY` with your actual Supabase values.

This calls the `auto_close_expired_events()` function we created in the database migration, which marks any event past its date as `completed`.

---

## Step 19 -- Verify Everything

| Check | Command / Action | Expected |
|---|---|---|
| Node installed | `node -v` | v22.x.x |
| PM2 running | `pm2 status` | `the-scene` online |
| Nginx running | `sudo systemctl status nginx` | active (running) |
| HTTPS works | Visit `https://thescene.jeffsquier.dev` | Padlock + site loads |
| HTTP redirects | Visit `http://thescene.jeffsquier.dev` | Redirects to HTTPS |
| www works | Visit `https://www.thescene.jeffsquier.dev` | Site loads |
| Certbot renewal | `sudo certbot renew --dry-run` | Success |
| App logs | `pm2 logs the-scene` | No errors |
| Git pull works | `cd /var/www/theScene/html && git pull` | Up to date |
| Cron set | `crontab -l` | Auto-close line visible |

---

## IMPORTANT: .env.local Is NOT In Git (By Design)

The `.env.local` file contains your Supabase secret keys. It is listed in `.gitignore` and will **never** be pushed to GitHub. This is intentional -- secret keys should never exist in a repository.

**You must create `.env.local` manually on every machine that runs the app:**

- On your Mac (for local development)
- On your VPS (for production)

If you skip this step, the build will fail with: `@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`

To create it on the server:

```bash
nano /var/www/theScene/html/.env.local
```

Paste your keys, save, then rebuild with `npm run build`.

---

## Common Issues and Fixes

### Build fails: "Supabase URL and API key are required"

**Cause**: `.env.local` is missing or empty on the server.
**Fix**: Create the file with your Supabase keys (see above). Remember, this file is never pushed via git -- you create it manually on each machine.

### Git error: "detected dubious ownership in repository"

**Cause**: You're running git commands as root, but the repo was cloned as the deploy user.
**Fix**:

```bash
git config --global --add safe.directory /var/www/theScene/html
```

### Git clone: "Invalid username or token"

**Cause**: GitHub Personal Access Token is expired, missing `repo` scope, or has a typo.
**Fix**: Generate a new classic token at GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic). Check the `repo` scope. Then update the remote:

```bash
git remote set-url origin https://USERNAME:NEW_TOKEN@github.com/jungleGreenLSA/theScene.git
```

**Common typo**: Make sure the URL starts with `https://` (one time, not `https://https://`).

### Git clone: "remote: Repository not found"

**Cause**: Token doesn't have `repo` scope, or the repo name is wrong.
**Fix**: Verify the exact repo name on GitHub. Ensure the token has the `repo` checkbox selected (the top-level one, not just sub-items).

### Cloudflare DNS: Domain shows NXDOMAIN

**Cause 1**: CNAME record instead of A record. A CNAME pointing to itself creates a circular reference.
**Fix**: Delete the CNAME record. Create an A record with Name `@` pointing to your server IP.

**Cause 2**: Nameservers not pointed to Cloudflare yet. If the domain was registered elsewhere, the registrar must have Cloudflare's nameservers set.
**Fix**: Go to your domain registrar and set nameservers to the ones Cloudflare assigned (shown at the bottom of the DNS page).

**Cause 3**: DNS propagation delay. New A records can take 2-10 minutes.
**Fix**: Wait, then test with `dig @8.8.8.8 thescene.jeffsquier.dev +short` to query Google's DNS directly.

### Ping from VPS says "Name or service not known"

**Cause**: VPS DNS resolver can't resolve the domain. This is normal for many VPS configurations and does NOT mean your domain is broken.
**Fix**: Ignore it. Test from your Mac browser or with `dig @8.8.8.8 thescene.jeffsquier.dev +short` instead. The domain may resolve fine from the outside world.

### curl localhost:3001 returns nothing or "Connection refused"

**Cause**: PM2 isn't running or the app crashed during startup.
**Fix**:

```bash
pm2 status              # Check if the app is running
pm2 logs the-scene      # Check for errors
pm2 restart the-scene   # Try restarting
```

If it keeps crashing, check the logs for missing environment variables or build errors.

### Browser shows 502 Bad Gateway

**Cause**: Nginx is running but the Next.js app on port 3001 is not.
**Fix**: Start or restart the app with PM2:

```bash
pm2 restart the-scene
```

### Browser shows "can't find server" or ERR_NAME_NOT_RESOLVED

**Cause**: DNS hasn't propagated yet or A record is wrong.
**Fix**: Check `dig @8.8.8.8 thescene.jeffsquier.dev +short` returns your server IP. If not, check Cloudflare DNS settings.

### Certbot fails: "Could not find a CNAME record"

**Cause**: Cloudflare proxy (orange cloud) is enabled, which hides your server IP from Let's Encrypt.
**Fix**: Set the A record to **DNS only** (grey cloud) in Cloudflare before running Certbot. You can re-enable the proxy after SSL is set up.

---

## PM2 Useful Commands

```bash
pm2 status              # See all processes
pm2 logs the-scene      # View app logs (live tail)
pm2 logs the-scene --lines 100   # View last 100 lines
pm2 restart the-scene   # Restart the app
pm2 stop the-scene      # Stop the app
pm2 delete the-scene    # Remove from PM2
pm2 monit               # Live monitoring dashboard
```

---

## Deployment Workflow (after initial setup)

Every time you push code:

1. Push from your Mac: `git push origin main`
2. GitHub Actions SSHes to server
3. Pulls latest code, runs `npm install`, `npm run build`
4. Restarts PM2

Manual deploy (if Actions fails):

```bash
ssh deploy@YOUR_SERVER_IP
cd /var/www/theScene/html
git pull origin main
npm install
npm run build
pm2 restart the-scene
```

---

## Quick Reference -- All Commands in Order

```bash
# System
sudo apt update && sudo apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# Git + Nginx
sudo apt install -y git nginx certbot python3-certbot-nginx

# Firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Web root
sudo mkdir -p /var/www/theScene/html
sudo chown -R deploy:deploy /var/www/theScene

# Clone (as deploy user)
cd /var/www/theScene
git clone https://USER:TOKEN@github.com/jungleGreenLSA/theScene.git html
cd html
git config credential.helper store

# Fix git ownership warning (if running commands as root)
git config --global --add safe.directory /var/www/theScene/html

# Env file -- MUST be created manually, it is NOT in git
nano .env.local   # paste production Supabase keys

# Build and start
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx
sudo nano /etc/nginx/sites-available/thescene.jeffsquier.dev   # paste config
sudo ln -s /etc/nginx/sites-available/thescene.jeffsquier.dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d thescene.jeffsquier.dev -d www.thescene.jeffsquier.dev
sudo certbot renew --dry-run

# Security
sudo nano /etc/ssh/sshd_config   # PermitRootLogin no, PasswordAuthentication no
sudo systemctl restart sshd
sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable fail2ban && sudo systemctl start fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades
```
