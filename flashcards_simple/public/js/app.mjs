import { getCards, addCard, editCard, removeCard } from "./api.mjs";
import { gradeCard, isDue, today } from "./cards.mjs";
import { saveCardsCache, getCardsCache, getTheme, saveTheme, getSessionProgress, addSessionProgress, clearLocalData } from "./storage.mjs";
import { renderStats, renderStudy, renderLibrary, showNotice } from "./ui.mjs";

// Elementos principales de la pagina.
const $ = (id) => document.getElementById(id);
const elements = {
  total: $("stat-total"),
  due: $("stat-due"),
  mastered: $("stat-mastered"),
  progress: $("stat-progress")
};

let cards = [];
let currentCard = null;
let showingAnswer = false;
let editModal = null;
const notice = $("notice");

function updateView(viewName) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  document.querySelectorAll(".app-view").forEach((view) => {
    view.classList.toggle("d-none", view.id !== `view-${viewName}`);
  });

  if (viewName === "library") renderLibraryView();
  if (viewName === "study") renderAll();
  $("mainNav").classList.remove("show");
}

function renderLibraryView() {
  renderLibrary($("card-list"), cards, $("filter-select").value, $("search-input").value);
  $("library-count").textContent = `${cards.length} tarjetas`;
}

function renderAll() {
  const dueCards = cards.filter(isDue);
  if (!currentCard || !isDue(currentCard)) {
    currentCard = dueCards[0] || null;
    showingAnswer = false;
  }

  renderStudy($("study-area"), $("due-count"), $("box-label"), cards, currentCard, showingAnswer);
  renderStats(cards, elements, getSessionProgress());
  $("library-count").textContent = `${cards.length} tarjetas`;
}

function saveLocalCopy() {
  try {
    saveCardsCache(cards);
  } catch (error) {
    showNotice(notice, "No se pudo guardar la copia local del navegador.", "warning");
  }
}

// Cambia el tema en pantalla (sin guardarlo).
function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  $("theme-toggle").textContent = theme === "dark" ? "☀ Tema" : "☾ Tema";
}

function setTheme(theme) {
  applyTheme(theme);
  saveTheme(theme);
}

async function loadCardsFromServer() {
  try {
    cards = await getCards();
    saveLocalCopy();
  } catch (error) {
    cards = getCardsCache();
    showNotice(notice, `${error.message} Se muestran los datos guardados en este navegador.`, "warning");
  }
  $("loading").classList.add("d-none");
  renderAll();
}

// Navegacion: un solo evento controla los botones del menu.
$("mainNav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (button) updateView(button.dataset.view);
});

$("theme-toggle").addEventListener("click", () => {
  const newTheme = document.documentElement.dataset.bsTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
});

// Los botones de estudiar se controlan con delegacion de eventos.
$("study-area").addEventListener("click", (event) => {
  if (event.target.id === "reveal-button" || event.target.closest(".flashcard")) {
    if (!currentCard) return;
    showingAnswer = true;
    renderAll();
    return;
  }

  const resultButton = event.target.closest("[data-result]");
  if (resultButton && currentCard) reviewCurrentCard(resultButton.dataset.result);
});

$("study-area").addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("flashcard")) {
    event.preventDefault();
    showingAnswer = true;
    renderAll();
  }
});

async function reviewCurrentCard(result) {
  gradeCard(currentCard, result);
  try {
    const updatedCard = await editCard(currentCard.id, {
      front: currentCard.front,
      back: currentCard.back,
      box: currentCard.box,
      next: currentCard.next
    });
    cards = cards.map((card) => card.id === updatedCard.id ? updatedCard : card);
    saveLocalCopy();
    addSessionProgress();
    currentCard = null;
    showingAnswer = false;
    renderAll();
    showNotice(notice, "Repaso registrado y guardado correctamente.");
  } catch (error) {
    showNotice(notice, error.message, "danger");
  }
}

// Crear tarjeta: primero se valida en el navegador y despues en el servidor.
$("add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  const front = $("input-front").value.trim();
  const back = $("input-back").value.trim();
  if (!front || !back) {
    showNotice(notice, "Completa la pregunta y la respuesta.", "danger");
    return;
  }

  try {
    const newCard = await addCard({ front, back, next: today() });
    cards.push(newCard);
    saveLocalCopy();
    form.reset();
    form.classList.remove("was-validated");
    renderAll();
    updateView("study");
    showNotice(notice, "Tarjeta creada correctamente.");
  } catch (error) {
    showNotice(notice, error.message, "danger");
  }
});

// Borra solo lo guardado en este navegador (las tarjetas del servidor no se tocan).
$("clear-data").addEventListener("click", () => {
  if (!window.confirm("¿Borrar el tema, la copia local y el progreso de esta sesión?")) return;
  clearLocalData();
  applyTheme("light");
  renderAll();
  showNotice(notice, "Se borraron los datos guardados en este navegador.");
});

$("search-input").addEventListener("input", renderLibraryView);
$("filter-select").addEventListener("change", renderLibraryView);

// Editar o borrar tarjetas desde la tabla usando delegacion de eventos.
$("card-list").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) openEditForm(editButton.dataset.edit);
  if (deleteButton) deleteCardFromServer(deleteButton.dataset.delete);
});

function openEditForm(id) {
  const card = cards.find((item) => item.id === id);
  if (!card) return;

  $("edit-id").value = card.id;
  $("edit-front").value = card.front;
  $("edit-back").value = card.back;
  if (window.bootstrap?.Modal) {
    editModal = editModal || new bootstrap.Modal($("edit-modal"));
    editModal.show();
  }
}

async function deleteCardFromServer(id) {
  const confirmed = window.confirm("¿Deseas borrar esta tarjeta?");
  if (!confirmed) return;

  try {
    await removeCard(id);
    cards = cards.filter((card) => card.id !== id);
    if (currentCard?.id === id) currentCard = null;
    saveLocalCopy();
    renderAll();
    renderLibraryView();
    showNotice(notice, "Tarjeta eliminada correctamente.");
  } catch (error) {
    showNotice(notice, error.message, "danger");
  }
}

$("edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("edit-id").value;
  const front = $("edit-front").value.trim();
  const back = $("edit-back").value.trim();

  if (!front || !back) {
    showNotice(notice, "Completa la pregunta y la respuesta.", "danger");
    return;
  }

  try {
    const updatedCard = await editCard(id, { front, back });
    cards = cards.map((card) => card.id === id ? updatedCard : card);
    saveLocalCopy();
    renderAll();
    renderLibraryView();
    editModal?.hide();
    showNotice(notice, "Cambios guardados correctamente.");
  } catch (error) {
    showNotice(notice, error.message, "danger");
  }
});

// Inicio de la aplicacion.
setTheme(getTheme());
loadCardsFromServer();
