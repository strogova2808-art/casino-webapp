const Database = require('./database');
const TelegramBot = require('./telegram');

exports.handler = async (event) => {
    // Настройка CORS headers
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
                username: data.username || '',
                first_name: data.first_name || 'Игрок'
            });
        }

        let result = { success: false, error: 'Unknown action' };

        // Обработка различных действий
        switch (action) {
            case 'get_initial_data':
                const gameHistory = await db.getGameHistory(userId, 10);
                result = {
                    success: true,
                    user_data: user,
                    game_history: gameHistory
                };
                break;

            case 'update_balance':
                const newBalance = data.balance;
                if (newBalance !== undefined) {
                    const updatedUser = await db.updateUser(userId, { balance: newBalance });
                    await telegram.notifyAdmin(
                        `🔄 Обновление баланса\n👤 ${user.first_name}\n💰 ${newBalance} ⭐\n🤖 ${botType} бот`,
                        botType
                    );
                    result = { 
                        success: true, 
                        message: 'Balance updated',
                        user_data: updatedUser
                    };
                } else {
                    result = { success: false, error: 'Balance not provided' };
                }
                break;

            case 'game_result':
                const { bet_amount, win, prize_name, prize_value, combination } = data;
                const gameRecorded = await db.addGameRecord(
                    userId, 
                    bet_amount, 
                    win, 
                    prize_name, 
                    prize_value, 
                    combination
                );
                
                if (gameRecorded) {
                    if (win) {
                        await telegram.notifyAdmin(
                            `🎉 ВЫИГРЫШ!\n👤 ${user.first_name}\n🏆 ${prize_name}\n💰 ${prize_value} ⭐\n🎰 ${combination}\n🤖 ${botType} бот`,
                            botType
                        );
                    } else {
                        await telegram.notifyAdmin(
                            `🎰 Результат игры\n👤 ${user.first_name}\n💸 Ставка: ${bet_amount} ⭐\n❌ Проигрыш\n🤖 ${botType} бот`,
                            botType
                        );
                    }
                    result = { success: true, message: 'Game recorded' };
                } else {
                    result = { success: false, error: 'Failed to record game' };
                }
                break;

            case 'deposit_request':
                const depositAmount = data.amount || 0;
                const transactionAdded = await db.addTransaction(
                    userId, 
                    'deposit', 
                    depositAmount, 
                    'Запрос на пополнение'
                );
                
                if (transactionAdded) {
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
                } else {
                    result = { success: false, error: 'Failed to add transaction' };
                }
                break;

            case 'withdraw_prize':
                const { prize, value } = data;
                const withdrawRecorded = await db.addTransaction(
                    userId, 
                    'withdraw', 
                    value, 
                    `Вывод приза: ${prize}`
                );
                
                if (withdrawRecorded) {
                    await telegram.notifyAdmin(
                        `🎁 ЗАПРОС НА ВЫВОД ПРИЗА\n\n👤 ${user.first_name}\n🆔 ${userId}\n📛 @${user.username || 'нет'}\n🏆 ${prize}\n💎 ${value} ⭐\n🤖 ${botType} бот`,
                        botType
                    );
                    
                    await telegram.notifyUser(
                        userId,
                        `✅ <b>Запрос на вывод приза принят!</b>\n\n🏆 ${prize}\n💎 ${value} ⭐\n👤 Администратор уведомлен`,
                        botType
                    );
                    
                    result = { success: true, message: 'Withdraw request sent' };
                } else {
                    result = { success: false, error: 'Failed to record withdraw' };
                }
                break;

            case 'test_connection':
                await telegram.notifyAdmin(
                    `🔗 Тест связи\n👤 ${user.first_name}\n🆔 ${userId}\n🤖 ${botType} бот\n✅ WebApp подключен к Netlify`,
                    botType
                );
                result = { 
                    success: true, 
                    message: 'Connection test successful',
                    server: 'Netlify Functions',
                    timestamp: new Date().toISOString()
                };
                break;

            case 'get_game_history':
                const history = await db.getGameHistory(userId, data.limit || 10);
                result = {
                    success: true,
                    game_history: history
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
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};