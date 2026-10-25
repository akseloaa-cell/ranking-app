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

function openEloPlacement(itemId, existingItems){
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
  pendingPlacement = {itemId, anchors};

  const item = state.items.find(item => item.id === itemId);
  document.getElementById("eloPlacementTitle").textContent =
    "Plasser " + (item?.name || "nytt item");

  const slotButton = index => {
    const estimated = placementRating(anchors,index);
    return '<button type="button" class="eloPlacementSlot" onclick="chooseEloPlacement('+
      index+')">＋ Plasser her <span>ca. ⭐ '+estimated+'</span></button>';
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
  const {itemId, anchors} = pendingPlacement;
  if(slot < 0 || slot > anchors.length) return;
  const item = state.items.find(item => item.id === itemId);
  if(item){
    const rating = Math.max(100,placementRating(anchors,slot));
    item.rating = rating;
    item.history = [rating];
    save();
    update();
    nextMatch();
  }
  skipEloPlacement();
}

export function skipEloPlacement(){
  pendingPlacement = null;
  const overlay = document.getElementById("eloPlacementOverlay");
  if(overlay) overlay.style.display = "none";
}
