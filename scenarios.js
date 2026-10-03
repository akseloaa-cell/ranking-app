// Scenarioer for scenario-baserte gamemodes.
// Hold scenarioene åpne og generelle slik at mange ulike items kan være gode svar.

export const SCENARIO_CATEGORIES = [
  "generelt",
  "nyttig",
  "sosialt",
  "kreativt",
  "valg",
  "uventet"
];

export const SCENARIOS = [
  { id: "general_01", category: "generelt", text: "Du får bare velge én. Hvilket item velger du?" },
  { id: "general_02", category: "generelt", text: "Du skal ta med deg ett item videre. Hvilket velger du?" },
  { id: "general_03", category: "generelt", text: "Du trenger noe du kan stole på. Hvilket item velger du?" },
  { id: "general_04", category: "generelt", text: "Du får muligheten til å beholde bare ett av disse. Hvilket beholder du?" },
  { id: "general_05", category: "generelt", text: "Hvilket item ville du helst hatt tilgjengelig?" },

  { id: "useful_01", category: "nyttig", text: "Du havner i en situasjon der du trenger hjelp. Hvilket item ville vært mest nyttig?" },
  { id: "useful_02", category: "nyttig", text: "Du skal løse et problem uten å vite på forhånd hva problemet blir. Hvilket item velger du?" },
  { id: "useful_03", category: "nyttig", text: "Du får bare ta med deg ett item til en ukjent situasjon. Hvilket velger du?" },
  { id: "useful_04", category: "nyttig", text: "Du trenger noe som kan brukes på flere forskjellige måter. Hvilket item velger du?" },
  { id: "useful_05", category: "nyttig", text: "Du vil være best mulig forberedt på det uventede. Hvilket item tar du med?" },

  { id: "social_01", category: "sosialt", text: "Du skal møte en gruppe mennesker for første gang. Hvilket item passer best å ha med?" },
  { id: "social_02", category: "sosialt", text: "Du skal gjøre et godt inntrykk. Hvilket item velger du?" },
  { id: "social_03", category: "sosialt", text: "Du skal bidra med noe til en gruppe. Hvilket item velger du?" },
  { id: "social_04", category: "sosialt", text: "Du trenger noe som kan gjøre en sosial situasjon bedre. Hvilket item velger du?" },
  { id: "social_05", category: "sosialt", text: "Du skal velge ett item som andre mennesker også kan få glede av. Hvilket velger du?" },

  { id: "creative_01", category: "kreativt", text: "Du skal lage noe nytt. Hvilket item ville du startet med?" },
  { id: "creative_02", category: "kreativt", text: "Du skal finne en uventet bruk for noe. Hvilket item velger du?" },
  { id: "creative_03", category: "kreativt", text: "Du får i oppgave å komme på en kreativ løsning. Hvilket item gir deg flest muligheter?" },
  { id: "creative_04", category: "kreativt", text: "Du skal begynne på et helt nytt prosjekt. Hvilket item tar du med?" },
  { id: "creative_05", category: "kreativt", text: "Du skal gjøre noe vanlig på en helt ny måte. Hvilket item velger du?" },

  { id: "choice_01", category: "valg", text: "Du må ta en rask avgjørelse. Hvilket item ville du valgt?" },
  { id: "choice_02", category: "valg", text: "Du vet ikke hva som venter deg. Hvilket item ville du satset på?" },
  { id: "choice_03", category: "valg", text: "Du kan bare velge ett item for resten av dagen. Hvilket velger du?" },
  { id: "choice_04", category: "valg", text: "Du må velge det itemet du tror du vil få mest bruk for. Hvilket velger du?" },
  { id: "choice_05", category: "valg", text: "Du må velge ett item uten å vite hvilke andre valg du får senere. Hvilket velger du?" },

  { id: "unexpected_01", category: "uventet", text: "Noe uventet skjer. Hvilket item ville du helst hatt tilgjengelig?" },
  { id: "unexpected_02", category: "uventet", text: "Planen endrer seg plutselig. Hvilket item er du glad for at du har?" },
  { id: "unexpected_03", category: "uventet", text: "Du får en oppgave du ikke var forberedt på. Hvilket item velger du?" },
  { id: "unexpected_04", category: "uventet", text: "Du må improvisere. Hvilket item ville du valgt?" },
  { id: "unexpected_05", category: "uventet", text: "Du får bare én ting som kan hjelpe deg med det som skjer videre. Hvilket item velger du?" }
];

export function getRandomScenario(list = SCENARIOS) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function getScenariosByCategory(category) {
  if (!category || category === "alle") return [...SCENARIOS];
  return SCENARIOS.filter(scenario => scenario.category === category);
}
