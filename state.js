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
  bracket: [],
  round: 0,
  match: 0,
  showAll: false,
  showAllChips: false,
  showAllStatsChips: false,
  rankingFilter: "all",
  rankingSort: "elo"
};

// CLEANUP
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

