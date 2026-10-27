import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { nextMatch, updateHistory } from "./match.js";

const BONUS = 100;
let selectedId = null;

function todayKey(){
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

function availableNow(){
  return new Date().getHours() >= 18;
}

function lastShoutout(){
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("dailyShoutout") || "null");
  } catch(error) {
    console.warn("Ugyldig shoutout-data i localStorage", error);
  }
  const inState = state.dailyShoutout;
  const valid = [saved, inState].filter(record =>
    record && /^\\d{4}-\\d{2}-\\d{2}$/.test(record.date) && record.itemId != null
  );
  return valid.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function awardedToday(){
  const last = lastShoutout();
  return last?.date === todayKey() ? last : null;
}

function shoutoutName(record){
  if(!record) return "";
  const item = state.items.find(item => String(item.id) === String(record.itemId));
  return item?.name || record.itemName || "Et item";
}

export function refreshDailyShoutout(){
  const badge = document.getElementById("dailyShoutoutBadge");
  const button = document.getElementById("dailyShoutoutButton");
  const previousDisplay = document.getElementById("dailyShoutoutLast");
  if(!button || !badge) return;
  const last = lastShoutout();
  const locked = !availableNow() || Boolean(awardedToday());
  const due = !locked;
  badge.hidden = !due;
  button.title = awardedToday() ? "Dagens shoutout er utdelt" : due ? "Velg dagens shoutout" : "Dagens shoutout åpner kl. 18";
  button.setAttribute("aria-label", button.title);
  if(previousDisplay){
    previousDisplay.hidden = !locked || !last;
    if(locked && last){
      previousDisplay.textContent = "🌟 Siste shoutout: " + shoutoutName(last) + " · +100 ELO";
    }
  }
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

function renderShoutoutResults(query = ""){
  const list = document.getElementById("dailyShoutoutResults");
  const confirm = document.getElementById("dailyShoutoutConfirm");
  if(!list || !confirm) return;
  const search = query.trim().toLocaleLowerCase("nb");
  const candidates = state.items
    .filter(item => item.name.toLocaleLowerCase("nb").includes(search))
    .sort((a,b) => a.name.localeCompare(b.name, "nb"))
    .slice(0, 40);
  list.innerHTML = candidates.length ? candidates.map(item =>
    `<button type="button" class="dailyShoutoutOption ${String(item.id) === String(selectedId) ? "selected" : ""}"
      data-shoutout-id="${escapeHtml(item.id)}"><span>${escapeHtml(item.name)}</span><span>⭐ ${Math.round(item.rating)}</span></button>`
  ).join("") : '<p class="dailyShoutoutEmpty">Ingen items funnet.</p>';
  confirm.disabled = selectedId === null || !state.items.some(item => String(item.id) === String(selectedId));
  const selected = state.items.find(item => String(item.id) === String(selectedId));
  confirm.textContent = selected ? "Gi +100 ELO til " + selected.name : "Velg et item";
}

export function openDailyShoutout(){
  const overlay = document.getElementById("dailyShoutoutOverlay");
  const content = document.getElementById("dailyShoutoutContent");
  const input = document.getElementById("dailyShoutoutSearch");
  if(!overlay || !content || !input) return;
  selectedId = null;
  input.value = "";
  const already = awardedToday();
  const available = availableNow();
  input.hidden = !available || Boolean(already);
  document.getElementById("dailyShoutoutResults").hidden = !available || Boolean(already);
  document.getElementById("dailyShoutoutConfirm").hidden = !available || Boolean(already);
  if(already){
    content.textContent = "🌟 Dagens shoutout: " + shoutoutName(already) + " (+100 ELO). Ny shoutout i morgen kl. 18.";
  } else if(!available){
    const last = lastShoutout();
    content.textContent = last
      ? "🌟 Siste shoutout: " + shoutoutName(last) + " (+100 ELO). Du kan velge en ny shoutout kl. 18."
      : "Dagens shoutout åpner kl. 18. Shoutouten gir +100 ELO.";
  } else {
    content.textContent = "Velg dagens item. Shoutouten gir +100 ELO";
    renderShoutoutResults();
  }
  overlay.hidden = false;
  if(available && !already) input.focus();
}

export function closeDailyShoutout(){
  const overlay = document.getElementById("dailyShoutoutOverlay");
  if(overlay) overlay.hidden = true;
  selectedId = null;
}

export function initDailyShoutout(){
  const search = document.getElementById("dailyShoutoutSearch");
  const results = document.getElementById("dailyShoutoutResults");
  if(!search || !results) return;
  search.addEventListener("input", () => renderShoutoutResults(search.value));
  results.addEventListener("click", event => {
    const button = event.target.closest("[data-shoutout-id]");
    if(!button) return;
    selectedId = button.dataset.shoutoutId;
    renderShoutoutResults(search.value);
  });
  document.getElementById("dailyShoutoutOverlay")?.addEventListener("click", event => {
    if(event.target.id === "dailyShoutoutOverlay") closeDailyShoutout();
  });
  refreshDailyShoutout();
  // Keep the exclamation mark accurate if Home stays open past 18:00 or midnight.
  setInterval(refreshDailyShoutout, 30000);
  document.addEventListener("visibilitychange", () => {
    if(!document.hidden) refreshDailyShoutout();
  });
}

export function confirmDailyShoutout(){
  if(!availableNow() || awardedToday()) {
    refreshDailyShoutout();
    openDailyShoutout();
    return;
  }
  const item = state.items.find(candidate => String(candidate.id) === String(selectedId));
  if(!item) return;
  const key = todayKey();
  const record = { date:key, itemId:item.id, itemName:item.name, amount:BONUS };
  // Keep award data in both the normal saved state and a dedicated guard key.
  const previousRating = item.rating;
  const previousHistory = Array.isArray(item.history) ? [...item.history] : item.history;
  item.rating = Math.round((Number(item.rating) || 1000) + BONUS);
  updateHistory(item);
  state.dailyShoutout = record;
  try {
    localStorage.setItem("dailyShoutout", JSON.stringify(record));
    save();
  } catch(error) {
    item.rating = previousRating;
    item.history = previousHistory;
    state.dailyShoutout = null;
    try { localStorage.removeItem("dailyShoutout"); } catch(_) {}
    alert("Kunne ikke lagre shoutouten. Prøv igjen.");
    console.error(error);
    return;
  }
  closeDailyShoutout();
  refreshDailyShoutout();
  if(state.mode === "home"){
    update();
    nextMatch();
  }
  openDailyShoutout();
}
