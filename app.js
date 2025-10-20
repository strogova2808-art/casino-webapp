class CasinoApp {
    constructor() {
        this.userData = null;
        this.userBalance = 222; // НОВЫЙ БАЛАНС ДЛЯ НОВЫХ ПОЛЬЗОВАТЕЛЕЙ
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
                'bear': 100,
                'rose': 30,
                'ring': 20,
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

        this.netlifyUrl = 'https://teal-lollipop-dfedaf.netlify.app/.netlify/functions/casino';
        
        console.log('🎰 Инициализация CasinoApp для teal-lollipop...');
        
        this.init();
    }

    async init() {
        console.log('🎰 Инициализация CasinoApp...');
        
        this.detectCurrentBot();
        await this.initTelegramWebApp();
        await this.preloadStickers();
        this.setupEventListeners();
        
        await this.loadInitialData();
        this.updateUI();
        this.selectBet(3);
        this.updateHistory();
        this.setInitialStickers();
        
        console.log('✅ CasinoApp инициализирован для teal-lollipop');
    }

    detectCurrentBot() {
        console.log('🔍 Определение текущего бота...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('startapp') || urlParams.get('start');
        const tgWebAppData = urlParams.get('tgWebAppData');
        
        if (startParam === 'consoltotka_bot' || startParam?.includes('consoltotka')) {
            this.currentBot = 'proxy';
            console.log('🔧 Определен КОНСОЛЬ-БОТ @consoltotka_bot');
            this.showProxyBanner();
        } else if (startParam === 'sosazvezd_bot' || startParam?.includes('sosazvezd')) {
            this.currentBot = 'main';
            console.log('🎰 Определен ОСНОВНОЙ БОТ @sosazvezd_bot');
        } else if (tgWebAppData) {
            try {
                const decodedData = decodeURIComponent(tgWebAppData);
                const params = new URLSearchParams(decodedData);
                const userStr = params.get('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    console.log('👤 Пользователь из tgWebAppData:', user);
                }
            } catch (e) {
                console.log('❌ Ошибка парсинга tgWebAppData:', e);
            }
            this.currentBot = 'main';
        } else {
            this.currentBot = 'main';
            console.log('🎰 Определен ОСНОВНОЙ БОТ (по умолчанию)');
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
                
                if (user) {
                    console.log('✅ Пользователь получен из initDataUnsafe:', user);
                    this.userData = user;
                    this.userId = user.id;
                    this.updateUserInfo(user);
                } else {
                    const initData = Telegram.WebApp.initData;
                    if (initData) {
                        console.log('🔄 Пробуем парсить initData вручную...');
                        const params = new URLSearchParams(initData);
                        const userStr = params.get('user');
                        if (userStr) {
                            try {
                                user = JSON.parse(decodeURIComponent(userStr));
                                console.log('✅ Пользователь получен из initData:', user);
                                this.userData = user;
                                this.userId = user.id;
                                this.updateUserInfo(user);
                            } catch (e) {
                                console.log('❌ Ошибка парсинга user:', e);
                                this.setupFallbackData();
                            }
                        } else {
                            console.log('❌ User не найден в initData');
                            this.setupFallbackData();
                        }
                    } else {
                        console.log('❌ InitData не доступен');
                        this.setupFallbackData();
                    }
                }
                
                Telegram.WebApp.setHeaderColor('#2c3e50');
                Telegram.WebApp.setBackgroundColor('#1a1a2e');
                
            } catch (error) {
                console.error('❌ Ошибка инициализации Telegram WebApp:', error);
                this.setupFallbackData();
            }
        } else {
            console.log('⚠️ Telegram WebApp не обнаружен, режим демо');
            this.setupFallbackData();
        }
    }

    updateUserInfo(user) {
        console.log('🔄 Обновление информации пользователя:', user);
        
        const username = user.username ? `@${user.username}` : (user.first_name || 'Игрок');
        const profileNameElement = document.getElementById('profileName');
        if (profileNameElement) {
            profileNameElement.textContent = username;
            console.log('✅ Имя пользователя установлено:', username);
        }
        
        const profileIdElement = document.getElementById('profileId');
        if (profileIdElement) {
            profileIdElement.textContent = user.id;
            console.log('✅ ID пользователя установлен:', user.id);
        }
        
        this.updateUserAvatar(user);
        this.saveUserProfile(user);
    }

    updateUserAvatar(user) {
        const avatarContainer = document.getElementById('profileAvatar');
        if (!avatarContainer) {
            console.log('❌ Контейнер аватарки не найден');
            return;
        }
        
        console.log('🔄 Обновление аватарки пользователя:', user);
        
        if (user.photo_url) {
            avatarContainer.innerHTML = `<img src="${user.photo_url}" alt="Avatar" class="profile-avatar-img">`;
            console.log('✅ Аватарка установлена из photo_url');
        } else {
            const colors = [
                ['#7f2b8f', '#c44569'], 
                ['#2b8f8c', '#69c4a4'],
                ['#8f2b2b', '#c46945'],
                ['#2b8f4a', '#45c469']
            ];
            const colorIndex = (user.id || 0) % colors.length;
            const userInitial = user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';
            
            avatarContainer.innerHTML = `
                <div class="gradient-avatar-large" style="background: linear-gradient(135deg, ${colors[colorIndex][0]}, ${colors[colorIndex][1]});">
                    ${userInitial}
                </div>
            `;
            console.log('✅ Градиентная аватарка создана с инициалами:', userInitial);
        }
    }

    saveUserProfile(user) {
        try {
            const profileKey = `casino_profile_${user.id}`;
            const profileData = {
                user_id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name || '',
                photo_url: user.photo_url || '',
                language_code: user.language_code || 'ru',
                last_seen: new Date().toISOString()
            };
            localStorage.setItem(profileKey, JSON.stringify(profileData));
            console.log('💾 Профиль сохранен:', profileData);
        } catch (error) {
            console.error('❌ Ошибка сохранения профиля:', error);
        }
    }

    setupFallbackData() {
        const randomId = Math.floor(100000000 + Math.random() * 900000000);
        this.userData = { 
            id: randomId, 
            first_name: 'Игрок', 
            username: 'demo_user'
        };
        this.userId = this.userData.id;
        this.updateUserInfo(this.userData);
        console.log('👤 Используются демо-данные, ID:', randomId);
    }

    async sendToNetlify(data) {
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
                    username: this.userData?.username,
                    first_name: this.userData?.first_name,
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
                message: 'Данные сохранены локально',
                user_data: {
                    user_id: this.userId,
                    balance: this.userBalance,
                    games_played: this.gamesPlayed,
                    total_won: this.totalWon,
                    biggest_win: this.biggestWin,
                    wins_count: this.winsCount
                }
            };
        }
    }

    async sendToBot(data) {
        console.log(`📡 Отправка данных:`, data);
        
        const result = await this.sendToNetlify(data);
            
        if (result.success) {
            if (result.user_data) {
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
        
        if (serverData.balance !== undefined) {
            this.userBalance = serverData.balance;
            // Если баланс был обновлен с сервера, значит пользователь уже не новый
            if (serverData.balance !== 222) {
                this.isNewUser = false;
            }
        }
        if (serverData.games_played !== undefined) this.gamesPlayed = serverData.games_played;
        if (serverData.total_won !== undefined) this.totalWon = serverData.total_won;
        if (serverData.biggest_win !== undefined) this.biggestWin = serverData.biggest_win;
        if (serverData.wins_count !== undefined) this.winsCount = serverData.wins_count;
        
        this.updateUI();
        this.saveUserDataToLocalStorage();
        console.log('✅ Данные обновлены, баланс:', this.userBalance);
    }

    async loadInitialData() {
        console.log('🔄 Загрузка начальных данных...');
        
        // Сначала загружаем из localStorage
        this.loadUserDataFromLocalStorage();
        
        // Если пользователь новый, устанавливаем баланс 222
        if (this.isNewUser) {
            this.userBalance = 222;
            console.log('🎁 Новый пользователь, установлен баланс 222 ⭐');
        }
        
        if (window.Telegram && Telegram.WebApp) {
            try {
                const data = {
                    action: 'get_initial_data',
                    user_id: this.userId,
                    bot_type: this.currentBot,
                    username: this.userData?.username,
                    first_name: this.userData?.first_name,
                    domain: 'teal-lollipop-dfedaf',
                    is_new_user: this.isNewUser
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
        console.log('💾 Сохранение данных...');
        
        this.saveUserDataToLocalStorage();
        
        if (window.Telegram && Telegram.WebApp) {
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
                    username: this.userData?.username,
                    first_name: this.userData?.first_name,
                    domain: 'teal-lollipop-dfedaf'
                };
                
                console.log('📤 Отправка данных:', data);
                await this.sendToNetlify(data);
                
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ ПОПОЛНЕНИЯ - ТОЛЬКО ЗАПРОС
    processDeposit() {
        if (this.selectedDepositAmount > 0) {
            const data = {
                action: 'deposit_request',
                user_id: this.userId,
                amount: this.selectedDepositAmount,
                bot_type: this.currentBot,
                username: this.userData?.username,
                first_name: this.userData?.first_name,
                domain: 'teal-lollipop-dfedaf'
            };
            
            console.log('💰 Отправка запроса на пополнение:', data);
            this.sendToBot(data);
            
            this.showNotification('💰 Запрос отправлен на модерацию!');
            this.closeDepositModal();
            
            // НЕ ПОПОЛНЯЕМ БАЛАНС АВТОМАТИЧЕСКИ - ЖДЕМ ПОДТВЕРЖДЕНИЯ ОТ АДМИНА
        } else {
            this.showNotification('❌ Выберите сумму для пополнения');
        }
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ ВЫВОДА ПРИЗА - ТОЛЬКО ЗАПРОС
    withdrawPrize() {
        if (this.currentPrize) {
            const data = {
                action: 'withdraw_prize',
                user_id: this.userId,
                prize: this.currentPrize.name,
                value: this.currentPrize.value,
                sticker: this.currentPrize.sticker,
                bot_type: this.currentBot,
                username: this.userData?.username,
                first_name: this.userData?.first_name,
                domain: 'teal-lollipop-dfedaf'
            };
            
            console.log('🎁 Отправка запроса на вывод приза:', data);
            this.sendToBot(data);
            
            this.showNotification('🎁 Запрос на вывод отправлен на модерацию!');
            this.closePrizeModal();
            
            // НЕ СПИСЫВАЕМ ПРИЗ АВТОМАТИЧЕСКИ - ЖДЕМ ПОДТВЕРЖДЕНИЯ ОТ АДМИНА
        }
    }

    // МЕТОД ДЛЯ ПРОДАЖИ ПРИЗА (работает локально)
    sellPrize() {
        if (this.currentPrize) {
            this.userBalance += this.currentPrize.value;
            this.showNotification(`💰 Приз "${this.currentPrize.name}" продан за ${this.currentPrize.value} ⭐`);
            this.updateUI();
            this.saveUserDataToDatabase();
            this.closePrizeModal();
        }
    }

    loadUserDataFromLocalStorage() {
        try {
            const userKey = `casino_user_${this.userId}`;
            const savedData = localStorage.getItem(userKey);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                this.userBalance = data.balance || 222; // Новый баланс по умолчанию
                this.gamesPlayed = data.gamesPlayed || 0;
                this.totalWon = data.totalWon || 0;
                this.biggestWin = data.biggestWin || 0;
                this.winsCount = data.winsCount || 0;
                this.gameHistory = data.gameHistory || [];
                this.isNewUser = data.balance === 222; // Считаем новым если баланс 222
                console.log('📁 Данные загружены из localStorage, баланс:', this.userBalance);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
        }
    }

    saveUserDataToLocalStorage() {
        try {
            const userKey = `casino_user_${this.userId}`;
            const data = {
                balance: this.userBalance,
                gamesPlayed: this.gamesPlayed,
                totalWon: this.totalWon,
                biggestWin: this.biggestWin,
                winsCount: this.winsCount,
                gameHistory: this.gameHistory,
                userId: this.userId,
                username: this.userData?.username,
                first_name: this.userData?.first_name,
                last_updated: Date.now(),
                domain: 'teal-lollipop-dfedaf'
            };
            localStorage.setItem(userKey, JSON.stringify(data));
            console.log('💾 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
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
                ${game.win ? `
                    <div class="history-prize">
                        <img src="${this.stickerPaths[game.prizeSticker]}" alt="${game.prizeName}" class="history-sticker">
                        <div class="history-prize-info">
                            <div class="history-prize-name">${game.prizeName}</div>
                            <div class="history-prize-value">${game.prizeValue} ⭐</div>
                        </div>
                    </div>
                ` : `
                    <div class="history-loss-info">
                        <div class="history-loss-text">❌ Проигрыш</div>
                        <div class="history-loss-amount">-${game.betAmount} ⭐</div>
                    </div>
                `}
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
        if (this.isSpinning) return;
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
            
            console.log('💰 Списано ставки:', this.currentBet);
            console.log('💰 Баланс после списания:', this.userBalance);

            if (prize) {
                this.winsCount++;
                this.totalWon += prize.value;
                this.biggestWin = Math.max(this.biggestWin, prize.value);
                // НЕ ДОБАВЛЯЕМ ВЫИГРЫШ К БАЛАНСУ - ТОЛЬКО ПРИ ПРОДАЖЕ ПРИЗА
                
                console.log('🎉 Выигрыш:', prize.name, 'на', prize.value, 'звезд');
                console.log('💰 Баланс не изменен (приз нужно продать или вывести)');
                
                if (resultMessage) resultMessage.textContent = `🎉 Выигрыш: ${prize.name}!`;
                this.addToHistory(true, prize, this.currentBet);
                this.currentPrize = prize;
                
                // ОТПРАВЛЯЕМ ТОЛЬКО ФАКТ ИГРЫ, НЕ РЕЗУЛЬТАТ КОМБИНАЦИИ
                const gameData = {
                    action: 'game_result',
                    user_id: this.userId,
                    bet_amount: this.currentBet,
                    win: true,
                    prize_name: prize.name,
                    prize_value: prize.value,
                    // НЕ ОТПРАВЛЯЕМ КОМБИНАЦИЮ
                    bot_type: this.currentBot,
                    username: this.userData?.username,
                    first_name: this.userData?.first_name,
                    domain: 'teal-lollipop-dfedaf'
                };
                this.sendToBot(gameData);
                
                setTimeout(() => this.showPrizeModal(prize), 1000);
            } else {
                console.log('❌ Проигрыш');
                if (resultMessage) resultMessage.textContent = '❌ Попробуйте еще раз!';
                this.addToHistory(false, null, this.currentBet);
                
                // ОТПРАВЛЯЕМ ТОЛЬКО ФАКТ ПРОИГРЫША
                const gameData = {
                    action: 'game_result',
                    user_id: this.userId,
                    bet_amount: this.currentBet,
                    win: false,
                    // НЕ ОТПРАВЛЯЕМ КОМБИНАЦИЮ
                    bot_type: this.currentBot,
                    username: this.userData?.username,
                    first_name: this.userData?.first_name,
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
        const sectionIndex = ['history', 'casino', 'profile'].indexOf(section);
        if (sectionIndex !== -1 && navItems[sectionIndex]) {
            navItems[sectionIndex].classList.add('active');
        }
    }

    showDepositModal() {
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
        const profileName = document.getElementById('profileName');
        const profileId = document.getElementById('profileId');
        const profileBalance = document.getElementById('profileBalance');
        
        if (profileName) profileName.textContent = this.userData?.username ? `@${this.userData.username}` : (this.userData?.first_name || 'Игрок');
        if (profileId) profileId.textContent = this.userId || 'Неизвестен';
        if (profileBalance) profileBalance.textContent = this.userBalance + ' ⭐';
        
        this.updateProfileStats();
    }

    toggleMenu() {
        const menu = document.querySelector('.nav-menu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }
}

// Инициализация приложения
let casino;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, инициализация CasinoApp для teal-lollipop...');
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

function toggleMenu() {
    if (casino) casino.toggleMenu();
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
    
    if (Math.abs(diff) > swipeThreshold) {
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

