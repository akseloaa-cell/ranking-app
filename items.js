import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { nextMatch } from "./match.js";
import { normalize } from "./categories.js";
import { commit } from "./state.js";

export function addItem(){
  let name = document.getElementById("itemInput").value;

  name = name.trim();
  if(!name) return;

  let selected = [...document.querySelectorAll("#chipBox .chip.active")]
    .map(x => normalize(x.innerText));

commit(() => {
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
});

  document.getElementById("itemInput").value = "";
  document
    .querySelectorAll("#chipBox .chip.active")
    .forEach(chip => chip.classList.remove("active"));

  state.selectedCategories = [];
  save();
  update();
  nextMatch();
}
