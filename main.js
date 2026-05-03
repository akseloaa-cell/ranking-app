import { nextMatch } from "./match.js";
import { update } from "./ranking.js";
import { showStats, closeStats } from "./stats.js";
import * as ui from "./ui.js";
import * as stats from "./stats.js";
import * as tournament from "./tournament.js";

window.toggleMenu = ui.toggleMenu;
window.setMode = ui.setMode;
window.showStats = stats.showStats;
window.closeStats = stats.closeStats;
window.startTournament = tournament.startTournament;
window.scrollToTop = ui.scrollToTop;
window.showStats = showStats;
window.closeStats = closeStats;

// start
update();
nextMatch();
