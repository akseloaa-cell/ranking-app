import { state } from "./state.js";

export function startTournament() {

  const bracket =
    document.getElementById("bracket");

  if (!bracket) return;

  bracket.innerHTML = "";

  if (state.items.length < 2) {
    bracket.innerHTML =
      "Minst 2 items kreves";
    return;
  }

  const players =
    [...state.items];

  shuffle(players);

  for (let i = 0; i < players.length; i += 2) {

    const a = players[i];

    const b = players[i + 1];

    if (!b) break;

    const match =
      document.createElement("div");

    match.className =
      "tournamentMatch";

    match.innerHTML =
      `
      <button>
        ${a.name}
      </button>

      VS

      <button>
        ${b.name}
      </button>
      `;

    bracket.appendChild(match);

  }

}

function shuffle(arr){

  for(
    let i = arr.length - 1;
    i > 0;
    i--
  ){

    const j =
      Math.floor(
        Math.random()
        *
        (i + 1)
      );

    [arr[i], arr[j]] =
      [arr[j], arr[i]];

  }

}
