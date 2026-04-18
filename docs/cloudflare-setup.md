# Cloudflare Setup for thescene.fyi

End-to-end playbook for putting **thescene.fyi** behind Cloudflare.
Goal: offload bandwidth, cache OG images + static assets, get DDoS
protection, add rate limiting — all on the free plan.

**Server:** Hostinger VPS at `187.124.251.180` (Next.js via PM2 behind Nginx, SSL via Let's Encrypt).

---

## 1. Create a Cloudflare account + add the site

1. Sign up at https://dash.cloudflare.com/sign-up if you don't have an account.
2. Click **+ Add a domain** → enter `thescene.fyi` → pick the **Free** plan → Continue.
3. Cloudflare scans your current DNS. Verify the imported records match what's listed below under §2. If anything's missing, add it manually before continuing.

## 2. DNS records

Under **DNS → Records**, make sure these exist:

| Type  | Name              | Target                    | Proxy status       |
|-------|-------------------|---------------------------|--------------------|
| A     | `@`               | `187.124.251.180`         | **Proxied (orange)** |
| A     | `www`             | `187.124.251.180`         | **Proxied (orange)** |
| CNAME | `thescene.jeffsquier.dev` | `187.124.251.180` (or A) | Proxied            |
| TXT   | (Supabase auth verification records if any) | …           | DNS only           |
| MX    | (email provider records) | …                    | DNS only           |

**Critical:** the two `A` records must be **orange-cloud (Proxied)**, otherwise Cloudflare never sees the traffic and none of the caching or protection kicks in.

> Keep any MX / TXT records Cloudflare auto-imported for email or Supabase auth. Only the web-serving A / CNAME records need the proxy toggled on.

## 3. Point the domain at Cloudflare

Cloudflare will show you two nameservers like `ara.ns.cloudflare.com` and `bob.ns.cloudflare.com`. Log in to your domain registrar and swap the current nameservers for those two.

- Propagation usually takes 5–30 minutes; Cloudflare emails you when it's active.
- While waiting, DO NOT delete your current SSL certificate on the server. Cloudflare's proxy needs it.

## 4. SSL / TLS settings

Once the site status shows **Active**:

1. **SSL/TLS → Overview** → set mode to **Full (strict)**.
   - This assumes you already have a valid Let's Encrypt cert on the origin. If Nginx serves a valid HTTPS cert for thescene.fyi (which it does), "Full (strict)" is the correct choice.
2. **SSL/TLS → Edge Certificates**
   - Enable **Always Use HTTPS**.
   - Enable **Automatic HTTPS Rewrites**.
   - Set **Minimum TLS Version** to 1.2.
   - Enable **Opportunistic Encryption**.
   - Enable **HSTS** (optional, but recommended once you're confident): max-age 6 months, include subdomains, no-sniff, preload off for now.

## 5. Speed settings

**Speed → Optimization**:

- **Auto Minify** → check HTML, CSS, JS.
- **Brotli** → On.
- **Early Hints** → On.
- **Rocket Loader** → **Off**. It breaks React hydration.

**Network**:

- **HTTP/3 (with QUIC)** → On.
- **0-RTT Connection Resumption** → On.

## 6. Caching rules (most important part)

This is where the bandwidth savings come from. Cloudflare's default is to cache only static extensions. For a Next.js app we want to be explicit.

Go to **Caching → Cache Rules** (new interface replaces Page Rules on free plan).

### Rule 1 — Cache OG images aggressively

Every link preview shared on iMessage/Discord/Twitter hits `/api/og/[type]/[id]`. These never change for a given ID and burn CPU.

- Name: `OG images`
- When incoming requests match: `URI Path starts with /api/og/`
- Then:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **1 day**
  - Browser TTL: **4 hours**

### Rule 2 — Cache Next.js build assets forever

Next.js hashes every file in `/_next/static/`, so cache-forever is safe.

- Name: `Next.js static`
- When: `URI Path starts with /_next/static/`
- Then:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **1 month**
  - Browser TTL: **1 month**

### Rule 3 — Bypass cache for auth + API + writes

Everything user-specific or mutating must not be cached.

- Name: `Bypass cache — dynamic`
- When: `URI Path matches` any of:
  - `/auth/*`
  - `/api/*` (but we already override `/api/og/*` above — rules apply in order, so put this AFTER rule 1)
  - `/settings*`
  - `/garage*`
  - `/activity*`
- Then:
  - Cache eligibility: **Bypass cache**

### Rule 4 — Short-cache public pages

For read-heavy public pages (profiles, clubs, events, shops) a tiny TTL cuts DB hits dramatically without showing stale data.

- Name: `Public pages short cache`
- When: `URI Path matches` any of:
  - `/user/*`
  - `/clubs/*`
  - `/events/*`
  - `/shops/*`
  - `/marketplace/*`
  - `/` (homepage)
- Then:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **5 minutes**
  - Browser TTL: **1 minute**

> **Important:** rules run top-to-bottom. Put Rules 1 + 2 first, Rule 3 in the middle, Rule 4 last.

## 7. Rate limiting (optional, free plan allows 1 rule)

Protects signup/login from credential stuffing.

**Security → WAF → Rate limiting rules → Create rule**:

- Name: `Auth brute-force`
- When: `URI Path contains /auth/`
- Action: **Block**
- Characteristics: IP address
- Period: 10 seconds
- Requests: 20

## 8. Security settings

**Security → Settings**:

- **Security Level**: Medium (default). High will false-positive on legit traffic.
- **Bot Fight Mode**: On. Drops crawlers + obvious scrapers for free.
- **Browser Integrity Check**: On.
- **Challenge Passage**: 30 minutes.

**Security → WAF → Managed rules**: leave defaults on. Cloudflare's free OWASP ruleset covers SQL injection, XSS, etc.

## 9. Make sure Next.js emits proper cache headers

Cloudflare will obey `Cache-Control` headers from the origin. For the OG route, add a long `s-maxage` so edge caching works even if Cache Rules are misconfigured.

Edit `src/app/api/og/[type]/[id]/route.tsx`:

```typescript
export async function GET(req: Request, { params }: ...) {
  // ...existing code...
  return new ImageResponse(<Layout ... />, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  })
}
```

That tells browsers to cache 1h, CDN to cache 24h, and serve stale content while revalidating for another 24h. Set-it-and-forget-it.

## 10. Verify it's working

After DNS propagates:

1. Open **https://thescene.fyi** in an incognito window.
2. DevTools → Network → reload.
3. Click the HTML request. Look at response headers:
   - `cf-cache-status: DYNAMIC` (first visit) or `HIT` (second visit) ✓
   - `server: cloudflare` ✓
4. Click an image under `/_next/static/`. Should see `cf-cache-status: HIT` after a second request.
5. Visit `/api/og/vehicle/<some-id>`. First response: `DYNAMIC` or `MISS`. Reload: `HIT`.

If you see `BYPASS` everywhere, the proxy isn't enabled on the DNS record — double-check the orange cloud icon.

## 11. Cloudflare Analytics

**Analytics & Logs → Traffic**: shows requests, bandwidth, cache hit ratio, top countries. Aim for **cache hit ratio > 40%** once rules are in place. That's the number that saves you money.

## 12. What this buys you

| Metric | Before Cloudflare | After (expected) |
|--------|-------------------|------------------|
| Bandwidth billed to origin | 100% | ~30% (most goes through CDN) |
| OG image CPU hits | Every share | 1 per 24h per ID |
| DDoS resilience | None | Cloudflare absorbs L3/L4 |
| Global page latency | ~200–400 ms | ~80–150 ms (edge cached) |
| Monthly cost | — | **$0** |

## 13. Caveats

- **Supabase Storage images** (user avatars, event flyers, etc.) are served from `ehnijylwegzlrydlzicp.supabase.co` — Cloudflare can't cache those unless you set up a `img.thescene.fyi` CNAME that proxies Supabase Storage. For now, they won't benefit from this setup. Add that optimization later if storage egress becomes expensive.
- **Mapbox tiles** are served from Mapbox's own CDN and aren't affected by Cloudflare.
- **Supabase Realtime / WebSockets** — if you add real-time later, you'll need to configure Cloudflare to allow `wss://` upgrades. The free plan supports this natively now (as of 2024).
- **Cache purges** — when you redeploy and change HTML/CSS that has Cache Rule 4 applied, you may need to manually purge cache (Caching → Configuration → Purge Everything) or the 5-minute TTL will resolve it on its own.

## 14. Optional next steps (when you have time)

- **Cloudflare Turnstile** (free) on auth/register pages — invisible CAPTCHA, stops scripted signups.
- **Cloudflare Tunnel** (free) — expose the origin without opening ports on Hostinger. If you ever change VPS providers, just update the tunnel config.
- **Cloudflare R2** — S3-compatible storage with zero egress fees. If Supabase storage costs ever sting, migrate user uploads here.
- **Cloudflare Pages** — host Next.js on their edge network instead of Hostinger. Free tier is generous. Would replace the PM2/Nginx setup entirely.

---

Last updated: 2026-04-17 · maintained alongside repo `jungleGreenLSA/theScene`.
