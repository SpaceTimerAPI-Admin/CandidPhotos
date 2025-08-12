import { supabase, jsonResponse } from "./_supabase.mjs";

export const config = { path: "/.netlify/functions/download" };

async function getAlbum(albumId) {
  const { data: album, error } = await supabase.from("albums").select("*").eq("id", albumId).single();
  if (error) return { error };
  return { album };
}

async function listItems(albumId) {
  const { data, error } = await supabase.from("album_items").select("*").eq("album_id", albumId);
  return { data, error };
}

export default async (request) => {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("album") || searchParams.get("id"); // backward compat
  const all = searchParams.get("all") === "1";
  const filePath = searchParams.get("file"); // path inside bucket
  const itemId = searchParams.get("item");

  if (!albumId) return jsonResponse({ error: "Missing album id" }, 400);

  const { album, error: albErr } = await getAlbum(albumId);
  if (albErr || !album) return jsonResponse({ error: "Not found" }, 404);

  const now = new Date();
  const exp = new Date(album.expires_at);
  if (now > exp) return jsonResponse({ error: "Link expired" }, 410);

  // Download ZIP of entire album
  if (all) {
    // Option A: Sign each file individually and let the browser parallel download (simpler, no server memory)
    // Here we'll return the list of signed URLs so the client can fetch `Promise.all`.
    const { data: items, error: listErr } = await supabase.from("album_items").select("*").eq("album_id", albumId);
    if (listErr) return jsonResponse({ error: listErr.message }, 500);

    const out = [];
    for (const it of items) {
      const { data: signed, error: sErr } = await supabase.storage.from("photos").createSignedUrl(it.path, 300);
      if (sErr) return jsonResponse({ error: sErr.message }, 500);
      out.push({ path: it.path.split('/').slice(1).join('/'), url: signed.signedUrl });
    }
    return jsonResponse({ files: out });
  }

  // Single item by ID or path
  let path = filePath;
  if (!path && itemId) {
    const { data: it, error: itErr } = await supabase.from("album_items").select("*").eq("id", itemId).single();
    if (itErr || !it) return jsonResponse({ error: "Item not found" }, 404);
    path = it.path;
  }

  if (!path) {
    // Default: return first photo's URL for preview
    const { data: first, error: firstErr } = await supabase.from("album_items").select("*").eq("album_id", albumId).order("created_at", { ascending: true }).limit(1).single();
    if (firstErr || !first) return jsonResponse({ error: "No items" }, 404);
    const { data: signed, error: sErr } = await supabase.storage.from("photos").createSignedUrl(first.path, 300);
    if (sErr) return jsonResponse({ error: sErr.message }, 500);
    return jsonResponse({ url: signed.signedUrl, preview: true });
  }

  const { data: signed, error: signErr } = await supabase.storage.from("photos").createSignedUrl(path, 300);
  if (signErr) return jsonResponse({ error: signErr.message }, 500);
  return jsonResponse({ url: signed.signedUrl });
};
