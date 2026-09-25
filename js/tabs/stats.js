registerTab({
  tabId: "Base-Stats",
  label: "Stats",
  icon: icons.stats,
  render: baseStatisticsHtml,
});

const maximumStatisticValue = 255; // bei diesem Wert ist der Balken einer Statistik voll
const maximumTotalValue = 780; // bei diesem Wert ist der Total-Balken voll

// Farbverlauf je Balken (von startColor nach endColor): erst die sechs Statistiken, zuletzt die Summe (Total)
const statisticBarColors = [
  { startColor: "#ff5c7c", endColor: "#ff9db1" }, // hp
  { startColor: "#ff9147", endColor: "#ffc08a" }, // attack
  { startColor: "#ffc93c", endColor: "#ffe38a" }, // defense
  { startColor: "#34d3c4", endColor: "#8aeee3" }, // special-attack
  { startColor: "#3f9bff", endColor: "#92c6ff" }, // special-defense
  { startColor: "#a17bff", endColor: "#c9b3ff" }, // speed
  { startColor: "#ff5a1f", endColor: "#ffb08a" }, // total
];

// Kurzformen für die Ecken des Radar-Diagramms, wie in den Spielen
const radarCornerLabels = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "SPE",
};
const radarViewBoxSize = 260; // Kantenlänge des SVG (viewBox), das Diagramm liegt mittig darin
const radarOuterRadius = 88; // Abstand vom Mittelpunkt bis zur äußersten Linie
const radarMaximumValue = 150; // ab diesem Wert reicht das Diagramm bis zum Rand; typische Werte liegen bei 40-120
const radarCornerCount = 6; // eine Ecke pro Statistik
const radarAngleBetweenCornersInDegrees = 360 / radarCornerCount;

function baseStatisticsHtml(pokemon) {
  let statistics = pokemon.stats.map((statEntry) => ({
    apiName: statEntry.stat.name,
    displayName: statEntry.stat.name === "hp" ? "HP" : formatNameForDisplay(statEntry.stat.name),
    value: statEntry.base_stat,
    maximumValue: maximumStatisticValue,
  }));
  let totalValue = statistics.reduce((sum, statistic) => sum + statistic.value, 0);
  let barEntries = [
    ...statistics,
    { displayName: "Total", value: totalValue, maximumValue: maximumTotalValue },
  ];
  return /* html */ `
    <div class="stats-layout">
      ${radarChartHtml(statistics)}
      <div class="bar-list">
        ${barEntries
          .map((barEntry, index) =>
            barRowHtml(
              barEntry.displayName,
              barEntry.value,
              barEntry.maximumValue,
              statisticBarColors[index],
            ),
          )
          .join("")}
      </div>
    </div>
  `;
}

// Winkel einer Ecke des Sechsecks: Ecke 0 oben (HP), dann im Uhrzeigersinn
function radarCornerAngleInRadians(cornerIndex) {
  return ((-90 + cornerIndex * radarAngleBetweenCornersInDegrees) * Math.PI) / 180;
}

// Punkt auf dem Sechseck; distanceRatio 1 ist der äußere Rand, 0 die Mitte
function radarPointCoordinates(cornerIndex, distanceRatio) {
  let angleInRadians = radarCornerAngleInRadians(cornerIndex);
  let centerCoordinate = radarViewBoxSize / 2;
  return [
    centerCoordinate + Math.cos(angleInRadians) * radarOuterRadius * distanceRatio,
    centerCoordinate + Math.sin(angleInRadians) * radarOuterRadius * distanceRatio,
  ];
}

// Ein Wert pro Ecke, jeweils als Anteil (0 bis 1) des Wegs von der Mitte zum Rand
function radarPolygonPoints(distanceRatios) {
  return distanceRatios
    .map((distanceRatio, cornerIndex) =>
      radarPointCoordinates(cornerIndex, distanceRatio).map((coordinate) => coordinate.toFixed(1)).join(","),
    )
    .join(" ");
}

function radarChartHtml(statistics) {
  let centerCoordinate = radarViewBoxSize / 2;
  let statisticDistanceRatios = statistics.map((statistic) => Math.min(1, statistic.value / radarMaximumValue));
  let ringsHtml = [0.25, 0.5, 0.75, 1]
    .map((ringDistanceRatio) => `<polygon class="radar-ring" points="${radarPolygonPoints(statistics.map(() => ringDistanceRatio))}"></polygon>`)
    .join("");
  let axesHtml = statistics
    .map((_statistic, cornerIndex) => {
      let [outerPointX, outerPointY] = radarPointCoordinates(cornerIndex, 1);
      return `<line class="radar-axis" x1="${centerCoordinate}" y1="${centerCoordinate}" x2="${outerPointX.toFixed(1)}" y2="${outerPointY.toFixed(1)}"></line>`;
    })
    .join("");
  let dotsHtml = statisticDistanceRatios
    .map((distanceRatio, cornerIndex) => {
      let [dotX, dotY] = radarPointCoordinates(cornerIndex, distanceRatio);
      return `<circle class="radar-dot" cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="3.5"></circle>`;
    })
    .join("");
  let labelsHtml = statistics
    .map((statistic, cornerIndex) => {
      let [labelX, labelY] = radarPointCoordinates(cornerIndex, 1.28);
      let horizontalDirection = Math.cos(radarCornerAngleInRadians(cornerIndex)); // >0 rechts, <0 links der Mitte
      let textAnchor = horizontalDirection > 0.3 ? "start" : horizontalDirection < -0.3 ? "end" : "middle";
      return /* html */ `
        <text class="radar-label" x="${labelX.toFixed(1)}" y="${(labelY - 1).toFixed(1)}" text-anchor="${textAnchor}">${radarCornerLabels[statistic.apiName] || statistic.displayName}</text>
        <text class="radar-value" x="${labelX.toFixed(1)}" y="${(labelY + 12).toFixed(1)}" text-anchor="${textAnchor}">${statistic.value}</text>
      `;
    })
    .join("");
  return /* html */ `
    <svg class="radar" viewBox="0 0 ${radarViewBoxSize} ${radarViewBoxSize}" role="img" aria-label="Base statistics as a radar chart">
      ${ringsHtml}${axesHtml}
      <polygon class="radar-shape" points="${radarPolygonPoints(statisticDistanceRatios)}"></polygon>
      ${dotsHtml}${labelsHtml}
    </svg>
  `;
}
