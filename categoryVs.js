import { state } from "./state.js";
import { nextMatch, pick, draw, formatChoice } from "./match.js";
import { update } from "./ranking.js";

/* =========================
   OPEN MODE
========================= */

import { hideAllViews, setMode } from "./ui.js";

export function openCategoryVs(){
  state.mode = "categoryVs";
  state.activeCategory = null;

setMode("categorySelect");

  renderCategorySelectScreen();
}

/* =========================
   CATEGORY SELECT SCREEN
========================= */

export function renderCategorySelectScreen(){

  const container = document.getElementById("categorySelectView");
  if (!container) return;

  container.innerHTML = `
    <div class="vsSelectShell">
      <button type="button" onclick="setMode('home'); closeMenu();" class="pageBackButton">← Tilbake</button>
      <div class="vsSelectHeader">
        <div class="vsSelectIcon">⚔️</div>
        <h2>Versus</h2>
        <p>Velg kategori for å starte en duell</p>
      </div>
      <div class="vsSelectCard">
        <label class="vsSelectLabel" for="categorySearch">Kategorier</label>
        <div class="vsSelectSearchWrap">
          <span aria-hidden="true">⌕</span>
          <input id="categorySearch" type="search" placeholder="Søk etter kategori..."
            oninput="filterCategories(this.value)" autocomplete="off">
        </div>
        <div class="vsSelectToolbar">
          <span class="vsSelectSortCaption">Sorter etter</span>
          <div class="vsSelectSortControls">
            <div class="vsSelectSortDropdown">
              <button type="button" id="sortDropdownButton" class="vsSelectSortButton"
                onclick="toggleCategorySortDropdown()" aria-expanded="false" aria-controls="sortDropdownMenu">
                <span id="sortLabel">📦 Items</span><span class="vsSelectChevron">⌄</span>
              </button>
              <div id="sortDropdownMenu" class="vsSelectSortMenu hidden">
                <button type="button" class="vsSelectSortOption" data-sort-type="items"
                  onclick="setSortType('items')">📦 Antall items <span class="vsSelectSortCheck">✓</span></button>
                <button type="button" class="vsSelectSortOption" data-sort-type="alpha"
                  onclick="setSortType('alpha')">🔤 Navn <span class="vsSelectSortCheck">✓</span></button>
              </div>
            </div>
            <button type="button" id="sortDirButton" class="vsSelectDirectionButton"
              onclick="toggleSortDir()" aria-label="Endre sorteringsretning" title="Endre sorteringsretning">
              <span id="sortDirLabel">↓</span>
            </button>
          </div>
        </div>
        <div id="categoryList" class="vsSelectCategoryList"></div>
      </div>
    </div>
  `;

  syncVsSortControls();
    renderCategoryList("");
}

/* =========================
   CATEGORY LIST
========================= */

export function renderCategoryList(filter = ""){

  const box = document.getElementById("categoryList");
  if (!box) return;

  const f = filter.toLowerCase();

let cats = state.categories.filter(c =>
  c.toLowerCase().includes(f)
);

const getCount = (cat) =>
  state.items.filter(x =>
    (x.categories || []).includes(cat)
  ).length;

// ALPHABETICAL
if(state.categorySortType === "alpha"){
  cats.sort((a,b) => a.localeCompare(b));
}

// ITEMS
if(state.categorySortType === "items"){
  cats.sort((a,b) => getCount(a) - getCount(b));
}

// DIRECTION
if(state.categorySortDir === "desc"){
  cats.reverse();
}

  box.innerHTML = cats.length ? cats.map(category => {
    const count = getCount(category);
    const safeName = category.replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[char]);
    const safeEncoded = encodeURIComponent(category).replace(/'/g, "%27");
    return `
      <button type="button" class="vs-category-card" onclick="startCategoryVs(decodeURIComponent('${safeEncoded}'))">
        <span class="vsCategoryFolder">📁</span>
        <span class="vsCategoryDetails">
          <strong>${safeName}</strong>
          <small>${count} items</small>
        </span>
        <span class="vsCategoryArrow" aria-hidden="true">›</span>
      </button>
    `;
  }).join("") : '<div class="vsCategoryEmpty">Ingen kategorier funnet</div>';
}

function syncVsSortControls(){
  const type = state.categorySortType === "alpha" ? "alpha" : "items";
  const direction = state.categorySortDir === "asc" ? "asc" : "desc";
  const label = document.getElementById("sortLabel");
  const dirLabel = document.getElementById("sortDirLabel");
  const dirButton = document.getElementById("sortDirButton");
  if(label) label.textContent = type === "items" ? "📦 Antall items" : "🔤 Navn";
  if(dirLabel) dirLabel.textContent = direction === "asc" ? "↑" : "↓";
  if(dirButton) dirButton.title = direction === "asc" ? "Stigende rekkefølge" : "Synkende rekkefølge";
  document.querySelectorAll(".vsSelectSortOption").forEach(button => {
    button.classList.toggle("active", button.dataset.sortType === type);
  });
}

export function toggleCategorySortDropdown(){
  const menu = document.getElementById("sortDropdownMenu");
  const button = document.getElementById("sortDropdownButton");
  if(!menu) return;
  menu.classList.toggle("hidden");
  if(button) button.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
}

export function toggleSortType(){
  setSortType(state.categorySortType === "items" ? "alpha" : "items");
}

export function toggleSortDir(){
  state.categorySortDir = state.categorySortDir === "asc" ? "desc" : "asc";
  syncVsSortControls();
  renderCategoryList(document.getElementById("categorySearch")?.value || "");
}
/* =========================
   START MODE
========================= */

export function startCategoryVs(category){

  state.activeCategory = category;
  state.mode = "categoryBattle";

  setMode("categoryBattle");

  renderVsScreen();
  nextCategoryMatch();
}

export function setSortType(type){
  if(!["items", "alpha"].includes(type)) return;
  state.categorySortType = type;
  const menu = document.getElementById("sortDropdownMenu");
  if(menu) menu.classList.add("hidden");
  document.getElementById("sortDropdownButton")?.setAttribute("aria-expanded", "false");
  syncVsSortControls();
  renderCategoryList(document.getElementById("categorySearch")?.value || "");
}
/* =========================
   VS SCREEN
========================= */

export function renderVsScreen(){

  const container = document.getElementById("categoryBattleView");
  if (!container) return;

  container.innerHTML = `
    <div class="battle-topbar">

      <button onclick="backToCategorySelect()" class="battle-back">
        ← Categories
      </button>

      <div id="battleCategoryTitle">
        ⚔️ ${state.activeCategory}
      </div>

    </div>

    <div id="battleArena">

      <div id="battleCardA" class="battle-card"></div>

      <div class="battle-vs">VS</div>

      <div id="battleCardB" class="battle-card"></div>

    </div>

    <div class="battle-buttons">
      <button onclick="categoryDraw()">Uavgjort</button>
    </div>

    <div id="categoryBattleRanking"></div>
  `;

  update();
}

/* =========================
   MATCH GENERATION
========================= */

export function nextCategoryMatch(){

  const pool = state.items.filter(x =>
    (x.categories || []).includes(state.activeCategory)
  );

  if (pool.length < 2) {
    state.current = [];
    renderMatch();
    return;
  }

  const useBalanced = Math.random() > 0.5;

  let a = pool[Math.floor(Math.random() * pool.length)];
  let b;

  if (useBalanced) {

    const sorted = [...pool].sort(
      (x, y) =>
        Math.abs(x.rating - a.rating) -
        Math.abs(y.rating - a.rating)
    );

    b = sorted.find(x => x.id !== a.id) || pool[0];

  } else {
    do {
      b = pool[Math.floor(Math.random() * pool.length)];
    } while (b.id === a.id);
  }

  state.current = [a, b];

  renderMatch();
}

/* =========================
   MATCH RENDER
========================= */

export function renderMatch(){

  const [a, b] = state.current;

  const aEl = document.getElementById("battleCardA");
  const bEl = document.getElementById("battleCardB");

  if (!aEl || !bEl) return;

  if(!a || !b){
    aEl.innerHTML = "Need at least 2 items";
    bEl.innerHTML = "Add more items to this category";
    aEl.onclick = null;
    bEl.onclick = null;
    renderCategoryBattleRanking();
    return;
  }

  aEl.innerHTML = formatChoice(a, b);
  bEl.innerHTML = formatChoice(b, a);

  aEl.onclick = () => {
    pick(0);
    nextCategoryMatch();
    update();
  };

  bEl.onclick = () => {
    pick(1);
    nextCategoryMatch();
    update();
  };

  renderCategoryBattleRanking();
}

export function categoryDraw(){
  draw();
  nextCategoryMatch();
  update();
}

function renderCategoryBattleRanking(){
  const box = document.getElementById("categoryBattleRanking");
  if(!box) return;

  const list = state.items
    .filter(item => (item.categories || []).includes(state.activeCategory))
    .sort((a,b)=>b.rating-a.rating);

  if(!list.length){
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="category-battle-ranking-title">
      Ranking
    </div>

    ${list.map((item, i) => {
      const currentRank = i + 1;
      const prevRank = state.previousRankingByCategory
        ?. [state.activeCategory]
        ?. [item.id];

      let indicator = "";

      // Match the Home ranking: items added today show NY instead of a rank delta.
      const isNewToday = item.createdAt &&
        item.createdAt.split("T")[0] === new Date().toISOString().split("T")[0];

      if(isNewToday){
        indicator = `<span style="background:#4f8cff;color:white;padding:2px 6px;border-radius:6px;font-size:11px;font-weight:bold;">NY</span>`;
      } else if(prevRank !== undefined){
        const diff = prevRank - currentRank;

        if(diff > 0){
          indicator = `<span style="color:#4caf50;">▲ ${diff}</span>`;
        } else if(diff < 0){
          indicator = `<span style="color:#f44336;">▼ ${Math.abs(diff)}</span>`;
        }
      }

      return `
        <div onclick="showStats(${item.id})" class="category-battle-rank-row">
          <span>
            ${indicator}
            <b>#${currentRank}</b>
            ${item.name}
          </span>
          <span>${Math.floor(item.rating)}</span>
        </div>
      `;
    }).join("")}
  `;
}

/* =========================
   CARD UI
========================= */

function format(item){

  return `
    <div class="battle-card">

      <div style="font-size:22px;font-weight:700;">
        ${item.name}
      </div>

      <div style="margin-top:10px;opacity:0.7;">
        ⭐ ${Math.floor(item.rating)}
      </div>

    </div>
  `;
}

/* =========================
   EXIT
========================= */
export function backToCategorySelect(){
  state.activeCategory = null;
  setMode("categorySelect");
  renderCategorySelectScreen();
}

export function exitCategoryVs(){

  state.activeCategory = null;
  state.mode = "home";

  setMode("home");

  document.getElementById("categoryBattleView").innerHTML = "";
  document.getElementById("battleCardA").innerHTML = "";
  document.getElementById("battleCardB").innerHTML = "";

  update();

  // viktig: reset UI riktig
  document.querySelector(".vs").style.display = "flex";

  nextMatch();
}
/* =========================
   SEARCH
========================= */

export function filterCategories(value){
  renderCategoryList(value);
}

export function renderVsCategories(value = ""){
  renderCategoryList(value);
}

/* =========================
   GLOBAL ACCESS
========================= */

window.startCategoryVs = startCategoryVs;
window.exitCategoryVs = exitCategoryVs;
window.filterCategories = filterCategories;
window.renderVsCategories = renderVsCategories;
window.categoryDraw = categoryDraw;
window.toggleCategorySortDropdown = toggleCategorySortDropdown;
window.toggleSortType = toggleSortType;
window.toggleSortDir = toggleSortDir;
window.backToCategorySelect = backToCategorySelect;
window.setSortType = setSortType;
