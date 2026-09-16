// Importamos Express
import express from "express";
import router from "./routes/index.js";
// Creamos nuestra aplicación Express
const app = express();
// Ejemplo de middleware
app.use(express.json());
app.use("/api/v1",router);

// Ejemplo de endpoint
app.get("/health", (req, res) => {
    res.json({
        message: "Example API is working"
    });
});

// Exportamos la aplicación
export default app;