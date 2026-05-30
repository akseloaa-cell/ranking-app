import { state } from "./state.js";
import { nextMatch, pick, draw } from "./match.js";
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
      <button id="battlePickA"></button>
      <button onclick="categoryDraw()">Draw</button>
      <button id="battlePickB"></button>
    </div>
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
  const pickA = document.getElementById("battlePickA");
  const pickB = document.getElementById("battlePickB");

  if (!aEl || !bEl) return;

  if(!a || !b){
    aEl.innerHTML = "Need at least 2 items";
    bEl.innerHTML = "Add more items to this category";
    aEl.onclick = null;
    bEl.onclick = null;
    if(pickA) pickA.style.display = "none";
    if(pickB) pickB.style.display = "none";
    return;
  }

  aEl.innerHTML = format(a);
  bEl.innerHTML = format(b);
  if(pickA){
    pickA.style.display = "block";
    pickA.innerText = a.name;
  }
  if(pickB){
    pickB.style.display = "block";
    pickB.innerText = b.name;
  }

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

  if(pickA) pickA.onclick = aEl.onclick;
  if(pickB) pickB.onclick = bEl.onclick;
}

export function categoryDraw(){
  draw();
  nextCategoryMatch();
  update();
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
