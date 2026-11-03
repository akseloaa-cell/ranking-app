import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { getRank } from "./ranking.js";
// ================= H2H =================

function ensureH2H(a, b){
  if(!a.h2h) a.h2h = {};
  if(!b.h2h) b.h2h = {};

  if(!a.h2h[b.id]){
    a.h2h[b.id] = { wins: 0, losses: 0, draws: 0 };
  }

  if(!b.h2h[a.id]){
    b.h2h[a.id] = { wins: 0, losses: 0, draws: 0 };
  }
}

export function updateH2H(a, b, result){
  ensureH2H(a, b);

  if(result === "win"){
    a.h2h[b.id].wins += 1;
    b.h2h[a.id].losses += 1;
  }

  if(result === "loss"){
    a.h2h[b.id].losses += 1;
    b.h2h[a.id].wins += 1;
  }

  if(result === "draw"){
    a.h2h[b.id].draws += 1;
    b.h2h[a.id].draws += 1;
  }
}

export function getH2H(a, b){
  if(!a.h2h || !a.h2h[b.id]){
    return "0-0(0)";
  }

  const h = a.h2h[b.id];

  return `${h.wins || 0}-${h.losses || 0}(${h.draws || 0})`;
}

export function isRival(a, b){
  if(!a.h2h || !a.h2h[b.id]) return false;

  const h = a.h2h[b.id];

  const wins = h.wins || 0;
  const losses = h.losses || 0;
  const draws = h.draws || 0;

  const total = wins + losses + draws;

  // minst 4 matcher
  if(total < 4) return false;

  // hvor jevn matchupen er
  const diff = Math.abs(wins - losses);

  // rival hvis ganske jevnt
  return diff <= 2;
}
// ================= HISTORY =================

export function updateHistory(item){
  if(!item.history) item.history = [];

  item.history.push(item.rating);

  if(item.history.length > 30){
    item.history.shift();
  }
}

// ================= MATCH =================

// A shared K-factor for the matchup: lower average ELO means larger swings.
// At 1000 average ELO this keeps the old K=32. Bounded for extreme ratings.
function getMatchK(a, b){
  const avg = (Math.max(100, Number(a.rating) || 1000) +
               Math.max(100, Number(b.rating) || 1000)) / 2;
  return Math.max(12, Math.min(48, 32 * 1000 / avg));
}

function getWinEloChanges(winner, loser){
  const expected = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
  const base = Math.round(getMatchK(winner, loser) * (1 - expected));

  // An upset earns an extra boost without taking that extra ELO from the
  // favourite. At most 75% more than the regular winner's reward.
  const ratingGap = Math.max(0, loser.rating - winner.rating);
  const upsetMultiplier = 1 + Math.min(0.75, ratingGap / 1000);
  return {
    gain: Math.round(base * upsetMultiplier),
    loss: base
  };
}



export function formatChoice(item, opponent){
  const rank = getRank(item.id);
  const elo = Math.round(item.rating);

  const rival = isRival(item, opponent)
    ? `<span style="color:#ff4d4d;">🔥</span>`
    : "";

  const h2h = getH2H(item, opponent);

  const gain = getWinEloChanges(item, opponent).gain;
  const loss = -getWinEloChanges(opponent, item).loss;

  return `
    <div style="font-size:18px;font-weight:600;">
      ${item.name} ${rival}
    </div>

    <div style="font-size:12px;opacity:0.6;">
      #${rank} • ⭐ ${elo}
    </div>

    <div style="font-size:11px;opacity:0.5;">
      ${h2h}
    </div>

    <div style="font-size:13px;">
      <span style="color:#4caf50;">+${gain}</span>
      /
      <span style="color:#f44336;">${loss}</span>
    </div>
  `;
}

export function nextMatch(){
  const aEl = document.getElementById("a");
  const bEl = document.getElementById("b");

  if(state.items.length < 2){
    state.current = [];
    if(aEl) {
      aEl.innerHTML = "Legg til minst 2 items";
      aEl.onclick = null;
    }
    if(bEl) {
      bEl.innerHTML = "";
      bEl.onclick = null;
    }
    return;
  }

  const a = state.items[Math.floor(Math.random() * state.items.length)];
  const candidates = state.items.filter(x => x.id !== a.id);

  const b = candidates[Math.floor(Math.random() * candidates.length)];

  if(!a || !b) return nextMatch();

  state.current = [a, b];

  if(!aEl || !bEl) return;

  aEl.innerHTML = formatChoice(a, b);
  bEl.innerHTML = formatChoice(b, a);

  aEl.onclick = () => pick(0);
  bEl.onclick = () => pick(1);
}

export function pick(i){
  if(!state.current || state.current.length < 2){
    nextMatch();
    return;
  }

  const winner = state.current[i];
  const loser = state.current[1 - i];

  if(!winner || !loser){
    nextMatch();
    return;
  }

  const changes = getWinEloChanges(winner, loser);
  winner.rating += changes.gain;
  loser.rating -= changes.loss;

  // 🔥 safety
  winner.rating = Math.round(winner.rating);
  loser.rating = Math.round(loser.rating);

  winner.streak = winner.streak > 0 ? winner.streak + 1 : 1;
  loser.streak = loser.streak < 0 ? loser.streak - 1 : -1;

  updateHistory(winner);
  updateHistory(loser);

  updateH2H(winner, loser, "win");

  save();
update();

if(state.mode === "home"){
  nextMatch();
}
}

export function draw(){
  if(!state.current || state.current.length < 2){
    nextMatch();
    return;
  }

  const [a, b] = state.current;

  if(!a || !b){
    nextMatch();
    return;
  }

  const Ea = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
  const Eb = 1 / (1 + Math.pow(10, (a.rating - b.rating) / 400));

  // Draw is also zero-sum and uses the same dynamic K factor.
  const changeA = Math.round(getMatchK(a, b) * (0.5 - Ea));
  const changeB = -changeA;

  a.rating += changeA;
  b.rating += changeB;

  // 🔥 safety
  a.rating = Math.round(a.rating);
  b.rating = Math.round(b.rating);

  a.streak = 0;
  b.streak = 0;

  updateHistory(a);
  updateHistory(b);

  updateH2H(a, b, "draw");

  save();
update();

if(state.mode === "home"){
  nextMatch();
}
}
