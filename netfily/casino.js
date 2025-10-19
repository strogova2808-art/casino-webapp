const fetch = require('node-fetch');

// Простая база данных в памяти
const users = new Map();

exports.handler = async (event) => {
    console.log('📥 Получен запрос:', event.httpMethod, event.path);
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Парсим данные запроса
        let data = {};
        if (event.body) {
            data = JSON.parse(event.body);
        }
        
        console.log('📊 Данные запроса:', data);

        const action = data.action;
        const userId = data.user_id || 'default';
        const botType = data.bot_type || 'main';

        // Инициализация пользователя
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
        }

        const user = users.get(userId);
        let result = { success: false, error: 'Unknown action' };

        // Обработка действий
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
                const newBalance = data.balance;
                if (newBalance !== undefined) {
                    user.balance = newBalance;
                    user.last_activity = new Date().toISOString();
                    
                    // Отправка в Telegram (упрощенная)
                    await sendToTelegram(
                        `🔄 Обновление баланса\n👤 ${user.first_name}\n💰 ${newBalance} ⭐\n🤖 ${botType} бот`,
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
                const { bet_amount, win, prize_name, prize_value, combination } = data;
                user.games_played++;
                
                if (win) {
                    user.wins_count++;
                    user.total_won += prize_value;
                    user.biggest_win = Math.max(user.biggest_win, prize_value);
                    
                    await sendToTelegram(
                        `🎉 ВЫИГРЫШ!\n👤 ${user.first_name}\n🏆 ${prize_name}\n💰 ${prize_value} ⭐\n🎰 ${combination}\n🤖 ${botType} бот`,
                        botType
                    );
                } else {
                    await sendToTelegram(
                        `🎰 Результат игры\n👤 ${user.first_name}\n💸 Ставка: ${bet_amount} ⭐\n❌ Проигрыш\n🤖 ${botType} бот`,
                        botType
                    );
                }
                
                result = { success: true, message: 'Game recorded' };
                break;

            case 'deposit_request':
                const depositAmount = data.amount || 0;
                
                await sendToTelegram(
                    `💰 ЗАПРОС НА ПОПОЛНЕНИЕ\n\n👤 ${user.first_name}\n🆔 ${userId}\n📛 @${user.username || 'нет'}\n💎 ${depositAmount} ⭐\n🤖 ${botType} бот\n\nДля подтверждения:\n/addstars ${userId} ${depositAmount}`,
                    botType
                );
                
                result = { success: true, message: 'Deposit request sent' };
                break;

            case 'test_connection':
                await sendToTelegram(
                    `🔗 Тест связи\n👤 ${user.first_name}\n🆔 ${userId}\n🤖 ${botType} бот\n✅ WebApp подключен к Netlify\n⏰ ${new Date().toISOString()}`,
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
                result = { success: false, error: 'Unknown action: ' + action };
        }

        console.log('📤 Ответ:', result);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('❌ Ошибка обработки запроса:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Упрощенная функция отправки в Telegram
async function sendToTelegram(message, botType = 'main') {
    try {
        const tokens = {
            'main': '8373706621:AAFTOCrsNuSuov9pBzj1C1xk7vvC3zo01Nk',
            'proxy': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc'
        };
        
        const adminId = 1376689155;
        const token = tokens[botType];
        
        if (!token) {
            console.log('❌ Токен бота не найден:', botType);
            return false;
        }

        console.log(`📨 Отправка в Telegram [${botType}]:`, message);
        
        // В продакшене раскомментировать:
        /*
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: adminId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        return result.ok;
        */
        
        return true; // Пока просто возвращаем true для тестов
        
    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error);
        return false;
    }
}
