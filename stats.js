import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { nextMatch } from "./match.js";
import { getH2H } from "./match.js";

// ================= BASIC =================

export function deleteItem(id){
  if(!confirm("Er du sikker?")) return;

  state.items = state.items.filter(x => x.id !== id);

  save();
  update();
  nextMatch();

  closeStats();
}

export function renameItem(id, newName){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  newName = newName.trim();
  if(!newName) return alert("Navn kan ikke være tomt");

  item.name = newName;

  save();
  update();
}

// ================= STATS =================

export function getWinrate(item){
  if(!item.h2h) return 0;

  let wins = 0;
  let total = 0;

  Object.values(item.h2h).forEach(r => {
    wins += r.wins || 0;
    total += (r.wins || 0) + (r.losses || 0);
  });

  return total ? wins / total : 0;
}

// ================= UI =================

export function openStats(){
  const overlay = document.getElementById("statsOverlay");
  const view = document.getElementById("statsView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);
}

export function closeStats(){
  const overlay = document.getElementById("statsOverlay");
  const view = document.getElementById("statsView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

// ================= CATEGORY =================

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

export function addCatToItem(id, valOverride){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  let val = valOverride || document.getElementById("newCatInput")?.value;
  if(!val || !val.trim()) return;

  val = val.trim().toLowerCase();

  if(!item.categories.includes(val)){
    item.categories.push(val);
  }

  if(!state.categories.includes(val)){
    state.categories.push(val);
  }

  save();
  showStats(id);
}

export function removeCatFromItem(id, cat){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  item.categories = item.categories.filter(c => c !== cat);

  save();
  showStats(id);
}

// ================= CHIPS =================

export function renderStatsChips(itemId, filter=""){
  const box = document.getElementById("statsChipBox");
  if(!box) return;

  const item = state.items.find(x => x.id === itemId);
  const selected = item?.categories || [];

  const f = filter.toLowerCase();

  let list = state.categories.filter(c => c.includes(f));

  if(!state.showAllStatsChips){
    list = list.slice(0, 6);
  }

  box.innerHTML =
    list.map(c => `
      <span onclick="addCatToItem(${itemId}, '${c}')"
        style="
          background:${selected.includes(c) ? '#4f8cff' : '#222'};
          padding:6px 10px;
          border-radius:999px;
          cursor:pointer;
          font-size:12px;
          display:inline-block;
          margin:3px;
        ">
        ${c}
      </span>
    `).join("") +

    (state.categories.length > 6 ? `
      <span onclick="toggleStatsChips(${itemId})"
        style="
          background:#4f8cff;
          color:white;
          padding:6px 10px;
          border-radius:999px;
          cursor:pointer;
          font-size:12px;
        ">
        ${state.showAllStatsChips ? "−" : "+"}
      </span>
    ` : "");
}

export function toggleStatsChips(id){
  state.showAllStatsChips = !state.showAllStatsChips;
  renderStatsChips(id, document.getElementById("statsCatSearch")?.value || "");
}

// ================= MAIN VIEW =================

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
  } else if(item.streak < 0){
    streakText = `<span style="color:#f44336;">L${Math.abs(item.streak)}</span>`;
  }

  document.getElementById("statsContent").innerHTML = `
    <div style="padding:20px; text-align:left;">

      <h2 contenteditable="true"
        onblur="renameItem(${item.id}, this.innerText)">
        ${item.name}
      </h2>

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

      <p><b>Head to Head:</b></p>
      ${Object.keys(item.h2h || {}).map(id => {
        const opp = state.items.find(x => x.id == id);
        if(!opp) return "";

        return `<div>${opp.name}: ${getH2H(item, opp)}</div>`;
      }).join("")}

      <hr>

      <button onclick="toggleCatSection()" id="catToggleBtn">
        📂 Kategorier +
      </button>

      <div id="catSection" style="display:none;">

        <p>
          ${item.categories.map(c => `
            <span onclick="removeCatFromItem(${item.id}, '${c}')">
              ${c} ✕
            </span>
          `).join("")}
        </p>

        <input id="newCatInput" placeholder="Ny kategori">
        <button onclick="addCatToItem(${item.id})">+</button>

        <input id="statsCatSearch"
          placeholder="Søk..."
          oninput="renderStatsChips(${item.id}, this.value)">

        <div id="statsChipBox"></div>

      </div>

      <hr>

      <button onclick="deleteItem(${item.id})">🗑️ Slett</button>

    </div>
  `;

  openStats();
  renderStatsChips(id);
}
