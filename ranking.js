import { state } from "./state.js";
import { showStats } from "./stats.js";

export function update(){

  let list = [...state.items].sort((a,b)=>b.rating-a.rating);

  const html = list.map((x,i)=>{
    const currentRank = i + 1;

    const prevRank = state.previousRanking?.[x.id];

    let indicator = "";

    if(prevRank !== undefined){
      const diff = prevRank - currentRank;

      if(diff > 0){
        indicator = `<span style="color:#4caf50;">▲ ${diff}</span>`;
      } 
      else if(diff < 0){
        indicator = `<span style="color:#f44336;">▼ ${Math.abs(diff)}</span>`;
      }
    }

    return `
 <div onclick="showStats(${x.id})"
  style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:10px;
    background:#141a26;
    border:1px solid #2a3142;
    border-radius:10px;
    margin:6px 0;
    cursor:pointer;
  ">

  <div style="display:flex; gap:8px; align-items:center;">
    <span>${indicator}</span>
    <b>#${currentRank}</b>
    <span>${x.name}</span>
  </div>

  <span> ${Math.floor(x.rating)}</span>

</div>

    `;
  }).join("");

  // 🔥 MVP etterpå
  const mvp = getDailyMVP();

  let mvpHtml = "";

  if(mvp){
    mvpHtml = `
      <div style="
        width:80%;
        margin:10px auto;
        padding:12px;
        background:#1f1f1f;
        border-radius:12px;
        text-align:center;
        font-weight:bold;
      ">
        🔥 Dagens MVP: ${mvp.item.name} (+${mvp.diff})
      </div>
    `;
  }

  document.getElementById("ranking").innerHTML =
    mvpHtml + html;
}

export function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}

export function setSort(type){
  state.rankingSort = type;
  update();
}

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

  // 🔹 SORTERING
  if(state.rankingSort === "elo"){
    list.sort((a,b)=>b.rating-a.rating);
  }

  if(state.rankingSort === "wins"){
    list.sort((a,b)=>(b.tournamentWins||0)-(a.tournamentWins||0));
  }

  if(state.rankingSort === "top3"){
    list.sort((a,b)=>(b.top3||0)-(a.top3||0));
  }

  // 🔹 HTML
  const html = list.map((x,i)=>`
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

  `).join("");

  document.getElementById("rankingViewList").innerHTML =
    "<h3>🏆 Full ranking</h3>" + html;

  renderRankingFilters();
}

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
