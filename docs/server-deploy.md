# Server Deployment Guide -- The Scene

## Prerequisites on VPS
- Node.js 20+ installed
- PM2 installed globally
- Nginx configured
- SSL via Certbot

## Step 1 -- Install Node.js on the VPS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## Step 2 -- Install PM2

```bash
sudo npm install -g pm2
```

## Step 3 -- Clone the Repo

```bash
cd /var/www/theScene/html
git init
git remote add origin https://jungleGreenLSA:YOUR_TOKEN@github.com/jungleGreenLSA/theScene.git
git pull origin main
```

## Step 4 -- Create .env.local on the Server

```bash
nano /var/www/theScene/html/.env.local
```

Paste your environment variables (same as local but with production URL):

```
NEXT_PUBLIC_SITE_NAME="The Scene"
NEXT_PUBLIC_SITE_URL="https://thescene.jeffsquier.dev"
NEXT_PUBLIC_SITE_DOMAIN="thescene.jeffsquier.dev"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_GOOGLE_MAPS_KEY=""
```

## Step 5 -- Build and Start

```bash
cd /var/www/theScene/html
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

`pm2 save` remembers your process list. `pm2 startup` generates a startup script so PM2 restarts your app on server reboot.

## Step 6 -- Update Nginx

Edit your Nginx config for thescene.jeffsquier.dev:

```bash
sudo nano /etc/nginx/sites-available/thescene.jeffsquier.dev
```

Replace the contents of the `server` block (port 443) with:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name thescene.jeffsquier.dev;

    ssl_certificate /etc/letsencrypt/live/thescene.jeffsquier.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thescene.jeffsquier.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
}
```

This is the key difference from the static sites -- Nginx acts as a **reverse proxy** to Next.js running on port 3001, instead of serving static files directly.

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7 -- Verify

Visit `https://thescene.jeffsquier.dev` -- you should see the landing page.

## Useful PM2 Commands

```bash
pm2 status           # See running processes
pm2 logs the-scene   # View logs
pm2 restart the-scene # Restart the app
pm2 stop the-scene   # Stop the app
pm2 monit            # Live monitoring dashboard
```
