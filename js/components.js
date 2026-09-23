// HTML-Bausteine, die mehrere Tabs gemeinsam nutzen

function barRowHtml(label, value, maximumValue, barColors) {
  let percent = Math.min(100, (value / maximumValue) * 100).toFixed(1);
  return /* html */ `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <span class="bar-value">${value}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${percent}%; background-color: ${barColors.fill}; border-color: ${barColors.border};"></div>
      </div>
    </div>
  `;
}

// Statusmeldung ("Loading...", Fehler) im Look des About-Tabs
function tabMessageHtml(pokemon, text) {
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
  return /* html */ `
    <div class="About-div">
      <p style="background-color: ${secondaryBackgroundColor};">${text}</p>
    </div>
  `;
}
