/* LIFE.OS module 1: Utils */
window.Utils = {
            escapeHTML(value) {
                return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
            },
            safeId(value) { return /^[a-zA-Z0-9_-]{1,80}$/.test(String(value || '')) ? String(value) : ''; },
            validColor(value, fallback = '#6366f1') { return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : fallback; },
            todayISO() {
                const timezone = window.Store?.state?.settings?.timezone || 'Asia/Almaty';
                const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
                const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
                return `${values.year}-${values.month}-${values.day}`;
            },
            addDaysISO(isoDate, deltaDays) {
                const [y, m, d] = isoDate.split('-').map(Number);
                const dt = new Date(y, m - 1, d + deltaDays);
                return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            },
            formatDateRU(isoDate) {
                if (!isoDate) return '';
                const [y, m, d] = isoDate.split('-');
                return `${d}.${m}.${y}`;
            },
            getDayNameRU(isoDate) {
                const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                const [y, m, d] = isoDate.split('-').map(Number);
                return days[new Date(y, m - 1, d).getDay()];
            },
            timeToMins(t) {
                const [h, m] = (t || '00:00').split(':').map(Number);
                return h * 60 + m;
            },
            minsToText(mins) {
                const safe = Math.max(0, Math.round(mins));
                const h = Math.floor(safe / 60);
                const m = safe % 60;
                return `${h}ч ${m}м`;
            },
            formatMoney(amount) {
                const curr = Store.state.settings.currency || 'KZT';
                const symbols = { KZT: '₸', USD: '$', EUR: '€', RUB: '₽' };
                const rates = { KZT: 1, USD: 0.002, EUR: 0.00185, RUB: 0.185 };
                const converted = (Number(amount) || 0) * (rates[curr] || 1);
                const formatted = curr === 'KZT' || curr === 'RUB'
                    ? Math.round(converted).toLocaleString('ru-RU')
                    : converted.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return `${formatted} ${symbols[curr] || '₸'}`;
            },
            eventDurationMins(ev) {
                const duration = this.timeToMins(ev.end) - this.timeToMins(ev.start);
                return duration > 0 && duration <= 1440 ? duration : 0;
            },
            eventIncome(ev) {
                if (!ev.hasIncome) return 0;
                const val = Number(ev.incomeValue) || 0;
                if (ev.incomeType === 'hourly') {
                    return val * (this.eventDurationMins(ev) / 60);
                }
                return val;
            }
        };

