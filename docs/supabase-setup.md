# Supabase Setup Guide -- The Scene

**Step-by-step guide to setting up the Supabase backend for The Scene.**

---

## Step 1 -- Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project** (top right)
3. Sign in with your **GitHub account** (recommended -- it links directly to your repos)
4. Authorize Supabase to access your GitHub account

## Step 2 -- Create a New Project

1. After signing in, you'll land on the dashboard
2. Click **New Project**
3. Fill in:
   - **Organization**: Select your personal org (or create one -- free)
   - **Project name**: `the-scene`
   - **Database password**: Generate a strong password and **save it somewhere safe** (you'll need it for direct DB access later)
   - **Region**: Choose the closest to your users. For Dallas, TX: **US East (N. Virginia)** or **US Central** if available
   - **Pricing Plan**: **Free** (includes 50K auth users, 500MB DB, 1GB storage, 2 Edge Function invocations)
4. Click **Create new project**
5. Wait 1-2 minutes for provisioning

## Step 3 -- Get Your API Keys

Once the project is ready:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:

| Key | What It Is | Where It Goes |
|---|---|---|
| **Project URL** | `https://xxxxx.supabase.co` | `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public key** | `eyJhbGci...` (long JWT) | `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | `eyJhbGci...` (different JWT) | `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` -- **NEVER expose this on the client** |

4. Copy each value. You'll paste them into the `.env.local` file in the project.

## Step 4 -- Enable Email Auth (Default)

Email/password auth is enabled by default, but verify:

1. Go to **Authentication** (left sidebar)
2. Click **Providers** (under Configuration)
3. Confirm **Email** is enabled
4. Settings to check:
   - **Confirm email**: ON (requires email verification)
   - **Secure email change**: ON
   - **Double confirm email changes**: ON (recommended)

## Step 5 -- Set Up Google OAuth

### 5.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing):
   - Click the project dropdown (top bar) > **New Project**
   - Name: `the-scene`
   - Click **Create**
3. Enable the Google+ API:
   - Go to **APIs & Services > Library**
   - Search for "Google+ API" or "Google Identity"
   - Enable it
4. Create OAuth credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - If prompted, configure the **OAuth consent screen** first:
     - User type: **External**
     - App name: `The Scene`
     - User support email: your email
     - Developer contact: your email
     - Click **Save and Continue** through the remaining steps
   - Back in Credentials, click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: `The Scene Supabase`
   - **Authorized JavaScript origins**: Add your Supabase project URL
     ```
     https://xxxxx.supabase.co
     ```
   - **Authorized redirect URIs**: Add:
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

### 5.2 Add Google OAuth to Supabase

1. In Supabase, go to **Authentication > Providers**
2. Find **Google** and click to expand
3. Toggle it **ON**
4. Paste:
   - **Client ID**: from Google Cloud Console
   - **Client Secret**: from Google Cloud Console
5. Click **Save**

## Step 6 -- Set Up Facebook OAuth

### 6.1 Create a Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** (top right) > **Create App**
3. Select **Consumer** (or **None** if prompted for use case)
4. App name: `The Scene`
5. Click **Create App**
6. On the app dashboard, find **Facebook Login** and click **Set Up**
7. Choose **Web**
8. For **Site URL**, enter your Supabase project URL:
   ```
   https://ehnijylwegzlrydlzicp.supabase.co
   ```
9. Click **Save** > **Continue**
10. Go to **Facebook Login > Settings** (left sidebar)
11. Under **Valid OAuth Redirect URIs**, add:
    ```
    https://ehnijylwegzlrydlzicp.supabase.co/auth/v1/callback
    ```
12. Click **Save Changes**
13. Go to **Settings > Basic** (left sidebar)
14. Copy the **App ID** and **App Secret** (click "Show" to reveal the secret)

### 6.2 Add Facebook OAuth to Supabase

1. In Supabase, go to **Authentication > Providers**
2. Find **Facebook** and click to expand
3. Toggle it **ON**
4. Paste:
   - **Client ID**: The App ID from Facebook
   - **Client Secret**: The App Secret from Facebook
5. Click **Save**

### 6.3 Make the Facebook App Live

By default, Facebook apps are in **Development Mode** and only you can log in. To allow other users:

1. In the Facebook developer dashboard, go to **App Review > Permissions and Features**
2. You need the **email** permission (should be auto-approved)
3. Go to the top of the page and toggle **App Mode** from **Development** to **Live**
4. You may need to provide a Privacy Policy URL (use `https://thescene.jeffsquier.dev/privacy`)

---

## Step 7 -- Set Up Phone (SMS) Authentication

### 7.1 Enable Phone Provider in Supabase

1. In Supabase, go to **Authentication > Providers**
2. Find **Phone** and click to expand
3. Toggle it **ON**
4. Choose an SMS provider. Supabase supports:
   - **Twilio** (recommended -- most reliable)
   - **Messagebird**
   - **Vonage**

### 7.2 Set Up Twilio (Recommended)

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. From the Twilio Console, get:
   - **Account SID** (starts with `AC...`)
   - **Auth Token**
3. Get a phone number:
   - Go to **Phone Numbers > Manage > Buy a Number**
   - Buy a number with **SMS capability** (starts around $1/month)
4. Copy the **Twilio phone number** (e.g. `+15551234567`)

### 7.3 Configure Twilio in Supabase

1. In Supabase **Authentication > Providers > Phone**
2. Select **Twilio** as the SMS provider
3. Fill in:
   - **Twilio Account SID**: Your `AC...` value
   - **Twilio Auth Token**: Your auth token
   - **Twilio Message Service SID OR Sender Phone Number**: Your Twilio phone number (e.g. `+15551234567`)
4. Click **Save**

### 7.4 Test Phone Auth

Try signing up with a phone number on the site. You should receive an SMS with a 6-digit verification code. Enter it to complete signup.

**Note**: Twilio's free trial has limitations -- it can only send to verified phone numbers. Add your test numbers at **Twilio Console > Verified Caller IDs**. Once you upgrade to a paid Twilio account, any number can receive codes.

---

## Step 8 -- Configure Auth URL Settings

1. Go to **Authentication > URL Configuration**
2. Set:
   - **Site URL**: `https://thescene.jeffsquier.dev`
   - **Redirect URLs**: Add:
     ```
     https://thescene.jeffsquier.dev/auth/callback
     ```

## Step 9 -- Create the Database Schema

1. Go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` (included in the project)
4. Click **Run**
5. Verify by going to **Table Editor** -- you should see all the tables

## Step 10 -- Set Up Storage Buckets

1. Go to **Storage** (left sidebar)
2. Create these buckets:

### Bucket 1: avatars
- Click **New bucket**
- Name: `avatars`
- Public: **ON** (profile pictures need to be publicly viewable)
- File size limit: `2MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Bucket 2: vehicles
- Click **New bucket**
- Name: `vehicles`
- Public: **ON** (car photos need to be publicly viewable)
- File size limit: `5MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Bucket 3: posts
- Click **New bucket**
- Name: `posts`
- Public: **ON**
- File size limit: `5MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Bucket 4: events
- Click **New bucket**
- Name: `events`
- Public: **ON**
- File size limit: `5MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

## Step 11 -- Set Up Storage Policies

For each bucket, you need access policies. Go to **Storage > Policies** for each bucket:

### Public Read (all buckets)
- Click **New Policy > For full customization**
- Name: `Public read access`
- Allowed operations: **SELECT**
- Target roles: **public** (anon)
- Policy: `true`

### Authenticated Upload (all buckets)
- Click **New Policy > For full customization**
- Name: `Authenticated users can upload`
- Allowed operations: **INSERT**
- Target roles: **authenticated**
- Policy: `true`

### Owner Delete (all buckets)
- Click **New Policy > For full customization**
- Name: `Users can delete own files`
- Allowed operations: **DELETE**
- Target roles: **authenticated**
- Policy: `(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`

Adjust the bucket_id for each bucket. The folder structure will be: `user_id/filename.jpg`

## Step 12 -- Configure Your .env.local File

In your project root, create `.env.local`:

```bash
# ============================================
# THE SCENE - Environment Configuration
# ============================================

# Site
NEXT_PUBLIC_SITE_NAME="The Scene"
NEXT_PUBLIC_SITE_URL="https://thescene.jeffsquier.dev"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Google OAuth (these are configured IN Supabase, not in the app directly)
# Kept here for reference only
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Maps (for event locations)
NEXT_PUBLIC_GOOGLE_MAPS_KEY="your-google-maps-api-key"
```

**IMPORTANT**: `.env.local` is in `.gitignore` and will NOT be pushed to GitHub. Never commit this file.

## Step 13 -- Verify Everything Works

After setting up Supabase and deploying the app:

| Check | How | Expected |
|---|---|---|
| Auth email signup | Register with email on the site | Receive verification email |
| Auth Google login | Click "Sign in with Google" | Redirected to Google, then back to site |
| Database tables | Supabase Dashboard > Table Editor | All tables visible |
| Storage buckets | Supabase Dashboard > Storage | 4 buckets visible |
| RLS policies | Supabase Dashboard > Authentication > Policies | Policies active on all tables |

---

## Supabase Free Tier Limits (for reference)

| Resource | Limit |
|---|---|
| Database | 500 MB |
| Storage | 1 GB |
| Bandwidth | 2 GB |
| Auth users | 50,000 |
| Edge Functions | 500K invocations |
| Realtime | 200 concurrent connections |

For a prototype/proof of concept, this is more than enough.

---

## Important Notes

### .env.local Is NOT In Git

The `.env.local` file is listed in `.gitignore` and will **never** be pushed to GitHub. This is a security feature -- your Supabase secret keys should never exist in a repository.

You must create `.env.local` **manually** on every machine:
- On your Mac for local development
- On your VPS for production

Without this file, the Next.js build will fail with: `@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`

### Where to Find Your Keys

If you need to look up your keys again:

1. Go to the Supabase dashboard
2. Click **Project Settings** (gear icon)
3. Click **API**
4. You'll see:

| Dashboard Label | .env.local Variable |
|---|---|
| Project URL (Settings > General) | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable key** (top, under "anon public") | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret key** (bottom, under "service_role") | `SUPABASE_SERVICE_ROLE_KEY` |

Both keys are long JWT strings starting with `eyJ...`. If your key starts with `sb_secret_`, that's the **database password** -- not the API key.

### Running SQL Migrations

The two migration files only need to be run **once** during initial setup. They create the database structure. If you run them again, they will fail with "already exists" errors -- that's harmless.

| File | Tables Created | Run Order |
|---|---|---|
| `001_initial_schema.sql` | 18 core tables (profiles, vehicles, posts, events, etc.) | First |
| `002_clubs_and_event_photos.sql` | 5 additional tables (clubs, club_locations, club_members, event_photo_posts, event_photo_comments) | Second |

After running both, verify in **Table Editor** -- you should see 23 tables total.

### Google Maps Key (Optional)

`NEXT_PUBLIC_GOOGLE_MAPS_KEY` is optional. Leave it empty for now. Event pages will work without it -- you just won't get embedded map views. You can add it later via the Google Cloud Console if desired.

---

*This guide is specific to The Scene project. Supabase dashboard UI may change over time -- screenshots may differ from current UI.*
