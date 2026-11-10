// Reglas sencillas para organizar los repasos de las tarjetas.
const INTERVALS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

// Fecha local en formato AAAA-MM-DD (toISOString usaria UTC y en Colombia
// cambiaria de dia a las 7:00 p. m.).
function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function today() {
  return formatDate(new Date());
}

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function isDue(card) {
  return card.next <= today();
}

export function gradeCard(card, result) {
  if (result === "again") card.box = 1;
  if (result === "hard") card.box = Math.max(1, card.box);
  if (result === "good") card.box = Math.min(5, card.box + 1);
  if (result === "easy") card.box = Math.min(5, card.box + 2);

  const days = result === "hard" ? Math.max(1, INTERVALS[card.box]) : INTERVALS[card.box];
  card.next = dateAfter(days);
  return card;
}

export function getStats(cards) {
  return {
    total: cards.length,
    due: cards.filter(isDue).length,
    mastered: cards.filter((card) => card.box >= 5).length
  };
}
