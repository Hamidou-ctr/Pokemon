function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "special-attack" -> "Special Attack"
function formatNameForDisplay(apiName) {
  return apiName.split("-").map(capitalizeFirstLetter).join(" ");
}

// ".../pokemon-species/133/" -> 133
function extractIdFromUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

// Der letzte englische Eintrag einer Liste aus { language, <textFieldName> }, ohne Zeilenumbrüche
function findLatestEnglishText(textEntries, textFieldName) {
  let englishEntry = textEntries.filter((textEntry) => textEntry.language.name === "en").at(-1);
  return englishEntry ? englishEntry[textFieldName].replace(/\s+/g, " ").trim() : "";
}

// Die Farben richten sich nach dem ersten Typ des Pokémon
function getMainColorOfPokemon(pokemon) {
  return (
    mainColorByTypeName[pokemon.types[0].type.name] ||
    fallbackTypeColor
  );
}

function getGradientEndColorOfPokemon(pokemon) {
  return (
    gradientEndColorByTypeName[pokemon.types[0].type.name] ||
    fallbackTypeColor
  );
}

// Kleines, animiertes Bild für die Karten der Übersicht
function getListSpriteUrl(pokemon) {
  let sprites = pokemon.sprites;
  return sprites.other.showdown.front_default || sprites.front_default;
}

function getShinyListSpriteUrl(pokemon) {
  let sprites = pokemon.sprites;
  return (
    sprites.other.showdown.front_shiny ||
    sprites.front_shiny ||
    getListSpriteUrl(pokemon)
  );
}

// Großes Bild für das Popup
function getDetailImageUrl(pokemon) {
  let sprites = pokemon.sprites;
  return (
    sprites.other.dream_world.front_default ||
    sprites.other["official-artwork"].front_default ||
    sprites.front_default
  );
}

// null, wenn es für dieses Pokémon kein Shiny-Bild gibt
function getShinyDetailImageUrl(pokemon) {
  let sprites = pokemon.sprites;
  return sprites.other["official-artwork"].front_shiny || sprites.front_shiny;
}
