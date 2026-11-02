// Конфигурация API
const API_BASE = 'http://127.0.0.1:8000/api/v1';

const api = {
    // Получение токена из localStorage
    getToken() {
        return localStorage.getItem('auth_token');
    },

    setToken(login) {
        localStorage.setItem('auth_token', login);
    },

    clearToken() {
        localStorage.removeItem('auth_token');
    },

    // Базовая функция для запросов
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            this.clearToken();
            location.reload();
            throw new Error('Не авторизован');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
            throw new Error(error.detail || 'Ошибка запроса');
        }

        return response.json();
    },

    // === Users ===
    createUser(login) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify({ login }),
        });
    },

    getCurrentUser() {
        return this.request('/users/me');
    },

    // === Wallets ===
    getWallets() {
        return this.request('/wallets');
    },

    createWallet(name, initial_balance, currency) {
        return this.request('/wallet', {
            method: 'POST',
            body: JSON.stringify({ name, initial_balance, currency }),
        });
    },

    getTotalBalance() {
        return this.request('/balance');
    },

    // === Operations ===
    addIncome(wallet_name, amount, description = null) {
        return this.request('/operations/income', {
            method: 'POST',
            body: JSON.stringify({ wallet_name, amount, description }),
        });
    },

    addExpense(wallet_name, amount, description = null) {
        return this.request('/operations/expense', {
            method: 'POST',
            body: JSON.stringify({ wallet_name, amount, description }),
        });
    },

    transfer(from_wallet_id, to_wallet_id, amount) {
        return this.request('/operations/transfer', {
            method: 'POST',
            body: JSON.stringify({ from_wallet_id, to_wallet_id, amount }),
        });
    },

    getOperations(wallet_id = null, date_from = null, date_to = null) {
        const params = new URLSearchParams();
        if (wallet_id) params.append('wallet_id', wallet_id);
        if (date_from) params.append('date_from', date_from);
        if (date_to) params.append('date_to', date_to);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/operations${query}`);
    },
};