const db = require("../config/database");

// 1. Crear carrito
exports.crearCarrito = async (req, res) => {
    try {
        const [result] = await db.query(
            "INSERT INTO carritos () VALUES ()"
        );

        res.status(201).json({
            mensaje: "Carrito creado correctamente",
            carrito_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Consultar carrito y sus productos
exports.obtenerCarrito = async (req, res) => {
    try {
        const { id } = req.params;

        const [carritos] = await db.query(
            "SELECT * FROM carritos WHERE id = ?",
            [id]
        );

        if (carritos.length === 0) {
            return res.status(404).json({
                mensaje: "Carrito no encontrado"
            });
        }

        const [productos] = await db.query(
            `SELECT
                dc.id AS detalle_id,
                p.id AS producto_id,
                p.nombre,
                p.imagen,
                dc.precio_unitario,
                dc.cantidad,
                (dc.precio_unitario * dc.cantidad) AS subtotal
             FROM detalle_carrito dc
             INNER JOIN productos p
                ON dc.producto_id = p.id
             WHERE dc.carrito_id = ?`,
            [id]
        );

        const total = productos.reduce(
            (suma, producto) =>
                suma + Number(producto.subtotal),
            0
        );

        res.json({
            carrito_id: Number(id),
            productos,
            cantidad_productos: productos.length,
            total: total.toFixed(2)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Agregar producto al carrito
exports.agregarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { producto_id, cantidad } = req.body;

        if (
            !Number.isInteger(Number(producto_id)) ||
            !Number.isInteger(Number(cantidad)) ||
            Number(producto_id) <= 0 ||
            Number(cantidad) <= 0
        ) {
            return res.status(400).json({
                mensaje: "Producto y cantidad deben ser enteros positivos"
            });
        }

        const [carritos] = await db.query(
            "SELECT id FROM carritos WHERE id = ? AND estado = 'activo'",
            [id]
        );

        if (carritos.length === 0) {
            return res.status(404).json({
                mensaje: "Carrito no encontrado o no está activo"
            });
        }

        const [productos] = await db.query(
            "SELECT id, precio FROM productos WHERE id = ? AND estado = TRUE",
            [producto_id]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                mensaje: "Producto no encontrado o inactivo"
            });
        }

        await db.query(
            `INSERT INTO detalle_carrito
                (carrito_id, producto_id, cantidad, precio_unitario)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                cantidad = cantidad + VALUES(cantidad)`,
            [
                id,
                producto_id,
                cantidad,
                productos[0].precio
            ]
        );

        res.status(201).json({
            mensaje: "Producto agregado al carrito"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Actualizar cantidad de un producto
exports.actualizarCantidad = async (req, res) => {
    try {
        const { id, detalle_id } = req.params;
        const { cantidad } = req.body;

        if (
            !Number.isInteger(Number(cantidad)) ||
            Number(cantidad) <= 0
        ) {
            return res.status(400).json({
                mensaje: "La cantidad debe ser un entero mayor que cero"
            });
        }

        const [result] = await db.query(
            `UPDATE detalle_carrito
             SET cantidad = ?
             WHERE id = ? AND carrito_id = ?`,
            [cantidad, detalle_id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Detalle del carrito no encontrado"
            });
        }

        res.json({
            mensaje: "Cantidad actualizada correctamente"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Eliminar un producto del carrito
exports.eliminarProducto = async (req, res) => {
    try {
        const { id, detalle_id } = req.params;

        const [result] = await db.query(
            `DELETE FROM detalle_carrito
             WHERE id = ? AND carrito_id = ?`,
            [detalle_id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Producto no encontrado en el carrito"
            });
        }

        res.json({
            mensaje: "Producto eliminado del carrito"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. Vaciar carrito
exports.vaciarCarrito = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `DELETE FROM detalle_carrito
             WHERE carrito_id = ?`,
            [id]
        );

        res.json({
            mensaje: "Carrito vaciado correctamente",
            productos_eliminados: result.affectedRows
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

