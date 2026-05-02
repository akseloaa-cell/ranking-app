function nextMatch(){
  if(state.items.length < 2) return;

  const items = state.items;

  // 1. velg første item tilfeldig
  const a = items[Math.floor(Math.random() * items.length)];

  let candidates = items.filter(x => x.id !== a.id);

  // 🎯 60% sjanse: samme kategori
  if(Math.random() < 0.6 && a.categories.length){
    const shared = candidates.filter(x =>
      x.categories.some(c => a.categories.includes(c))
    );

    if(shared.length > 0){
      candidates = shared;
    }
  }

  // ⚖️ 30% sjanse: lignende rating
  if(Math.random() < 0.3){
    const target = a.rating;

    candidates.sort((x, y) =>
      Math.abs(x.rating - target) - Math.abs(y.rating - target)
    );

    candidates = candidates.slice(0, Math.max(2, Math.floor(candidates.length * 0.3)));
  }

  // 🎲 fallback hvis tom liste
  if(candidates.length === 0){
    candidates = items.filter(x => x.id !== a.id);
  }

  // legg inn tidligere matcher filter
let recent = state.recentMatches;

candidates = candidates.filter(b => {
  const key = matchKey(a, b);

  return !recent.includes(key);
});

  // velg b
 const b = candidates[Math.floor(Math.random() * candidates.length)];

if(!a || !b){
  console.warn("Invalid match skipped", a, b);
  return nextMatch();
}

state.current = [a, b];


  const elA = document.getElementById("a");
  const elB = document.getElementById("b");

  elA.innerHTML = formatChoice(a, b);
  elB.innerHTML = formatChoice(b, a);

  elA.onclick = () => pick(0);
  elB.onclick = () => pick(1);
}
