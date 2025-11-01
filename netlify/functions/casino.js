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
const SUPPORT_CHAT_ID = '@luditot_support';

// Free Lootbox Settings
let freeLootboxEnabled = false;
let lootboxPrizes = [];
let lootboxSpinCooldown = 10; // seconds
let lootboxLastSpin = new Map();

// Miner Game Settings
const minerMultipliers = {
    1: 2,
    2: 3, 
    3: 4
};

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

// Функция очистки чатов
async function clearAllChats(botToken) {
    try {
        // Получаем список обновлений (чатов)
        const updatesUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
        const updatesResponse = await fetch(updatesUrl);
        const updatesData = await updatesResponse.json();
        
        if (!updatesData.ok) {
            console.log('❌ Не удалось получить список чатов');
            return false;
        }
        
        const chats = new Set();
        
        // Собираем уникальные chat_id
        updatesData.result.forEach(update => {
            const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
            if (chatId && chatId !== ADMIN_CHAT_ID) {
                chats.add(chatId);
            }
        });
        
        console.log(`🗑️ Найдено чатов для очистки: ${chats.size}`);
        
        // Очищаем каждый чат
        for (let chatId of chats) {
            try {
                const leaveUrl = `https://api.telegram.org/bot${botToken}/leaveChat`;
                await fetch(leaveUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId
                    })
                });
                console.log(`✅ Очищен чат: ${chatId}`);
                
                // Небольшая задержка чтобы не превысить лимиты API
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.log(`⚠️ Не удалось очистить чат ${chatId}:`, error.message);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка очистки чатов:', error);
        return false;
    }
}

// Функция рассылки сообщений
async function broadcastMessage(message, botToken) {
    try {
        const userList = Array.from(users.values());
        let successCount = 0;
        let failCount = 0;
        
        console.log(`📢 Начало рассылки для ${userList.length} пользователей`);
        
        for (let user of userList) {
            try {
                const sent = await sendTelegramMessage(user.user_id, message, botToken);
                if (sent) {
                    successCount++;
                } else {
                    failCount++;
                }
                
                // Задержка чтобы не превысить лимиты API
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.log(`❌ Ошибка отправки пользователю ${user.user_id}:`, error.message);
                failCount++;
            }
        }
        
        return {
            success: true,
            total: userList.length,
            success_count: successCount,
            fail_count: failCount
        };
    } catch (error) {
        console.error('❌ Ошибка рассылки:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Функция для создания чека Crypto Bot
async function createCryptoBotInvoice(amount, userId) {
    try {
        // Здесь должна быть интеграция с Crypto Bot API
        // Это пример реализации
        const invoiceData = {
            amount: amount,
            currency: 'USD',
            user_id: userId,
            description: `Пополнение баланса в CASINO Totki`,
            payload: JSON.stringify({
                user_id: userId,
                amount: amount,
                type: 'deposit'
            })
        };
        
        // Генерируем фиктивный чек (в реальности нужно использовать Crypto Bot API)
        const invoiceUrl = `https://t.me/CryptoBot?start=invoice_${Date.now()}_${userId}_${amount}`;
        
        return {
            success: true,
            invoice_url: invoiceUrl,
            invoice_id: `invoice_${Date.now()}_${userId}`
        };
    } catch (error) {
        console.error('❌ Ошибка создания чека:', error);
        return {
            success: false,
            error: error.message
        };
    }
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
                total_users: users.size,
                free_lootbox_enabled: freeLootboxEnabled,
                lootbox_prizes_remaining: lootboxPrizes.length
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

            // Initialize user if not exists - НЕ ДОБАВЛЯЕМ БАЛАНС ПРИ КАЖДОМ ЗАПРОСЕ
            if (!users.has(userId)) {
                users.set(userId, {
                    user_id: userId,
                    username: username,
                    first_name: firstName,
                    balance: 0, // НАЧАЛЬНЫЙ БАЛАНС 0
                    games_played: 0,
                    total_won: 0,
                    biggest_win: 0,
                    wins_count: 0,
                    created_at: new Date().toISOString(),
                    last_activity: new Date().toISOString(),
                    inventory: [],
                    free_spins_used: 0,
                    miner_games_played: 0,
                    miner_total_won: 0
                });
                console.log(`✅ Created new user: ${userId}`);
            }

            const user = users.get(userId);
            user.last_activity = new Date().toISOString();
            
            let result = { success: true };

            // Process actions
            switch (action) {
                case 'register_telegram_user':
                    // Проверяем, не зарегистрирован ли пользователь уже
                    if (users.has(userId)) {
                        console.log(`🔄 Пользователь ${userId} уже зарегистрирован, обновляем данные`);
                    } else {
                        // Создаем нового пользователя с балансом 0
                        const newUser = {
                            user_id: userId,
                            username: data.username,
                            first_name: data.first_name,
                            balance: 0, // НАЧАЛЬНЫЙ БАЛАНС 0
                            games_played: 0,
                            total_won: 0,
                            biggest_win: 0,
                            wins_count: 0,
                            created_at: new Date().toISOString(),
                            last_activity: new Date().toISOString(),
                            inventory: [],
                            free_spins_used: 0,
                            miner_games_played: 0,
                            miner_total_won: 0
                        };
                        users.set(userId, newUser);
                        console.log(`✅ Новый пользователь зарегистрирован: ${userId}`);
                    }
                    
                    // Обновляем данные пользователя
                    if (data.photo_url) user.photo_url = data.photo_url;
                    if (data.language_code) user.language_code = data.language_code;
                    if (data.is_premium !== undefined) user.is_premium = data.is_premium;
                    
                    user.last_activity = new Date().toISOString();
                    
                    result.user_data = user;
                    result.message = 'Telegram user processed successfully';
                    
                    // Отправляем уведомление админу только для НОВЫХ пользователей
                    if (!users.has(userId) && userId != ADMIN_CHAT_ID) {
                        await sendTelegramMessage(
                            ADMIN_CHAT_ID,
                            `👤 <b>НОВАЯ РЕГИСТРАЦИЯ</b>\n\n` +
                            `🆔 ID: <code>${userId}</code>\n` +
                            `📛 Username: @${data.username || 'нет'}\n` +
                            `👨‍💼 Имя: ${data.first_name}\n` +
                            `💎 Баланс: 0 ⭐\n` +
                            `🤖 Бот: ${botType}\n` +
                            `🕐 Время: ${new Date().toLocaleString()}`,
                            BOT_TOKENS.admin_notifications
                        );
                    }
                    break;

                case 'get_initial_data':
                    result.user_data = user;
                    result.game_history = [];
                    result.server = 'Netlify Functions';
                    result.free_lootbox_enabled = freeLootboxEnabled;
                    result.lootbox_prizes_remaining = lootboxPrizes.length;
                    result.lootbox_cooldown = lootboxSpinCooldown;
                    break;

                case 'update_balance':
                    if (data.balance !== undefined) {
                        user.balance = data.balance;
                        result.user_data = user;
                    }
                    break;

                case 'game_result_silent':
                    user.games_played++;
                    
                    if (data.win) {
                        user.wins_count++;
                        user.total_won += data.prize_value || 0;
                        user.biggest_win = Math.max(user.biggest_win, data.prize_value || 0);
                        
                        console.log(`🎉 User ${userId} won: ${data.prize_name} (${data.prize_value} ⭐)`);
                    } else {
                        console.log(`❌ User ${userId} lost bet: ${data.bet_amount} ⭐`);
                    }
                    
                    result.user_data = user;
                    break;

                case 'create_invoice':
                    const depositAmount = data.amount || 0;
                    
                    if (depositAmount <= 0) {
                        result.success = false;
                        result.error = 'Неверная сумма для пополнения';
                        break;
                    }
                    
                    console.log(`💰 Create invoice request from ${userId}: ${depositAmount} USD`);
                    
                    const invoiceResult = await createCryptoBotInvoice(depositAmount, userId);
                    
                    if (invoiceResult.success) {
                        result.invoice_url = invoiceResult.invoice_url;
                        result.invoice_id = invoiceResult.invoice_id;
                        result.amount = depositAmount;
                        result.message = 'Invoice created successfully';
                    } else {
                        result.success = false;
                        result.error = invoiceResult.error;
                    }
                    break;

                case 'confirm_deposit':
                    const confirmedAmount = data.amount || 0;
                    const starsAmount = data.stars || 0;
                    
                    console.log(`💰 Deposit confirmed for ${userId}: ${confirmedAmount} USD -> ${starsAmount} ⭐`);
                    
                    const oldBalance = user.balance;
                    user.balance += starsAmount;
                    
                    console.log(`💰 Баланс пользователя ${userId} пополнен: ${oldBalance} -> ${user.balance} ⭐`);
                    
                    result.user_data = user;
                    result.deposit_amount = confirmedAmount;
                    result.stars_added = starsAmount;
                    result.old_balance = oldBalance;
                    result.new_balance = user.balance;
                    
                    // Уведомление админу о пополнении
                    await sendTelegramMessage(
                        ADMIN_CHAT_ID,
                        `💰 <b>БАЛАНС ПОПОЛНЕН</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `💵 <b>Сумма пополнения:</b> ${confirmedAmount} USD\n` +
                        `💎 <b>Добавлено звезд:</b> ${starsAmount} ⭐\n` +
                        `📊 <b>Было:</b> ${oldBalance} ⭐\n` +
                        `🔄 <b>Стало:</b> ${user.balance} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}`,
                        BOT_TOKENS.admin_notifications
                    );
                    
                    break;

                case 'free_lootbox_spin':
                    if (!freeLootboxEnabled) {
                        result.success = false;
                        result.error = 'Бесплатная лудка закрыта';
                        break;
                    }

                    // Проверяем кулдаун
                    const lastSpin = lootboxLastSpin.get(userId);
                    const now = Date.now();
                    if (lastSpin && (now - lastSpin) < (lootboxSpinCooldown * 1000)) {
                        const remaining = Math.ceil((lootboxSpinCooldown * 1000 - (now - lastSpin)) / 1000);
                        result.success = false;
                        result.error = `Подождите ${remaining} секунд до следующей прокрутки`;
                        break;
                    }

                    // Проверяем остались ли призы
                    if (lootboxPrizes.length === 0) {
                        result.success = false;
                        result.error = 'Все призы разыграны';
                        freeLootboxEnabled = false;
                        break;
                    }

                    // Симуляция прокрутки лудки
                    const symbols = ['lemon', 'cherry', 'bar', 'seven'];
                    const spinResult = [
                        symbols[Math.floor(Math.random() * symbols.length)],
                        symbols[Math.floor(Math.random() * symbols.length)],
                        symbols[Math.floor(Math.random() * symbols.length)]
                    ];

                    result.spin_result = spinResult;
                    result.win = false;
                    result.prize = null;

                    // Проверяем выигрыш (три семерки)
                    if (spinResult.every(symbol => symbol === 'seven')) {
                        // Выдаем приз
                        const prize = lootboxPrizes.shift();
                        result.win = true;
                        result.prize = prize;

                        // Обновляем баланс пользователя
                        user.balance += prize.value;
                        if (!user.inventory) user.inventory = [];
                        user.inventory.push(prize);

                        // Уведомление админу
                        await sendTelegramMessage(
                            ADMIN_CHAT_ID,
                            `🎰 <b>ВЫИГРЫШ В БЕСПЛАТНОЙ ЛУДКЕ!</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                            `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                            `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                            `🎁 <b>Приз:</b> ${prize.name}\n` +
                            `💎 <b>Стоимость:</b> ${prize.value} ⭐\n` +
                            `📊 <b>Осталось призов:</b> ${lootboxPrizes.length}\n` +
                            `🕐 <b>Время:</b> ${new Date().toLocaleString()}`,
                            BOT_TOKENS.admin_notifications
                        );

                        // Если призы закончились - закрываем лудку
                        if (lootboxPrizes.length === 0) {
                            freeLootboxEnabled = false;
                            await sendTelegramMessage(
                                ADMIN_CHAT_ID,
                                `🔒 <b>БЕСПЛАТНАЯ ЛУДКА ЗАКРЫТА</b>\n\n` +
                                `📊 <b>Причина:</b> Все призы разыграны\n` +
                                `🎁 <b>Всего призов:</b> ${lootboxPrizes.length}\n` +
                                `🕐 <b>Время:</b> ${new Date().toLocaleString()}`,
                                BOT_TOKENS.admin_notifications
                            );
                        }
                    }

                    lootboxLastSpin.set(userId, now);
                    user.free_spins_used = (user.free_spins_used || 0) + 1;
                    result.user_data = user;
                    result.prizes_remaining = lootboxPrizes.length;
                    break;

                case 'miner_game':
                    const bombCount = data.bomb_count || 1;
                    const betAmount = data.bet_amount || 0;
                    
                    if (betAmount <= 0) {
                        result.success = false;
                        result.error = 'Неверная сумма ставки';
                        break;
                    }
                    
                    if (user.balance < betAmount) {
                        result.success = false;
                        result.error = 'Недостаточно звезд';
                        break;
                    }
                    
                    // Симуляция игры в минёра
                    const totalCells = 9;
                    const bombPositions = [];
                    
                    // Генерируем позиции бомб
                    while (bombPositions.length < bombCount) {
                        const pos = Math.floor(Math.random() * totalCells);
                        if (!bombPositions.includes(pos)) {
                            bombPositions.push(pos);
                        }
                    }
                    
                    // Пользователь "открывает" клетки (в реальной игре это делается на клиенте)
                    // Здесь симулируем результат
                    const openedCell = Math.floor(Math.random() * totalCells);
                    const isBomb = bombPositions.includes(openedCell);
                    
                    user.balance -= betAmount;
                    user.miner_games_played = (user.miner_games_played || 0) + 1;
                    
                    if (!isBomb) {
                        const multiplier = minerMultipliers[bombCount];
                        const winAmount = betAmount * multiplier;
                        
                        user.balance += winAmount;
                        user.miner_total_won = (user.miner_total_won || 0) + winAmount;
                        
                        result.win = true;
                        result.win_amount = winAmount;
                        result.multiplier = multiplier;
                        result.message = `🎉 Вы выиграли ${winAmount} ⭐ (x${multiplier})!`;
                    } else {
                        result.win = false;
                        result.message = '💥 Вы наткнулись на бомбу!';
                    }
                    
                    result.user_data = user;
                    result.bomb_positions = bombPositions;
                    result.opened_cell = openedCell;
                    break;

                case 'withdraw_prize':
                    const prizeName = data.prize;
                    const prizeValue = data.value;
                    
                    console.log(`🎁 Withdraw request from ${userId}: ${prizeName} (${prizeValue} ⭐)`);
                    
                    // Уведомление админу о выводе приза
                    await sendTelegramMessage(
                        ADMIN_CHAT_ID,
                        `🎁 <b>ЗАПРОС НА ВЫВОД ПРИЗА</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `🏆 <b>Приз:</b> ${prizeName}\n` +
                        `💎 <b>Стоимость:</b> ${prizeValue} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}`,
                        BOT_TOKENS.admin_notifications
                    );
                    
                    break;

                case 'nft_purchase':
                    console.log(`🖼️ NFT purchase from ${userId}: ${data.nft_name} for ${data.price} ⭐`);
                    
                    // Уведомление админу о покупке NFT
                    await sendTelegramMessage(
                        ADMIN_CHAT_ID,
                        `🖼️ <b>ПОКУПКА NFT</b>\n\n` +
                        `👤 <b>Пользователь:</b> ${user.first_name}\n` +
                        `🆔 <b>ID:</b> <code>${userId}</code>\n` +
                        `📛 <b>Username:</b> @${user.username || 'нет'}\n` +
                        `🎨 <b>NFT:</b> ${data.nft_name}\n` +
                        `💎 <b>Цена:</b> ${data.price} ⭐\n` +
                        `🤖 <b>Бот:</b> ${botType}`,
                        BOT_TOKENS.admin_notifications
                    );
                    break;

                // АДМИН КОМАНДЫ
                case 'admin_set_lootbox':
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

                    freeLootboxEnabled = data.enabled || false;
                    lootboxPrizes = data.prizes || [];
                    lootboxSpinCooldown = data.cooldown || 10;
                    
                    result.free_lootbox_enabled = freeLootboxEnabled;
                    result.lootbox_prizes = lootboxPrizes;
                    result.lootbox_cooldown = lootboxSpinCooldown;
                    result.message = 'Настройки лудки обновлены';
                    
                    await sendTelegramMessage(
                        ADMIN_CHAT_ID,
                        `🎰 <b>НАСТРОЙКИ ЛУДКИ ОБНОВЛЕНЫ</b>\n\n` +
                        `🔓 <b>Статус:</b> ${freeLootboxEnabled ? 'ОТКРЫТА' : 'ЗАКРЫТА'}\n` +
                        `🎁 <b>Призов:</b> ${lootboxPrizes.length}\n` +
                        `⏰ <b>Кулдаун:</b> ${lootboxSpinCooldown} сек\n` +
                        `🕐 <b>Время:</b> ${new Date().toLocaleString()}`,
                        BOT_TOKENS.admin_notifications
                    );
                    break;

                case 'list_users':
                    console.log('📋 Запрос списка пользователей от админа');
                    
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
                            result.message = `Найдено ${users.size} пользователей`;
                        }
                        
                        result.timestamp = new Date().toISOString();
                        
                    } catch (error) {
                        console.error('❌ Ошибка получения списка пользователей:', error);
                        result.success = false;
                        result.error = error.message;
                    }
                    break;

                case 'broadcast':
                    console.log('📢 Запрос на рассылку от админа');
                    
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
                        const message = data.message;
                        if (!message) {
                            result.success = false;
                            result.error = 'Message is required';
                        } else {
                            const broadcastResult = await broadcastMessage(message, BOT_TOKENS[botType] || BOT_TOKENS.main);
                            result.broadcast_result = broadcastResult;
                            
                            // Уведомление админу о рассылке
                            await sendTelegramMessage(
                                ADMIN_CHAT_ID,
                                `📢 <b>РАССЫЛКА ВЫПОЛНЕНА</b>\n\n` +
                                `✉️ <b>Сообщение:</b> ${message}\n` +
                                `👥 <b>Всего пользователей:</b> ${broadcastResult.total}\n` +
                                `✅ <b>Успешно:</b> ${broadcastResult.success_count}\n` +
                                `❌ <b>Ошибок:</b> ${broadcastResult.fail_count}\n` +
                                `🤖 <b>Бот:</b> ${botType}`,
                                BOT_TOKENS.admin_notifications
                            );
                        }
                        
                    } catch (error) {
                        console.error('❌ Ошибка рассылки:', error);
                        result.success = false;
                        result.error = error.message;
                    }
                    break;

                case 'clear_chats':
                    console.log('🗑️ Запрос на очистку чатов от админа');
                    
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
                        const clearResult = await clearAllChats(BOT_TOKENS[botType] || BOT_TOKENS.main);
                        result.clear_result = clearResult;
                        
                        if (clearResult) {
                            result.message = 'Чаты успешно очищены';
                            
                            // Уведомление админу об очистке
                            await sendTelegramMessage(
                                ADMIN_CHAT_ID,
                                `🗑️ <b>ЧАТЫ ОЧИЩЕНЫ</b>\n\n` +
                                `🤖 <b>Бот:</b> ${botType}\n` +
                                `✅ <b>Статус:</b> Успешно\n` +
                                `🕐 <b>Время:</b> ${new Date().toLocaleString()}`,
                                BOT_TOKENS.admin_notifications
                            );
                        } else {
                            result.message = 'Ошибка при очистке чатов';
                        }
                        
                    } catch (error) {
                        console.error('❌ Ошибка очистки чатов:', error);
                        result.success = false;
                        result.error = error.message;
                    }
                    break;

                case 'add_stars':
                    console.log('⭐ Запрос на добавление звезд от админа:', data);
                    
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

                    const targetUserId = data.target_user_id;
                    const starsToAdd = data.amount || 0;
                    
                    if (!users.has(targetUserId)) {
                        result.success = false;
                        result.error = 'Пользователь не найден';
                    } else if (starsToAdd <= 0) {
                        result.success = false;
                        result.error = 'Неверная сумма для пополнения';
                    } else {
                        const targetUser = users.get(targetUserId);
                        const oldUserBalance = targetUser.balance;
                        targetUser.balance += starsToAdd;
                        
                        result.success = true;
                        result.message = `Баланс пользователя пополнен на ${starsToAdd} ⭐`;
                        result.user_data = targetUser;
                        result.old_balance = oldUserBalance;
                        result.new_balance = targetUser.balance;
                        
                        console.log(`✅ Админ добавил ${starsToAdd} ⭐ пользователю ${targetUserId}`);
                        
                        // Уведомление админу об успешном пополнении
                        await sendTelegramMessage(
                            ADMIN_CHAT_ID,
                            `⭐ <b>АДМИН ДОБАВИЛ ЗВЕЗДЫ</b>\n\n` +
                            `👤 <b>Пользователь:</b> ${targetUser.first_name}\n` +
                            `🆔 <b>ID:</b> <code>${targetUserId}</code>\n` +
                            `📛 <b>Username:</b> @${targetUser.username || 'нет'}\n` +
                            `💎 <b>Добавлено:</b> ${starsToAdd} ⭐\n` +
                            `📊 <b>Было:</b> ${oldUserBalance} ⭐\n` +
                            `🔄 <b>Стало:</b> ${targetUser.balance} ⭐\n` +
                            `👨‍💼 <b>Выполнил:</b> Администратор`,
                            BOT_TOKENS.admin_notifications
                        );
                    }
                    break;

                case 'delete_user':
                    console.log('🗑️ Запрос на удаление пользователя:', data.user_id);
                    
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
                        const userIdToDelete = data.user_id.toString();
                        
                        if (!users.has(userIdToDelete)) {
                            result.success = false;
                            result.error = 'User not found';
                        } else {
                            const deletedUser = users.get(userIdToDelete);
                            users.delete(userIdToDelete);
                            
                            result.success = true;
                            result.message = `User ${userIdToDelete} deleted successfully`;
                            result.deleted_user = {
                                user_id: userIdToDelete,
                                username: deletedUser.username,
                                first_name: deletedUser.first_name,
                                deleted_at: new Date().toISOString()
                            };
                            
                            console.log(`✅ Пользователь ${userIdToDelete} удален`);
                            
                            // Уведомление админу об удалении
                            await sendTelegramMessage(
                                ADMIN_CHAT_ID,
                                `🗑️ <b>ПОЛЬЗОВАТЕЛЬ УДАЛЕН</b>\n\n` +
                                `👤 <b>Пользователь:</b> ${deletedUser.first_name}\n` +
                                `🆔 <b>ID:</b> <code>${userIdToDelete}</code>\n` +
                                `📛 <b>Username:</b> @${deletedUser.username || 'нет'}\n` +
                                `💎 <b>Баланс был:</b> ${deletedUser.balance} ⭐\n` +
                                `🕐 <b>Удален:</b> ${new Date().toLocaleString()}`,
                                BOT_TOKENS.admin_notifications
                            );
                        }
                        
                    } catch (error) {
                        console.error('❌ Ошибка удаления пользователя:', error);
                        result.success = false;
                        result.error = error.message;
                    }
                    break;

                case 'clear_all_users':
                    console.log('⚠️ Запрос на очистку всех пользователей');
                    
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

                    if (!data.confirm) {
                        result.success = false;
                        result.error = 'Confirmation required. Use confirm: true';
                    } else {
                        try {
                            const userCount = users.size;
                            const totalBalance = Array.from(users.values()).reduce((sum, user) => sum + (user.balance || 0), 0);
                            
                            // Очищаем всех пользователей
                            users.clear();
                            
                            result.success = true;
                            result.message = `All users cleared successfully`;
                            result.cleared_count = userCount;
                            result.total_balance_cleared = totalBalance;
                            result.cleared_at = new Date().toISOString();
                            
                            console.log(`✅ Все пользователи удалены (${userCount} пользователей)`);
                            
                            // Уведомление админу об очистке
                            await sendTelegramMessage(
                                ADMIN_CHAT_ID,
                                `⚠️ <b>БАЗА ДАННЫХ ОЧИЩЕНА</b>\n\n` +
                                `🗑️ <b>Удалено пользователей:</b> ${userCount}\n` +
                                `💰 <b>Общий баланс:</b> ${totalBalance} ⭐\n` +
                                `🕐 <b>Время очистки:</b> ${new Date().toLocaleString()}\n` +
                                `🔧 <b>Выполнено через:</b> ${botType}`,
                                BOT_TOKENS.admin_notifications
                            );
                            
                        } catch (error) {
                            console.error('❌ Ошибка очистки пользователей:', error);
                            result.success = false;
                            result.error = error.message;
                        }
                    }
                    break;

                case 'test_connection':
                    result.message = 'Connection test successful';
                    result.server = 'Netlify Functions';
                    result.timestamp = new Date().toISOString();
                    result.total_users = users.size;
                    result.free_lootbox_enabled = freeLootboxEnabled;
                    result.lootbox_prizes_remaining = lootboxPrizes.length;
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