import { state } from "../state.js";  
import { nextMatch, pick, draw } from "../match.js";
import { update } from "../ranking.js";
import { renderChips } from "../ui.js";

/* =========================
   CATEGORY VS MODE STATE
========================= */

export function openCategoryVs(){
  state.mode = "categoryVs";
  state.activeCategory = null;

  renderCategorySelectScreen();
}

/* =========================
   CATEGORY SELECT SCREEN
========================= */

export function renderCategorySelectScreen(){
  const container = document.getElementById("mainView");

  if(!container) return;

  const cats = ["all", ...state.categories];

  container.innerHTML = `
    <div style="padding:20px;">

      <h2>🎮 Select Category</h2>

      <input id="categorySearch"
        placeholder="Search categories..."
        style="
          width:100%;
          padding:10px;
          margin:10px 0;
          border-radius:8px;
          border:none;
        "
        oninput="filterCategories(this.value)"
      />

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
  if(!box) return;

  const f = filter.toLowerCase();

  const cats = state.categories.filter(c =>
    c.toLowerCase().includes(f)
  );

  box.innerHTML = cats.map(c => `
    <div
      onclick="startCategoryVs('${c}')"
      style="
        padding:10px;
        margin:6px 0;
        background:#1f1f1f;
        border-radius:10px;
        cursor:pointer;
      ">
      📂 ${c}
    </div>
  `).join("");
}

/* =========================
   START MODE
========================= */

export function startCategoryVs(category){
  state.activeCategory = category;
  state.mode = "categoryVs";

  renderVsScreen();
  nextCategoryMatch();
}

/* =========================
   VS SCREEN
========================= */

export function renderVsScreen(){
  const container = document.getElementById("mainView");

  container.innerHTML = `
    <div style="padding:10px;">

      <button onclick="exitCategoryVs()"
        style="
          margin-bottom:10px;
          padding:8px 12px;
          border-radius:8px;
          border:none;
          background:#333;
          color:white;
          cursor:pointer;
        ">
        ← Back
      </button>

      <h3>🎮 Category: ${state.activeCategory}</h3>

      <div id="vsContainer"
        style="
          display:flex;
          gap:10px;
          margin-top:20px;
        ">

        <div id="a" style="flex:1;"></div>
        <div style="padding:10px;opacity:0.5;">VS</div>
        <div id="b" style="flex:1;"></div>

      </div>

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

  if(pool.length < 2) return;

  const useBalanced = Math.random() > 0.5;

  let a = pool[Math.floor(Math.random() * pool.length)];
  let b;

  if(useBalanced){
    const sorted = [...pool].sort(
      (x, y) => Math.abs(x.rating - a.rating) - Math.abs(y.rating - a.rating)
    );

    b = sorted.find(x => x.id !== a.id) || pool[0];
  } else {
    do {
      b = pool[Math.floor(Math.random() * pool.length)];
    } while(b.id === a.id);
  }

  state.current = [a, b];

  renderMatch();
}

/* =========================
   MATCH RENDER
========================= */

export function renderMatch(){
  const [a, b] = state.current;

  const aEl = document.getElementById("a");
  const bEl = document.getElementById("b");

  if(!aEl || !bEl) return;

  aEl.innerHTML = format(a);
  bEl.innerHTML = format(b);

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
}

/* =========================
   FORMAT CARD
========================= */

function format(item){
  return `
    <div style="
      padding:16px;
      background:#1f1f1f;
      border-radius:12px;
      cursor:pointer;
    ">

      <div style="font-weight:600;font-size:18px;">
        ${item.name}
      </div>

      <div style="font-size:12px;opacity:0.6;">
        ⭐ ${Math.floor(item.rating)}
      </div>

    </div>
  `;
}

/* =========================
   EXIT MODE
========================= */

export function exitCategoryVs(){
  state.mode = "home";
  state.activeCategory = null;

  const container = document.getElementById("mainView");

  container.innerHTML = `
    <div id="ranking"></div>
  `;

  update();
}

/* =========================
   SEARCH
========================= */

export function filterCategories(value){
  renderCategoryList(value);
}

/* =========================
   GLOBAL ACCESS (UI onclick)
========================= */

window.startCategoryVs = startCategoryVs;
window.exitCategoryVs = exitCategoryVs;
window.filterCategories = filterCategories;
