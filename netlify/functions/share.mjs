import { supabase } from "./_supabase.mjs";

const html = (title) => new Response(
  `<!doctype html>
  <html lang="en">
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title></head>
  <body>
    <p id="expired" style="color: red;"></p>
    <img id="thumb" style="max-width: 100%;"/>
    <div>
      <a href="https://www.instagram.com/AnthonyMcHugh__/" target="_blank">Instagram</a>
      <a href="https://www.tiktok.com/@anthonyrmchugh" target="_blank">TikTok</a>
      <a href="https://www.threads.net/@anthonyrmchugh__" target="_blank">Threads</a>
    </div>
    <button id="unlockBtn">I followed — unlock download</button>
    <div id="download" style="display:none;">
      <p>Your download is ready:</p>
      <a id="dl" href="#" target="_blank">Download photo</a>
    </div>
    <script>
      const url = new URL(location.href);
      const id = url.searchParams.get("id");
      if (!id) {
        document.getElementById('expired').textContent = "Missing ID in URL";
        document.getElementById('unlockBtn').disabled = true;
      } else {
        fetch('/.netlify/functions/download?id=' + encodeURIComponent(id))
          .then(r => r.json())
          .then(j => {
            if (j.error) {
              document.getElementById('expired').textContent = j.error;
              document.getElementById('unlockBtn').disabled = true;
            } else {
              document.getElementById('thumb').src = j.url;
            }
          });
        document.getElementById('unlockBtn').addEventListener('click', () => {
          fetch('/.netlify/functions/download?id=' + encodeURIComponent(id))
            .then(r => r.json())
            .then(j => {
              if (j.url) {
                document.getElementById('download').style.display = 'block';
                document.getElementById('dl').href = j.url;
              } else {
                document.getElementById('expired').textContent = j.error || 'Unable to unlock right now.';
              }
            });
        });
      }
    </script>
  </body>
  </html>`,
  { headers: { "content-type": "text/html; charset=utf-8" } }
);

export default async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return html("Missing ID");
  const { data: row } = await supabase.from("photos").select("*").eq("id", id).maybeSingle();
  return html(row ? "Photo Download" : "Link not found");
};
