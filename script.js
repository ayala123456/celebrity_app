/*
  Celebrity Twin Finder — script.js
  Requires in HTML: <div id="results"></div> and <div id="error"></div>
  Use: renderCelebrityMatches([{ name: "Kaley Cuoco", percent: 88 }, ...])
*/

// --------- DOM refs ----------
const resultsEl = document.getElementById("results");
const errorEl   = document.getElementById("error");

// --------- small helpers ----------
function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg || "";
  errorEl.style.display = msg ? "block" : "none";
}
function clearResults() {
  if (resultsEl) resultsEl.innerHTML = "";
}

// --------- image lookup (Wikipedia) ----------
async function getCelebImageUrl(rawName) {
    const name = (rawName || "").trim();
    if (!name) return null;
  
    const trySummary = async (title) => {
      const r = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (!r.ok) return null;
      const j = await r.json();
  
      // only return valid image URLs (jpg/png/webp) — skip links like Instagram
      const img = j?.thumbnail?.source || j?.originalimage?.source || null;
      if (img && /\.(jpg|jpeg|png|webp)$/i.test(img)) return img;
      return null;
    };
  
    // 1) exact title
    let img = await trySummary(name);
    if (img) return img;
  
    // 2) search and retry with top title
    try {
      const r = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          name
        )}&format=json&origin=*`
      );
      if (r.ok) {
        const j = await r.json();
        const top = j?.query?.search?.[0]?.title;
        if (top) {
          img = await trySummary(top);
          if (img) return img;
        }
      }
    } catch {}
  
    // 3) fallback to pageimages
    try {
      const r = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=400&origin=*&titles=${encodeURIComponent(
          name
        )}`
      );
      if (r.ok) {
        const j = await r.json();
        const first = Object.values(j?.query?.pages || {})[0];
        const url = first?.thumbnail?.source || null;
        if (url && /\.(jpg|jpeg|png|webp)$/i.test(url)) return url;
      }
    } catch {}
  
    return null;
  }
  

// --------- one result card ----------
async function createMatchEl({ name, percent }) {
  const item = document.createElement("div");
  item.className = "match";
  item.innerHTML = `
    <img class="celeb-pic" alt="" />
    <div class="match-text">
      <div class="name"></div>
      <div class="pct"></div>
    </div>
  `;

  const imgEl  = item.querySelector(".celeb-pic");
  const nameEl = item.querySelector(".name");
  const pctEl  = item.querySelector(".pct");

  nameEl.textContent = name || "Unknown";
  pctEl.textContent  = (typeof percent === "number" ? percent : 0) + "%";

  const url = await getCelebImageUrl(name);
  if (url) {
    imgEl.src = url;
    imgEl.alt = name;
  } else {
    imgEl.style.display = "none"; // optional: set a placeholder instead
  }

  return item;
}

// --------- public render function ----------
window.renderCelebrityMatches = async function(matches) {
  clearResults();
  showError("");

  try {
    if (!Array.isArray(matches) || matches.length === 0) {
      showError("No matches found.");
      return;
    }

    // optional: sort by score desc
    matches.sort((a, b) => (b.percent || 0) - (a.percent || 0));

    // render sequentially (keeps API requests polite)
    for (const m of matches) {
      const card = await createMatchEl(m);
      resultsEl.appendChild(card);
    }
  } catch (e) {
    showError("Something went wrong rendering matches.");
    // console.error(e);
  }
};

/* ---------- quick test (optional) ----------
   Turn on by setting window.__RUN_TEST = true in the console,
   or set it to true here temporarily.
*/
// window.__RUN_TEST = true;
if (window.__RUN_TEST) {
  window.renderCelebrityMatches([
    { name: "Kaley Cuoco", percent: 88 },
    { name: "Reese Witherspoon", percent: 85 },
    { name: "Tom Hanks", percent: 82 }
  ]);
}
