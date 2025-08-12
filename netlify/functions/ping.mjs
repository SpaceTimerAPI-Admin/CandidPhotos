export const config = { path: "/.netlify/functions/ping" };

export default async (request) => {
  return new Response(JSON.stringify({
    ok: true,
    method: request.method,
    url: request.url,
    env: {
      HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
      HAS_SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
      HAS_ADMIN_UPLOAD_TOKEN: !!process.env.ADMIN_UPLOAD_TOKEN
    }
  }), { status: 200, headers: { "content-type": "application/json" }});
};
