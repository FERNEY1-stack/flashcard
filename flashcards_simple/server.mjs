import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cardsRoutes from "./cards.routes.mjs";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const currentFolder = path.dirname(fileURLToPath(import.meta.url));
// Solo se publica la carpeta "public": .env, datos y codigo del servidor quedan fuera.
const publicFolder = path.join(currentFolder, "public");

// CORS: solo los origenes listados en FRONTEND_URL (por defecto, el propio servidor local).
const allowedOrigins = (process.env.FRONTEND_URL || `http://localhost:${PORT}`)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(compression()); // Optimizacion 1: respuestas comprimidas con gzip.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin))
}));
app.use(express.json({ limit: "20kb" }));

// Rutas de la API.
app.use("/api/cards", cardsRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Servidor activo." });
});
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Ruta de la API no encontrada." });
});

// Optimizacion 2: cache del navegador para CSS y JS; el HTML siempre se revalida.
app.use(express.static(publicFolder, {
  maxAge: "1d",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  }
}));
app.get("*", (req, res) => {
  res.sendFile(path.join(publicFolder, "index.html"));
});

// Errores generales (por ejemplo, un JSON mal formado) siempre responden en JSON.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "El cuerpo de la peticion no es un JSON valido." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "La peticion es demasiado grande." });
  }
  console.error(error);
  res.status(500).json({ message: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
