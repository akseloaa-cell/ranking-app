import { state } from "./main.js";
 
export function renderChips(filter=""){
  const box = document.getElementById("chipBox");
  const f = filter.toLowerCase();

  let list = state.categories.filter(c => c.includes(f));

  if(!state.showAllChips){
    list = list.slice(0, 4);
  }

  box.innerHTML =
    list.map(c => `<div class="chip" onclick="toggleCat(this)">${c}</div>`).join("") +

    (state.categories.length > 4 ? `
      <div class="chip" onclick="toggleAllChips()" style="background:#4f8cff;color:white;font-weight:bold;">
        ${state.showAllChips ? "−" : "+"}
      </div>
    ` : "");
}

export function toggleAllChips(){
  state.showAllChips = !state.showAllChips;
  renderChips();
}

export function toggleCat(el){
  el.classList.toggle("active");
}

// ================= MODE =================
export function setMode(mode, el){
  state.mode = mode;

  document.querySelectorAll(".modeBtn").forEach(btn=>{
    btn.classList.remove("active");
  });

  if(el) el.classList.add("active");

  renderMode();
}

export function renderMode(){
  const ranking = document.getElementById("ranking");
  const vs = document.querySelector(".vs");
  const bracket = document.getElementById("bracket");
  const tournament = document.getElementById("tournament");

  ranking.style.display = "block";
  vs.style.display = "flex";
  bracket.style.display = "none";
  tournament.style.display = "none";

  if(state.mode === "versus"){
    ranking.style.display = "none";
  }

  if(state.mode === "tournament"){
    ranking.style.display = "none";
    vs.style.display = "none";
    bracket.style.display = "block";
    tournament.style.display = "block";
  }
}
