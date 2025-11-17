const axios = require("axios");

const TELEGRAM_TOKEN = "8552533040:AAE-1xR3O0otEoSvSZBkPeOMlZ7j7oWrFRI";
const ADMIN_CHAT_ID = "5273135252";

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: ADMIN_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });
    } catch (err) {
        console.error("Erro ao enviar notificação Telegram:", err.message);
    }
}

module.exports = { sendTelegramMessage };
