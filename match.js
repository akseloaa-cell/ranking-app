import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { updateHistory, saveDailyRanking, updateH2H } from "./stats.js";

export function nextMatch(){
  if(state.items.length < 2) return;

  const a = state.items[Math.floor(Math.random() * state.items.length)];
  let candidates = state.items.filter(x => x.id !== a.id);

  const b = candidates[Math.floor(Math.random() * candidates.length)];
  if(!a || !b) return nextMatch();

  state.current = [a, b];

  document.getElementById("a").innerHTML = a.name;
  document.getElementById("b").innerHTML = b.name;

  document.getElementById("a").onclick = () => pick(0);
  document.getElementById("b").onclick = () => pick(1);
}

export function pick(i){
  const [a, b] = state.current;

  const w = state.current[i];
  const l = state.current[1 - i];

  const Ea = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400));

  w.rating += 32 * (1 - Ea);
  l.rating += 32 * (0 - Ea);

  updateHistory(w);
  updateHistory(l);

  updateH2H(w, l, "win");

  state.recentMatches.push([a.id, b.id].sort().join("-"));
  if(state.recentMatches.length > 15) state.recentMatches.shift();

  save();
  update();
  nextMatch();
}

export function draw(){
  const [a, b] = state.current;

  const Ea = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
  const Eb = 1 / (1 + Math.pow(10, (a.rating - b.rating) / 400));

  a.rating += 32 * (0.5 - Ea);
  b.rating += 32 * (0.5 - Eb);

  updateHistory(a);
  updateHistory(b);

  save();
  update();
  nextMatch();
}
