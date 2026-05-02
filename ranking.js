import { state } from "./main.js";

export function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}

export function updateRanking(){
  let sorted = [...state.items].sort((a,b)=>b.rating-a.rating);
  let list = sorted.slice(0,10);

  const html = list.map((x,i)=>`
    <div onclick="showStats(${x.id})"
      style="padding:10px;background:#1f1f1f;margin:5px 0;border-radius:10px;">
      ${i+1}. ${x.name} (${Math.floor(x.rating)})
    </div>
  `).join("");

  document.getElementById("ranking").innerHTML =
    "<h3>🏆 Ranking</h3>" + html;
}
