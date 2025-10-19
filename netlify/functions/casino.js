const fetch = require('node-fetch');

// In-memory database
const users = new Map();

// Telegram bot tokens
const BOT_TOKENS = {
    'main': '8373706621:AAFTOCrsNuSuov9pBzj1C1xk7vvC3zo01Nk',
    'proxy': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc',
    'admin_notifications': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc' // Бот для уведомлений админу
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
    console.log('Method:', event.httpMethod);
    
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

            // Initialize user if not exists
            if (!users.has(userId)) {
                users.set(userId, {
                    user_id: userId,
                    username: data.username || 'user_' + userId,
                    first_name: data.first_name || 'Игрок',
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
            
            let result = { success: false, error: 'Unknown action' };

            // Process actions
            switch (action) {
                case 'get_initial_data':
                    result = {
                        success: true,
                        user_data: user,
                        game_history: [],
                        server: 'Netlify Functions',
                        timestamp: new Date().toISOString()
                    };
                    break;

                case 'update_balance':
                    if (data.balance !== undefined) {
                        user.balance = data.balance;
                        
                        // Уведомление админу об изменении баланса
                        await notifyAdmin(
                            `💰 <b>ИЗМЕНЕНИЕ БАЛАНСА</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                            `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                            `💎 <b>Новый баланс:</b> ${data.balance} ⭐\n` +
                            `🤖 <b>Бот:</b> ${botType}\n` +
                            `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`,
                            botType
                        );
                        
                        result = { 
                            success: true, 
                            message: 'Balance updated',
                            user_data: user
                        };
                    }
                    break;

                case 'game_result':
                    user.games_played++;
                    if (data.win) {
                        user.wins_count++;
                        user.total_won += data.prize_value || 0;
                        user.biggest_win = Math.max(user.biggest_win, data.prize_value || 0);
                        
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
                            `🤖 <b>Бот:</b> ${botType}\n` +
                            `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`,
                            botType
                        );
                    }
                    result = { success: true, message: 'Game recorded' };
                    break;

                case 'deposit_request':
                    const depositAmount = data.amount || 0;
                    
                    // Уведомление админу о запросе на пополнение
                    await notifyAdmin(
                        `💰 <b>ЗАПРОС НА ПОПОЛНЕНИЕ</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `💎 <b>Сумма:</b> ${depositAmount} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}\n\n` +
                        `✅ <b>Для подтверждения:</b>\n` +
                        `<code>/addstars ${userId} ${depositAmount}</code>\n\n` +
                        `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`,
                        botType
                    );
                    
                    result = { 
                        success: true, 
                        message: 'Deposit request sent to admin',
                        amount: depositAmount
                    };
                    break;

                case 'withdraw_prize':
                    // Уведомление админу о выводе приза
                    await notifyAdmin(
                        `🎁 <b>ЗАПРОС НА ВЫВОД ПРИЗА</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `🏆 <b>Приз:</b> ${data.prize}\n` +
                        `💎 <b>Стоимость:</b> ${data.value} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}\n\n` +
                        `✅ <b>Для подтверждения свяжитесь с пользователем</b>\n\n` +
                        `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`,
                        botType
                    );
                    
                    result = { 
                        success: true, 
                        message: 'Withdraw request sent to admin',
                        prize: data.prize,
                        value: data.value
                    };
                    break;

                case 'test_connection':
                    // Тестовое уведомление
                    await notifyAdmin(
                        `🔗 <b>ТЕСТ СВЯЗИ</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `🌐 <b>Сервер:</b> Netlify Functions\n` +
                        `🤖 <b>Бот:</b> ${botType}\n` +
                        `✅ <b>Статус:</b> Связь установлена\n` +
                        `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`,
                        botType
                    );
                    
                    result = { 
                        success: true, 
                        message: 'Connection test successful',
                        server: 'Netlify Functions',
                        timestamp: new Date().toISOString(),
                        user_data: user
                    };
                    break;

                default:
                    result = { 
                        success: false, 
                        error: 'Unknown action: ' + action 
                    };
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
                    error: error.message
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
