// Простая база данных на основе JSON файла
class Database {
    constructor() {
        this.init();
    }

    async init() {
        // Инициализация при первом запуске
        console.log('✅ База данных инициализирована');
    }

    async getUser(userId) {
        try {
            // В реальной реализации здесь будет работа с файлом
            // Сейчас возвращаем тестового пользователя
            return {
                user_id: userId,
                username: 'user_' + userId,
                first_name: 'Игрок',
                balance: 666,
                games_played: 0,
                total_won: 0,
                biggest_win: 0,
                wins_count: 0,
                created_at: new Date().toISOString(),
                last_activity: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Ошибка получения пользователя:', error);
            return null;
        }
    }

    async createUser(userData) {
        console.log('✅ Создан пользователь:', userData.user_id);
        return {
            ...userData,
            balance: userData.balance || 666,
            games_played: 0,
            total_won: 0,
            biggest_win: 0,
            wins_count: 0,
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
        };
    }

    async updateUser(userId, updates) {
        console.log('🔄 Обновлен пользователь:', userId, updates);
        return { user_id: userId, ...updates };
    }

    async addGameRecord(userId, betAmount, win, prizeName = null, prizeValue = 0, combination = "") {
        console.log('🎮 Запись игры:', { 
            userId, 
            betAmount, 
            win, 
            prizeName, 
            prizeValue, 
            combination 
        });
        return true;
    }

    async addTransaction(userId, type, amount, description = "") {
        console.log('💳 Транзакция:', { 
            userId, 
            type, 
            amount, 
            description 
        });
        return true;
    }

    async getGameHistory(userId, limit = 10) {
        // Возвращаем тестовую историю
        return [
            {
                id: 1,
                user_id: userId,
                bet_amount: 3,
                win: true,
                prize_name: 'Мишка',
                prize_value: 21,
                combination: 'bear,bear,bear',
                created_at: new Date().toISOString()
            }
        ];
    }
}

module.exports = Database;
