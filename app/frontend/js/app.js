// Управление состоянием приложения
const app = {
    user: null,
    wallets: [],

    // Инициализация
    async init() {
        this.setupEventListeners();
        
        // Проверяем авторизацию
        const token = api.getToken();
        if (token) {
            try {
                this.user = await api.getCurrentUser();
                this.showDashboard();
                await this.loadData();
            } catch (e) {
                api.clearToken();
            }
        }
    },

    // Настройка обработчиков событий
    setupEventListeners() {
        // Авторизация
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('login-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Кошельки
        document.getElementById('create-wallet-btn').addEventListener('click', () => this.createWallet());

        // Табы операций
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Операции
        document.getElementById('add-income-btn').addEventListener('click', () => this.addIncome());
        document.getElementById('add-expense-btn').addEventListener('click', () => this.addExpense());
        document.getElementById('make-transfer-btn').addEventListener('click', () => this.makeTransfer());
    },

    // === Авторизация ===
    async login() {
        const loginInput = document.getElementById('login-input');
        const login = loginInput.value.trim();
        const errorEl = document.getElementById('auth-error');

        if (!login) {
            this.showError(errorEl, 'Введите логин');
            return;
        }

        try {
            errorEl.style.display = 'none';
            
            // Пытаемся войти (если пользователь существует)
            api.setToken(login);
            this.user = await api.getCurrentUser();
            
            this.showDashboard();
            await this.loadData();
        } catch (e) {
            // Если не получилось — создаём нового пользователя
            try {
                const user = await api.createUser(login);
                api.setToken(login);
                this.user = user;
                this.showDashboard();
                await this.loadData();
            } catch (err) {
                this.showError(errorEl, 'Ошибка регистрации: ' + err.message);
                api.clearToken();
            }
        }
    },

    logout() {
        api.clearToken();
        this.user = null;
        this.wallets = [];
        document.getElementById('login-page').classList.add('active');
        document.getElementById('dashboard-page').classList.remove('active');
        document.getElementById('login-input').value = '';
    },

    // === Загрузка данных ===
    async loadData() {
        await Promise.all([
            this.loadWallets(),
            this.loadOperations(),
            this.updateTotalBalance(),
        ]);
    },

    async loadWallets() {
        try {
            this.wallets = await api.getWallets();
            this.renderWallets();
            this.updateWalletSelects();
        } catch (e) {
            console.error('Ошибка загрузки кошельков:', e);
        }
    },

    async loadOperations() {
        try {
            const operations = await api.getOperations();
            this.renderOperations(operations);
        } catch (e) {
            console.error('Ошибка загрузки операций:', e);
        }
    },

    async updateTotalBalance() {
        try {
            const data = await api.getTotalBalance();
            document.getElementById('total-balance').textContent = data.total_balance;
            document.getElementById('user-login').textContent = this.user.login;
        } catch (e) {
            console.error('Ошибка баланса:', e);
        }
    },

    // === Рендеринг ===
    renderWallets() {
        const container = document.getElementById('wallets-list');
        
        if (this.wallets.length === 0) {
            container.innerHTML = '<div class="empty-state">📭 Кошельков пока нет. Создайте первый!</div>';
            return;
        }

        container.innerHTML = this.wallets.map(w => `
            <div class="wallet-card">
                <h4>${this.escapeHtml(w.name)}</h4>
                <div class="balance">${w.balance}</div>
                <div class="currency">${w.currency}</div>
            </div>
        `).join('');
    },

    updateWalletSelects() {
        const options = this.wallets.map(w => 
            `<option value="${w.id}" data-name="${this.escapeHtml(w.name)}" data-currency="${w.currency}">
                ${this.escapeHtml(w.name)} (${w.balance} ${w.currency})
            </option>`
        ).join('');

        ['income-wallet', 'expense-wallet', 'transfer-from', 'transfer-to'].forEach(id => {
            document.getElementById(id).innerHTML = options || '<option>Нет кошельков</option>';
        });
    },

    renderOperations(operations) {
        const container = document.getElementById('history-list');
        
        if (operations.length === 0) {
            container.innerHTML = '<div class="empty-state">📝 Операций пока нет</div>';
            return;
        }

        // Сортируем по дате (новые сверху)
        const sorted = [...operations].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        container.innerHTML = sorted.map(op => {
            const date = new Date(op.created_at).toLocaleString('ru-RU');
            const typeClass = op.type;
            const amountClass = op.type === 'income' ? 'positive' : 'negative';
            const prefix = op.type === 'income' ? '+' : op.type === 'expense' ? '-' : '→';
            
            return `
                <div class="history-item ${typeClass}">
                    <div class="history-info">
                        <div class="type">${op.type} • ${op.category || 'без категории'}</div>
                        <div class="details">${date} • Wallet #${op.wallet_id}</div>
                    </div>
                    <div class="history-amount ${amountClass}">
                        ${prefix}${op.amount} ${op.currency}
                    </div>
                </div>
            `;
        }).join('');
    },

    // === Действия ===
    async createWallet() {
        const name = document.getElementById('wallet-name').value.trim();
        const balance = parseFloat(document.getElementById('wallet-balance').value) || 0;
        const currency = document.getElementById('wallet-currency').value;

        if (!name) {
            alert('Введите название кошелька');
            return;
        }

        try {
            await api.createWallet(name, balance, currency);
            document.getElementById('wallet-name').value = '';
            document.getElementById('wallet-balance').value = '0';
            await this.loadData();
        } catch (e) {
            alert('Ошибка: ' + e.message);
        }
    },

    async addIncome() {
        const select = document.getElementById('income-wallet');
        const wallet_name = select.options[select.selectedIndex]?.dataset.name;
        const amount = parseFloat(document.getElementById('income-amount').value);
        const description = document.getElementById('income-description').value.trim() || null;

        if (!wallet_name || !amount || amount <= 0) {
            alert('Выберите кошелёк и введите сумму');
            return;
        }

        try {
            await api.addIncome(wallet_name, amount, description);
            document.getElementById('income-amount').value = '';
            document.getElementById('income-description').value = '';
            this.showSuccess('operation-success', 'Доход добавлен!');
            await this.loadData();
        } catch (e) {
            this.showError(document.getElementById('operation-error'), e.message);
        }
    },

    async addExpense() {
        const select = document.getElementById('expense-wallet');
        const wallet_name = select.options[select.selectedIndex]?.dataset.name;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const description = document.getElementById('expense-description').value.trim() || null;

        if (!wallet_name || !amount || amount <= 0) {
            alert('Выберите кошелёк и введите сумму');
            return;
        }

        try {
            await api.addExpense(wallet_name, amount, description);
            document.getElementById('expense-amount').value = '';
            document.getElementById('expense-description').value = '';
            this.showSuccess('operation-success', 'Расход добавлен!');
            await this.loadData();
        } catch (e) {
            this.showError(document.getElementById('operation-error'), e.message);
        }
    },

    async makeTransfer() {
        const fromSelect = document.getElementById('transfer-from');
        const toSelect = document.getElementById('transfer-to');
        const from_wallet_id = parseInt(fromSelect.value);
        const to_wallet_id = parseInt(toSelect.value);
        const amount = parseFloat(document.getElementById('transfer-amount').value);

        if (!from_wallet_id || !to_wallet_id || from_wallet_id === to_wallet_id) {
            alert('Выберите разные кошельки для перевода');
            return;
        }
        if (!amount || amount <= 0) {
            alert('Введите сумму перевода');
            return;
        }

        try {
            await api.transfer(from_wallet_id, to_wallet_id, amount);
            document.getElementById('transfer-amount').value = '';
            this.showSuccess('operation-success', 'Перевод выполнен!');
            await this.loadData();
        } catch (e) {
            this.showError(document.getElementById('operation-error'), e.message);
        }
    },

    // === UI ===
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    },

    showDashboard() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('dashboard-page').classList.add('active');
    },

    showError(el, message) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    },

    showSuccess(elId, message) {
        const el = document.getElementById(elId);
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 3000);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
};

// Запуск
document.addEventListener('DOMContentLoaded', () => app.init());