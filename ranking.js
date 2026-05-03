import { state } from "./state.js";
import { showStats } from "./stats.js";

export function update(){
  const list = [...state.items].sort((a,b)=>b.rating-a.rating);

  const html = list.map((x,i)=>`
    <div onclick="showStats(${x.id})"
      style="padding:12px;margin:6px 0;background:#1f1f1f;border-radius:12px;cursor:pointer;">
      <b>#${i+1}</b> ${x.name}
      <span style="float:right;">${Math.floor(x.rating)}</span>
    </div>
  `).join("");

  document.getElementById("ranking").innerHTML = html;
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
        padding:12px;
        margin:6px 0;
        background:#1f1f1f;
        border-radius:12px;
        cursor:pointer;
      ">
      <b>#${i+1}</b> ${x.name}
      <span style="float:right;">
        ⭐ ${Math.floor(x.rating)}
      </span>
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
