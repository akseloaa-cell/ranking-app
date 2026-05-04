import { state } from "./state.js";
import { save } from "./storage.js";
import { renderChips } from "./ui.js";

export function normalize(c){
  return c.trim().toLowerCase();
}

export function addCategory(){
  let v = document.getElementById("catInput").value;
  if(!v || !v.trim()) return;

  v = v.trim().toLowerCase();

  if(!state.categories.includes(v)){
    state.categories.push(v);
  }

  document.getElementById("catInput").value = "";

  renderChips({ targetId: "chipBox", mode: "select" });
  save();
}

export function toggleCat(el){
  el.classList.toggle("active");
}

