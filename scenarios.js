// Scenarioer for scenario-baserte gamemodes.
// Hold scenarioene åpne og generelle slik at mange ulike items kan være gode svar.

export const SCENARIOS = [
  { id: "scenario_001", text: "Du får bare velge én. Hvilket item velger du?" },
  { id: "scenario_002", text: "Du skal ta med deg ett item videre. Hvilket velger du?" },
  { id: "scenario_003", text: "Du trenger noe du kan stole på. Hvilket item velger du?" },
  { id: "scenario_004", text: "Du får muligheten til å beholde bare ett av disse. Hvilket beholder du?" },
  { id: "scenario_005", text: "Hvilket item ville du helst hatt tilgjengelig?" },
  { id: "scenario_006", text: "Du havner i en situasjon der du trenger hjelp. Hvilket item ville vært mest nyttig?" },
  { id: "scenario_007", text: "Du skal løse et problem uten å vite på forhånd hva problemet blir. Hvilket item velger du?" },
  { id: "scenario_008", text: "Du får bare ta med deg ett item til en ukjent situasjon. Hvilket velger du?" },
  { id: "scenario_009", text: "Du trenger noe som kan brukes på flere forskjellige måter. Hvilket item velger du?" },
  { id: "scenario_010", text: "Du vil være best mulig forberedt på det uventede. Hvilket item tar du med?" },
  { id: "scenario_011", text: "Du skal møte en gruppe mennesker for første gang. Hvilket item passer best å ha med?" },
  { id: "scenario_012", text: "Du skal gjøre et godt inntrykk. Hvilket item velger du?" },
  { id: "scenario_013", text: "Du skal bidra med noe til en gruppe. Hvilket item velger du?" },
  { id: "scenario_014", text: "Du trenger noe som kan gjøre en sosial situasjon bedre. Hvilket item velger du?" },
  { id: "scenario_015", text: "Du skal velge ett item som andre mennesker også kan få glede av. Hvilket velger du?" },
  { id: "scenario_016", text: "Du skal lage noe nytt. Hvilket item ville du startet med?" },
  { id: "scenario_017", text: "Du skal finne en uventet bruk for noe. Hvilket item velger du?" },
  { id: "scenario_018", text: "Du får i oppgave å komme på en kreativ løsning. Hvilket item gir deg flest muligheter?" },
  { id: "scenario_019", text: "Du skal begynne på et helt nytt prosjekt. Hvilket item tar du med?" },
  { id: "scenario_020", text: "Du skal gjøre noe vanlig på en helt ny måte. Hvilket item velger du?" },
  { id: "scenario_021", text: "Du må ta en rask avgjørelse. Hvilket item ville du valgt?" },
  { id: "scenario_022", text: "Du vet ikke hva som venter deg. Hvilket item ville du satset på?" },
  { id: "scenario_023", text: "Du kan bare velge ett item for resten av dagen. Hvilket velger du?" },
  { id: "scenario_024", text: "Du må velge det itemet du tror du vil få mest bruk for. Hvilket velger du?" },
  { id: "scenario_025", text: "Du må velge ett item uten å vite hvilke andre valg du får senere. Hvilket velger du?" },
  { id: "scenario_026", text: "Noe uventet skjer. Hvilket item ville du helst hatt tilgjengelig?" },
  { id: "scenario_027", text: "Planen endrer seg plutselig. Hvilket item er du glad for at du har?" },
  { id: "scenario_028", text: "Du får en oppgave du ikke var forberedt på. Hvilket item velger du?" },
  { id: "scenario_029", text: "Du må improvisere. Hvilket item ville du valgt?" },
  { id: "scenario_030", text: "Du får bare én ting som kan hjelpe deg med det som skjer videre. Hvilket item velger du?" }
];

export function getRandomScenario(list = SCENARIOS) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
