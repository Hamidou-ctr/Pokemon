registerTab({
  tabId: "Base-Stats",
  label: "Stats",
  icon: icons.stats,
  render: baseStatisticsHtml,
});

const maximumStatisticValue = 255; // at this value the bar of a statistic is full
const maximumTotalValue = 780; // at this value the total bar is full

// Gradient per bar (from startColor to endColor): first the six statistics, last the sum (total)
const statisticBarColors = [
  { startColor: "#ff5c7c", endColor: "#ff9db1" }, // hp
  { startColor: "#ff9147", endColor: "#ffc08a" }, // attack
  { startColor: "#ffc93c", endColor: "#ffe38a" }, // defense
  { startColor: "#34d3c4", endColor: "#8aeee3" }, // special-attack
  { startColor: "#3f9bff", endColor: "#92c6ff" }, // special-defense
  { startColor: "#a17bff", endColor: "#c9b3ff" }, // speed
  { startColor: "#ff5a1f", endColor: "#ffb08a" }, // total
];

// Abbreviations for the corners of the radar chart, as in the games
const radarCornerLabels = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "SPE",
};
const radarViewBoxSize = 260; // edge length of the SVG (viewBox); the chart sits centered in it
const radarCenterCoordinate = radarViewBoxSize / 2;
const radarOuterRadius = 88; // distance from the center to the outermost line
const radarMaximumValue = 150; // from this value on the chart reaches the edge; typical values are 40-120
const radarRingDistanceRatios = [0.25, 0.5, 0.75, 1]; // the guide rings, each as a fraction of the way to the edge
const radarCornerCount = 6; // one corner per statistic
const radarAngleBetweenCornersInDegrees = 360 / radarCornerCount;

// ---------- Bars ----------

function baseStatisticsHtml(pokemon) {
  let statistics = pokemon.stats.map(toStatistic);
  let barEntries = [...statistics, createTotalBarEntry(statistics)];
  return /* html */ `
    <div class="stats-layout">
      ${radarChartHtml(statistics)}
      <div class="bar-list">${barEntries.map(statisticBarRowHtml).join("")}</div>
    </div>
  `;
}

function toStatistic(statEntry) {
  return {
    apiName: statEntry.stat.name,
    displayName: statEntry.stat.name === "hp" ? "HP" : formatNameForDisplay(statEntry.stat.name),
    value: statEntry.base_stat,
    maximumValue: maximumStatisticValue,
  };
}

function createTotalBarEntry(statistics) {
  let totalValue = statistics.reduce((sum, statistic) => sum + statistic.value, 0);
  return { displayName: "Total", value: totalValue, maximumValue: maximumTotalValue };
}

function statisticBarRowHtml(barEntry, index) {
  return barRowHtml(barEntry.displayName, barEntry.value, barEntry.maximumValue, statisticBarColors[index]);
}

// ---------- Radar chart: geometry ----------

// Angle of a corner of the hexagon: corner 0 at the top (HP), then clockwise
function radarCornerAngleInRadians(cornerIndex) {
  return ((-90 + cornerIndex * radarAngleBetweenCornersInDegrees) * Math.PI) / 180;
}

// Point on the hexagon; distanceRatio 1 is the outer edge, 0 the center
function radarPointCoordinates(cornerIndex, distanceRatio) {
  let angleInRadians = radarCornerAngleInRadians(cornerIndex);
  return [
    radarCenterCoordinate + Math.cos(angleInRadians) * radarOuterRadius * distanceRatio,
    radarCenterCoordinate + Math.sin(angleInRadians) * radarOuterRadius * distanceRatio,
  ];
}

// One value per corner, each as a fraction (0 to 1) of the way from the center to the edge
function radarPolygonPoints(distanceRatios) {
  return distanceRatios
    .map((distanceRatio, cornerIndex) =>
      radarPointCoordinates(cornerIndex, distanceRatio).map((coordinate) => coordinate.toFixed(1)).join(","),
    )
    .join(" ");
}

// ---------- Radar chart: drawing ----------

function radarChartHtml(statistics) {
  let distanceRatios = statistics.map((statistic) => Math.min(1, statistic.value / radarMaximumValue));
  return /* html */ `
    <svg class="radar" viewBox="0 0 ${radarViewBoxSize} ${radarViewBoxSize}" role="img" aria-label="Base statistics as a radar chart">
      ${radarRingsHtml(statistics)}${radarAxesHtml(statistics)}
      <polygon class="radar-shape" points="${radarPolygonPoints(distanceRatios)}"></polygon>
      ${radarDotsHtml(distanceRatios)}${radarLabelsHtml(statistics)}
    </svg>
  `;
}

function radarRingsHtml(statistics) {
  return radarRingDistanceRatios
    .map((ringDistanceRatio) => statistics.map(() => ringDistanceRatio))
    .map((ringDistanceRatios) => `<polygon class="radar-ring" points="${radarPolygonPoints(ringDistanceRatios)}"></polygon>`)
    .join("");
}

function radarAxesHtml(statistics) {
  return statistics.map((_statistic, cornerIndex) => radarAxisHtml(cornerIndex)).join("");
}

function radarAxisHtml(cornerIndex) {
  let [outerPointX, outerPointY] = radarPointCoordinates(cornerIndex, 1);
  return `<line class="radar-axis" x1="${radarCenterCoordinate}" y1="${radarCenterCoordinate}" x2="${outerPointX.toFixed(1)}" y2="${outerPointY.toFixed(1)}"></line>`;
}

function radarDotsHtml(distanceRatios) {
  return distanceRatios.map(radarDotHtml).join("");
}

function radarDotHtml(distanceRatio, cornerIndex) {
  let [dotX, dotY] = radarPointCoordinates(cornerIndex, distanceRatio);
  return `<circle class="radar-dot" cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="3.5"></circle>`;
}

function radarLabelsHtml(statistics) {
  return statistics.map(radarLabelHtml).join("");
}

// Name and value of the statistic next to the corner
function radarLabelHtml(statistic, cornerIndex) {
  let [labelX, labelY] = radarPointCoordinates(cornerIndex, 1.28);
  let textAnchor = radarTextAnchor(cornerIndex);
  return /* html */ `
    <text class="radar-label" x="${labelX.toFixed(1)}" y="${(labelY - 1).toFixed(1)}" text-anchor="${textAnchor}">${radarCornerLabels[statistic.apiName] || statistic.displayName}</text>
    <text class="radar-value" x="${labelX.toFixed(1)}" y="${(labelY + 12).toFixed(1)}" text-anchor="${textAnchor}">${statistic.value}</text>
  `;
}

// Right of the center the text sits to the right of the corner, left of it to the left, top and bottom centered
function radarTextAnchor(cornerIndex) {
  let horizontalDirection = Math.cos(radarCornerAngleInRadians(cornerIndex));
  if (horizontalDirection > 0.3) return "start";
  if (horizontalDirection < -0.3) return "end";
  return "middle";
}
