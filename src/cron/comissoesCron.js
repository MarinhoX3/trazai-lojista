const cron = require("node-cron");
const db = require("../config/db");
const { sendTelegramMessage } = require("../utils/telegram");

cron.schedule("0 8 * * *", async () => {
    console.log("🔍 Verificando lojas com comissões vencidas...");

    try {
        const [rows] = await db.query(`
            SELECT 
                L.id,
                L.nome_loja,
                L.bloqueada,
                MIN(P.data_hora) AS data_primeiro_pendente,
                TIMESTAMPDIFF(DAY, MIN(P.data_hora), NOW()) AS dias
            FROM Pedidos P
            JOIN Lojas L ON L.id = P.id_loja
            WHERE P.comissao_paga = 0
              AND P.status = 'Finalizado'
              AND P.stripe_payment_intent_id IS NULL
            GROUP BY L.id
        `);

        for (const loja of rows) {
            if (loja.dias >= 30 && loja.bloqueada == 0) {
                await db.query(
                    "UPDATE Lojas SET bloqueada = 1 WHERE id = ?",
                    [loja.id]
                );

                await sendTelegramMessage(
                    `🚨 <b>Loja BLOQUEADA</b>\n\n🏪 Loja: <b>${loja.nome_loja}</b>\n⏳ Atraso: <b>${loja.dias} dias</b>\n\nA loja foi automaticamente bloqueada.`
                );
            }

            if (loja.dias >= 20 && loja.dias < 30) {
                await sendTelegramMessage(
                    `⚠️ <b>Loja prestes a ficar vencida</b>\n\n🏪 Loja: <b>${loja.nome_loja}</b>\n⏳ Atraso: <b>${loja.dias} dias</b>\n\nSe passar de 30 dias será bloqueada.`
                );
            }
        }

        console.log("✔ Verificação diária concluída.");
    } catch (error) {
        console.error("Erro no CRON:", error);
    }
});
