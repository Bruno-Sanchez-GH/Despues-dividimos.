// Importamos una aplicación creada en otro archivo
import app from "./app.js";

// Elegimos un puerto
const PORT = 4000;

// Iniciamos el servidor
app.listen(PORT, () => {
    console.log(`Example server running on port ${PORT}`);
});