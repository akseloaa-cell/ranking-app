export const state = {
  mode: "home",
  items: JSON.parse(localStorage.getItem("items")) || [],
  categories: JSON.parse(localStorage.getItem("categories")) || [],
  current: [],
  previousRanking: JSON.parse(localStorage.getItem("previousRanking")) || {},
  previousRankingByCategory: JSON.parse(localStorage.getItem("previousRankingByCategory")) || {},
  lastRankingDate: localStorage.getItem("lastRankingDate") || null,
  recentMatches: JSON.parse(localStorage.getItem("recentMatches")) || [],

  showAllAddChips: false,
  showAllStatsChips: false,
  showAllRankingChips: false,
  showAllH2H: false,
  h2hSearch: "",
  rankingFilter: "all",
  rankingSort: "elo",
  selectedCategories: [],
  categorySortType: "items",
  categorySortDir: "desc",

  tournament: {
    phase: "hub",
    mode: null,
    category: null,
    size: 8,
    participants: [],
    matches: [],
    round: 1,
    currentMatch: 0,
    nextRoundPool: [],
    bracketHistory: [],
    dailyDate: null,
    dailyCompletedDate: null,
    showTournamentHub: false
  },

  scenarioRanking: {
    selectedCategories: [],
    categorySearch: "",
    itemCount: 5,
    rankingType: "free",
    scenarioIndex: -1,
    mode: "ranking",
    activeItems: [],
    rankedItems: [],
    lockedCount: 0,
    activeScenario: "",
    endlessScenarioOrder: "random",
    tournamentMode: "random",
    tournamentSize: 8,
    tournamentScenarioMode: "new"
  }
};

export function commit(changeFn) {
  changeFn();
}

export const STATE_VERSION = 1;
