import { state } from "./state.js";

export function startTournament(){

  const t = state.tournament;

  let pool = [...state.items];

  if(t.mode === "category"){
    pool = pool.filter(i =>
      i.categories.includes(t.category)
    );
  }

  shuffle(pool);

  t.participants = pool.slice(0, t.size);

  t.matches = createBracket(t.participants);

  t.phase = "active";
  t.currentMatch = 0;

  renderTournament();
}

export function openTournamentHub(){
  state.tournament.phase = "hub";
  renderTournament();
}

export function selectTournamentMode(mode){
  state.tournament.mode = mode;
  state.tournament.phase = "setup";
  renderTournament();
}

function createBracket(players){
  const matches = [];

  for(let i = 0; i < players.length; i += 2){
    matches.push({
      a: players[i],
      b: players[i+1],
      winner: null
    });
  }

  return matches;
}

function renderTournament(){

  const t = state.tournament;

  const root =
    document.getElementById("tournamentSection");

  if(!root) return;

  if(t.phase === "hub"){
    root.innerHTML = `
      <h3>🏆 Tournament</h3>

      <button onclick="selectTournamentMode('random')">
        Random
      </button>

      <button onclick="selectTournamentMode('category')">
        Category
      </button>
    `;
  }

  if(t.phase === "setup"){
    root.innerHTML = `
      <h3>Setup</h3>

      <button onclick="state.tournament.size=8">8</button>
      <button onclick="state.tournament.size=16">16</button>

      <button onclick="startTournament()">
        Start
      </button>
    `;
  }

  if(t.phase === "active"){
    const m = t.matches[t.currentMatch];

    root.innerHTML = `
      <h3>Round ${t.round}</h3>

      <button onclick="pickWinner('a')">
        ${m.a.name}
      </button>

      VS

      <button onclick="pickWinner('b')">
        ${m.b.name}
      </button>
    `;
  }
}
