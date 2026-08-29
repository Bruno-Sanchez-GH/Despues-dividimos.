// Importamos Express
import express from "express";

// Creamos nuestra aplicación Express
const app = express();

// Ejemplo de middleware
app.use(express.json());

// Ejemplo de endpoint
app.get("/health", (req, res) => {
    res.json({
        message: "Example API is working"
    });
});

// Exportamos la aplicación
export default app;