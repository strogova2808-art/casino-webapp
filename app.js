class CasinoApp {
    constructor() {
        this.userData = null;
        this.userBalance = 0;
        this.currentBet = 3;
        this.isSpinning = false;
        this.gamesPlayed = 0;
        this.totalWon = 0;
        this.biggestWin = 0;
        this.winsCount = 0;
        this.gameHistory = [];
        this.selectedDepositAmount = 0;
        this.currentPrize = null;
        this.userId = null;
        this.stickersLoaded = false;
        this.quickSpinMode = false;
        this.currentBot = 'main';
        this.isNewUser = true;
        this.isOnline = true;
        this.isLoggedIn = false;
        this.currentUser = null;
        
        // Правильные призы за 3 одинаковых стикера
        this.prizesConfig = {
            3: {
                'bear': { name: 'Мишка', value: 21 },
                'rose': { name: 'Роза', value: 32 },
                'ring': { name: 'Кольцо', value: 129 },
                'rocket': { name: 'Ракета', value: 63 }
            },
            9: {
                'rose': { name: 'Роза', value: 32 },
                'rocket': { name: 'Ракета', value: 63 },
                'candy': { name: 'Candy Cane', value: 357 },
                'b-day': { name: 'B-Day Candle', value: 378 },
                'desk': { name: 'Desk Calendar', value: 315 },
                's-box': { name: 'Snake Box', value: 389 }
            },
            15: {
                'ring': { name: 'Кольцо', value: 129 },
                'rocket': { name: 'Ракета', value: 63 },
                'candy': { name: 'Candy Cane', value: 357 },
                'b-day': { name: 'B-Day Candle', value: 378 },
                'desk': { name: 'Desk Calendar', value: 315 },
                's-box': { name: 'Snake Box', value: 389 },
                'Tama': { name: 'Tama Gadget', value: 525 },
                'Hypno': { name: 'Hypno Lollipop', value: 525 },
                'Etern': { name: 'Eternal Candle', value: 840 },
                'HePo': { name: 'Hex Pot', value: 735 }
            }
        };

        // Веса для разных ставок
        this.weights = {
            3: {
                'bear': 30,
                'rose': 20,
                'ring': 10,
                'rocket': 20
            },
            9: {
                'rose': 25,
                'rocket': 12,
                'candy': 8,
                'b-day': 6,
                'desk': 5,
                's-box': 4
            },
            15: {
                'ring': 15,
                'rocket': 12,
                'candy': 8,
                'b-day': 6,
                'desk': 5,
                's-box': 4,
                'Tama': 3,
                'Hypno': 2,
                'Etern': 1,
                'HePo': 1
            }
        };

        this.stickerPaths = {
            'bear': './stickers/bear.gif',
            'rose': './stickers/rose.gif', 
            'ring': './stickers/ring.gif',
            'rocket': './stickers/rocket.gif',
            'candy': './stickers/candy.gif',
            'b-day': './stickers/b-day.gif',
            'desk': './stickers/desk.gif',
            's-box': './stickers/s-box.gif',
            'Tama': './stickers/Tama.gif',
            'Hypno': './stickers/Hypno.gif',
            'Etern': './stickers/Etern.gif',
            'HePo': './stickers/HePo.gif'
        };

        this.netlifyUrl = 'https://jade-pony-7cf4af.netlify.app/.netlify/functions/casino';
        
        console.log('🎰 Инициализация CasinoApp...');
        
        this.init();
    }

    async init() {
        console.log('🎰 Инициализация CasinoApp...');
        
        this.checkOnlineStatus();
        this.setupOnlineListeners();
        this.detectCurrentBot();
        await this.initTelegramWebApp();
        await this.preloadStickers();
        this.setupEventListeners();
        
        // Проверяем авторизацию
        this.checkAuth();
        
        this.updateUI();
        this.selectBet(3);
        this.updateHistory();
        this.setInitialStickers();
        
        console.log('✅ CasinoApp инициализирован');
    }

    // АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
    checkAuth() {
        const savedUser = localStorage.getItem('casino_current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isLoggedIn = true;
                this.userId = this.currentUser.id;
                this.userBalance = this.currentUser.balance || 222;
                this.showSection('casino');
                this.updateUserDisplay();
                console.log('✅ Пользователь авторизован:', this.currentUser);
            } catch (e) {
                console.error('❌ Ошибка загрузки пользователя:', e);
                this.showAuthSection();
            }
        } else {
            this.showAuthSection();
        }
    }

    showAuthSection() {
        this.showSection('auth');
        this.isLoggedIn = false;
    }

    async register(username, password, email = '') {
        if (!username || !password) {
            this.showNotification('❌ Заполните все поля');
            return false;
        }

        if (password.length < 4) {
            this.showNotification('❌ Пароль должен быть не менее 4 символов');
            return false;
        }

        try {
            // Генерируем уникальный ID
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const userData = {
                id: userId,
                username: username,
                email: email,
                balance: 222,
                games_played: 0,
                total_won: 0,
                biggest_win: 0,
                wins_count: 0,
                registered_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            };

            // Сохраняем пользователя
            this.saveUserToLocalStorage(userData);
            this.currentUser = userData;
            this.isLoggedIn = true;
            this.userId = userId;
            this.userBalance = 222;

            // Отправляем данные в Telegram базу
            await this.sendUserToTelegram(userData);

            this.showNotification('✅ Регистрация успешна!');
            this.showSection('casino');
            this.updateUserDisplay();
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            this.showNotification('❌ Ошибка регистрации');
            return false;
        }
    }

    async login(username, password) {
        if (!username || !password) {
            this.showNotification('❌ Заполните все поля');
            return false;
        }

        try {
            const user = this.getUserFromLocalStorage(username);
            
            if (!user) {
                this.showNotification('❌ Пользователь не найден');
                return false;
            }

            // В реальном приложении здесь должна быть проверка пароля
            // Для демо просто проверяем существование пользователя
            this.currentUser = user;
            this.isLoggedIn = true;
            this.userId = user.id;
            this.userBalance = user.balance || 222;

            // Обновляем время последнего входа
            user.last_login = new Date().toISOString();
            this.saveUserToLocalStorage(user);

            this.showNotification('✅ Вход выполнен!');
            this.showSection('casino');
            this.updateUserDisplay();
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            this.showNotification('❌ Ошибка входа');
            return false;
        }
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.userId = null;
        this.userBalance = 0;
        localStorage.removeItem('casino_current_user');
        this.showNotification('👋 До свидания!');
        this.showAuthSection();
    }

    saveUserToLocalStorage(userData) {
        try {
            // Сохраняем как текущего пользователя
            localStorage.setItem('casino_current_user', JSON.stringify(userData));
            
            // Сохраняем в общий список пользователей
            const usersKey = 'casino_users';
            let users = JSON.parse(localStorage.getItem(usersKey) || '{}');
            users[userData.username] = userData;
            localStorage.setItem(usersKey, JSON.stringify(users));
            
            console.log('💾 Пользователь сохранен:', userData.username);
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователя:', error);
        }
    }

    getUserFromLocalStorage(username) {
        try {
            const usersKey = 'casino_users';
            const users = JSON.parse(localStorage.getItem(usersKey) || '{}');
            return users[username];
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            return null;
        }
    }

    async sendUserToTelegram(userData) {
        if (!this.isOnline) return;

        try {
            const data = {
                action: 'register_user',
                user_id: userData.id,
                username: userData.username,
                email: userData.email,
                balance: userData.balance,
                registered_at: userData.registered_at,
                bot_type: this.currentBot,
                first_name: userData.username,
                domain: 'teal-lollipop-dfedaf'
            };

            console.log('📨 Отправка данных пользователя в Telegram:', data);
            await this.sendToNetlify(data);
            
        } catch (error) {
            console.error('❌ Ошибка отправки пользователя в Telegram:', error);
        }
    }

    updateUserDisplay() {
        if (this.isLoggedIn && this.currentUser) {
            // Обновляем отображение в навигации
            const profileName = document.getElementById('profileName');
            const profileId = document.getElementById('profileId');
            const profileBalance = document.getElementById('profileBalance');
            
            if (profileName) profileName.textContent = this.currentUser.username;
            if (profileId) profileId.textContent = this.currentUser.id;
            if (profileBalance) profileBalance.textContent = this.userBalance + ' ⭐';
            
            this.updateProfileStats();
        }
    }

    setupOnlineListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Приложение онлайн');
            this.isOnline = true;
            this.showNotification('✅ Соединение восстановлено');
            this.updateOnlineStatus(true);
            this.syncWithServer();
        });

        window.addEventListener('offline', () => {
            console.log('❌ Приложение офлайн');
            this.isOnline = false;
            this.showNotification('⚠️ Режим офлайн - данные сохранятся локально');
            this.updateOnlineStatus(false);
        });
    }

    updateOnlineStatus(online) {
        const statusElement = document.getElementById('onlineStatus');
        if (statusElement) {
            statusElement.textContent = online ? 'онлайн' : 'офлайн';
            statusElement.className = online ? 'status-dot' : 'status-dot offline';
        }
    }

    checkOnlineStatus() {
        this.isOnline = navigator.onLine;
        console.log('🌐 Статус соединения:', this.isOnline ? 'онлайн' : 'офлайн');
        this.updateOnlineStatus(this.isOnline);
    }

    async syncWithServer() {
        if (!this.isOnline || !this.isLoggedIn) return;
        
        console.log('🔄 Синхронизация с сервером...');
        try {
            await this.saveUserDataToDatabase();
            this.showNotification('✅ Данные синхронизированы');
        } catch (error) {
            console.error('❌ Ошибка синхронизации:', error);
        }
    }

    detectCurrentBot() {
        console.log('🔍 Определение текущего бота...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('startapp') || urlParams.get('start');
        
        if (startParam === 'consoltotka_bot' || startParam?.includes('consoltotka')) {
            this.currentBot = 'proxy';
            console.log('🔧 Определен КОНСОЛЬ-БОТ @consoltotka_bot');
            this.showProxyBanner();
        } else {
            this.currentBot = 'main';
            console.log('🎰 Определен ОСНОВНОЙ БОТ @sosazvezd_bot');
        }
    }

    showProxyBanner() {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 12px 15px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        `;
        banner.innerHTML = `
            <span>🔧 Консоль-бот | Запросы отправляются на модерацию</span>
            <button onclick="casino.goToMainBot()" style="
                background: white;
                color: #ff6b6b;
                border: none;
                padding: 6px 12px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 12px;
            ">🎰 Основной бот</button>
        `;
        document.body.appendChild(banner);
        
        const container = document.querySelector('.container');
        if (container) {
            container.style.paddingTop = '60px';
        }
    }

    goToMainBot() {
        const mainBotUrl = 'https://t.me/sosazvezd_bot?startapp=sosazvezd_bot';
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.openTelegramLink(mainBotUrl);
        } else {
            window.open(mainBotUrl, '_blank');
        }
    }

    async initTelegramWebApp() {
        if (window.Telegram && Telegram.WebApp) {
            console.log('📱 Инициализация Telegram WebApp...');
            
            try {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                
                let user = Telegram.WebApp.initDataUnsafe?.user;
                
                if (user && this.isLoggedIn) {
                    console.log('✅ Пользователь получен из initDataUnsafe:', user);
                    this.userData = user;
                    // Обновляем данные пользователя из Telegram
                    if (this.currentUser) {
                        this.currentUser.telegram_id = user.id;
                        this.currentUser.telegram_username = user.username;
                        this.currentUser.telegram_first_name = user.first_name;
                        this.saveUserToLocalStorage(this.currentUser);
                    }
                }
                
                Telegram.WebApp.setHeaderColor('#2c3e50');
                Telegram.WebApp.setBackgroundColor('#1a1a2e');
                
            } catch (error) {
                console.error('❌ Ошибка инициализации Telegram WebApp:', error);
            }
        } else {
            console.log('⚠️ Telegram WebApp не обнаружен');
        }
    }

    async sendToNetlify(data) {
        if (!this.isOnline) {
            console.log('📡 Офлайн режим - запрос не отправлен');
            return {
                success: true,
                message: 'Офлайн режим - данные сохранены локально',
                offline: true
            };
        }

        console.log(`📡 Отправка данных в Netlify:`, data);
        
        try {
            const response = await fetch(this.netlifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    user_id: this.userId,
                    bot_type: this.currentBot,
                    timestamp: Date.now(),
                    username: this.currentUser?.username,
                    first_name: this.currentUser?.username,
                    domain: 'teal-lollipop-dfedaf'
                })
            });
            
            console.log('📡 Статус ответа:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Ответ от Netlify:', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка отправки в Netlify:', error);
            
            return {
                success: true,
                message: 'Офлайн режим - данные сохранены локально',
                offline: true
            };
        }
    }

    async sendToBot(data) {
        console.log(`📡 Отправка данных:`, data);
        
        const result = await this.sendToNetlify(data);
            
        if (result.success) {
            if (result.user_data && !result.offline) {
                this.updateFromServerData(result.user_data);
            }
            return true;
        } else {
            this.showNotification('❌ ' + (result.error || 'Ошибка сервера'));
            return false;
        }
    }

    updateFromServerData(serverData) {
        console.log('🔄 Обновление данных с сервера:', serverData);
        
        if (serverData.balance !== undefined && this.currentUser) {
            this.userBalance = serverData.balance;
            this.currentUser.balance = serverData.balance;
            this.saveUserToLocalStorage(this.currentUser);
        }
        
        this.updateUI();
        console.log('✅ Данные обновлены, баланс:', this.userBalance);
    }

    async loadInitialData() {
        if (!this.isLoggedIn) return;
        
        console.log('🔄 Загрузка начальных данных...');
        
        if (this.isOnline) {
            try {
                const data = {
                    action: 'get_initial_data',
                    user_id: this.userId,
                    bot_type: this.currentBot,
                    username: this.currentUser?.username,
                    first_name: this.currentUser?.username,
                    domain: 'teal-lollipop-dfedaf'
                };
                
                console.log('📤 Отправка запроса начальных данных:', data);
                const result = await this.sendToNetlify(data);
                
                if (result.success && result.user_data) {
                    this.updateFromServerData(result.user_data);
                }
                
            } catch (error) {
                console.error('❌ Ошибка отправки запроса данных:', error);
            }
        }
    }

    async saveUserDataToDatabase() {
        if (!this.isLoggedIn) return;
        
        console.log('💾 Сохранение данных...');
        
        if (this.isOnline && this.currentUser) {
            try {
                const data = {
                    action: 'update_balance',
                    user_id: this.userId,
                    balance: this.userBalance,
                    games_played: this.gamesPlayed,
                    total_won: this.totalWon,
                    biggest_win: this.biggestWin,
                    wins_count: this.winsCount,
                    bot_type: this.currentBot,
                    username: this.currentUser?.username,
                    first_name: this.currentUser?.username,
                    domain: 'teal-lollipop-dfedaf'
                };
                
                console.log('📤 Отправка данных:', data);
                await this.sendToNetlify(data);
                
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }
    }

    // АВТОМАТИЧЕСКОЕ ПОПОЛНЕНИЕ БАЛАНСА
    processDeposit() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала войдите в систему');
            this.showAuthSection();
            return;
        }

        if (this.selectedDepositAmount > 0) {
            const data = {
                action: 'deposit_request',
                user_id: this.userId,
                amount: this.selectedDepositAmount,
                bot_type: this.currentBot,
                username: this.currentUser?.username,
                first_name: this.currentUser?.username,
                domain: 'teal-lollipop-dfedaf'
            };
            
            console.log('💰 Отправка запроса на пополнение:', data);
            
            this.sendToBot(data).then(success => {
                if (success) {
                    this.updateUI();
                    this.showNotification(`✅ Баланс пополнен на ${this.selectedDepositAmount} ⭐`);
                    this.closeDepositModal();
                }
            });
        } else {
            this.showNotification('❌ Выберите сумму для пополнения');
        }
    }

    withdrawPrize() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала войдите в систему');
            this.showAuthSection();
            return;
        }

        if (this.currentPrize) {
            const data = {
                action: 'withdraw_prize',
                user_id: this.userId,
                prize: this.currentPrize.name,
                value: this.currentPrize.value,
                sticker: this.currentPrize.sticker,
                bot_type: this.currentBot,
                username: this.currentUser?.username,
                first_name: this.currentUser?.username,
                domain: 'teal-lollipop-dfedaf'
            };
            
            console.log('🎁 Отправка запроса на вывод приза:', data);
            this.sendToBot(data);
            
            this.showNotification('🎁 Запрос на вывод отправлен на модерацию!');
            this.closePrizeModal();
        }
    }

    sellPrize() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала войдите в систему');
            this.showAuthSection();
            return;
        }

        if (this.currentPrize) {
            this.userBalance += this.currentPrize.value;
            if (this.currentUser) {
                this.currentUser.balance = this.userBalance;
                this.saveUserToLocalStorage(this.currentUser);
            }
            this.showNotification(`💰 Приз "${this.currentPrize.name}" продан за ${this.currentPrize.value} ⭐`);
            this.updateUI();
            this.saveUserDataToDatabase();
            this.closePrizeModal();
        }
    }

    async preloadStickers() {
        console.log('🔄 Предзагрузка GIF стикеров...');
        const allStickers = Object.keys(this.stickerPaths);
        
        const preloadPromises = allStickers.map(sticker => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = this.stickerPaths[sticker];
                img.onload = () => {
                    console.log(`✅ Стикер ${sticker} загружен`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`❌ Ошибка загрузки стикера ${sticker}`);
                    resolve();
                };
            });
        });

        await Promise.all(preloadPromises);
        this.stickersLoaded = true;
        console.log('✅ Все GIF стикеры загружены');
    }

    updateReelSticker(reelNumber, stickerName) {
        const stickerContainer = document.getElementById(`sticker${reelNumber}`);
        if (stickerContainer) {
            const stickerPath = this.stickerPaths[stickerName];
            stickerContainer.innerHTML = `<img src="${stickerPath}" alt="${stickerName}" class="sticker-gif">`;
        }
    }

    updateReelStickerQuick(reelNumber, stickerName) {
        const stickerContainer = document.getElementById(`sticker${reelNumber}`);
        if (stickerContainer) {
            const stickerPath = this.stickerPaths[stickerName];
            stickerContainer.innerHTML = `<img src="${stickerPath}" alt="${stickerName}" class="sticker-gif spinning-emoji">`;
        }
    }

    showPrizeModal(prize) {
        if (!this.isLoggedIn) return;

        const prizeCombination = document.getElementById('prizeCombination');
        const prizeName = document.getElementById('prizeName');
        const prizeValue = document.getElementById('prizeValue');
        const prizeSticker = document.getElementById('prizeSticker');
        const prizeModal = document.getElementById('prizeModal');
        
        if (prizeCombination) prizeCombination.style.display = 'none';
        if (prizeName) prizeName.textContent = prize.name;
        if (prizeValue) prizeValue.textContent = `Стоимость: ${prize.value} ⭐`;
        if (prizeSticker) {
            const stickerPath = this.stickerPaths[prize.sticker];
            prizeSticker.innerHTML = `<img src="${stickerPath}" alt="${prize.name}" class="sticker-gif" style="width: 120px; height: 120px;">`;
        }
        if (prizeModal) prizeModal.style.display = 'block';
        
        this.createConfetti();
    }

    setupEventListeners() {
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
        document.addEventListener('gesturechange', function(e) {
            e.preventDefault();
        });
        document.addEventListener('gestureend', function(e) {
            e.preventDefault();
        });
        
        console.log('✅ Обработчики событий установлены');
    }

    updateUI() {
        this.updateBalance();
        this.updateProfileStats();
    }

    updateBalance() {
        const balanceElement = document.getElementById('profileBalance');
        if (balanceElement) {
            balanceElement.textContent = this.userBalance + ' ⭐';
        }
    }

    updateProfileStats() {
        const elements = {
            games: document.getElementById('statGames'),
            winrate: document.getElementById('statWinrate'),
            totalWon: document.getElementById('statTotalWon'),
            record: document.getElementById('statRecord')
        };
        
        if (elements.games) elements.games.textContent = this.gamesPlayed;
        
        const winrate = this.gamesPlayed > 0 ? Math.round((this.winsCount / this.gamesPlayed) * 100) : 0;
        if (elements.winrate) elements.winrate.textContent = winrate + '%';
        if (elements.totalWon) elements.totalWon.textContent = this.formatNumber(this.totalWon) + ' ⭐';
        if (elements.record) elements.record.textContent = this.formatNumber(this.biggestWin) + ' ⭐';
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (this.gameHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">Пока нет истории игр</div>';
            return;
        }

        historyList.innerHTML = this.gameHistory.slice(-10).reverse().map(game => `
            <div class="history-item ${game.win ? 'history-win' : 'history-loss'}">
                <div class="history-content">
                    ${game.win ? `
                        <div class="history-info">
                            <div class="history-prize-name">${game.prizeName}</div>
                            <div class="history-prize-value">+${game.prizeValue} ⭐</div>
                        </div>
                        <div class="history-sticker-small">
                            <img src="${this.stickerPaths[game.prizeSticker]}" alt="${game.prizeName}" class="history-sticker-img">
                        </div>
                    ` : `
                        <div class="history-info">
                            <div class="history-loss-text">❌ Проигрыш</div>
                            <div class="history-loss-amount">-${game.betAmount} ⭐</div>
                        </div>
                        <div class="history-sticker-small">
                            <div class="loss-icon">🎰</div>
                        </div>
                    `}
                </div>
                <div class="history-time">${game.time}</div>
            </div>
        `).join('');
    }

    addToHistory(win, prize = null, betAmount = 0) {
        const now = new Date();
        const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        const historyItem = { win, time, betAmount };
        if (win && prize) {
            historyItem.prizeName = prize.name;
            historyItem.prizeSticker = prize.sticker;
            historyItem.prizeValue = prize.value;
        }

        this.gameHistory.push(historyItem);
        if (this.gameHistory.length > 50) this.gameHistory = this.gameHistory.slice(-50);
        this.updateHistory();
    }

    selectBet(bet) {
        if (this.isSpinning || !this.isLoggedIn) return;
        this.currentBet = bet;
        document.querySelectorAll('.bet-option').forEach(option => {
            option.classList.toggle('active', parseInt(option.dataset.bet) === bet);
        });
        
        const spinAmountElement = document.getElementById('spinAmount');
        const quickSpinAmountElement = document.getElementById('quickSpinAmount');
        
        if (spinAmountElement) spinAmountElement.textContent = bet + ' ⭐';
        if (quickSpinAmountElement) quickSpinAmountElement.textContent = bet + ' ⭐';
    }

    toggleQuickSpin() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала войдите в систему');
            this.showAuthSection();
            return;
        }
        this.quickSpinMode = !this.quickSpinMode;
        const quickBtn = document.getElementById('quickSpinBtn');
        const spinBtn = document.getElementById('spinBtn');
        const toggleBtn = document.querySelector('.quick-toggle');
        
        if (this.quickSpinMode) {
            if (quickBtn) quickBtn.style.display = 'flex';
            if (spinBtn) spinBtn.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                toggleBtn.innerHTML = '⚡ Быстрая крутка (ВКЛ)';
            }
        } else {
            if (quickBtn) quickBtn.style.display = 'none';
            if (spinBtn) spinBtn.style.display = 'flex';
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleBtn.innerHTML = '⚡ Быстрая крутка';
            }
        }
    }

    disableBetSelection(disabled) {
        document.querySelectorAll('.bet-option').forEach(option => {
            option.classList.toggle('disabled', disabled);
            option.style.pointerEvents = disabled ? 'none' : 'auto';
        });
    }

    setInitialStickers() {
        ['bear', 'rose', 'ring'].forEach((sticker, index) => {
            this.updateReelSticker(index + 1, sticker);
        });
    }

    getWeightedRandomSticker(bet) {
        const weights = this.weights[bet];
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [sticker, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return sticker;
        }
        
        return Object.keys(weights)[0];
    }

    async spinSlot() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала войдите в систему');
            this.showAuthSection();
            return;
        }
        
        console.log('🎰 Начало прокрутки...');
        
        if (this.isSpinning) return;
        
        if (this.userBalance < this.currentBet) {
            this.showNotification('❌ Недостаточно звезд!');
            return;
        }

        this.isSpinning = true;
        this.disableBetSelection(true);
        
        const spinBtn = this.quickSpinMode ? document.getElementById('quickSpinBtn') : document.getElementById('spinBtn');
        if (spinBtn) spinBtn.disabled = true;

        try {
            const resultCombination = document.getElementById('resultCombination');
            const resultMessage = document.getElementById('resultMessage');
            
            if (resultCombination) resultCombination.style.display = 'none';
            if (resultMessage) resultMessage.textContent = '🎰 Крутим...';

            const spinDuration = this.quickSpinMode ? 1000 : 2000;
            const spinResult = await this.animateReels(spinDuration);
            const prize = this.checkWin(spinResult);
            
            const oldBalance = this.userBalance;
            
            // Списание ставки
            this.userBalance -= this.currentBet;
            this.gamesPlayed++;
            
            // Обновляем данные пользователя
            if (this.currentUser) {
                this.currentUser.balance = this.userBalance;
                this.saveUserToLocalStorage(this.currentUser);
            }

            console.log('💰 Списано ставки:', this.currentBet);
            console.log('💰 Баланс после списания:', this.userBalance);

            if (prize) {
                this.winsCount++;
                this.totalWon += prize.value;
                this.biggestWin = Math.max(this.biggestWin, prize.value);
                
                console.log('🎉 Выигрыш:', prize.name, 'на', prize.value, 'звезд');
                
                if (resultMessage) resultMessage.textContent = `🎉 Выигрыш: ${prize.name}!`;
                this.addToHistory(true, prize, this.currentBet);
                this.currentPrize = prize;
                
                // Отправляем только факт игры без уведомлений админу
                const gameData = {
                    action: 'game_result_silent',
                    user_id: this.userId,
                    bet_amount: this.currentBet,
                    win: true,
                    prize_name: prize.name,
                    prize_value: prize.value,
                    bot_type: this.currentBot,
                    username: this.currentUser?.username,
                    first_name: this.currentUser?.username,
                    domain: 'teal-lollipop-dfedaf'
                };
                this.sendToBot(gameData);
                
                setTimeout(() => this.showPrizeModal(prize), 1000);
            } else {
                console.log('❌ Проигрыш');
                if (resultMessage) resultMessage.textContent = '❌ Попробуйте еще раз!';
                this.addToHistory(false, null, this.currentBet);
                
                // Отправляем только факт игры без уведомлений админу
                const gameData = {
                    action: 'game_result_silent',
                    user_id: this.userId,
                    bet_amount: this.currentBet,
                    win: false,
                    bot_type: this.currentBot,
                    username: this.currentUser?.username,
                    first_name: this.currentUser?.username,
                    domain: 'teal-lollipop-dfedaf'
                };
                this.sendToBot(gameData);
            }
            
            console.log(`💰 Баланс изменился: ${oldBalance} -> ${this.userBalance}`);
            
            this.updateUI();
            await this.saveUserDataToDatabase();
            
            console.log('✅ Игра завершена, данные сохранены');
            
        } catch (error) {
            console.error('❌ Ошибка в процессе игры:', error);
            this.showNotification('❌ Ошибка при сохранении данных');
        } finally {
            this.isSpinning = false;
            if (spinBtn) spinBtn.disabled = false;
            this.disableBetSelection(false);
        }
    }

    async animateReels(spinDuration = 2000) {
        const reels = [1, 2, 3];
        const stickers = [];

        reels.forEach(reel => {
            const reelElement = document.getElementById(`reel${reel}`);
            if (reelElement) {
                reelElement.classList.add('spinning');
                this.animateReelSpinning(reel, spinDuration);
            }
        });

        await this.sleep(spinDuration);

        for (let i = 0; i < reels.length; i++) {
            const reelNumber = reels[i];
            const reelElement = document.getElementById(`reel${reelNumber}`);
            if (reelElement) {
                reelElement.classList.remove('spinning');
            }
            
            const sticker = this.getWeightedRandomSticker(this.currentBet);
            stickers.push(sticker);
            this.updateReelSticker(reelNumber, sticker);
            
            if (i < reels.length - 1) {
                await this.sleep(300);
            }
        }

        return stickers;
    }

    async animateReelSpinning(reelNumber, spinDuration) {
        const changeInterval = 100;
        const changes = spinDuration / changeInterval;
        
        for (let i = 0; i < changes; i++) {
            const reelElement = document.getElementById(`reel${reelNumber}`);
            if (!reelElement || !reelElement.classList.contains('spinning')) {
                break;
            }
            
            const availableStickers = Object.keys(this.weights[this.currentBet]);
            const randomSticker = availableStickers[Math.floor(Math.random() * availableStickers.length)];
            this.updateReelStickerQuick(reelNumber, randomSticker);
            await this.sleep(changeInterval);
        }
    }

    checkWin(spinResult) {
        const firstSticker = spinResult[0];
        if (spinResult.every(sticker => sticker === firstSticker)) {
            const prizeConfig = this.prizesConfig[this.currentBet][firstSticker];
            if (prizeConfig) {
                return {
                    name: prizeConfig.name,
                    value: prizeConfig.value,
                    sticker: firstSticker
                };
            }
        }
        return null;
    }

    showSection(section) {
        if (section !== 'auth' && !this.isLoggedIn) {
            this.showAuthSection();
            return;
        }

        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        const sectionElement = document.getElementById(section + '-section');
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItems = document.querySelectorAll('.nav-item');
        const sectionIndex = ['auth', 'history', 'casino', 'profile'].indexOf(section);
        if (sectionIndex !== -1 && navItems[sectionIndex]) {
            navItems[sectionIndex].classList.add('active');
        }
    }

    showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(f => {
            f.style.display = 'none';
        });
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).style.display = 'block';
    }

    showDepositModal() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала войдите в систему');
            this.showAuthSection();
            return;
        }

        this.selectedDepositAmount = 0;
        const selectedDeposit = document.getElementById('selectedDeposit');
        const confirmDeposit = document.getElementById('confirmDeposit');
        const depositModal = document.getElementById('depositModal');
        
        if (selectedDeposit) selectedDeposit.textContent = 'Выберите сумму для пополнения';
        if (confirmDeposit) confirmDeposit.disabled = true;
        
        document.querySelectorAll('.deposit-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        if (depositModal) depositModal.style.display = 'block';
    }

    closeDepositModal() {
        const depositModal = document.getElementById('depositModal');
        if (depositModal) depositModal.style.display = 'none';
    }

    selectDeposit(amount) {
        this.selectedDepositAmount = amount;
        
        document.querySelectorAll('.deposit-option').forEach(option => {
            option.classList.toggle('selected', parseInt(option.dataset.amount) === amount);
        });
        
        const selectedDeposit = document.getElementById('selectedDeposit');
        const confirmDeposit = document.getElementById('confirmDeposit');
        
        if (selectedDeposit) selectedDeposit.textContent = `Выбрано: ${amount} ⭐`;
        if (confirmDeposit) confirmDeposit.disabled = false;
    }

    closePrizeModal() {
        const prizeModal = document.getElementById('prizeModal');
        if (prizeModal) prizeModal.style.display = 'none';
        this.currentPrize = null;
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    createConfetti() {
        const confettiContainer = document.getElementById('confettiContainer');
        if (!confettiContainer) return;
        
        confettiContainer.innerHTML = '';
        
        const confettiCount = 100;
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confettiContainer.appendChild(confetti);
        }
        
        setTimeout(() => {
            confettiContainer.innerHTML = '';
        }, 5000);
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateProfileInfo() {
        if (!this.isLoggedIn || !this.currentUser) return;
        
        const profileName = document.getElementById('profileName');
        const profileId = document.getElementById('profileId');
        const profileBalance = document.getElementById('profileBalance');
        
        if (profileName) profileName.textContent = this.currentUser.username;
        if (profileId) profileId.textContent = this.currentUser.id;
        if (profileBalance) profileBalance.textContent = this.userBalance + ' ⭐';
        
        this.updateProfileStats();
    }
}

// Инициализация приложения
let casino;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, инициализация CasinoApp...');
    casino = new CasinoApp();
});

// Глобальные функции для вызова из HTML
function spinSlot() {
    if (casino) casino.spinSlot();
}

function selectBet(bet) {
    if (casino) casino.selectBet(parseInt(bet));
}

function showSection(section) {
    if (casino) casino.showSection(section);
}

function showAuthTab(tab) {
    if (casino) casino.showAuthTab(tab);
}

async function register() {
    if (!casino) return;
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const email = document.getElementById('regEmail').value;
    
    await casino.register(username, password, email);
}

async function login() {
    if (!casino) return;
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    await casino.login(username, password);
}

function logout() {
    if (casino) casino.logout();
}

function showDepositModal() {
    if (casino) casino.showDepositModal();
}

function closeDepositModal() {
    if (casino) casino.closeDepositModal();
}

function selectDeposit(amount) {
    if (casino) casino.selectDeposit(parseInt(amount));
}

function processDeposit() {
    if (casino) casino.processDeposit();
}

function closePrizeModal() {
    if (casino) casino.closePrizeModal();
}

function withdrawPrize() {
    if (casino) casino.withdrawPrize();
}

function sellPrize() {
    if (casino) casino.sellPrize();
}

function toggleQuickSpin() {
    if (casino) casino.toggleQuickSpin();
}

// Обработчики для свайпов (мобильные устройства)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold && casino && casino.isLoggedIn) {
        if (diff > 0) {
            const sections = ['history', 'casino', 'profile'];
            const currentSection = document.querySelector('.section.active').id.replace('-section', '');
            const currentIndex = sections.indexOf(currentSection);
            if (currentIndex < sections.length - 1) {
                showSection(sections[currentIndex + 1]);
            }
        } else {
            const sections = ['history', 'casino', 'profile'];
            const currentSection = document.querySelector('.section.active').id.replace('-section', '');
            const currentIndex = sections.indexOf(currentSection);
            if (currentIndex > 0) {
                showSection(sections[currentIndex - 1]);
            }
        }
    }
}

document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);

});
