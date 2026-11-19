const express = require("express");
const router = express.Router();

const upload = require("../config/upload");
const productoController = require("../controllers/productoController");

router.get("/", productoController.listarProductos);

router.post(
    "/",
    (req, res, next) => {
        upload.single("imagen")(req, res, (error) => {
            if (error) {
                const mensaje = error.code === "LIMIT_FILE_SIZE"
                    ? "La imagen no puede superar los 5 MB"
                    : error.message;

                return res.status(400).json({ mensaje });
            }

            next();
        });
    },
    productoController.crearProducto
);

module.exports = router;

