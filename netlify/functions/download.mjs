import { supabase, json } from "./_supabase.mjs";

export const config = { path: "/.netlify/functions/download" };

export default async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    const { data: row, error: selErr } = await supabase
      .from("photos").select("*").eq("id", id).maybeSingle();
    if (selErr) return json({ error: selErr.message, stage: "db-select" }, 500);
    if (!row) return json({ error: "Not found" }, 404);

    if (row.expires_at && new Date() > new Date(row.expires_at)) {
      return json({ error: "Link expired" }, 410);
    }

    const { data: signed, error: signErr } = await supabase
      .storage.from("photos").createSignedUrl(row.path, 300);
    if (signErr) return json({ error: signErr.message, stage: "sign-url" }, 500);

    return json({ url: signed.signedUrl });
  } catch (e) {
    return json({ error: e.message || "Unexpected error", stage: "exception" }, 500);
  }
};
