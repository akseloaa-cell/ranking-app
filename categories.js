import { state } from "./state.js";
import { save } from "./storage.js";

export function normalize(c){
  return c.trim().toLowerCase();
}

export function addCategory(){
  let v = document.getElementById("catInput").value;
  if(!v || !v.trim()) return;

  v = normalize(v);

  if(!state.categories.includes(v)){
    state.categories.push(v);
  }

  document.getElementById("catInput").value = "";
  renderChips();
  save();
}

export function toggleCat(el){
  el.classList.toggle("active");
}

