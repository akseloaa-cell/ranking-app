// ================= STATE =================
export const state = {
  mode: "home",
  items: JSON.parse(localStorage.getItem("items")) || [],
  categories: JSON.parse(localStorage.getItem("categories")) || [],
  current: [],
  tournament: JSON.parse(localStorage.getItem("dailyTournament")) || null,
  previousRanking: JSON.parse(localStorage.getItem("previousRanking")) || {},
  lastRankingDate: localStorage.getItem("lastRankingDate") || null,
  previousRankingByCategory: JSON.parse(localStorage.getItem("previousRankingByCategory")) || {},
  recentMatches: JSON.parse(localStorage.getItem("recentMatches")) || [],

  showAllChips: false,
  showAllStatsChips: false,
  rankingFilter: "all",
  rankingSort: "elo"
};

// ================= CLEANUP =================
state.categories = [...new Set(
  state.categories
    .filter(c => typeof c === "string" && c.trim() !== "")
    .map(c => c.trim().toLowerCase())
)];

state.items.forEach(i => {
  if (!i.history) i.history = [];
  if (i.history.length === 0) i.history.push(i.rating || 1000);
  if (!i.h2h) i.h2h = {};
  if (!i.categories) i.categories = [];

  i.categories = [...new Set(
    i.categories
      .filter(c => typeof c === "string" && c.trim() !== "")
      .map(c => c.trim().toLowerCase())
  )];
});

// ================= SAVE =================
export function save(){
  localStorage.setItem("items", JSON.stringify(state.items));
  localStorage.setItem("categories", JSON.stringify(state.categories));
  localStorage.setItem("recentMatches", JSON.stringify(state.recentMatches));
}

import * as ui from "./ui.js";
import * as ranking from "./ranking.js";
import * as tournament from "./tournament.js";
import * as stats from "./stats.js";

window.toggleCat = ui.toggleCat;
window.toggleAllChips = ui.toggleAllChips;
window.setMode = ui.setMode;

window.showStats = stats.showStats;

window.startTournament = tournament.startTournament;

ranking.updateRanking();
ui.renderChips();
ui.renderMode();
