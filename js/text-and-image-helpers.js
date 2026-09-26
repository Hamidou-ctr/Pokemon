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

// The last English entry of a list of { language, <textFieldName> }, without line breaks
function findLatestEnglishText(textEntries, textFieldName) {
  let englishEntry = textEntries.filter((textEntry) => textEntry.language.name === "en").at(-1);
  return englishEntry ? englishEntry[textFieldName].replace(/\s+/g, " ").trim() : "";
}

// The colors are based on the Pokémon's first type
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

// Small animated image for the cards in the overview
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

// Large image for the popup
function getDetailImageUrl(pokemon) {
  let sprites = pokemon.sprites;
  return (
    sprites.other.dream_world.front_default ||
    sprites.other["official-artwork"].front_default ||
    sprites.front_default
  );
}

// null if there is no shiny image for this Pokémon
function getShinyDetailImageUrl(pokemon) {
  let sprites = pokemon.sprites;
  return sprites.other["official-artwork"].front_shiny || sprites.front_shiny;
}
