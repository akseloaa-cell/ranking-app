// Scenarioer for scenario-baserte gamemodes.
// Hold scenarioene åpne og generelle slik at mange ulike items kan være gode svar.

export const SCENARIOS = [
  { id: "scenario_003", text: "Hva stoler du mest på?" }
];

export function getRandomScenario(list = SCENARIOS) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
