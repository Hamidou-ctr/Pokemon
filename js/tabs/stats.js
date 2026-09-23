registerTab({
  name: "Base-Stats",
  label: "Stats",
  render: baseStatisticsHtml,
});

const maximumStatisticValue = 255; // bei diesem Wert ist der Balken einer Statistik voll
const maximumTotalValue = 780; // bei diesem Wert ist der Total-Balken voll

// Rand- und Füllfarbe je Balken: erst die sechs Statistiken, zuletzt die Summe (Total)
const statisticColors = [
  { border: "#ff7793", fill: "#ffe1e6" }, // hp
  { border: "#ffc791", fill: "#ffecdb" }, // attack
  { border: "#ffd984", fill: "#fff4df" }, // defense
  { border: "#66c8c8", fill: "#def2f2" }, // special-attack
  { border: "#53aeee", fill: "#d9ecfb" }, // special-defense
  { border: "#b087ff", fill: "#ebe0ff" }, // speed
  { border: "#ff4500", fill: "#ffc6b0" }, // total
];

function baseStatisticsHtml(pokemon) {
  let statistics = pokemon.stats.map((entry) => ({
    name: entry.stat.name === "hp" ? "HP" : formatName(entry.stat.name),
    value: entry.base_stat,
    maximum: maximumStatisticValue,
  }));
  let total = statistics.reduce((sum, statistic) => sum + statistic.value, 0);
  statistics.push({ name: "Total", value: total, maximum: maximumTotalValue });
  return /* html */ `
    <div class="bar-list">
      ${statistics
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
  `;
}
