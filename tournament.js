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

  // HUB

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

    renderBracket();

    return;

  }

  // SETUP

  if (state.tournament.phase === "setup") {

    const categories =
      [...new Set(
        state.items.flatMap(
          x => x.categories || []
        )
      )];

    const pool =
      getTournamentPool();

    const sizes =
      getAllowedSizes(
        pool.length
      );

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

${categories.map(cat=>`

<option
value="${cat}"
>
${cat}
</option>

`).join("")}

</select>

`

:

""
}

<p>Antall deltakere</p>

<select id="tournamentSize">

${sizes.map(s=>`

<option
value="${s}"
>
${s}
</option>

`).join("")}

</select>

<br><br>

<button
onclick="
confirmTournamentSetup()
"
>
Start
</button>

`;

    renderBracket();

    return;

  }

  // ACTIVE

  if (
    state.tournament.phase
    ===
    "active"
  ){

    const match =
      state
      .tournament
      .matches[
        state
        .tournament
        .currentMatch
      ];

    root.innerHTML = `

<div>

Round
${state.tournament.round}

</div>

<div style="
margin-bottom:16px;
opacity:.7;
">

Match

${
state.tournament.currentMatch
+
1
}

/

${
state.tournament.matches.length
}

</div>

<button
onclick="
pickWinner('a')
"
>

${match.a.name}

</button>

<br><br>

VS

<br><br>

<button
onclick="
pickWinner('b')
"
>

${match.b.name}

</button>

`;

    renderBracket();

    return;

  }

}

function renderBracket(){

  const root =
    document.getElementById(
      "bracketView"
    );

  if(!root) return;

  const t =
    state.tournament;

  if(
    !t.matches
    ||
    !t.matches.length
  ){

    root.innerHTML = "";

    return;

  }

  root.innerHTML = `

<h3>
Round ${t.round}
</h3>

${t.matches.map((m,i)=>`

<div
class="
bracketMatch
${
i===t.currentMatch
?
" active"
:
""
}
">

<div>

${m.a.name}

</div>

<div>

${m.b.name}

</div>

</div>

`).join("")}

`;

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

const maxPossible = pool.length;

// gjør size trygg
const safeSize = Math.min(
  state.tournament.size,
  maxPossible
);

// sørg for partall (viktig for matches)
const evenSize =
  safeSize % 2 === 0
    ? safeSize
    : safeSize - 1;

state.tournament.participants =
  pool.slice(0, evenSize);

  state.tournament.round = 1;

state.tournament.currentMatch = 0;

state.tournament.matches = [];

for(
  let i = 0;
  i <
  state.tournament.participants.length;
  i += 2
){

  state.tournament.matches.push({

    a:
      state.tournament
      .participants[i],

    b:
      state.tournament
      .participants[
        i + 1
      ]

  });

}
  
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

export function pickWinner(side){

  const t = state.tournament;

  const match = t.matches[t.currentMatch];

  const winner =
    side === "a" ? match.a : match.b;

  const currentRound =
  state.tournament.bracketHistory[
    state.tournament.round - 1
  ];

const matchIndex =
  state.tournament.currentMatch;

if (currentRound?.matches[matchIndex]) {
  currentRound.matches[matchIndex].winner = winner;
}
  
  // 1. legg til vinner i neste runde pool
  t.nextRoundPool.push(winner);

  // 2. gå til neste match
  t.currentMatch++;

  // hvis runden ikke er ferdig
  if (t.currentMatch < t.matches.length) {
    renderTournament();
    return;
  }

  // hvis runden er ferdig → lag ny runde

  t.participants = t.nextRoundPool;

  t.nextRoundPool = [];

  t.currentMatch = 0;

  t.round++;

  createNextRound();

  renderTournament();
}

function getTournamentPool(){

  let pool = [...state.items];

  if (state.tournament.mode === "category") {

    pool = pool.filter(item =>
      item.categories?.includes(
        state.tournament.category
      )
    );

  }

  return pool;

}

function getAllowedSizes(poolLength){

  const baseSizes = [4, 8, 16, 32];

  return baseSizes.filter(size =>
    size <= poolLength
  );

}

function createNextRound(){

  const p = state.tournament.participants;

  const matches = [];

  for (let i = 0; i < p.length; i += 2) {
    matches.push({
      a: p[i],
      b: p[i + 1]
    });
  }

  state.tournament.matches = matches;
  state.tournament.bracketHistory.push({
  round: state.tournament.round,
  matches: state.tournament.matches.map(m => ({
    a: m.a,
    b: m.b,
    winner: null
  }))
});
}

