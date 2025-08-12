import { supabase } from "./_supabase.mjs";

const SNAPCHAT = process.env.SNAPCHAT_USERNAME || "";

const html = (title, body) => new Response(
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
      .card { max-width: 1064px; margin: 0 auto; background: #151522; border: 1px solid #222235; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
      header { padding: 20px 24px; border-bottom: 1px solid #222235; display: flex; align-items: center; justify-content: space-between; }
      h1 { font-size: 18px; margin: 0; }
      .content { padding: 24px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
      .tile { background: #0f0f18; border: 1px dashed #2c2c44; border-radius: 12px; padding: 8px; display: grid; gap: 8px; }
      .imgwrap { display: grid; place-items: center; overflow: hidden; border-radius: 10px; }
      img { width: 100%; height: 180px; object-fit: cover; border-radius: 10px; transition: filter 250ms ease; }
      .blurred { filter: blur(16px); }
      .muted { color: #a5a5c3; font-size: 14px; }
      .row { display: flex; gap: 8px; flex-wrap: wrap; }
      a.social, a.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #2a2a44; border-radius: 10px; color: #eaeaf0; text-decoration: none; }
      .gate { margin-top: 16px; padding: 16px; background: #10101a; border: 1px solid #2a2a44; border-radius: 12px; }
      button { background: #635bff; color: white; border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 600; cursor: pointer; }
      button[disabled] { opacity: .6; cursor: not-allowed; }
      .footer { padding: 16px 24px; border-top: 1px solid #222235; color: #a5a5c3; font-size: 12px; }
      .hidden { display: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <header>
        <h1>Album Download</h1>
        <span class="muted">Follow to unlock</span>
      </header>
      <div class="content">
        <div id="grid" class="grid"></div>
        <div class="gate">
          <p class="muted">Before downloading, please follow Anthony on one of these:</p>
          <div class="row" id="socials">
            <a class="social" href="https://www.instagram.com/AnthonyMcHugh__/" target="_blank" rel="noopener">Instagram</a>
            <a class="social" href="https://www.tiktok.com/@anthonyrmchugh" target="_blank" rel="noopener">TikTok</a>
          </div>
          <p class="muted">Once done, click the button below.</p>
          <button id="unlockBtn">I followed — unlock downloads</button>
          <p id="expired" class="muted hidden"></p>
          <div id="dlAllWrap" class="hidden">
            <p class="muted">Download individually below or grab everything at once:</p>
            <a id="dlAll" class="btn" href="#">Download all</a>
          </div>
        </div>
      </div>
      <div class="footer">
        These photos are provided for personal use by the recipient. <strong>The photos and link will expire 30 days after upload.</strong>
      </div>
    </div>
    <script>
      // Add Snapchat dynamically
      (function addSnap() {
        const snap = "${SNAPCHAT}".trim();
        if (snap) {
          const wrap = document.getElementById('socials');
          const a = document.createElement('a');
          a.className = 'social';
          a.target = '_blank'; a.rel = 'noopener';
          a.textContent = 'Snapchat';
          a.href = 'https://www.snapchat.com/add/' + encodeURIComponent(snap);
          wrap.appendChild(a);
        }
      })();

      const u = new URL(location.href);
      let albumId = u.searchParams.get('id');
      if (!albumId) {
        const parts = location.pathname.split('/').filter(Boolean);
        const last = parts.pop();
        if (last && last !== 'share') albumId = last;
      }

      const grid = document.getElementById('grid');

      async function fetchPreview() {
        const r = await fetch('/.netlify/functions/download?album=' + encodeURIComponent(albumId));
        return r.json();
      }

      async function listAllSigned() {
        const r = await fetch('/.netlify/functions/download?album=' + encodeURIComponent(albumId) + '&all=1');
        return r.json();
      }

      function tile(path, url, unlocked) {
        const div = document.createElement('div');
        div.className = 'tile';
        const imgWrap = document.createElement('div');
        imgWrap.className = 'imgwrap';
        const img = document.createElement('img');
        img.src = url;
        if (!unlocked) img.classList.add('blurred');
        imgWrap.appendChild(img);
        div.appendChild(imgWrap);

        const a = document.createElement('a');
        a.className = 'btn';
        a.textContent = unlocked ? 'Download' : 'Locked';
        a.href = unlocked ? url : '#';
        if (!unlocked) a.addEventListener('click', (e) => e.preventDefault());
        div.appendChild(a);
        return div;
      }

      async function init() {
        if (!albumId) return;
        // Start with just the first item as preview (blurred)
        const first = await fetchPreview();
        if (first && first.url) {
          grid.appendChild(tile('preview', first.url, false));
        }
      }

      document.getElementById('unlockBtn').addEventListener('click', async () => {
        const all = await listAllSigned();
        if (all.files && Array.isArray(all.files)) {
          grid.innerHTML = '';
          for (const f of all.files) {
            grid.appendChild(tile(f.path, f.url, true));
          }
          document.getElementById('dlAllWrap').classList.remove('hidden');

          // Provide a "download all" via parallel fetches in the browser (simplest)
          document.getElementById('dlAll').addEventListener('click', (e) => {
            e.preventDefault();
            for (const f of all.files) {
              const a = document.createElement('a');
              a.href = f.url;
              a.download = f.path.split('/').pop();
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          });
        } else if (all.error) {
          document.getElementById('expired').textContent = all.error;
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
  // adjust title if album exists
  let title = "Album Download";
  if (id && id !== "share") {
    const { data: row } = await supabase.from("albums").select("*").eq("id", id).maybeSingle();
    title = row ? "Album Download" : "Link not found";
  }
  return html(title);
};
