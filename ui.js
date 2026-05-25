import { state } from "./state.js";
import { toggleCat } from "./categories.js";

export function openAddItem(){
  const overlay = document.getElementById("addOverlay");
  const view = document.getElementById("addView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);
  renderChips({
  filter: "",
  targetId: "chipBox",
  mode: "select"
});

}

export function closeAddItem(){
  const overlay = document.getElementById("addOverlay");
  const view = document.getElementById("addView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

export function toggleMenu(){
  const menu = document.getElementById("modeMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

export function setMode(mode){

  state.mode = mode;

  const views = [
    "homeView",
    "categorySelectView",
    "categoryBattleView"
  ];

  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (mode === "home"){
    document.querySelector(".vs").style.display = "none";
    const el = document.getElementById("homeView");
    if (el) el.style.display = "block";
  }

  if (mode === "categorySelect"){
    const el = document.getElementById("categorySelectView");
    if (el) el.style.display = "block";
  }

  if (mode === "categoryBattle"){
    const el = document.getElementById("categoryBattleView");
    if (el) el.style.display = "block";
  }
}

export function setActiveMenu(el){

  document.querySelectorAll(".menuItem")
    .forEach(x => x.style.background = "");

  if (el) el.style.background = "#2f3b55";
}

export function scrollToTop(){
  document.getElementById("rankingView").scrollTop = 0;
}

export function renderChips({
  filter = "",
  targetId,
  mode = "select", // select | add | filter
  itemId = null
}) {
  const box = document.getElementById(targetId);
  if (!box) return;

  const f = filter.toLowerCase();

  let list = state.categories.filter(c => c.includes(f));

  // 🔥 riktig toggle basert på hvor vi er
  let showAll =
    targetId === "chipBox" ? state.showAllAddChips :
    targetId === "statsChipBox" ? state.showAllStatsChips :
    state.showAllRankingChips;

  if (!showAll) list = list.slice(0, 6);

  const selected = itemId
    ? (state.items.find(x => x.id === itemId)?.categories || [])
    : [];

  box.innerHTML =
    list.map(c => {
      let active = "";

      if (mode === "select") {
        active = selected.includes(c) ? "active" : "";
      }

      return `
        <span class="chip ${active}"
          onclick="${
            mode === "select"
              ? `toggleChip(this)`
              : mode === "add"
              ? `addCatToItem(${itemId}, '${c}')`
              : `setRankingFilter('${c}')`
          }">
          ${c}
        </span>
      `;
    }).join("") +

    (state.categories.length > 6 ? `
      <span class="chip"
        style="background:#4f8cff;color:white;font-weight:bold;"
        onclick="toggleAllChips('${targetId}', '${mode}', ${itemId || 'null'})">
        ${showAll ? "−" : "+"}
      </span>
    ` : "");
}

/* ================= TOGGLE ================= */

export function toggleAllChips(targetId, mode, itemId){
  if(targetId === "chipBox"){
    state.showAllAddChips = !state.showAllAddChips;
  }
  else if(targetId === "statsChipBox"){
    state.showAllStatsChips = !state.showAllStatsChips;
  }
  else{
    state.showAllRankingChips = !state.showAllRankingChips;
  }

  renderChips({
    filter: document.getElementById("catSearch")?.value || "",
    targetId,
    mode,
    itemId
  });
}

/* ================= SELECT CHIP ================= */

export function toggleChip(el){
  el.classList.toggle("active");
}

export function hideAllViews(){

  const ranking = document.getElementById("ranking");
  const tournament = document.getElementById("tournamentSection");
  const categorySelect = document.getElementById("categorySelectView");
  const categoryBattle = document.getElementById("categoryBattleView");

  if(ranking) ranking.style.display = "none";
  if(tournament) tournament.style.display = "none";
  if(categorySelect) categorySelect.style.display = "none";
  if(categoryBattle) categoryBattle.style.display = "none";
}

window.toggleAllChips = toggleAllChips;
window.toggleChip = toggleChip;
