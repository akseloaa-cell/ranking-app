const state = {
  mode: "home",
  items: JSON.parse(localStorage.getItem("items")) || [],
  categories: JSON.parse(localStorage.getItem("categories")) || [],
  current: [],
  tournament: JSON.parse(localStorage.getItem("dailyTournament")) || null,
  previousRanking: JSON.parse(localStorage.getItem("previousRanking")) || {},
  lastRankingDate: localStorage.getItem("lastRankingDate") || null,
  previousRankingByCategory: JSON.parse(localStorage.getItem("previousRankingByCategory")) || {},
  recentMatches: JSON.parse(localStorage.getItem("recentMatches")) || [],
  bracket: [],
  round: 0,
  match: 0,
  showAll: false,

  showAllChips: false,
  showAllStatsChips: false,

  rankingFilter: "all",
  rankingSort: "elo"
};
