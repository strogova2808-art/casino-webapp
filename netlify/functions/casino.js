const fetch = require('node-fetch');

// In-memory database
const users = new Map();

// Telegram bot tokens
const BOT_TOKENS = {
    'main': '8373706621:AAFTOCrsNuSuov9pBzj1C1xk7vvC3zo01Nk',
    'proxy': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc',
    'admin_notifications': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc'
};

const ADMIN_CHAT_ID = 1376689155;

// Функция отправки в Telegram
async function sendTelegramMessage(chatId, message, botToken = BOT_TOKENS.admin_notifications) {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
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
        
        const result = await response.json();
        console.log('📨 Результат отправки в Telegram:', result.ok);
        return result.ok;
    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error);
        return false;
    }
}

// Функция отправки уведомления админу
async function notifyAdmin(message, botType = 'main') {
    const botToken = BOT_TOKENS.admin_notifications;
    return await sendTelegramMessage(ADMIN_CHAT_ID, message, botToken);
}

exports.handler = async (event, context) => {
    console.log('🎰 Casino Function called');
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Handle GET requests
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '🎰 Casino API is working!',
                server: 'Netlify Functions',
                timestamp: new Date().toISOString(),
                total_users: users.size
            })
        };
    }

    // Handle POST requests
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body || '{}');
            console.log('📥 POST Request data:', data);

            const action = data.action;
            const userId = data.user_id || 'default';
            const botType = data.bot_type || 'main';
            const username = data.username || 'user_' + userId;
            const firstName = data.first_name || 'Игрок';

            // Initialize user if not exists
            if (!users.has(userId)) {
                users.set(userId, {
                    user_id: userId,
                    username: username,
                    first_name: firstName,
                    balance: 666,
                    games_played: 0,
                    total_won: 0,
                    biggest_win: 0,
                    wins_count: 0,
                    created_at: new Date().toISOString(),
                    last_activity: new Date().toISOString()
                });
                console.log(`✅ Created new user: ${userId}`);
            }

            const user = users.get(userId);
            user.last_activity = new Date().toISOString();
            
            let result = { success: true };

            // Process actions
            switch (action) {
                case 'get_initial_data':
                    result.user_data = user;
                    result.game_history = [];
                    result.server = 'Netlify Functions';
                    break;

                case 'update_balance':
                    if (data.balance !== undefined) {
                        user.balance = data.balance;
                        result.user_data = user;
                        
                        // Уведомление админу об изменении баланса
                        await notifyAdmin(
                            `💰 <b>ИЗМЕНЕНИЕ БАЛАНСА</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                            `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                            `💎 <b>Новый баланс:</b> ${data.balance} ⭐\n` +
                            `🤖 <b>Бот:</b> ${botType}`,
                            botType
                        );
                    }
                    break;

                case 'game_result':
                    user.games_played++;
                    
                    if (data.win) {
                        user.wins_count++;
                        user.total_won += data.prize_value || 0;
                        user.biggest_win = Math.max(user.biggest_win, data.prize_value || 0);
                        
                        console.log(`🎉 User ${userId} won: ${data.prize_name} (${data.prize_value} ⭐)`);
                        
                        // Уведомление админу о выигрыше
                        await notifyAdmin(
                            `🎉 <b>ВЫИГРЫШ В КАЗИНО!</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                            `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                            `🏆 <b>Приз:</b> ${data.prize_name}\n` +
                            `💎 <b>Сумма:</b> ${data.prize_value} ⭐\n` +
                            `🎰 <b>Комбинация:</b> ${data.combination}\n` +
                            `💰 <b>Ставка:</b> ${data.bet_amount} ⭐\n` +
                            `🤖 <b>Бот:</b> ${botType}`,
                            botType
                        );
                    } else {
                        console.log(`❌ User ${userId} lost bet: ${data.bet_amount} ⭐`);
                        
                        // Уведомление админу о проигрыше
                        await notifyAdmin(
                            `🎰 <b>РЕЗУЛЬТАТ ИГРЫ</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                            `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                            `💸 <b>Ставка:</b> ${data.bet_amount} ⭐\n` +
                            `❌ <b>Результат:</b> Проигрыш\n` +
                            `🎰 <b>Комбинация:</b> ${data.combination}\n` +
                            `🤖 <b>Бот:</b> ${botType}`,
                            botType
                        );
                    }
                    
                    result.user_data = user;
                    break;

                case 'deposit_request':
                    const depositAmount = data.amount || 0;
                    
                    console.log(`💰 Deposit request from ${userId}: ${depositAmount} ⭐`);
                    
                    // Уведомление админу о запросе на пополнение
                    await notifyAdmin(
                        `💰 <b>ЗАПРОС НА ПОПОЛНЕНИЕ</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${firstName}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${username || 'нет'}\n` +
                        `💎 <b>Сумма:</b> ${depositAmount} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}`,
                        botType
                    );
                    
                    break;

                case 'withdraw_prize':
                    const prizeName = data.prize;
                    const prizeValue = data.value;
                    
                    console.log(`🎁 Withdraw request from ${userId}: ${prizeName} (${prizeValue} ⭐)`);
                    
                    // Уведомление админу о выводе приза
                    await notifyAdmin(
                        `🎁 <b>ЗАПРОС НА ВЫВОД ПРИЗА</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `🏆 <b>Приз:</b> ${prizeName}\n` +
                        `💎 <b>Стоимость:</b> ${prizeValue} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}`,
                        botType
                    );
                    
                    break;

                default:
                    result.message = `Action '${action}' processed`;
            }

            console.log('📤 Response:', result);
            return { statusCode: 200, headers, body: JSON.stringify(result) };

        } catch (error) {
            console.error('❌ Handler error:', error);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
        })
    };
};
