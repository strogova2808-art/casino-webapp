// Простая база данных на основе JSON файла
const fs = require('fs').promises;
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join('/tmp', 'casino_db.json');
        this.init();
    }

    async init() {
        try {
            await fs.access(this.dbPath);
        } catch (error) {
            // Файл не существует, создаем пустую базу
            await this.saveData({ users: {}, transactions: [], game_history: [] });
        }
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { users: {}, transactions: [], game_history: [] };
        }
    }

    async saveData(data) {
        await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
        return true;
    }

    async getUser(userId) {
        const data = await this.loadData();
        return data.users[userId] || null;
    }

    async createUser(userData) {
        const data = await this.loadData();
        
        const user = {
            user_id: userData.user_id,
            username: userData.username || '',
            first_name: userData.first_name || 'Игрок',
            balance: userData.balance || 666,
            games_played: 0,
            total_won: 0,
            biggest_win: 0,
            wins_count: 0,
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
        };

        data.users[userData.user_id] = user;
        await this.saveData(data);
        
        console.log(`✅ Создан пользователь: ${userData.user_id}`);
        return user;
    }

    async updateUser(userId, updates) {
        const data = await this.loadData();
        
        if (data.users[userId]) {
            data.users[userId] = {
                ...data.users[userId],
                ...updates,
                last_activity: new Date().toISOString()
            };
            await this.saveData(data);
            return data.users[userId];
        }
        return null;
    }

    async addGameRecord(userId, betAmount, win, prizeName = null, prizeValue = 0, combination = "") {
        const data = await this.loadData();
        
        // Добавляем запись в историю
        const gameRecord = {
            id: Date.now(),
            user_id: userId,
            bet_amount: betAmount,
            win: win,
            prize_name: prizeName,
            prize_value: prizeValue,
            combination: combination,
            created_at: new Date().toISOString()
        };
        
        data.game_history.push(gameRecord);
        
        // Обновляем статистику пользователя
        if (data.users[userId]) {
            const user = data.users[userId];
            user.games_played += 1;
            user.last_activity = new Date().toISOString();
            
            if (win) {
                user.total_won += prizeValue;
                user.wins_count += 1;
                user.biggest_win = Math.max(user.biggest_win, prizeValue);
            }
        }
        
        await this.saveData(data);
        return true;
    }

    async addTransaction(userId, type, amount, description = "") {
        const data = await this.loadData();
        
        const transaction = {
            id: Date.now(),
            user_id: userId,
            type: type,
            amount: amount,
            description: description,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        data.transactions.push(transaction);
        await this.saveData(data);
        return true;
    }
}

module.exports = Database;