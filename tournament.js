import { state } from "./state.js";
import { save } from "./storage.js";

export function selectTournamentMode(mode){

  if (mode === "daily" && isDailyCompletedToday()) return;

  state.tournament.mode = mode;

  state.tournament.phase = "setup";

  save();
  renderTournament();

}

const DAILY_CONFIGS = [
  { name:"Chaos", size:16, participants:"random", matchups:"random", rewards:"normal" },
  { name:"Fresh Blood", size:16, participants:"fresh", matchups:"random", rewards:"plus" },
  { name:"ELO Clash", size:16, participants:"random", matchups:"elo_clash", rewards:"normal" },
  { name:"Underdogs", size:16, participants:"underdogs", matchups:"random", rewards:"plus" },
  { name:"Close Call", size:8, participants:"random", matchups:"close_elo", rewards:"winner" },
  { name:"Elite Eight", size:8, participants:"elite", matchups:"seeded", rewards:"plus" },
  { name:"Comeback", size:16, participants:"comeback", matchups:"random", rewards:"podium" },
  { name:"Category War", size:16, participants:"category_mix", matchups:"random", rewards:"normal" },
  { name:"The Unplayed", size:16, participants:"unplayed", matchups:"random", rewards:"plus" },
  { name:"The Gauntlet", size:32, participants:"random", matchups:"seeded", rewards:"normal" },
  { name:"Revenge", size:8, participants:"revenge", matchups:"random", rewards:"winner" },
  { name:"Undefeated", size:8, participants:"undefeated", matchups:"close_elo", rewards:"plus" },
  { name:"Lucky Eight", size:"random", participants:"random", matchups:"random", rewards:"double" },
  { name:"Cold Blood", size:16, participants:"underdogs", matchups:"elo_clash", rewards:"normal" },
  { name:"Veterans", size:16, participants:"veterans", matchups:"seeded", rewards:"plus" },
  { name:"Category Clash", size:8, participants:"category", matchups:"close_elo", rewards:"winner" },
  { name:"Fresh Start", size:8, participants:"fresh", matchups:"close_elo", rewards:"plus" },
  { name:"David vs Goliath", size:16, participants:"random", matchups:"elo_clash", rewards:"double" },
  { name:"Last Chance", size:16, participants:"comeback", matchups:"elo_clash", rewards:"plus" },
  { name:"Two Worlds", size:16, participants:"category_mix", matchups:"seeded", rewards:"normal" },
  { name:"Kings Only", size:8, participants:"elite", matchups:"close_elo", rewards:"double" },
  { name:"Hidden Gems", size:16, participants:"unplayed", matchups:"seeded", rewards:"plus" },
  { name:"Revenge Tour", size:16, participants:"revenge", matchups:"close_elo", rewards:"podium" },
  { name:"Underdog Derby", size:8, participants:"underdogs", matchups:"close_elo", rewards:"winner" },
  { name:"Grand Seeding", size:32, participants:"random", matchups:"seeded", rewards:"plus" },
  { name:"Perfect Balance", size:16, participants:"random", matchups:"close_elo", rewards:"normal" },
  { name:"Category Roulette", size:"random", participants:"category", matchups:"random", rewards:"plus" },
  { name:"Second Chance", size:16, participants:"comeback", matchups:"close_elo", rewards:"double" },
  { name:"Pure Chaos", size:"random", participants:"random", matchups:"elo_clash", rewards:"double" },
  { name:"Daily Finale", size:32, participants:"random", matchups:"seeded", rewards:"double" }
];

function getDailyConfig(dateKey = getTodayKey()){
  const hash = Array.from(dateKey).reduce((hash, char) =>
    ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  const index = Math.abs(hash) % DAILY_CONFIGS.length;
  return DAILY_CONFIGS[index];
}

function getDailyRuleText(config){
  const participantNames = {
    random:"Random",
    underdogs:"Underdogs",
    elite:"Elite",
    fresh:"Fresh Blood",
    unplayed:"Unplayed",
    category:"Category",
    category_mix:"Category Mix",
    comeback:"Comeback",
    revenge:"Revenge",
    veterans:"Veterans",
    undefeated:"Undefeated"
  };
  const matchupNames = {
    random:"Random matchups",
    elo_clash:"ELO Clash",
    close_elo:"Close ELO",
    seeded:"Seeded"
  };
  const rewardNames = {
    normal:"Normal Daily",
    plus:"Daily Plus",
    double:"Double",
    winner:"Winner Bonus",
    podium:"Podium Bonus"
  };
  return {
    participants: participantNames[config.participants] || config.participants,
    matchups: matchupNames[config.matchups] || config.matchups,
    rewards: rewardNames[config.rewards] || config.rewards
  };
}

function seededRandom(seed){
  let value = Math.abs(seed) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function dailyShuffle(arr, seed){
  const copy = [...arr];
  const random = seededRandom(seed);
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getTodayKey(){
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function isDailyCompletedToday(){
  return state.tournament.dailyCompletedDate === getTodayKey();
}

export function startDailyCountdown(){
  if (window.dailyTournamentCountdownInterval) {
    clearInterval(window.dailyTournamentCountdownInterval);
    window.dailyTournamentCountdownInterval = null;
  }

  const update = () => {
    const el = document.getElementById("dailyTournamentCountdown");
    if (!el) return;

    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setHours(24, 0, 0, 0);

    const diff = Math.max(0, nextReset - now);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    el.textContent = "Resetter om " + hours + ":" + minutes + ":" + seconds;

    if (diff <= 0) {
      clearInterval(window.dailyTournamentCountdownInterval);
      window.dailyTournamentCountdownInterval = null;
      renderTournament();
    }
  };

  update();
  window.dailyTournamentCountdownInterval = setInterval(update, 1000);
}

export function renderTournament(){

  const root =
    document.getElementById(
      "tournamentContent"
    );

  if(!root) return;

  // HUB

  if (state.tournament.phase === "hub") {

    root.innerHTML = `
<div class="tournamentModeHeader">
  <h2>Velg gamemode</h2>
  <p>Hvordan vil du spille turneringen?</p>
</div>

<div class="tournamentModeCards">
  <button class="tournamentModeCard" onclick="selectTournamentMode('random')">
    <span class="tournamentModeIcon">🎲</span>
    <span class="tournamentModeText">
      <strong>Random</strong>
      <small>Tilfeldige deltakere fra hele listen</small>
    </span>
    <span class="tournamentModeArrow">›</span>
  </button>

  <button class="tournamentModeCard" onclick="selectTournamentMode('category')">
    <span class="tournamentModeIcon">🏷️</span>
    <span class="tournamentModeText">
      <strong>Category</strong>
      <small>Velg en kategori og spill med dens deltakere</small>
    </span>
    <span class="tournamentModeArrow">›</span>
  </button>

  <button class="tournamentModeCard dailyTournamentCard ${isDailyCompletedToday() ? "completed" : ""}" onclick="${isDailyCompletedToday() ? "" : "selectTournamentMode('daily')"}" ${isDailyCompletedToday() ? "disabled" : ""}>
    <span class="tournamentModeIcon">🌟</span>
    <span class="tournamentModeText">
      <strong>Daily Tournament</strong>
      <small>${isDailyCompletedToday() ? "Fullført i dag · Kom tilbake i morgen" : "Dagens spesialturnering · Større ELO-belønninger"}</small>
    </span>
    <span id="dailyTournamentCountdown" class="dailyTournamentCountdown"></span>
    <span class="tournamentModeStatus">${isDailyCompletedToday() ? "✓" : "DAILY"}</span>
  </button>
</div>
`;

    renderBracket();
    startDailyCountdown();

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

    let pool = getTournamentPool();

    const dailyConfig = state.tournament.mode === "daily"
      ? getDailyConfig()
      : null;

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

  const root = document.getElementById("bracketView");
  if(!root) return;

  const t = state.tournament;

  if(!["active", "thirdPlace", "finished"].includes(t.phase)){
    root.innerHTML = "";
    return;
  }

  const history = t.bracketHistory || [];

  if(!history.length){
    root.innerHTML = "";
    return;
  }

  const getRoundName = (round) => {
    const count = round.matches?.length || 0;
    if(count === 1) return "Final";
    if(count === 2) return "Semifinals";
    if(count === 4) return "Quarterfinals";
    if(count === 8) return "Round of 16";
    if(count === 16) return "Round of 32";
    return "Round";
  };

  const itemId = item => String(item?.id);

  const renderMatch = (match, roundIndex, matchIndex) => {
    const winnerId = match.winner ? itemId(match.winner) : null;
    const isCurrent =
      t.phase === "active" &&
      roundIndex === history.length - 1 &&
      matchIndex === t.currentMatch;

    const player = item => {
      if(!item) return "";

      const won = winnerId === itemId(item);
      const lost = winnerId && !won;

      return '<div class="tournamentBracketPlayer ' + (won ? "winner" : "") + ' ' + (lost ? "loser" : "") + '">' +
        '<span>' + item.name + '</span>' +
        (won ? '<span class="tournamentBracketCheck">✓</span>' : "") +
      '</div>';
    };

    return '<div class="tournamentBracketMatch ' + (isCurrent ? "current" : "") + ' ' + (winnerId ? "completed" : "") + '" data-round-index="' + roundIndex + '" data-match-index="' + matchIndex + '">' +
      player(match.a) +
      '<div class="tournamentBracketDivider"></div>' +
      player(match.b) +
    '</div>';
  };

  const rounds = history.map((round, roundIndex) =>
    '<div class="tournamentBracketRound round-' + roundIndex + '" data-round-index="' + roundIndex + '" style="--round-gap:' + (86 * Math.pow(2, roundIndex) - 72) + 'px;--round-offset:' + (roundIndex === 0 ? 0 : (43 * (Math.pow(2, roundIndex) - 1))) + 'px">' +
      '<div class="tournamentBracketRoundTitle">' + getRoundName(round) + '</div>' +
      '<div class="tournamentBracketMatches">' +
        (round.matches || []).map((match, matchIndex) =>
          renderMatch(match, roundIndex, matchIndex)
        ).join("") +
      '</div>' +
    '</div>'
  );

  const thirdPlaceHtml = (t.thirdPlaceMatch && ["thirdPlace", "active", "finished"].includes(t.phase))
    ? '<div class="tournamentThirdPlaceBracket">' +
        '<div class="tournamentBracketRoundTitle">3rd Place</div>' +
        '<div class="tournamentBracketMatch ' + (t.phase === "thirdPlace" ? "current" : "completed") + '" data-third-place="true">' +
          '<div class="tournamentBracketPlayer ' + (t.thirdPlaceWinner?.id === t.thirdPlaceMatch.a?.id ? "winner" : "") + '">' +
            '<span>' + t.thirdPlaceMatch.a.name + '</span>' +
            (t.thirdPlaceWinner?.id === t.thirdPlaceMatch.a?.id ? '<span class="tournamentBracketCheck">✓</span>' : "") +
          '</div>' +
          '<div class="tournamentBracketDivider"></div>' +
          '<div class="tournamentBracketPlayer ' + (t.thirdPlaceWinner?.id === t.thirdPlaceMatch.b?.id ? "winner" : "") + '">' +
            '<span>' + t.thirdPlaceMatch.b.name + '</span>' +
            (t.thirdPlaceWinner?.id === t.thirdPlaceMatch.b?.id ? '<span class="tournamentBracketCheck">✓</span>' : "") +
          '</div>' +
        '</div>' +
      '</div>'
    : "";

  const finalRound = rounds.length ? rounds[rounds.length - 1] : "";
  const earlierRounds = rounds.slice(0, -1).join("");

  root.innerHTML =
    '<div class="tournamentBracketHeader">' +
      '<h3>Bracket</h3>' +
      '<span>' + (t.originalParticipants?.length || 0) + ' deltakere</span>' +
    '</div>' +
    '<div class="tournamentBracketScroll">' +
      '<div class="tournamentBracket">' +
        '<svg class="tournamentBracketLines" aria-hidden="true"></svg>' +
        earlierRounds +
        thirdPlaceHtml +
        finalRound +
      '</div>' +
    '</div>';

  drawTournamentBracketLines();

  const scrollBox = root.querySelector(".tournamentBracketScroll");
  const roundElements = root.querySelectorAll(".tournamentBracketRound");
  const thirdPlaceElement = root.querySelector(".tournamentThirdPlaceBracket");

  if(scrollBox && roundElements.length){
    let target = null;

    if(t.phase === "thirdPlace"){
      target = thirdPlaceElement;
    } else if(t.phase === "finished"){
      target = thirdPlaceElement || roundElements[history.length - 1];
    } else {
      target = roundElements[history.length - 1];
    }

    if(target){
      requestAnimationFrame(() => {
        const left = Math.max(
          0,
          target.offsetLeft - scrollBox.clientWidth / 2 + target.offsetWidth / 2
        );

        scrollBox.scrollTo({
          left,
          behavior: "smooth"
        });
      });
    }
  }
}

function drawTournamentBracketLines(){
  const bracket = document.querySelector("#bracketView .tournamentBracket");
  const svg = bracket?.querySelector(".tournamentBracketLines");
  if(!bracket || !svg) return;

  const rounds = [...bracket.querySelectorAll(".tournamentBracketRound")];
  const third = bracket.querySelector(".tournamentThirdPlaceBracket .tournamentBracketMatch");
  const bracketRect = bracket.getBoundingClientRect();
  const width = Math.max(bracket.scrollWidth, bracketRect.width);
  const height = Math.max(bracket.scrollHeight, bracketRect.height);

  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.innerHTML = "";

  const center = (el) => {
    const r = el.getBoundingClientRect();
    return {
      left: r.left - bracketRect.left,
      right: r.right - bracketRect.left,
      y: r.top - bracketRect.top + r.height / 2
    };
  };

  const line = (d) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "tournamentBracketLine");
    svg.appendChild(path);
  };

  // Normal bracket: every pair of matches in one round feeds the
  // corresponding match in the next round through the exact centers.
  for(let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++){
    const from = [...rounds[roundIndex].querySelectorAll(":scope > .tournamentBracketMatches .tournamentBracketMatch")];
    const to = [...rounds[roundIndex + 1].querySelectorAll(":scope > .tournamentBracketMatches .tournamentBracketMatch")];

    to.forEach((target, targetIndex) => {
      const a = from[targetIndex * 2];
      const b = from[targetIndex * 2 + 1];
      if(!a || !b) return;

      const p1 = center(a);
      const p2 = center(b);
      const dest = center(target);
      const branchX = Math.min(dest.left - 10, Math.max(p1.right, p2.right) + 9);

      line("M " + p1.right + " " + p1.y + " H " + branchX + " V " + p2.y + " H " + p2.right);
      line("M " + branchX + " " + ((p1.y + p2.y) / 2) + " H " + dest.left + " V " + dest.y);
    });
  }

  // 3rd place is an offshoot from the semifinal midpoint. It does not
  // become part of the main path to the final.
  if(third && rounds.length >= 2){
    const semiMatches = [...rounds[rounds.length - 2].querySelectorAll(":scope > .tournamentBracketMatches .tournamentBracketMatch")];
    if(semiMatches.length === 2){
      const a = center(semiMatches[0]);
      const b = center(semiMatches[1]);
      const dest = center(third);
      const branchX = Math.min(dest.left - 10, Math.max(a.right, b.right) + 9);
      const midY = (a.y + b.y) / 2;

      line("M " + branchX + " " + midY + " H " + dest.left);
    }
  }
}

export function startTournament(){

  let pool = getTournamentPool();
  const dailyConfig = state.tournament.mode === "daily" ? getDailyConfig() : null;

  if (dailyConfig) {
    pool = getDailyParticipantPool(pool, dailyConfig);
  } else {
    pool = shuffle(pool);
  }

  const maxPossible = pool.length;
  const allowedSizes = getAllowedSizes(maxPossible);
  let size;

  if (dailyConfig) {
    if (dailyConfig.size === "random") {
      const seed = getTodayKey().split("-").reduce((a, b) => a * 31 + Number(b), 17);
      const random = seededRandom(seed);
      size = allowedSizes[Math.floor(random() * allowedSizes.length)] || 0;
    } else {
      size = Number(dailyConfig.size);
    }
  } else {
    const requestedSize = Number(state.tournament.size);
    size = allowedSizes.includes(requestedSize)
      ? requestedSize
      : (allowedSizes[allowedSizes.length - 1] || 0);
  }

  if (size < 4 || (dailyConfig && pool.length < size)) {
    return;
  }

  let participants = pool.slice(0, size);

  if (dailyConfig) {
    participants = orderDailyParticipants(participants, dailyConfig);
  }

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
  state.tournament.thirdPlaceMatch = null;
  state.tournament.thirdPlaceWinner = null;
  state.tournament.thirdPlaceLoser = null;
  state.tournament.finalResults = null;
  if (state.tournament.mode === "daily") {
    state.tournament.dailyDate = getTodayKey();
  } else {
    state.tournament.dailyDate = null;
  }
  
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
  if (pool.length < 4) return;
  if (state.tournament.mode === "daily") {
    const filtered = getDailyParticipantPool(pool, getDailyConfig());
    if (filtered.length < 4) return;
  }
  startTournament();
}
export function backTournament(){

  state.tournament.phase = "hub";

  state.tournament.mode = null;

  state.tournament.category = null;
  state.tournament.dailyDate = null;

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

function getDailyParticipantPool(pool, config){
  if (!config) return pool;

  let candidates = [...pool];

  if (config.participants === "underdogs") {
    candidates = candidates.filter(item => (item.rating || 1000) <= 1000);
  } else if (config.participants === "elite") {
    candidates = candidates.filter(item => (item.rating || 1000) >= 1100);
  } else if (config.participants === "fresh") {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    candidates = candidates.filter(item => item.createdAt && new Date(item.createdAt).getTime() >= cutoff);
  } else if (config.participants === "unplayed") {
    candidates.sort((a, b) => (a.tournamentsPlayed || 0) - (b.tournamentsPlayed || 0));
  } else if (config.participants === "comeback") {
    candidates.sort((a, b) => ((b.tournamentsPlayed || 0) - (b.tournamentWins || 0)) - ((a.tournamentsPlayed || 0) - (a.tournamentWins || 0)));
  } else if (config.participants === "revenge") {
    candidates.sort((a, b) => ((b.tournamentsPlayed || 0) - (b.tournamentWins || 0)) - ((a.tournamentsPlayed || 0) - (a.tournamentWins || 0)));
  } else if (config.participants === "veterans") {
    candidates = candidates.filter(item => (item.tournamentsPlayed || 0) >= 5);
  } else if (config.participants === "undefeated") {
    candidates = candidates.filter(item => (item.tournamentsPlayed || 0) === (item.tournamentWins || 0));
  } else if (config.participants === "category") {
    const categories = [...new Set(candidates.flatMap(item => item.categories || []))];
    const valid = categories.filter(category =>
      candidates.filter(item => item.categories?.includes(category)).length >= 4
    );
    if (valid.length) {
      const seed = getTodayKey().split("-").reduce((a, b) => a * 31 + Number(b), 17);
      const category = dailyShuffle(valid, seed)[0];
      candidates = candidates.filter(item => item.categories?.includes(category));
    }
  } else if (config.participants === "category_mix") {
    const categories = [...new Set(candidates.flatMap(item => item.categories || []))];
    const valid = categories.filter(category =>
      candidates.filter(item => item.categories?.includes(category)).length >= 2
    );
    if (valid.length >= 2) {
      const seed = getTodayKey().split("-").reduce((a, b) => a * 31 + Number(b), 17);
      const chosen = dailyShuffle(valid, seed).slice(0, 2);
      candidates = candidates.filter(item =>
        item.categories?.some(category => chosen.includes(category))
      );
    }
  }

  return candidates;
}

function orderDailyParticipants(participants, config){
  let result = [...participants];
  const seed = getTodayKey().split("-").reduce((a, b) => a * 31 + Number(b), 17);

  if (config.matchups === "seeded") {
    result.sort((a, b) => (b.rating || 1000) - (a.rating || 1000));
    const ordered = [];
    const n = result.length;
    for (let i = 0; i < n / 2; i++) {
      ordered.push(result[i], result[n - 1 - i]);
    }
    return ordered;
  }

  if (config.matchups === "elo_clash") {
    result.sort((a, b) => (b.rating || 1000) - (a.rating || 1000));
    const ordered = [];
    for (let i = 0; i < result.length / 2; i++) {
      ordered.push(result[i], result[result.length - 1 - i]);
    }
    return ordered;
  }

  if (config.matchups === "close_elo") {
    result.sort((a, b) => (a.rating || 1000) - (b.rating || 1000));
    const ordered = [];
    for (let i = 0; i < result.length; i += 2) {
      ordered.push(result[i], result[i + 1]);
    }
    return ordered;
  }

  return dailyShuffle(result, seed);
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
  const dailyRewards = {
    normal: [45, 30, 15],
    plus: [55, 35, 20],
    double: [90, 60, 30],
    winner: [75, 30, 15],
    podium: [60, 40, 25]
  };

  const rewards = state.tournament.mode === "daily"
    ? (dailyRewards[getDailyConfig().rewards] || dailyRewards.normal)
    : [30, 20, 10];

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

  const avg = getTournamentAverageElo(
    state.tournament.originalParticipants
  );

  const beforeRatings = Object.fromEntries(
    state.tournament.originalParticipants.map(p => [p.id, p.rating])
  );

  // The final has now been played, so the tournament can be finalized.
  const final = next[0];
  const second = t.thirdPlaceLoser;
  const third = t.thirdPlaceWinner;

  applyTournamentElo([final, second, third], avg);

  const afterRatings = Object.fromEntries(
    state.tournament.originalParticipants.map(p => [p.id, p.rating])
  );

  t.phase = "finished";
  if (t.mode === "daily") {
    t.dailyCompletedDate = getTodayKey();
  }
  t.finalResults = {
    first: final,
    second,
    third,
    beforeRatings,
    afterRatings
  };

  return;
}

  // NEXT ROUND
  t.round++;

  t.participants = next;
  t.matches = createMatches(next);

  // After the semifinals, prepare the final but play the 3rd-place
  // match first. The final remains in the bracket and is played last.
  if (next.length === 2 && t.semiFinalLosers?.length === 2) {
    t.thirdPlaceMatch = {
      a: t.semiFinalLosers[0],
      b: t.semiFinalLosers[1],
      winner: null
    };

    t.phase = "thirdPlace";
  }

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

  // The 3rd-place match is finished. Now continue with the final.
  t.phase = "active";
  t.currentMatch = 0;

  save();
  renderTournament();
}

