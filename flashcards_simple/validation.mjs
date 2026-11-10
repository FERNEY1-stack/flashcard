// Revisa que los datos de una tarjeta tengan el formato esperado.
export function validateCard(front, back) {
  if (typeof front !== "string" || typeof back !== "string") {
    return "La pregunta y la respuesta deben ser texto.";
  }

  if (!front.trim() || !back.trim()) {
    return "La pregunta y la respuesta son obligatorias.";
  }

  if (front.trim().length > 300 || back.trim().length > 600) {
    return "La pregunta o la respuesta superan el limite permitido.";
  }

  return null;
}

// Fecha en formato AAAA-MM-DD (la usa el repaso espaciado).
export function isValidDate(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value));
}
