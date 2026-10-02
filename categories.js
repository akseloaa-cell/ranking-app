import { state } from "./state.js";
import { save } from "./storage.js";
import { renderChips } from "./ui.js";

export function normalize(c){
  return c.trim().toLowerCase();
}

export function addCategory(){
  let v = document.getElementById("catInput").value;
  if(!v || !v.trim()) return;

  v = v.trim().toLowerCase();

  if(!state.categories.includes(v)){
    state.categories.push(v);
  }

  document.getElementById("catInput").value = "";

  renderChips({ targetId: "chipBox", mode: "select" });
  save();
}

export function toggleCat(el){
  el.classList.toggle("active");
}

export function openCategoryManager(){
  state.categoryManagerCategory = state.categories[0] || "";
  state.categoryManagerSearch = "";
  state.categoryManagerCategorySearch = "";
  state.categoryManagerItemSort = "elo";
  state.categoryManagerItemSortDir = "asc";
  renderCategoryManager();
}

export function searchCategoryManagerCategory(query){
  state.categoryManagerCategorySearch = query;
  const menu = document.getElementById("categoryManagerDropdownMenu");
  if(menu) menu.classList.remove("hidden");

  const q = String(query || "").trim().toLowerCase();
  if (!menu) return;

  if (!q) {
    const categories = [...state.categories];
    const selected = state.categoryManagerCategory || "";
    const input = menu.querySelector(".categoryManagerCategorySearch");

    menu.querySelectorAll(".categoryManagerOption").forEach(option => option.remove());

    const html = categories.map(category => {
      const count = state.items.filter(item => (item.categories || []).includes(category)).length;
      const safeCategory = encodeURIComponent(category).replace(/\x27/g, "%27");
      return `
        <div class="categoryManagerOption ${category === selected ? "active" : ""}" onclick="selectCategoryManagerCategory(decodeURIComponent('${safeCategory}'))">
          <span>${category}</span>
          <span class="categoryManagerOptionCount">${count}</span>
        </div>`;
    }).join("");

    if (input) input.insertAdjacentHTML("afterend", html);
    return;
  }

  menu.querySelectorAll(".categoryManagerOption").forEach(option => {
    const text = option.querySelector("span")?.textContent?.toLowerCase() || option.textContent.toLowerCase();
    option.removeAttribute("hidden");
    option.style.display = text.includes(q) ? "" : "none";
    if (!text.includes(q)) option.setAttribute("hidden", "");
  });
}

export function selectCategoryManagerCategory(category){
  state.categoryManagerCategory = category;
  state.categoryManagerSearch = "";
  state.categoryManagerCategorySearch = "";
  renderCategoryManager();
}

export function toggleItemInCategory(itemId){
  const item = state.items.find(x => x.id === itemId);
  const category = state.categoryManagerCategory;
  if(!item || !category) return;

  if(!item.categories) item.categories = [];

  if(item.categories.includes(category)){
    item.categories = item.categories.filter(c => c !== category);
  } else {
    item.categories.push(category);
  }

  save();
  renderCategoryManager();
}

export function setCategoryManagerItemSort(sort){
  state.categoryManagerItemSort = sort;
  state.categoryManagerItemSortDir = "asc";
  renderCategoryManager();
}

export function toggleCategoryManagerItemSortDir(){
  if((state.categoryManagerItemSort || "elo") !== "name") return;
  state.categoryManagerItemSortDir = state.categoryManagerItemSortDir === "asc" ? "desc" : "asc";
  renderCategoryManager();
}

export function toggleCategoryManagerSortDropdown(){
  const menu = document.getElementById("categoryManagerSortMenu");
  if(!menu) return;
  menu.classList.toggle("hidden");
}

export function searchCategoryManager(query){
  state.categoryManagerSearch = query;

  const q = String(query || "").trim().toLowerCase();
  document.querySelectorAll(".categoryManagerItem").forEach(item => {
    const text = item.querySelector("span")?.textContent?.toLowerCase() || item.textContent.toLowerCase();
    item.style.display = !q || text.includes(q) ? "" : "none";
  });
}

export function renderCategoryManager(){
  const box = document.getElementById("categoryManagerContent");
  if(!box) return;

  const categories = [...state.categories];
  const selected = state.categoryManagerCategory || categories[0] || "";
  const q = (state.categoryManagerSearch || "").trim().toLowerCase();
  const categoryQuery = (state.categoryManagerCategorySearch || "").trim().toLowerCase();
  const visibleCategories = categories.filter(category => !categoryQuery || category.toLowerCase().includes(categoryQuery));
  const categoryItemCount = selected
    ? state.items.filter(item => (item.categories || []).includes(selected)).length
    : 0;

  const items = [...state.items]
    .filter(item => !q || item.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aActive = (a.categories || []).includes(selected);
      const bActive = (b.categories || []).includes(selected);
      if(aActive !== bActive) return aActive ? -1 : 1;

      switch(state.categoryManagerItemSort || "elo"){
        case "name":
          return a.name.localeCompare(b.name, "nb", { sensitivity: "base" }) * (state.categoryManagerItemSortDir === "desc" ? -1 : 1);
        case "createdAt":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "elo":
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

  box.innerHTML = `
    <h2>🏷️ Kategorier</h2>

    <p style="opacity:.65;">Velg kategori</p>

    <div class="categoryManagerDropdown">
      <button type="button" class="categoryManagerDropdownButton" onclick="toggleCategoryManagerDropdown()">
        <span>${selected || "Ingen kategorier"}${selected ? ` <span class="categoryManagerCount">(${categoryItemCount})</span>` : ""}</span>
        <span>⌄</span>
      </button>
      <div id="categoryManagerDropdownMenu" class="categoryManagerDropdownMenu hidden">
        <input class="categoryManagerCategorySearch" placeholder="Søk kategori..." value="${state.categoryManagerCategorySearch || ""}" onfocus="document.getElementById('categoryManagerDropdownMenu')?.classList.remove('hidden')" onmousedown="event.stopPropagation()" onclick="event.stopPropagation()" oninput="event.stopPropagation(); searchCategoryManagerCategory(this.value)">
        ${visibleCategories.map(category => {
          const count = state.items.filter(item => (item.categories || []).includes(category)).length;
          return `
            <div class="categoryManagerOption ${category === selected ? "active" : ""}" onclick="selectCategoryManagerCategory('${category.replace(/'/g, "\'")}')">
              <span>${category}</span>
              <span class="categoryManagerOptionCount">${count}</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    ${selected ? `
      <input
        class="categoryManagerSearch"
        placeholder="Søk item..."
        value="${state.categoryManagerSearch || ""}"
        oninput="event.stopPropagation(); searchCategoryManager(this.value)"
      >

      <div class="categoryManagerSort">
        <span class="categoryManagerSortLabel">Sorter etter</span>
        <button type="button" class="categoryManagerSortButton" onclick="toggleCategoryManagerSortDropdown()">
          <span class="categoryManagerSortCurrent">
            <span class="categoryManagerSortCurrentIcon">↕</span>
            <span>${(state.categoryManagerItemSort === "name" ? (state.categoryManagerItemSortDir === "desc" ? "Å–A" : "A–Å") : state.categoryManagerItemSort === "createdAt" ? "Lagt til" : "Elo")}</span>
          </span>
          <span class="categoryManagerSortChevron">⌄</span>
        </button>
        <div id="categoryManagerSortMenu" class="categoryManagerSortMenu hidden">
          <div class="${state.categoryManagerItemSort === "name" && state.categoryManagerItemSortDir !== "desc" ? "active" : ""}" onclick="setCategoryManagerItemSort('name')"><span>A–Å</span><span>✓</span></div>
          <div class="${state.categoryManagerItemSort === "name" && state.categoryManagerItemSortDir === "desc" ? "active" : ""}" onclick="setCategoryManagerItemSort('name'); toggleCategoryManagerItemSortDir()"><span>Å–A</span><span>✓</span></div>
          <div class="${state.categoryManagerItemSort === "createdAt" ? "active" : ""}" onclick="setCategoryManagerItemSort('createdAt')"><span>Lagt til</span><span>✓</span></div>
          <div class="${state.categoryManagerItemSort === "elo" ? "active" : ""}" onclick="setCategoryManagerItemSort('elo')"><span>Elo</span><span>✓</span></div>
        </div>     </div>

      <div class="categoryManagerItems">
        ${items.map(item => {
          const active = (item.categories || []).includes(selected);
          return `
            <div class="categoryManagerItem ${active ? "active" : ""}" onclick="toggleItemInCategory(${item.id})">
              <span>${item.name}</span>
              <span class="categoryManagerCheck">${active ? "✓" : ""}</span>
            </div>
          `;
        }).join("") || '<div style="opacity:.5;padding:15px;">Ingen items funnet</div>'}
      </div>
    ` : '<p style="opacity:.5;">Opprett en kategori først.</p>'}
  `;
}

export function toggleCategoryManagerDropdown(){
  const menu = document.getElementById("categoryManagerDropdownMenu");
  if(!menu) return;
  menu.classList.toggle("hidden");
}
