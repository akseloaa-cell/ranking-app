export const state = {
  mode: "home",
  items: JSON.parse(localStorage.getItem("items")) || [],
  categories: JSON.parse(localStorage.getItem("categories")) || [],
  current: [],
  tournament: JSON.parse(localStorage.getItem("dailyTournament")) || null,
  previousRanking: JSON.parse(localStorage.getItem("previousRanking")) || {},
  previousRankingByCategory: JSON.parse(localStorage.getItem("previousRankingByCategory")) || {},
  lastRankingDate: localStorage.getItem("lastRankingDate") || null,
  recentMatches: JSON.parse(localStorage.getItem("recentMatches")) || [],

   showAllAddChips: false,
  showAllStatsChips: false,
  showAllRankingChips: false,
  rankingFilter: "all",
  rankingSort: "elo"
};
