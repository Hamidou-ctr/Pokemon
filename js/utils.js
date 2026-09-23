function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "special-attack" -> "Special Attack"
function formatName(name) {
  return name.split("-").map(capitalize).join(" ");
}

function formatId(id) {
  return `${String(id)}`;
}

// ".../pokemon-species/133/" -> 133
function idFromUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

// Der letzte englische Eintrag einer Liste aus { language, <field> }, ohne Zeilenumbrüche
function englishText(entries, field) {
  let entry = entries.filter((item) => item.language.name === "en").at(-1);
  return entry ? entry[field].replace(/\s+/g, " ").trim() : "";
}

function generatePrimaryBackgroundColor(pokemon) {
  return (
    typePokemonPrimaryBackgroundColor[pokemon.types[0].type.name] ||
    defaultTypeColor
  );
}

function generateSecondaryBackgroundColor(pokemon) {
  return (
    typePokemonSecondaryBackgroundColor[pokemon.types[0].type.name] ||
    defaultTypeColor
  );
}

function listImage(pokemon) {
  let sprites = pokemon.sprites;
  return sprites.other.showdown.front_default || sprites.front_default;
}

function listShinyImage(pokemon) {
  let sprites = pokemon.sprites;
  return (
    sprites.other.showdown.front_shiny ||
    sprites.front_shiny ||
    listImage(pokemon)
  );
}

function detailImage(pokemon) {
  let sprites = pokemon.sprites;
  return (
    sprites.other.dream_world.front_default ||
    sprites.other["official-artwork"].front_default ||
    sprites.front_default
  );
}

// null, wenn es für dieses Pokémon kein Shiny-Bild gibt
function shinyDetailImage(pokemon) {
  let sprites = pokemon.sprites;
  return sprites.other["official-artwork"].front_shiny || sprites.front_shiny;
}
