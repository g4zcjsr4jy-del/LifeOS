/* LIFE.OS module 7: FinanceView */
window.FinanceView = {
            render() {
                const { assets, debts, netWorth } = Store.computeNetWorth();
                document.getElementById('financeCurrencyBadge').textContent = Store.state.settings.currency;
                document.getElementById('finNetWorthTotal').textContent = Utils.formatMoney(netWorth);
                document.getElementById('finTotalAssets').textContent = Utils.formatMoney(assets);
                document.getElementById('finTotalDebts').textContent = Utils.formatMoney(debts);

                // Accounts Grid
                const typeLabels = { bank: 'Банк', cash: 'Наличные', asset: 'Актив', debt: 'Долг / Обязательство' };
                document.getElementById('financeAccountsGrid').innerHTML = Store.state.accounts.map(acc => `
                    <div onclick="UI.openAccountModal('${acc.id}')" class="elevated p-3.5 rounded-xl cursor-pointer hover:opacity-90 transition flex items-center justify-between">
                        <div>
                            <div class="text-xs font-bold">${Utils.escapeHTML(acc.name)}</div>
                            <div class="text-[11px]" style="color: var(--text-muted);">${typeLabels[acc.type] || acc.type}</div>
                        </div>
                        <div class="font-bold text-sm tabular-nums" style="color: ${acc.type === 'debt' ? 'var(--danger)' : 'var(--text-main)'};">
                            ${acc.type === 'debt' ? '-' : ''}${Utils.formatMoney(acc.balance)}
                        </div>
                    </div>
                `).join('');

                // Savings Goals with Daily/Weekly/Monthly breakdown
                const today = Utils.todayISO();
                document.getElementById('financeGoalsList').innerHTML = Store.state.goals.map(g => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                    const remaining = Math.max(0, g.target - g.current);
                    const daysLeft = Math.max(1, Math.ceil((new Date(g.deadline) - new Date(today)) / 86400000));
                    const perDay = remaining / daysLeft;
                    const perWeek = perDay * 7;
                    const perMonth = perDay * 30;

                    return `
                    <div class="elevated p-4 rounded-xl space-y-2.5">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <div class="font-bold text-sm">${Utils.escapeHTML(g.title)}</div>
                                <div class="text-xs tabular-nums" style="color: var(--text-sub);">${Utils.formatMoney(g.current)} / ${Utils.formatMoney(g.target)} • Дедлайн: ${Utils.formatDateRU(g.deadline)} (${daysLeft} дн.)</div>
                            </div>
                            <div class="flex items-center gap-1">
                                <button onclick="FinanceView.depositGoal('${g.id}', 10000)" class="px-2 py-1 rounded-lg text-[11px] font-semibold" style="background:var(--success-soft); color:var(--success);">+10k</button>
                                <button onclick="UI.openGoalModal('${g.id}')" class="p-1.5 rounded-lg" style="color:var(--text-muted);"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                                <button onclick="FinanceView.deleteGoal('${g.id}')" class="p-1.5 rounded-lg" style="color:var(--danger);"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                            </div>
                        </div>
                        <div class="w-full h-2.5 rounded-full overflow-hidden" style="background: var(--bg-card);">
                            <div class="h-full rounded-full" style="width:${pct}%; background:${g.color};"></div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 pt-1 text-[11px] tabular-nums" style="color: var(--text-sub);">
                            <div>В день: <strong style="color:var(--text-main)">${Utils.formatMoney(perDay)}</strong></div>
                            <div>В неделю: <strong style="color:var(--text-main)">${Utils.formatMoney(perWeek)}</strong></div>
                            <div>В месяц: <strong style="color:var(--text-main)">${Utils.formatMoney(perMonth)}</strong></div>
                        </div>
                    </div>`;
                }).join('');

                FinanceCalc.render();
                this.renderTransactions();
                window.lucide?.createIcons?.();
            },

            renderTransactions() {
                const query = (document.getElementById('txSearchInput')?.value || '').toLowerCase();
                const typeFilter = document.getElementById('txTypeFilter')?.value || 'all';

                const filtered = Store.state.transactions
                    .filter(tx => (typeFilter === 'all' || tx.type === typeFilter) && tx.desc.toLowerCase().includes(query))
                    .sort((a, b) => b.date.localeCompare(a.date));

                document.getElementById('financeTxTableBody').innerHTML = filtered.map(tx => {
                    const cat = Store.getCategory(tx.categoryId);
                    const acc = Store.state.accounts.find(a => a.id === tx.accountId);
                    const isInc = tx.type === 'income';
                    return `
                    <tr>
                        <td class="py-2.5 px-3 text-xs">${Utils.formatDateRU(tx.date)}</td>
                        <td class="py-2.5 px-3"><span class="text-xs px-2 py-0.5 rounded font-medium" style="background: color-mix(in srgb, ${cat.color} 18%, transparent); color:${cat.color};">${Utils.escapeHTML(cat.name)}</span></td>
                        <td class="py-2.5 px-3 font-medium">${Utils.escapeHTML(tx.desc)}</td>
                        <td class="py-2.5 px-3 text-xs" style="color:var(--text-sub)">${acc ? Utils.escapeHTML(acc.name) : '—'}</td>
                        <td class="py-2.5 px-3 text-right font-bold" style="color:${isInc ? 'var(--success)' : 'var(--danger)'};">${isInc ? '+' : '-'}${Utils.formatMoney(tx.amount)}</td>
                        <td class="py-2.5 px-2 text-right">
                            <button onclick="FinanceView.deleteTransaction('${tx.id}')" class="p-1 opacity-60 hover:opacity-100" style="color:var(--danger);"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                        </td>
                    </tr>`;
                }).join('');
                window.lucide?.createIcons?.();
            },

            saveAccount(e) {
                e.preventDefault();
                const id = document.getElementById('accId').value;
                const payload = {
                    id: id || 'acc_' + Date.now(),
                    name: document.getElementById('accName').value.trim(),
                    type: document.getElementById('accType').value,
                    balance: Number(document.getElementById('accBalance').value) || 0
                };
                if (id) {
                    const idx = Store.state.accounts.findIndex(a => a.id === id);
                    if (idx !== -1) Store.state.accounts[idx] = payload;
                } else {
                    Store.state.accounts.push(payload);
                }
                UI.closeModal('accountModal');
                Store.commit();
                UI.toast('Счёт сохранён');
            },

            deleteCurrentAccount() {
                const id = document.getElementById('accId').value;
                if (Store.state.transactions.some(tx => tx.accountId === id)) { UI.toast('Нельзя удалить счёт: сначала удалите или перенесите связанные операции'); return; }
                Store.state.accounts = Store.state.accounts.filter(a => a.id !== id);
                UI.closeModal('accountModal');
                Store.commit();
                UI.toast('Счёт удалён');
            },

            saveTransaction(e) {
                e.preventDefault();
                const type = document.getElementById('txType').value;
                const amount = Math.max(0, Number(document.getElementById('txAmount').value) || 0);
                if (!Number.isFinite(amount) || amount <= 0) { UI.toast('Укажите сумму больше нуля'); return; }
                const accountId = document.getElementById('txAccount').value;
                const payload = {
                    id: 'tx_' + Date.now(),
                    type,
                    date: document.getElementById('txDate').value,
                    amount,
                    categoryId: document.getElementById('txCategory').value,
                    accountId,
                    desc: document.getElementById('txDesc').value.trim()
                };

                const acc = Store.state.accounts.find(a => a.id === accountId);
                if (acc) {
                    if (acc.type === 'debt') {
                        acc.balance = type === 'expense' ? acc.balance + amount : Math.max(0, acc.balance - amount);
                    } else {
                        acc.balance = type === 'income' ? acc.balance + amount : Math.max(0, acc.balance - amount);
                    }
                }

                Store.state.transactions.unshift(payload);
                UI.closeModal('txModal');
                Store.commit();
                UI.toast('Операция записана');
            },

            deleteTransaction(id) {
                const tx = Store.state.transactions.find(t => t.id === id);
                const acc = tx && Store.state.accounts.find(a => a.id === tx.accountId);
                if (tx && acc) {
                    if (acc.type === 'debt') acc.balance = tx.type === 'expense' ? Math.max(0, acc.balance - tx.amount) : acc.balance + tx.amount;
                    else acc.balance = tx.type === 'income' ? Math.max(0, acc.balance - tx.amount) : acc.balance + tx.amount;
                }
                Store.state.transactions = Store.state.transactions.filter(t => t.id !== id);
                Store.commit();
                UI.toast('Операция удалена');
            },

            saveGoal(e) {
                e.preventDefault();
                const id = document.getElementById('goalId').value;
                const payload = {
                    id: id || 'goal_' + Date.now(),
                    title: document.getElementById('goalTitle').value.trim(),
                    current: Math.max(0, Number(document.getElementById('goalCurrent').value) || 0),
                    target: Math.max(1, Number(document.getElementById('goalTarget').value) || 1),
                    deadline: document.getElementById('goalDeadline').value,
                    color: document.getElementById('goalColor').value
                };
                if (id) {
                    const idx = Store.state.goals.findIndex(g => g.id === id);
                    if (idx !== -1) Store.state.goals[idx] = payload;
                } else {
                    Store.state.goals.push(payload);
                }
                UI.closeModal('goalModal');
                Store.commit();
                UI.toast('Финансовая цель сохранена');
            },

            depositGoal(id, amount) {
                const g = Store.state.goals.find(item => item.id === id);
                if (g) {
                    g.current += amount;
                    Store.commit();
                    UI.toast(`+${Utils.formatMoney(amount)} к цели «${Utils.escapeHTML(g.title)}»`);
                }
            },

            deleteGoal(id) {
                Store.state.goals = Store.state.goals.filter(g => g.id !== id);
                Store.commit();
                UI.toast('Цель удалена');
            }
        };

