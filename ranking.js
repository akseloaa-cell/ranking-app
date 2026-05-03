import { state } from "./state.js";

export function update(){
  const list = [...state.items].sort((a,b)=>b.rating-a.rating);

  const html = list.map((x,i)=>`
    <div onclick="showStats(${x.id})"
      style="padding:12px;margin:6px 0;background:#1f1f1f;border-radius:12px;cursor:pointer;">
      <b>#${i+1}</b> ${x.name}
      <span style="float:right;">${Math.floor(x.rating)}</span>
    </div>
  `).join("");

  document.getElementById("ranking").innerHTML = html;
}

export function getRank(id){
  return [...state.items]
    .sort((a,b)=>b.rating-a.rating)
    .findIndex(x => x.id === id) + 1;
}

export function setSort(type){
  state.rankingSort = type;
  update();
}
