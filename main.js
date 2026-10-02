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
  toggleH2H,
  searchH2H,
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

import {
  startTournament,
  selectTournamentMode,
  confirmTournamentSetup,
  backTournament,
  pickWinner,
  pickThirdPlaceWinner,
  updateTournamentSizeOptions,
  toggleTournamentDropdown,
  selectTournamentDropdown,
} from "./tournament.js";

import { load } from "./storage.js";

window.startTournament = startTournament;
window.selectTournamentMode = selectTournamentMode;
window.confirmTournamentSetup = confirmTournamentSetup;
window.backTournament = backTournament;
window.pickWinner = pickWinner;
window.pickThirdPlaceWinner = pickThirdPlaceWinner;
window.updateTournamentSizeOptions = updateTournamentSizeOptions;
window.toggleTournamentDropdown = toggleTournamentDropdown;
window.selectTournamentDropdown = selectTournamentDropdown;
window.toggleMenu = ui.toggleMenu;
window.setMode = ui.setMode;
window.setActiveMenu = ui.setActiveMenu;

window.showStats = stats.showStats;
window.closeStats = stats.closeStats;

window.scrollToTop = ui.scrollToTop;

window.renameItem = renameItem;
window.deleteItem = deleteItem;

window.addCatToItem = addCatToItem;
window.removeCatFromItem = removeCatFromItem;

window.renderStatsChips = renderStatsChips;
window.toggleStatsChips = toggleStatsChips;
window.toggleCatSection = toggleCatSection;
window.toggleH2H = toggleH2H;
window.searchH2H = searchH2H;

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

window.closeMenu = ui.closeMenu;

function getTodayKey(){
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildRankingSnapshots(){
  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  const rankingMap = {};
  sorted.forEach((item, i) => {
    rankingMap[item.id] = i + 1;
  });

  const categoryMap = {};
  const allCats = [...new Set(state.items.flatMap(item => item.categories || []))];

  allCats.forEach(cat => {
    categoryMap[cat] = {};

    state.items
      .filter(item => (item.categories || []).includes(cat))
      .sort((a,b)=>b.rating-a.rating)
      .forEach((item, i) => {
        categoryMap[cat][item.id] = i + 1;
      });
  });

  return { rankingMap, categoryMap };
}

export function saveDailyRanking(){
  const today = getTodayKey();

  // 🚫 ikke overskriv samme dag
  if(state.lastRankingDate === today) return;

  const { rankingMap, categoryMap } = buildRankingSnapshots();

  state.previousRanking = rankingMap;
  state.previousRankingByCategory = categoryMap;
  state.lastRankingDate = today;

  localStorage.setItem("previousRanking", JSON.stringify(rankingMap));
  localStorage.setItem("previousRankingByCategory", JSON.stringify(categoryMap));
  localStorage.setItem("lastRankingDate", today);
}

const saved = load();
if(saved) Object.assign(state, saved);

// Always open the app on the Home view, even if another mode was active when it was last closed.
state.mode = "home";

function hydrateTournamentReferences(){
  const t = state.tournament;
  if(!t || !t.originalParticipants?.length) return;
  const byId = new Map(state.items.map(item => [String(item.id), item]));
  const ref = item => byId.get(String(item?.id)) || item;
  t.originalParticipants = t.originalParticipants.map(ref);
  t.participants = (t.participants || []).map(ref);
  t.nextRoundPool = (t.nextRoundPool || []).map(ref);
  t.semiFinalLosers = (t.semiFinalLosers || []).map(ref);
  t.matches = (t.matches || []).map(match => ({...match, a: ref(match.a), b: ref(match.b)}));
  if(t.thirdPlaceMatch) t.thirdPlaceMatch = {...t.thirdPlaceMatch, a: ref(t.thirdPlaceMatch.a), b: ref(t.thirdPlaceMatch.b)};
  if(t.finalResults){
    t.finalResults.first = ref(t.finalResults.first);
    t.finalResults.second = ref(t.finalResults.second);
    t.finalResults.third = ref(t.finalResults.third);
  }
}

hydrateTournamentReferences();

// Migrate old H2H data after loading persisted state.
state.items.forEach(i => {
  if(!i.h2h) i.h2h = {};
  Object.keys(i.h2h).forEach(id => {
    const h = i.h2h[id];
    if(h.w !== undefined || h.l !== undefined){
      i.h2h[id] = { wins: h.w || 0, losses: h.l || 0, draws: h.d || 0 };
    } else {
      h.wins = h.wins || 0;
      h.losses = h.losses || 0;
      h.draws = h.draws || 0;
    }
  });
});

if(!state.previousRankingByCategory || !Object.keys(state.previousRankingByCategory).length){
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

  localStorage.setItem(
    "previousRankingByCategory",
    JSON.stringify(state.previousRankingByCategory)
  );
}

// start
saveDailyRanking();
update();
nextMatch();
