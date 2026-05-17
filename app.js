// ===== TELEGRAM WEB APP INITIALIZATION =====
let WebApp = window.Telegram?.WebApp;

if (WebApp) {
    WebApp.ready();
    WebApp.setHeaderColor('#0f172a');
    WebApp.setBottomBarColor('#0f172a');
    WebApp.expand();
}

// ===== APPLICATION STATE =====
let appState = {
    currentScreen: 'home',
    currentRefLevel: 1,
    dealsFilter: 'all',
    userData: null,
    deals: [],
    referrals: {},
    tickets: []
};

// ===== UTILITIES =====
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden', 'exit');
    
    setTimeout(() => {
        toast.classList.add('exit');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, duration);
}

function hapticFeedback(type = 'light') {
    if (WebApp && WebApp.HapticFeedback) {
        switch(type) {
            case 'light':
                WebApp.HapticFeedback.selectionChanged();
                break;
            case 'medium':
                WebApp.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                WebApp.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                WebApp.HapticFeedback.notificationOccurred('success');
                break;
            case 'error':
                WebApp.HapticFeedback.notificationOccurred('error');
                break;
        }
    }
}

function navigateTo(screenName) {
    hapticFeedback('light');
    
    // Hide all screens
    document.querySelectorAll('.screen-page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show selected screen
    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
        screen.classList.remove('hidden');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-screen="${screenName}"]`)?.classList.add('active');
    
    appState.currentScreen = screenName;
    
    // Load screen specific data
    if (screenName === 'deals') {
        loadDeals();
    } else if (screenName === 'referral') {
        loadReferrals();
    } else if (screenName === 'support') {
        loadTickets();
    }
}

function openModal(modalId) {
    hapticFeedback('light');
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        
        // Show Telegram BackButton for modals
        if (WebApp && WebApp.BackButton) {
            WebApp.BackButton.show();
            WebApp.BackButton.onClick(() => closeModal(modalId));
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        
        // Hide Telegram BackButton
        if (WebApp && WebApp.BackButton) {
            WebApp.BackButton.hide();
        }
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    if (WebApp && WebApp.BackButton) {
        WebApp.BackButton.hide();
    }
}

// ===== DEALS SCREEN =====
function loadDeals() {
    const dealsList = document.getElementById('deals-list');
    dealsList.innerHTML = '';
    
    // Sample deals data
    const sampleDeals = [
        {
            id: 1024,
            role: 'Покупатель',
            amount: 5.0,
            status: 'pending',
            counterparty: '@seller_user',
            description: 'Покупка TON'
        },
        {
            id: 1023,
            role: 'Продавец',
            amount: 10.5,
            status: 'completed',
            counterparty: '@buyer_user',
            description: 'Продажа токенов'
        },
        {
            id: 1022,
            role: 'Покупатель',
            amount: 3.2,
            status: 'dispute',
            counterparty: '@disputed_user',
            description: 'Спорная сделка'
        },
        {
            id: 1021,
            role: 'Продавец',
            amount: 7.8,
            status: 'completed',
            counterparty: '@user_1',
            description: 'Успешная продажа'
        }
    ];
    
    appState.deals = sampleDeals;
    
    const filtered = sampleDeals.filter(deal => {
        if (appState.dealsFilter === 'active') return deal.status !== 'completed';
        if (appState.dealsFilter === 'completed') return deal.status === 'completed';
        return true;
    });
    
    if (filtered.length === 0) {
        dealsList.innerHTML = '<div class="text-center py-8 text-slate-400">Нет сделок</div>';
        return;
    }
    
    filtered.forEach(deal => {
        const statusConfig = {
            pending: { text: 'Ожидает', badge: 'status-pending' },
            completed: { text: 'Завершена', badge: 'status-completed' },
            dispute: { text: 'Спор', badge: 'status-dispute' }
        };
        
        const config = statusConfig[deal.status];
        const dealCard = document.createElement('div');
        dealCard.className = 'deal-card';
        dealCard.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div>
                    <div class="text-sm text-slate-400">#${deal.id}</div>
                    <div class="font-semibold text-lg mt-1">${deal.amount} TON</div>
                </div>
                <span class="status-badge ${config.badge}">${config.text}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <div>
                    <div class="text-slate-500 text-xs">Роль</div>
                    <div class="text-slate-300">${deal.role}</div>
                </div>
                <div class="text-right">
                    <div class="text-slate-500 text-xs">Контрагент</div>
                    <div class="text-slate-300">${deal.counterparty}</div>
                </div>
            </div>
        `;
        
        dealCard.addEventListener('click', () => showDealDetails(deal));
        dealsList.appendChild(dealCard);
    });
}

function showDealDetails(deal) {
    hapticFeedback('light');
    const statusConfig = {
        pending: { text: 'Ожидает оплаты' },
        completed: { text: 'Завершена' },
        dispute: { text: 'Арбитраж/Спор' }
    };
    
    const modalBody = document.getElementById('modal-deal-body');
    const title = document.getElementById('modal-deal-title');
    
    title.textContent = `Сделка #${deal.id}`;
    
    modalBody.innerHTML = `
        <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="premium-card text-center">
                <div class="text-sm text-slate-400">Сумма</div>
                <div class="text-2xl font-bold text-emerald-400 mt-2">${deal.amount}</div>
                <div class="text-xs text-slate-500 mt-1">TON</div>
            </div>
            <div class="premium-card text-center">
                <div class="text-sm text-slate-400">Статус</div>
                <div class="text-sm font-semibold mt-2" style="color: ${deal.status === 'pending' ? '#fcd34d' : deal.status === 'completed' ? '#6ee7b7' : '#fca5a5'}">
                    ${statusConfig[deal.status].text}
                </div>
            </div>
        </div>
        
        <div class="premium-card mb-4">
            <div class="text-sm text-slate-400 mb-2">Роль</div>
            <div class="text-slate-100 font-semibold">${deal.role}</div>
        </div>
        
        <div class="premium-card mb-4">
            <div class="text-sm text-slate-400 mb-2">Контрагент</div>
            <div class="text-slate-100 font-semibold">${deal.counterparty}</div>
        </div>
        
        <div class="premium-card mb-4">
            <div class="text-sm text-slate-400 mb-2">Описание</div>
            <div class="text-slate-100">${deal.description}</div>
        </div>
        
        <div>
            <label class="block text-sm font-semibold mb-2 text-slate-300">Заметка/Комментарий</label>
            <textarea placeholder="Добавьте заметку..." class="modal-input resize-none h-20"></textarea>
        </div>
        
        <div class="flex gap-2 mt-4">
            <button class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition" id="btn-close-deal-modal">
                Закрыть
            </button>
            ${deal.status === 'pending' ? `
                <button class="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-semibold transition text-slate-900" id="btn-confirm-deal">
                    Подтвердить
                </button>
            ` : ''}
        </div>
    `;
    
    document.getElementById('btn-close-deal-modal').addEventListener('click', () => closeModal('modal-deal-details'));
    document.getElementById('btn-confirm-deal')?.addEventListener('click', () => {
        hapticFeedback('success');
        showToast('Сделка подтверждена!');
        closeModal('modal-deal-details');
        loadDeals();
    });
    
    openModal('modal-deal-details');
}

// ===== REFERRAL SCREEN =====
function loadReferrals() {
    const referralsList = document.getElementById('referrals-list');
    referralsList.innerHTML = '';
    
    // Sample referrals data
    const referralsByLevel = {
        1: [
            { username: '@user_ref_1', date: '2024-01-15', profit: '2.5 TON' },
            { username: '@user_ref_2', date: '2024-01-10', profit: '1.8 TON' },
            { username: '@user_ref_3', date: '2024-01-05', profit: '3.2 TON' }
        ],
        2: [
            { username: '@user_ref_4', date: '2023-12-20', profit: '0.8 TON' },
            { username: '@user_ref_5', date: '2023-12-15', profit: '0.5 TON' }
        ],
        3: [
            { username: '@user_ref_6', date: '2023-12-01', profit: '0.2 TON' }
        ],
        4: [],
        5: []
    };
    
    appState.referrals = referralsByLevel;
    
    const currentReferrals = referralsByLevel[appState.currentRefLevel] || [];
    
    if (currentReferrals.length === 0) {
        referralsList.innerHTML = '<div class="text-center py-8 text-slate-400">Нет рефералов на этом уровне</div>';
        return;
    }
    
    currentReferrals.forEach((ref, index) => {
        const item = document.createElement('div');
        item.className = 'referral-item';
        item.innerHTML = `
            <div class="referral-avatar">
                ${ref.username[1].toUpperCase()}
            </div>
            <div class="flex-1">
                <div class="font-semibold text-sm">${ref.username}</div>
                <div class="text-xs text-slate-400">${ref.date}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-emerald-400 text-sm">+${ref.profit}</div>
            </div>
        `;
        referralsList.appendChild(item);
    });
}

// ===== SUPPORT SCREEN =====
function loadTickets() {
    const ticketsList = document.getElementById('tickets-list');
    ticketsList.innerHTML = '';
    
    // Sample tickets data
    const sampleTickets = [
        {
            id: 'TKT-001',
            category: 'bug',
            status: 'open',
            title: 'Проблема с выводом средств',
            date: '2024-01-20',
            updatedAt: '2 часа назад'
        },
        {
            id: 'TKT-002',
            category: 'dispute',
            status: 'resolved',
            title: 'Спор по сделке #1020',
            date: '2024-01-18',
            updatedAt: '12 часов назад'
        }
    ];
    
    appState.tickets = sampleTickets;
    
    if (sampleTickets.length === 0) {
        ticketsList.innerHTML = '<div class="text-center py-8 text-slate-400">Нет тикетов</div>';
        return;
    }
    
    sampleTickets.forEach(ticket => {
        const statusConfig = {
            open: { text: 'В обработке', color: '#fcd34d' },
            resolved: { text: 'Решено', color: '#6ee7b7' }
        };
        
        const config = statusConfig[ticket.status];
        const ticketCard = document.createElement('div');
        ticketCard.className = 'ticket-item';
        ticketCard.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                    <div class="font-semibold text-sm">${ticket.title}</div>
                    <div class="text-xs text-slate-400 mt-1">${ticket.id}</div>
                </div>
                <div style="color: ${config.color}" class="text-xs font-semibold px-2 py-1 rounded bg-slate-800">
                    ${config.text}
                </div>
            </div>
            <div class="text-xs text-slate-500">Обновлено ${ticket.updatedAt}</div>
        `;
        ticketsList.appendChild(ticketCard);
    });
}

// ===== MODALS & FORMS =====
document.getElementById('form-create-deal').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = document.getElementById('input-deal-amount').value;
    const username = document.getElementById('input-deal-username').value;
    const desc = document.getElementById('input-deal-desc').value;
    
    if (!amount || !username) {
        showToast('Заполните все поля');
        hapticFeedback('error');
        return;
    }
    
    hapticFeedback('success');
    showToast('Сделка создана!');
    closeModal('modal-create-deal');
    
    // Reset form
    e.target.reset();
    
    // In real app: await createDeal(amount, username, desc);
});

document.getElementById('form-new-ticket').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const category = document.getElementById('input-ticket-category').value;
    const text = document.getElementById('input-ticket-text').value;
    
    if (!category || !text) {
        showToast('Заполните все поля');
        hapticFeedback('error');
        return;
    }
    
    hapticFeedback('success');
    showToast('Тикет создан!');
    closeModal('modal-new-ticket');
    
    // Reset form
    e.target.reset();
    
    // In real app: await createSupportTicket(category, text);
});

// ===== BUTTON HANDLERS =====
document.getElementById('btn-create-deal').addEventListener('click', () => {
    openModal('modal-create-deal');
});

document.getElementById('btn-withdraw').addEventListener('click', () => {
    showToast('Функция вывода в разработке');
});

document.getElementById('btn-change-wallet').addEventListener('click', () => {
    hapticFeedback('light');
    showToast('Функция смены адреса в разработке');
});

document.getElementById('btn-settings').addEventListener('click', () => {
    hapticFeedback('light');
    showToast('Настройки в разработке');
});

document.getElementById('btn-copy-ref').addEventListener('click', () => {
    hapticFeedback('medium');
    const refLink = 'https://t.me/guarantor_otc_bot?start=ref_12345';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(refLink).then(() => {
            showToast('Ссылка скопирована!');
            hapticFeedback('success');
        });
    } else {
        showToast('Не удалось скопировать');
    }
});

document.getElementById('btn-new-ticket').addEventListener('click', () => {
    openModal('modal-new-ticket');
});

// ===== MODAL CLOSE BUTTONS =====
document.getElementById('modal-create-deal-close').addEventListener('click', () => closeModal('modal-create-deal'));
document.getElementById('modal-deal-close').addEventListener('click', () => closeModal('modal-deal-details'));
document.getElementById('modal-ticket-close').addEventListener('click', () => closeModal('modal-new-ticket'));

// Close modals on background click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAllModals();
        }
    });
});

// ===== NAVIGATION BAR =====
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const screenName = btn.getAttribute('data-screen');
        navigateTo(screenName);
    });
});

// ===== DEALS FILTER =====
document.querySelectorAll('.deals-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.deals-filter').forEach(b => {
            b.classList.remove('bg-emerald-500/20', 'text-emerald-400');
            b.classList.add('text-slate-400');
        });
        btn.classList.remove('text-slate-400');
        btn.classList.add('bg-emerald-500/20', 'text-emerald-400');
        
        appState.dealsFilter = btn.getAttribute('data-filter');
        loadDeals();
        hapticFeedback('light');
    });
});

// ===== REFERRAL LEVEL TABS =====
document.querySelectorAll('.ref-level-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ref-level-tab').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        
        appState.currentRefLevel = parseInt(btn.getAttribute('data-level'));
        loadReferrals();
        hapticFeedback('light');
    });
});

// ===== TELEGRAM BACK BUTTON HANDLER =====
if (WebApp && WebApp.BackButton) {
    WebApp.BackButton.onClick(() => {
        closeAllModals();
    });
}

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('home');
    
    // Load initial user data
    getUserData().then(data => {
        appState.userData = data;
        console.log('User data loaded:', data);
    }).catch(err => {
        console.error('Failed to load user data:', err);
    });
});

// Handle viewport changes
window.addEventListener('resize', () => {
    if (WebApp) {
        WebApp.expand();
    }
});

// Handle theme changes (dark/light)
if (WebApp && WebApp.onEvent) {
    WebApp.onEvent('themeChanged', () => {
        // Update colors based on theme
        const bgColor = WebApp.themeParams.bg_color;
        const textColor = WebApp.themeParams.text_color;
        document.documentElement.style.setProperty('--tg-theme-bg-color', bgColor);
        document.documentElement.style.setProperty('--tg-theme-text-color', textColor);
    });
}

// Prevent pull-to-refresh gesture
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });
