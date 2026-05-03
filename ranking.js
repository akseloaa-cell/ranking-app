import { state } from "./state.js";

/* ================= MAIN RANKING ================= */

export function update(){

  let list = [...state.items].sort((a,b)=>b.rating-a.rating);

  const html = list.map((x,i)=>{
    const currentRank = i + 1;
    const prevRank = state.previousRanking?.[x.id];

let indicator = "";

// 🆕 NY badge
if(isNewToday(x)){
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
    indicator = `<span style="color:#4caf50; font-size:12px;">▲ ${diff}</span>`;
  } 
  else if(diff < 0){
    indicator = `<span style="color:#f44336; font-size:12px;">▼ ${Math.abs(diff)}</span>`;
  }
}

return `
  <div onclick="showStats(${x.id})"
    style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:6px 10px;
      background:#141a26;
      border:1px solid #2a3142;
      border-radius:10px;
      margin:4px 0;
      cursor:pointer;
      font-size:14px;
    ">

    <span style="display:flex; align-items:center; gap:6px;">
      ${indicator}
      <b>#${currentRank}</b>
      ${x.name}
    </span>

    <span style="opacity:0.7;">
      ${Math.floor(x.rating)}
    </span>

  </div>
`;
  }).join("");

  // 🔥 MVP
const mvp = getDailyMVP();

let mvpHtml = "";

if(mvp){

  const currentRank = [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === mvp.item.id) + 1;

  const prevRank = state.previousRanking?.[mvp.item.id];

  let mvpIndicator = "";

  if(prevRank !== undefined){
    const diff = prevRank - currentRank;

    if(diff > 0){
      mvpIndicator = `<span style="color:#4caf50; font-size:12px;">▲ ${diff}</span>`;
    } 
    else if(diff < 0){
      mvpIndicator = `<span style="color:#f44336; font-size:12px;">▼ ${Math.abs(diff)}</span>`;
    }
  }

  mvpHtml = `
    <div style="
      width:80%;
      margin:10px auto;
      padding:8px 10px;
      background:#141a26;
      border:1px solid #2a3142;
      border-radius:10px;
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">

      <span style="display:flex; align-items:baseline; gap:8px;">

        <b style="font-size:14px;">
          🔥 ${mvp.item.name}
        </b>

        <span style="font-size:11px; opacity:0.5;">
          #${currentRank} • ⭐ ${Math.floor(mvp.item.rating)}
        </span>

      </span>

      <span>
        ${mvpIndicator}
      </span>

    </div>
  `;
}

  document.getElementById("ranking").innerHTML = mvpHtml + html;
}

/* ================= HELPERS ================= */

export function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}

/* ================= FULL RANKING ================= */

export function openRankingView(){
  const overlay = document.getElementById("rankingOverlay");
  const view = document.getElementById("rankingView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);

  renderRankingView();
}

export function closeRankingView(){
  const overlay = document.getElementById("rankingOverlay");
  const view = document.getElementById("rankingView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

export function renderRankingView(){

  let list = [...state.items];

  // 🔹 FILTER
  if(state.rankingFilter !== "all"){
    list = list.filter(x =>
      (x.categories || []).includes(state.rankingFilter)
    );
  }

  // 🔹 SORT
  if(state.rankingSort === "elo"){
    list.sort((a,b)=>b.rating-a.rating);
  }
  if(state.rankingSort === "wins"){
    list.sort((a,b)=>(b.tournamentWins||0)-(a.tournamentWins||0));
  }
  if(state.rankingSort === "top3"){
    list.sort((a,b)=>(b.top3||0)-(a.top3||0));
  }

  const html = list.map((x,i)=>{
    const currentRank = i + 1;

    let prevRank;

    if(state.rankingFilter === "all"){
      prevRank = state.previousRanking?.[x.id];
    } else {
      prevRank = state.previousRankingByCategory?.[state.rankingFilter]?.[x.id];
    }

  let indicator = "";

// 🆕 NY badge
if(isNewToday(x)){
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
    indicator = `<span style="color:#4caf50; font-size:12px;">▲ ${diff}</span>`;
  } 
  else if(diff < 0){
    indicator = `<span style="color:#f44336; font-size:12px;">▼ ${Math.abs(diff)}</span>`;
  }
}

    return `
      <div onclick="showStats(${x.id})"
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:12px;
          margin:6px 0;
          background:#1f1f1f;
          border-radius:12px;
          cursor:pointer;
        ">

        <div style="display:flex; gap:8px; align-items:center;">
          <span>${indicator}</span>
          <b>#${currentRank}</b>
          <span>${x.name}</span>
        </div>

        <span>${Math.floor(x.rating)}</span>

      </div>
    `;
  }).join("");

  document.getElementById("rankingViewList").innerHTML =
    "<h3>🏆 Full ranking</h3>" + html;

  renderRankingFilters();
}

/* ================= FILTER ================= */

export function renderRankingFilters(){
  const container = document.getElementById("rankingFilters");

  const cats = ["all", ...state.categories];

  container.innerHTML = cats.map(c => `
    <span onclick="setRankingFilter('${c}')"
      style="
        padding:6px 10px;
        margin:4px;
        border-radius:999px;
        background:${state.rankingFilter === c ? '#4f8cff' : '#222'};
        cursor:pointer;
        display:inline-block;
      ">
      ${c}
    </span>
  `).join("");
}

export function setRankingFilter(cat){
  state.rankingFilter = cat;
  renderRankingView();
}

/* ================= SORT ================= */

export function setSort(type){
  state.rankingSort = type;
  renderRankingView();
}

/* ================= MVP ================= */

export function getDailyMVP(){
  if(!state.previousRanking) return null;

  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

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

function isNewToday(item){
  if(!item.createdAt) return false;

  const today = new Date().toISOString().split("T")[0];
  const created = item.createdAt.split("T")[0];

  return today === created;
}

