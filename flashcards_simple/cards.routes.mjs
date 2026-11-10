import { Router } from "express";
import { getCards, createCard, updateCard, deleteCard } from "./cards.controller.mjs";

const router = Router();

// Rutas para consultar y administrar las tarjetas.
router.get("/", getCards);
router.post("/", createCard);
router.put("/:id", updateCard);
router.delete("/:id", deleteCard);

export default router;
