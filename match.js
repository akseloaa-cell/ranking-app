import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { updateHistory, saveDailyRanking, updateH2H } from "./stats.js";
import { getRank } from "./ranking.js";
import { getH2H, isRival } from "./stats.js";


export function nextMatch(){
  if(state.items.length < 2) return;

  const a = state.items[Math.floor(Math.random() * state.items.length)];
  let candidates = state.items.filter(x => x.id !== a.id);

  const b = candidates[Math.floor(Math.random() * candidates.length)];
  if(!a || !b) return nextMatch();

  state.current = [a, b];

  document.getElementById("a").innerHTML = formatchoice(a, b);
  document.getElementById("b").innerHTML = formatchoice(b, a);

  document.getElementById("a").onclick = () => pick(0);
  document.getElementById("b").onclick = () => pick(1);
}

export function pick(i){
  const [a, b] = state.current;

  const w = state.current[i];
  const l = state.current[1 - i];

  const Ea = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400));

  w.rating += 32 * (1 - Ea);
  l.rating += 32 * (0 - Ea);

  updateHistory(w);
  updateHistory(l);

  updateH2H(w, l, "win");

  state.recentMatches.push([a.id, b.id].sort().join("-"));
  if(state.recentMatches.length > 15) state.recentMatches.shift();

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

  save();
  update();
  nextMatch();
}

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
