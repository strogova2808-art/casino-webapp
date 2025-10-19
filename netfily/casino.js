exports.handler = async (event) => {
    console.log('🎰 Casino Function called');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Parse request data
        let data = {};
        if (event.body) {
            data = JSON.parse(event.body);
        }
        
        console.log('📥 Request data:', data);

        const action = data.action || 'test';
        const userId = data.user_id || 'unknown';
        
        // Simple response
        const result = {
            success: true,
            message: `Action '${action}' processed successfully`,
            user_id: userId,
            server: 'Netlify Functions',
            timestamp: new Date().toISOString(),
            action: action,
            your_data: data
        };

        console.log('📤 Response:', result);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('❌ Error:', error);
        
        return {
            statusCode: 200, // Всегда 200 чтобы не ломать клиент
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
