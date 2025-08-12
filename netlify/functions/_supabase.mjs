import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;
if (!url || !key) {
  console.warn("[_supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars");
}

export const supabase = createClient(url, key);

export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra }
  });
