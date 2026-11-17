/* LIFE.OS module 11: App */
window.App = {
            currentRoute: 'dashboard',
            TITLES: {
                dashboard: 'Главная панель',
                schedule: 'Календарь и Время',
                excel: 'Excel-режим расписания',
                finance: 'Финансы и Капитал',
                analytics: 'Аналитика и Продуктивность',
                settings: 'Настройки и Хранилище'
            },

            navigate(route) {
                this.currentRoute = route;
                document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
                document.getElementById(`view-${route}`).classList.remove('hidden');
                document.getElementById('pageTitle').textContent = this.TITLES[route] || 'LIFE.OS';

                document.querySelectorAll('.nav-item').forEach(btn => {
                    const active = btn.dataset.nav === route;
                    btn.style.backgroundColor = active ? 'var(--accent-soft)' : 'transparent';
                    btn.style.color = active ? 'var(--accent)' : 'var(--text-sub)';
                });

                this.refreshAll();
            },

            toggleWidget(id) {
                const w = Store.state.dashboardWidgets.find(item => item.id === id);
                if (w) {
                    w.visible = !w.visible;
                    Store.commit();
                    UI.openDashboardCustomizer();
                }
            },

            moveWidget(idx, dir) {
                const arr = Store.state.dashboardWidgets;
                const target = idx + dir;
                if (target < 0 || target >= arr.length) return;
                [arr[idx], arr[target]] = [arr[target], arr[idx]];
                Store.commit();
                UI.openDashboardCustomizer();
            },

            startClock() {
                const tick = () => {
                    const now = new Date();
                    const timezone = Store.state.settings.timezone || 'Asia/Almaty';
                    const optsDate = { timeZone: timezone, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
                    const optsTime = { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: Store.state.settings.timeFormat === '12h' };
                    const str = `${now.toLocaleDateString('ru-RU', optsDate)} • ${now.toLocaleTimeString('ru-RU', optsTime)}`;
                    const hEl = document.getElementById('headerDateTime');
                    const sEl = document.getElementById('sidebarClock');
                    if (hEl) hEl.textContent = str;
                    if (sEl) sEl.textContent = now.toLocaleTimeString('ru-RU', optsTime);
                };
                tick();
                setInterval(tick, 1000);
            },

            refreshAll() {
                SettingsView.applyThemeTokens();
                const { netWorth } = Store.computeNetWorth();
                const sbNw = document.getElementById('sidebarNetWorth');
                if (sbNw) sbNw.textContent = Utils.formatMoney(netWorth);

                if (this.currentRoute === 'dashboard') DashboardView.render();
                if (this.currentRoute === 'schedule') ScheduleView.render();
                if (this.currentRoute === 'excel') ExcelView.render();
                if (this.currentRoute === 'finance') FinanceView.render();
                if (this.currentRoute === 'analytics') AnalyticsView.render();

                window.lucide?.createIcons?.();
            },

            init() {
                this.startClock();
                this.navigate('dashboard');
            }
        };

        window.addEventListener('DOMContentLoaded', () => App.init());

