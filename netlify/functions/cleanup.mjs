import { supabase, json } from "./_supabase.mjs";

export default async () => {
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase.from("photos").select("*").lte("expires_at", nowIso).limit(1000);
  if (error) return json({ error: error.message }, 500);

  let deleted = 0;
  for (const r of rows || []) {
    // remove file
    if (r.path) {
      await supabase.storage.from("photos").remove([r.path]);
    }
    await supabase.from("photos").delete().eq("id", r.id);
    deleted++;
  }
  return json({ deleted });
};
