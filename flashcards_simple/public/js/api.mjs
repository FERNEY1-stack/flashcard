// Todas las peticiones al servidor se hacen desde este archivo.
// La URL base es relativa: funciona igual en local y en produccion porque
// Express entrega la interfaz y la API desde el mismo servicio.
const API_URL = "/api/cards";

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
  } catch (error) {
    // fetch solo falla aqui por problemas de red (servidor apagado, sin internet).
    throw new Error("No se pudo conectar con el servidor.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Ocurrio un error al comunicarse con el servidor.");
  }
  return data;
}

export function getCards() {
  return request(API_URL);
}

export function addCard(card) {
  return request(API_URL, {
    method: "POST",
    body: JSON.stringify(card)
  });
}

export function editCard(id, card) {
  return request(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(card)
  });
}

export function removeCard(id) {
  return request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
