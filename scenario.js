import { state } from "./state.js";
import { save } from "./storage.js";
import { setMode } from "./ui.js";

function getScenarioCategories(){
  return [...new Set([
    ...(state.categories || []),
    ...state.items.flatMap(item => item.categories || [])
  ])].filter(Boolean);
}

export function openScenarioRankingSetup(){
  const categories = getScenarioCategories();

  if(!state.scenarioRanking){
    state.scenarioRanking = {
      category: categories[0] || "",
      categorySearch: ""
    };
  }

  if(!categories.includes(state.scenarioRanking.category)){
    state.scenarioRanking.category = categories[0] || "";
  }

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

  document.querySelectorAll(".scenarioCategoryDropdownMenu").forEach(el => {
    if(el !== menu) el.classList.add("hidden");
  });

  menu.classList.toggle("hidden");
}

export function selectScenarioCategory(index){
  const categories = getScenarioCategories();
  const category = categories[index] || "";

  if(!state.scenarioRanking){
    state.scenarioRanking = {
      category: "",
      categorySearch: ""
    };
  }

  state.scenarioRanking.category = category;
  state.scenarioRanking.categorySearch = "";

  save();
  renderScenarioCategoryDropdown();
}

export function filterScenarioCategories(query){
  if(!state.scenarioRanking){
    state.scenarioRanking = {
      category: "",
      categorySearch: ""
    };
  }

  state.scenarioRanking.categorySearch = query || "";

  const menu = document.getElementById("scenarioCategoryDropdownMenu");
  if(menu) menu.classList.remove("hidden");

  renderScenarioCategoryOptions(query);
}

function renderScenarioCategoryOptions(query = ""){
  const optionsBox = document.getElementById("scenarioCategoryDropdownOptions");
  if(!optionsBox) return;

  const categories = getScenarioCategories();
  const selected = state.scenarioRanking?.category || "";
  const q = String(query || "").trim().toLowerCase();

  const filtered = categories.filter(category =>
    !q || category.toLowerCase().includes(q)
  );

  optionsBox.innerHTML = filtered.length
    ? filtered.map(category => {
        const index = categories.indexOf(category);
        return `
          <div class="scenarioCategoryDropdownOption ${category === selected ? "active" : ""}" onclick="selectScenarioCategory(${index})">
            ${category}
          </div>
        `;
      }).join("")
    : '<div class="scenarioCategoryDropdownEmpty">Ingen kategorier funnet</div>';
}

export function renderScenarioCategoryDropdown(){
  const buttonText = document.getElementById("scenarioCategoryDropdownText");
  if(!buttonText) return;

  buttonText.textContent =
    state.scenarioRanking?.category || "Velg kategori...";

  const search = document.getElementById("scenarioCategorySearch");
  if(search){
    search.value = state.scenarioRanking?.categorySearch || "";
  }

  renderScenarioCategoryOptions(state.scenarioRanking?.categorySearch || "");
}

export function setupScenarioCategoryDropdown(){
  const categories = getScenarioCategories();

  if(!state.scenarioRanking){
    state.scenarioRanking = {
      category: categories[0] || "",
      categorySearch: ""
    };
  }

  if(!categories.includes(state.scenarioRanking.category)){
    state.scenarioRanking.category = categories[0] || "";
  }

  renderScenarioCategoryDropdown();
}
