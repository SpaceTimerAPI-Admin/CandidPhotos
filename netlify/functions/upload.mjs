import { supabase, jsonResponse } from "./_supabase.mjs";
export const config = { path: "/.netlify/functions/upload" };
export default async (request)=>{
  const token = request.headers.get("x-admin-token");
  if(!token || token !== process.env.ADMIN_UPLOAD_TOKEN) return jsonResponse({error:"Unauthorized"},401);
  const ct = request.headers.get("content-type")||"";
  if(!ct.includes("multipart/form-data")) return jsonResponse({error:"Use multipart/form-data"},400);
  const form = await request.formData();
  const file = form.get("file") || (form.getAll("files")[0]);
  if(!file || typeof file === "string") return jsonResponse({error:"No file"},400);
  const id = crypto.randomUUID();
  const name = file.name || `photo-${Date.now()}`;
  const path = `${id}/${name}`;
  const { error: upErr } = await supabase.storage.from("photos").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if(upErr) return jsonResponse({error:upErr.message},500);
  const expires_at = new Date(Date.now()+30*24*60*60*1000).toISOString();
  const { error: dbErr } = await supabase.from("photos").insert({ id, path, expires_at });
  if(dbErr) return jsonResponse({error:dbErr.message},500);
  const origin = new URL(request.url).origin;
  return jsonResponse({ id, shareUrl: `${origin}/share/${id}`, fallbackUrl: `${origin}/.netlify/functions/share?id=${id}` });
}
