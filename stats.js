import { state } from "./state.js";
import { save } from "./storage.js";
import { renderChips } from "./ui.js";

export function getWinrate(item){
  if(!item.h2h) return 0;

  let wins = 0;
  let total = 0;

  Object.values(item.h2h).forEach(r => {
    wins += r.w || 0;
    total += (r.w || 0) + (r.l || 0);
  });

  return total ? wins / total : 0;
}

export function openStats(){
  const overlay = document.getElementById("statsOverlay");
  const view = document.getElementById("statsView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);
}

export function toggleCatSection(){
  const el = document.getElementById("catSection");
  const btn = document.getElementById("catToggleBtn");

  if(el.style.display === "none"){
    el.style.display = "block";
    btn.innerText = "📂 Kategorier −";
  } else {
    el.style.display = "none";
    btn.innerText = "📂 Kategorier +";
  }
}

export function showStats(id){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  const rank = [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;

  const trend = item.history?.slice(-5) || [];

  let streakText = "-";

  if(item.streak > 0){
    streakText = `<span style="color:#4caf50;">W${item.streak}</span>`;
  }
  else if(item.streak < 0){
    streakText = `<span style="color:#f44336;">L${Math.abs(item.streak)}</span>`;
  }

  document.getElementById("statsContent").innerHTML = `
    <div style="padding:20px; text-align:left;">

      <h2 style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">

        <span contenteditable="true"
          onblur="renameItem(${item.id}, this.innerText)"
          style="font-weight:bold;">
          ${item.name}
        </span>

        <span style="font-size:12px; opacity:0.6;">
          ${item.categories.length ? "• " + item.categories.join(", ") : ""}
        </span>

      </h2>

      <button onclick="deleteItem(${item.id})"
        style="
          background:#1f1f1f;
          border:1px solid #f44336;
          color:#f44336;
          font-size:12px;
          padding:4px 8px;
          border-radius:8px;
          margin-top:8px;
          cursor:pointer;
          opacity:0.8;
        ">
        🗑️
      </button>

      <p>🏆 Rank: ${rank}</p>
      <p>⭐ ELO: ${Math.floor(item.rating)}</p>
      <p>📊 Winrate: ${(getWinrate(item)*100).toFixed(1)}%</p>
      <p>🔥 Streak: ${streakText}</p>
      <p>📈 ${trend.map(x => Math.floor(x)).join(" → ")}</p>

      <hr>

      <p>🏆 Wins: ${item.tournamentWins || 0}</p>
      <p>🥇 Top 3: ${item.top3 || 0}</p>
      <p>🎮 Played: ${item.tournamentsPlayed || 0}</p>

      <hr>

      <button onclick="toggleCatSection()" id="catToggleBtn"
        style="width:100%; padding:10px; border-radius:10px; background:#1f1f1f; border:none; cursor:pointer;">
        📂 Kategorier +
      </button>

      <div id="catSection" style="display:none; margin-top:10px;">

        <p>
          ${item.categories.map(c => `
            <span onclick="removeCatFromItem(${item.id}, '${c}')"
              style="background:#222;padding:4px 8px;margin:2px;border-radius:999px;display:inline-block;cursor:pointer;">
              ${c} ✕
            </span>
          `).join(" ")}
        </p>

        <div style="margin-top:10px;">
          <input id="newCatInput" placeholder="Legg til kategori"
            style="width:70%; padding:8px; border-radius:8px; border:none;">
          <button onclick="addCatToItem(${item.id})" style="width:25%;">+</button>
        </div>

        <div style="margin-top:10px;">
          <input id="statsCatSearch"
            placeholder="Søk kategori..."
            style="width:100%; padding:8px; margin-bottom:8px; border-radius:8px; border:none;"
            oninput="renderStatsChips(${item.id}, this.value)">

          <div id="statsChipBox"></div>
        </div>

      </div>

    </div>
  `;

  openStats();
  renderStatsChips(id);
}

export function closeStats(){
  const overlay = document.getElementById("statsOverlay");
  const view = document.getElementById("statsView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

export function updateHistory(item){
  if(!item.history) item.history = [];
  item.history.push(item.rating);
  if(item.history.length > 30) item.history.shift();
}

export function getH2H(a, b){
  if(!a.h2h || !a.h2h[b.id]) return "0-0";

  const r = a.h2h[b.id];
  return `${r.w}-${r.l}`;
}

export function isRival(a, b){
  if(!a.h2h || !a.h2h[b.id]) return false;

  const total = a.h2h[b.id].w + a.h2h[b.id].l;
  return total >= 3;
}

export function updateH2H(a, b, result){
  if(!a.h2h) a.h2h = {};
  if(!a.h2h[b.id]) a.h2h[b.id] = { w:0,l:0,d:0 };

  if(result === "win") a.h2h[b.id].w++;
  if(result === "loss") a.h2h[b.id].l++;
  if(result === "draw") a.h2h[b.id].d++;
}

export function saveDailyRanking(){
  // simplified versjon
  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  state.previousRanking = {};
  sorted.forEach((x,i)=>state.previousRanking[x.id] = i+1);
}
