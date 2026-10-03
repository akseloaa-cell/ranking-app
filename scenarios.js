// Scenarioer for scenario-baserte gamemodes.
// Hold scenarioene åpne og generelle slik at mange ulike items kan være gode svar.

export const SCENARIOS = [
  { id: "scenario_003", text: "Hva stoler du mest på?" },
  { id: "scenario_031", text: "Hva gir deg mest glede?" },
  { id: "scenario_032", text: "Hva gir deg mest kjærlighet?" },
  { id: "scenario_033", text: "Hva ville du hatt med på en øde øy?" },
  { id: "scenario_034", text: "Hva har du mest lyst på akkurat nå?" },
  { id: "scenario_035", text: "Hva betyr mest for deg?" },
  { id: "scenario_036", text: "Hva savner du mest?" },
  { id: "scenario_037", text: "Hva trenger du mest akkurat nå?" },
  { id: "scenario_038", text: "Hva gjør deg mest lykkelig" },
  { id: "scenario_039", text: "Hva gir deg mest energi?" },
  { id: "scenario_040", text: "Hva ville du reddet fra et brennende hus?" },
  { id: "scenario_041", text: "Hva er vakrest?" },
  { id: "scenario_042", text: "Hva er mest estetisk?" }
];

export function getRandomScenario(list = SCENARIOS) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
