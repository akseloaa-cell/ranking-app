import { state } from "./state.js";
import { save } from "./storage.js";
import { setMode } from "./ui.js";

const SCENARIOS = [
  "Hva stoler du mest på?",
  "Hva gir deg mest glede?",
  "Hva gir deg mest kjærlighet?",
  "Hva ville du hatt med på en øde øy?",
  "Hva har du mest lyst på akkurat nå?",
  "Hva betyr mest for deg?",
  "Hva savner du mest?",
  "Hva trenger du mest akkurat nå?",
  "Hva gjør deg mest lykkelig?",
  "Hva gir deg mest energi?",
  "Hva ville du reddet fra et brennende hus?",
  "Hva er vakrest?",
  "Hva er mest estetisk?",
  "Hva hadde hjulpet deg mest i et bankran?",
  "Hva trenger du mest på øverommet?",
  "Hva ville du tatt med på ferie?",
  "Hva gir deg mest glede i hverdagen?",
  "Hva er mest praktisk?",
  "Hva kunne du lagd en film av?",
  "Hva passer best til en lang biltur?",
  "Hva passer best til en perfekt sommerdag?"
];

function getScenarioCategories(){
  return [...new Set([
    ...(state.categories || []),
    ...state.items.flatMap(item => item.categories || [])
  ])].filter(Boolean);
}

function ensureScenarioRankingState(){
  if(!state.scenarioRanking){
    state.scenarioRanking = {
      selectedCategories: [],
      categorySearch: "",
      itemCount: 5,
      rankingType: "free",
      scenarioIndex: -1,
      mode: "ranking",
      activeItems: [],
      rankedItems: [],
      lockedCount: 0
    };
  }

  if(!Array.isArray(state.scenarioRanking.selectedCategories)){
    const oldCategory = state.scenarioRanking.category || "";
    state.scenarioRanking.selectedCategories = oldCategory ? [oldCategory] : [];
  }

  state.scenarioRanking.selectedCategories =
    state.scenarioRanking.selectedCategories.filter(category =>
      getScenarioCategories().includes(category)
    );

  delete state.scenarioRanking.category;

  if(!Number.isInteger(state.scenarioRanking.itemCount) && state.scenarioRanking.itemCount !== "random"){
    state.scenarioRanking.itemCount = 5;
  }
  if(!["free","locked"].includes(state.scenarioRanking.rankingType)){
    state.scenarioRanking.rankingType = "free";
  }
  if(!["ranking","endless","tournament"].includes(state.scenarioRanking.mode)){
    state.scenarioRanking.mode = "ranking";
  }
}

function renderScenarioSetup(){
  const s=state.scenarioRanking;
  const box=document.getElementById("scenarioSetupDynamic");
  if(!box) return;
  document.getElementById("scenarioSetupTitle").textContent=s.mode==="ranking"?"Scenario Ranking":s.mode==="endless"?"Scenario Endless":"Scenario Tournament";
  document.getElementById("scenarioSetupIcon").textContent=s.mode==="ranking"?"📊":s.mode==="endless"?"♾️":"🏆";
  let html="";
  if(s.mode==="ranking"){
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Antall items</div><div class="scenarioSetupOptions">';
    [3,4,5,6,8].forEach(n=>html+='<button type="button" class="scenarioSetupOption '+(s.itemCount===n?"active":"")+'" onclick="selectScenarioItemCount('+n+')">'+n+'</button>');
    html+='<button type="button" class="scenarioSetupOption '+(s.itemCount==="random"?"active":"")+'" onclick="selectScenarioItemCount(\'random\')">Random</button></div></div>';
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Scenario</div><div class="scenarioSetupOptions"><button type="button" class="scenarioSetupOption '+(s.scenarioIndex<0?"active":"")+'" onclick="selectScenarioMode(\'random\')">🎲 Tilfeldig scenario</button><button type="button" class="scenarioSetupOption '+(s.scenarioIndex>=0?"active":"")+'" onclick="selectScenarioMode(\'select\')">🎭 Velg selv</button></div>'+(s.scenarioIndex>=0?'<input id="scenarioSearch" type="text" placeholder="Søk etter scenario..." oninput="filterScenarios(this.value)" style="width:100%;box-sizing:border-box;margin-top:10px;margin-bottom:8px;"><div id="scenarioOptions" class="scenarioSetupOptions" style="margin-top:0;"></div>':"")+'</div>';
    html+=`
      <div class="scenarioSetupSection">
        <div class="scenarioSetupLabel">Kategorier</div>
        <div style="position:relative;">
          <button id="scenarioCategoryDropdownButton" type="button" class="scenarioSetupSelect" onclick="toggleScenarioCategoryDropdown()" style="width:100%;text-align:left;">
            <span id="scenarioCategoryDropdownText">Alle kategorier</span>
          </button>
          <div id="scenarioCategoryDropdownMenu" class="hidden" style="position:absolute;z-index:20;left:0;right:0;margin-top:6px;background:#171e2b;border:1px solid #2d374b;border-radius:12px;padding:8px;">
            <input id="scenarioCategorySearch" type="text" placeholder="Søk etter kategori..." value="" oninput="filterScenarioCategories(this.value)" style="width:100%;box-sizing:border-box;margin-bottom:8px;">
            <div id="scenarioCategoryDropdownOptions"></div>
          </div>
        </div>
      </div>`;
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Rankingtype</div><div class="scenarioSetupOptions"><button type="button" class="scenarioSetupOption '+(s.rankingType==="free"?"active":"")+'" onclick="selectScenarioRankingType(\'free\')">🔓 Free Ranking</button><button type="button" class="scenarioSetupOption '+(s.rankingType==="locked"?"active":"")+'" onclick="selectScenarioRankingType(\'locked\')">🔒 Locked Ranking</button></div></div>';
  } else if(s.mode==="endless"){
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Scenario</div><div class="scenarioSetupOptions"><button type="button" class="scenarioSetupOption '+(s.endlessScenarioMode==="fixed"?"active":"")+'" onclick="selectScenarioEndlessMode(\\'fixed\\')">🎯 Ett scenario</button><button type="button" class="scenarioSetupOption '+(s.endlessScenarioMode==="each"?"active":"")+'" onclick="selectScenarioEndlessMode(\\'each\\')">🔄 Bytt scenario hver match</button></div>';
    if(s.endlessScenarioMode==="fixed"){
      html+='<div class="scenarioSetupOptions" style="margin-top:8px;"><button type="button" class="scenarioSetupOption '+(s.scenarioIndex<0?"active":"")+'" onclick="selectScenarioMode(\\'random\\')">🎲 Tilfeldig</button><button type="button" class="scenarioSetupOption '+(s.scenarioIndex>=0?"active":"")+'" onclick="selectScenarioMode(\\'select\\')">🎭 Velg selv</button></div>';
      if(s.scenarioIndex>=0){
        html+='<input id="scenarioSearch" type="text" placeholder="Søk etter scenario..." oninput="filterScenarios(this.value)" style="width:100%;box-sizing:border-box;margin-top:10px;margin-bottom:8px;"><div id="scenarioOptions" class="scenarioSetupOptions" style="margin-top:0;"></div>';
      }
    }
    html+='</div>';
    html+=
      '<div class="scenarioSetupSection">' +
        '<div class="scenarioSetupLabel">Kategorier</div>' +
        '<div style="position:relative;">' +
          '<button id="scenarioCategoryDropdownButton" type="button" class="scenarioSetupSelect" onclick="toggleScenarioCategoryDropdown()" style="width:100%;text-align:left;">' +
            '<span id="scenarioCategoryDropdownText">Alle kategorier</span>' +
          '</button>' +
          '<div id="scenarioCategoryDropdownMenu" class="hidden" style="position:absolute;z-index:20;left:0;right:0;margin-top:6px;background:#171e2b;border:1px solid #2d374b;border-radius:12px;padding:8px;">' +
            '<input id="scenarioCategorySearch" type="text" placeholder="Søk etter kategori..." value="" oninput="filterScenarioCategories(this.value)" style="width:100%;box-sizing:border-box;margin-bottom:8px;">' +
            '<div id="scenarioCategoryDropdownOptions"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Scenario-rekkefølge</div><div class="scenarioSetupOptions"><button type="button" class="scenarioSetupOption '+(s.endlessScenarioOrder==="random"?"active":"")+'" onclick="selectScenarioEndlessOrder(\'random\')">🎲 Tilfeldig</button><button type="button" class="scenarioSetupOption '+(s.endlessScenarioOrder==="avoidRecent"?"active":"")+'" onclick="selectScenarioEndlessOrder(\'avoidRecent\')">🔄 Unngå nylig brukte</button></div></div>';
  } else {
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Modus</div><div class="scenarioSetupOptions"><button type="button" class="scenarioSetupOption '+(s.tournamentMode==="random"?"active":"")+'" onclick="selectScenarioTournamentMode(\'random\')">🎲 Random items</button><button type="button" class="scenarioSetupOption '+(s.tournamentMode==="category"?"active":"")+'" onclick="selectScenarioTournamentMode(\'category\')">🏷️ Velg kategori</button></div></div>';
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Antall deltakere</div><div class="scenarioSetupOptions">';
    [4,8,16,32].forEach(n=>html+='<button type="button" class="scenarioSetupOption '+(s.tournamentSize===n?"active":"")+'" onclick="selectScenarioTournamentSize('+n+')">'+n+'</button>');
    html+='<button type="button" class="scenarioSetupOption '+(s.tournamentSize==="random"?"active":"")+'" onclick="selectScenarioTournamentSize(\'random\')">Random</button></div></div>';
    html+='<div class="scenarioSetupSection"><div class="scenarioSetupLabel">Scenario</div><div class="scenarioSetupOptions"><button type="button" class="scenarioSetupOption '+(s.tournamentScenarioMode==="new"?"active":"")+'" onclick="selectScenarioTournamentScenario(\'new\')">🎲 Nytt scenario hver kamp</button><button type="button" class="scenarioSetupOption '+(s.tournamentScenarioMode==="same"?"active":"")+'" onclick="selectScenarioTournamentScenario(\'same\')">🔒 Samme scenario hele turneringen</button></div></div>';
  }
  box.innerHTML=html;
  if(s.mode==="ranking" || s.mode==="endless"){
    renderScenarioCategoryDropdown();
    if(s.scenarioIndex>=0 && (s.mode==="ranking" || (s.mode==="endless" && s.endlessScenarioMode==="fixed"))) filterScenarios("");
  }
}
export function openScenarioRankingSetup(){
  ensureScenarioRankingState();
  state.scenarioRanking.mode = "ranking";
  save();
  setMode("scenarioRankingSetup");
  renderScenarioSetup();
}

export function backToScenarioHub(){
  setMode("scenario");
}

document.addEventListener("click", event => {
  const menu = document.getElementById("scenarioCategoryDropdownMenu");
  const button = document.getElementById("scenarioCategoryDropdownButton");
  if(!menu || menu.classList.contains("hidden")) return;
  if(menu.contains(event.target) || button?.contains(event.target)) return;
  menu.classList.add("hidden");
});

export function toggleScenarioCategoryDropdown(){
  const menu = document.getElementById("scenarioCategoryDropdownMenu");
  if(!menu) return;

  menu.classList.toggle("hidden");
}

export function clearScenarioCategories(){
  ensureScenarioRankingState();
  state.scenarioRanking.selectedCategories = [];
  state.scenarioRanking.categorySearch = "";
  save();
  renderScenarioCategoryDropdown();
}

export function selectScenarioCategory(index){
  const categories = getScenarioCategories();
  const category = categories[index];
  if(!category) return;

  ensureScenarioRankingState();

  const selected = state.scenarioRanking.selectedCategories;
  const existingIndex = selected.indexOf(category);

  if(existingIndex >= 0){
    selected.splice(existingIndex, 1);
  } else {
    selected.push(category);
  }

  state.scenarioRanking.categorySearch = "";
  save();
  renderScenarioCategoryDropdown();
}

export function filterScenarioCategories(query){
  ensureScenarioRankingState();
  state.scenarioRanking.categorySearch = query || "";

  const menu = document.getElementById("scenarioCategoryDropdownMenu");
  if(menu) menu.classList.remove("hidden");

  renderScenarioCategoryOptions(query);
}

function renderScenarioCategoryOptions(query = ""){
  const optionsBox = document.getElementById("scenarioCategoryDropdownOptions");
  if(!optionsBox) return;

  ensureScenarioRankingState();

  const categories = getScenarioCategories();
  const selected = state.scenarioRanking.selectedCategories;
  const q = String(query || "").trim().toLowerCase();

  const filtered = categories.filter(category =>
    !q || category.toLowerCase().includes(q)
  );

  let html =
    '<div class="scenarioCategoryDropdownOption scenarioCategoryAllOption ' +
    (selected.length === 0 ? "active" : "") +
    '" onclick="clearScenarioCategories()">' +
    '<span>Alle kategorier</span><span>✓</span></div>';

  if(filtered.length){
    html += filtered.map(category => {
      const index = categories.indexOf(category);
      const isSelected = selected.includes(category);

      return '<div class="scenarioCategoryDropdownOption ' +
        (isSelected ? "active" : "") +
        '" onclick="selectScenarioCategory(' + index + ')">' +
        '<span>' + category + '</span><span>' +
        (isSelected ? "✓" : "") +
        '</span></div>';
    }).join("");
  } else {
    html += '<div class="scenarioCategoryDropdownEmpty">Ingen kategorier funnet</div>';
  }

  optionsBox.innerHTML = html;
}

export function renderScenarioCategoryDropdown(){
  const buttonText = document.getElementById("scenarioCategoryDropdownText");
  if(!buttonText) return;

  ensureScenarioRankingState();

  const selected = state.scenarioRanking.selectedCategories;

  if(selected.length === 0){
    buttonText.textContent = "Alle kategorier";
  } else if(selected.length === 1){
    buttonText.textContent = selected[0];
  } else {
    buttonText.textContent = selected.length + " kategorier valgt";
  }

  const search = document.getElementById("scenarioCategorySearch");
  if(search){
    search.value = state.scenarioRanking.categorySearch || "";
  }

  renderScenarioCategoryOptions(state.scenarioRanking.categorySearch || "");
}

export function setupScenarioCategoryDropdown(){
  ensureScenarioRankingState();
  renderScenarioCategoryDropdown();
}


export function openScenarioModeSetup(mode){
  ensureScenarioRankingState();
  state.scenarioRanking.mode = mode;
  setMode("scenarioRankingSetup");
  renderScenarioSetup();
}

export function selectScenarioItemCount(count){
  ensureScenarioRankingState();
  state.scenarioRanking.itemCount = count;
  renderScenarioSetup();
  save();
}

export function selectScenarioRankingType(type){
  ensureScenarioRankingState();
  state.scenarioRanking.rankingType = type;
  renderScenarioSetup();
  save();
}

export function selectScenarioEndlessMode(mode){ ensureScenarioRankingState(); state.scenarioRanking.endlessScenarioMode=mode; if(mode==="each") state.scenarioRanking.scenarioIndex=-1; renderScenarioSetup(); save(); }
export function selectScenarioEndlessOrder(order){ ensureScenarioRankingState(); state.scenarioRanking.endlessScenarioOrder=order; renderScenarioSetup(); save(); }
export function selectScenarioTournamentMode(mode){ ensureScenarioRankingState(); state.scenarioRanking.tournamentMode=mode; renderScenarioSetup(); save(); }
export function selectScenarioTournamentSize(size){ ensureScenarioRankingState(); state.scenarioRanking.tournamentSize=size; renderScenarioSetup(); save(); }
export function selectScenarioTournamentScenario(mode){ ensureScenarioRankingState(); state.scenarioRanking.tournamentScenarioMode=mode; renderScenarioSetup(); save(); }

export function selectScenarioMode(mode){
  ensureScenarioRankingState();
  state.scenarioRanking.scenarioIndex = mode === "random" ? -1 : (state.scenarioRanking.scenarioIndex >= 0 ? state.scenarioRanking.scenarioIndex : 0);
  renderScenarioSetup();
  save();
}

export function filterScenarios(query){
  ensureScenarioRankingState();
  const q = String(query || "").trim().toLowerCase();
  const box = document.getElementById("scenarioOptions");
  if(!box) return;
  const filtered = SCENARIOS.map((scenario,index) => ({scenario,index})).filter(x => !q || x.scenario.toLowerCase().includes(q));
  box.innerHTML = filtered.length
    ? filtered.map(({scenario,index}) => '<button type="button" class="scenarioSetupOption '+(state.scenarioRanking.scenarioIndex===index?"active":"")+'" onclick="selectScenario('+index+')">'+scenario+'</button>').join("")
    : '<div style="opacity:.5;padding:10px;text-align:center;">Ingen scenarioer funnet</div>';
}

export function selectScenario(index){
  ensureScenarioRankingState();
  if(index < 0 || index >= SCENARIOS.length) return;
  state.scenarioRanking.scenarioIndex = index;
  renderScenarioSetup();
  save();
}

export function cycleScenario(){
  ensureScenarioRankingState();
  state.scenarioRanking.scenarioIndex =
    (state.scenarioRanking.scenarioIndex + 1) % SCENARIOS.length;
  renderScenarioSetup();
  save();
}

export function renderScenarioSetupControls(){
  ensureScenarioRankingState();
  const count = state.scenarioRanking.itemCount;
  document.querySelectorAll(".scenarioSetupOption").forEach(button => {
    button.classList.toggle("active", button.textContent.trim().toLowerCase() === String(count).toLowerCase());
  });
  document.querySelectorAll(".scenarioSetupMode").forEach(button => {
    const text = button.textContent.toLowerCase();
    button.classList.toggle("active",
      (state.scenarioRanking.rankingType === "free" && text.includes("free ranking")) ||
      (state.scenarioRanking.rankingType === "locked" && text.includes("locked ranking"))
    );
  });
  const button = document.querySelector(".scenarioSetupSelect");
  if(button){
    button.textContent = state.scenarioRanking.scenarioIndex >= 0
      ? "🎭 " + SCENARIOS[state.scenarioRanking.scenarioIndex]
      : "🎲 Tilfeldig scenario";
  }
  const title = document.querySelector("#scenarioRankingSetupView h2");
  if(title){
    title.textContent =
      state.scenarioRanking.mode === "endless" ? "Scenario Endless" :
      state.scenarioRanking.mode === "tournament" ? "Scenario Tournament" :
      "Scenario Ranking";
  }
}

function getScenarioPool(){
  const selected = state.scenarioRanking.selectedCategories || [];
  if(!selected.length) return [...state.items];
  return state.items.filter(item =>
    (item.categories || []).some(category => selected.includes(category))
  );
}

function getScenarioText(){
  if(state.scenarioRanking.scenarioIndex >= 0){
    return SCENARIOS[state.scenarioRanking.scenarioIndex];
  }
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

export function startScenario(){
  ensureScenarioRankingState();
  const pool = getScenarioPool();

  if(state.scenarioRanking.mode === "tournament"){
    const requestedSize = state.scenarioRanking.tournamentSize === "random"
      ? 4
      : Number(state.scenarioRanking.tournamentSize);

    if(pool.length < requestedSize){
      alert("Du har ikke nok gyldige deltakere til å starte turneringen. Du trenger minst " + requestedSize + " items, men har bare " + pool.length + ".");
      return;
    }
  } else if(pool.length < 2){
    alert("Du har ikke nok gyldige deltakere til å starte. Du trenger minst 2 items, men har bare " + pool.length + ".");
    return;
  }

  let count;
  if(state.scenarioRanking.mode === "tournament"){
    count = state.scenarioRanking.tournamentSize === "random"
      ? Math.max(4, Math.min(32, pool.length))
      : Number(state.scenarioRanking.tournamentSize);
  } else if(state.scenarioRanking.mode === "endless"){
    count = Math.min(5, pool.length);
  } else {
    count = state.scenarioRanking.itemCount === "random"
      ? Math.floor(Math.random() * Math.min(8, pool.length - 1)) + 2
      : Number(state.scenarioRanking.itemCount);

    if(count > pool.length){
      alert("Du har ikke nok gyldige deltakere til å starte. Du har valgt " + count + " items, men har bare " + pool.length + " tilgjengelige.");
      return;
    }
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  state.scenarioRanking.activeItems = shuffled;
  state.scenarioRanking.lockedCount = 0;
  state.scenarioRanking.activeScenario = getScenarioText();

  if(state.scenarioRanking.rankingType === "locked"){
    state.scenarioRanking.rankedItems = Array(count).fill(null);
    state.scenarioRanking.lockedCurrentItem = shuffled[0] || null;
  } else {
    state.scenarioRanking.rankedItems = [...shuffled];
    state.scenarioRanking.lockedCurrentItem = null;
  }
  save();
  renderScenarioGame();
}

export function renderScenarioGame(){
  const box = document.getElementById("scenarioGameContent");
  if(!box) return;
  setMode("scenarioGame");
  const items = state.scenarioRanking.activeItems || [];
  const ranked = state.scenarioRanking.rankedItems || [];
  const locked = state.scenarioRanking.rankingType === "locked";

  if(!locked){
    box.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:13px;opacity:.5;margin-bottom:7px;">Scenario</div>
        <h2 style="margin:0;line-height:1.25;">${state.scenarioRanking.activeScenario || getScenarioText()}</h2>
        <p style="opacity:.55;font-size:12px;">Bygg rangeringen ved å flytte items opp og ned.</p>
      </div>

      <div style="background:#171e2b;border:1px solid #2d374b;border-radius:16px;padding:12px;">
        <div style="font-size:12px;opacity:.55;margin:0 0 8px;">Din rangering</div>
        ${ranked.map((item,index) => `
          <div draggable="true" ondragstart="dragScenarioItem(${index},event)" ondragover="allowScenarioDrop(event)" ondrop="dropScenarioItem(${index},event)" style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:#20283a;border-radius:10px;margin:6px 0;cursor:grab;user-select:none;">
            <span style="width:22px;flex:0 0 22px;text-align:center;opacity:.45;line-height:22px;">☷</span>
            <b style="width:28px;flex:0 0 28px;line-height:22px;">#${index+1}</b>
            <span style="flex:1;min-width:0;line-height:22px;overflow-wrap:anywhere;">${item.name}</span>
            <div style="width:56px;flex:0 0 56px;display:flex;gap:4px;justify-content:flex-end;">
              <button type="button" style="width:26px;height:26px;padding:0;font-size:13px;" onclick="event.stopPropagation();moveScenarioItem(${index},-1)" ${index===0?"disabled":""}>↑</button>
              <button type="button" style="width:26px;height:26px;padding:0;font-size:13px;" onclick="event.stopPropagation();moveScenarioItem(${index},1)" ${index===ranked.length-1?"disabled":""}>↓</button>
            </div>
          </div>`).join("")}
      </div>

      <button type="button" onclick="finishScenario()" style="width:100%;margin-top:12px;">✓ Ferdig</button>
    `;
    return;
  }

  const currentItem = state.scenarioRanking.lockedCurrentItem;
  const isComplete = ranked.length === items.length && ranked.every(Boolean);

  box.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:13px;opacity:.5;margin-bottom:7px;">Scenario</div>
      <h2 style="margin:0;line-height:1.25;">${state.scenarioRanking.activeScenario || getScenarioText()}</h2>
      <p style="opacity:.55;font-size:12px;">Plasser ett item om gangen. Når det er plassert, kommer neste item.</p>
    </div>

    <div style="background:#171e2b;border:1px solid #2d374b;border-radius:16px;padding:12px;">
      <div style="font-size:12px;opacity:.55;margin:0 0 8px;">Din rangering</div>
      ${ranked.map((item,index) => item
        ? `
          <div style="display:flex;align-items:center;gap:8px;padding:10px;background:#20283a;border-radius:10px;margin:6px 0;">
            <b style="width:28px;">#${index+1}</b>
            <span style="flex:1;">${item.name}</span>
          </div>`
        : `
          <button type="button" onclick="placeScenarioItem(null,${index})" style="width:100%;margin:6px 0;text-align:left;padding:10px;">
            <b style="display:inline-block;width:28px;">#${index+1}</b> Plasser item her
          </button>`
      ).join("")}
    </div>

    <div style="margin-top:14px;background:#20283a;border-radius:12px;padding:14px;text-align:center;">
      ${currentItem
        ? `
          <div style="font-size:12px;opacity:.55;margin-bottom:6px;">Neste item</div>
          <div style="font-size:18px;font-weight:600;">${currentItem.name}</div>
          <div style="font-size:12px;opacity:.5;margin-top:6px;">Velg plassen over der du vil sette itemet.</div>
        `
        : `
          <div style="opacity:.55;">Alle items er plassert.</div>
        `}
    </div>

    ${isComplete ? '<button type="button" onclick="finishScenario()" style="width:100%;margin-top:12px;">✓ Ferdig</button>' : ""}
  `;
}

export function placeScenarioItem(id, position){
  ensureScenarioRankingState();

  if(state.scenarioRanking.rankingType === "locked"){
    const item = state.scenarioRanking.lockedCurrentItem;
    if(!item || !Number.isInteger(position)) return;

    const list = state.scenarioRanking.rankedItems || [];
    if(position < 0 || position >= list.length || list[position]) return;

    list[position] = item;
    state.scenarioRanking.lockedCount++;

    const next = (state.scenarioRanking.activeItems || []).find(candidate =>
      !list.some(placed => placed && placed.id === candidate.id)
    );
    state.scenarioRanking.lockedCurrentItem = next || null;

    renderScenarioGame();
    save();
    return;
  }

  const item = state.scenarioRanking.activeItems.find(x => x.id === id);
  if(!item) return;
  if((state.scenarioRanking.rankedItems || []).some(x => x.id === id)) return;

  state.scenarioRanking.rankedItems.push(item);
  renderScenarioGame();
  save();
}

let draggedScenarioIndex = null;

export function dragScenarioItem(index, event){
  if(!Number.isInteger(index)) return;
  draggedScenarioIndex = index;
  if(event?.dataTransfer){
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

export function allowScenarioDrop(event){
  if(event) event.preventDefault();
}

export function dropScenarioItem(targetIndex, event){
  if(event) event.preventDefault();
  const list = state.scenarioRanking?.rankedItems;
  const sourceIndex = draggedScenarioIndex !== null ? draggedScenarioIndex : Number(event?.dataTransfer?.getData("text/plain"));
  draggedScenarioIndex = null;
  if(!Array.isArray(list) || !Number.isInteger(sourceIndex) || !Number.isInteger(targetIndex)) return;
  if(sourceIndex < 0 || sourceIndex >= list.length || targetIndex < 0 || targetIndex >= list.length || sourceIndex === targetIndex) return;
  const [item] = list.splice(sourceIndex, 1);
  list.splice(targetIndex, 0, item);
  renderScenarioGame();
  save();
}

export function moveScenarioItem(index, direction){
  ensureScenarioRankingState();
  const list = state.scenarioRanking.rankedItems;
  const target = index + direction;
  if(target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  renderScenarioGame();
  save();
}

function recordScenarioStats(){
  if(!state.scenarioStats){
    state.scenarioStats = { games: 0, byItem: {}, byScenario: {} };
  }

  const ranked = state.scenarioRanking.rankedItems || [];
  const scenario = state.scenarioRanking.activeScenario || "Ukjent scenario";

  state.scenarioStats.games++;
  state.scenarioStats.byScenario[scenario] =
    (state.scenarioStats.byScenario[scenario] || 0) + 1;

  ranked.forEach((item, index) => {
    if(!item) return;

    const key = String(item.id);
    if(!state.scenarioStats.byItem[key]){
      state.scenarioStats.byItem[key] = {
        appearances: 0,
        totalRank: 0,
        firsts: 0,
        seconds: 0,
        thirds: 0
      };
    }

    const stats = state.scenarioStats.byItem[key];
    const rank = index + 1;

    stats.appearances++;
    stats.totalRank += rank;
    if(rank === 1) stats.firsts++;
    if(rank === 2) stats.seconds++;
    if(rank === 3) stats.thirds++;
  });
}

export function finishScenario(){
  ensureScenarioRankingState();
  const ranked = state.scenarioRanking.rankedItems || [];
  const active = state.scenarioRanking.activeItems || [];

  if(ranked.length !== active.length || !ranked.every(Boolean)) return;

  recordScenarioStats();
  save();

  state.scenarioRanking.resultRanking = ranked.map((item, index) => ({
    id: item.id,
    name: item.name,
    rank: index + 1
  }));
  state.scenarioRanking.resultScenario =
    state.scenarioRanking.activeScenario || "Scenario";

  if(state.scenarioRanking.mode === "endless"){
    renderScenarioResult();
    return;
  }

  renderScenarioResult();
}

export function renderScenarioResult(){
  const box = document.getElementById("scenarioResultContent");
  if(!box) return;

  const ranking = state.scenarioRanking.resultRanking || [];
  const scenario = state.scenarioRanking.resultScenario || "Scenario";
  box.innerHTML = `
    <div style="text-align:center;margin-bottom:22px;">
      <div style="font-size:13px;opacity:.5;margin-bottom:7px;">Scenario fullført</div>
      <h2 style="margin:0;line-height:1.25;">${scenario}</h2>
    </div>

    <div style="background:#171e2b;border:1px solid #2d374b;border-radius:16px;padding:12px;">
      <div style="font-size:12px;opacity:.55;margin:0 0 8px;">Din rangering</div>
      ${ranking.map(item => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:#20283a;border-radius:10px;margin:6px 0;">
          <b style="width:30px;flex:0 0 30px;">#${item.rank}</b>
          <span style="flex:1;min-width:0;overflow-wrap:anywhere;">${item.name}</span>
        </div>
      `).join("")}
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
      <button type="button" onclick="scenarioPlayAgain()">🔄 Spill igjen</button>
      <button type="button" onclick="scenarioNewSettings()">⚙️ Nye innstillinger</button>
      <button type="button" onclick="backToScenarioHub()">🎭 Tilbake til Scenario</button>
    </div>
  `;
  setMode("scenarioResult");
}

export function scenarioPlayAgain(){
  startScenario();
}

export function scenarioNewSettings(){
  setMode("scenarioRankingSetup");
  renderScenarioSetup();
  save();
}

export function backToScenarioSetup(){
  setMode("scenarioRankingSetup");
  setupScenarioCategoryDropdown();
  renderScenarioSetupControls();
}

export function getScenarioList(){
  return [...SCENARIOS];
}
