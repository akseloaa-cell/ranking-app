import { state } from "./state.js";

export function showStats(id){
  const item = state.items.find(x => x.id === id);
  if(!item) return;

  document.getElementById("statsContent").innerHTML = `
    <h2>${item.name}</h2>
    <p>Rating: ${Math.floor(item.rating)}</p>
  `;

  document.getElementById("statsOverlay").style.display = "flex";
}

export function closeStats(){
  document.getElementById("statsOverlay").style.display = "none";
}

export function updateHistory(item){
  if(!item.history) item.history = [];
  item.history.push(item.rating);
  if(item.history.length > 30) item.history.shift();
}

export function updateH2H(a, b, result){
  if(!a.h2h) a.h2h = {};
  if(!a.h2h[b.id]) a.h2h[b.id] = { w:0,l:0,d:0 };

  if(result === "win") a.h2h[b.id].w++;
  if(result === "loss") a.h2h[b.id].l++;
  if(result === "draw") a.h2h[b.id].d++;
}

export function saveDailyRanking(){
  // simplified versjon
  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  state.previousRanking = {};
  sorted.forEach((x,i)=>state.previousRanking[x.id] = i+1);
}
