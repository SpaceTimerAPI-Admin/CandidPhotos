import { supabase, jsonResponse } from "./_supabase.mjs";

export const config = { path: "/.netlify/functions/cleanup" };

export default async () => {
  const nowIso = new Date().toISOString();
  const { data: albums, error } = await supabase.from("albums").select("*").lte("expires_at", nowIso).limit(1000);
  if (error) return jsonResponse({ error: error.message }, 500);

  let deletedAlbums = 0;
  for (const a of albums || []) {
    // list album items
    const { data: items } = await supabase.from("album_items").select("*").eq("album_id", a.id);
    // remove files
    const paths = (items || []).map(i => i.path);
    if (paths.length) {
      await supabase.storage.from("photos").remove(paths);
    }
    // delete item rows then album
    await supabase.from("album_items").delete().eq("album_id", a.id);
    await supabase.from("albums").delete().eq("id", a.id);
    deletedAlbums++;
  }
  return jsonResponse({ deletedAlbums });
};
