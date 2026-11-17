/* LIFE.OS module 2: StorageAdapter */
window.StorageAdapter = {
            KEY: 'life_os_plms_v2',
            createSampleData() {
                const today = Utils.todayISO();
                const d1 = Utils.addDaysISO(today, 1);
                const d2 = Utils.addDaysISO(today, 2);
                const dm1 = Utils.addDaysISO(today, -1);

                return {
                    version: 3,
                    settings: {
                        theme: 'midnight',
                        font: 'inter',
                        scale: 'md',
                        accent: '#6366f1',
                        currency: 'KZT',
                        timezone: 'Asia/Almaty',
                        timeFormat: '24h'
                    },
                    dashboardWidgets: [
                        { id: 'w_today_tasks', title: 'Задачи и события на сегодня', visible: true, span: 'lg:col-span-7' },
                        { id: 'w_time_balance', title: 'Баланс времени сегодня', visible: true, span: 'lg:col-span-5' },
                        { id: 'w_goals', title: 'Активные финансовые цели', visible: true, span: 'lg:col-span-6' },
                        { id: 'w_upcoming', title: 'Ближайшие события', visible: true, span: 'lg:col-span-6' }
                    ],
                    categories: [
                        { id: 'cat_edu', name: 'Education', type: 'schedule', color: '#6366f1' },
                        { id: 'cat_gym', name: 'Gym & Sport', type: 'schedule', color: '#10b981' },
                        { id: 'cat_work', name: 'Work / Подработка', type: 'schedule', color: '#f59e0b' },
                        { id: 'cat_personal', name: 'Personal', type: 'schedule', color: '#06b6d4' },
                        { id: 'cat_rest', name: 'Rest & Sleep', type: 'schedule', color: '#8b5cf6' },
                        { id: 'cat_free', name: 'Свободное окно', type: 'schedule', color: '#22c55e' },
                        { id: 'inc_salary', name: 'Зарплата / Подработка', type: 'income', color: '#10b981' },
                        { id: 'inc_stipend', name: 'Стипендия / Пассивный', type: 'income', color: '#06b6d4' },
                        { id: 'exp_food', name: 'Продукты и кафе', type: 'expense', color: '#f59e0b' },
                        { id: 'exp_trans', name: 'Транспорт', type: 'expense', color: '#6366f1' },
                        { id: 'exp_edu', name: 'Обучение и книги', type: 'expense', color: '#8b5cf6' },
                        { id: 'exp_other', name: 'Покупки и жильё', type: 'expense', color: '#ef4444' }
                    ],
                    events: [
                        { id: 'ev_1', title: 'Утренняя тренировка в зале', date: today, start: '07:30', end: '09:00', categoryId: 'cat_gym', slotType: 'busy', priority: 'high', status: 'completed', repeat: 'none', hasIncome: false, incomeType: 'fixed', incomeValue: 0, desc: 'Силовая + кардио 20 мин' },
                        { id: 'ev_2', title: 'Учёба: Алгоритмы и базы данных', date: today, start: '10:00', end: '13:00', categoryId: 'cat_edu', slotType: 'busy', priority: 'high', status: 'planned', repeat: 'weekdays', hasIncome: false, incomeType: 'fixed', incomeValue: 0, desc: 'Подготовка лабораторной' },
                        { id: 'ev_3', title: 'Подтверждённое свободное время (отдых)', date: today, start: '13:30', end: '15:00', categoryId: 'cat_free', slotType: 'free', priority: 'low', status: 'planned', repeat: 'none', hasIncome: false, incomeType: 'fixed', incomeValue: 0, desc: 'Доступное окно' },
                        { id: 'ev_4', title: 'Подработка: Разработка модуля', date: today, start: '15:30', end: '19:30', categoryId: 'cat_work', slotType: 'busy', priority: 'high', status: 'planned', repeat: 'none', hasIncome: true, incomeType: 'hourly', incomeValue: 4500, desc: '4 часа по 4 500 ₸/ч' },
                        { id: 'ev_5', title: 'Английский язык', date: d1, start: '11:00', end: '12:30', categoryId: 'cat_edu', slotType: 'busy', priority: 'medium', status: 'planned', repeat: 'none', hasIncome: false, incomeType: 'fixed', incomeValue: 0, desc: 'Speaking club' },
                        { id: 'ev_6', title: 'Смена / Фриланс проект', date: d1, start: '14:00', end: '18:00', categoryId: 'cat_work', slotType: 'busy', priority: 'high', status: 'planned', repeat: 'none', hasIncome: true, incomeType: 'fixed', incomeValue: 16000, desc: '' },
                        { id: 'ev_7', title: 'Бег и растяжка', date: d2, start: '08:00', end: '09:30', categoryId: 'cat_gym', slotType: 'busy', priority: 'medium', status: 'planned', repeat: 'none', hasIncome: false, incomeType: 'fixed', incomeValue: 0, desc: '' },
                        { id: 'ev_8', title: 'Проектная сессия', date: dm1, start: '10:00', end: '14:00', categoryId: 'cat_work', slotType: 'busy', priority: 'high', status: 'completed', repeat: 'none', hasIncome: true, incomeType: 'fixed', incomeValue: 20000, desc: 'Закрыт спринт' }
                    ],
                    accounts: [
                        { id: 'acc_kaspi', name: 'Kaspi Gold', type: 'bank', balance: 340000 },
                        { id: 'acc_deposit', name: 'Депозит / Накопительный', type: 'asset', balance: 650000 },
                        { id: 'acc_cash', name: 'Наличные (KZT)', type: 'cash', balance: 45000 },
                        { id: 'acc_debt', name: 'Рассрочка / Обязательства', type: 'debt', balance: 85000 }
                    ],
                    transactions: [
                        { id: 'tx_1', type: 'income', date: today, amount: 20000, categoryId: 'inc_salary', accountId: 'acc_kaspi', desc: 'Оплата за разработку модуля' },
                        { id: 'tx_2', type: 'expense', date: today, amount: 8500, categoryId: 'exp_food', accountId: 'acc_kaspi', desc: 'Продукты на неделю' },
                        { id: 'tx_3', type: 'expense', date: dm1, amount: 2400, categoryId: 'exp_trans', accountId: 'acc_kaspi', desc: 'Такси и проезд' },
                        { id: 'tx_4', type: 'income', date: dm1, amount: 48000, categoryId: 'inc_stipend', accountId: 'acc_kaspi', desc: 'Стипендия' }
                    ],
                    goals: [
                        { id: 'g_1', title: 'Финансовая подушка (6 мес)', current: 650000, target: 1200000, deadline: Utils.addDaysISO(today, 180), color: '#10b981' },
                        { id: 'g_2', title: 'Новый ноутбук для работы', current: 240000, target: 550000, deadline: Utils.addDaysISO(today, 90), color: '#6366f1' }
                    ]
                };
            },
            normalizeData(input) {
                const base = this.createSampleData();
                if (!input || typeof input !== 'object' || Array.isArray(input) || !Array.isArray(input.events) || !Array.isArray(input.accounts)) throw new Error('Некорректный формат резервной копии');
                const arr = (key) => Array.isArray(input[key]) ? input[key] : base[key];
                const cleanText = (v, max = 500) => String(v ?? '').slice(0, max);
                const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : Utils.todayISO();
                const validTime = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')) ? String(v) : '00:00';
                const ids = new Set();
                const uniqueId = v => { let id = Utils.safeId(v); if (!id || ids.has(id)) id = 'item_' + Math.random().toString(36).slice(2, 10); ids.add(id); return id; };
                const categories = arr('categories').filter(x => x && typeof x === 'object').map(c => ({ id: uniqueId(c.id), name: cleanText(c.name, 60) || 'Без названия', type: ['schedule','income','expense'].includes(c.type) ? c.type : 'schedule', color: Utils.validColor(c.color) }));
                const categoryIds = new Set(categories.map(c => c.id));
                const accounts = arr('accounts').filter(x => x && typeof x === 'object').map(a => ({ id: uniqueId(a.id), name: cleanText(a.name, 80) || 'Счёт', type: ['bank','cash','asset','debt'].includes(a.type) ? a.type : 'bank', balance: Number.isFinite(Number(a.balance)) ? Math.max(0, Number(a.balance)) : 0 }));
                const accountIds = new Set(accounts.map(a => a.id));
                const events = arr('events').filter(x => x && typeof x === 'object').map(e => ({ id: uniqueId(e.id), title: cleanText(e.title, 120) || 'Без названия', date: validDate(e.date), start: validTime(e.start), end: validTime(e.end), categoryId: categoryIds.has(e.categoryId) ? e.categoryId : (categories.find(c => c.type === 'schedule')?.id || ''), slotType: e.slotType === 'free' ? 'free' : 'busy', priority: ['low','medium','high'].includes(e.priority) ? e.priority : 'medium', status: e.status === 'completed' ? 'completed' : 'planned', repeat: ['none','daily','weekdays','weekly'].includes(e.repeat) ? e.repeat : 'none', hasIncome: Boolean(e.hasIncome), incomeType: e.incomeType === 'hourly' ? 'hourly' : 'fixed', incomeValue: Math.max(0, Number(e.incomeValue) || 0), desc: cleanText(e.desc, 1000), useCustomColor: Boolean(e.useCustomColor), customColor: Utils.validColor(e.customColor), reminder: Boolean(e.reminder) }));
                const transactions = arr('transactions').filter(x => x && typeof x === 'object').map(t => ({ id: uniqueId(t.id), type: t.type === 'income' ? 'income' : 'expense', date: validDate(t.date), amount: Math.max(0, Number(t.amount) || 0), categoryId: categoryIds.has(t.categoryId) ? t.categoryId : '', accountId: accountIds.has(t.accountId) ? t.accountId : '', desc: cleanText(t.desc, 500) }));
                const goals = arr('goals').filter(x => x && typeof x === 'object').map(g => ({ id: uniqueId(g.id), title: cleanText(g.title, 120) || 'Цель', current: Math.max(0, Number(g.current) || 0), target: Math.max(1, Number(g.target) || 1), deadline: validDate(g.deadline), color: Utils.validColor(g.color, '#10b981') }));
                const settings = { ...base.settings, ...(input.settings && typeof input.settings === 'object' ? input.settings : {}) };
                settings.theme = ['midnight','oled','nord','emerald','light'].includes(settings.theme) ? settings.theme : 'midnight';
                settings.font = ['inter','manrope','mono'].includes(settings.font) ? settings.font : 'inter';
                settings.scale = ['sm','md','lg'].includes(settings.scale) ? settings.scale : 'md';
                settings.currency = ['KZT','USD','EUR','RUB'].includes(settings.currency) ? settings.currency : 'KZT';
                settings.timeFormat = settings.timeFormat === '12h' ? '12h' : '24h';
                settings.accent = Utils.validColor(settings.accent);
                const timezone = cleanText(settings.timezone, 80);
                try { new Intl.DateTimeFormat('ru-RU', { timeZone: timezone }).format(); settings.timezone = timezone; } catch { settings.timezone = 'Asia/Almaty'; }
                return { ...base, ...input, version: 3, settings, categories, accounts, events, transactions, goals,
                    dashboardWidgets: base.dashboardWidgets.map(w => ({ ...w, visible: (Array.isArray(input.dashboardWidgets) ? input.dashboardWidgets.find(x => x && x.id === w.id) : null)?.visible !== false })) };
            },
            load() {
                try {
                    const raw = localStorage.getItem(this.KEY);
                    if (!raw) return this.createSampleData();
                    return this.normalizeData(JSON.parse(raw));
                } catch (e) {
                    console.error('Storage Load Error:', e);
                    return this.createSampleData();
                }
            },
            save(state) {
                try { localStorage.setItem(this.KEY, JSON.stringify(state)); return true; }
                catch (e) { console.error('Storage Save Error:', e); UI?.toast?.('Не удалось сохранить: память браузера заполнена или недоступна'); return false; }
            },
            resetToSample() {
                Store.state = this.createSampleData();
                this.save(Store.state);
                UI.closeModal('confirmModal');
                App.refreshAll();
                UI.toast('Данные сброшены к демонстрационному шаблону');
            }
        };
