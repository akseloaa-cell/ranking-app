import { state } from "./state.js";

export function save(){
  localStorage.setItem("items", JSON.stringify(state.items));
  localStorage.setItem("categories", JSON.stringify(state.categories));
}

export function saveTournament(){
  localStorage.setItem("dailyTournament", JSON.stringify(state.tournament));
}
