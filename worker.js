no',monospace;\n    font-size:10px;\n    color:var(--muted);\n    border:1px solid var(--line);\n    padding:3px 7px;\n    border-radius:20px;\n    text-decoration:none;\n    max-width:200px;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    white-space:nowrap;\n  }\n  .source-chip:hover{color:var(--teal); border-color:var(--teal);}\n\n  .empty{\n    margin:auto;\n    text-align:center;\n    color:var(--muted);\n    padding:20px;\n  }\n  .empty h1{\n    font-family:'Fraunces',serif;\n    font-weight:600;\n    color:var(--ink);\n    font-size:22px;\n    margin:0 0 8px;\n  }\n  .empty p{font-size:13.5px; line-height:1.5; margin:0 auto; max-width:340px;}\n  .chips{display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:16px;}\n  .chip-btn{\n    font-size:12.5px;\n    background:var(--panel-2);\n    border:1px solid var(--line);\n    color:var(--ink);\n    padding:8px 12px;\n    border-radius:20px;\n    cursor:pointer;\n  }\n  .chip-btn:active{border-color:var(--brass);}\n\n  .typing{display:flex; gap:4px; padding:4px 0;}\n  .typing span{width:5px; height:5px; border-radius:50%; background:var(--muted); animation:blink 1.2s infinite ease-in-out;}\n  .typing span:nth-child(2){animation-delay:0.2s;}\n  .typing span:nth-child(3){animation-delay:0.4s;}\n  @keyframes blink{0%,80%,100%{opacity:0.25;} 40%{opacity:1;}}\n  @media (prefers-reduced-motion: reduce){ .typing span{animation:none; opacity:0.6;} }\n\n  form{\n    border-top:1px solid var(--line);\n    background:var(--panel);\n    padding:10px 12px calc(10px + env(safe-area-inset-bottom));\n    display:flex;\n    gap:8px;\n    max-width:720px;\n    width:100%;\n    margin:0 auto;\n  }\n  textarea{\n    flex:1;\n    resize:none;\n    background:var(--panel-2);\n    border:1px solid var(--line);\n    color:var(--ink);\n    border-radius:10px;\n    padding:11px 12px;\n    font-family:'Inter',sans-serif;\n    font-size:15px;\n    max-height:120px;\n  }\n  textarea:focus{outline:2px solid var(--brass); outline-offset:1px;}\n  button.send{\n    background:var(--brass);\n    color:#1a1206;\n    border:none;\n    border-radius:10px;\n    padding:0 18px;\n    font-family:'JetBrains Mono',monospace;\n    font-weight:500;\n    font-size:12px;\n    letter-spacing:0.05em;\n    cursor:pointer;\n  }\n  button.send:disabled{opacity:0.5;}\n  ::-webkit-scrollbar{width:6px;}\n  ::-webkit-scrollbar-thumb{background:var(--line); border-radius:6px;}\n</style>\n</head>\n<body>\n  <div class=\"board\">\n    <div class=\"board-top\">\n      <div class=\"brand\">NORTH <span>HIMALAYAN</span></div>\n      <div class=\"status\" id=\"status\">KB \u00b7 loading\u2026</div>\n    </div>\n    <div class=\"route\">\n      <span>LADAKH</span><span>SPITI</span><span>KASHMIR</span><span>NORTHEAST</span><span>GOA</span>\n    </div>\n  </div>\n\n  <main id=\"main\">\n    <div class=\"empty\" id=\"empty\">\n      <h1>Where to, traveler?</h1>\n      <p>Ask about routes, permits, hostels, treks, or let me sketch a full itinerary \u2014 pulled live from northhimalayan.com.</p>\n      <div class=\"chips\">\n        <button class=\"chip-btn\" data-q=\"Plan a 7-day Ladakh trip in September\">7-day Ladakh trip</button>\n        <button class=\"chip-btn\" data-q=\"Best hostels in North Goa for backpackers\">North Goa hostels</button>\n        <button class=\"chip-btn\" data-q=\"What permits do I need for Spiti Valley?\">Spiti permits</button>\n      </div>\n    </div>\n  </main>\n\n  <form id=\"form\">\n    <textarea id=\"input\" rows=\"1\" placeholder=\"Ask about your trip\u2026\" required></textarea>\n    <button class=\"send\" type=\"submit\" id=\"sendBtn\">SEND</b// North Himalayan AI Travel Planner — Cloudflare Worker
// Routes:
//   GET  /                 -> static chat UI (public/index.html)
//   GET  /admin            -> static admin/reindex UI (public/admin.html)
//   POST /api/chat         -> { message, history } -> { reply, sources }
//   POST /api/reindex      -> (requires x-admin-key header) rebuilds the knowledge base from northhimalayan.com
//   GET  /api/status       -> knowledge base size + last indexed time
// Scheduled: reindexes the knowledge base daily via cron trigger.

const INDEX_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n<title>North Himalayan \u2014 AI Trip Planner</title>\n<link rel=\"icon\" href=\"data:,\">\n<link href=\"https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap\" rel=\"stylesheet\">\n<style>\n  :root{\n    --bg:#10151c;\n    --panel:#171f29;\n    --panel-2:#1d2733;\n    --line:#2a3441;\n    --ink:#e9e4d8;\n    --muted:#8b93a0;\n    --brass:#c68b3d;\n    --teal:#4fa8a0;\n  }\n  *{box-sizing:border-box;}\n  html,body{height:100%;}\n  body{\n    margin:0;\n    background:\n      radial-gradient(1200px 600px at 20% -10%, rgba(198,139,61,0.08), transparent 60%),\n      radial-gradient(1000px 500px at 100% 0%, rgba(79,168,160,0.07), transparent 55%),\n      var(--bg);\n    color:var(--ink);\n    font-family:'Inter',system-ui,sans-serif;\n    display:flex;\n    flex-direction:column;\n  }\n  .board{\n    border-bottom:1px solid var(--line);\n    background:var(--panel);\n    padding:14px 16px 12px;\n  }\n  .board-top{display:flex; align-items:baseline; justify-content:space-between; gap:8px;}\n  .brand{\n    font-family:'Fraunces',serif;\n    font-weight:600;\n    font-size:20px;\n    letter-spacing:0.01em;\n  }\n  .brand span{color:var(--brass);}\n  .status{\n    font-family:'JetBrains Mono',monospace;\n    font-size:10.5px;\n    color:var(--muted);\n    text-align:right;\n    line-height:1.4;\n  }\n  .route{\n    margin-top:10px;\n    font-family:'JetBrains Mono',monospace;\n    font-size:11.5px;\n    letter-spacing:0.06em;\n    color:var(--teal);\n    display:flex;\n    gap:10px;\n    overflow-x:auto;\n    padding-bottom:2px;\n  }\n  .route span{white-space:nowrap;}\n  .route span:not(:last-child)::after{content:\" \u2192\"; color:var(--line);}\n\n  main{\n    flex:1;\n    overflow-y:auto;\n    padding:16px;\n    display:flex;\n    flex-direction:column;\n    gap:14px;\n    max-width:720px;\n    width:100%;\n    margin:0 auto;\n  }\n  .msg{max-width:88%; display:flex; flex-direction:column; gap:6px;}\n  .msg.user{align-self:flex-end; align-items:flex-end;}\n  .msg.assistant{align-self:flex-start; align-items:flex-start;}\n  .bubble{\n    padding:12px 14px;\n    border-radius:3px;\n    line-height:1.5;\n    font-size:14.5px;\n    white-space:pre-wrap;\n  }\n  .msg.user .bubble{\n    background:var(--brass);\n    color:#1a1206;\n    border-radius:10px 10px 2px 10px;\n  }\n  .msg.assistant .bubble{\n    background:var(--panel);\n    border:1px solid var(--line);\n    border-radius:10px 10px 10px 2px;\n    position:relative;\n  }\n  .msg.assistant .bubble::before{\n    content:\"NH \u00b7 CONFIRMED\";\n    display:block;\n    font-family:'JetBrains Mono',monospace;\n    font-size:9px;\n    letter-spacing:0.14em;\n    color:var(--teal);\n    opacity:0.8;\n    margin-bottom:6px;\n  }\n  .sources{\n    display:flex; flex-wrap:wrap; gap:6px; margin-top:2px;\n  }\n  .source-chip{\n    font-family:'JetBrains Mono',monospace;\n    font-size:10px;\n    color:var(--muted);\n    border:1px solid var(--line);\n    padding:3px 7px;\n    border-radius:20px;\n    text-decoration:none;\n    max-width:200px;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    white-space:nowrap;\n  }\n  .source-chip:hover{color:var(--teal); border-color:var(--teal);}\n\n  .empty{\n    margin:auto;\n    text-align:center;\n    color:var(--muted);\n    padding:20px;\n  }\n  .empty h1{\n    font-family:'Fraunces',serif;\n    font-weight:600;\n    color:var(--ink);\n    font-size:22px;\n    margin:0 0 8px;\n  }\n  .empty p{font-size:13.5px; line-height:1.5; margin:0 auto; max-width:340px;}\n  .chips{display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:16px;}\n  .chip-btn{\n    font-size:12.5px;\n    background:var(--panel-2);\n    border:1px solid var(--line);\n    color:var(--ink);\n    padding:8px 12px;\n    border-radius:20px;\n    cursor:pointer;\n  }\n  .chip-btn:active{border-color:var(--brass);}\n\n  .typing{display:flex; gap:4px; padding:4px 0;}\n  .typing span{width:5px; height:5px; border-radius:50%; background:var(--muted); animation:blink 1.2s infinite ease-in-out;}\n  .typing span:nth-child(2){animation-delay:0.2s;}\n  .typing span:nth-child(3){animation-delay:0.4s;}\n  @keyframes blink{0%,80%,100%{opacity:0.25;} 40%{opacity:1;}}\n  @media (prefers-reduced-motion: reduce){ .typing span{animation:none; opacity:0.6;} }\n\n  form{\n    border-top:1px solid var(--line);\n    background:var(--panel);\n    padding:10px 12px calc(10px + env(safe-area-inset-bottom));\n    display:flex;\n    gap:8px;\n    max-width:720px;\n    width:100%;\n    margin:0 auto;\n  }\n  textarea{\n    flex:1;\n    resize:none;\n    background:var(--panel-2);\n    border:1px solid var(--line);\n    color:var(--ink);\n    border-radius:10px;\n    padding:11px 12px;\n    font-family:'Inter',sans-serif;\n    font-size:15px;\n    max-height:120px;\n  }\n  textarea:focus{outline:2px solid var(--brass); outline-offset:1px;}\n  button.send{\n    background:var(--brass);\n    color:#1a1206;\n    border:none;\n    border-radius:10px;\n    padding:0 18px;\n    font-family:'JetBrains Mono',monospace;\n    font-weight:500;\n    font-size:12px;\n    letter-spacing:0.05em;\n    cursor:pointer;\n  }\n  button.send:disabled{opacity:0.5;}\n  ::-webkit-scrollbar{width:6px;}\n  ::-webkit-scrollbar-thumb{background:var(--line); border-radius:6px;}\n</style>\n</head>\n<body>\n  <div class=\"board\">\n    <div class=\"board-top\">\n      <div class=\"brand\">NORTH <span>HIMALAYAN</span></div>\n      <div class=\"status\" id=\"status\">KB \u00b7 loading\u2026</div>\n    </div>\n    <div class=\"route\">\n      <span>LADAKH</span><span>SPITI</span><span>KASHMIR</span><span>NORTHEAST</span><span>GOA</span>\n    </div>\n  </div>\n\n  <main id=\"main\">\n    <div class=\"empty\" id=\"empty\">\n      <h1>Where to, traveler?</h1>\n      <p>Ask about routes, permits, hostels, treks, or let me sketch a full itinerary \u2014 pulled live from northhimalayan.com.</p>\n      <div class=\"chips\">\n        <button class=\"chip-btn\" data-q=\"Plan a 7-day Ladakh trip in September\">7-day Ladakh trip</button>\n        <button class=\"chip-btn\" data-q=\"Best hostels in North Goa for backpackers\">North Goa hostels</button>\n        <button class=\"chip-btn\" data-q=\"What permits do I need for Spiti Valley?\">Spiti permits</button>\n      </div>\n    </div>\n  </main>\n\n  <form id=\"form\">\n    <textarea id=\"input\" rows=\"1\" placeholder=\"Ask about your trip\u2026\" required></textarea>\n    <button class=\"send\" type=\"submit\" id=\"sendBtn\">SEND</button>\n  </form>\n\n<script>\n  const main = document.getElementById('main');\n  const empty = document.getElementById('empty');\n  const form = document.getElementById('form');\n  const input = document.getElementById('input');\n  const sendBtn = document.getElementById('sendBtn');\n  const statusEl = document.getElementById('status');\n  let history = [];\n\n  fetch('/api/status').then(r=>r.json()).then(s=>{\n    if(s.updatedAt){\n      const d = new Date(s.updatedAt);\n      statusEl.textContent = `KB \u00b7 ${s.count} chunks \u00b7 ${d.toLocaleDateString()}`;\n    } else {\n      statusEl.textContent = 'KB \u00b7 not indexed yet';\n    }\n  }).catch(()=>{ statusEl.textContent = 'KB \u00b7 status unavailable'; });\n\n  document.querySelectorAll('.chip-btn').forEach(b=>{\n    b.addEventListener('click', ()=>{ input.value = b.dataset.q; form.dispatchEvent(new Event('submit')); });\n  });\n\n  input.addEventListener('input', ()=>{\n    input.style.height='auto';\n    input.style.height = Math.min(input.scrollHeight,120)+'px';\n  });\n\n  function addMessage(role, text, sources){\n    if(empty) empty.remove();\n    const wrap = document.createElement('div');\n    wrap.className = 'msg ' + role;\n    const bubble = document.createElement('div');\n    bubble.className = 'bubble';\n    bubble.textContent = text;\n    wrap.appendChild(bubble);\n    if(sources && sources.length){\n      const sWrap = document.createElement('div');\n      sWrap.className = 'sources';\n      sources.forEach(s=>{\n        const a = document.createElement('a');\n        a.href = s.url; a.target = '_blank'; a.rel='noopener';\n        a.className = 'source-chip';\n        a.textContent = s.title || s.url;\n        sWrap.appendChild(a);\n      });\n      wrap.appendChild(sWrap);\n    }\n    main.appendChild(wrap);\n    main.scrollTop = main.scrollHeight;\n    return wrap;\n  }\n\n  function addTyping(){\n    if(empty) empty.remove();\n    const wrap = document.createElement('div');\n    wrap.className = 'msg assistant';\n    wrap.id = 'typing';\n    const bubble = document.createElement('div');\n    bubble.className = 'bubble';\n    bubble.innerHTML = '<div class=\"typing\"><span></span><span></span><span></span></div>';\n    wrap.appendChild(bubble);\n    main.appendChild(wrap);\n    main.scrollTop = main.scrollHeight;\n  }\n\n  form.addEventListener('submit', async (e)=>{\n    e.preventDefault();\n    const text = input.value.trim();\n    if(!text) return;\n    addMessage('user', text);\n    history.push({role:'user', content:text});\n    input.value=''; input.style.height='auto';\n    sendBtn.disabled = true;\n    addTyping();\n    try{\n      const res = await fetch('/api/chat', {\n        method:'POST',\n        headers:{'content-type':'application/json'},\n        body: JSON.stringify({ message: text, history })\n      });\n      const data = await res.json();\n      document.getElementById('typing')?.remove();\n      if(data.error){\n        addMessage('assistant', 'Error: ' + data.error + (data.detail ? ('\\n\\nDetail: ' + data.detail) : ''));\n      } else {\n        addMessage('assistant', data.reply, data.sources);\n        history.push({role:'assistant', content:data.reply});\n      }\n    } catch(err){\n      document.getElementById('typing')?.remove();\n      addMessage('assistant', 'Network error \u2014 please try again.');\n    }\n    sendBtn.disabled = false;\n  });\n</script>\n</body>\n</html>\n";

const ADMIN_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n<title>NH Planner \u2014 Admin</title>\n<style>\n  body{background:#10151c; color:#e9e4d8; font-family:system-ui,sans-serif; max-width:480px; margin:40px auto; padding:0 16px;}\n  h1{font-size:18px;}\n  input, button{width:100%; padding:11px; margin-top:8px; border-radius:8px; border:1px solid #2a3441; font-size:15px; box-sizing:border-box;}\n  input{background:#1d2733; color:#e9e4d8;}\n  button{background:#c68b3d; color:#1a1206; border:none; font-weight:600; cursor:pointer; margin-top:16px;}\n  pre{background:#171f29; padding:12px; border-radius:8px; white-space:pre-wrap; font-size:12.5px; margin-top:16px; border:1px solid #2a3441;}\n  .muted{color:#8b93a0; font-size:13px;}\n</style>\n</head>\n<body>\n  <h1>Knowledge base admin</h1>\n  <p class=\"muted\" id=\"statusLine\">Loading status\u2026</p>\n  <input id=\"key\" type=\"password\" placeholder=\"Admin key\" autocomplete=\"off\" />\n  <button id=\"go\">Reindex from northhimalayan.com</button>\n  <pre id=\"out\"></pre>\n\n<script>\n  const out = document.getElementById('out');\n  const statusLine = document.getElementById('statusLine');\n\n  function loadStatus(){\n    fetch('/api/status').then(r=>r.json()).then(s=>{\n      statusLine.textContent = s.updatedAt\n        ? `${s.count} chunks indexed \u00b7 last updated ${new Date(s.updatedAt).toLocaleString()}`\n        : 'Not indexed yet.';\n    }).catch(()=>{ statusLine.textContent = 'Could not load status.'; });\n  }\n  loadStatus();\n\n  document.getElementById('go').addEventListener('click', async ()=>{\n    const key = document.getElementById('key').value;\n    out.textContent = 'Reindexing\u2026 this can take a minute for a large site.';\n    try{\n      const res = await fetch('/api/reindex', { method:'POST', headers:{ 'x-admin-key': key } });\n      const data = await res.json();\n      out.textContent = JSON.stringify(data, null, 2);\n      loadStatus();\n    } catch(e){\n      out.textContent = 'Request failed: ' + e.message;\n    }\n  });\n</script>\n</body>\n</html>\n";

const STOPWORDS = new Set([
  "the","a","an","of","to","in","and","is","are","for","on","with","i","my","me",
  "you","your","best","trip","travel","how","what","where","when","about","from",
  "that","this","it","can","do","does","will","would","please","tell","give","need"
]);

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text, size = 900, overlap = 150) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.length ? chunks : [text];
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function fetchAllFromWp(baseUrl, endpoint, fields, maxPages = 20) {
  const items = [];
  let page = 1;
  while (page <= maxPages) {
    const url = `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=50&page=${page}&_fields=${fields}`;
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": "NorthHimalayanAI/1.0" } });
    } catch (e) {
      break;
    }
    if (!res.ok) break;
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) break;
    page++;
  }
  return items;
}

async function reindex(env) {
  const base = env.SITE_URL || "https://northhimalayan.com";
  const allChunks = [];

  const posts = await fetchAllFromWp(base, "posts", "id,title,link,excerpt,content,categories");
  for (const p of posts) {
    const title = stripHtml(p.title?.rendered || "");
    const content = stripHtml(p.content?.rendered || p.excerpt?.rendered || "");
    const pieces = chunkText(`${title}. ${content}`);
    pieces.forEach((text, idx) => {
      allChunks.push({ id: `post-${p.id}-${idx}`, title, url: p.link, text });
    });
  }

  const pages = await fetchAllFromWp(base, "pages", "id,title,link,content");
  for (const p of pages) {
    const title = stripHtml(p.title?.rendered || "");
    const content = stripHtml(p.content?.rendered || "");
    const pieces = chunkText(`${title}. ${content}`);
    pieces.forEach((text, idx) => {
      allChunks.push({ id: `page-${p.id}-${idx}`, title, url: p.link, text });
    });
  }

  await env.KB.put("kb:v1", JSON.stringify(allChunks));
  await env.KB.put(
    "kb:meta",
    JSON.stringify({ count: allChunks.length, posts: posts.length, pages: pages.length, updatedAt: new Date().toISOString() })
  );
  return allChunks.length;
}

function scoreChunk(chunk, terms) {
  const t = chunk.text.toLowerCase();
  const ti = chunk.title.toLowerCase();
  let s = 0;
  for (const term of terms) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "g");
    s += (t.match(re) || []).length;
    s += (ti.match(re) || []).length * 3;
  }
  return s;
}

async function retrieve(env, query, topK = 6) {
  const raw = await env.KB.get("kb:v1");
  if (!raw) return [];
  const chunks = JSON.parse(raw);
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  if (terms.length === 0) return [];
  const scored = chunks.map((c) => ({ c, s: scoreChunk(c, terms) })).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map((x) => x.c);
}

async function handleChat(request, env) {
  const body = await request.json().catch(() => ({}));
  const message = (body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) return json({ error: "message is required" }, 400);
  if (!env.AI) return json({ error: "Server not configured: missing AI binding" }, 500);

  const chunks = await retrieve(env, message, 6);
  const context = chunks.length
    ? chunks.map((c) => `Source: ${c.title} (${c.url})\n${c.text}`).join("\n\n---\n\n")
    : "(No matching articles were found in the knowledge base for this question.)";

  const system = `You are the North Himalayan AI Travel Planner, the trip-planning assistant for northhimalayan.com, a Himalayan and India travel site (Ladakh, Himachal, Spiti, Kashmir, Northeast, Goa hostels/cafes, and more).

Use the CONTEXT below, pulled live from northhimalayan.com, to answer the traveler's question. Rules:
- Ground specific facts (place names, prices, ratings, itineraries) only in the CONTEXT. Never invent prices, hotel names, or availability that isn't in the CONTEXT.
- If the CONTEXT doesn't cover the question, say so honestly, then give general, high-level travel guidance instead.
- Keep answers warm, concise, and practical — like a knowledgeable local friend, not a brochure.
- When it's natural (trip planning, bookings, custom itineraries), invite the traveler to reach out on WhatsApp: +91-8580805021.
- Cite the source article titles you drew from when relevant.

CONTEXT:
${context}`;

  const messages = [
    { role: "system", content: system },
    ...history
      .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
      .slice(-10),
    { role: "user", content: message },
  ];

  let data;
  try {
    data = await env.AI.run(env.MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 1024,
    });
  } catch (e) {
    return json({ error: "Workers AI error", detail: e.message }, 502);
  }

  const reply = (data && (data.response || data.result?.response)) || "";
  return json({ reply, sources: chunks.map((c) => ({ title: c.title, url: c.url })) });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        return await handleChat(request, env);
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/reindex" && request.method === "POST") {
      const key = request.headers.get("x-admin-key");
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: "unauthorized" }, 401);
      try {
        const n = await reindex(env);
        return json({ ok: true, chunks: n });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      const meta = await env.KB.get("kb:meta");
      return json(meta ? JSON.parse(meta) : { count: 0, updatedAt: null });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(INDEX_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    if (url.pathname === "/admin" && reystem = `You are the North Himalayan AI Travel Planner, the trip-planning assistant for northhimalayan.com, a Himalayan and India travel site (Ladakh, Himachal, Spiti, Kashmir, Northeast, Goa hostels/cafes, and more).

Use the CONTEXT below, pulled live from northhimalayan.com, to answer the traveler's question. Rules:
- Ground specific facts (place names, prices, ratings, itineraries) only in the CONTEXT. Never invent prices, hotel names, or availability that isn't in the CONTEXT.
- If the CONTEXT doesn't cover the question, say so honestly, then give general, high-level travel guidance instead.
- Keep answers warm, concise, and practical — like a knowledgeable local friend, not a brochure.
- When it's natural (trip planning, bookings, custom itineraries), invite the traveler to reach out on WhatsApp: +91-8580805021.
- Cite the source article titles you drew from when relevant.

CONTEXT:
${context}`;

  const messages = [
    { role: "system", content: system },
    ...history
      .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
      .slice(-10),
    { role: "user", content: message },
  ];

  let data;
  try {
    data = await env.AI.run(env.MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 1024,
    });
  } catch (e) {
    return json({ error: "Workers AI error", detail: e.message }, 502);
  }

  const reply = (data && (data.response || data.result?.response)) || "";
  return json({ reply, sources: chunks.map((c) => ({ title: c.title, url: c.url })) });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        return await handleChat(request, env);
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/reindex" && request.method === "POST") {
      const key = request.headers.get("x-admin-key");
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: "unauthorized" }, 401);
      try {
        const n = await reindex(env);
        return json({ ok: true, chunks: n });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      const meta = await env.KB.get("kb:meta");
      return json(meta ? JSON.parse(meta) : { count: 0, updatedAt: null });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(INDEX_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    if (url.pathname === "/admin" && restels in North Goa for backpackers\">North Goa hostels</button>\n        <button class=\"chip-btn\" data-q=\"What permits do I need for Spiti Valley?\">Spiti permits</button>\n      </div>\n    </div>\n  </main>\n\n  <form id=\"form\">\n    <textarea id=\"input\" rows=\"1\" placeholder=\"Ask about your trip\u2026\" required></textarea>\n    <button class=\"send\" type=\"submit\" id=\"sendBtn\">SEND</button>\n  </form>\n\n<script>\n  const main = document.getElementById('main');\n  const empty = document.getElementById('empty');\n  const form = document.getElementById('form');\n  const input = document.getElementById('input');\n  const sendBtn = document.getElementById('sendBtn');\n  const statusEl = document.getElementById('status');\n  let history = [];\n\n  fetch('/api/status').then(r=>r.json()).then(s=>{\n    if(s.updatedAt){\n      const d = new Date(s.updatedAt);\n      statusEl.textContent = `KB \u00b7 ${s.count} chunks \u00b7 ${d.toLocaleDateString()}`;\n    } else {\n      statusEl.textContent = 'KB \u00b7 not indexed yet';\n    }\n  }).catch(()=>{ statusEl.textContent = 'KB \u00b7 status unavailable'; });\n\n  document.querySelectorAll('.chip-btn').forEach(b=>{\n    b.addEventListener('click', ()=>{ input.value = b.dataset.q; form.dispatchEvent(new Event('submit')); });\n  });\n\n  input.addEventListener('input', ()=>{\n    input.style.height='auto';\n    input.style.height = Math.min(input.scrollHeight,120)+'px';\n  });\n\n  function addMessage(role, text, sources){\n    if(empty) empty.remove();\n    const wrap = document.createElement('div');\n    wrap.className = 'msg ' + role;\n    const bubble = document.createElement('div');\n    bubble.className = 'bubble';\n    bubble.textContent = text;\n    wrap.appendChild(bubble);\n    if(sources && sources.length){\n      const sWrap = document.createElement('div');\n      sWrap.className = 'sources';\n      sources.forEach(s=>{\n        const a = document.createElement('a');\n        a.href = s.url; a.target = '_blank'; a.rel='noopener';\n        a.className = 'source-chip';\n        a.textContent = s.title || s.url;\n        sWrap.appendChild(a);\n      });\n      wrap.appendChild(sWrap);\n    }\n    main.appendChild(wrap);\n    main.scrollTop = main.scrollHeight;\n    return wrap;\n  }\n\n  function addTyping(){\n    if(empty) empty.remove();\n    const wrap = document.createElement('div');\n    wrap.className = 'msg assistant';\n    wrap.id = 'typing';\n    const bubble = document.createElement('div');\n    bubble.className = 'bubble';\n    bubble.innerHTML = '<div class=\"typing\"><span></span><span></span><span></span></div>';\n    wrap.appendChild(bubble);\n    main.appendChild(wrap);\n    main.scrollTop = main.scrollHeight;\n  }\n\n  form.addEventListener('submit', async (e)=>{\n    e.preventDefault();\n    const text = input.value.trim();\n    if(!text) return;\n    addMessage('user', text);\n    history.push({role:'user', content:text});\n    input.value=''; input.style.height='auto';\n    sendBtn.disabled = true;\n    addTyping();\n    try{\n      const res = await fetch('/api/chat', {\n        method:'POST',\n        headers:{'content-type':'application/json'},\n        body: JSON.stringify({ message: text, history })\n      });\n      const data = await res.json();\n      document.getElementById('typing')?.remove();\n      if(data.error){\n        addMessage('assistant', 'Error: ' + data.error + (data.detail ? ('\\n\\nDetail: ' + data.detail) : ''));\n      } else {\n        addMessage('assistant', data.reply, data.sources);\n        history.push({role:'assistant', content:data.reply});\n      }\n    } catch(err){\n      document.getElementById('typing')?.remove();\n      addMessage('assistant', 'Network error \u2014 please try again.');\n    }\n    sendBtn.disabled = false;\n  });\n</script>\n</body>\n</html>\n";

const ADMIN_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n<title>NH Planner \u2014 Admin</title>\n<style>\n  body{background:#10151c; color:#e9e4d8; font-family:system-ui,sans-serif; max-width:480px; margin:40px auto; padding:0 16px;}\n  h1{font-size:18px;}\n  input, button{width:100%; padding:11px; margin-top:8px; border-radius:8px; border:1px solid #2a3441; font-size:15px; box-sizing:border-box;}\n  input{background:#1d2733; color:#e9e4d8;}\n  button{background:#c68b3d; color:#1a1206; border:none; font-weight:600; cursor:pointer; margin-top:16px;}\n  pre{background:#171f29; padding:12px; border-radius:8px; white-space:pre-wrap; font-size:12.5px; margin-top:16px; border:1px solid #2a3441;}\n  .muted{color:#8b93a0; font-size:13px;}\n</style>\n</head>\n<body>\n  <h1>Knowledge base admin</h1>\n  <p class=\"muted\" id=\"statusLine\">Loading status\u2026</p>\n  <input id=\"key\" type=\"password\" placeholder=\"Admin key\" autocomplete=\"off\" />\n  <button id=\"go\">Reindex from northhimalayan.com</button>\n  <pre id=\"out\"></pre>\n\n<script>\n  const out = document.getElementById('out');\n  const statusLine = document.getElementById('statusLine');\n\n  function loadStatus(){\n    fetch('/api/status').then(r=>r.json()).then(s=>{\n      statusLine.textContent = s.updatedAt\n        ? `${s.count} chunks indexed \u00b7 last updated ${new Date(s.updatedAt).toLocaleString()}`\n        : 'Not indexed yet.';\n    }).catch(()=>{ statusLine.textContent = 'Could not load status.'; });\n  }\n  loadStatus();\n\n  document.getElementById('go').addEventListener('click', async ()=>{\n    const key = document.getElementById('key').value;\n    out.textContent = 'Reindexing\u2026 this can take a minute for a large site.';\n    try{\n      const res = await fetch('/api/reindex', { method:'POST', headers:{ 'x-admin-key': key } });\n      const data = await res.json();\n      out.textContent = JSON.stringify(data, null, 2);\n      loadStatus();\n    } catch(e){\n      out.textContent = 'Request failed: ' + e.message;\n    }\n  });\n</script>\n</body>\n</html>\n";

const STOPWORDS = new Set([
  "the","a","an","of","to","in","and","is","are","for","on","with","i","my","me",
  "you","your","best","trip","travel","how","what","where","when","about","from",
  "that","this","it","can","do","does","will","would","please","tell","give","need"
]);

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text, size = 900, overlap = 150) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.length ? chunks : [text];
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function fetchAllFromWp(baseUrl, endpoint, fields, maxPages = 20) {
  const items = [];
  let page = 1;
  while (page <= maxPages) {
    const url = `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=50&page=${page}&_fields=${fields}`;
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": "NorthHimalayanAI/1.0" } });
    } catch (e) {
      break;
    }
    if (!res.ok) break;
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) break;
    page++;
  }
  return items;
}

async function reindex(env) {
  const base = env.SITE_URL || "https://northhimalayan.com";
  const allChunks = [];

  const posts = await fetchAllFromWp(base, "posts", "id,title,link,excerpt,content,categories");
  for (const p of posts) {
    const title = stripHtml(p.title?.rendered || "");
    const content = stripHtml(p.content?.rendered || p.excerpt?.rendered || "");
    const pieces = chunkText(`${title}. ${content}`);
    pieces.forEach((text, idx) => {
      allChunks.push({ id: `post-${p.id}-${idx}`, title, url: p.link, text });
    });
  }

  const pages = await fetchAllFromWp(base, "pages", "id,title,link,content");
  for (const p of pages) {
    const title = stripHtml(p.title?.rendered || "");
    const content = stripHtml(p.content?.rendered || "");
    const pieces = chunkText(`${title}. ${content}`);
    pieces.forEach((text, idx) => {
      allChunks.push({ id: `page-${p.id}-${idx}`, title, url: p.link, text });
    });
  }

  await env.KB.put("kb:v1", JSON.stringify(allChunks));
  await env.KB.put(
    "kb:meta",
    JSON.stringify({ count: allChunks.length, posts: posts.length, pages: pages.length, updatedAt: new Date().toISOString() })
  );
  return allChunks.length;
}

function scoreChunk(chunk, terms) {
  const t = chunk.text.toLowerCase();
  const ti = chunk.title.toLowerCase();
  let s = 0;
  for (const term of terms) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "g");
    s += (t.match(re) || []).length;
    s += (ti.match(re) || []).length * 3;
  }
  return s;
}

async function retrieve(env, query, topK = 6) {
  const raw = await env.KB.get("kb:v1");
  if (!raw) return [];
  const chunks = JSON.parse(raw);
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  if (terms.length === 0) return [];
  const scored = chunks.map((c) => ({ c, s: scoreChunk(c, terms) })).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map((x) => x.c);
}

async function handleChat(request, env) {
  const body = await request.json().catch(() => ({}));
  const message = (body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) return json({ error: "message is required" }, 400);
  if (!env.AI) return json({ error: "Server not configured: missing AI binding" }, 500);

  const chunks = await retrieve(env, message, 6);
  const context = chunks.length
    ? chunks.map((c) => `Source: ${c.title} (${c.url})\n${c.text}`).join("\n\n---\n\n")
    : "(No matching articles were found in the knowledge base for this question.)";

  const system = `You are the North Himalayan AI Travel Planner, the trip-planning assistant for northhimalayan.com, a Himalayan and India travel site (Ladakh, Himachal, Spiti, Kashmir, Northeast, Goa hostels/cafes, and more).

Use the CONTEXT below, pulled live from northhimalayan.com, to answer the traveler's question. Rules:
- Ground specific facts (place names, prices, ratings, itineraries) only in the CONTEXT. Never invent prices, hotel names, or availability that isn't in the CONTEXT.
- If the CONTEXT doesn't cover the question, say so honestly, then give general, high-level travel guidance instead.
- Keep answers warm, concise, and practical — like a knowledgeable local friend, not a brochure.
- When it's natural (trip planning, bookings, custom itineraries), invite the traveler to reach out on WhatsApp: +91-8580805021.
- Cite the source article titles you drew from when relevant.

CONTEXT:
${context}`;

  const messages = [
    { role: "system", content: system },
    ...history
      .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
      .slice(-10),
    { role: "user", content: message },
  ];

  let data;
  try {
    data = await env.AI.run(env.MODEL || "@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 1024,
    });
  } catch (e) {
    return json({ error: "Workers AI error", detail: e.message }, 502);
  }

  const reply = (data && (data.response || data.result?.response)) || "";
  return json({ reply, sources: chunks.map((c) => ({ title: c.title, url: c.url })) });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        return await handleChat(request, env);
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/reindex" && request.method === "POST") {
      const key = request.headers.get("x-admin-key");
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: "unauthorized" }, 401);
      try {
        const n = await reindex(env);
        return json({ ok: true, chunks: n });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      const meta = await env.KB.get("kb:meta");
      return json(meta ? JSON.parse(meta) : { count: 0, updatedAt: null });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(INDEX_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    if (url.pathname === "/admin" && request.methuest.json().catch(() => ({}));
  const message = (body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) return json({ error: "message is required" }, 400);
  if (!env.AI) return json({ error: "Server not configured: missing AI binding" }, 500);

  const chunks = await retrieve(env, message, 6);
  const context = chunks.length
    ? chunks.map((c) => `Source: ${c.title} (${c.url})\n${c.text}`).join("\n\n---\n\n")
    : "(No matching articles were found in the knowledge base for this question.)";

  const system = `You are the North Himalayan AI Travel Planner, the trip-planning assistant for northhimalayan.com, a Himalayan and India travel site (Ladakh, Himachal, Spiti, Kashmir, Northeast, Goa hostels/cafes, and more).

Use the CONTEXT below, pulled live from northhimalayan.com, to answer the traveler's question. Rules:
- Ground specific facts (place names, prices, ratings, itineraries) only in the CONTEXT. Never invent prices, hotel names, or availability that isn't in the CONTEXT.
- If the CONTEXT doesn't cover the question, say so honestly, then give general, high-level travel guidance instead.
- Keep answers warm, concise, and practical — like a knowledgeable local friend, not a brochure.
- When it's natural (trip planning, bookings, custom itineraries), invite the traveler to reach out on WhatsApp: +91-8580805021.
- Cite the source article titles you drew from when relevant.

CONTEXT:
${context}`;

  const messages = [
    { role: "system", content: system },
    ...history
      .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
      .slice(-10),
    { role: "user", content: message },
  ];

  let data;
  try {
    data = await env.AI.run(env.MODEL || "@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 1024,
    });
  } catch (e) {
    return json({ error: "Workers AI error", detail: e.message }, 502);
  }

  const reply = (data && (data.response || data.result?.response)) || "";
  return json({ reply, sources: chunks.map((c) => ({ title: c.title, url: c.url })) });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        return await handleChat(request, env);
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/reindex" && request.method === "POST") {
      const key = request.headers.get("x-admin-key");
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: "unauthorized" }, 401);
      try {
        const n = await reindex(env);
        return json({ ok: true, chunks: n });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      const meta = await env.KB.get("kb:meta");
      return json(meta ? JSON.parse(meta) : { count: 0, updatedAt: null });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(INDEX_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    if (url.pathname === "/admin" && request.method === "GET") {
      return new Response(ADMIN_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(reindex(env));
  },
};
