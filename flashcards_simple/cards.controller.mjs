import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCard, isValidDate } from "./validation.mjs";

const defaultFile = fileURLToPath(new URL("./data/cards.json", import.meta.url));
const dataFile = process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : defaultFile;

// Cola sencilla: evita que dos peticiones escriban el archivo al mismo tiempo.
let queue = Promise.resolve();
function runInOrder(task) {
  const result = queue.then(task);
  queue = result.catch(() => {});
  return result;
}

// Lee las tarjetas guardadas; si el archivo aun no existe, empieza con una lista vacia.
async function readCards() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Guarda la lista actualizada en el archivo JSON.
async function writeCards(cards) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(cards, null, 2));
}

export async function getCards(req, res) {
  try {
    const cards = await readCards();
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: "No se pudieron cargar las tarjetas." });
  }
}

export async function createCard(req, res) {
  const { front, back, next } = req.body ?? {};
  const errorMessage = validateCard(front, back);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const newCard = await runInOrder(async () => {
      const cards = await readCards();
      const card = {
        id: randomUUID(),
        front: front.trim(),
        back: back.trim(),
        box: 1,
        // La fecha la envia el navegador (hora local del estudiante); si no, la del servidor.
        next: isValidDate(next) ? next : new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      };
      cards.push(card);
      await writeCards(cards);
      return card;
    });
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ message: "No se pudo guardar la tarjeta." });
  }
}

export async function updateCard(req, res) {
  const { front, back, box, next } = req.body ?? {};
  const errorMessage = validateCard(front, back);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const updatedCard = await runInOrder(async () => {
      const cards = await readCards();
      const card = cards.find((item) => item.id === req.params.id);
      if (!card) return null;

      card.front = front.trim();
      card.back = back.trim();
      if (Number.isInteger(box) && box >= 1 && box <= 5) card.box = box;
      if (isValidDate(next)) card.next = next;
      await writeCards(cards);
      return card;
    });

    if (!updatedCard) {
      return res.status(404).json({ message: "Tarjeta no encontrada." });
    }
    res.status(200).json(updatedCard);
  } catch (error) {
    res.status(500).json({ message: "No se pudo actualizar la tarjeta." });
  }
}

export async function deleteCard(req, res) {
  try {
    const deleted = await runInOrder(async () => {
      const cards = await readCards();
      if (!cards.some((item) => item.id === req.params.id)) return false;
      await writeCards(cards.filter((item) => item.id !== req.params.id));
      return true;
    });

    if (!deleted) {
      return res.status(404).json({ message: "Tarjeta no encontrada." });
    }
    res.status(200).json({ message: "Tarjeta eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ message: "No se pudo eliminar la tarjeta." });
  }
}
