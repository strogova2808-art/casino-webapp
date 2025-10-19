// In-memory database
const users = new Map();

exports.handler = async (event, context) => {
    console.log('🎰 Casino Function called');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    
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
        console.log('🔄 Handling OPTIONS preflight');
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Handle GET requests (for direct browser access)
    if (event.httpMethod === 'GET') {
        console.log('📥 GET request received');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '🎰 Casino API is working!',
                server: 'Netlify Functions',
                timestamp: new Date().toISOString(),
                total_users: users.size,
                available_actions: [
                    'get_initial_data',
                    'update_balance', 
                    'game_result',
                    'deposit_request',
                    'withdraw_prize',
                    'test_connection'
                ]
            })
        };
    }

    // Handle POST requests
    if (event.httpMethod === 'POST') {
        try {
            // Parse JSON body
            let data = {};
            try {
                data = JSON.parse(event.body || '{}');
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid JSON'
                    })
                };
            }

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
                        result = { 
                            success: true, 
                            message: 'Balance updated',
                            user_data: user
                        };
                    } else {
                        result = { success: false, error: 'Balance not provided' };
                    }
                    break;

                case 'game_result':
                    user.games_played++;
                    if (data.win) {
                        user.wins_count++;
                        user.total_won += data.prize_value || 0;
                        user.biggest_win = Math.max(user.biggest_win, data.prize_value || 0);
                        console.log(`🎉 User ${userId} won: ${data.prize_name} (${data.prize_value} ⭐)`);
                    }
                    result = { success: true, message: 'Game recorded' };
                    break;

                case 'deposit_request':
                    console.log(`💰 Deposit request from ${userId}: ${data.amount} ⭐`);
                    result = { 
                        success: true, 
                        message: 'Deposit request received',
                        amount: data.amount
                    };
                    break;

                case 'withdraw_prize':
                    console.log(`🎁 Withdraw request from ${userId}: ${data.prize} (${data.value} ⭐)`);
                    result = { 
                        success: true, 
                        message: 'Withdraw request received',
                        prize: data.prize,
                        value: data.value
                    };
                    break;

                case 'test_connection':
                    console.log(`🔗 Test connection from ${userId}`);
                    result = { 
                        success: true, 
                        message: 'Connection test successful',
                        server: 'Netlify Functions',
                        timestamp: new Date().toISOString(),
                        user_data: user,
                        total_users: users.size
                    };
                    break;

                default:
                    result = { 
                        success: false, 
                        error: 'Unknown action: ' + action 
                    };
            }

            console.log('📤 Response:', result);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };

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

    // Method not allowed
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
            success: false,
            error: 'Method not allowed: ' + event.httpMethod
        })
    };
};
