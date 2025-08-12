# CandidPhotos — Single Photo (Netlify + Supabase)

Production-ready, single-photo flow with QR share, "follow to unlock", 30-day expiry, and robust diagnostics.

## What’s included
- `public/admin.html` — upload UI (uses `ADMIN_UPLOAD_TOKEN` via request header)
- `/.netlify/functions/upload` — receives one file, uploads to Supabase Storage, writes DB row
- `/share/<id>` — landing page with blurred preview, Instagram + TikTok + optional Snapchat
- `/.netlify/functions/download?id=<id>` — verifies expiry and returns a 5-min signed URL
- `/.netlify/functions/cleanup` — deletes expired rows + storage files (scheduled daily at 03:00 UTC)
- `/.netlify/functions/ping` — JSON health check for functions
- `supabase-init.sql` — creates the `photos` table with RLS locked down to server

## Netlify config
`netlify.toml` sets:
```toml
[build]
  publish = "public"
  functions = "netlify/functions"

[[redirects]]
from = "/share/*"
to = "/.netlify/functions/share?id=:splat"
status = 200

[[functions."cleanup"].scheduled]]
cron = "0 3 * * *"
```

## Environment variables (Site settings → Environment variables)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `ADMIN_UPLOAD_TOKEN`
- `SNAPCHAT_USERNAME` (optional)

## Supabase setup
1. Create a **private** storage bucket named `photos`.
2. Run `supabase-init.sql` in the SQL Editor.

## Verify after deploy
1. Visit your **primary netlify.app** domain first (before custom domains):
   - `https://<your-site>.netlify.app/.netlify/functions/ping` → should return JSON.
   - `https://<your-site>.netlify.app/admin.html` → should load uploader.
2. If that works, point your custom domain (e.g. `photos.anthonymchugh.com`) to **this same site**:
   - In **Domain management**, attach the custom domain to this site.
   - In DNS, set CNAME `photos` → `<your-site>.netlify.app` (DNS only while testing).
3. Test the custom domain:
   - `https://photos.anthonymchugh.com/.netlify/functions/ping` → JSON
   - `https://photos.anthonymchugh.com/admin.html` → upload OK

## Notes
- TikTok link is `@anthonymchugh_` as requested.
- The preview is blurred until the user clicks “I followed — unlock download”.
- All function responses are JSON with explicit `content-type` and clear `stage` keys on error.
