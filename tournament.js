
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
