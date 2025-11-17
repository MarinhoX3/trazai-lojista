// src/middleware/checkLojaBloqueada.js
const db = require('../config/database');

async function checkLojaBloqueada(req, res, next) {
    try {
        // Loja pode vir pelo body ou param
        const lojaId = req.body.id_loja || req.params.id_loja;

        if (!lojaId) {
            return res.status(400).json({ message: 'ID da loja não informado.' });
        }

        const [rows] = await db.query(
            "SELECT bloqueada FROM Lojas WHERE id = ?",
            [lojaId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Loja não encontrada." });
        }

        if (rows[0].bloqueada === 1) {
            return res.status(403).json({
                message:
                    "Loja bloqueada por atraso de pagamento. Regularize para continuar recebendo pedidos."
            });
        }

        next(); // segue para o controller

    } catch (error) {
        console.error("Erro checkLojaBloqueada:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
}

module.exports = checkLojaBloqueada;
