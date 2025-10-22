const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const token = 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

const ADMIN_CHAT_ID = 1376689155;
const NETLIFY_URL = 'https://teal-lollipop-dfedaf.netlify.app/.netlify/functions/casino';

// Команда /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        // Сохраняем информацию о чате
        await saveChatInfo(chatId, msg.message_id);
        
        const welcomeMessage = `
🎁 <b>Добро пожаловать в NFT Marketplace!</b>

Для начала работы перейдите в наше приложение:
👉 <a href="https://teal-lollipop-dfedaf.netlify.app">Открыть Маркетплейс</a>

<b>Админ команды:</b>
/listusers - Показать всех пользователей
/broadcast [сообщение] - Сделать рассылку
/clearchats - Очистить все чаты

<b>Для пользователей:</b>
Просто откройте приложение по ссылке выше и авторизуйтесь через Telegram!
        `;
        
        await bot.sendMessage(chatId, welcomeMessage, { 
            parse_mode: 'HTML',
            disable_web_page_preview: true 
        });
        
    } catch (error) {
        console.error('Ошибка команды /start:', error);
    }
});

// Команда /listusers
bot.onText(/\/listusers/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (chatId != ADMIN_CHAT_ID) {
        await bot.sendMessage(chatId, '❌ У вас нет прав для этой команды');
        return;
    }

    try {
        const response = await fetch(NETLIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'list_users',
                admin_id: chatId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.user_count === 0) {
                await bot.sendMessage(chatId, '📝 В базе нет пользователей');
            } else {
                let message = `📊 <b>Список пользователей</b>\n\n`;
                message += `👥 Всего: ${data.user_count}\n`;
                message += `🤖 Telegram: ${data.total_telegram_users || 0}\n`;
                message += `💰 Общий баланс: ${data.total_balance} ⭐\n\n`;
                
                let counter = 1;
                Object.entries(data.users).forEach(([userId, user]) => {
                    if (counter <= 20) { // Ограничиваем вывод
                        message += `👤 <b>${user.first_name}</b>\n`;
                        message += `🆔 ID: <code>${userId}</code>\n`;
                        message += `📛 @${user.username || 'нет'}\n`;
                        message += `💎 Баланс: ${user.balance} ⭐\n`;
                        message += `📅 Регистрация: ${new Date(user.registered_at).toLocaleDateString()}\n`;
                        message += `────────────────────\n`;
                        counter++;
                    }
                });
                
                if (data.user_count > 20) {
                    message += `\n... и еще ${data.user_count - 20} пользователей`;
                }
                
                await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            }
        } else {
            await bot.sendMessage(chatId, `❌ Ошибка: ${data.error}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        await bot.sendMessage(chatId, '❌ Ошибка при получении списка пользователей');
    }
});

// Команда /broadcast
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    
    if (chatId != ADMIN_CHAT_ID) {
        await bot.sendMessage(chatId, '❌ У вас нет прав для этой команды');
        return;
    }

    const message = match[1];

    try {
        const response = await fetch(NETLIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'broadcast_message',
                admin_id: chatId,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await bot.sendMessage(chatId, 
                `✅ Рассылка завершена!\n` +
                `✅ Успешно: ${data.broadcast_result.sent}\n` +
                `❌ Ошибок: ${data.broadcast_result.failed}`
            );
        } else {
            await bot.sendMessage(chatId, `❌ Ошибка: ${data.error}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        await bot.sendMessage(chatId, '❌ Ошибка при рассылке сообщений');
    }
});

// Команда /clearchats
bot.onText(/\/clearchats/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (chatId != ADMIN_CHAT_ID) {
        await bot.sendMessage(chatId, '❌ У вас нет прав для этой команды');
        return;
    }

    try {
        const response = await fetch(NETLIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'clear_chats',
                admin_id: chatId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await bot.sendMessage(chatId, 
                `✅ Очистка чатов завершена!\n` +
                `🗑️ Очищено сообщений: ${data.cleared_count}`
            );
        } else {
            await bot.sendMessage(chatId, `❌ Ошибка: ${data.error}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        await bot.sendMessage(chatId, '❌ Ошибка при очистке чатов');
    }
});

// Функция сохранения информации о чате
async function saveChatInfo(chatId, messageId) {
    try {
        const response = await fetch(NETLIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'save_chat_info',
                chat_id: chatId,
                message_id: messageId
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка сохранения чата:', error);
    }
}

// Обработка всех сообщений для сохранения ID чатов
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    
    // Сохраняем информацию о чате для возможной очистки
    await saveChatInfo(chatId, messageId);
});

console.log('🤖 NFT Marketplace Bot запущен...');
