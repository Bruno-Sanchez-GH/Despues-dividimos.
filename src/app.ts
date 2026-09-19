// Importamos Express
import express from "express";
import router from "./routes/index.js";
import { fileURLToPath } from "node:url";
// Creamos nuestra aplicación Express
const app = express();
// Origen opcional para un frontend desplegado por separado.
app.use((req, res, next) => {
    const origin = process.env.FRONTEND_ORIGIN;
    if (origin && req.get("origin") === origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
        if (req.method === "OPTIONS") { res.sendStatus(204); return; }
    }
    next();
});
// Ejemplo de middleware
app.use(express.json());
app.use("/api/v1",router);

// Ejemplo de endpoint
app.get("/health", (req, res) => {
    res.json({
        message: "Example API is working"
    });
});

// API desconocida: conservar una respuesta JSON, sin devolver el frontend.
app.use("/api", (req, res) => { res.status(404).json({ message: "Endpoint no encontrado" }); });
const frontendPath = fileURLToPath(new URL("../frontend/dist/", import.meta.url));
app.use(express.static(frontendPath));
app.get("/{*path}", (req, res, next) => {
    if (!req.accepts("html")) { next(); return; }
    res.sendFile("index.html", { root: frontendPath }, (error) => { if (error) next(error); });
});

// Exportamos la aplicación
export default app;
