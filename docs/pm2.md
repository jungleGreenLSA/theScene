# PM2 — theScene

Production process manager for theScene on the Hostinger VPS. theScene runs as PM2 process `the-scene` in `deploy`'s PM2 daemon (not `root`'s).

## Who runs what

| User | PM2 daemon purpose |
|------|-------------------|
| `deploy` | All application processes: `the-scene`, `driven-to-duty` |
| `root` | Should be empty — nothing app-level runs here |

GitHub Actions SSHes as `deploy` (`HOSTINGER_USER` secret). The workflow at `.github/workflows/deploy.yml` runs `pm2 restart the-scene || pm2 start ecosystem.config.js` — so it only ever touches deploy's daemon.

## ecosystem.config.js

```js
module.exports = {
  apps: [{
    name: 'the-scene',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/var/www/theScene/html',
    env: { NODE_ENV: 'production', PORT: 3001 },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '512M',
    max_restarts: 10,
    restart_delay: 3000,
  }],
}
```

Port `3001` → Nginx reverse-proxies `thescene.fyi` to `127.0.0.1:3001`. Don't change the port without updating `/etc/nginx/sites-available/thescene.fyi`.

Node 22 is required. Node 25 breaks the build.

## File ownership

`/var/www/theScene/html` must be owned by `deploy:deploy` so GitHub Actions can `git pull` + `npm install` + `next build`. Verify with `ls -la /var/www/theScene/`.

A second directory `/var/www/theScene/theScene/` exists alongside `html/` — legacy, unused. Leave it alone.

## Common commands (as deploy)

```bash
pm2 status                       # see all processes
pm2 logs the-scene                # tail logs
pm2 logs the-scene --err          # errors only
pm2 logs the-scene --lines 200    # last 200 lines
pm2 restart the-scene             # restart
pm2 reload the-scene              # zero-downtime reload (fork mode = same as restart)
pm2 stop the-scene                # stop
pm2 delete the-scene              # remove from list
pm2 save                          # persist current list for reboot
pm2 flush the-scene               # clear logs
pm2 describe the-scene            # full config dump
```

## Startup on reboot

`deploy`'s PM2 daemon is wired to systemd. After any `pm2 start` or `pm2 delete`, run `pm2 save` to persist the new state. Reboots then restore it via `pm2-deploy.service`.

Check: `systemctl status pm2-deploy`. Re-install if missing:
```bash
# as deploy
pm2 startup systemd
# run the sudo command it prints, then
pm2 save
```

## Migrating the process between users

Historical note: theScene originally ran under root's PM2 daemon. When we moved the workflow to SSH as deploy, deploy's daemon started failing silently — it kept trying to bind port 3001, which root's process still held. The site served stale code for weeks before we noticed.

Migration procedure (already done 2026-04-18):

```bash
# 1. deploy: clear stuck entry
pm2 delete the-scene
pm2 save

# 2. root: kill the real process
sudo -i
pm2 stop the-scene
pm2 delete the-scene
pm2 save
pm2 list   # should be empty if nothing else runs as root
exit

# 3. deploy: start fresh
cd /var/www/theScene/html
pm2 start ecosystem.config.js
pm2 save

# 4. verify
pm2 status
curl -sI http://127.0.0.1:3001/ | head -n 1   # expect HTTP/1.1 200
```

If root's `pm2 list` is empty after step 2 and nothing else will ever run as root, disable the root unit:
```bash
sudo systemctl disable pm2-root
sudo systemctl stop pm2-root
```

## Troubleshooting

**Process keeps restarting (↺ > 10)**

`max_restarts: 10` + `restart_delay: 3000` means PM2 gives up after 10 rapid failures. Check `pm2 logs the-scene --err` for the crash cause. Common culprits:

- **Port 3001 in use** → another daemon (root or zombie) holds it. `sudo lsof -i :3001` to find it.
- **Build artifacts missing** → `.next/` wasn't generated. Run `npm run build` in `/var/www/theScene/html`.
- **Env vars missing** → `.env` isn't loaded. PM2 reads from `process.env` at start. Check the file exists and restart with `pm2 restart the-scene --update-env`.
- **Node version mismatch** → `node -v` should show v22.x. Run via `nvm use 22` before starting PM2.

**Memory grows and hits `max_memory_restart: 512M`**

PM2 auto-restarts. If it loops rapidly, something is leaking. Check the most recent large commit for new long-lived subscriptions/intervals.

**"Process not found" after reboot**

`pm2 save` wasn't run after the last change. Restart it manually with `cd /var/www/theScene/html && pm2 start ecosystem.config.js && pm2 save`.

**Nginx 502**

App isn't responding on 3001. `pm2 status` to check state; `curl http://127.0.0.1:3001/` to bypass nginx.

**After migration in Supabase SQL Editor**

Migrations don't need a PM2 restart — they're DB-only. Unless the code also changed (which auto-deploys), no action needed.

## Logs location

`~/.pm2/logs/` (under deploy's home, i.e. `/home/deploy/.pm2/logs/`):
- `the-scene-out.log` — stdout
- `the-scene-error.log` — stderr
- `the-scene-*.log` rotated copies

Rotate manually with `pm2 flush the-scene` if they get large. For automatic rotation install `pm2-logrotate`:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```
