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

// ================= MAIN =================

export function showStats(id){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  const rank = [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;

  document.getElementById("statsContent").innerHTML = `
    <div style="padding:20px; text-align:left;">

      <h2 contenteditable="true"
        onblur="renameItem(${item.id}, this.innerText)">
        ${item.name}
      </h2>

      <p>🏆 Rank: ${rank}</p>
      <p>⭐ ELO: ${Math.floor(item.rating)}</p>
      <p>📊 Winrate: ${(getWinrate(item)*100).toFixed(1)}%</p>

      <hr>

      <p>📊 Head to Head:</p>
      ${Object.keys(item.h2h || {}).map(id => {
        const opp = state.items.find(x => x.id == id);
        if(!opp) return "";

        return `<div>${opp.name}: ${getH2H(item, opp)}</div>`;
      }).join("")}

      <hr>

      <button onclick="deleteItem(${item.id})">🗑️ Slett</button>

    </div>
  `;

  openStats();
}
