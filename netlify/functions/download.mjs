import { supabase, jsonResponse } from "./_supabase.mjs";
export const config = { path: "/.netlify/functions/download" };
export default async (request)=>{
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if(!id) return jsonResponse({error:"Missing id"},400);
  const { data: row, error } = await supabase.from("photos").select("*").eq("id", id).single();
  if(error || !row) return jsonResponse({error:"Not found"},404);
  if(new Date() > new Date(row.expires_at)) return jsonResponse({error:"Link expired"},410);
  const { data: signed, error: sErr } = await supabase.storage.from("photos").createSignedUrl(row.path, 300);
  if(sErr) return jsonResponse({error:sErr.message},500);
  await supabase.from("photos").update({ download_count: (row.download_count || 0) + 1 }).eq("id", id);
  return jsonResponse({ url: signed.signedUrl });
}
