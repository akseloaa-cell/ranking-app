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
import {  openAddItem, closeAddItem } from "./ui.js";
import { openRankingView } from"./ranking.js";

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

// start
update();
nextMatch();
