import { setMode } from "./ui.js";

export function openScenarioRankingSetup(){
  setMode("scenarioRankingSetup");
}

export function backToScenarioHub(){
  setMode("scenario");
}
