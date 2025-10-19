const Database = require('./database');
const TelegramBot = require('./telegram');

exports.handler = async (event) => {
    // Настройка CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
        const db = new Database();
        const telegram = new TelegramBot();

        // Парсим данные запроса
        const data = JSON.parse(event.body || '{}');
        console.log('📥 Получен запрос:', data);

        const action = data.action;
        const userId = data.user_id;
        const botType = data.bot_type || 'main';

        // Валидация
        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'User ID required'
                })
            };
        }

        // Получаем или создаем пользователя
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser({
                user_id: userId,
                username: data.username,
                first_name: data.first_name || 'Игрок'
            });
        }

        // Обработка действий
        let result = { success: false, error: 'Unknown action' };

        switch (action) {
            case 'get_initial_data':
                result = {
                    success: true,
                    user_data: user
                };
                break;

            case 'update_balance':
                const newBalance = data.balance;
                if (newBalance !== undefined) {
                    await db.updateUser(userId, { balance: newBalance });
                    await telegram.notifyAdmin(
                        `🔄 Баланс обновлен\n👤 ${user.first_name}\n💰 ${newBalance} ⭐`,
                        botType
                    );
                    result = { success: true, message: 'Balance updated' };
                }
                break;

            case 'game_result':
                const { bet_amount, win, prize_name, prize_value, combination } = data;
                await db.addGameRecord(userId, bet_amount, win, prize_name, prize_value, combination);
                
                if (win) {
                    await telegram.notifyAdmin(
                        `🎉 ВЫИГРЫШ!\n👤 ${user.first_name}\n🏆 ${prize_name}\n💰 ${prize_value} ⭐`,
                        botType
                    );
                } else {
                    await telegram.notifyAdmin(
                        `🎰 Игра\n👤 ${user.first_name}\n💸 Ставка: ${bet_amount} ⭐\n❌ Проигрыш`,
                        botType
                    );
                }
                result = { success: true, message: 'Game recorded' };
                break;

            case 'deposit_request':
                const depositAmount = data.amount || 0;
                await db.addTransaction(userId, 'deposit', depositAmount, 'Запрос на пополнение');
                
                // Уведомление админу
                await telegram.notifyAdmin(
                    `💰 ЗАПРОС НА ПОПОЛНЕНИЕ\n\n👤 ${user.first_name}\n🆔 ${userId}\n📛 @${user.username || 'нет'}\n💎 ${depositAmount} ⭐\n🤖 ${botType} бот\n\nДля подтверждения:\n/addstars ${userId} ${depositAmount}`,
                    botType
                );
                
                // Уведомление пользователю
                await telegram.notifyUser(
                    userId,
                    `✅ <b>Запрос на пополнение принят!</b>\n\n💎 Сумма: ${depositAmount} ⭐\n👤 Администратор уведомлен\n⏳ Ожидайте подтверждения`,
                    botType
                );
                
                result = { success: true, message: 'Deposit request sent' };
                break;

            case 'withdraw_prize':
                const { prize, value } = data;
                await db.addTransaction(userId, 'withdraw', value, `Вывод приза: ${prize}`);
                
                await telegram.notifyAdmin(
                    `🎁 ЗАПРОС НА ВЫВОД ПРИЗА\n\n👤 ${user.first_name}\n🆔 ${userId}\n🏆 ${prize}\n💎 ${value} ⭐\n🤖 ${botType} бот`,
                    botType
                );
                
                await telegram.notifyUser(
                    userId,
                    `✅ <b>Запрос на вывод приза принят!</b>\n\n🏆 ${prize}\n💎 ${value} ⭐\n👤 Администратор уведомлен`,
                    botType
                );
                
                result = { success: true, message: 'Withdraw request sent' };
                break;

            case 'test_connection':
                await telegram.notifyAdmin(
                    `🔗 Тест связи\n👤 ${user.first_name}\n🆔 ${userId}\n🤖 ${botType} бот\n✅ WebApp подключен`,
                    botType
                );
                result = { success: true, message: 'Connection test successful' };
                break;

            default:
                result = { success: false, error: 'Unknown action' };
        }

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
                error: error.message
            })
        };
    }
};