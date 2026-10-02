import { state } from "./state.js";
import { save } from "./storage.js";

export function selectTournamentMode(mode){

  state.tournament.mode = mode;

  state.tournament.phase = "setup";

  save();
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

    // In category mode, keep the first category as the active
    // selection until the user chooses another one.
    if (
      state.tournament.mode === "category" &&
      categories.length &&
      !categories.includes(state.tournament.category)
    ) {
      state.tournament.category = categories[0];
    }

    let pool = [...state.items];

    if (state.tournament.mode === "category") {
      pool = pool.filter(item =>
        item.categories?.includes(state.tournament.category)
      );
    }

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

${renderTournamentDropdown("tournamentCategoryDropdown", state.tournament.category || categories[0] || "", categories, "category")}

`

:

""
}

<p>Antall deltakere</p>

${sizes.length
  ? renderTournamentDropdown("tournamentSizeDropdown", sizes.includes(state.tournament.size) ? state.tournament.size : sizes[0], sizes, "size")
  : '<p style="opacity:.6;">Du trenger minst 4 items for å starte en turnering.</p>'
}

<br><br>

<button
onclick="confirmTournamentSetup()"
${sizes.length ? "" : " disabled"}
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

  if (
  state.tournament.phase
  ===
  "finished"
){

const results = state.tournament.finalResults;

const getBoost = (item) => {
  const before = results.beforeRatings?.[item.id] ?? item.rating;
  const after = results.afterRatings?.[item.id] ?? item.rating;
  return after - before;
};

root.innerHTML = `

<h1>🏆 Winner</h1>
<h2>${results.first.name}</h2>
<p>+${getBoost(results.first)} ELO</p>

<hr>

<h3>🥈 2nd Place</h3>
<p>${results.second.name}</p>
<p>+${getBoost(results.second)} ELO</p>

<hr>

<h3>🥉 3rd Place</h3>
<p>${results.third.name}</p>
<p>+${getBoost(results.third)} ELO</p>

<br><br>

<button onclick="backTournament()">
Tilbake
</button>

`;

renderBracket();

return;

}

  if (state.tournament.phase === "thirdPlace") {

  const match = state.tournament.thirdPlaceMatch;

  root.innerHTML = `

<h2>🥉 3rd Place Match</h2>

<button onclick="pickThirdPlaceWinner('a')">
${match.a.name}
</button>

<br><br>VS<br><br>

<button onclick="pickThirdPlaceWinner('b')">
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

  if (
  state.tournament.phase
  !==
  "active"
){

  root.innerHTML = "";

  return;

}
  
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

  let pool = getTournamentPool();

  pool = shuffle(pool);

  const maxPossible = pool.length;

  let size = Math.min(state.tournament.size, maxPossible);

  // sørg for par
  if (size % 2 !== 0) {
    size -= 1;
  }

  const participants = pool.slice(0, size);

  state.tournament.participants = participants;
  state.tournament.originalParticipants = [...participants];

  participants.forEach(item => {
    item.tournamentsPlayed = (item.tournamentsPlayed || 0) + 1;
  });

  state.tournament.round = 1;
  state.tournament.currentMatch = 0;

  state.tournament.matches = createMatches(participants);
  state.tournament.nextRoundPool = [];

  state.tournament.semiFinalLosers = [];
  
  state.tournament.bracketHistory = [{
    round: 1,
    matches: state.tournament.matches.map(m => ({
      a: m.a,
      b: m.b,
      winner: null
    }))
  }];

  state.tournament.phase = "active";

  save();
  renderTournament();
}

export function toggleTournamentDropdown(id){
  const menu = document.getElementById(id);
  if(!menu) return;
  document.querySelectorAll(".tournamentDropdownMenu").forEach(el => {
    if(el !== menu) el.classList.add("hidden");
  });
  menu.classList.toggle("hidden");
}

export function selectTournamentDropdown(type, index){
  if(type === "category"){
    const categories = [...new Set(state.items.flatMap(x => x.categories || []))];
    state.tournament.category = categories[index] || "";
    state.tournament.categorySearch = "";
    save();
    renderTournament();
    return;
  }

  if(type === "size"){
    const poolLength = state.tournament.mode === "category"
      ? state.items.filter(item => item.categories?.includes(state.tournament.category)).length
      : state.items.length;
    const sizes = getAllowedSizes(poolLength);
    state.tournament.size = Number(sizes[index]);
    save();
    document.querySelectorAll(".tournamentDropdownMenu").forEach(el => el.classList.add("hidden"));
    renderTournament();
  }
}

function renderTournamentDropdown(id, selected, options, type){
  const selectedIndex = options.findIndex(option => String(option) === String(selected));
  const searchable = type === "category";
  return `
<div class="tournamentDropdown">
  <button type="button" class="tournamentDropdownButton" onclick="toggleTournamentDropdown('${id}Menu')">
    <span>${selected || "Velg..."}</span>
    <span>⌄</span>
  </button>
  <div id="${id}Menu" class="tournamentDropdownMenu hidden">
    ${searchable ? `<input type="search" class="tournamentDropdownSearch" placeholder="Søk kategori..." oninput="filterTournamentCategories(this.value)" value="${state.tournament.categorySearch || ""}">` : ""}
    <div id="${type === "category" ? "tournamentCategoryDropdownOptions" : id + "Options"}">
      ${options.map((option, index) => `
        <div class="tournamentDropdownOption ${index === selectedIndex ? "active" : ""}" onclick="selectTournamentDropdown('${type}', ${index})">
          ${option}
        </div>
      `).join("")}
    </div>
  </div>
</div>
`;
}

export function filterTournamentCategories(query){
  state.tournament.categorySearch = query;
  const q = query.trim().toLowerCase();
  const allCategories = [...new Set(state.items.flatMap(x => x.categories || []))];
  const options = allCategories.filter(option => String(option).toLowerCase().includes(q));
  const container = document.getElementById("tournamentCategoryDropdownOptions");
  if(!container) return;
  const selected = state.tournament.category;
  container.innerHTML = options.map(option => {
    const index = allCategories.findIndex(x => x === option);
    return `<div class="tournamentDropdownOption ${String(option) === String(selected) ? "active" : ""}" onclick="selectTournamentDropdown('category', ${index})">${option}</div>`;
  }).join("");
}

export function updateTournamentSizeOptions(){
  renderTournament();
}
export function confirmTournamentSetup(){
  const pool = getTournamentPool();
  if (pool.length < 4) {
    return;
  }
  startTournament();
}
export function backTournament(){

  state.tournament.phase = "hub";

  state.tournament.mode = null;

  state.tournament.category = null;

  save();
  renderTournament();

}

function shuffle(arr){

  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function pickWinner(side){

  const t = state.tournament;

  const match = t.matches?.[t.currentMatch];
  if (!match) return;

  const winner = side === "a" ? match.a : match.b;

  // init safety
  if (!t.nextRoundPool) t.nextRoundPool = [];

  const isSemiFinal =
  t.matches.length === 2;

const loser = side === "a" ? match.b : match.a;

t.nextRoundPool.push(winner);

// hvis semifinal → lagre taper
if (isSemiFinal) {

  if (!t.semiFinalLosers) {
    t.semiFinalLosers = [];
  }

  t.semiFinalLosers.push(loser);
}

  // lagre i bracket history
  const currentRound = t.bracketHistory[t.bracketHistory.length - 1];

  if (currentRound?.matches?.[t.currentMatch]) {
    currentRound.matches[t.currentMatch].winner = winner;
  }

  t.currentMatch++;

  // fortsatt runde
  if (t.currentMatch < t.matches.length) {
    save();
    renderTournament();
    return;
  }

  // ROUND DONE
  advanceRound();

  save();
  renderTournament();
}

function getTournamentPool(){

  let pool = [...state.items];

  if (state.tournament.mode === "category") {
    pool = pool.filter(item =>
      item.categories?.includes(state.tournament.category)
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

    state.tournament.bracketHistory.push({
  round: state.tournament.round,
  matches: state.tournament.matches.map(m => ({
    a: m.a,
    b: m.b,
    winner: null
  }))
});
  
  state.tournament.matches = matches;

}

function getTournamentAverageElo(participants){

  if (!participants.length) return 1000;

  const sum = participants.reduce((acc, item) =>
    acc + (item.rating || 1000), 0
  );

  return sum / participants.length;
}

function getTop3(participants){

  return [...participants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
}

function getFinalTop3(participants){

  const sorted = [...participants]
    .sort((a, b) => b.rating - a.rating);

  return {
    first: sorted[0],
    second: sorted[1],
    third: sorted[2]
  };
}

function applyTournamentElo(participants, avg){

  const multiplier = (avg || 1000) / 1000;

  // Participants are passed in final placement order:
  // 1st, 2nd, 3rd.
  const rewards = [30, 20, 10];

  participants.slice(0, 3).forEach((item, i) => {

    const reward = Math.round(rewards[i] * multiplier);

    item.rating = Math.max(0, item.rating + reward);

    item.tournamentWins =
      (item.tournamentWins || 0) + (i === 0 ? 1 : 0);

    item.top3 = (item.top3 || 0) + 1;

  });
}

function createMatches(participants){

  const matches = [];

  for (let i = 0; i < participants.length; i += 2) {
    matches.push({
      a: participants[i],
      b: participants[i + 1]
    });
  }

  return matches;
}

function advanceRound(){

  const t = state.tournament;

  const next = t.nextRoundPool;
  t.nextRoundPool = [];

  t.currentMatch = 0;

  // FINISHED
if (next.length === 1) {

  t.participants = next;

  const avg = getTournamentAverageElo(next);

  const top3Before = getFinalTop3(state.tournament.originalParticipants);

  const beforeRatings = Object.fromEntries(
    state.tournament.originalParticipants.map(p => [p.id, p.rating])
  );

  // 🥉 CREATE 3RD PLACE MATCH
  t.thirdPlaceMatch = null;

  if (t.semiFinalLosers?.length === 2) {
    t.thirdPlaceMatch = {
      a: t.semiFinalLosers[0],
      b: t.semiFinalLosers[1],
      winner: null
    };

    t.phase = "thirdPlace";

    save();
    return;
  }

  // fallback (shouldn't happen)
  applyTournamentElo(next, avg);

  const afterRatings = Object.fromEntries(
    state.tournament.originalParticipants.map(p => [p.id, p.rating])
  );

  t.phase = "finished";
  t.finalResults = {
    first: next[0],
    second: t.semiFinalLosers?.[0],
    third: t.semiFinalLosers?.[1],
    beforeRatings,
    afterRatings
  };

  return;
}

  // NEXT ROUND
  t.round++;

  t.participants = next;
  t.matches = createMatches(next);

  t.bracketHistory.push({
    round: t.round,
    matches: t.matches.map(m => ({
      a: m.a,
      b: m.b,
      winner: null
    }))
  });
}

export function pickThirdPlaceWinner(side){

  const t = state.tournament;

  const match = t.thirdPlaceMatch;
  if (!match) return;

  const winner = side === "a" ? match.a : match.b;

  const loser = side === "a" ? match.b : match.a;

  // sett resultater
  t.thirdPlaceWinner = winner;
  t.thirdPlaceLoser = loser;

  t.phase = "finished";

  // final ranking
  const final = t.participants[0];

  const beforeRatings = Object.fromEntries(
    state.tournament.originalParticipants.map(p => [p.id, p.rating])
  );

  const avg = getTournamentAverageElo(
    state.tournament.originalParticipants
  );

  applyTournamentElo([final, loser, winner], avg);

  const afterRatings = Object.fromEntries(
    state.tournament.originalParticipants.map(p => [p.id, p.rating])
  );

  t.finalResults = {
    first: final,
    second: loser,
    third: winner,
    beforeRatings,
    afterRatings
  };

  save();
  renderTournament();
}

