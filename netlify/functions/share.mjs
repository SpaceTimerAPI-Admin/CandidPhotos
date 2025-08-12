import { supabase } from "./_supabase.mjs";

const SNAPCHAT = process.env.SNAPCHAT_USERNAME || ""; // set in Netlify env

const html = (title) => new Response(
  `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      :root { color-scheme: dark; }
      body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; padding: 24px; background: #0b0b10; color: #eaeaf0; }
      .card { max-width: 720px; margin: 0 auto; background: #151522; border: 1px solid #222235; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
      header { padding: 20px 24px; border-bottom: 1px solid #222235; display: flex; align-items: center; justify-content: space-between; }
      h1 { font-size: 18px; margin: 0; }
      .content { padding: 24px; }
      .preview { background: #0f0f18; border: 1px dashed #2c2c44; border-radius: 12px; padding: 12px; display: grid; place-items: center; min-height: 220px; }
      img { max-width: 100%; border-radius: 8px; transition: filter 250ms ease; }
      .blurred { filter: blur(16px); }
      .gate { margin-top: 16px; padding: 16px; background: #10101a; border: 1px solid #2a2a44; border-radius: 12px; }
      button { background: #635bff; color: white; border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 600; cursor: pointer; }
      button[disabled] { opacity: .6; cursor: not-allowed; }
      a.social { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #2a2a44; border-radius: 10px; color: #eaeaf0; text-decoration: none; }
      .row { display: flex; gap: 8px; flex-wrap: wrap; }
      .muted { color: #a5a5c3; font-size: 14px; }
      .footer { padding: 16px 24px; border-top: 1px solid #222235; color: #a5a5c3; font-size: 12px; }
      .hidden { display: none; }
      .err { color: #ffb3b3; }
    </style>
  </head>
  <body>
    <div class="card">
      <header>
        <h1>Photo Download</h1>
        <span class="muted">Follow to unlock</span>
      </header>
      <div class="content">
        <p id="msg" class="err hidden"></p>
        <div class="preview">
          <img id="thumb" class="blurred" alt="Photo preview (blurred until unlocked)"/>
        </div>
        <div class="gate">
          <p class="muted">Before downloading, please follow Anthony on one of these:</p>
          <div class="row" id="socials">
            <a class="social" href="https://www.instagram.com/AnthonyMcHugh__/" target="_blank" rel="noopener">Instagram</a>
            <a class="social" href="https://www.tiktok.com/@anthonyrmchugh" target="_blank" rel="noopener">TikTok</a>
          </div>
          <p class="muted">Once done, click the button below.</p>
          <button id="unlockBtn">I followed — unlock download</button>
          <p id="expired" class="muted hidden"></p>
          <div id="download" class="hidden">
            <p>Thanks! Your download is ready:</p>
            <p><a id="dl" class="social" href="#" target="_blank" rel="noopener">Download photo</a></p>
          </div>
        </div>
      </div>
      <div class="footer">
        This photo is provided for personal use by the recipient. <strong>The photo and link will expire 30 days after upload.</strong>
      </div>
    </div>
    <script>
      // Add Snapchat button if env var was set on the server
      (function addSnap() {
        const snap = "${SNAPCHAT}".trim();
        if (snap) {
          const wrap = document.getElementById('socials');
          const a = document.createElement('a');
          a.className = 'social';
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'Snapchat';
          a.href = 'https://www.snapchat.com/add/' + encodeURIComponent(snap);
          wrap.appendChild(a);
        }
      })();

      const u = new URL(location.href);
      let id = u.searchParams.get('id');
      if (!id) {
        const parts = location.pathname.split('/').filter(Boolean);
        const last = parts.pop();
        if (last && last !== 'share') id = last;
      }

      const img = document.getElementById('thumb');

      const showErr = (t) => { const m = document.getElementById('msg'); m.textContent = t; m.classList.remove('hidden'); };

      async function fetchSigned() {
        const r = await fetch('/.netlify/functions/download?id=' + encodeURIComponent(id));
        return r.json();
      }

      async function init() {
        if (!id) {
          showErr('Missing ID in URL. Make sure your link looks like /share/<id> or /share?id=<id>.');
          document.getElementById('unlockBtn').disabled = true;
          return;
        }
        const j = await fetchSigned();
        if (j.error) {
          document.getElementById('expired').textContent = j.error;
          document.getElementById('expired').classList.remove('hidden');
          document.getElementById('unlockBtn').disabled = true;
        } else {
          img.src = j.url; // still blurred
        }
      }

      document.getElementById('unlockBtn').addEventListener('click', async () => {
        const j = await fetchSigned();
        if (j.url) {
          document.getElementById('download').classList.remove('hidden');
          document.getElementById('dl').href = j.url;
          // remove blur on successful unlock
          img.classList.remove('blurred');
        } else {
          document.getElementById('expired').textContent = j.error || 'Unable to unlock right now.';
          document.getElementById('expired').classList.remove('hidden');
        }
      });

      init();
    </script>
  </body>
  </html>`,
  { headers: { "content-type": "text/html; charset=utf-8" } }
);

export default async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop();
  // Optional: set title based on existence
  let title = "Photo Download";
  if (id && id !== "share") {
    const { data: row } = await supabase.from("photos").select("*").eq("id", id).maybeSingle();
    title = row ? "Photo Download" : "Link not found";
  }
  return html(title);
};
