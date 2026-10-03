import { state } from "./state.js";
import { toggleCat } from "./categories.js";
import { nextMatch } from "./match.js";
import { update } from "./ranking.js";
import { renderTournament } from "./tournament.js";

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

  renderItemSuggestions("");
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

export function closeMenu(){
  const menu = document.getElementById("modeMenu");

  if(menu){
    menu.style.display = "none";
  }
}

export function setMode(mode, menuEl = null){

  state.mode = mode;

  setActiveMenu(menuEl);

  const views = [
    "homeView",
    "categorySelectView",
    "categoryBattleView",
    "tournamentSection",
    "scenarioView",
    "scenarioRankingSetupView",
    "scenarioGameView",
    "categoryManagerView"
  ];

  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (mode === "home"){
    document.querySelector(".vs").style.display = "flex";
    const el = document.getElementById("homeView");
    if (el) el.style.display = "block";
    update();
    nextMatch();
  }

  if (mode === "tournament"){
    const el = document.getElementById("tournamentSection");
    if (el) el.style.display = "block";

    // Show the gamemode hub without deleting an unfinished tournament.
    state.tournament.showTournamentHub = true;

    renderTournament();
  }

  if (mode === "scenario"){
    const el = document.getElementById("scenarioView");
    if (el) el.style.display = "block";
  }

  if (mode === "scenarioRankingSetup"){
    const el = document.getElementById("scenarioRankingSetupView");
    if (el) el.style.display = "block";
  }

  if (mode === "scenarioGame"){
    const el = document.getElementById("scenarioGameView");
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

  if (mode === "categoryManager"){
    const el = document.getElementById("categoryManagerView");
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
  mode = "select",
  itemId = null
}) {
  const box = document.getElementById(targetId);
  if (!box) return;

  const f = filter.toLowerCase();

  let list = state.categories.filter(c => c.toLowerCase().includes(f));

  let showAll =
    targetId === "chipBox" ? state.showAllAddChips :
    targetId === "statsChipBox" ? state.showAllStatsChips :
    state.showAllRankingChips;

  if (!showAll) list = list.slice(0, 6);

  const selected = itemId
    ? (state.items.find(x => x.id === itemId)?.categories || [])
    : state.selectedCategories;

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

export function renderItemSuggestions(query = ""){
  const box = document.getElementById("itemSuggestions");
  if(!box) return;

  const q = query.trim().toLowerCase();
  const matches = q
    ? state.items
        .filter(item => item.name.toLowerCase().includes(q))
        .slice(0, 8)
    : [];

  if(!matches.length){
    box.innerHTML = "";
    box.style.display = "none";
    return;
  }

  box.innerHTML = matches.map(item => `
    <div class="itemSuggestion" onclick="selectItemSuggestion(${item.id})">
      <span>${escapeHtml(item.name)}</span>
      <span class="itemSuggestionStatus">Allerede lagt til</span>
    </div>
  `).join("");

  box.style.display = "block";
}

export function selectItemSuggestion(itemId){
  const item = state.items.find(x => x.id === itemId);
  const input = document.getElementById("itemInput");
  if(!item || !input) return;

  input.value = item.name;
  input.focus();
  renderItemSuggestions(item.name);
}

function escapeHtml(value){
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export function toggleChip(el){

  const cat = el.textContent.trim();

  if(state.selectedCategories.includes(cat)){
    state.selectedCategories =
      state.selectedCategories.filter(x => x !== cat);

    el.classList.remove("active");
  }
  else{
    state.selectedCategories.push(cat);
    el.classList.add("active");
  }
}

export function hideAllViews(){

  const home = document.getElementById("homeView");
  const categorySelect = document.getElementById("categorySelectView");
  const categoryBattle = document.getElementById("categoryBattleView");

  if(home) home.style.display = "none";
  if(categorySelect) categorySelect.style.display = "none";
  if(categoryBattle) categoryBattle.style.display = "none";
}

window.toggleAllChips = toggleAllChips;
window.toggleChip = toggleChip;
