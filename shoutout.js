import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { nextMatch, updateHistory } from "./match.js";

const BONUS = 200;
const chosenIds = new Set();
const allocations = new Map();
let step = "select";

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
    record && /^\d{4}-\d{2}-\d{2}$/.test(record.date) && (record.itemId != null || Array.isArray(record.awards))
  );
  return valid.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function awardedToday(){
  const last = lastShoutout();
  return last?.date === todayKey() ? last : null;
}

function shoutoutAwards(record){
  if(!record) return [];
  // Earlier shoutouts gave 100 ELO to one item; preserve their display.
  if(Array.isArray(record.awards)) return record.awards.filter(x => x?.itemId != null);
  if(record.itemId != null) return [{ itemId: record.itemId, itemName: record.itemName, amount: record.amount ?? 100 }];
  return [];
}

function shoutoutName(award){
  const item = state.items.find(item => String(item.id) === String(award.itemId));
  return item?.name || award.itemName || "Et item";
}

export function refreshDailyShoutout(){
  const badge = document.getElementById("dailyShoutoutBadge");
  const button = document.getElementById("dailyShoutoutButton");
  if(!button || !badge) return;
  const due = availableNow() && !awardedToday();
  badge.hidden = !due;
  button.title = awardedToday() ? "Dagens shoutout er utdelt" : due ? "Velg dagens shoutout" : "Dagens shoutout åpner kl. 18";
  button.setAttribute("aria-label", button.title);
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

function validChosenItems(){
  return [...chosenIds].map(id => state.items.find(item => String(item.id) === id)).filter(Boolean);
}

function renderShoutoutResults(query = ""){
  const list = document.getElementById("dailyShoutoutResults");
  const next = document.getElementById("dailyShoutoutNext");
  if(!list || !next) return;
  const search = query.trim().toLocaleLowerCase("nb");
  // Selected options stay above the others, including when searching.
  const candidates = state.items
    .filter(item => item.name.toLocaleLowerCase("nb").includes(search))
    .sort((a,b) => Number(chosenIds.has(String(b.id))) - Number(chosenIds.has(String(a.id)))
      || a.name.localeCompare(b.name, "nb"));
  list.innerHTML = candidates.length ? candidates.map(item => {
    const chosen = chosenIds.has(String(item.id));
    return `<button type="button" aria-pressed="${chosen}" class="dailyShoutoutOption ${chosen ? "selected" : ""}"
      data-shoutout-id="${escapeHtml(item.id)}"><span class="dailyShoutoutOptionName">${chosen ? "✓ " : ""}${escapeHtml(item.name)}</span><span>⭐ ${Math.round(item.rating)}</span></button>`;
  }).join("") : '<p class="dailyShoutoutEmpty">Ingen items funnet.</p>';
  const n = validChosenItems().length;
  document.getElementById("dailyShoutoutSelectedCount").textContent = n + " items valgt";
  next.disabled = n === 0;
  next.textContent = n ? "Videre med " + n + " items →" : "Velg minst ett item";
}

function renderPreviousShoutout(){
  const list = document.getElementById("dailyShoutoutPreviousList");
  if(!list) return;
  const last = lastShoutout();
  const awards = shoutoutAwards(last);
  list.innerHTML = awards.length ? awards.map(award =>
    '<div class="dailyShoutoutPreviewCard"><span class="dailyShoutoutPreviewStar">🌟</span>' +
    '<span class="dailyShoutoutPreviousName">' + escapeHtml(shoutoutName(award)) + '</span>' +
    '<span class="dailyShoutoutPreviousBonus">+' + Math.round(Number(award.amount) || 0) + ' ELO</span></div>'
  ).join("") : '<div class="dailyShoutoutPreviewCard">Ingen shoutout valgt ennå</div>';
}

function renderDistribution(){
  const sliderRow = document.getElementById("dailyShoutoutSliders");
  if(!sliderRow) return;
  sliderRow.innerHTML = validChosenItems().map(item => {
    const id = String(item.id);
    const amount = allocations.get(id) || 0;
    return `<div class="dailyShoutoutSliderCard">
      <div class="dailyShoutoutSliderAmount" data-amount-id="${escapeHtml(id)}">+${amount} ELO</div>
      <input class="dailyShoutoutSlider" type="range" min="0" max="200" step="1" value="${amount}"
        data-slider-id="${escapeHtml(id)}" aria-label="ELO til ${escapeHtml(item.name)}">
      <div class="dailyShoutoutSliderName">${escapeHtml(item.name)}</div>
    </div>`;
  }).join("");
  updateDistributionTotals();
}

function updateDistributionTotals(){
  const used = [...allocations.values()].reduce((sum, amount) => sum + amount, 0);
  const remaining = BONUS - used;
  document.getElementById("dailyShoutoutBudgetAmount").textContent = used + " / " + BONUS;
  document.getElementById("dailyShoutoutBudgetFill").style.width = (used / BONUS * 100) + "%";
  const valid = validChosenItems().length > 0
    && validChosenItems().every(item => (allocations.get(String(item.id)) || 0) > 0)
    && used === BONUS;
  document.getElementById("dailyShoutoutConfirm").disabled = !valid;
  document.getElementById("dailyShoutoutDistributionError").textContent =
    valid ? "Alle 200 ELO er fordelt." : remaining > 0
      ? remaining + " ELO gjenstår. Alle valgte items må få minst 1 ELO."
      : "Alle valgte items må få minst 1 ELO.";
  // Each slider can consume only the amount currently left unallocated.
  document.querySelectorAll("[data-slider-id]").forEach(slider => {
    const amount = allocations.get(slider.dataset.sliderId) || 0;
    slider.max = Math.min(BONUS, amount + remaining);
  });
}

export function nextDailyShoutoutStep(){
  if(!availableNow() || awardedToday() || chosenIds.size === 0) return;
  if(chosenIds.size > BONUS){
    alert("Du kan velge maksimalt 200 items når alle skal få minst 1 ELO.");
    return;
  }
  // Keep allocations when returning to the selection step.
  for(const id of [...allocations.keys()]) if(!chosenIds.has(id)) allocations.delete(id);
  for(const id of chosenIds) if(!allocations.has(id)) allocations.set(id, 0);
  step = "distribute";
  document.getElementById("dailyShoutoutSelection").hidden = true;
  document.getElementById("dailyShoutoutDistribution").hidden = false;
  document.getElementById("dailyShoutoutContent").textContent = "Fordel dagens 200 ELO";
  renderDistribution();
}

export function backDailyShoutoutStep(){
  step = "select";
  document.getElementById("dailyShoutoutDistribution").hidden = true;
  document.getElementById("dailyShoutoutSelection").hidden = false;
  document.getElementById("dailyShoutoutContent").textContent = "Velg items som skal få en del av dagens 200 ELO.";
  renderShoutoutResults(document.getElementById("dailyShoutoutSearch").value);
}

function updateDailyShoutoutCountdown(){
  const countdown = document.getElementById("dailyShoutoutCountdown");
  if(!countdown) return;
  const now = new Date();
  const target = new Date(now);
  target.setHours(18, 0, 0, 0);
  // Once today's shoutout has been awarded, the next opportunity is tomorrow.
  if(awardedToday()) target.setDate(target.getDate() + 1);
  if(now >= target) target.setDate(target.getDate() + 1);
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const remaining = String(seconds % 60).padStart(2, "0");
  countdown.textContent = hours + ":" + minutes + ":" + remaining;
}

export function openDailyShoutout(){
  const overlay = document.getElementById("dailyShoutoutOverlay");
  const content = document.getElementById("dailyShoutoutContent");
  const search = document.getElementById("dailyShoutoutSearch");
  if(!overlay || !content || !search) return;
  chosenIds.clear();
  allocations.clear();
  step = "select";
  search.value = "";
  const already = awardedToday();
  const locked = !availableNow() || Boolean(already);
  document.getElementById("dailyShoutoutLockedView").hidden = !locked;
  document.getElementById("dailyShoutoutSelection").hidden = locked;
  document.getElementById("dailyShoutoutDistribution").hidden = true;
  overlay.dataset.shoutoutLocked = String(locked);
  content.hidden = locked;
  if(locked){
    content.textContent = "";
    renderPreviousShoutout();
    document.getElementById("dailyShoutoutAvailability").textContent =
      already ? "Neste shoutout åpner i morgen kl. 18" : "Neste shoutout åpner i dag kl. 18";
    updateDailyShoutoutCountdown();
  } else {
    content.textContent = "Velg items som skal få en del av dagens 200 ELO.";
    renderShoutoutResults();
  }
  overlay.hidden = false;
  if(!locked) search.focus();
}

export function closeDailyShoutout(){
  const overlay = document.getElementById("dailyShoutoutOverlay");
  if(overlay) overlay.hidden = true;
  chosenIds.clear();
  allocations.clear();
}

export function initDailyShoutout(){
  const search = document.getElementById("dailyShoutoutSearch");
  const results = document.getElementById("dailyShoutoutResults");
  if(!search || !results) return;
  search.addEventListener("input", () => renderShoutoutResults(search.value));
  results.addEventListener("click", event => {
    const button = event.target.closest("[data-shoutout-id]");
    if(!button) return;
    const id = button.dataset.shoutoutId;
    if(chosenIds.has(id)){
      chosenIds.delete(id);
      allocations.delete(id);
    } else if(chosenIds.size < BONUS) {
      chosenIds.add(id);
    } else {
      alert("Maksimalt 200 items kan motta ELO på én dag.");
    }
    renderShoutoutResults(search.value);
  });
  document.getElementById("dailyShoutoutSliders")?.addEventListener("input", event => {
    const slider = event.target.closest("[data-slider-id]");
    if(!slider) return;
    const id = slider.dataset.sliderId;
    const previous = allocations.get(id) || 0;
    const used = [...allocations.values()].reduce((sum, n) => sum + n, 0);
    const allowed = Math.min(BONUS, BONUS - (used - previous));
    const amount = Math.max(0, Math.min(allowed, Math.round(Number(slider.value) || 0)));
    allocations.set(id, amount);
    slider.value = amount;
    document.querySelectorAll("[data-amount-id]").forEach(label => {
      if(label.dataset.amountId === id) label.textContent = "+" + amount + " ELO";
    });
    updateDistributionTotals();
  });
  document.getElementById("dailyShoutoutOverlay")?.addEventListener("click", event => {
    if(event.target.id === "dailyShoutoutOverlay") closeDailyShoutout();
  });
  refreshDailyShoutout();
  setInterval(() => {
    refreshDailyShoutout();
    const overlay = document.getElementById("dailyShoutoutOverlay");
    if(!overlay || overlay.hidden) return;
    const nowLocked = !availableNow() || Boolean(awardedToday());
    if(overlay.dataset.shoutoutLocked !== String(nowLocked)){
      openDailyShoutout();
    } else if(nowLocked){
      updateDailyShoutoutCountdown();
    }
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if(document.hidden) return;
    refreshDailyShoutout();
    const overlay = document.getElementById("dailyShoutoutOverlay");
    if(overlay && !overlay.hidden){
      const nowLocked = !availableNow() || Boolean(awardedToday());
      if(overlay.dataset.shoutoutLocked !== String(nowLocked)) openDailyShoutout();
      else if(nowLocked) updateDailyShoutoutCountdown();
    }
  });
}

export function confirmDailyShoutout(){
  if(!availableNow() || awardedToday()){
    refreshDailyShoutout();
    openDailyShoutout();
    return;
  }
  if(step !== "distribute") return;
  const recipients = validChosenItems();
  if(!recipients.length || recipients.length !== chosenIds.size) return;
  const awards = recipients.map(item => ({
    itemId: item.id,
    itemName: item.name,
    amount: allocations.get(String(item.id)) || 0
  }));
  if(awards.some(award => !Number.isInteger(award.amount) || award.amount < 1)
    || awards.reduce((sum, award) => sum + award.amount, 0) !== BONUS){
    updateDistributionTotals();
    return;
  }
  const record = { date:todayKey(), awards, amount:BONUS };
  // Retain the entire previous record and all item ratings if writing fails.
  const previousRecord = state.dailyShoutout;
  const previousGuard = localStorage.getItem("dailyShoutout");
  const snapshots = recipients.map(item => ({
    item, rating:item.rating, history:Array.isArray(item.history) ? [...item.history] : item.history
  }));
  for(const award of awards){
    const item = state.items.find(item => String(item.id) === String(award.itemId));
    item.rating = Math.round((Number(item.rating) || 1000) + award.amount);
    updateHistory(item);
  }
  state.dailyShoutout = record;
  try {
    // Save updated rankings before marking the date as redeemed.
    save();
    localStorage.setItem("dailyShoutout", JSON.stringify(record));
  } catch(error){
    for(const snapshot of snapshots){
      snapshot.item.rating = snapshot.rating;
      snapshot.item.history = snapshot.history;
    }
    state.dailyShoutout = previousRecord;
    try {
      if(previousGuard === null) localStorage.removeItem("dailyShoutout");
      else localStorage.setItem("dailyShoutout", previousGuard);
      save();
    } catch(rollbackError){ console.error("Kunne ikke gjenopprette lagring", rollbackError); }
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
