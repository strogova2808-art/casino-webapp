class NFTMarketplace {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.userBalance = 0;
        this.userInventory = [];
        this.transactions = [];
        this.selectedNft = null;
        this.selectedDepositAmount = 0;
        
        this.netlifyUrl = 'https://teal-lollipop-dfedaf.netlify.app/.netlify/functions/casino';
        
        this.init();
    }

    async init() {
        await this.loadNFTCatalog();
        this.setupEventListeners();
        this.checkAuth();
        this.updateMarketplaceStats();
    }

    // Telegram авторизация
    async initTelegramAuth() {
        if (window.Telegram && Telegram.WebApp) {
            try {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                
                const user = Telegram.WebApp.initDataUnsafe?.user;
                if (user) {
                    await this.handleTelegramUser(user);
                } else {
                    this.showNotification('❌ Не удалось получить данные пользователя');
                }
            } catch (error) {
                console.error('Ошибка Telegram авторизации:', error);
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
                balance: 500, // Начальный баланс
                inventory: [],
                transactions: [],
                registered_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            };

            // Сохраняем пользователя локально
            this.saveUserToLocalStorage(userData);
            this.currentUser = userData;
            this.isLoggedIn = true;
            this.userBalance = userData.balance;

            // Отправляем данные на сервер
            await this.registerUserInDatabase(userData);

            this.showNotification(`✅ Добро пожаловать, ${userData.first_name}!`);
            this.showSection('marketplace');
            this.updateUserDisplay();
            
        } catch (error) {
            console.error('Ошибка обработки пользователя:', error);
            this.showNotification('❌ Ошибка создания профиля');
        }
    }

    async registerUserInDatabase(userData) {
        try {
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

            const response = await this.sendToNetlify(data);
            console.log('✅ Пользователь зарегистрирован в базе:', response);
            
        } catch (error) {
            console.error('❌ Ошибка регистрации в базе:', error);
        }
    }

    // Проверка авторизации
    checkAuth() {
        const savedUser = localStorage.getItem('nft_marketplace_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isLoggedIn = true;
                this.userBalance = this.currentUser.balance;
                this.userInventory = this.currentUser.inventory || [];
                this.showSection('marketplace');
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

    saveUserToLocalStorage(userData) {
        try {
            localStorage.setItem('nft_marketplace_user', JSON.stringify(userData));
            console.log('💾 Пользователь сохранен локально');
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователя:', error);
        }
    }

    // Навигация
    showSection(section) {
        if (section !== 'auth' && !this.isLoggedIn) {
            this.showAuthSection();
            return;
        }

        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const sectionElement = document.getElementById(section + '-section');
        if (sectionElement) {
            sectionElement.classList.add('active');
        }

        const sectionIndex = ['marketplace', 'inventory', 'profile'].indexOf(section);
        const navItems = document.querySelectorAll('.nav-item');
        if (sectionIndex !== -1 && navItems[sectionIndex]) {
            navItems[sectionIndex].classList.add('active');
        }

        // Обновляем данные при переключении разделов
        if (section === 'marketplace') {
            this.renderNFTCatalog();
        } else if (section === 'inventory') {
            this.renderInventory();
        }
    }

    showAuthSection() {
        this.showSection('auth');
        this.isLoggedIn = false;
    }

    // Выход из системы
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.userBalance = 0;
        this.userInventory = [];
        localStorage.removeItem('nft_marketplace_user');
        this.showNotification('👋 До свидания!');
        this.closeLogoutModal();
        this.showAuthSection();
    }

    showLogoutConfirm() {
        document.getElementById('logoutModal').style.display = 'block';
    }

    closeLogoutModal() {
        document.getElementById('logoutModal').style.display = 'none';
    }

    // Каталог NFT
    async loadNFTCatalog() {
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
                image: './nft/golden_dragon.gif',
                attributes: {
                    animation: true,
                    limited: true,
                    exclusive: true
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
                image: './nft/crystal_rose.gif',
                attributes: {
                    animation: true,
                    sparkle: true
                }
            },
            'space_rocket': {
                id: 'nft_003',
                name: 'Space Rocket',
                description: 'Космическая ракета с анимацией полета',
                type: 'animated',
                rarity: 'rare',
                price: 150,
                creator: 'SpaceDesign',
                supply: 1000,
                sold: 489,
                image: './nft/space_rocket.gif',
                attributes: {
                    animation: true,
                    moving: true
                }
            },
            'magic_ring': {
                id: 'nft_004',
                name: 'Magic Ring',
                description: 'Волшебное кольцо с вращающимися рунами',
                type: 'animated',
                rarity: 'epic',
                price: 300,
                creator: 'MagicForge',
                supply: 300,
                sold: 87,
                image: './nft/magic_ring.gif',
                attributes: {
                    animation: true,
                    glowing: true
                }
            }
        };
    }

    renderNFTCatalog() {
        const container = document.getElementById('nftCatalog');
        if (!container) return;

        container.innerHTML = Object.values(this.nftCatalog).map(nft => `
            <div class="nft-card ${nft.rarity}">
                <div class="nft-badge ${nft.rarity}">${nft.rarity}</div>
                <img src="${nft.image}" alt="${nft.name}" class="nft-image">
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-description">${nft.description}</div>
                    <div class="nft-creator">Создатель: ${nft.creator}</div>
                    <div class="nft-supply">Осталось: ${nft.supply - nft.sold}/${nft.supply}</div>
                    <div class="nft-price">
                        <span class="price-amount">${nft.price} ⭐</span>
                        <button class="buy-btn" onclick="marketplace.showBuyModal('${nft.id}')">
                            Купить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Покупка NFT
    showBuyModal(nftId) {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь');
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
        document.getElementById('totalPrice').textContent = nft.price + ' ⭐';
        
        modal.style.display = 'block';
    }

    closeBuyModal() {
        document.getElementById('buyNftModal').style.display = 'none';
        this.selectedNft = null;
        document.getElementById('recipientInput').value = '';
    }

    async confirmPurchase() {
        if (!this.selectedNft) return;

        const recipient = document.getElementById('recipientInput').value.trim();
        
        if (this.userBalance < this.selectedNft.price) {
            this.showNotification('❌ Недостаточно средств');
            return;
        }

        const success = await this.buyNFT(this.selectedNft.id, recipient);
        if (success) {
            this.closeBuyModal();
        }
    }

    async buyNFT(nftId, recipient = null) {
        const nft = Object.values(this.nftCatalog).find(n => n.id === nftId);
        if (!nft) return false;

        if (nft.sold >= nft.supply) {
            this.showNotification('❌ Этот NFT распродан');
            return false;
        }

        // Создание транзакции
        const transaction = {
            id: 'tx_' + Date.now(),
            nft_id: nftId,
            nft_name: nft.name,
            buyer: this.currentUser.username,
            recipient: recipient || this.currentUser.username,
            price: nft.price,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };

        // Обновление баланса
        this.userBalance -= nft.price;
        this.currentUser.balance = this.userBalance;

        // Добавление в инвентарь
        const inventoryItem = {
            ...nft,
            acquired: new Date().toISOString(),
            transaction_id: transaction.id,
            recipient: recipient || this.currentUser.username
        };

        this.userInventory.push(inventoryItem);
        this.currentUser.inventory = this.userInventory;
        
        nft.sold += 1;

        // Сохранение данных
        this.saveUserToLocalStorage(this.currentUser);
        this.transactions.push(transaction);

        this.showNotification(`✅ Успешно приобретен ${nft.name}!`);
        this.updateUI();
        
        // Отправка данных на сервер
        await this.sendPurchaseToServer(transaction);

        return true;
    }

    async sendPurchaseToServer(transaction) {
        try {
            const data = {
                action: 'purchase_nft',
                user_id: this.currentUser.id,
                nft_id: transaction.nft_id,
                nft_name: transaction.nft_name,
                recipient: transaction.recipient,
                price: transaction.price,
                transaction_id: transaction.id,
                bot_type: 'main'
            };

            await this.sendToNetlify(data);
        } catch (error) {
            console.error('❌ Ошибка отправки покупки:', error);
        }
    }

    // Инвентарь
    renderInventory() {
        const container = document.getElementById('userInventory');
        if (!container) return;

        if (this.userInventory.length === 0) {
            container.innerHTML = `
                <div class="empty-inventory">
                    <div class="empty-icon">🎁</div>
                    <div class="empty-text">Ваша коллекция пуста</div>
                    <button class="btn btn-primary" onclick="marketplace.showSection('marketplace')">
                        Найти подарки
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.userInventory.map(item => `
            <div class="inventory-item">
                <img src="${item.image}" alt="${item.name}" class="inventory-image">
                <div class="inventory-name">${item.name}</div>
                <div class="inventory-rarity ${item.rarity}">${item.rarity}</div>
                <div class="inventory-date">${new Date(item.acquired).toLocaleDateString()}</div>
                ${item.recipient !== this.currentUser.username ? 
                    `<div class="inventory-recipient">Для: ${item.recipient}</div>` : ''}
            </div>
        `).join('');
    }

    // Обновление UI
    updateUserDisplay() {
        if (this.isLoggedIn && this.currentUser) {
            document.getElementById('profileName').textContent = this.currentUser.first_name;
            document.getElementById('profileId').textContent = this.currentUser.id;
            document.getElementById('profileUsername').textContent = '@' + this.currentUser.username;
            document.getElementById('profileBalance').textContent = this.userBalance + ' ⭐';
            
            // Аватарка
            const avatarInitial = document.getElementById('profileAvatarInitial');
            if (avatarInitial) {
                avatarInitial.textContent = this.currentUser.first_name.charAt(0).toUpperCase();
            }

            this.updateProfileStats();
        }
    }

    updateProfileStats() {
        document.getElementById('statNftCount').textContent = this.userInventory.length;
        document.getElementById('statTotalPurchases').textContent = this.transactions.length;
        document.getElementById('statTotalSpent').textContent = this.transactions.reduce((sum, tx) => sum + tx.price, 0) + ' ⭐';
        document.getElementById('statMemberSince').textContent = this.currentUser ? 
            new Date(this.currentUser.registered_at).toLocaleDateString() : '-';
        
        document.getElementById('userNftCount').textContent = this.userInventory.length;
        document.getElementById('userBalance').textContent = this.userBalance + ' ⭐';
    }

    updateMarketplaceStats() {
        const totalNFTs = Object.keys(this.nftCatalog).length;
        const totalSales = Object.values(this.nftCatalog).reduce((sum, nft) => sum + nft.sold, 0);
        const totalVolume = Object.values(this.nftCatalog).reduce((sum, nft) => sum + (nft.sold * nft.price), 0);
        
        document.getElementById('totalNfts').textContent = totalNFTs;
        document.getElementById('totalSales').textContent = totalSales;
        document.getElementById('totalVolume').textContent = totalVolume;
    }

    updateUI() {
        this.updateUserDisplay();
        this.updateMarketplaceStats();
        this.renderInventory();
    }

    // Пополнение баланса
    showDepositModal() {
        if (!this.isLoggedIn) {
            this.showNotification('❌ Сначала авторизуйтесь');
            return;
        }

        this.selectedDepositAmount = 0;
        document.getElementById('selectedDeposit').textContent = 'Выберите сумму для пополнения';
        document.getElementById('confirmDeposit').disabled = true;
        
        document.querySelectorAll('.deposit-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.getElementById('depositModal').style.display = 'block';
    }

    closeDepositModal() {
        document.getElementById('depositModal').style.display = 'none';
    }

    selectDeposit(amount) {
        this.selectedDepositAmount = amount;
        
        document.querySelectorAll('.deposit-option').forEach(option => {
            option.classList.toggle('selected', parseInt(option.dataset.amount) === amount);
        });
        
        document.getElementById('selectedDeposit').textContent = `Выбрано: ${amount} ⭐`;
        document.getElementById('confirmDeposit').disabled = false;
    }

    async processDeposit() {
        if (this.selectedDepositAmount > 0) {
            this.userBalance += this.selectedDepositAmount;
            this.currentUser.balance = this.userBalance;
            this.saveUserToLocalStorage(this.currentUser);
            
            // Отправка на сервер
            await this.sendDepositToServer(this.selectedDepositAmount);
            
            this.showNotification(`✅ Баланс пополнен на ${this.selectedDepositAmount} ⭐`);
            this.updateUI();
            this.closeDepositModal();
        }
    }

    async sendDepositToServer(amount) {
        try {
            const data = {
                action: 'deposit_request',
                user_id: this.currentUser.id,
                amount: amount,
                bot_type: 'main'
            };

            await this.sendToNetlify(data);
        } catch (error) {
            console.error('❌ Ошибка отправки депозита:', error);
        }
    }

    // Утилиты
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

    setupEventListeners() {
        // Базовые обработчики событий
    }

    async sendToNetlify(data) {
        try {
            const response = await fetch(this.netlifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Ошибка отправки данных:', error);
            return { success: false, error: error.message };
        }
    }
}

// Инициализация маркетплейса
const marketplace = new NFTMarketplace();
