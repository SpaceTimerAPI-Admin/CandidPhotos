import { supabase, jsonResponse } from "./_supabase.mjs";

export default async (request) => {
  // Simple admin auth using a static token header
  const adminToken = process.env.ADMIN_UPLOAD_TOKEN;
  if (!adminToken || request.headers.get("x-admin-token") !== adminToken) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return jsonResponse({ error: "No file uploaded" }, 400);
      }
      const fileName = form.get("filename") || file.name || `photo-${Date.now()}`;
      const id = crypto.randomUUID();
      const path = `${id}/${fileName}`;

      // Upload to storage bucket "photos"
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });

      if (uploadErr) return jsonResponse({ error: uploadErr.message }, 500);

      // Create DB record
      const expires_at = new Date(Date.now() + 30*24*60*60*1000).toISOString();
      const { data: row, error: dbErr } = await supabase
        .from("photos")
        .insert({ id, path, expires_at })
        .select()
        .single();

      if (dbErr) return jsonResponse({ error: dbErr.message }, 500);

      const shareUrl = `${new URL(request.url).origin}/share/${id}`;
      return jsonResponse({ id, shareUrl });
    } else {
      return jsonResponse({ error: "Use multipart/form-data with 'file' field" }, 400);
    }
  } catch (e) {
    return jsonResponse({ error: e.message || "Upload failed" }, 500);
  }
};
