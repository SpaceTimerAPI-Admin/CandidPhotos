export const config = { path: "/.netlify/functions/ping" };

export default async () => {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { "content-type": "application/json" }
  });
};
