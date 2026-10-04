import { state } from "./state.js";
import { STATE_VERSION } from "./state.js";

export function save() {
  localStorage.setItem("rankingApp", JSON.stringify({
    ...state,
    version: STATE_VERSION
  }));
}

export function load() {
  const raw = localStorage.getItem("rankingApp");
  if (!raw) return null;

  let data;
  try {
    data = JSON.parse(raw);
  } catch(error) {
    console.warn("Could not parse saved app state – starting with current state", error);
    return null;
  }

  if(!data || typeof data !== "object" || Array.isArray(data)) {
    console.warn("Saved app state has an invalid format – starting with current state");
    return null;
  }

  if (data.version !== STATE_VERSION) {
    console.warn("State version mismatch – resetting or migrating");
    return null;
  }

  return data;
}
