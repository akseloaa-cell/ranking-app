import { state } from "./state.js";

export function update(){
  const sorted = [...state.items].sort((a,b)=>b.rating-a.rating);

  document.getElementById("ranking").innerHTML =
    sorted.slice(0,10).map((x,i)=>`
      <div onclick="showStats(${x.id})">
        #${i+1} ${x.name} (${Math.floor(x.rating)})
      </div>
    `).join("");
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
