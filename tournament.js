import { state } from "./state.js";

export function selectTournamentMode(mode){

  state.tournament.mode = mode;

  state.tournament.phase = "setup";

  renderTournament();

}

function renderTournament(){

  const root =
    document.getElementById(
      "tournamentContent"
    );

  if(!root) return;

  if(
    state.tournament.phase
    ===
    "setup"
  ){

    root.innerHTML = `

<h3>
${state.tournament.mode}
</h3>

<p>
Velg antall deltakere
</p>

<button onclick="
state.tournament.size=8
">
8
</button>

<button onclick="
state.tournament.size=16
">
16
</button>

<button onclick="
startTournament()
">
Start
</button>

`;

  }

}

export function startTournament(){

  console.log(
    state.tournament
  );

}
