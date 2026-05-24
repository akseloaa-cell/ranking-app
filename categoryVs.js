import { state } from "./state.js";
import { nextMatch, pick, draw } from "./match.js";
import { update } from "./ranking.js";

/* =========================
   OPEN MODE
========================= */

export function openCategoryVs(){

  state.mode = "categorySelect";
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

  const cats = state.categories.filter(c =>
    c.toLowerCase().includes(f)
  );

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

/* =========================
   VS SCREEN
========================= */

export function renderVsScreen(){

  const container = document.getElementById("categoryBattleView");
  if (!container) return;

  container.innerHTML = `
    <div class="battle-topbar">

      <button onclick="exitCategoryVs()" class="battle-back">
        ← Categories
      </button>

      <div id="battleCategoryTitle">
        ⚔️ ${state.activeCategory}
      </div>

    </div>

    <div id="vsContainer">

      <div id="a"></div>

      <div style="opacity:0.5;font-size:24px;">VS</div>

      <div id="b"></div>

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

  if (pool.length < 2) return;

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

  const aEl = document.getElementById("a");
  const bEl = document.getElementById("b");

  if (!aEl || !bEl) return;

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

export function exitCategoryVs(){

  state.activeCategory = null;
  state.mode = "home";

  setMode("home");

  update();
}

/* =========================
   SEARCH
========================= */

export function filterCategories(value){
  renderCategoryList(value);
}

/* =========================
   GLOBAL ACCESS
========================= */

window.startCategoryVs = startCategoryVs;
window.exitCategoryVs = exitCategoryVs;
window.filterCategories = filterCategories;
