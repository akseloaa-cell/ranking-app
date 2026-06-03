import { state } from "./state.js";

function getRating(item){
  if(!state.categoryElo[item.id]){
    state.categoryElo[item.id] = item.rating || 1000;
  }
  return state.categoryElo[item.id];
}

export function categoryPick(winner, loser){

  const Ra = getRating(winner);
  const Rb = getRating(loser);

  const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));

  const K = 28;

  // 🔥 stronger underdog boost
  const boost = Ea < 0.5 ? 2.0 : 1;

  const change = Math.round(K * (1 - Ea) * boost);

  state.categoryElo[winner.id] = Ra + change;
  state.categoryElo[loser.id] = Rb - change;
}

