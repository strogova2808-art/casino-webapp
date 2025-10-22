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
        this.isOnline = true;
        this.isLoggedIn = false;
        this.selectedNft = null;
        
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

        // NFT Маркетплейс
        this.nftCatalog = {
            'golden_dragon': {
                id: 'nft_001',
                name: 'Golden Dragon',
                description: 'Мифический золотой дракон с анимацией огня',
                type: 'animated',
                rarity: 'legendary',
                price: 500,
                creator: 'DigitalArtStudio',
                supply: 100,
                sold: 23,
                image: './stickers/bear.gif',
                attributes: {
                    animation: true,
                    limited: true
                }
            },
            'crystal_rose': {
                id: 'nft_002',
                name: 'Crystal Rose',
                description: 'Хрустальная роза с мерцающими бликами',
                type: 'animated',
                rarity: 'epic',
                price: 250,
                creator: 'CrystalArts',
                supply: 500,
                sold: 156,
                image: './stickers/rose.gif',
                attributes: {
                    animation: true,
                    sparkle: true
                }
            },
            'magic_ring': {
                id: 'nft_003',
                name: 'Magic Ring',
                description: 'Волшебное кольцо с сияющими камнями',
                type: 'animated',
                rarity: 'rare',
                price: 150,
                creator: 'MagicForge',
                supply: 1000,
                sold: 423,
                image: './stickers/ring.gif',
                attributes: {
                    animation: true,
                    magical: true
                }
            },
            'space_rocket': {
                id: 'nft_004',
                name: 'Space Rocket',
                description: 'Космическая ракета с анимацией полета',
                type: 'animated',
                rarity: 'common',
                price: 75,
                creator: 'SpaceTech',
                supply: 5000,
                sold: 1892,
                image: './stickers/rocket.gif',
                attributes: {
                    animation: true
                }
            }
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
        
        // Проверяем авторизацию - НЕТ автоматической регистрации
        this.checkAuth();
        
        this.updateUI();
        this.selectBet(3);
        this.updateHistory();
        this.setInitialStickers();
        this.renderNFTCatalog();
        
        console.log('✅ CasinoApp инициализирован');
    }

    // ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP
    async initTelegramWebApp() {
        if (window.Telegram && Telegram.WebApp) {
            console.log('📱 Инициализация Telegram WebApp...');
            
            try {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                
                // НЕ регистрируем автоматически!
                // Пользователь сам решит когда авторизоваться
                
                Telegram.WebApp.setHeaderColor('#2c3e50');
                Telegram.WebApp.setBackgroundColor('#1a1a2e');
                
            } catch (error) {
                console.error('❌ Ошибка инициализации Telegram WebApp:', error);
            }
        } else {
            console.log('⚠️ Telegram WebApp не обнаружен');
        }
    }

    // РУЧНАЯ АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЕМ
    async loginWithTelegram() {
        console.log('🔐 Пользователь нажал кнопку авторизации');
        
        if (window.Telegram && Telegram.WebApp) {
            try {
                const user = Telegram.WebApp.initDataUnsafe?.user;
                
                if (user) {
                    console.log('✅ Пользователь найден в WebApp:', user);
                    await this.handleTelegramUser(user);
                } else {
                    console.log('❌ Пользователь не авторизован в WebApp');
                    this.showNotification('❌ Не удалось получить данные пользователя. Попробуйте еще раз.');
                }
            } catch (error) {
                console.error('❌ Ошибка авторизации:', error);
                this.showNotification('❌ Ошибка авторизации');
            }
        } else {
            this.showNotification('⚠️ Откройте приложение через Telegram');
        }
    }

    async handleTelegramUser(tgUser) {
        try {
            const userData = {
                id: tgUser.id.toString(),
                username: tgUser.username || `user_${tgUser.id}`,
                first_name: tgUser.first_name || 'Пользователь',
                last_name: tgUser.last_name || '',
                language_code: tgUser.language_code || 'ru',
                is_premium: tgUser.is_premium || false,
                photo_url: tgUser.photo_url || '',
                balance: 222,
                games_played: 0,
                total_won: 0,
                biggest_win: 0,
                wins_count: 0,
                inventory: [],
                transactions: [],
                registered_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            };

            this.saveUserToLocalStorage(userData);
            this.userData = userData;
            this.isLoggedIn = true;
            this.userId = userData.id;
            this.userBalance = userData.balance;

            // Отправляем данные о регистрации в бота
            await this.sendRegistrationToBot(userData);

            this.showNotification(`✅ Добро пожаловать, ${userData.first_name}!`);
            this.showCasinoInterface();
            this.updateUserDisplay();
            
        } catch (error) {
            console.error('Ошибка обработки пользователя:', error);
            this.showNotification('❌ Ошибка создания профиля');
        }
    }

    async sendRegistrationToBot(userData) {
        try {
            // Отправляем данные в бота через WebApp
            if (window.Telegram && Telegram.WebApp) {
                const data = {
                    action: 'register_telegram_user',
                    user_id: userData.id,
                    username: userData.username,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    language_code: userData.language_code,
                    is_premium: userData.is_premium,
                    photo_url: userData.photo_url,
                    balance: userData.balance,
                    registered_at: userData.registered_at,
                    bot_type: 'main'
                };

                // Отправляем данные в бота
                Telegram.WebApp.sendData(JSON.stringify(data));
                console.log('📨 Данные регистрации отправлены в бота');
            }
        } catch (error) {
            console.error('❌ Ошибка отправки данных в бота:', error);
        }
    }

    // ПРОВЕРКА АВТОРИЗАЦИИ
    checkAuth() {
        const savedUser = localStorage.getItem('casino_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                this.userData = userData;
                this.isLoggedIn = true;
                this.userId = userData.id;
                this.userBalance = userData.balance;
                this.gamesPlayed = userData.games_played || 0;
                this.totalWon = userData.total_won || 0;
                this.biggestWin = userData.biggest_win || 0;
                this.winsCount = userData.wins_count || 0;
                this.gameHistory = userData.gameHistory || [];
                
                this.showCasinoInterface();
                this.updateUserDisplay();
                console.log('✅ Пользователь авторизован');
            } catch (e) {
                console.error('❌ Ошибка загрузки пользователя:', e);
                this.showWelcomeInterface();
            }
        } else {
            this.showWelcomeInterface();
        }
    }

    // ПОКАЗ ИНТЕРФЕЙСОВ
    showWelcomeInterface() {
        document.getElementById('welcome-section').classList.add('active');
        document.getElementById('casino-section').classList.remove('active');
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        this.isLoggedIn = false;
    }

    showCasinoInterface() {
        document.getElementById('welcome-section').classList.remove('active');
        document.getElementById('casino-section').classList.add('active');
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        this.isLoggedIn = true;
    }

    // ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
    updateUserDisplay() {
        if (this.isLoggedIn && this.userData) {
            // Показываем профиль пользователя
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('userProfile').style.display = 'block';
            
            // Обновляем аватар
            const avatarImg = document.getElementById('userAvatarImg');
            const avatarFallback = document.getElementById('avatarFallback');
            const profileAvatar = document.getElementById('profileAvatarInitial');
            
            if (this.userData.photo_url) {
                avatarImg.src = this.userData.photo_url;
                avatarImg.style.display = 'block';
                avatarFallback.style.display = 'none';
            } else {
                avatarImg.style.display = 'none';
                avatarFallback.style.display = 'flex';
                avatarFallback.textContent = this.userData.first_name.charAt(0).toUpperCase();
                profileAvatar.textContent = this.userData.first_name.charAt(0).toUpperCase();
            }
            
            // Обновляем информацию
            document.getElementById('userName').textContent = this.userData.first_name;
            document.getElementById('userUsername').textContent = '@' + (this.userData.username || 'user');
            document.getElementById('userId').textContent = this.userData.id;
            document.getElementById('panelBalance').textContent = this.userBalance + ' ⭐';
            
            this.updateProfileStats();
        } else {
            // Показываем секцию авторизации
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('userProfile').style.display = 'none';
        }
    }

    // ВЫХОД
    logout() {
        this.userData = null;
        this.isLoggedIn = false;
        this.userId = null;
        this.userBalance = 0;
        localStorage.removeItem('casino_user');
        this.showNotification('👋 До свидания!');
        this.toggleProfilePanel(false);
        this.showWelcomeInterface();
    }

    // ОСТАЛЬНЫЕ ФУНКЦИИ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ
    saveUserToLocalStorage(userData) {
        try {
            localStorage.setItem('casino_user', JSON.stringify(userData));
            console.log('💾 Пользователь сохранен локально');
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователя:', error);
        }
    }

    updateProfileStats() {
        const elements = {
            games: document.getElementById('panelGames'),
            winrate: document.getElementById('panelWinrate'),
            totalWon: document.getElementById('panelTotalWon'),
            record: document.getElementById('panelRecord')
        };
        
        if (elements.games) elements.games.textContent = this.gamesPlayed;
        
        const winrate = this.gamesPlayed > 0 ? Math.round((this.winsCount / this.gamesPlayed) * 100) : 0;
        if (elements.winrate) elements.winrate.textContent = winrate + '%';
        if (elements.totalWon) elements.totalWon.textContent = this.formatNumber(this.totalWon) + ' ⭐';
        if (elements.record) elements.record.textContent = this.formatNumber(this.biggestWin) + ' ⭐';
    }

    // ПРОФИЛЬ ПАНЕЛЬ
    toggleProfilePanel(show = null) {
        const panel = document.getElementById('profilePanel');
        if (show === null) {
            show = !panel.classList.contains('active');
        }
        
        if (show) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    }

    // NFT МАРКЕТПЛЕЙС
    renderNFTCatalog() {
        const container = document.getElementById('nftCatalog');
        if (!container) return;

        container.innerHTML = Object.values(this.nftCatalog).map(nft => `
            <div class="nft-card">
                <div class="nft-badge ${nft.rarity}">${nft.rarity}</div>
                <img src="${nft.image}" alt="${nft.name}" class="nft-image">
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-description">${nft.description}</div>
                    <div class="nft-creator">Создатель: ${nft.creator}</div>
                    <div class="nft-supply">Осталось: ${nft.supply - nft.sold}/${nft.supply}</div>
                    <div class="nft-price">
                        <span class="price-amount">${nft.price} ⭐</span>
                        <button class="buy-btn" onclick="casino.showBuyModal('${nft.id}')">
                            Купить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showBuyModal(nftId) {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь через Telegram');
            this.toggleProfilePanel(true);
            return;
        }

        const nft = Object.values(this.nftCatalog).find(n => n.id === nftId);
        if (!nft) return;

        this.selectedNft = nft;

        const modal = document.getElementById('buyNftModal');
        const preview = document.getElementById('nftPreview');
        
        preview.innerHTML = `
            <img src="${nft.image}" alt="${nft.name}" class="preview-image">
            <div class="preview-name">${nft.name}</div>
            <div class="preview-rarity ${nft.rarity}">${nft.rarity}</div>
            <div class="preview-description">${nft.description}</div>
        `;

        document.getElementById('nftPrice').textContent = nft.price + ' ⭐';
        modal.style.display = 'block';
    }

    closeBuyModal() {
        document.getElementById('buyNftModal').style.display = 'none';
        this.selectedNft = null;
    }

    async buyNFT() {
        if (!this.selectedNft || !this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь');
            return;
        }

        const nft = this.selectedNft;
        
        if (this.userBalance < nft.price) {
            this.showNotification('❌ Недостаточно звезд для покупки');
            return;
        }

        try {
            // Списание средств
            this.userBalance -= nft.price;
            
            // Обновляем данные пользователя
            if (this.userData) {
                this.userData.balance = this.userBalance;
                this.saveUserToLocalStorage(this.userData);
            }

            // Отправка данных о покупке
            const purchaseData = {
                action: 'nft_purchase',
                user_id: this.userId,
                nft_id: nft.id,
                nft_name: nft.name,
                price: nft.price,
                bot_type: this.currentBot
            };
            await this.sendToBot(purchaseData);

            this.showNotification(`✅ NFT "${nft.name}" куплен!`);
            this.closeBuyModal();
            this.updateUserDisplay();
            
        } catch (error) {
            console.error('❌ Ошибка покупки NFT:', error);
            this.showNotification('❌ Ошибка при покупке');
        }
    }

    // КАЗИНО ФУНКЦИИ
    async spinSlot() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь через Telegram');
            this.toggleProfilePanel(true);
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
            if (this.userData) {
                this.userData.balance = this.userBalance;
                this.userData.games_played = this.gamesPlayed;
                this.saveUserToLocalStorage(this.userData);
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
                
                // Отправляем данные о выигрыше
                const gameData = {
                    action: 'game_result_silent',
                    user_id: this.userId,
                    bet_amount: this.currentBet,
                    win: true,
                    prize_name: prize.name,
                    prize_value: prize.value,
                    bot_type: this.currentBot
                };
                this.sendToBot(gameData);
                
                setTimeout(() => this.showPrizeModal(prize), 1000);
            } else {
                console.log('❌ Проигрыш');
                if (resultMessage) resultMessage.textContent = '❌ Попробуйте еще раз!';
                this.addToHistory(false, null, this.currentBet);
                
                const gameData = {
                    action: 'game_result_silent',
                    user_id: this.userId,
                    bet_amount: this.currentBet,
                    win: false,
                    bot_type: this.currentBot
                };
                this.sendToBot(gameData);
            }
            
            console.log(`💰 Баланс изменился: ${oldBalance} -> ${this.userBalance}`);
            
            this.updateUserDisplay();
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

    // ОСТАЛЬНЫЕ МЕТОДЫ (animateReels, checkWin, updateReelSticker и т.д.)
    // ... остальной код без изменений

    // СЕТЕВЫЕ ФУНКЦИИ
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
        
        if (serverData.balance !== undefined && this.userData) {
            this.userBalance = serverData.balance;
            this.userData.balance = serverData.balance;
            this.saveUserToLocalStorage(this.userData);
        }
        
        this.updateUserDisplay();
        console.log('✅ Данные обновлены, баланс:', this.userBalance);
    }

    async saveUserDataToDatabase() {
        if (!this.isLoggedIn) return;
        
        console.log('💾 Сохранение данных...');
        
        if (this.isOnline && this.userData) {
            try {
                const data = {
                    action: 'update_balance',
                    user_id: this.userId,
                    balance: this.userBalance,
                    games_played: this.gamesPlayed,
                    total_won: this.totalWon,
                    biggest_win: this.biggestWin,
                    wins_count: this.winsCount,
                    bot_type: this.currentBot
                };
                
                console.log('📤 Отправка данных:', data);
                await this.sendToNetlify(data);
                
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }
    }

    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
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
        const statusText = document.getElementById('statusText');
        if (statusElement) {
            statusElement.className = online ? 'status-dot' : 'status-dot offline';
        }
        if (statusText) {
            statusText.textContent = online ? 'онлайн' : 'офлайн';
        }
    }

    checkOnlineStatus() {
        this.isOnline = navigator.onLine;
        console.log('🌐 Статус соединения:', this.isOnline ? 'онлайн' : 'офлайн');
        this.updateOnlineStatus(this.isOnline);
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
        // ... код баннера
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

    // ... остальные методы без изменений

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
            this.showNotification('❌ Сначала авторизуйтесь через Telegram');
            this.toggleProfilePanel(true);
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

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // МОДАЛЬНЫЕ ОКНА И УВЕДОМЛЕНИЯ
    showDepositModal() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь через Telegram');
            this.toggleProfilePanel(true);
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

    processDeposit() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь');
            return;
        }

        if (this.selectedDepositAmount > 0) {
            const data = {
                action: 'deposit_request',
                user_id: this.userId,
                amount: this.selectedDepositAmount,
                bot_type: this.currentBot
            };
            
            console.log('💰 Отправка запроса на пополнение:', data);
            
            this.sendToBot(data).then(success => {
                if (success) {
                    this.updateUserDisplay();
                    this.showNotification(`✅ Баланс пополнен на ${this.selectedDepositAmount} ⭐`);
                    this.closeDepositModal();
                }
            });
        } else {
            this.showNotification('❌ Выберите сумму для пополнения');
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

    closePrizeModal() {
        const prizeModal = document.getElementById('prizeModal');
        if (prizeModal) prizeModal.style.display = 'none';
        this.currentPrize = null;
    }

    withdrawPrize() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь');
            return;
        }

        if (this.currentPrize) {
            const data = {
                action: 'withdraw_prize',
                user_id: this.userId,
                prize: this.currentPrize.name,
                value: this.currentPrize.value,
                sticker: this.currentPrize.sticker,
                bot_type: this.currentBot
            };
            
            console.log('🎁 Отправка запроса на вывод приза:', data);
            this.sendToBot(data);
            
            this.showNotification('🎁 Запрос на вывод отправлен на модерацию!');
            this.closePrizeModal();
        }
    }

    sellPrize() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь');
            return;
        }

        if (this.currentPrize) {
            this.userBalance += this.currentPrize.value;
            if (this.userData) {
                this.userData.balance = this.userBalance;
                this.saveUserToLocalStorage(this.userData);
            }
            this.showNotification(`💰 Приз "${this.currentPrize.name}" продан за ${this.currentPrize.value} ⭐`);
            this.updateUserDisplay();
            this.saveUserDataToDatabase();
            this.closePrizeModal();
        }
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

    // НАВИГАЦИЯ
    showSection(section) {
        if (!this.isLoggedIn && section !== 'welcome') {
            this.showNotification('❌ Сначала авторизуйтесь через Telegram');
            this.toggleProfilePanel(true);
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
        const sectionIndex = ['history', 'casino', 'market'].indexOf(section);
        if (sectionIndex !== -1 && navItems[sectionIndex]) {
            navItems[sectionIndex].classList.add('active');
        }
    }

    updateUI() {
        this.updateUserDisplay();
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

function toggleProfilePanel(show) {
    if (casino) casino.toggleProfilePanel(show);
}

function loginWithTelegram() {
    if (casino) casino.loginWithTelegram();
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

function showBuyModal(nftId) {
    if (casino) casino.showBuyModal(nftId);
}

function closeBuyModal() {
    if (casino) casino.closeBuyModal();
}

function buyNFT() {
    if (casino) casino.buyNFT();
}

// Обработчики для свайпов
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
        const sections = ['history', 'casino', 'market'];
        const currentSection = document.querySelector('.section.active').id.replace('-section', '');
        const currentIndex = sections.indexOf(currentSection);
        
        if (diff > 0 && currentIndex < sections.length - 1) {
            // Свайп влево
            showSection(sections[currentIndex + 1]);
        } else if (diff < 0 && currentIndex > 0) {
            // Свайп вправо
            showSection(sections[currentIndex - 1]);
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
