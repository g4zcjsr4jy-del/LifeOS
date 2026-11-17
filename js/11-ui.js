/* LIFE.OS module 10: UI */
window.UI = {
            openModal(id) {
                const el = document.getElementById(id);
                el.classList.remove('hidden');
                el.classList.add('flex');
                window.lucide?.createIcons?.();
            },
            closeModal(id) {
                const el = document.getElementById(id);
                el.classList.add('hidden');
                el.classList.remove('flex');
            },
            toast(msg) {
                const t = document.getElementById('toast');
                document.getElementById('toastMessage').textContent = msg;
                t.classList.remove('opacity-0', 'translate-y-2');
                clearTimeout(this._timer);
                this._timer = setTimeout(() => t.classList.add('opacity-0', 'translate-y-2'), 2400);
            },
            openEventModal(eventId = null, defaultDate = null, defaultStart = null) {
                const catSel = document.getElementById('evCategory');
                catSel.innerHTML = Store.state.categories
                    .filter(c => c.type === 'schedule')
                    .map(c => `<option value="${c.id}">${Utils.escapeHTML(c.name)}</option>`).join('');

                const delBtn = document.getElementById('evDeleteBtn');
                if (eventId) {
                    const ev = Store.state.events.find(e => e.id === eventId);
                    if (!ev) return;
                    document.getElementById('eventModalTitle').textContent = 'Редактировать событие';
                    document.getElementById('evId').value = ev.id;
                    document.getElementById('evTitle').value = ev.title;
                    document.getElementById('evDate').value = ev.date;
                    document.getElementById('evStart').value = ev.start;
                    document.getElementById('evEnd').value = ev.end;
                    document.getElementById('evCategory').value = ev.categoryId;
                    document.getElementById('evSlotType').value = ev.slotType || 'busy';
                    document.getElementById('evPriority').value = ev.priority || 'medium';
                    document.getElementById('evStatus').value = ev.status || 'planned';
                    document.getElementById('evRepeat').value = ev.repeat || 'none';
                    document.getElementById('evUseCustomColor').checked = !!ev.useCustomColor;
                    document.getElementById('evCustomColor').value = ev.customColor || '#6366f1';
                    document.getElementById('evReminder').checked = !!ev.reminder;
                    document.getElementById('evHasIncome').checked = !!ev.hasIncome;
                    document.getElementById('evIncomeType').value = ev.incomeType || 'fixed';
                    document.getElementById('evIncomeValue').value = ev.incomeValue || '';
                    document.getElementById('evDesc').value = ev.desc || '';
                    document.getElementById('evIncomeFields').classList.toggle('hidden', !ev.hasIncome);
                    delBtn.classList.remove('hidden');
                } else {
                    document.getElementById('eventModalTitle').textContent = 'Новое событие';
                    document.getElementById('evId').value = '';
                    document.getElementById('evTitle').value = '';
                    document.getElementById('evDate').value = defaultDate || Utils.todayISO();
                    const st = defaultStart || '10:00';
                    const endH = Math.min(23, parseInt(st.split(':')[0], 10) + 1);
                    document.getElementById('evStart').value = st;
                    document.getElementById('evEnd').value = `${String(endH).padStart(2, '0')}:00`;
                    document.getElementById('evSlotType').value = 'busy';
                    document.getElementById('evPriority').value = 'medium';
                    document.getElementById('evStatus').value = 'planned';
                    document.getElementById('evRepeat').value = 'none';
                    document.getElementById('evUseCustomColor').checked = false;
                    document.getElementById('evReminder').checked = false;
                    document.getElementById('evHasIncome').checked = false;
                    document.getElementById('evIncomeValue').value = '';
                    document.getElementById('evDesc').value = '';
                    document.getElementById('evIncomeFields').classList.add('hidden');
                    delBtn.classList.add('hidden');
                }
                this.openModal('eventModal');
            },
            openCategoryModal() {
                this.renderCategoriesModalList();
                this.openModal('categoryModal');
            },
            renderCategoriesModalList() {
                const labels = { schedule: 'Время', income: 'Доход', expense: 'Расход' };
                document.getElementById('categoriesListContainer').innerHTML = Store.state.categories.map(c => `
                    <div class="elevated px-3 py-2 rounded-xl flex items-center justify-between text-xs">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" style="background:${c.color}"></span>
                            <span class="font-semibold">${Utils.escapeHTML(c.name)}</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded" style="background:var(--bg-card); color:var(--text-muted)">${labels[c.type]}</span>
                        </div>
                        <button onclick="SettingsView.deleteCategory('${c.id}')" class="p-1" style="color:var(--danger)"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                `).join('');
                window.lucide?.createIcons?.();
            },
            openAccountModal(accId = null) {
                const delBtn = document.getElementById('accDeleteBtn');
                if (accId) {
                    const acc = Store.state.accounts.find(a => a.id === accId);
                    if (!acc) return;
                    document.getElementById('accId').value = acc.id;
                    document.getElementById('accName').value = acc.name;
                    document.getElementById('accType').value = acc.type;
                    document.getElementById('accBalance').value = acc.balance;
                    delBtn.classList.remove('hidden');
                } else {
                    document.getElementById('accId').value = '';
                    document.getElementById('accName').value = '';
                    document.getElementById('accType').value = 'bank';
                    document.getElementById('accBalance').value = '';
                    delBtn.classList.add('hidden');
                }
                this.openModal('accountModal');
            },
            openTxModal(defaultType = 'expense') {
                document.getElementById('txType').value = defaultType;
                document.getElementById('txDate').value = Utils.todayISO();
                document.getElementById('txAmount').value = '';
                document.getElementById('txDesc').value = '';
                document.getElementById('txAccount').innerHTML = Store.state.accounts.map(a => `<option value="${a.id}">${Utils.escapeHTML(a.name)}</option>`).join('');
                this.populateTxCategories();
                this.openModal('txModal');
            },
            populateTxCategories() {
                const type = document.getElementById('txType').value;
                document.getElementById('txCategory').innerHTML = Store.state.categories
                    .filter(c => c.type === type)
                    .map(c => `<option value="${c.id}">${Utils.escapeHTML(c.name)}</option>`).join('');
            },
            openGoalModal(goalId = null) {
                if (goalId) {
                    const g = Store.state.goals.find(item => item.id === goalId);
                    if (!g) return;
                    document.getElementById('goalId').value = g.id;
                    document.getElementById('goalTitle').value = g.title;
                    document.getElementById('goalCurrent').value = g.current;
                    document.getElementById('goalTarget').value = g.target;
                    document.getElementById('goalDeadline').value = g.deadline;
                    document.getElementById('goalColor').value = g.color;
                } else {
                    document.getElementById('goalId').value = '';
                    document.getElementById('goalTitle').value = '';
                    document.getElementById('goalCurrent').value = 0;
                    document.getElementById('goalTarget').value = '';
                    document.getElementById('goalDeadline').value = Utils.addDaysISO(Utils.todayISO(), 90);
                    document.getElementById('goalColor').value = '#10b981';
                }
                this.openModal('goalModal');
            },
            openDashboardCustomizer() {
                const list = document.getElementById('widgetCustomList');
                list.innerHTML = Store.state.dashboardWidgets.map((w, idx) => `
                    <div class="elevated p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <label class="flex items-center gap-2 cursor-pointer font-semibold">
                            <input type="checkbox" ${w.visible ? 'checked' : ''} onchange="App.toggleWidget('${w.id}')" class="accent-indigo-500">
                            <span>${Utils.escapeHTML(w.title)}</span>
                        </label>
                        <div class="flex gap-1">
                            <button onclick="App.moveWidget(${idx}, -1)" class="p-1 rounded hover:opacity-75"><i data-lucide="arrow-up" class="w-3.5 h-3.5"></i></button>
                            <button onclick="App.moveWidget(${idx}, 1)" class="p-1 rounded hover:opacity-75"><i data-lucide="arrow-down" class="w-3.5 h-3.5"></i></button>
                        </div>
                    </div>
                `).join('');
                this.openModal('widgetCustomModal');
            },
            openConfirmModal(title, text, onConfirm) {
                document.getElementById('confirmModalTitle').textContent = title;
                document.getElementById('confirmModalText').textContent = text;
                const btn = document.getElementById('confirmModalActionBtn');
                btn.onclick = onConfirm;
                this.openModal('confirmModal');
            }
        };

