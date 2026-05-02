import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { nextMatch } from "./match.js";

export function addItem(){
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
