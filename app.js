
const fetch = require('node-fetch');

// In-memory database
const users = new Map();
const userMessages = new Map(); // Для хранения ID чатов пользователей

// Telegram bot tokens
const BOT_TOKENS = {
    'main': '8373706621:AAFTOCrsNuSuov9pBzj1C1xk7vvC3zo01Nk',
    'proxy': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc',
    'admin_notifications': '7662090078:AAEGodkX0D982ZQplWqKHafGlucATOzzevc'
};

const ADMIN_CHAT_ID = 1376689155;

// Функция отправки в Telegram
async function sendTelegramMessage(chatId, message, botToken = BOT_TOKENS.admin_notifications, parse_mode = 'HTML') {
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
                parse_mode: parse_mode
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

// Функция очистки чатов
async function clearUserChats(botToken) {
    try {
        console.log('🗑️ Начинаю очистку чатов...');
        let clearedCount = 0;
        
        for (const [chatId, messageIds] of userMessages.entries()) {
            if (chatId != ADMIN_CHAT_ID) { // Не трогаем админа
                for (const messageId of messageIds) {
                    try {
                        const url = `https://api.telegram.org/bot${botToken}/deleteMessage`;
                        await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                message_id: messageId
                            })
                        });
                        clearedCount++;
                    } catch (error) {
                        console.log(`❌ Не удалось удалить сообщение в чате ${chatId}`);
                    }
                }
                // Очищаем историю сообщений для этого чата
                userMessages.set(chatId, []);
            }
        }
        
        console.log(`✅ Очищено ${clearedCount} сообщений`);
        return clearedCount;
    } catch (error) {
        console.error('❌ Ошибка очистки чатов:', error);
        return 0;
    }
}

// Функция рассылки сообщений
async function broadcastMessage(message, botToken) {
    try {
        console.log('📢 Начинаю рассылку сообщений...');
        let sentCount = 0;
        let failedCount = 0;
        
        for (const [userId, userData] of users.entries()) {
            try {
                // Сохраняем ID сообщения для возможной future очистки
                const messageSent = await sendTelegramMessage(
                    userId, 
                    `📢 <b>Рассылка от администратора</b>\n\n${message}`,
                    botToken
                );
                
                if (messageSent) {
                    sentCount++;
                } else {
                    failedCount++;
                }
                
                // Задержка чтобы не превысить лимиты Telegram
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Ошибка отправки пользователю ${userId}:`, error);
                failedCount++;
            }
        }
        
        console.log(`✅ Рассылка завершена: отправлено ${sentCount}, не удалось ${failedCount}`);
        return { sent: sentCount, failed: failedCount };
    } catch (error) {
        console.error('❌ Ошибка рассылки:', error);
        return { sent: 0, failed: users.size };
    }
}

exports.handler = async (event, context) => {
    console.log('🎁 NFT Marketplace Function called');
    
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
                message: '🎁 NFT Marketplace API is working!',
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
            const firstName = data.first_name || 'Пользователь';

            // Сохраняем информацию о чате для возможной очистки
            if (userId && !userMessages.has(userId)) {
                userMessages.set(userId, []);
            }

            let result = { success: true };

            // Process actions
            switch (action) {

                case 'register_telegram_user':
                    console.log('👤 Регистрация Telegram пользователя:', data);
                    
                    if (!users.has(userId)) {
                        users.set(userId, {
                            user_id: userId,
                            username: username,
                            first_name: firstName,
                            last_name: data.last_name || '',
                            language_code: data.language_code || 'ru',
                            is_premium: data.is_premium || false,
                            photo_url: data.photo_url || '',
                            balance: data.balance || 500,
                            inventory: [],
                            transactions: [],
                            registered_at: data.registered_at || new Date().toISOString(),
                            last_activity: new Date().toISOString(),
                            is_telegram_user: true
                        });
                        
                        console.log(`✅ Зарегистрирован новый Telegram пользователь: ${firstName}`);
                        
                        // Уведомление админу о новой регистрации
                        await sendTelegramMessage(
                            ADMIN_CHAT_ID,
                            `👤 <b>НОВЫЙ ПОЛЬЗОВАТЕЛЬ</b>\n\n` +
                            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                            `👤 <b>Имя:</b> ${firstName}\n` +
                            `📛 <b>Username:</b> @${username}\n` +
                            `💎 <b>Баланс:</b> ${data.balance || 500} ⭐\n` +
                            `🌐 <b>Язык:</b> ${data.language_code || 'ru'}\n` +
                            `⭐ <b>Premium:</b> ${data.is_premium ? 'Да' : 'Нет'}\n` +
                            `🤖 <b>Через бота:</b> ${botType}`,
                            BOT_TOKENS.admin_notifications
                        );
                    } else {
                        // Обновляем данные существующего пользователя
                        const user = users.get(userId);
                        user.last_activity = new Date().toISOString();
                        user.balance = data.balance || user.balance;
                    }
                    
                    result.user_data = users.get(userId);
                    break;

                case 'purchase_nft':
                    console.log('🛒 Покупка NFT:', data);
                    
                    if (!users.has(userId)) {
                        result.success = false;
                        result.error = 'User not found';
                        break;
                    }

                    const user = users.get(userId);
                    const transaction = {
                        id: data.transaction_id,
                        nft_id: data.nft_id,
                        nft_name: data.nft_name,
                        buyer: user.username,
                        recipient: data.recipient,
                        price: data.price,
                        timestamp: new Date().toISOString()
                    };

                    // Добавляем транзакцию в историю пользователя
                    if (!user.transactions) user.transactions = [];
                    user.transactions.push(transaction);
                    
                    // Обновляем баланс
                    user.balance -= data.price;
                    user.last_activity = new Date().toISOString();

                    result.success = true;
                    result.transaction = transaction;
                    
                    // Уведомление админу о покупке
                    await sendTelegramMessage(
                        ADMIN_CHAT_ID,
                        `🛒 <b>НОВАЯ ПОКУПКА NFT</b>\n\n` +
                        `🎁 <b>NFT:</b> ${data.nft_name}\n` +
                        `👤 <b>Покупатель:</b> ${user.first_name}\n` +
                        `📛 <b>Username:</b> @${user.username}\n` +
                        `🎯 <b>Получатель:</b> ${data.recipient}\n` +
                        `💎 <b>Цена:</b> ${data.price} ⭐\n` +
                        `🆔 <b>ID транзакции:</b> <code>${data.transaction_id}</code>\n` +
                        `🤖 <b>Через бота:</b> ${botType}`,
                        BOT_TOKENS.admin_notifications
                    );
                    break;

                case 'deposit_request':
                    console.log('💰 Запрос на пополнение:', data);
                    
                    if (users.has(userId)) {
                        const depositUser = users.get(userId);
                        const oldBalance = depositUser.balance;
                        depositUser.balance += data.amount;
                        depositUser.last_activity = new Date().toISOString();
                        
                        result.user_data = depositUser;
                        result.deposit_amount = data.amount;
                        result.old_balance = oldBalance;
                        result.new_balance = depositUser.balance;
                        
                        // Уведомление админу о пополнении
                        await sendTelegramMessage(
                            ADMIN_CHAT_ID,
                            `💰 <b>ПОПОЛНЕНИЕ БАЛАНСА</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${depositUser.first_name}\n` +
                            `📛 <b>Username:</b> @${depositUser.username}\n` +
                            `💎 <b>Сумма:</b> ${data.amount} ⭐\n` +
                            `📊 <b>Было:</b> ${oldBalance} ⭐\n` +
                            `🔄 <b>Стало:</b> ${depositUser.balance} ⭐\n` +
                            `🤖 <b>Через бота:</b> ${botType}`,
                            BOT_TOKENS.admin_notifications
                        );
                    }
                    break;

                // АДМИН КОМАНДЫ
                case 'list_users':
                    console.log('📋 Запрос списка пользователей от админа:', data.admin_id);
                    
                    // Проверяем права администратора
                    if (data.admin_id != ADMIN_CHAT_ID) {
                        return {
                            statusCode: 403,
                            headers,
                            body: JSON.stringify({ 
                                success: false, 
                                error: 'Admin access required' 
                            })
                        };
                    }

                    try {
                        console.log(`📊 Текущие пользователи в памяти:`, Array.from(users.keys()));
                        
                        if (users.size === 0) {
                            result.users = {};
                            result.user_count = 0;
                            result.total_balance = 0;
                            result.message = 'В базе нет пользователей';
                        } else {
                            // Преобразуем Map в объект
                            const usersArray = Array.from(users.entries()).reduce((acc, [id, userData]) => {
                                acc[id] = userData;
                                return acc;
                            }, {});
                            
                            console.log(`📊 Найдено пользователей: ${Object.keys(usersArray).length}`);
                            
                            result.users = usersArray;
                            result.user_count = users.size;
                            result.total_balance = Array.from(users.values()).reduce((sum, user) => sum + (user.balance || 0), 0);
                            result.total_telegram_users = Array.from(users.values()).filter(user => user.is_telegram_user).length;
                            result.message = `Найдено ${users.size} пользователей`;
                        }
                        
                        result.timestamp = new Date().toISOString();
                        
                    } catch (error) {
                        console.error('❌ Ошибка получения списка пользователей:', error);
                        result.success = false;
                        result.error = error.message;
                    }
                    break;

                case 'clear_chats':
                    console.log('🗑️ Запрос на очистку чатов от админа:', data.admin_id);
                    
                    // Проверяем права администратора
                    if (data.admin_id != ADMIN_CHAT_ID) {
                        return {
                            statusCode: 403,
                            headers,
                            body: JSON.stringify({ 
                                success: false, 
                                error: 'Admin access required' 
                            })
                        };
                    }

                    try {
                        const clearedCount = await clearUserChats(BOT_TOKENS[botType] || BOT_TOKENS.main);
                        
                        result.success = true;
                        result.cleared_count = clearedCount;
                        result.message = `Очищено ${clearedCount} сообщений`;
                        
                        // Уведомление админу об очистке
                        await sendTelegramMessage(
                            ADMIN_CHAT_ID,
                            `🗑️ <b>ОЧИСТКА ЧАТОВ ВЫПОЛНЕНА</b>\n\n` +
                            `📝 <b>Очищено сообщений:</b> ${clearedCount}\n` +
                            `👥 <b>Затронуто чатов:</b> ${userMessages.size - 1}\n` +
                            `🕐 <b>Время:</b> ${new Date().toLocaleString()}`,
                            BOT_TOKENS.admin_notifications
                        );
                        
                    } catch (error) {
                        console.error('❌ Ошибка очистки чатов:', error);
                        result.success = false;
                        result.error = error.message;
                    }
                    break;

                case 'broadcast_message':
                    console.log('📢 Запрос на рассылку от админа:', data.admin_id);
                    
                    // Проверяем права администратора
                    if (data.admin_id != ADMIN_CHAT_ID) {
                        return {
                            statusCode: 403,
                            headers,
                            body: JSON.stringify({ 
                                success: false, 
                                error: 'Admin access required' 
                            })
                        };
                    }

                    if (!data.message) {
                        result.success = false;
                        result.error = 'Message is required';
                    } else {
                        try {
                            const broadcastResult = await broadcastMessage(
                                data.message, 
                                BOT_TOKENS[botType] || BOT_TOKENS.main
                            );
                            
                            result.success = true;
                            result.broadcast_result = broadcastResult;
                            result.message = `Рассылка завершена: ${broadcastResult.sent} отправлено, ${broadcastResult.failed} ошибок`;
                            
                            // Уведомление админу о рассылке
                            await sendTelegramMessage(
                                ADMIN_CHAT_ID,
                                `📢 <b>РАССЫЛКА ЗАВЕРШЕНА</b>\n\n` +
                                `✅ <b>Успешно:</b> ${broadcastResult.sent}\n` +
                                `❌ <b>Ошибок:</b> ${broadcastResult.failed}\n` +
                                `👥 <b>Всего пользователей:</b> ${users.size}\n` +
                                `💬 <b>Сообщение:</b> ${data.message.substring(0, 100)}...`,
                                BOT_TOKENS.admin_notifications
                            );
                            
                        } catch (error) {
                            console.error('❌ Ошибка рассылки:', error);
                            result.success = false;
                            result.error = error.message;
                        }
                    }
                    break;

                case 'get_user_data':
                    if (users.has(userId)) {
                        result.user_data = users.get(userId);
                    } else {
                        result.success = false;
                        result.error = 'User not found';
                    }
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

