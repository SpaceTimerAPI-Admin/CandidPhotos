import { supabase, jsonResponse } from "./_supabase.mjs";

export const config = { path: "/.netlify/functions/upload" };

export default async (request) => {
  // Admin token gate
  const token = request.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_UPLOAD_TOKEN) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const ctype = request.headers.get("content-type") || "";
  if (!ctype.includes("multipart/form-data")) {
    return jsonResponse({ error: "Use multipart/form-data" }, 400);
  }
  const form = await request.formData();
  const files = form.getAll("files");
  if (!files || files.length === 0) {
    // support single 'file' too
    const single = form.get("file");
    if (single && typeof single !== "string") {
      files.push(single);
    }
  }
  if (files.length === 0) {
    return jsonResponse({ error: "No files uploaded" }, 400);
  }

  // Create album row with 30 day expiry
  const albumId = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 30*24*60*60*1000).toISOString();

  const { error: albumErr } = await supabase.from("albums").insert({ id: albumId, expires_at });
  if (albumErr) return jsonResponse({ error: albumErr.message }, 500);

  // Upload each file to Storage and create album_items rows
  const items = [];
  for (const f of files) {
    if (!f || typeof f === "string") continue;
    const name = f.name || `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${albumId}/${name}`;
    const { error: upErr } = await supabase.storage.from("photos").upload(path, f, { contentType: f.type || "application/octet-stream", upsert: false });
    if (upErr) return jsonResponse({ error: upErr.message, hint: "upload" }, 500);
    const { data: item, error: itemErr } = await supabase.from("album_items").insert({ album_id: albumId, path }).select().single();
    if (itemErr) return jsonResponse({ error: itemErr.message, hint: "db" }, 500);
    items.push(item);
  }

  const origin = new URL(request.url).origin;
  const shareUrl = `${origin}/share/${albumId}`;
  const fallbackUrl = `${origin}/.netlify/functions/share?id=${albumId}`;

  return jsonResponse({ albumId, shareUrl, fallbackUrl, count: items.length });
};
