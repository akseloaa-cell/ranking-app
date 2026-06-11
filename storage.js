import { state } from "./state.js";

export function save(){
  localStorage.setItem("items", JSON.stringify(state.items));
  localStorage.setItem("categories", JSON.stringify(state.categories));
  localStorage.setItem("recentMatches", JSON.stringify(state.recentMatches));
  localStorage.setItem("dailyTournament", JSON.stringify(state.tournament));
  localStorage.setItem("previousRanking", JSON.stringify(state.previousRanking));
  localStorage.setItem("previousRankingByCategory", JSON.stringify(state.previousRankingByCategory));
  localStorage.setItem("lastRankingDate", state.lastRankingDate);
}

function load() {
  const raw = localStorage.getItem("rankingApp");
  if (!raw) return null;

  const data = JSON.parse(raw);

  if (data.version !== STATE_VERSION) {
    console.warn("State version mismatch – resetting or migrating");
    return null;
  }

  return data;
}
