const fetch = require('node-fetch');

class TelegramBot {
    constructor() {
        this.tokens = {
            'main': '8373706621:AAFTOCrsNuSuov9pBzj1C1xk7vvC3zo01Nk',
            'proxy': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc'
        };
        this.adminId = 1376689155;
    }

    async sendMessage(chatId, message, botType = 'main') {
        try {
            const token = this.tokens[botType];
            if (!token) return false;

            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            return response.ok;
        } catch (error) {
            console.error('❌ Ошибка отправки в Telegram:', error);
            return false;
        }
    }

    async notifyAdmin(message, botType = 'main') {
        return await this.sendMessage(this.adminId, message, botType);
    }

    async notifyUser(userId, message, botType = 'main') {
        return await this.sendMessage(userId, message, botType);
    }
}

module.exports = TelegramBot;