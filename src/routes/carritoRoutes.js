const express = require("express");
const router = express.Router();

const carritoController = require("../controllers/carritoController");
const compraController = require("../controllers/compraController");

// Crear carrito
router.post("/", carritoController.crearCarrito);

// Consultar carrito
router.get("/:id", carritoController.obtenerCarrito);

// Agregar producto
router.post("/:id/productos", carritoController.agregarProducto);

// Actualizar cantidad
router.put("/:id/productos/:detalle_id", carritoController.actualizarCantidad);

// Eliminar producto
router.delete("/:id/productos/:detalle_id", carritoController.eliminarProducto);

// Vaciar carrito
router.delete("/:id", carritoController.vaciarCarrito);

// Registrar compra
router.post("/:id/compras", compraController.finalizarCompra);

module.exports = router;

