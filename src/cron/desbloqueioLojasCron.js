const cron = require("node-cron");
const db = require("../config/database");

console.log("🔓 Cron de desbloqueio de lojas carregado...");

cron.schedule("* * * * *", async () => {  // executa a cada 1 minuto
    console.log("🔍 Verificando lojas para desbloqueio...");
    console.log("⏱️ Execução:", new Date().toISOString());

    try {
        const [lojas] = await db.query(`
            SELECT id, nome_loja 
            FROM Lojas 
            WHERE bloqueada = 1
        `);

        if (lojas.length === 0) {
            console.log("👍 Nenhuma loja bloqueada para analisar.");
            return;
        }

        for (const loja of lojas) {
            // Verifica se há pedidos pendentes
            const [pendencias] = await db.query(`
                SELECT COUNT(*) AS total
                FROM Pedidos
                WHERE id_loja = ?
                  AND comissao_paga = 0
                  AND status = 'Finalizado'
            `, [loja.id]);

            if (pendencias[0].total === 0) {
                console.log(`🔓 Desbloqueando loja: ${loja.nome_loja}`);

                await db.query(`
                    UPDATE Lojas
                    SET bloqueada = 0
                    WHERE id = ?
                `, [loja.id]);
            }
        }

        console.log("✔ Cron de desbloqueio finalizado.");

    } catch (error) {
        console.error("❌ Erro no cron de desbloqueio:", error);
    }
});
