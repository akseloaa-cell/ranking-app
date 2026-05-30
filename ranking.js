import { state } from "./state.js"; 

/* ================= HELPERS ================= */

function getCategorySorted(cat){
  return [...state.items]
    .filter(x => (x.categories || []).includes(cat))
    .sort((a,b)=>b.rating-a.rating);
}

function getPrevRank(item){
  if(state.rankingFilter === "all"){
    return state.previousRanking?.[item.id];
  }

  return state.previousRankingByCategory
    ?. [state.rankingFilter]
    ?. [item.id];
}

function isNewToday(item){
  if(!item.createdAt) return false;
  const today = new Date().toISOString().split("T")[0];
  return item.createdAt.split("T")[0] === today;
}

export function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}

function ensureHomeRenderClean(){
  const container = document.querySelector(".vs");
  if(container){
    container.innerHTML = "";
  }
}

function renderDailyMVPCard(){
  const mvp = getDailyMVP();

  if(!mvp) return "";

  const currentRank = getRank(mvp.item.id);
  const elo = Math.floor(mvp.item.rating);

  return `
    <div onclick="showStats(${mvp.item.id})"
      style="display:flex;justify-content:space-between;align-items:center;
      padding:6px 10px;background:#172238;border:1px solid #4f8cff;
      border-radius:10px;margin:4px 0 8px 0;cursor:pointer;font-size:13px;">

      <span style="display:flex;align-items:center;gap:6px;">
        <span style="color:#4f8cff;font-weight:bold;">MVP</span>
        <b>#${currentRank}</b>
        ${mvp.item.name}
      </span>

      <span style="display:flex;align-items:center;gap:8px;opacity:0.9;">
        <span>${elo}</span>
        <span style="color:#4caf50;font-weight:bold;">▲ ${mvp.diff}</span>
      </span>
    </div>
  `;
}
/* ================= MAIN TOP 10 ================= */

export function update(){
  
  if(state.mode !== "home") return;
  
  const list = [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .slice(0, 10);

  const html = list.map((item,i)=>{

    const currentRank = i + 1;
    const prevRank = state.previousRanking?.[item.id];

    let indicator = "";

    if(isNewToday(item)){
      indicator = `<span style="
        background:#4f8cff;
        color:white;
        padding:2px 6px;
        border-radius:6px;
        font-size:11px;
        font-weight:bold;
      ">NY</span>`;
    }
    else if(prevRank !== undefined){
      const diff = prevRank - currentRank;

      if(diff > 0){
        indicator = `<span style="color:#4caf50;">▲ ${diff}</span>`;
      } else if(diff < 0){
        indicator = `<span style="color:#f44336;">▼ ${Math.abs(diff)}</span>`;
      }
    }

    return `
      <div onclick="showStats(${item.id})"
        style="display:flex;justify-content:space-between;align-items:center;
        padding:6px 10px;background:#141a26;border:1px solid #2a3142;
        border-radius:10px;margin:4px 0;cursor:pointer;font-size:14px;">

        <span style="display:flex;align-items:center;gap:6px;">
          ${indicator}
          <b>#${currentRank}</b>
          ${item.name}
        </span>

        <span style="opacity:0.7;">
          ${Math.floor(item.rating)}
        </span>

      </div>
    `;
  }).join("");

  document.getElementById("ranking").innerHTML = renderDailyMVPCard() + html;
  document.getElementById("a").innerHTML = "";
document.getElementById("b").innerHTML = "";
  
}

/* ================= FULL RANKING ================= */
export function openRankingView(){
  const overlay = document.getElementById("rankingOverlay");
  const view = document.getElementById("rankingView");

  if(!overlay || !view) return;

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);

  renderRankingView();
}

export function renderRankingView(){

  let list;

  if(state.rankingFilter === "all"){
    list = [...state.items].sort((a,b)=>b.rating-a.rating);
  } else {
    list = getCategorySorted(state.rankingFilter);
  }

  if(state.rankingSort === "wins"){
    list.sort((a,b)=>(b.tournamentWins||0)-(a.tournamentWins||0));
  }

  if(state.rankingSort === "top3"){
    list.sort((a,b)=>(b.top3||0)-(a.top3||0));
  }

  const html = list.map((item,i)=>{

    const currentRank = i + 1;
    const prevRank = getPrevRank(item);

    let indicator = "";

    if(isNewToday(item)){
      indicator = `<span style="
        background:#4f8cff;
        color:white;
        padding:2px 6px;
        border-radius:6px;
        font-size:11px;
        font-weight:bold;
      ">NY</span>`;
    }
    else if(prevRank !== undefined){
      const diff = prevRank - currentRank;

      if(diff > 0){
        indicator = `<span style="color:#4caf50;">▲ ${diff}</span>`;
      } else if(diff < 0){
        indicator = `<span style="color:#f44336;">▼ ${Math.abs(diff)}</span>`;
      }
    }

    return `
      <div onclick="showStats(${item.id})"
        style="display:flex;justify-content:space-between;align-items:center;
        padding:12px;margin:6px 0;background:#1f1f1f;
        border-radius:12px;cursor:pointer;">

        <div style="display:flex;gap:8px;align-items:center;">
          ${indicator}
          <b>#${currentRank}</b>
          <span>${item.name}</span>
        </div>

        <span>${Math.floor(item.rating)}</span>
      </div>
    `;
  }).join("");

  document.getElementById("rankingViewList").innerHTML =
    "<h3>🏆 Full ranking</h3>" + html;

  renderRankingFilters();
}

export function closeRankingView(){
  const overlay = document.getElementById("rankingOverlay");
  const view = document.getElementById("rankingView");

  if(!overlay || !view) return;

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

/* ================= MVP ================= */

export function getDailyMVP(){

  if(!state.previousRanking) return null;

  const sorted = [...state.items]
    .sort((a,b)=>b.rating-a.rating);

  let best = null;
  let bestDiff = 0;

  sorted.forEach((item, i) => {

    const currentRank = i + 1;
    const prevRank = state.previousRanking[item.id];

    if(prevRank === undefined) return;

    const diff = prevRank - currentRank;

    if(diff > bestDiff){
      bestDiff = diff;
      best = { item, diff };
    }
  });

  return best;
}

/* ================= FILTER ================= */

export function renderRankingFilters(search = ""){

  const container = document.getElementById("rankingFilters");
  if(!container) return;

  const f = search.toLowerCase();

  let cats = ["all", ...state.categories]
    .filter(c => c.toLowerCase().includes(f))
    .slice(0, state.showAllRankingChips ? 999 : 6);

const chips = cats.map(c => `
  <span onclick="setRankingFilter('${c}')"
    class="chip"
    style="background:${state.rankingFilter === c ? '#4f8cff' : '#222'}">
    ${c}
  </span>
`).join("");

const toggle =
  state.categories.length > 6
    ? `
      <span class="chip"
        onclick="toggleRankingChips()"
        style="background:#4f8cff;color:white;font-weight:bold;">
        ${state.showAllRankingChips ? "−" : "+"}
      </span>
    `
    : "";

container.innerHTML = chips + toggle;
}
/* ================= ACTIONS ================= */

export function setRankingFilter(cat){
  state.rankingFilter = cat;
  renderRankingView();
}

export function setSort(type){
  state.rankingSort = type;
  renderRankingView();
}

export function toggleRankingChips(){
  state.showAllRankingChips = !state.showAllRankingChips;
  renderRankingFilters();
}

/* ================= GLOBAL EXPORT ================= */

window.renderRankingFilters = renderRankingFilters;
window.setRankingFilter = setRankingFilter;
window.toggleRankingChips = toggleRankingChips;
