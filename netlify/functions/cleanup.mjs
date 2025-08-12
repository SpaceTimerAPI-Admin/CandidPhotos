import { supabase, jsonResponse } from "./_supabase.mjs";
export const config = { path: "/.netlify/functions/cleanup" };
export default async ()=>{
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase.from("photos").select("*").lte("expires_at", nowIso).limit(1000);
  if(error) return jsonResponse({error:error.message},500);
  let deleted=0;
  for(const row of rows||[]){
    await supabase.storage.from("photos").remove([row.path]);
    await supabase.from("photos").delete().eq("id", row.id);
    deleted++;
  }
  return jsonResponse({ deleted });
}
