// El navegador guarda preferencias y una copia de las tarjetas recibidas.
const CARDS_KEY = "flashcards_cache_v1";
const THEME_KEY = "flashcards_theme_v1";
const SESSION_KEY = "flashcards_session_v1";

export function saveCardsCache(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function getCardsCache() {
  try {
    const savedCards = localStorage.getItem(CARDS_KEY);
    return savedCards ? JSON.parse(savedCards) : [];
  } catch (error) {
    return [];
  }
}

export function getTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  return theme === "dark" ? "dark" : "light";
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getSessionProgress() {
  return Number(sessionStorage.getItem(SESSION_KEY) || 0);
}

export function addSessionProgress() {
  const progress = getSessionProgress() + 1;
  sessionStorage.setItem(SESSION_KEY, String(progress));
  return progress;
}

// Permite al usuario borrar todo lo que esta app guardo en su navegador.
export function clearLocalData() {
  localStorage.removeItem(CARDS_KEY);
  localStorage.removeItem(THEME_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
