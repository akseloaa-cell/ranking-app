function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if(raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch(error) {
    console.warn("Could not read localStorage key:", key, error);
    return fallback;
  }
}

export const state = {
  mode: "home",
  items: readLocalJSON("items", []),
  categories: readLocalJSON("categories", []),
  current: [],
  previousRanking: readLocalJSON("previousRanking", {}),
  previousRankingByCategory: readLocalJSON("previousRankingByCategory", {}),
  lastRankingDate: localStorage.getItem("lastRankingDate") || null,
  previousScenarioRanking: readLocalJSON("previousScenarioRanking", {}),
  lastScenarioRankingDate: localStorage.getItem("lastScenarioRankingDate") || null,
  recentMatches: readLocalJSON("recentMatches", []),

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
    tournamentScenarioMode: "new",
    endlessScenarioMode: "fixed",
    endlessFixedScenario: "",
    endlessWins: 0,
    endlessGames: 0,
    endlessPreviousItemIds: [],
    endlessPreviousRanks: {}
  },

  scenarioStats: {
    games: 0,
    byItem: {},
    byScenario: {}
  }
};

export function commit(changeFn) {
  changeFn();
}

export const STATE_VERSION = 1;
