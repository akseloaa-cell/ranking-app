function update(){
  let sorted = [...state.items].sort((a,b)=>b.rating-a.rating);
  let list = sorted.slice(0,10);

  const mvp = getDailyMVP();
  let mvpHtml = "";


if(mvp){
  const rank = getRank(mvp.item.id);
  const elo = Math.floor(mvp.item.rating);

mvpHtml = `
  <div style="
    margin-bottom:6px;
    padding:6px 0;
    border-bottom:1px solid rgba(255,255,255,0.08);
    font-size:13px;
    opacity:0.9;
  ">
    🔥 ${mvp.item.name}
    <span style="opacity:0.6;"> • #${rank} • ⭐ ${elo}</span>
    <span style="color:#4caf50; font-weight:600;">
      • ▲ ${mvp.diff}
    </span>
  </div>
`;

}
  const html =
    list.map((x,i)=>{
      const currentRank = i + 1;
      const prevRank = state.previousRanking[x.id];

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
      } else {
        const diff = prevRank - currentRank;

        if(diff > 0){
          indicator = `<span style="color:#4caf50;">▲ ${diff}</span>`;
        } else if(diff < 0){
          indicator = `<span style="color:#f44336;">▼ ${Math.abs(diff)}</span>`;
        }
      }

      const mvp = getDailyMVP();

let mvpHtml = "";

if(mvp){
  mvpHtml = `
    <div style="
      background:#1f1f1f;
      padding:10px;
      border-radius:10px;
      margin-bottom:10px;
    ">
      🔥 Dagens MVP: <b>${mvp.item.name}</b>
      <span style="color:#4caf50;">▲ ${mvp.diff}</span>
    </div>
  `;
}

      return `
        <div onclick="showStats(${x.id})"
          style="cursor:pointer; padding:10px; background:#1f1f1f; margin:5px 0; border-radius:10px;">
          ${currentRank}. ${x.name} (${Math.floor(x.rating)})
          <span style="float:right;">
            ${indicator}
          </span>
        </div>
      `;
    }).join("");

  document.getElementById("ranking").innerHTML =
  "<h3>🏆 Ranking</h3>" +
  mvpHtml +

    `
    <div style="display:flex; gap:8px; margin-bottom:10px;">
      <button onclick="openRankingView()" style="flex:1;">
        📊 Full ranking
      </button>

      <button onclick="openAddItem()" style="
        width:50px;
        height:50px;
        border-radius:50%;
        font-size:20px;
      ">+</button>
    </div>
    ` + html;
}

function renderChips(filter=""){
  const box = document.getElementById("chipBox");

const f = filter.toLowerCase();

let list = state.categories.filter(c => c.includes(f));

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

function renderMode(){

  const ranking = document.getElementById("ranking");
  const vs = document.querySelector(".vs");
  const bracket = document.getElementById("bracket");
  const tournament = document.getElementById("tournament");

  // default vis home
  ranking.style.display = "block";
  vs.style.display = "flex";
  bracket.style.display = "block";
  tournament.style.display = "block";

  if(state.mode === "home"){
    ranking.style.display = "block";
    vs.style.display = "flex";
    bracket.style.display = "none";
    tournament.style.display = "none";
  }

  if(state.mode === "versus"){
    ranking.style.display = "none";
    vs.style.display = "flex";
    bracket.style.display = "none";
    tournament.style.display = "none";
  }

  if(state.mode === "tournament"){
    ranking.style.display = "none";
    vs.style.display = "none";
    bracket.style.display = "block";
    tournament.style.display = "block";
  }
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
