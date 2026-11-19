const db = require("../config/database");
const fs = require("node:fs/promises");

async function eliminarImagen(file) {
    if (!file) {
        return;
    }

    try {
        await fs.unlink(file.path);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("No se pudo eliminar una imagen sin usar.", error);
        }
    }
}

exports.listarProductos = async (_req, res) => {
    try {
        const [productos] = await db.query(
            `SELECT 
                p.id,
                p.nombre,
                p.precio,
                c.nombre AS categoria,
                p.imagen
             FROM productos p
             INNER JOIN categorias c 
                ON c.id = p.categoria_id
             WHERE p.estado = TRUE AND c.estado = TRUE
             ORDER BY p.id`
        );

        res.json(productos);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

exports.crearProducto = async (req, res) => {
    const body = req.body || {};
    const nombre = typeof body.nombre === "string"
        ? body.nombre.trim()
        : "";
    const precio = typeof body.precio === "string" && !body.precio.trim()
        ? Number.NaN
        : Number(body.precio);
    const categoriaId = Number(body.categoria_id);

    if (!nombre || nombre.length > 150) {
        await eliminarImagen(req.file);
        return res.status(400).json({
            mensaje: "El nombre es obligatorio y no debe superar 150 caracteres"
        });
    }

    if (!Number.isFinite(precio) || precio < 0) {
        await eliminarImagen(req.file);
        return res.status(400).json({
            mensaje: "El precio debe ser un número mayor o igual que cero"
        });
    }

    if (!Number.isSafeInteger(categoriaId) || categoriaId <= 0) {
        await eliminarImagen(req.file);
        return res.status(400).json({
            mensaje: "La categoría debe ser un identificador entero positivo"
        });
    }

    if (!req.file) {
        return res.status(400).json({
            mensaje: "Debes adjuntar una imagen en el campo imagen"
        });
    }

    try {
        const [categorias] = await db.query(
            "SELECT id FROM categorias WHERE id = ? AND estado = TRUE",
            [categoriaId]
        );

        if (categorias.length === 0) {
            await eliminarImagen(req.file);
            return res.status(400).json({
                mensaje: "La categoría no existe o está inactiva"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO productos (nombre, precio, categoria_id, imagen)
             VALUES (?, ?, ?, ?)`,
            [nombre, precio, categoriaId, req.file.filename]
        );

        res.status(201).json({
            mensaje: "Producto creado correctamente",
            producto_id: resultado.insertId,
            nombre,
            precio,
            categoria_id: categoriaId,
            imagen: req.file.filename
        });
    } catch (error) {
        await eliminarImagen(req.file);
        console.error("No se pudo crear el producto.", error);
        res.status(500).json({
            mensaje: "No se pudo guardar el producto"
        });
    }
};


