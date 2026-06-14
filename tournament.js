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

if (state.tournament.phase === "setup") {

  const categories =
    [...new Set(
      state.items.flatMap(
        x => x.categories || []
      )
    )];

  root.innerHTML = `

<button onclick="backTournament()">
← Tilbake
</button>

<h3>
${state.tournament.mode}
</h3>

${
state.tournament.mode === "category"

?

`

<p>Velg kategori</p>

<select
id="tournamentCategory"
>

${categories.map(cat=>

`
<option
value="${cat}"
>
${cat}
</option>
`

).join("")}

</select>

`

:

""
}

<p>Antall deltakere</p>

<select
id="tournamentSize"
>

<option>4</option>

<option selected>
8
</option>

<option>
16
</option>

<option>
32
</option>

</select>

<br><br>

<button
onclick="confirmTournamentSetup()"
>
Start
</button>

`;

}

}

export function startTournament(){

  console.log("MODE:",
    state.tournament.mode
  );

  console.log("CATEGORY:",
    state.tournament.category
  );

  console.log("SIZE:",
    state.tournament.size
  );

}

export function confirmTournamentSetup(){

  const size =
    document.getElementById(
      "tournamentSize"
    );

  if(size){

    state.tournament.size =
      Number(
        size.value
      );

  }

  if(
    state.tournament.mode
    ===
    "category"
  ){

    const cat =
      document.getElementById(
        "tournamentCategory"
      );

    if(cat){

      state.tournament.category =
        cat.value;

    }

  }

  startTournament();

}

export function backTournament(){

  state.tournament.phase = "hub";

  state.tournament.mode = null;

  state.tournament.category = null;

  renderTournament();

}
