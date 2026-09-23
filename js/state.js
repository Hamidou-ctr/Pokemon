// Gemeinsamer Zustand der Seite: list.js und detail.js lesen und ändern ihn.
let pokemonIndex = []; // { pokemonId, name } aller Pokémon, wird einmal beim Start geladen
let matches = []; // der Teil von pokemonIndex, der zur aktuellen Suche passt
let shownCount = 0; // wie viele der matches schon auf der Seite stehen
let currentPokemon = null; // Pokémon der Detailansicht, null solange sie geschlossen ist
let listRequest = 0; // Nummer der letzten Listen-Aktualisierung, ältere werden verworfen
let informationRequest = 0; // dasselbe für die Detailansicht
let searchTimer;
