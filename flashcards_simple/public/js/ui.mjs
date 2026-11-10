import { isDue, getStats } from "./cards.mjs";

// Crea elementos HTML usando textContent para evitar insertar HTML del usuario.
function createElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function showNotice(element, message, type = "success") {
  element.textContent = message;
  element.className = `alert alert-${type}`;
  element.classList.remove("d-none");
}

export function renderStats(cards, elements, progress) {
  const stats = getStats(cards);
  elements.total.textContent = stats.total;
  elements.due.textContent = stats.due;
  elements.mastered.textContent = stats.mastered;
  const percentage = stats.total ? Math.round((Math.min(progress, stats.total) / stats.total) * 100) : 0;
  elements.progress.textContent = `${percentage}%`;
}

export function renderStudy(area, dueCount, boxLabel, cards, current, showingBack) {
  const dueCards = cards.filter(isDue);
  dueCount.textContent = `${dueCards.length} pendientes`;
  area.replaceChildren();

  if (!cards.length || !current) {
    const message = cards.length ? "¡Terminaste tus repasos por hoy!" : "Crea tu primera tarjeta para comenzar.";
    area.append(createElement("div", "empty-state", message));
    boxLabel.textContent = cards.length ? "Completado" : "Sin nivel";
    return;
  }

  boxLabel.textContent = `Nivel ${current.box} de 5`;
  const content = showingBack ? current.back : current.front;
  const flashcard = createElement("div", `flashcard${showingBack ? " answer" : ""}`, content);
  flashcard.tabIndex = 0;
  flashcard.setAttribute("role", "button");
  flashcard.setAttribute("aria-expanded", String(showingBack));
  flashcard.setAttribute("aria-label", "Tarjeta de estudio. Presiona Enter para mostrar la respuesta.");
  area.append(flashcard);

  if (!showingBack) {
    const revealButton = createElement("button", "btn btn-primary mt-3", "Mostrar respuesta");
    revealButton.type = "button";
    revealButton.id = "reveal-button";
    area.append(revealButton);
    return;
  }

  area.append(createElement("p", "text-secondary small mt-3 mb-2", "¿Qué tan bien recordaste la respuesta?"));
  const actions = createElement("div", "grade-actions");
  const options = [
    ["Otra vez", "again", "btn-outline-danger"],
    ["Difícil", "hard", "btn-outline-warning"],
    ["Bien", "good", "btn-outline-success"],
    ["Fácil", "easy", "btn-outline-primary"]
  ];

  options.forEach(([label, result, style]) => {
    const button = createElement("button", `btn ${style}`, label);
    button.type = "button";
    button.dataset.result = result;
    actions.append(button);
  });
  area.append(actions);
}

export function renderLibrary(list, cards, filter, search) {
  list.replaceChildren();
  const term = search.trim().toLowerCase();
  const filteredCards = cards.filter((card) => {
    const matchesText = `${card.front} ${card.back}`.toLowerCase().includes(term);
    const matchesFilter = filter === "due" ? isDue(card) : filter === "mastered" ? card.box >= 5 : true;
    return matchesText && matchesFilter;
  });

  if (!filteredCards.length) {
    const row = createElement("tr");
    const cell = createElement("td", "text-center text-secondary py-4", "No se encontraron tarjetas.");
    cell.colSpan = 4;
    row.append(cell);
    list.append(row);
    return;
  }

  filteredCards.forEach((card) => {
    const row = createElement("tr");
    row.append(createElement("td", "fw-semibold", card.front));
    row.append(createElement("td", "", `Nivel ${card.box}/5`));
    row.append(createElement("td", "small text-secondary", card.next));

    const actions = createElement("td", "text-end");
    const editButton = createElement("button", "btn btn-sm btn-outline-primary me-1", "Editar");
    editButton.type = "button";
    editButton.dataset.edit = card.id;
    editButton.setAttribute("aria-label", `Editar ${card.front}`);

    const deleteButton = createElement("button", "btn btn-sm btn-outline-danger", "Borrar");
    deleteButton.type = "button";
    deleteButton.dataset.delete = card.id;
    deleteButton.setAttribute("aria-label", `Borrar ${card.front}`);
    actions.append(editButton, deleteButton);
    row.append(actions);
    list.append(row);
  });
}
