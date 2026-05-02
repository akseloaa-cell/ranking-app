import { state } from "./state.js";

export function toggleMenu(){
  const menu = document.getElementById("modeMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

export function setMode(mode){
  state.mode = mode;
}

export function scrollToTop(){
  document.getElementById("rankingView").scrollTop = 0;
}

export function closeAddItem(){
  document.getElementById("addOverlay").style.display = "none";
}
