import { state } from "./state.js";
import { nextMatch, draw, formatChoice } from "./match.js";
import { update } from "./ranking.js";
import { categoryPick } from "./categoryElo.js";

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
    <div class="vs-select">

      <h2>🎮 Select Category</h2>

      <input
        id="categorySearch"
        placeholder="Search categories..."
        oninput="filterCategories(this.value)"
        style="
          width:100%;
          padding:12px;
          margin:10px 0;
          border-radius:10px;
          border:none;
          background:#1a1f2b;
          color:white;
        "
      />

<div class="sortBar">

  <div class="sortDropdown" onclick="toggleCategorySortDropdown()">
    <span id="sortLabel">📦 Items</span> ▾
  </div>

  <div id="sortDropdownMenu" class="sortMenu hidden">
    <div onclick="toggleSortType()">📦 Items</div>
    <div onclick="setSortType('alpha')">🔤 A–Z</div>
  </div>

  <div class="sortDir" onclick="toggleSortDir()">
    <span id="sortDirLabel">↓</span>
  </div>

</div>

      <div id="categoryList"></div>

    </div>
  `;

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

  box.innerHTML = cats.map(c => {

    const count = state.items.filter(x =>
      (x.categories || []).includes(c)
    ).length;

    return `
      <div class="vs-category-card"
        onclick="startCategoryVs('${c}')">

        <div style="font-weight:700;font-size:18px;">
          📂 ${c}
        </div>

        <div style="opacity:0.6;margin-top:4px;">
          ${count} items
        </div>

      </div>
    `;
  }).join("");
}

export function toggleCategorySortDropdown(){
  const el = document.getElementById("sortDropdownMenu");
  if(!el) return;

  el.classList.toggle("hidden");
}

export function toggleSortType(){

  if(state.categorySortType === "items"){
    state.categorySortType = "alpha";
  } else {
    state.categorySortType = "items";
  }

  const label = document.getElementById("sortTypeLabel");
  if(label){
    label.innerText =
      state.categorySortType === "items"
        ? "📦 Items"
        : "🔤 A–Z";
  }

  renderCategoryList(
    document.getElementById("categorySearch")?.value || ""
  );
}

export function toggleSortDir(){

  state.categorySortDir =
    state.categorySortDir === "asc" ? "desc" : "asc";

  const label = document.getElementById("sortDirLabel");
  if(label){
    label.innerText =
      state.categorySortDir === "asc" ? "↑" : "↓";
  }

  renderCategoryList(
    document.getElementById("categorySearch")?.value || ""
  );
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
  state.categorySortType = type;
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

state.current = [];
renderCategoryBattleRanking();
return;

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

   const key = [a.id, b.id].sort().join("-");

if(state.lastMatches.includes(key)){
  return nextCategoryMatch();
}

state.lastMatches.push(key);

if(state.lastMatches.length > 10){
  state.lastMatches.shift();
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
  categoryPick(a, b);
  nextCategoryMatch();
};

bEl.onclick = () => {
  categoryPick(b, a);
  nextCategoryMatch();
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

      if(prevRank !== undefined){
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
