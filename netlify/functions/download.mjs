import { supabase, jsonResponse } from "./_supabase.mjs";

export default async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonResponse({ error: "Missing id" }, 400);

  // Find photo
  const { data: row, error } = await supabase.from("photos").select("*").eq("id", id).single();
  if (error || !row) return jsonResponse({ error: "Not found" }, 404);

  // Check expiry
  const now = new Date();
  const exp = new Date(row.expires_at);
  if (now > exp) return jsonResponse({ error: "Link expired" }, 410);

  // Make signed URL for 5 minutes
  const { data: signed, error: signErr } = await supabase
    .storage.from("photos").createSignedUrl(row.path, 300);
  if (signErr) return jsonResponse({ error: signErr.message }, 500);

  // increment download_count
  await supabase.from("photos").update({ download_count: (row.download_count || 0) + 1 }).eq("id", id);

  return jsonResponse({ url: signed.signedUrl });
};
