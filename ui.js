import { state } from "./state.js";

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

export function closeAddItem(){
  document.getElementById("addOverlay").style.display = "none";
}

import { state } from "./state.js";
import { toggleCat } from "./categories.js";

export function renderChips(filter = ""){
  const box = document.getElementById("chipBox");
  if(!box) return;

  const f = filter.toLowerCase();

  let list = state.categories
    .filter(c => c.includes(f));

  // 👇 begrens hvis ikke expanded
  if(!state.showAllChips){
    list = list.slice(0, 10);
  }

  box.innerHTML =
    list.map(c => `
      <span class="chip"
        onclick="toggleCat(this)"
        style="
          background:#222;
          padding:6px 10px;
          border-radius:999px;
          cursor:pointer;
          font-size:12px;
          display:inline-block;
          margin:3px;
        ">
        ${c}
      </span>
    `).join("") +

    (state.categories.length > 10 ? `
      <span onclick="toggleAllChips()"
        style="
          background:#4f8cff;
          color:white;
          font-weight:bold;
          padding:6px 10px;
          border-radius:999px;
          cursor:pointer;
          font-size:12px;
          display:inline-block;
          margin:3px;
        ">
        ${state.showAllChips ? "−" : "+"}
      </span>
    ` : "");
}
