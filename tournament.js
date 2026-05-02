import { state, save } from "./main.js";

export function startTournament(){
  let pool = [...state.items];

  if(pool.length < 4){
    alert("Trenger flere items");
    return;
  }

  pool = pool.sort(()=>Math.random()-0.5);

  let round = [];
  for(let i=0;i<pool.length;i+=2){
    round.push({a:pool[i], b:pool[i+1], winner:null});
  }

  state.bracket = [round];
  renderBracket();
}

export function renderBracket(){
  let html = "<div class='bracket'>";

  state.bracket.forEach(r=>{
    html += "<div class='round'>";

    r.forEach(m=>{
      html += `<div class="match">${m.a.name}<br>${m.b.name}</div>`;
    });

    html += "</div>";
  });

  html += "</div>";

  document.getElementById("bracket").innerHTML = html;
}
