const db = require("../config/database");

exports.finalizarCompra = async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: "El identificador del carrito no es válido"
        });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [carritos] = await connection.query(
            "SELECT id, estado FROM carritos WHERE id = ? FOR UPDATE",
            [id]
        );

        if (carritos.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                mensaje: "Carrito no encontrado"
            });
        }

        if (carritos[0].estado !== "activo") {
            await connection.rollback();
            return res.status(409).json({
                mensaje: "El carrito ya no está activo"
            });
        }

        const [productos] = await connection.query(
            `SELECT
                dc.producto_id,
                p.nombre AS nombre_producto,
                dc.cantidad,
                dc.precio_unitario
             FROM detalle_carrito dc
             INNER JOIN productos p ON p.id = dc.producto_id
             WHERE dc.carrito_id = ?
             FOR UPDATE`,
            [id]
        );

        if (productos.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                mensaje: "No se puede finalizar una compra con el carrito vacío"
            });
        }

        const [totales] = await connection.query(
            `SELECT SUM(cantidad * precio_unitario) AS total
             FROM detalle_carrito
             WHERE carrito_id = ?`,
            [id]
        );
        const total = Number(totales[0].total);

        const [pedido] = await connection.query(
            `INSERT INTO compras (carrito_id, total, estado)
             VALUES (?, ?, 'confirmada')`,
            [id, total]
        );

        const valoresDetalle = productos.flatMap((producto) => [
            pedido.insertId,
            producto.producto_id,
            producto.nombre_producto,
            producto.cantidad,
            producto.precio_unitario
        ]);
        const marcadores = productos
            .map(() => "(?, ?, ?, ?, ?)")
            .join(", ");

        await connection.query(
            `INSERT INTO detalle_compra
                (compra_id, producto_id, nombre_producto, cantidad, precio_unitario)
             VALUES ${marcadores}`,
            valoresDetalle
        );

        await connection.query(
            "UPDATE carritos SET estado = 'comprado' WHERE id = ?",
            [id]
        );

        const [nuevoCarrito] = await connection.query(
            "INSERT INTO carritos () VALUES ()"
        );

        await connection.commit();

        return res.status(201).json({
            mensaje: "Compra guardada correctamente",
            compra_id: pedido.insertId,
            total: total.toFixed(2),
            carrito_id: nuevoCarrito.insertId
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("No se pudo revertir la compra.", rollbackError);
            }
        }

        console.error("No se pudo guardar la compra.", error);
        return res.status(500).json({
            error: "No se pudo guardar la compra"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
