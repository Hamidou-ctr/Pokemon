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
