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

function pick(i){
  const match = state.current;

  if(!match || !match[0] || !match[1]){
    console.warn("Invalid match state", match);
    nextMatch();
    return;
  }

  let w = match[i];
  let l = match[1 - i];

  if(!w || !l){
    console.warn("Undefined player in match", w, l);
    nextMatch();
    return;
  }

  let Ea = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400));

  w.rating += 32 * (1 - Ea);
  l.rating += 32 * (0 - Ea);

  // 🔥 streaks
if(!w.streak) w.streak = 0;
if(!l.streak) l.streak = 0;

// winner
if(w.streak >= 0){
  w.streak += 1;
} else {
  w.streak = 1;
}

// loser
if(l.streak <= 0){
  l.streak -= 1;
} else {
  l.streak = -1;
}

  const a = state.current[0];
const b = state.current[1];

const key = matchKey(a, b);

state.recentMatches.push(key);

// behold bare siste 10–15 matcher
if(state.recentMatches.length > 15){
  state.recentMatches.shift();
}

localStorage.setItem("recentMatches", JSON.stringify(state.recentMatches));

  updateHistory(w);
  updateHistory(l);
  saveDailyRanking();

  save();
  update();
  nextMatch();
}

function draw(){
  if(!state.current.length) return;

  let a = state.current[0];
  let b = state.current[1];
  updateH2H(a, b, "draw");

  let Ea = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
  let Eb = 1 / (1 + Math.pow(10, (a.rating - b.rating) / 400));

  // 0.5 = draw
  a.rating += 32 * (0.5 - Ea);
  b.rating += 32 * (0.5 - Eb);
  a.streak = 0;
b.streak = 0;

  updateHistory(a);
  updateHistory(b);

  save();
  update();
  nextMatch();
  saveDailyRanking();
}
