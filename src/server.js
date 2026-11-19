const express = require("express");
const cors = require("cors");
require("dotenv").config();

const path = require("path");

const carritoRoutes = require("./routes/carritoRoutes");
const productoRoutes = require("./routes/productoRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
    res.json({
        mensaje: "API REST - Tienda Virtual",
        estado: "Servidor funcionando"
    });
});

// Habilitar acceso público a las imágenes
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// Rutas del carrito
app.use("/api/carritos", carritoRoutes);
app.use("/api/productos", productoRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
