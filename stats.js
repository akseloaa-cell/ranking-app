function updateH2H(a, b, result){
  if(!a || !b) return;

  if(!a.h2h) a.h2h = {};
  if(!b.h2h) b.h2h = {};

  if(!a.h2h[b.id]){
    a.h2h[b.id] = { w:0, l:0, d:0 };
  }

  if(!b.h2h[a.id]){
    b.h2h[a.id] = { w:0, l:0, d:0 };
  }

  if(result === "win"){
    a.h2h[b.id].w += 1;
    b.h2h[a.id].l += 1;
  }

  if(result === "loss"){
    a.h2h[b.id].l += 1;
    b.h2h[a.id].w += 1;
  }

  if(result === "draw"){
    a.h2h[b.id].d += 1;
    b.h2h[a.id].d += 1;
  }
}

function getH2H(a, b){
  const data = a.h2h?.[b.id];
  if(!data) return "0–0";

  const d = data.d || 0;

  // bare vis draw hvis > 0
  return d > 0 
    ? `${data.w}–${data.l} (${d})`
    : `${data.w}–${data.l}`;
}

function getWinrate(item){
  if(!item.h2h) return 0;

  let wins = 0;
  let losses = 0;
  let draws = 0;

  Object.values(item.h2h).forEach(h => {
    wins += h.w || 0;
    losses += h.l || 0;
    draws += h.d || 0;
  });

  const total = wins + losses + draws;

  if(total === 0) return 0;

  return (wins + draws * 0.5) / total;
}

function isRival(a, b){
  if(!a || !b) return false;

  const h2h = a.h2h?.[b.id];
  if(!h2h) return false;

  const total = (h2h.w || 0) + (h2h.l || 0) + (h2h.d || 0);

  if(total < 3) return false;

  const diff = Math.abs((h2h.w || 0) - (h2h.l || 0));

  return diff <= 1;
}

function updateHistory(item){
  if(!item.history) item.history = [];
  item.history.push(item.rating);

  if(item.history.length > 30){
    item.history.shift();
  }
}

