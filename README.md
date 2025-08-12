# Follow-to-Unlock (Netlify + Supabase)

This starter lets you upload a photo, generate a share URL + QR, require a "follow" step to unlock the download, and auto-expire after 30 days.

## What you get
- `/public/admin.html` — upload UI (requires ADMIN_UPLOAD_TOKEN header)
- `/.netlify/functions/upload` — receives file, uploads to Supabase Storage, creates DB row with 30-day expiry
- `/share/:id` — gated landing page with social links and an Unlock button
- `/.netlify/functions/download?id=:id` — checks expiry, returns a 5-minute signed URL
- `/.netlify/functions/cleanup` — scheduled daily job to permanently delete expired files and rows
- `supabase-init.sql` — create the `photos` table

## Setup
1. Create a new Supabase project.
2. In Supabase **Storage**, create a private bucket named `photos`.
3. In Supabase **SQL**, run `supabase-init.sql`.
4. On Netlify, set these environment variables:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE` = service role key (server-side only)
   - `ADMIN_UPLOAD_TOKEN` = a long random string you will paste into the admin page
5. Deploy to Netlify. The scheduled cleanup runs daily at 03:00 UTC (edit in `netlify.toml`).

## Usage
- Visit `/admin.html`, pick a file, paste your `ADMIN_UPLOAD_TOKEN`, click **Upload**.
- You’ll get a Share URL and a QR code for that URL.
- Visitors see a preview, tap a social link to follow you, then click **Unlock** to get the download.
- Links automatically stop working after 30 days. Cleanup permanently removes them.

> Note: Most social platforms do not provide a way to *verify* a follow without OAuth + paid APIs. This starter uses an honor-gate. If you want a verifiable gate (e.g., Discord server membership, email signup), extend the unlock button to require OAuth before calling `/download`.
