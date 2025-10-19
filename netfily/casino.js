// Простая база данных в памяти
const users = new Map();

exports.handler = async (event) => {
    console.log('🎰 Casino Function вызвана');
    
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
        
        console.log('📥 Данные запроса:', data);

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
            console.log(`✅ Создан пользователь: ${userId}`);
        }

        const user = users.get(userId);
        user.last_activity = new Date().toISOString();
        
        let result = { success: true }; // По умолчанию успех

        // Обработка действий
        switch (action) {
            case 'get_initial_data':
                result.user_data = user;
                result.game_history = [];
                result.server = 'Netlify Functions';
                result.timestamp = new Date().toISOString();
                break;

            case 'update_balance':
                if (data.balance !== undefined) {
                    user.balance = data.balance;
                    result.message = 'Balance updated';
                    result.user_data = user;
                }
                break;

            case 'game_result':
                user.games_played++;
                if (data.win) {
                    user.wins_count++;
                    user.total_won += data.prize_value || 0;
                    user.biggest_win = Math.max(user.biggest_win, data.prize_value || 0);
                }
                result.message = 'Game recorded';
                break;

            case 'deposit_request':
                result.message = 'Deposit request received';
                break;

            case 'test_connection':
                result.message = 'Connection successful';
                result.server = 'Netlify Functions';
                result.timestamp = new Date().toISOString();
                result.total_users = users.size;
                break;

            default:
                result.success = false;
                result.error = 'Unknown action';
        }

        console.log('📤 Ответ:', result);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('❌ Ошибка:', error);
        
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
