const state = {
  items: JSON.parse(localStorage.getItem("items")) || [],
  categories: JSON.parse(localStorage.getItem("categories")) || [],
  current: [],
  tournament: JSON.parse(localStorage.getItem("dailyTournament")) || null,
  bracket: [],
  round: 0,
  match: 0,
  showAll: false,

  showAllChips: false,
  showAllStatsChips: false,

  rankingFilter: "all",
  rankingSort: "elo"
};

// ==============================
// 🔥 CLEANUP / NORMALISERING
// ==============================

// fjern tomme / ugyldige categories + normaliser
state.categories = [...new Set(
  state.categories
    .filter(c => typeof c === "string" && c.trim() !== "")
    .map(c => c.trim().toLowerCase())

)];

// sørg for at items alltid har riktig struktur
state.items.forEach(i => {
  if (!i.history) i.history = [];
  if (i.history.length === 0) i.history.push(i.rating || 1000);

  if (!i.categories) i.categories = [];

  // normaliser categories på items også
  i.categories = [...new Set(
    i.categories
      .filter(c => typeof c === "string" && c.trim() !== "")
      .map(c => c.trim().toLowerCase())
  )];
});

/* ================= SAVE ================= */
function save(){
  localStorage.setItem("items", JSON.stringify(state.items));
  localStorage.setItem("categories", JSON.stringify(state.categories));
}

/* ================= CATEGORY ================= */
function normalize(c){
  return c.trim().toLowerCase();
}

function addCategory(){
  let v = document.getElementById("catInput").value;

  if(!v || !v.trim()) return;

  v = v.trim().toLowerCase(); // 🔥 viktig

  if(!state.categories.includes(v)){
    state.categories.push(v);
  }

  document.getElementById("catInput").value = "";
  renderChips();
  save();
}

function renderChips(filter=""){
  const box = document.getElementById("chipBox");

const f = filter.toLowerCase();

 let list = state.categories;

if(!state.showAllChips){
  list = list.slice(0, 4); // 👈 antall synlige chips
}

box.innerHTML =
  list.map(c => `
    <div class="chip" onclick="toggleCat(this)">${c}</div>
  `).join("") +

  (state.categories.length > 4 ? `
  <div class="chip"
       onclick="toggleAllChips()"
       style="
         background:#4f8cff;
         color:white;
         font-weight:bold;
       ">
    ${state.showAllChips ? "−" : "+"}
  </div>
` : "");

}
  
function toggleCat(el){
  el.classList.toggle("active");
}

/* ================= ITEMS ================= */
function addItem(){
  let name = document.getElementById("itemInput").value;
  if(!name) return;

  let selected = [...document.querySelectorAll(".chip.active")]
    .map(x => x.innerText);

 state.items.push({
  id: Date.now(),
  name,
  categories: selected,
  rating: 1000,

  // NEW V3 STATS
  history: [1000],
  tournamentsPlayed: 0,
  tournamentWins: 0,
  top3: 0
});

  document.getElementById("itemInput").value = "";
  save();
  update();
  nextMatch();
}

function updateHistory(item){
  if(!item.history) item.history = [];
  item.history.push(item.rating);

  if(item.history.length > 30){
    item.history.shift();
  }
}

function openAddItem(){
  const overlay = document.getElementById("addOverlay");
  const view = document.getElementById("addView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);

  renderChips(); // viktig
}

function closeAddItem(){
  const overlay = document.getElementById("addOverlay");
  const view = document.getElementById("addView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

/* ================= MATCH ================= */
function nextMatch(){
  if(state.items.length < 2) return;

  let a = Math.floor(Math.random()*state.items.length);
  let b;

  do { b = Math.floor(Math.random()*state.items.length) }
  while(a===b);

  state.current = [state.items[a], state.items[b]];

  const itemA = state.current[0];
const itemB = state.current[1];

const elA = document.getElementById("a");
const elB = document.getElementById("b");

elA.innerHTML = formatChoice(itemA, itemB);
elB.innerHTML = formatChoice(itemB, itemA);

// VIKTIG: legg tilbake klikkene
elA.onclick = () => pick(0);
elB.onclick = () => pick(1);

}   // 👈 DENNE MÅ VÆRE HER

function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}

function formatChoice(item, opponent){
  const rank = getRank(item.id);
  const elo = Math.round(item.rating);

  const Ea = 1/(1+Math.pow(10,(opponent.rating-item.rating)/400));
  const gain = Math.round(32*(1-Ea));
  const loss = Math.round(32*(0-Ea));

  const gainColor = gain >= 16 ? "#4caf50" : "#aaa";
  const lossColor = Math.abs(loss) >= 16 ? "#f44336" : "#aaa";

  return `
    <div style="font-size:18px; font-weight:600;">
      ${item.name}
    </div>

    <div style="font-size:11px; opacity:0.6;">
      #${rank} • ⭐ ${elo}
    </div>

    <div style="font-size:14px; opacity:0.8;">
      <span style="color:${gainColor};">+${gain}</span>
      /
      <span style="color:${lossColor};">${loss}</span>
    </div>
  `;
}

function pick(i){
  let w = state.current[i];
  let l = state.current[1 - i];

  let Ea = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400));

  w.rating += 32 * (1 - Ea);
  l.rating += 32 * (0 - Ea);

  updateHistory(w);
  updateHistory(l);

  save();
  update();
  nextMatch();
}

function draw(){
  if(!state.current.length) return;

  let a = state.current[0];
  let b = state.current[1];

  let Ea = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
  let Eb = 1 / (1 + Math.pow(10, (a.rating - b.rating) / 400));

  // 0.5 = draw
  a.rating += 32 * (0.5 - Ea);
  b.rating += 32 * (0.5 - Eb);

  updateHistory(a);
  updateHistory(b);

  save();
  update();
  nextMatch();
}

/* ================= RANKING ================= */
function update(){
  let sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  let list = sorted.slice(0,10); // 🔥 kun top 10 nå

  document.getElementById("ranking").innerHTML =
    "<h3>🏆 Ranking</h3>" +

`
<div style="display:flex; gap:8px; margin-bottom:10px; background:none; border:none; padding:0;">
  
  <button onclick="openRankingView()" style="flex:1;">
    📊 Full ranking
  </button>

  <button onclick="openAddItem()" style="
    width:50px;
    height:50px;
    border-radius:50%;
    font-size:20px;
    padding:0;
  ">
    +
  </button>

</div>
`
+

    list.map((x,i)=>
      `<div onclick="showStats(${x.id})"
            style="cursor:pointer; padding:10px; background:#1f1f1f; margin:5px 0; border-radius:10px;">
        ${i+1}. ${x.name} (${Math.floor(x.rating)})
      </div>`
    ).join("");
}

/* ================= TOURNAMENT ================= */
function startTournament(){
  let pool = [...state.items];

  if(pool.length < 4){
    alert("Trenger flere items");
    return;
  }

  pool = pool.sort(()=>Math.random()-0.5);

  let round = [];
  for(let i=0;i<pool.length;i+=2){
    round.push({a:pool[i], b:pool[i+1], winner:null});
  }

  state.bracket = [round];
  state.round = 0;
  state.match = 0;

  renderBracket();
}

function renderBracket(){
  let html = "<div class='bracket'>";

  state.bracket.forEach((r,ri)=>{
    html += "<div class='round'>";

    r.forEach(m=>{
      html += `<div class="match">
        ${m.a.name}<br>
        ${m.b.name}
      </div>`;
    });

    html += "</div>";
  });

  html += "</div>";

  document.getElementById("bracket").innerHTML = html;
}

/* INIT */

function renderTournament(){
  const el = document.getElementById("tournament");

  if(!state.tournament){
    el.innerHTML = "Ingen turnering i dag";
    return;
  }

  const t = state.tournament;

  if(t.done){
    el.innerHTML = `
      🏆 Turnering ferdig!<br>
      Kategori: ${t.category}
    `;
    return;
  }

  const match = t.rounds[t.currentRound][t.currentMatch];

  el.innerHTML = `
    🏆 Kategori: ${t.category}<br><br>

    <div class="vs">
      <div class="choice" onclick="pickTournamentWinner(0)">
        ${match.a.name}
      </div>
      <div class="choice" onclick="pickTournamentWinner(1)">
        ${match.b.name}
      </div>
    </div>
  `;
}

function getToday(){
  return new Date().toISOString().split("T")[0];
}

function initDailyTournament(){
  const today = getToday();

  if(state.tournament && state.tournament.date === today) return;

  if(state.items.length < 4) return;

  const cats = [...new Set(state.items.flatMap(i => i.categories))];
  if(cats.length === 0) return;

  const category = cats[Math.floor(Math.random()*cats.length)];

  let pool = state.items.filter(i => i.categories.includes(category));
  if(pool.length < 4) return;

  pool = pool.sort(()=>Math.random()-0.5);

  const size = Math.pow(2, Math.floor(Math.log2(pool.length)));
  pool = pool.slice(0, size);

  let rounds = [];
  let round = [];

  for(let i=0;i<pool.length;i+=2){
    round.push({a:pool[i], b:pool[i+1], winner:null});
  }

  rounds.push(round);

  state.tournament = {
    date: today,
    category,
    rounds,
    currentRound: 0,
    currentMatch: 0,
    done:false
  };

  saveTournament();
}

function saveTournament(){
  localStorage.setItem("dailyTournament", JSON.stringify(state.tournament));
}

function pickTournamentWinner(i){
  const t = state.tournament;
  const match = t.rounds[t.currentRound][t.currentMatch];

  const winner = i === 0 ? match.a : match.b;
  const loser = i === 0 ? match.b : match.a;

  match.winner = winner.id;

  // liten ELO påvirkning
  let Ea = 1/(1+Math.pow(10,(loser.rating-winner.rating)/400));
  winner.rating += 8*(1-Ea);
  loser.rating += 8*(0-(1-Ea));

  // neste match
  t.currentMatch++;

  if(t.currentMatch >= t.rounds[t.currentRound].length){
    advanceRound();
  }

  saveTournament();
  save();
  renderTournament();
  update();
}

function advanceRound(){
  const t = state.tournament;

  let winners = t.rounds[t.currentRound]
    .map(m => m.winner ? state.items.find(x => x.id === m.winner) : null)
    .filter(Boolean);

  // 📊 stats: alle som vant en kamp = deltatt
  winners.forEach(w => {
    w.tournamentsPlayed = (w.tournamentsPlayed || 0) + 1;
  });

  // ferdig turnering
  if(winners.length === 1){
    finishTournament(winners[0]);
    return;
  }

  let next = [];

  for(let i=0;i<winners.length;i+=2){
    next.push({a:winners[i], b:winners[i+1], winner:null});
  }

  t.rounds.push(next);
  t.currentRound++;
  t.currentMatch = 0;
}

function finishTournament(winner){
  state.tournament.done = true;

  winner.tournamentWins = (winner.tournamentWins || 0) + 1;

  let sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  sorted.slice(0,3).forEach((x,i)=>{
    x.top3 = (x.top3 || 0) + 1;

    if(i===0) x.rating += 50;
    if(i===1) x.rating += 25;
    if(i===2) x.rating += 10;
  });

  save();
  saveTournament();
  update();
  renderTournament();
}

function showStats(id){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  const rank = [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;

  const trend = item.history?.slice(-5) || [];

  document.getElementById("statsContent").innerHTML = `
    <div style="padding:20px; text-align:left;">
      <h2 contenteditable="true" onblur="renameItem(${item.id}, this.innerText)">
  ${item.name}
</h2>

<button onclick="deleteItem(${item.id})"
  style="
    background:#1f1f1f;
    border:1px solid #f44336;
    color:#f44336;
    font-size:12px;
    padding:4px 8px;
    border-radius:8px;
    margin-top:8px;
    cursor:pointer;
    opacity:0.8;
  ">
  🗑️
</button>

      <p>🏆 Rank: ${rank}</p>
      <p>⭐ ELO: ${Math.floor(item.rating)}</p>

      <p>📂 ${item.categories.map(c => `
        <span onclick="removeCatFromItem(${item.id}, '${c}')"
          style="background:#222;padding:4px 8px;margin:2px;border-radius:999px;display:inline-block;cursor:pointer;">
          ${c} ✕
        </span>
      `).join(" ")}</p>

      <div style="margin-top:10px;">
        <input id="newCatInput" placeholder="Legg til kategori"
          style="width:70%; padding:8px; border-radius:8px; border:none;">


        <button onclick="addCatToItem(${item.id})" style="width:25%;">
          +
        </button>
      </div>

<div style="margin-top:10px;">

  <p style="opacity:0.7; margin-bottom:6px;">Velg eksisterende kategori:</p>

  <input id="statsCatSearch"
    placeholder="Søk kategori..."
    style="width:100%; padding:8px; margin-bottom:8px; border-radius:8px; border:none;"
    oninput="renderStatsChips(${item.id}, this.value)">

  <div id="statsChipBox"></div>

</div>

      <p>📈 ${trend.map(x => Math.floor(x)).join(" → ")}</p>

      <hr>

      <p>🏆 Wins: ${item.tournamentWins || 0}</p>
      <p>🥇 Top 3: ${item.top3 || 0}</p>
      <p>🎮 Played: ${item.tournamentsPlayed || 0}</p>
    </div>
  `;

  openStats();
  renderStatsChips(id);
}

function addCatToItem(id, valOverride){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  let val = valOverride || document.getElementById("newCatInput").value;
  if(!val || !val.trim()) return;

  val = val.trim().toLowerCase(); // 🔥 viktig

  // 🔥 hindrer duplicates uansett case
  if(!item.categories.some(c => c.toLowerCase() === val)){
    item.categories.push(val);
  }

  // 🔥 også legg til global category-list hvis den ikke finnes
  if(!state.categories.includes(val)){
    state.categories.push(val);
  }

  save();
  showStats(id);
  renderChips();
}

function removeCatFromItem(id, cat){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  item.categories = item.categories.filter(c => c !== cat);

  save();
  showStats(id);
  renderChips();
}

function openRankingView(){
  const overlay = document.getElementById("rankingOverlay");
  const view = document.getElementById("rankingView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);

  renderRankingView();
}

function closeRankingView(){
  const overlay = document.getElementById("rankingOverlay");
  const view = document.getElementById("rankingView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

function renderRankingView(){
  let list = [...state.items];

  // FILTER
  if(state.rankingFilter !== "all"){
    list = list.filter(x =>
      (x.categories || []).includes(state.rankingFilter)
    );
  }

  // SORTERING
  if(state.rankingSort === "elo"){
    list.sort((a,b)=>b.rating-a.rating);
  }

  if(state.rankingSort === "wins"){
    list.sort((a,b)=>(b.tournamentWins||0)-(a.tournamentWins||0));
  }

  if(state.rankingSort === "top3"){
    list.sort((a,b)=>(b.top3||0)-(a.top3||0));
  }

  const html = list.map((x,i)=>`
    <div onclick="showStats(${x.id})"
      style="
        padding:12px;
        margin:6px 0;
        background:#1f1f1f;
        border-radius:12px;
        cursor:pointer;
      ">
      <b>#${i+1}</b> ${x.name}
      <span style="float:right; opacity:0.7;">
        ${Math.floor(x.rating)}
      </span>
    </div>
  `).join("");

  document.getElementById("rankingViewList").innerHTML =
    "<h3>🏆 Full ranking</h3>" + html;

  renderRankingFilters();
}

function setRankingFilter(cat){
  state.rankingFilter = cat;
  renderRankingView();
}

function scrollToTop(){
  document.getElementById("rankingView").scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.getElementById("rankingView").addEventListener("scroll", () => {
  const btn = document.getElementById("scrollBtn");

  if(document.getElementById("rankingView").scrollTop > 200){
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
});

function renderRankingFilters(){
  const container = document.getElementById("rankingFilters");

  const cats = ["all", ...state.categories];

  container.innerHTML = cats.map(c => `
    <span onclick="setRankingFilter('${c}')"
      style="
        padding:6px 10px;
        margin:4px;
        border-radius:999px;
        background:${state.rankingFilter === c ? '#4f8cff' : '#222'};
        cursor:pointer;
        display:inline-block;
      ">
      ${c}
    </span>
  `).join("");
}

function setSort(type){
  state.rankingSort = type;
  renderRankingView();
}

function openStats(){
  const overlay = document.getElementById("statsOverlay");
  const view = document.getElementById("statsView");

  overlay.style.display = "flex";

  setTimeout(() => {
    view.style.transform = "translateY(0)";
  }, 10);
}

function closeStats(){
  const overlay = document.getElementById("statsOverlay");
  const view = document.getElementById("statsView");

  view.style.transform = "translateY(100%)";

  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);
}

// klikk utenfor lukker
document.getElementById("statsOverlay").addEventListener("click", (e)=>{
  if(e.target.id === "statsOverlay"){
    closeStats();
  }
});

function renameItem(id, newName){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  newName = newName.trim();

  if(!newName){
    alert("Navn kan ikke være tomt");
    return;
  }

  item.name = newName;

  save();
  update();
}

function deleteItem(id){
  const confirmDelete = confirm("Er du sikker?");
  if(!confirmDelete) return;

  state.items = state.items.filter(x => x.id !== id);

  save();
  update();
  nextMatch();

  closeStats();
}

function renderStatsChips(itemId, filter=""){
  const box = document.getElementById("statsChipBox");
  if(!box) return;
  const item = state.items.find(x => x.id === itemId);
const selected = item?.categories || [];

  const f = filter.toLowerCase();

  let list = state.categories
  .filter(c => c.includes(f));

// 👇 begrens hvis ikke expanded
if(!state.showAllStatsChips){
  list = list.slice(0, 6);
}

box.innerHTML =
  list.map(c => `
    <span onclick="addCatToItem(${itemId}, '${c}')"
      style="
        background:${selected.includes(c) ? '#4f8cff' : '#222'};
        padding:6px 10px;
        border-radius:999px;
        cursor:pointer;
        font-size:12px;
        display:inline-block;
        margin:3px;
      ">
      ${c}
    </span>
  `).join("") +

  (state.categories.length > 6 ? `
    <span onclick="toggleStatsChips(${itemId})"
      style="
        background:#4f8cff;
        color:white;
        font-weight:bold;
        padding:6px 10px;
        border-radius:999px;
        cursor:pointer;
        font-size:12px;
        display:inline-block;
        margin:3px;
      ">
      ${state.showAllStatsChips ? "−" : "+"}
    </span>
  ` : "");

}

function toggleAllChips(){
  state.showAllChips = !state.showAllChips;
  renderChips();
}

function toggleStatsChips(id){
  state.showAllStatsChips = !state.showAllStatsChips;
  renderStatsChips(id, document.getElementById("statsCatSearch")?.value || "");
}

renderChips();
update();
nextMatch();
initDailyTournament();
renderTournament();
