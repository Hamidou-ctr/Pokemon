registerTab({
  name: "Base-Stats",
  label: "Stats",
  icon: icons.stats,
  render: baseStatisticsHtml,
});

const maximumStatisticValue = 255; // bei diesem Wert ist der Balken einer Statistik voll
const maximumTotalValue = 780; // bei diesem Wert ist der Total-Balken voll

// Farbverlauf je Balken (von, nach): erst die sechs Statistiken, zuletzt die Summe (Total)
const statisticColors = [
  { border: "#ff5c7c", fill: "#ff9db1" }, // hp
  { border: "#ff9147", fill: "#ffc08a" }, // attack
  { border: "#ffc93c", fill: "#ffe38a" }, // defense
  { border: "#34d3c4", fill: "#8aeee3" }, // special-attack
  { border: "#3f9bff", fill: "#92c6ff" }, // special-defense
  { border: "#a17bff", fill: "#c9b3ff" }, // speed
  { border: "#ff5a1f", fill: "#ffb08a" }, // total
];

// Kurzformen für die Ecken des Radar-Diagramms, wie in den Spielen
const radarLabels = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "SPE",
};
const radarSize = 260; // Kantenlänge des SVG (viewBox), das Diagramm liegt mittig darin
const radarRadius = 88; // Abstand vom Mittelpunkt bis zur äußersten Linie
const radarMaximumValue = 150; // ab diesem Wert reicht das Diagramm bis zum Rand; typische Werte liegen bei 40-120

function baseStatisticsHtml(pokemon) {
  let statistics = pokemon.stats.map((entry) => ({
    key: entry.stat.name,
    name: entry.stat.name === "hp" ? "HP" : formatName(entry.stat.name),
    value: entry.base_stat,
    maximum: maximumStatisticValue,
  }));
  let total = statistics.reduce((sum, statistic) => sum + statistic.value, 0);
  let bars = [
    ...statistics,
    { name: "Total", value: total, maximum: maximumTotalValue },
  ];
  return /* html */ `
    <div class="stats-layout">
      ${radarHtml(statistics)}
      <div class="bar-list">
        ${bars
          .map((statistic, index) =>
            barRowHtml(
              statistic.name,
              statistic.value,
              statistic.maximum,
              statisticColors[index],
            ),
          )
          .join("")}
      </div>
    </div>
  `;
}

// Punkt auf dem Sechseck: Ecke 0 oben (HP), dann im Uhrzeigersinn; ratio 1 ist der äußere Rand
function radarPoint(index, ratio) {
  let angle = ((-90 + index * 60) * Math.PI) / 180;
  let center = radarSize / 2;
  return [
    center + Math.cos(angle) * radarRadius * ratio,
    center + Math.sin(angle) * radarRadius * ratio,
  ];
}

function radarPolygon(ratios) {
  return ratios
    .map((ratio, index) => radarPoint(index, ratio).map((n) => n.toFixed(1)).join(","))
    .join(" ");
}

function radarHtml(statistics) {
  let center = radarSize / 2;
  let ratios = statistics.map((s) => Math.min(1, s.value / radarMaximumValue));
  let rings = [0.25, 0.5, 0.75, 1]
    .map((ratio) => `<polygon class="radar-ring" points="${radarPolygon(statistics.map(() => ratio))}"></polygon>`)
    .join("");
  let axes = statistics
    .map((_, index) => {
      let [x, y] = radarPoint(index, 1);
      return `<line class="radar-axis" x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line>`;
    })
    .join("");
  let dots = ratios
    .map((ratio, index) => {
      let [x, y] = radarPoint(index, ratio);
      return `<circle class="radar-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"></circle>`;
    })
    .join("");
  let labels = statistics
    .map((statistic, index) => {
      let [x, y] = radarPoint(index, 1.28);
      let cosine = Math.cos(((-90 + index * 60) * Math.PI) / 180);
      let anchor = cosine > 0.3 ? "start" : cosine < -0.3 ? "end" : "middle";
      return /* html */ `
        <text class="radar-label" x="${x.toFixed(1)}" y="${(y - 1).toFixed(1)}" text-anchor="${anchor}">${radarLabels[statistic.key] || statistic.name}</text>
        <text class="radar-value" x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="${anchor}">${statistic.value}</text>
      `;
    })
    .join("");
  return /* html */ `
    <svg class="radar" viewBox="0 0 ${radarSize} ${radarSize}" role="img" aria-label="Base statistics as a radar chart">
      ${rings}${axes}
      <polygon class="radar-shape" points="${radarPolygon(ratios)}"></polygon>
      ${dots}${labels}
    </svg>
  `;
}
