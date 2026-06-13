import { state } from "./state.js";

export function startTournament() {
  state.mode = "tournament";

  document.getElementById("homeView").style.display = "none";

  document.getElementById("categorySelectView").style.display = "none";

  document.getElementById("tournamentSection").style.display = "block";

  console.log("Tournament åpnet");
}
