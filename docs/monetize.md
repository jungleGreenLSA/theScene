# Monetization Guide -- The Scene

**Complete guide to setting up payments, subscriptions, and revenue streams.**

---

# 1. Subscription Model

## Pricing

| Plan | Monthly | Yearly | Per Month (Yearly) |
|---|---|---|---|
| Free | $0 | $0 | $0 |
| Premium | $7.99 | $69.99 | $5.83 (27% savings) |

## Free vs Premium Features

| Feature | Free | Premium |
|---|---|---|
| Vehicles in garage | 1 | Unlimited |
| Photos per vehicle | 5 | Unlimited |
| Photos per post | 1 | Multiple |
| Profile badge | None | Purple premium badge |
| Explore placement | Standard | Priority |
| Garage URL | Auto-generated slug | Custom slug |
| Garage analytics | None | Views, visitors, props over time |
| See who viewed garage | No | Yes |
| Ride of the Week voting | 1x props | 2x props weight |
| Create events | After 60 days | Immediately |
| Event placement | Standard | Featured |
| Event analytics | None | Views, RSVPs over time |
| Create clubs | No (join only) | Yes |
| Marketplace listings | 2 active | Unlimited |
| Marketplace placement | Standard | Featured + verified seller badge |
| Post/comment flair | None | Premium flair |

---

# 2. Stripe Setup (Payment Processor)

Stripe handles all payment processing. You never see or store credit card numbers.

## 2.1 Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete business verification (you can use your personal info for a sole proprietorship)
3. Once verified, you'll have access to the Stripe Dashboard

## 2.2 Get Your API Keys

1. In Stripe Dashboard, go to **Developers > API keys**
2. You'll see two key pairs:

### Test Mode Keys (for development)

| Key | Starts With | Purpose |
|---|---|---|
| Publishable key | `pk_test_` | Used in frontend (safe to expose) |
| Secret key | `sk_test_` | Used in backend only (NEVER expose) |

### Live Mode Keys (for production)

| Key | Starts With | Purpose |
|---|---|---|
| Publishable key | `pk_live_` | Used in frontend |
| Secret key | `sk_live_` | Used in backend only |

**Toggle between Test and Live mode** using the switch in the top-right of the Stripe Dashboard.

## 2.3 Create Products and Prices in Stripe

1. Go to **Products** in Stripe Dashboard
2. Click **Add product**
3. Create:

### Product: The Scene Premium

- **Name**: The Scene Premium
- **Description**: Full access to all premium features on The Scene
- Add two prices:

**Price 1 - Monthly:**
- Pricing model: Recurring
- Amount: $7.99
- Billing period: Monthly
- Click **Add price**
- Copy the **Price ID** (starts with `price_`)

**Price 2 - Yearly:**
- Pricing model: Recurring
- Amount: $69.99
- Billing period: Yearly
- Click **Add price**
- Copy the **Price ID** (starts with `price_`)

## 2.4 Set Up Webhook

Stripe sends events to your server when payments happen (subscription created, cancelled, failed, etc.)

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://thescene.jeffsquier.dev/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Webhook Signing Secret** (starts with `whsec_`)

## 2.5 Set Up Customer Portal

The customer portal lets users manage their own subscription (cancel, update payment, etc.)

1. Go to **Settings > Billing > Customer portal**
2. Enable:
   - Allow customers to cancel subscriptions
   - Allow customers to switch plans
   - Allow customers to update payment methods
3. Save

---

# 3. Environment Variables

Add these to your `.env.local` on both your **Mac** and your **server**:

```bash
# Stripe - Test Mode (use these for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"

# Stripe Price IDs
STRIPE_PRICE_MONTHLY="price_xxxxxxxxxxxx"
STRIPE_PRICE_YEARLY="price_xxxxxxxxxxxx"

# Stripe Customer Portal
NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL="https://billing.stripe.com/p/login/test_xxxx"
```

When you're ready to go live, replace the test keys with live keys:

```bash
# Stripe - Live Mode (use these for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"

# Price IDs are the same for test and live if you created them in live mode
STRIPE_PRICE_MONTHLY="price_xxxxxxxxxxxx"
STRIPE_PRICE_YEARLY="price_xxxxxxxxxxxx"
```

**IMPORTANT**: 
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only. They do NOT have the `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose in the browser.
- After updating `.env.local` on the server, you must rebuild: `npm run build && pm2 restart the-scene`

---

# 4. Database Migration

Run `supabase/migrations/003_subscription_tier.sql` in the Supabase SQL Editor. This adds:

- `subscription_tier` field to profiles (`free` or `premium`)
- `stripe_customer_id` field (links Supabase user to Stripe customer)
- `subscription_expires_at` field (when the subscription ends)
- `is_premium()` function for checking subscription status

---

# 5. API Routes to Build

You need three API routes in the Next.js app:

### `/api/stripe/checkout` (POST)
Creates a Stripe Checkout session. Called when user clicks "Start Premium."

Flow:
1. Get the logged-in user from Supabase
2. Create or retrieve a Stripe customer (store `stripe_customer_id` in profiles)
3. Create a Checkout Session with the selected price
4. Return the Checkout URL
5. Redirect user to Stripe's hosted payment page

### `/api/stripe/webhook` (POST)
Receives events from Stripe when payment status changes.

Flow:
1. Verify the webhook signature using `STRIPE_WEBHOOK_SECRET`
2. On `checkout.session.completed` or `invoice.paid`:
   - Update `profiles.subscription_tier` to `premium`
   - Update `profiles.subscription_expires_at`
3. On `customer.subscription.deleted` or `invoice.payment_failed`:
   - Update `profiles.subscription_tier` to `free`
   - Clear `subscription_expires_at`

### `/api/stripe/portal` (POST)
Creates a Stripe Customer Portal session for managing subscriptions.

Flow:
1. Get the logged-in user
2. Get their `stripe_customer_id` from profiles
3. Create a portal session
4. Return the portal URL
5. Redirect user to Stripe's self-service portal

---

# 6. NPM Package Required

Install the Stripe SDK:

```bash
npm install stripe
```

Add to `package.json` on both Mac and server.

---

# 7. How the Subscription Flow Works

### User signs up free:
1. User registers (email, Google, Facebook, or phone)
2. Profile created with `subscription_tier: 'free'`
3. User can use all free features

### User upgrades to premium:
1. User clicks "Start Premium" on pricing page
2. App calls `/api/stripe/checkout` with selected price (monthly or yearly)
3. User redirected to Stripe Checkout (hosted payment page)
4. User enters payment info and pays
5. Stripe sends `checkout.session.completed` webhook to your server
6. Webhook handler updates `profiles.subscription_tier` to `premium`
7. User redirected back to the app with premium active

### User manages subscription:
1. User goes to Settings > Subscription
2. Clicks "Manage Subscription"
3. App calls `/api/stripe/portal`
4. User redirected to Stripe Customer Portal
5. User can cancel, switch plans, or update payment
6. Stripe sends webhooks for any changes
7. Webhook handler updates the database accordingly

### Subscription expires or fails:
1. Stripe sends `invoice.payment_failed` or `customer.subscription.deleted`
2. Webhook handler sets `subscription_tier` back to `free`
3. User loses premium features but keeps their data

---

# 8. Feature Gating in Code

To check if a user is premium in your components:

```typescript
// Server component
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_tier')
  .eq('id', user.id)
  .single()

const isPremium = profile?.subscription_tier === 'premium'

// Then conditionally render
{isPremium ? <PremiumFeature /> : <UpgradePrompt />}
```

For the database function (useful in RLS policies):

```sql
-- In a policy
SELECT is_premium(auth.uid())
```

---

# 9. Revenue Projections

| Scenario | Premium Users | Monthly Revenue | Annual Revenue |
|---|---|---|---|
| Conservative (2% conversion) | 20 of 1,000 | $160 | $1,920 |
| Moderate (5% conversion) | 50 of 1,000 | $400 | $4,800 |
| Strong (10% conversion) | 100 of 1,000 | $800 | $9,600 |
| Scale (5% of 10,000) | 500 | $4,000 | $48,000 |
| Scale (5% of 50,000) | 2,500 | $20,000 | $240,000 |

Industry average for freemium-to-paid conversion is 2-5%. Car enthusiasts tend to spend on their hobby, so 5-10% is realistic for a niche community.

---

# 10. Additional Revenue Streams

## Marketplace Fees (Future)
- Free listing for free users (2 max)
- Unlimited for premium
- Optional "Featured Listing" boost: $4.99 per listing for 7 days
- Take a small % on completed sales if you add payment integration

## Event Sponsorship (Future)
- Event organizers pay $9.99 to pin their event at the top of the events page for 7 days
- Brand sponsors can pay for banner placement on event pages

## Brand Partnerships
- Parts companies sponsor "Ride of the Week" ($500-1000/month)
- Affiliate links on mod lists (user lists "Kooks headers" -- you link to a retailer and earn commission)
- Featured brand placement on the brands section

## Advertising
- The `AdSlot` component is already built into the codebase
- Google AdSense integration
- Direct ad sales to automotive businesses
- Placement: feed between posts, sidebar on garage pages, event pages

---

# 11. Stripe Testing

Before going live, test everything with Stripe's test cards:

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |
| `4000 0000 0000 3220` | Requires 3D Secure |

Use any future expiry date, any 3-digit CVC, and any zip code.

Test the full flow:
1. Click "Start Premium" on pricing page
2. Enter test card `4242 4242 4242 4242`
3. Verify webhook fires and profile updates to premium
4. Go to Settings > Manage Subscription
5. Cancel in the portal
6. Verify webhook fires and profile reverts to free

---

# 12. Going Live Checklist

| Step | Status |
|---|---|
| Stripe account verified | |
| Live API keys generated | |
| Products/prices created in live mode | |
| Webhook endpoint added with live URL | |
| `.env.local` on server updated with live keys | |
| Customer portal configured | |
| Test purchase completed | |
| Test cancellation completed | |
| Test failed payment completed | |
| Webhook handler working for all events | |
| Migration 003 run in Supabase | |

---

# 13. Important Security Notes

- **NEVER** log or expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET`
- **ALWAYS** verify webhook signatures before processing events
- **NEVER** trust client-side subscription status -- always check the database
- Store `stripe_customer_id` in the database so you can look up customers
- Use Stripe's hosted Checkout and Customer Portal -- don't build your own payment forms (PCI compliance)
- Rate limit the checkout endpoint to prevent abuse

---

*Stripe takes approximately 2.9% + $0.30 per transaction. Factor this into your pricing. On a $7.99 monthly subscription, Stripe takes approximately $0.53, leaving you $7.46.*
