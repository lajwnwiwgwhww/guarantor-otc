// ===== API CONFIGURATION =====
const API_BASE_URL = 'https://oovsu-185-229-191-172.run.pinggy-free.link';
const API_TIMEOUT = 15000; // 15 seconds

// ===== API CLIENT CLASS =====
class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    
    setToken(token) {
        this.headers['Authorization'] = `Bearer ${token}`;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.headers, ...options.headers },
            method: options.method || 'GET',
            timeout: options.timeout || API_TIMEOUT,
            ...options
        };
        
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = new Error(`API Error: ${response.status}`);
                error.status = response.status;
                throw error;
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Request failed: ${endpoint}`, error);
            throw error;
        }
    }
    
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }
    
    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }
    
    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }
    
    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// ===== GLOBAL API CLIENT INSTANCE =====
const apiClient = new APIClient();

// ===== USER API FUNCTIONS =====

/**
 * Get current user data
 * @returns {Promise<Object>} User data with balance, profile, etc.
 */
async function getUserData() {
    try {
        const response = await apiClient.get('/api/user/profile');
        return {
            id: response.user_id || 'user_123',
            username: response.username || '@guarantoruser',
            avatar: response.avatar_url || 'G',
            balance: response.balance_ton || 12.45,
            verified: response.is_verified || true,
            rating: response.rating || 4.9,
            walletAddress: response.wallet_address || 'UQBm...KZai',
            successfulDeals: response.successful_deals || 24,
            activeDeals: response.active_deals || 3,
            disputes: response.disputes || 0
        };
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Return mock data for development
        return {
            id: 'user_123',
            username: '@guarantoruser',
            avatar: 'G',
            balance: 12.45,
            verified: true,
            rating: 4.9,
            walletAddress: 'UQBm...KZai',
            successfulDeals: 24,
            activeDeals: 3,
            disputes: 0
        };
    }
}

/**
 * Update user wallet address
 * @param {string} walletAddress - New wallet address
 * @returns {Promise<Object>} Updated user data
 */
async function updateWalletAddress(walletAddress) {
    try {
        const response = await apiClient.put('/api/user/wallet', {
            wallet_address: walletAddress
        });
        return response;
    } catch (error) {
        console.error('Failed to update wallet address:', error);
        throw error;
    }
}

// ===== DEALS API FUNCTIONS =====

/**
 * Create a new deal
 * @param {Object} dealData - Deal creation data
 * @returns {Promise<Object>} Created deal object
 */
async function createDeal(amount, counterpartyUsername, description = '') {
    try {
        const response = await apiClient.post('/api/deals/create', {
            amount: parseFloat(amount),
            counterparty_username: counterpartyUsername,
            description: description
        });
        
        return {
            id: response.deal_id || Date.now(),
            amount: amount,
            counterparty: counterpartyUsername,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to create deal:', error);
        throw error;
    }
}

/**
 * Get all deals for current user
 * @param {string} status - Filter by status (all, active, completed, dispute)
 * @returns {Promise<Array>} Array of deals
 */
async function getDeals(status = 'all') {
    try {
        const response = await apiClient.get(`/api/deals?status=${status}`);
        return response.deals || [];
    } catch (error) {
        console.error('Failed to fetch deals:', error);
        return [];
    }
}

/**
 * Get deal details
 * @param {number} dealId - Deal ID
 * @returns {Promise<Object>} Detailed deal information
 */
async function getDealDetails(dealId) {
    try {
        const response = await apiClient.get(`/api/deals/${dealId}`);
        return response;
    } catch (error) {
        console.error(`Failed to fetch deal ${dealId}:`, error);
        throw error;
    }
}

/**
 * Confirm/Complete a deal
 * @param {number} dealId - Deal ID
 * @returns {Promise<Object>} Updated deal
 */
async function confirmDeal(dealId) {
    try {
        const response = await apiClient.put(`/api/deals/${dealId}/confirm`, {});
        return response;
    } catch (error) {
        console.error(`Failed to confirm deal ${dealId}:`, error);
        throw error;
    }
}

/**
 * Cancel a deal
 * @param {number} dealId - Deal ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Updated deal
 */
async function cancelDeal(dealId, reason = '') {
    try {
        const response = await apiClient.put(`/api/deals/${dealId}/cancel`, {
            reason: reason
        });
        return response;
    } catch (error) {
        console.error(`Failed to cancel deal ${dealId}:`, error);
        throw error;
    }
}

/**
 * Add memo/comment to deal
 * @param {number} dealId - Deal ID
 * @param {string} memo - Memo text
 * @returns {Promise<Object>} Updated deal
 */
async function addDealMemo(dealId, memo) {
    try {
        const response = await apiClient.put(`/api/deals/${dealId}/memo`, {
            memo: memo
        });
        return response;
    } catch (error) {
        console.error(`Failed to add memo to deal ${dealId}:`, error);
        throw error;
    }
}

// ===== REFERRAL API FUNCTIONS =====

/**
 * Get referral statistics and data
 * @returns {Promise<Object>} Referral stats and list
 */
async function getReferrals() {
    try {
        const response = await apiClient.get('/api/referrals/stats');
        return {
            totalInvited: response.total_invited || 0,
            totalEarnings: response.total_earnings_ton || 0,
            referralLink: response.referral_link || 'https://t.me/guarantor_otc_bot?start=ref_',
            levels: {
                1: { percentage: 20, referrals: response.level_1_referrals || [] },
                2: { percentage: 10, referrals: response.level_2_referrals || [] },
                3: { percentage: 5, referrals: response.level_3_referrals || [] },
                4: { percentage: 2, referrals: response.level_4_referrals || [] },
                5: { percentage: 1, referrals: response.level_5_referrals || [] }
            }
        };
    } catch (error) {
        console.error('Failed to fetch referral data:', error);
        return {
            totalInvited: 0,
            totalEarnings: 0,
            referralLink: '',
            levels: {
                1: { percentage: 20, referrals: [] },
                2: { percentage: 10, referrals: [] },
                3: { percentage: 5, referrals: [] },
                4: { percentage: 2, referrals: [] },
                5: { percentage: 1, referrals: [] }
            }
        };
    }
}

/**
 * Get referrals by level
 * @param {number} level - Referral level (1-5)
 * @returns {Promise<Array>} Referrals for specific level
 */
async function getReferralsByLevel(level) {
    try {
        const response = await apiClient.get(`/api/referrals/level/${level}`);
        return response.referrals || [];
    } catch (error) {
        console.error(`Failed to fetch level ${level} referrals:`, error);
        return [];
    }
}

/**
 * Withdraw referral earnings
 * @param {number} amount - Amount to withdraw (in TON)
 * @param {string} walletAddress - Destination wallet
 * @returns {Promise<Object>} Withdrawal confirmation
 */
async function withdrawReferralEarnings(amount, walletAddress) {
    try {
        const response = await apiClient.post('/api/referrals/withdraw', {
            amount: parseFloat(amount),
            wallet_address: walletAddress
        });
        return response;
    } catch (error) {
        console.error('Failed to withdraw referral earnings:', error);
        throw error;
    }
}

// ===== SUPPORT API FUNCTIONS =====

/**
 * Get all support tickets for user
 * @returns {Promise<Array>} Array of support tickets
 */
async function getSupportTickets() {
    try {
        const response = await apiClient.get('/api/support/tickets');
        return response.tickets || [];
    } catch (error) {
        console.error('Failed to fetch support tickets:', error);
        return [];
    }
}

/**
 * Create a new support ticket
 * @param {string} category - Ticket category
 * @param {string} title - Ticket title
 * @param {string} description - Detailed description
 * @returns {Promise<Object>} Created ticket
 */
async function createSupportTicket(category, title, description) {
    try {
        const response = await apiClient.post('/api/support/tickets/create', {
            category: category,
            title: title,
            description: description
        });
        
        return {
            id: response.ticket_id || `TKT-${Date.now()}`,
            category: category,
            title: title,
            description: description,
            status: 'open',
            createdAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to create support ticket:', error);
        throw error;
    }
}

/**
 * Get specific ticket details
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object>} Ticket details with messages
 */
async function getTicketDetails(ticketId) {
    try {
        const response = await apiClient.get(`/api/support/tickets/${ticketId}`);
        return response;
    } catch (error) {
        console.error(`Failed to fetch ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Add message to support ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} message - Message text
 * @returns {Promise<Object>} Added message
 */
async function addTicketMessage(ticketId, message) {
    try {
        const response = await apiClient.post(`/api/support/tickets/${ticketId}/messages`, {
            message: message
        });
        return response;
    } catch (error) {
        console.error(`Failed to add message to ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Close a support ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} feedback - User feedback (optional)
 * @returns {Promise<Object>} Closed ticket
 */
async function closeTicket(ticketId, feedback = '') {
    try {
        const response = await apiClient.put(`/api/support/tickets/${ticketId}/close`, {
            feedback: feedback
        });
        return response;
    } catch (error) {
        console.error(`Failed to close ticket ${ticketId}:`, error);
        throw error;
    }
}

// ===== WALLET API FUNCTIONS =====

/**
 * Withdraw funds to external wallet
 * @param {number} amount - Amount to withdraw (in TON)
 * @param {string} walletAddress - Destination wallet address
 * @returns {Promise<Object>} Withdrawal transaction info
 */
async function withdrawFunds(amount, walletAddress) {
    try {
        const response = await apiClient.post('/api/wallet/withdraw', {
            amount: parseFloat(amount),
            wallet_address: walletAddress
        });
        
        return {
            transactionId: response.tx_id || `TXN-${Date.now()}`,
            amount: amount,
            destination: walletAddress,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to withdraw funds:', error);
        throw error;
    }
}

/**
 * Get wallet balance
 * @returns {Promise<Object>} Current balance and transaction history
 */
async function getWalletBalance() {
    try {
        const response = await apiClient.get('/api/wallet/balance');
        return {
            balance: response.balance_ton || 0,
            currency: 'TON',
            usdValue: response.usd_value || 0,
            lastUpdate: new Date().toISOString()
        };
    } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        return {
            balance: 0,
            currency: 'TON',
            usdValue: 0,
            lastUpdate: new Date().toISOString()
        };
    }
}

/**
 * Get transaction history
 * @param {number} limit - Number of transactions to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of transactions
 */
async function getTransactionHistory(limit = 20, offset = 0) {
    try {
        const response = await apiClient.get(`/api/wallet/transactions?limit=${limit}&offset=${offset}`);
        return response.transactions || [];
    } catch (error) {
        console.error('Failed to fetch transaction history:', error);
        return [];
    }
}

// ===== AUTHENTICATION API FUNCTIONS =====

/**
 * Initialize/Authenticate with Telegram WebApp
 * @param {Object} initData - Telegram WebApp initData
 * @returns {Promise<Object>} Auth token and user data
 */
async function authenticateWithTelegram(initData) {
    try {
        const response = await apiClient.post('/api/auth/telegram', {
            init_data: initData
        });
        
        if (response.token) {
            apiClient.setToken(response.token);
            localStorage.setItem('authToken', response.token);
        }
        
        return response;
    } catch (error) {
        console.error('Telegram authentication failed:', error);
        throw error;
    }
}

/**
 * Logout
 * @returns {Promise<void>}
 */
async function logout() {
    try {
        await apiClient.post('/api/auth/logout', {});
        localStorage.removeItem('authToken');
        apiClient.setToken(null);
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format TON amount for display
 * @param {number} amount - Amount in TON
 * @returns {string} Formatted string
 */
function formatTON(amount) {
    return amount.toFixed(2);
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format time ago
 * @param {Date|string} date - Date to format
 * @returns {string} Time ago string
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    
    return formatDate(date);
}

// ===== ERROR HANDLING MIDDLEWARE =====
async function withErrorHandling(fn) {
    try {
        return await fn();
    } catch (error) {
        console.error('API Error:', error);
        
        if (error.status === 401) {
            // Unauthorized - redirect to login
            logout();
            window.location.reload();
        } else if (error.status === 403) {
            // Forbidden
            throw new Error('У вас нет доступа к этому ресурсу');
        } else if (error.status === 429) {
            // Rate limited
            throw new Error('Слишком много запросов. Попробуйте позже');
        } else {
            throw new Error('Ошибка сервера. Попробуйте позже');
        }
    }
}

// ===== EXPORTS FOR MODULE SYSTEMS =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiClient,
        getUserData,
        createDeal,
        getDeals,
        getDealDetails,
        confirmDeal,
        getReferrals,
        getSupportTickets,
        createSupportTicket,
        withdrawFunds,
        authenticateWithTelegram,
        formatTON,
        formatDate,
        formatTimeAgo
    };
}
