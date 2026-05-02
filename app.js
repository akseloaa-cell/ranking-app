
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
  if(!i.h2h) i.h2h = {};
  if (!i.categories) i.categories = [];
  
  // normaliser categories på items også
  i.categories = [...new Set(
    i.categories
      .filter(c => typeof c === "string" && c.trim() !== "")
      .map(c => c.trim().toLowerCase())
  )];
});

/* ================= SAVE ================= */

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

  createdAt: new Date().toISOString(),
  // NEW V3 STATS
  history: [1000],
  tournamentsPlayed: 0,
  tournamentWins: 0,
  top3: 0,

   h2h: {}
});

  document.getElementById("itemInput").value = "";
  save();
  update();
  nextMatch();
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

function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}



/* ================= RANKING ================= */

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
  if(state.mode !== "tournament") return;
  
  const el = document.getElementById("tournament");

  el.innerHTML = `
    <h2 style="margin-bottom:10px;">🏆 Daily Tournament</h2>
  `;
  
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
}

function showStats(id){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  const rank = [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;

  const trend = item.history?.slice(-5) || [];

    let streakText = "";

  if(item.streak > 0){
    streakText = `<span style="color:#4caf50;">W${item.streak}</span>`;
  }
  else if(item.streak < 0){
    streakText = `<span style="color:#f44336;">L${Math.abs(item.streak)}</span>`;
  }

  document.getElementById("statsContent").innerHTML = `
    <div style="padding:20px; text-align:left;">

<h2 style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">

  <span contenteditable="true"
        onblur="renameItem(${item.id}, this.innerText)"
        style="font-weight:bold;">
    ${item.name}
  </span>

  <span style="
    font-size:12px;
    opacity:0.6;
    font-weight:normal;
  ">
    ${item.categories.length ? "• " + item.categories.join(", ") : ""}
  </span>

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
      <p>📊 Winrate: ${(getWinrate(item)*100).toFixed(1)}%</p>
      <p>🔥 Streak: ${streakText || "-"}</p>
      <p>📈 ${trend.map(x => Math.floor(x)).join(" → ")}</p>

      <hr>

      <p>🏆 Wins: ${item.tournamentWins || 0}</p>
      <p>🥇 Top 3: ${item.top3 || 0}</p>
      <p>🎮 Played: ${item.tournamentsPlayed || 0}</p>

    <hr>

<button onclick="toggleCatSection()" id="catToggleBtn" style="
  width:100%;
  padding:10px;
  border-radius:10px;
  background:#1f1f1f;
  border:none;
  cursor:pointer;
  margin-top:10px;
">
📂 Kategorier +
</button>

<div id="catSection" style="display:none; margin-top:10px;">

  <p>
    ${item.categories.map(c => `
      <span onclick="removeCatFromItem(${item.id}, '${c}')"
        style="background:#222;padding:4px 8px;margin:2px;border-radius:999px;display:inline-block;cursor:pointer;">
        ${c} ✕
      </span>
    `).join(" ")}
  </p>

  <div style="margin-top:10px;">
    <input id="newCatInput" placeholder="Legg til kategori"
      style="width:70%; padding:8px; border-radius:8px; border:none;">
    <button onclick="addCatToItem(${item.id})" style="width:25%;">+</button>
  </div>

  <div style="margin-top:10px;">
    <input id="statsCatSearch"
      placeholder="Søk kategori..."
      style="width:100%; padding:8px; margin-bottom:8px; border-radius:8px; border:none;"
      oninput="renderStatsChips(${item.id}, this.value)">

    <div id="statsChipBox"></div>
  </div>

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

 const html = list.map((x,i)=>{
  const currentRank = i + 1;
  let prevRank;

if(state.rankingFilter === "all"){
  prevRank = state.previousRanking[x.id];
} else {
  prevRank = state.previousRankingByCategory?.[state.rankingFilter]?.[x.id];
}


  let indicator = "";

  if(isNewToday(x)){
    indicator = `<span style="
      background:#4f8cff;
      color:white;
      padding:2px 6px;
      border-radius:6px;
      font-size:11px;
      font-weight:bold;
    ">NY</span>`;
  }
  else if(prevRank !== undefined){
    const diff = prevRank - currentRank;

    if(diff > 0){
      indicator = `<span style="color:#4caf50;">▲ ${diff}</span>`;
    } 
    else if(diff < 0){
      indicator = `<span style="color:#f44336;">▼ ${Math.abs(diff)}</span>`;
    }
  }

  return `
    <div onclick="showStats(${x.id})"
      style="
        padding:12px;
        margin:6px 0;
        background:#1f1f1f;
        border-radius:12px;
        cursor:pointer;
      ">
      <b>#${currentRank}</b> ${x.name}
<span style="float:right;">
  ${indicator} ${Math.floor(x.rating)}
</span>

    </div>
  `;
}).join("");

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

function toggleCatSection(){
  const el = document.getElementById("catSection");
  const btn = document.getElementById("catToggleBtn");

  if(el.style.display === "none"){
    el.style.display = "block";
    btn.innerText = "📂 Kategorier −";
  } else {
    el.style.display = "none";
    btn.innerText = "📂 Kategorier +";
  }
}

function saveDailyRanking(){
  const today = new Date().toISOString().split("T")[0];

  if(state.lastRankingDate && state.lastRankingDate === today) return;

  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  // 🔹 GLOBAL
  const rankingMap = {};
  sorted.forEach((item, i) => {
    rankingMap[item.id] = i + 1;
  });

  // 🔹 PER KATEGORI
  const categoryMap = {};

  const allCats = [...new Set(state.items.flatMap(i => i.categories))];

  allCats.forEach(cat => {
    const filtered = state.items
      .filter(i => (i.categories || []).includes(cat))
      .sort((a,b)=>b.rating-a.rating);

    const map = {};
    filtered.forEach((item, i) => {
      map[item.id] = i + 1;
    });

    categoryMap[cat] = map;
  });

  // 🔥 lagre alt
  state.previousRanking = rankingMap;
  state.previousRankingByCategory = categoryMap;
  state.lastRankingDate = today;

  localStorage.setItem("previousRanking", JSON.stringify(rankingMap));
  localStorage.setItem("previousRankingByCategory", JSON.stringify(categoryMap));
  localStorage.setItem("lastRankingDate", today);
}

function getDailyMVP(){
  if(!state.previousRanking) return null;

  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  let best = null;
  let bestDiff = 0;

  sorted.forEach((item, i) => {
    const currentRank = i + 1;
    const prevRank = state.previousRanking[item.id];

    if(prevRank === undefined) return;

    const diff = prevRank - currentRank;

    if(diff > bestDiff){
      bestDiff = diff;
      best = { item, diff };
    }
  });

  return best;
}

function isNewToday(item){
  if(!item.createdAt) return false;

  const today = new Date().toISOString().split("T")[0];
  const created = item.createdAt.split("T")[0];

  return today === created;
}

function getPreviousRankInFilter(itemId, filter){
  let prev = Object.entries(state.previousRanking);

  // gjør om til array med items
  let prevItems = prev
    .map(([id, rank]) => {
      const item = state.items.find(x => x.id == id);
      return item ? { ...item, prevRank: rank } : null;
    })
    .filter(Boolean);

  // filter på kategori hvis nødvendig
  if(filter !== "all"){
    prevItems = prevItems.filter(x =>
      (x.categories || []).includes(filter)
    );
  }

  // sorter etter forrige rank
  prevItems.sort((a,b)=>a.prevRank - b.prevRank);

  // finn ny plassering i denne lista
  return prevItems.findIndex(x => x.id === itemId) + 1;
}


function setMode(mode, el){
  state.mode = mode;

  document.querySelectorAll(".modeBtn").forEach(btn=>{
    btn.classList.remove("active");
  });

  if(el) el.classList.add("active");

  renderMode();
}


function toggleMenu(){
  const menu = document.getElementById("modeMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("modeMenu");
  const btn = document.getElementById("menuBtn");

  if(!menu.contains(e.target) && !btn.contains(e.target)){
    menu.style.display = "none";
  }
});

renderChips();
update();
nextMatch();
initDailyTournament();
renderMode();

