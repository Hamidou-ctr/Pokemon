// Shared page state: pokemon-list.js and pokemon-detail.js read and modify it.
let allPokemonNamesAndIds = []; // { pokemonId, name } of all Pokémon, loaded once at startup
let searchResults = []; // the part of allPokemonNamesAndIds that matches the current search
let displayedPokemonCount = 0; // how many of the searchResults are already on the page
let pokemonInDetailView = null; // Pokémon in the detail view, null while it is closed
let latestListRequestNumber = 0; // number of the latest list update; older ones are discarded
let latestDetailRequestNumber = 0; // the same for the detail view
let searchDelayTimerId;
