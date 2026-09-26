const pokeApiBaseUrl = "https://pokeapi.co/api/v2";
const pokemonSpriteBaseUrl =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const pokemonPerPage = 20; // this many Pokémon are added per click on "Catch more"
const pokemonPerLoadAllBatch = 50; // "Show all" fetches the Pokémon in batches of this size so the page grows gradually
const searchDelayMilliseconds = 250; // only search once the user has stopped typing for this long
const fallbackTypeColor = "blue"; // fallback in case a type is ever missing from the color tables
const pokemonCardWrapperClassName = "pokemon-card-wrapper";
const noDescriptionText = "No description available.";

// Small stroke icons (24x24); the color comes from the surrounding text
function strokeIconSvg(shapesMarkup) {
  return /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapesMarkup}</svg>`;
}

const icons = {
  previous: /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"></polyline></svg>`,
  next: /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>`,
  close: /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>`,
  sound: strokeIconSvg(`<polygon points="4 9.5 8 9.5 12.5 5.5 12.5 18.5 8 14.5 4 14.5"></polygon><path d="M16 9a4.2 4.2 0 0 1 0 6"></path><path d="M18.6 6.4a8 8 0 0 1 0 11.2"></path>`),
  sparkle: strokeIconSvg(`<path d="M11 4l1.9 5.1L18 11l-5.1 1.9L11 18l-1.9-5.1L4 11l5.1-1.9z"></path><path d="M19 15.5v4M17 17.5h4"></path>`),
  about: strokeIconSvg(`<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="11" x2="12" y2="16.5"></line><line x1="12" y1="7.6" x2="12" y2="7.7"></line>`),
  stats: strokeIconSvg(`<line x1="6" y1="20" x2="6" y2="11"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="18" y1="20" x2="18" y2="14"></line>`),
  evolution: strokeIconSvg(`<polyline points="3 17 9.5 10.5 13.5 14.5 21 7"></polyline><polyline points="15 7 21 7 21 13"></polyline>`),
  matchups: strokeIconSvg(`<path d="M12 21s7.5-3.6 7.5-9.6V5.8L12 3 4.5 5.8v5.6C4.5 17.4 12 21 12 21z"></path>`),
  moves: strokeIconSvg(`<polygon points="13 2.5 4.5 13.5 11.5 13.5 10.5 21.5 19.5 10 12.5 10 13 2.5"></polygon>`),
  check: strokeIconSvg(`<polyline points="5 12.5 10 17.5 19 7"></polyline>`),
  chevronDown: strokeIconSvg(`<polyline points="6 9 12 15 18 9"></polyline>`),
  // Watermark in the popup header: upper half filled, band and button in the middle
  pokeball: /* html */ `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" aria-hidden="true"><path d="M4 50a46 46 0 0 1 92 0z" fill="currentColor" stroke="none" opacity="0.35"></path><circle cx="50" cy="50" r="46"></circle><path d="M4 50h30M66 50h30"></path><circle cx="50" cy="50" r="15"></circle><circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"></circle></svg>`,
};

// The main color of each type: color of the type badge and start of the card and popup gradient
const mainColorByTypeName = {
  grass: "rgb(0, 102, 0)",
  fire: "rgb(241,79,14)",
  water: "rgb(49,124,218)",
  normal: "rgb(100, 99, 99)",
  electric: "rgb(198, 182, 7)",
  ice: "rgb(116,207,192)",
  fighting: "rgb(186,85,68)",
  poison: "rgb(149,83,204)",
  ground: "rgb(166,116,57)",
  bug: "rgb(115,29,12)",
  flying: "rgb(150,202,254)",
  rock: "rgb(187,170,102)",
  psychic: "rgb(255,98,128)",
  ghost: "rgb(110,67,111)",
  dragon: "rgb(85,112,189)",
  steel: "rgb(170,170,187)",
  fairy: "rgb(236,142,230)",
  dark: "rgb(78,68,69)",
};

// The end of the card and popup gradient
const gradientEndColorByTypeName = {
  grass: "rgb(14, 43, 14)",
  fire: "rgb(149, 46, 11)",
  water: "rgb(7, 70, 147)",
  normal: "rgb(58, 54, 54)",
  electric: "rgb(228, 210, 6)",
  ice: "rgb(28, 161, 139)",
  fighting: "rgb(181, 35, 9)",
  poison: "rgb(138, 56, 205)",
  ground: "rgb(149, 92, 27)",
  bug: "rgb(133, 53, 37)",
  flying: "rgb(133, 190, 246)",
  rock: "rgb(181, 160, 76)",
  psychic: "rgb(234, 88, 115)",
  ghost: "rgb(133, 56, 134)",
  dragon: "rgb(70, 100, 185)",
  steel: "rgb(152, 152, 180)",
  fairy: "rgb(222, 121, 216)",
  dark: "rgb(77, 51, 53)",
};

const allTypeNames = Object.keys(mainColorByTypeName);
