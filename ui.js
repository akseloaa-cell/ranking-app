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
        onclick="toggleChips('${targetId}', '${mode}', ${itemId || 'null'})">
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
