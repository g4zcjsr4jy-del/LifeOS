/* LIFE.OS module 9: SettingsView */
window.SettingsView = {
            applyThemeTokens() {
                const s = Store.state.settings;
                document.documentElement.setAttribute('data-theme', s.theme);
                document.documentElement.setAttribute('data-font', s.font);
                document.documentElement.setAttribute('data-scale', s.scale);
                document.documentElement.style.setProperty('--accent', s.accent);
                document.documentElement.style.setProperty('--accent-soft', `color-mix(in srgb, ${s.accent} 16%, transparent)`);

                document.querySelectorAll('.theme-opt').forEach(b => {
                    const active = b.dataset.themeOpt === s.theme;
                    b.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
                    b.style.backgroundColor = active ? 'var(--accent-soft)' : 'var(--bg-elevated)';
                });

                if (document.getElementById('settingFontSelect')) {
                    document.getElementById('settingFontSelect').value = s.font;
                    document.getElementById('settingScaleSelect').value = s.scale;
                    document.getElementById('settingCurrencySelect').value = s.currency;
                    document.getElementById('settingTimezoneSelect').value = s.timezone;
                    document.getElementById('settingTimeFormatSelect').value = s.timeFormat;
                    document.getElementById('settingAccentPicker').value = s.accent;
                }
            },
            setTheme(t) { Store.state.settings.theme = t; Store.commit(); UI.toast('Тема обновлена'); },
            setFont(f) { Store.state.settings.font = f; Store.commit(); UI.toast('Шрифт изменён'); },
            setScale(sc) { Store.state.settings.scale = sc; Store.commit(); UI.toast('Масштаб изменён'); },
            setAccent(hex) { Store.state.settings.accent = hex; Store.commit(); },
            setCurrency(c) { Store.state.settings.currency = c; Store.commit(); UI.toast(`Валюта: ${c}`); },
            setTimezone(tz) { Store.state.settings.timezone = tz; Store.commit(); },
            setTimeFormat(tf) { Store.state.settings.timeFormat = tf; Store.commit(); },

            addCategory(e) {
                e.preventDefault();
                const name = document.getElementById('newCatName').value.trim();
                const color = Utils.validColor(document.getElementById('newCatColor').value);
                const type = ['schedule','income','expense'].includes(document.getElementById('newCatType').value) ? document.getElementById('newCatType').value : 'schedule';
                if (!name) return;
                Store.state.categories.push({ id: 'cat_' + Date.now(), name, type, color });
                document.getElementById('newCatName').value = '';
                Store.commit();
                UI.renderCategoriesModalList();
                UI.toast('Категория добавлена');
            },
            deleteCategory(id) {
                if (Store.state.events.some(e => e.categoryId === id) || Store.state.transactions.some(t => t.categoryId === id)) { UI.toast('Категория используется. Сначала измените связанные записи'); return; }
                Store.state.categories = Store.state.categories.filter(c => c.id !== id);
                Store.commit();
                UI.renderCategoriesModalList();
                UI.toast('Категория удалена');
            }
        };

