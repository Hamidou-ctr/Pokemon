// HTML-Bausteine, die mehrere Tabs gemeinsam nutzen

// Die drei Zellen einer Balkenzeile: Beschriftung, Wert, Balken.
// barColors sind zwei beliebige CSS-Farben: der Balken läuft von border nach fill.
function barCellsHtml(label, value, maximumValue, barColors) {
  let percent = Math.min(100, (value / maximumValue) * 100).toFixed(1);
  return /* html */ `
    <span class="bar-label">${label}</span>
    <span class="bar-value">${value}</span>
    <div class="bar-track">
      <div class="bar-fill" style="width: ${percent}%; --bar-from: ${barColors.border}; --bar-to: ${barColors.fill};"></div>
    </div>
  `;
}

function barRowHtml(label, value, maximumValue, barColors) {
  return /* html */ `
    <div class="bar-row">${barCellsHtml(label, value, maximumValue, barColors)}</div>
  `;
}

function typeBadgeHtml(typeName) {
  let color = typePokemonPrimaryBackgroundColor[typeName] || defaultTypeColor;
  return `<span class="pokemon-type" style="--type-color: ${color};">${formatName(typeName)}</span>`;
}

// Kleine Kennzahl wie "Power 120"
function factHtml(label, value) {
  return `<span class="fact"><b>${label}</b> ${value}</span>`;
}

// Statusmeldung ("Loading...", Fehler) für einen Tab
function tabMessageHtml(text) {
  return `<p class="tab-message">${text}</p>`;
}

// Aufklappbare Zeile. Beim ersten Aufklappen wird loader(name) aufgerufen und
// dessen HTML in die Zeile geschrieben. loader muss eine benannte Funktion sein,
// weil der Aufruf als Text in den ontoggle-Handler geschrieben wird.
function expandableHtml(summaryHtml, loader, name, summaryClass = "") {
  return /* html */ `
    <details class="expandable" ontoggle="loadDetails(this, ${loader.name}, '${name}')">
      <summary class="${summaryClass}">${summaryHtml}</summary>
      <div class="expand-body"></div>
    </details>
  `;
}

async function loadDetails(details, loader, name) {
  if (!details.open || details.dataset.loaded) return; // nur beim ersten Aufklappen laden
  details.dataset.loaded = "true";
  let body = details.querySelector(".expand-body");
  body.textContent = "Loading...";
  try {
    body.innerHTML = await loader(name);
  } catch (error) {
    console.error(error);
    delete details.dataset.loaded; // beim nächsten Aufklappen erneut versuchen
    body.textContent = "The details could not be loaded.";
  }
}
