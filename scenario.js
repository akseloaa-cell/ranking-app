import { state } from "./state.js";
import { save } from "./storage.js";
import { setMode } from "./ui.js";

function getScenarioCategories(){
  return [...new Set([
    ...(state.categories || []),
    ...state.items.flatMap(item => item.categories || [])
  ])].filter(Boolean);
}

function ensureScenarioRankingState(){
  if(!state.scenarioRanking){
    state.scenarioRanking = { selectedCategories: [], categorySearch: "" };
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
}

export function openScenarioRankingSetup(){
  ensureScenarioRankingState();
  save();
  setMode("scenarioRankingSetup");
  setupScenarioCategoryDropdown();
}

export function backToScenarioHub(){
  setMode("scenario");
}

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
