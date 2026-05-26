import { state } from "./state.js"; 
import { nextMatch } from "./match.js";
import { update } from "./ranking.js";
import * as ui from "./ui.js";
import * as stats from "./stats.js";
import * as tournament from "./tournament.js";
import { addItem } from "./items.js";
import { addCategory } from "./categories.js";
import {
  renameItem,
  deleteItem,
  addCatToItem,
  removeCatFromItem,
  renderStatsChips,
  toggleStatsChips,
  toggleCatSection,
} from "./stats.js";
import { renderChips, toggleAllChips } from "./ui.js";
import { 
  openRankingView,
  closeRankingView,
  setSort,
  setRankingFilter,
  toggleRankingChips
} from "./ranking.js";
import { openAddItem, closeAddItem } from "./ui.js";
import { draw } from "./match.js";
import {
  openCategoryVs,
  exitCategoryVs,
  backToCategorySelect
} from "./categoryVs.js";
 
window.toggleMenu = ui.toggleMenu;
window.setMode = ui.setMode;
window.setActiveMenu = ui.setActiveMenu;

window.showStats = stats.showStats;
window.closeStats = stats.closeStats;

window.startTournament = tournament.startTournament;

window.scrollToTop = ui.scrollToTop;

window.renameItem = renameItem;
window.deleteItem = deleteItem;

window.addCatToItem = addCatToItem;
window.removeCatFromItem = removeCatFromItem;

window.renderStatsChips = renderStatsChips;
window.toggleStatsChips = toggleStatsChips;
window.toggleCatSection = toggleCatSection;

window.renderChips = ui.renderChips;

window.toggleAllChips = toggleAllChips;
window.toggleChip = ui.toggleChip;

window.update = update;

window.openAddItem = openAddItem;
window.closeAddItem = closeAddItem;
window.addItem = addItem;
window.addCategory = addCategory;

window.openRankingView = openRankingView;
window.closeRankingView = closeRankingView;

window.setSort = setSort;
window.setRankingFilter = setRankingFilter;

window.draw = draw;
window.state = state;

window.toggleRankingChips = toggleRankingChips;

window.openCategoryVs = openCategoryVs;

window.exitCategoryVs = exitCategoryVs;
window.backToCategorySelect = backToCategorySelect;

export function saveDailyRanking(){
  const today = new Date().toISOString().split("T")[0];

  // 🚫 ikke overskriv samme dag
  if(state.lastRankingDate === today) return;

  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  const rankingMap = {};
  sorted.forEach((item, i) => {
    rankingMap[item.id] = i + 1;
  });

  state.previousRanking = rankingMap;
  state.lastRankingDate = today;

  localStorage.setItem("previousRanking", JSON.stringify(rankingMap));
  localStorage.setItem("lastRankingDate", today);
}

state.previousRankingByCategory = {};

state.categories.forEach(cat => {
  const list = state.items
    .filter(x => (x.categories || []).includes(cat))
    .sort((a,b)=>b.rating-a.rating);

  state.previousRankingByCategory[cat] = {};

  list.forEach((x,i)=>{
    state.previousRankingByCategory[cat][x.id] = i + 1;
  });
});

state.items.forEach(i => {
  if(!i.h2h) i.h2h = {};

  Object.keys(i.h2h).forEach(id => {
    const h = i.h2h[id];

    // gammel struktur
    if(h.w !== undefined || h.l !== undefined){
      i.h2h[id] = {
        wins: h.w || 0,
        losses: h.l || 0,
        draws: h.d || 0
      };
    } else {
      h.wins = h.wins || 0;
      h.losses = h.losses || 0;
      h.draws = h.draws || 0;
    }
  });
});

// start
update();
nextMatch();
saveDailyRanking();
