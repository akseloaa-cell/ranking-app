import { state } from "./state.js";
import { toggleCat } from "./categories.js";

export function openAddItem(){
  const overlay = document.getElementById("addOverlay");
  const view = document.getElementById("addView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);
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
}

export function scrollToTop(){
  document.getElementById("rankingView").scrollTop = 0;
}

import { state } from "./state.js";

export function renderChips(filter = "", targetId = "chipBox", mode = "select", itemId = null){
  const box = document.getElementById(targetId);
  if(!box) return;

  const f = filter.toLowerCase();

  let list = state.categories
    .filter(c => c.includes(f));

  // 🔥 begrens visning
  if(!state.showAllChips){
    list = list.slice(0, 6);
  }

  const selected = itemId
    ? (state.items.find(x => x.id === itemId)?.categories || [])
    : [];

  box.innerHTML =
    list.map(c => {

      let active = "";

      if(mode === "select"){
        active = selected.includes(c) ? "active" : "";
      }

      return `
        <span class="chip ${active}"
          onclick="${
            mode === "select"
              ? `toggleChip(this)`
              : `addCatToItem(${itemId}, '${c}')`
          }">
          ${c}
        </span>
      `;
    }).join("") +

    (state.categories.length > 6 ? `
      <span class="chip"
        style="background:#4f8cff;color:white;font-weight:bold;"
        onclick="toggleAllChips('${targetId}', '${mode}', ${itemId || 'null'})">
        ${state.showAllChips ? "−" : "+"}
      </span>
    ` : "");
}

export function toggleAllChips(){
  state.showAllChips = !state.showAllChips;
  renderChips();
}
