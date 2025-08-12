import { supabase, jsonResponse } from "./_supabase.mjs";

export const config = { path: "/.netlify/functions/upload", maxDuration: 26 };

export default async (request) => {
  try {
    if (request.method === "GET") {
      // Health check endpoint so admin page can confirm JSON responses
      return jsonResponse({ ok: true, method: "GET", message: "Upload function alive" });
    }

    const token = request.headers.get("x-admin-token");
    if (!token || token !== process.env.ADMIN_UPLOAD_TOKEN) {
      return jsonResponse({ error: "Unauthorized: missing or invalid ADMIN_UPLOAD_TOKEN" }, 401);
    }

    const ctype = request.headers.get("content-type") || "";
    if (!ctype.includes("multipart/form-data")) {
      return jsonResponse({ error: "Use multipart/form-data" }, 400);
    }
    const form = await request.formData();
    let files = form.getAll("files").filter(f => typeof f !== "string");
    const single = form.get("file");
    if (single && typeof single !== "string") files.push(single);
    if (!files.length) return jsonResponse({ error: "No files found in 'files' or 'file' fields" }, 400);

    const albumId = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    const { error: albumErr } = await supabase.from("albums").insert({ id: albumId, expires_at });
    if (albumErr) return jsonResponse({ error: albumErr.message, stage: "create-album" }, 500);

    let count = 0;
    for (const f of files) {
      const name = f.name || `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${albumId}/${name}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, f, { contentType: f.type || "application/octet-stream" });
      if (upErr) return jsonResponse({ error: upErr.message, stage: "upload", file: name }, 500);
      const { error: itemErr } = await supabase.from("album_items").insert({ album_id: albumId, path });
      if (itemErr) return jsonResponse({ error: itemErr.message, stage: "insert-item", file: name }, 500);
      count++;
    }

    const origin = new URL(request.url).origin;
    return jsonResponse({ albumId, count, shareUrl: `${origin}/share/${albumId}`, fallbackUrl: `${origin}/.netlify/functions/share?id=${albumId}` });
  } catch (e) {
    return jsonResponse({ error: e.message || "Unexpected error", stage: "exception" }, 500);
  }
};
