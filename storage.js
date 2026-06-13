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

  const data = JSON.parse(raw);

  if (data.version !== STATE_VERSION) {
    console.warn("State version mismatch – resetting or migrating");
    return null;
  }

  return data;
}
