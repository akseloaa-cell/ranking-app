import { nextMatch } from "./match.js";
import { update } from "./ranking.js";
import { showStats, closeStats } from "./stats.js";
import * as ui from "./ui.js";
import * as stats from "./stats.js";
import * as tournament from "./tournament.js";
import {
  renameItem,
  deleteItem,
  addCatToItem,
  removeCatFromItem,
  renderStatsChips,
  toggleCatSection
} from "./stats.js";
import { renderChips, toggleAllChips } from "./ui.js";
import { 
  openRankingView,
  closeRankingView,
  setSort,
  setRankingFilter
} from "./ranking.js";
import { openAddItem, closeAddItem } from "./ui.js";

window.toggleMenu = ui.toggleMenu;
window.setMode = ui.setMode;
window.showStats = stats.showStats;
window.closeStats = stats.closeStats;
window.startTournament = tournament.startTournament;
window.scrollToTop = ui.scrollToTop;
window.showStats = showStats;
window.closeStats = closeStats;
window.renameItem = renameItem;
window.deleteItem = deleteItem;
window.addCatToItem = addCatToItem;
window.removeCatFromItem = removeCatFromItem;
window.renderStatsChips = renderStatsChips;
window.toggleCatSection = toggleCatSection;
window.renderChips = renderChips;
window.toggleAllChips = toggleAllChips;
window.update = update;
window.openAddItem = openAddItem;
window.closeAddItem = closeAddItem;
window.openRankingView = openRankingView;
window.closeRankingView = closeRankingView;
window.openRankingView = openRankingView;
window.closeRankingView = closeRankingView;
window.setSort = setSort;
window.setRankingFilter = setRankingFilter;
window.renderChips = (filter) =>
  ui.renderChips({
    filter,
    targetId: "chipBox",
    mode: "select"
  });

window.toggleChips = ui.toggleChips;
window.toggleChip = ui.toggleChip;
window.addCatToItem = stats.addCatToItem;
window.setRankingFilter = ranking.setRankingFilter;

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

// start
update();
nextMatch();
saveDailyRanking();
