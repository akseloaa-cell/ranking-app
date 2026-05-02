
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
