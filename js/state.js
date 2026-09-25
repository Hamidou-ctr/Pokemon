// Gemeinsamer Zustand der Seite: pokemon-list.js und pokemon-detail.js lesen und ändern ihn.
let allPokemonNamesAndIds = []; // { pokemonId, name } aller Pokémon, wird einmal beim Start geladen
let searchResults = []; // der Teil von allPokemonNamesAndIds, der zur aktuellen Suche passt
let displayedPokemonCount = 0; // wie viele der searchResults schon auf der Seite stehen
let pokemonInDetailView = null; // Pokémon der Detailansicht, null solange sie geschlossen ist
let latestListRequestNumber = 0; // Nummer der letzten Listen-Aktualisierung, ältere werden verworfen
let latestDetailRequestNumber = 0; // dasselbe für die Detailansicht
let searchDelayTimerId;
