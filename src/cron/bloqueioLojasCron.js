// src/cron/bloqueioLojasCron.js
const cron = require("node-cron");
const db = require("../config/database");

console.log("⏳ Cron de bloqueio de lojas carregado...");

// Rodar todo dia às 03h da manhã
cron.schedule("0 3 * * *", async () => {
    console.log("🔍 Verificando lojas com comissão atrasada...");

    try {
        const [rows] = await db.query(`
            SELECT
                l.id,
                l.nome_loja,
                l.bloqueada,
                MIN(p.data_hora) AS primeira_data_pendente
            FROM Lojas l
            JOIN Pedidos p ON p.id_loja = l.id
            WHERE p.comissao_paga = 0
              AND p.status = 'Finalizado'
            GROUP BY l.id
        `);

        if (rows.length === 0) {
            console.log("👍 Nenhuma loja com comissão pendente.");
            return;
        }

        for (const loja of rows) {
            const primeira = new Date(loja.primeira_data_pendente);
            const hoje = new Date();

            const diffDias = Math.floor((hoje - primeira) / (1000 * 60 * 60 * 24));

            console.log(`📌 Loja ${loja.nome_loja} - ${diffDias} dias de atraso`);

            if (diffDias >= 7 && loja.bloqueada == 0) {
                console.log(`⛔ Bloqueando loja ${loja.nome_loja}`);

                await db.query(
                    "UPDATE Lojas SET bloqueada = 1 WHERE id = ?",
                    [loja.id]
                );
            }
        }

        console.log("✔ Cron finalizado.");

    } catch (err) {
        console.error("❌ Erro no cron de bloqueio:", err);
    }
});
