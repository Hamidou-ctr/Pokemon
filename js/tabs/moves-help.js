// The help in the Moves tab (part of moves.js): a short guide that explains the game selection,
// the learn methods and the move cards. It comes in English, German and French. The language starts as the
// browser's language and can be switched in the guide; nothing is stored in the browser.

const movesHelpLanguages = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

// Every language has a title, an intro and the sections. A section is { heading, paragraphs, terms, closingParagraph }
// with terms = [[term, explanation]]. The terms are the labels of the app itself and stay in English everywhere.
const movesHelpTexts = {
  en: {
    title: "How the Moves tab works",
    intro: "A Pokémon does not learn the same moves in every game. That is why this tab first asks: which game?",
    sections: [
      {
        heading: "Game",
        paragraphs: [
          "Pick the Pokémon game you are playing. The list below then only shows the moves this Pokémon can learn in that game.",
          "The games are sorted by generation, newest first. Next to each game you see how many moves there are. At the start, the newest game that has level-up moves is selected.",
        ],
      },
      {
        heading: "How a move is learned",
        terms: [
          ["Level up", "The Pokémon learns the move by itself when it reaches a certain level. “Lv 26” means from level 26. “Evo” means the move comes with an evolution."],
          ["TM / HM", "A machine that you find or buy in the game. It teaches the move to the Pokémon. HMs are special machines for moves that are also used outside of battles."],
          ["Egg", "Breeding: the baby in the egg already knows a move that a parent passed on."],
          ["Tutor", "A character in the game teaches the move, often in return for something."],
          ["Other", "Special cases of individual games."],
        ],
        closingParagraph: "The number on each button is how many moves there are for that way. Ways that do not exist in the chosen game are missing.",
      },
      {
        heading: "Reading a move card",
        paragraphs: ["The card is colored like the type of the move."],
        terms: [
          ["Lv / TM / Egg …", "The tag on the left tells you when or how the move is learned."],
          ["Type", "Decides which Pokémon the move is strong or weak against. If your Pokémon has the same type, the move deals 1.5 times the damage."],
          ["Physical / Special / Status", "Physical and Special moves deal damage (Physical uses Attack and Defense, Special uses Sp. Atk and Sp. Def). Status moves deal no damage. They change something, for example they lower stats or paralyze the target."],
          ["Power", "How much damage the move deals. A dash means it deals no direct damage. A full bar stands for 200."],
          ["Accuracy", "The chance to hit, in percent. A dash means the move always works."],
          ["PP", "How often you can use the move. After that it is empty until you heal the Pokémon at a Pokémon Center. A full bar stands for 40."],
        ],
      },
      {
        heading: "Using it in battle",
        paragraphs: [
          "A Pokémon can know up to 4 moves at the same time. Pick them so that you have something strong against many opponents, ideally moves of different types.",
          "Open the Matchups tab of the Pokémon you are about to fight to see which types hurt it the most.",
        ],
      },
    ],
  },
  de: {
    title: "So funktioniert der Moves-Tab",
    intro: "Ein Pokémon lernt nicht in jedem Spiel dieselben Attacken. Deshalb fragt dieser Tab zuerst: Welches Spiel?",
    sections: [
      {
        heading: "Game",
        paragraphs: [
          "Wähle das Pokémon-Spiel, das du spielst. Die Liste darunter zeigt dann nur die Attacken, die dieses Pokémon in diesem Spiel lernen kann.",
          "Die Spiele sind nach Generation sortiert, das neueste steht oben. Neben jedem Spiel steht, wie viele Attacken es dort gibt. Am Anfang ist das neueste Spiel ausgewählt, in dem es Level-up-Attacken gibt.",
        ],
      },
      {
        heading: "Wie eine Attacke gelernt wird",
        terms: [
          ["Level up", "Das Pokémon lernt die Attacke von selbst, sobald es ein bestimmtes Level erreicht. „Lv 26“ heißt: ab Level 26. „Evo“ heißt: Die Attacke kommt bei der Entwicklung."],
          ["TM / HM", "Eine Maschine, die du im Spiel findest oder kaufst. Sie bringt dem Pokémon die Attacke bei. HMs sind besondere Maschinen für Attacken, die man auch außerhalb von Kämpfen braucht."],
          ["Egg", "Zucht: Das Baby im Ei kennt schon eine Attacke, die ein Elternteil weitergibt."],
          ["Tutor", "Eine Figur im Spiel bringt dem Pokémon die Attacke bei, oft gegen eine Gegenleistung."],
          ["Other", "Sonderfälle einzelner Spiele."],
        ],
        closingParagraph: "Die Zahl auf jedem Knopf sagt, wie viele Attacken es auf diesem Weg gibt. Wege, die es im gewählten Spiel nicht gibt, fehlen.",
      },
      {
        heading: "Eine Attackenkarte lesen",
        paragraphs: ["Die Karte hat die Farbe des Typs der Attacke."],
        terms: [
          ["Lv / TM / Egg …", "Das Schild links zeigt, wann oder wie die Attacke gelernt wird."],
          ["Type", "Entscheidet, gegen welche Pokémon die Attacke stark oder schwach ist. Hat dein Pokémon denselben Typ, macht die Attacke 1,5-mal so viel Schaden."],
          ["Physical / Special / Status", "Physical- und Special-Attacken machen Schaden (Physical rechnet mit Attack und Defense, Special mit Sp. Atk und Sp. Def). Status-Attacken machen keinen Schaden. Sie verändern etwas, zum Beispiel senken sie Werte oder lähmen das Ziel."],
          ["Power", "Wie viel Schaden die Attacke macht. Ein Strich bedeutet: kein direkter Schaden. Ein voller Balken steht für 200."],
          ["Accuracy", "Die Trefferchance in Prozent. Ein Strich bedeutet: Die Attacke wirkt immer."],
          ["PP", "Wie oft du die Attacke benutzen kannst. Danach ist sie leer, bis du dein Pokémon im Pokémon-Center heilst. Ein voller Balken steht für 40."],
        ],
      },
      {
        heading: "Im Kampf",
        paragraphs: [
          "Ein Pokémon kann höchstens 4 Attacken gleichzeitig kennen. Such sie so aus, dass du gegen viele Gegner etwas Starkes hast, am besten mit verschiedenen Typen.",
          "Öffne den Matchups-Tab des Pokémon, gegen das du kämpfst. Dort siehst du, welche Typen ihm am meisten schaden.",
        ],
      },
    ],
  },
  fr: {
    title: "Comment fonctionne l’onglet Moves",
    intro: "Un Pokémon n’apprend pas les mêmes attaques dans tous les jeux. C’est pourquoi cet onglet demande d’abord : quel jeu ?",
    sections: [
      {
        heading: "Game",
        paragraphs: [
          "Choisis le jeu Pokémon auquel tu joues. La liste en dessous montre alors uniquement les attaques que ce Pokémon peut apprendre dans ce jeu.",
          "Les jeux sont classés par génération, du plus récent au plus ancien. À côté de chaque jeu, tu vois combien d’attaques il y a. Au début, le jeu le plus récent qui a des attaques par niveau est sélectionné.",
        ],
      },
      {
        heading: "Comment une attaque s’apprend",
        terms: [
          ["Level up", "Le Pokémon apprend l’attaque tout seul quand il atteint un certain niveau. « Lv 26 » signifie : à partir du niveau 26. « Evo » signifie : l’attaque arrive avec l’évolution."],
          ["TM / HM", "Une machine que tu trouves ou achètes dans le jeu. Elle enseigne l’attaque au Pokémon. Les HM sont des machines spéciales pour des attaques utiles aussi en dehors des combats."],
          ["Egg", "L’élevage : le bébé dans l’œuf connaît déjà une attaque transmise par un parent."],
          ["Tutor", "Un personnage du jeu enseigne l’attaque au Pokémon, souvent en échange de quelque chose."],
          ["Other", "Cas particuliers de certains jeux."],
        ],
        closingParagraph: "Le nombre sur chaque bouton indique combien d’attaques il y a pour cette méthode. Les méthodes qui n’existent pas dans le jeu choisi n’apparaissent pas.",
      },
      {
        heading: "Lire une carte d’attaque",
        paragraphs: ["La carte prend la couleur du type de l’attaque."],
        terms: [
          ["Lv / TM / Egg …", "L’étiquette à gauche indique quand ou comment l’attaque s’apprend."],
          ["Type", "Détermine contre quels Pokémon l’attaque est forte ou faible. Si ton Pokémon a le même type, l’attaque inflige 1,5 fois plus de dégâts."],
          ["Physical / Special / Status", "Les attaques Physical et Special infligent des dégâts (Physical utilise Attack et Defense, Special utilise Sp. Atk et Sp. Def). Les attaques Status n’infligent pas de dégâts. Elles changent quelque chose, par exemple elles baissent des statistiques ou paralysent la cible."],
          ["Power", "Les dégâts de l’attaque. Un tiret signifie : pas de dégâts directs. Une barre pleine correspond à 200."],
          ["Accuracy", "La chance de toucher, en pourcentage. Un tiret signifie : l’attaque fonctionne toujours."],
          ["PP", "Combien de fois tu peux utiliser l’attaque. Ensuite elle est vide jusqu’à ce que tu soignes ton Pokémon dans un Centre Pokémon. Une barre pleine correspond à 40."],
        ],
      },
      {
        heading: "En combat",
        paragraphs: [
          "Un Pokémon peut connaître 4 attaques au maximum en même temps. Choisis-les pour avoir quelque chose de fort contre beaucoup d’adversaires, de préférence de types différents.",
          "Ouvre l’onglet Matchups du Pokémon que tu affrontes pour voir quels types lui font le plus mal.",
        ],
      },
    ],
  },
};

const defaultMovesHelpLanguageCode = "en";
const initiallyOpenMovesHelpSectionIndexes = [0]; // only the first section is open when the help opens

let movesHelpLanguageCode = pickMovesHelpLanguageOfBrowser();

// "de-DE" becomes "de"; a language the help does not have falls back to English
function pickMovesHelpLanguageOfBrowser() {
  let browserLanguageCode = navigator.language.slice(0, 2);
  let isSupported = movesHelpLanguages.some((language) => language.code === browserLanguageCode);
  return isSupported ? browserLanguageCode : defaultMovesHelpLanguageCode;
}

// ---------- Structure ----------

// The button is labeled in all three languages, so that it can be understood before a language is chosen
function movesHelpHtml() {
  return /* html */ `
    <button type="button" class="moves-help-toggle" id="moves-help-toggle" aria-expanded="false" aria-controls="moves-help" onclick="toggleMovesHelp()">
      ${icons.about}
      <span>Help · Hilfe · Aide</span>
    </button>
    <section class="moves-help" id="moves-help" hidden>${movesHelpContentHtml(initiallyOpenMovesHelpSectionIndexes)}</section>
  `;
}

function movesHelpContentHtml(openSectionIndexes) {
  let texts = movesHelpTexts[movesHelpLanguageCode];
  return /* html */ `
    <div lang="${movesHelpLanguageCode}">
      <div class="moves-help-top">
        <h3 class="moves-help-title">${texts.title}</h3>
        <div class="moves-help-languages" role="group" aria-label="Language · Sprache · Langue">${movesHelpLanguageButtonsHtml()}</div>
      </div>
      <p class="moves-help-intro">${texts.intro}</p>
      ${texts.sections.map((section, sectionIndex) => movesHelpSectionHtml(section, openSectionIndexes.includes(sectionIndex), sectionIndex)).join("")}
    </div>
  `;
}

function movesHelpLanguageButtonsHtml() {
  return movesHelpLanguages
    .map((language) => {
      let isActive = language.code === movesHelpLanguageCode;
      return `<button type="button" class="moves-help-language" lang="${language.code}" aria-pressed="${isActive}" onclick="showMovesHelpLanguage('${language.code}')">${language.label}</button>`;
    })
    .join("");
}

// The numbers in front of the headings follow the order in which the tab is used
function movesHelpSectionHtml(section, isOpen, sectionIndex) {
  return /* html */ `
    <details class="moves-help-section"${isOpen ? " open" : ""}>
      <summary>
        <span class="moves-help-step">${sectionIndex + 1}</span>
        <span>${section.heading}</span>
        ${icons.chevronDown}
      </summary>
      <div class="moves-help-section-body">
        ${(section.paragraphs || []).map(movesHelpParagraphHtml).join("")}
        ${section.terms ? movesHelpTermsHtml(section.terms) : ""}
        ${section.closingParagraph ? movesHelpParagraphHtml(section.closingParagraph) : ""}
      </div>
    </details>
  `;
}

function movesHelpParagraphHtml(paragraphText) {
  return `<p>${paragraphText}</p>`;
}

function movesHelpTermsHtml(terms) {
  let termsHtml = terms.map(([term, explanation]) => `<div><dt lang="en">${term}</dt><dd>${explanation}</dd></div>`).join("");
  return `<dl class="moves-help-terms">${termsHtml}</dl>`;
}

// ---------- Opening, closing and language ----------

function toggleMovesHelp() {
  let helpElement = document.getElementById("moves-help");
  helpElement.hidden = !helpElement.hidden;
  document.getElementById("moves-help-toggle").setAttribute("aria-expanded", String(!helpElement.hidden));
}

// Which sections are open stays the same when the language changes
function showMovesHelpLanguage(languageCode) {
  let openSectionIndexes = findOpenMovesHelpSectionIndexes();
  movesHelpLanguageCode = languageCode;
  document.getElementById("moves-help").innerHTML = movesHelpContentHtml(openSectionIndexes);
  document.querySelector('.moves-help-language[aria-pressed="true"]').focus(); // the clicked button was replaced
}

function findOpenMovesHelpSectionIndexes() {
  let sectionElements = Array.from(document.querySelectorAll(".moves-help-section"));
  return sectionElements.flatMap((sectionElement, sectionIndex) => (sectionElement.open ? [sectionIndex] : []));
}
