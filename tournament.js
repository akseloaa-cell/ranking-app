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
  
if (state.tournament.phase === "hub") {

  root.innerHTML = `

<h3>
Velg gamemode
</h3>

<button
onclick="selectTournamentMode('random')"
>
🎲 Random
</button>

<br><br>

<button
onclick="selectTournamentMode('category')"
>
🏷️ Category
</button>

`;

}
  
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

  if (
  state.tournament.phase
  ===
  "active"
){

root.innerHTML = `

<h3>
Turnering startet
</h3>

<p>

Deltakere:

${
state.tournament
.participants
.length
}

</p>

`;

}
  
}

export function startTournament(){

  let pool = [...state.items];

  if (
    state.tournament.mode ===
    "category"
  ){

    pool = pool.filter(item =>

      item.categories?.includes(
        state.tournament.category
      )

    );

  }

  pool = shuffle(pool);

  state.tournament.participants =
    pool.slice(
      0,
      state.tournament.size
    );

  state.tournament.phase =
    "active";

  renderTournament();

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

function shuffle(arr){

  const copy = [...arr];

  for(
    let i = copy.length - 1;
    i > 0;
    i--
  ){

    const j =
      Math.floor(
        Math.random()
        *
        (i + 1)
      );

    [copy[i], copy[j]] =
    [copy[j], copy[i]];

  }

  return copy;

}
