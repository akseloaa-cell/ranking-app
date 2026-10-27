import { state } from "./state.js";
import { save } from "./storage.js";
import { update } from "./ranking.js";
import { nextMatch } from "./match.js";
import { normalize } from "./categories.js";
import { commit } from "./state.js";
import { closeAddItem } from "./ui.js";

export function addItem(){
  let name = document.getElementById("itemInput").value;

  name = name.trim();
  if(!name) return;

  const duplicate = state.items.find(
    item => item.name.trim().toLowerCase() === name.toLowerCase()
  );

  if(duplicate){
    const input = document.getElementById("itemInput");
    input.focus();
    input.select();
    alert("Dette itemet finnes allerede.");
    return;
  }

  let selected = [...document.querySelectorAll("#chipBox .chip.active")]
    .map(x => normalize(x.innerText));

  const existingItems = [...state.items];
  const newId = Math.max(Date.now(), ...state.items.map(item => Number(item.id) || 0)) + 1;

  commit(() => {
    state.items.push({
      id: newId,
      name,
      categories: selected,
      rating: 1000,
      scenarioRating: 1000,
      createdAt: new Date().toISOString(),
      history: [1000],
      tournamentsPlayed: 0,
      tournamentWins: 0,
      top3: 0,
      h2h: {}
    });
  });

  document.getElementById("itemInput").value = "";
  document
    .querySelectorAll("#chipBox .chip.active")
    .forEach(chip => chip.classList.remove("active"));

  state.selectedCategories = [];
  save();
  update();
  nextMatch();
  closeAddItem();
  openEloPlacement(newId, existingItems);
}

 
// A new item is placed against a small, evenly distributed sample of the
// existing ranking. Other items' ratings are never changed.
let pendingPlacement = null;
let correctionQueue = [];
let correctionIndex = 0;
let correctionActive = false;

function refillCorrectionQueue(){
  // Shuffle one cycle, so every item gets a turn before repeating.
  correctionQueue = state.items.map(item => item.id);
  for(let i = correctionQueue.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [correctionQueue[i], correctionQueue[j]] = [correctionQueue[j], correctionQueue[i]];
  }
  correctionIndex = 0;
}

export function startEloCorrectionMode(){
  if(state.items.length < 2){
    alert("Du trenger minst 2 items for å bruke ELO Correction.");
    return;
  }
  correctionActive = true;
  pendingPlacement = null;
  refillCorrectionQueue();
  document.getElementById("modeMenu").style.display = "none";
  // Show the familiar placement dialog, but cycle through existing items.
  window.setMode("eloCorrection");
  nextEloCorrection();
}

function nextEloCorrection(){
  if(!correctionActive) return;
  const overlay = document.getElementById("eloPlacementOverlay");
  if(correctionIndex >= correctionQueue.length) refillCorrectionQueue();
  let item = null;
  while(correctionIndex < correctionQueue.length && !item){
    const id = correctionQueue[correctionIndex++];
    item = state.items.find(entry => String(entry.id) === String(id)) || null;
  }
  if(!item){
    if(state.items.length < 2) return exitEloCorrectionMode();
    refillCorrectionQueue();
    return nextEloCorrection();
  }
  const refs = state.items.filter(entry => String(entry.id) !== String(item.id));
  openEloPlacement(item.id, refs, true);
  if(overlay) overlay.scrollTop = 0;
}

export function exitEloCorrectionMode(){
  correctionActive = false;
  correctionQueue = [];
  correctionIndex = 0;
  pendingPlacement = null;
  const overlay = document.getElementById("eloPlacementOverlay");
  if(overlay) overlay.style.display = "none";
  window.setMode("home");
}


function safeText(value){
  return String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[character]);
}

function placementRating(anchors, slot){
  const above = slot > 0 ? anchors[slot - 1] : null;
  const below = slot < anchors.length ? anchors[slot] : null;
  const rating = item => Number.isFinite(Number(item?.rating)) ? Number(item.rating) : 1000;
  if(above && below){
    return Math.round((rating(above) + rating(below)) / 2);
  }
  if(below){
    const gap = anchors.length > 1 ? Math.abs(rating(anchors[0]) - rating(anchors[1])) : 32;
    return Math.round(rating(below) + Math.max(16, Math.min(80, gap)));
  }
  if(above){
    const n = anchors.length;
    const gap = n > 1 ? Math.abs(rating(anchors[n-2]) - rating(anchors[n-1])) : 32;
    return Math.round(rating(above) - Math.max(16, Math.min(80, gap)));
  }
  return 1000;
}

function openEloPlacement(itemId, existingItems, isCorrectionMode = false){
  const overlay = document.getElementById("eloPlacementOverlay");
  const content = document.getElementById("eloPlacementContent");
  if(!overlay || !content || !existingItems.length) return;

  const sorted = existingItems
    .filter(item => Number.isFinite(Number(item.rating)))
    .sort((a,b) => b.rating - a.rating || String(a.name).localeCompare(String(b.name)));
  if(!sorted.length) return;

  const count = Math.min(9, sorted.length);
  const positions = Array.from({length:count}, (_,i) =>
    count === 1 ? 0 : Math.round(i * (sorted.length - 1) / (count - 1))
  );
  const anchors = positions.map(index => sorted[index]);
  // Work out which reference interval the item already occupies.
  // Choosing that interval must never change its rating or history.
  const current = state.items.find(item => String(item.id) === String(itemId));
  const originalSlot = isCorrectionMode && current
    ? anchors.filter(anchor => Number(anchor.rating) > Number(current.rating) ||
        (Number(anchor.rating) === Number(current.rating) &&
         String(anchor.name).localeCompare(String(current.name)) < 0)).length
    : null;
  pendingPlacement = {itemId, anchors, isCorrectionMode, originalSlot};

  const item = state.items.find(item => item.id === itemId);
  document.getElementById("eloPlacementTitle").textContent =
    "Plasser " + (item?.name || "nytt item");
  const intro = document.getElementById("eloPlacementIntro");
  const heading = document.getElementById("eloPlacementHeading");
  const skip = document.getElementById("eloPlacementSkip");
  const exit = document.getElementById("eloPlacementExit");
  if(intro) intro.textContent = isCorrectionMode
    ? "Hvor hører itemet hjemme? Velg mellom referanse-items. Samme plassering som nå gir ingen ELO-endring."
    : "Hvor hører itemet hjemme? Velg en plass mellom referanse-items fra hele rankingen. Bare start-ELO til det nye itemet endres.";
  if(heading) heading.textContent = isCorrectionMode ? "⭐ ELO Correction · Uendelig modus" : "⭐ ELO Correction";
  if(skip) skip.textContent = isCorrectionMode ? "Hopp over · neste item" : "Hopp over · behold 1000 ELO";
  if(exit) exit.hidden = !isCorrectionMode;

  const slotButton = index => {
    const estimated = placementRating(anchors,index);
    const same = isCorrectionMode && index === originalSlot;
    return '<button type="button" class="eloPlacementSlot" onclick="chooseEloPlacement('+
      index+')">'+(same ? '✓ Behold plassering' : '＋ Plasser her')+
      ' <span>'+(same ? 'Ingen ELO-endring' : 'ca. ⭐ '+estimated)+'</span></button>';
  };

  content.innerHTML = anchors.map((anchor,index) =>
    slotButton(index) +
    '<div class="eloPlacementReference"><span><b>#'+(positions[index]+1)+
    '</b> '+safeText(anchor.name)+'</span><strong>⭐ '+
    Math.round(anchor.rating)+'</strong></div>'
  ).join("") + slotButton(anchors.length);
  overlay.style.display = "flex";
}

export function chooseEloPlacement(slot){
  if(!pendingPlacement || !Number.isInteger(slot)) return;
  const {itemId, anchors, isCorrectionMode, originalSlot} = pendingPlacement;
  if(slot < 0 || slot > anchors.length) return;
  const item = state.items.find(entry => String(entry.id) === String(itemId));
  if(item && (!isCorrectionMode || slot !== originalSlot)){
    const rating = Math.max(100, placementRating(anchors, slot));
    if(!isCorrectionMode){
      item.rating = rating;
      item.history = [rating];
    } else if(rating !== item.rating){
      item.rating = rating;
      if(!Array.isArray(item.history)) item.history = [];
      item.history.push(rating);
      if(item.history.length > 30) item.history.shift();
    }
    save();
    update();
    if(!isCorrectionMode) nextMatch();
  }
  skipEloPlacement();
}

export function skipEloPlacement(){
  pendingPlacement = null;
  const overlay = document.getElementById("eloPlacementOverlay");
  if(correctionActive){
    nextEloCorrection();
    return;
  }
  if(overlay) overlay.style.display = "none";
}
