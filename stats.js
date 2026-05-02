import { state, save } from "./main.js"; 

export function getWinrate(item){
  if(!item.h2h) return 0;

  let wins = 0, losses = 0, draws = 0;

  Object.values(item.h2h).forEach(h=>{
    wins += h.w || 0;
    losses += h.l || 0;
    draws += h.d || 0;
  });

  const total = wins + losses + draws;
  if(total === 0) return 0;

  return (wins + draws * 0.5) / total;
}

export function showStats(id){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  document.getElementById("statsContent").innerHTML = `
    <h2>${item.name}</h2>
    <p>⭐ ${Math.floor(item.rating)}</p>
    <p>📊 ${(getWinrate(item)*100).toFixed(1)}%</p>
  `;
}

