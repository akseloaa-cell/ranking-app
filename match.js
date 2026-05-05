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
    return "0-0-0";
  }

  const h = a.h2h[b.id];

  return `${h.wins || 0}-${h.losses || 0}-${h.draws || 0}`;
}

export function isRival(a, b){
  if(!a.h2h || !a.h2h[b.id]) return false;

  const h = a.h2h[b.id];
  const total = (h.wins || 0) + (h.losses || 0) + (h.draws || 0);

  return total >= 3;
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

function formatChoice(item, opponent){
  const rank = getRank(item.id);
  const elo = Math.round(item.rating);

  const rival = isRival(item, opponent)
    ? `<span style="color:#ff4d4d;">🔥</span>`
    : "";

  const h2h = getH2H(item, opponent);

  const Ea = 1/(1+Math.pow(10,(opponent.rating-item.rating)/400));
  const gain = Math.round(32*(1-Ea));
  const loss = Math.round(32*(0-Ea));

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
  if(state.items.length < 2) return;

  const a = state.items[Math.floor(Math.random() * state.items.length)];
  const candidates = state.items.filter(x => x.id !== a.id);

  const b = candidates[Math.floor(Math.random() * candidates.length)];

  if(!a || !b) return nextMatch();

  state.current = [a, b];

  document.getElementById("a").innerHTML = formatChoice(a, b);
  document.getElementById("b").innerHTML = formatChoice(b, a);

  document.getElementById("a").onclick = () => pick(0);
  document.getElementById("b").onclick = () => pick(1);
}

export function pick(i){
  const [a, b] = state.current;

  const winner = state.current[i];
  const loser = state.current[1 - i];

  const Ea = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));

  winner.rating += 32 * (1 - Ea);
  loser.rating += 32 * (0 - Ea);

  updateHistory(winner);
  updateHistory(loser);

  updateH2H(winner, loser, "win");

  save();
  update();
  nextMatch();
}

export function draw(){
  const [a, b] = state.current;

  const Ea = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
  const Eb = 1 / (1 + Math.pow(10, (a.rating - b.rating) / 400));

  a.rating += 32 * (0.5 - Ea);
  b.rating += 32 * (0.5 - Eb);

  updateHistory(a);
  updateHistory(b);

  updateH2H(a, b, "draw");

  save();
  update();
  nextMatch();
}
