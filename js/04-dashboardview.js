/* LIFE.OS module 4: DashboardView */
window.DashboardView = {
            render() {
                const today = Utils.todayISO();
                const todayEvents = Store.getExpandedEventsForDate(today).sort((a, b) => Utils.timeToMins(a.start) - Utils.timeToMins(b.start));
                const timeMetrics = Store.computeDayTimeMetrics(today);
                const { netWorth } = Store.computeNetWorth();

                // Monthly income & expenses
                const monthPrefix = today.slice(0, 7);
                let monthInc = 0, monthExp = 0;
                Store.state.transactions.forEach(tx => {
                    if (tx.date.startsWith(monthPrefix)) {
                        if (tx.type === 'income') monthInc += Number(tx.amount);
                        else monthExp += Number(tx.amount);
                    }
                });

                const taskEvents = todayEvents.filter(e => e.slotType !== 'free');
                const completedCount = taskEvents.filter(e => e.status === 'completed').length;
                const completionPct = taskEvents.length > 0 ? Math.round((completedCount / taskEvents.length) * 100) : 0;

                // Top KPIs
                document.getElementById('dashTopKpis').innerHTML = `
                    <div class="card rounded-2xl p-4">
                        <div class="flex items-center justify-between text-xs" style="color: var(--text-sub);">
                            <span>Общий капитал</span>
                            <i data-lucide="wallet" class="w-4 h-4" style="color: var(--accent);"></i>
                        </div>
                        <div class="text-xl sm:text-2xl font-extrabold mt-1.5 tabular-nums">${Utils.formatMoney(netWorth)}</div>
                        <div class="text-[11px] mt-1 tabular-nums" style="color: var(--success);">+${Utils.formatMoney(monthInc - monthExp)} поток за мес</div>
                    </div>

                    <div class="card rounded-2xl p-4">
                        <div class="flex items-center justify-between text-xs" style="color: var(--text-sub);">
                            <span>Занято / Свободно</span>
                            <i data-lucide="clock" class="w-4 h-4" style="color: var(--info);"></i>
                        </div>
                        <div class="text-xl sm:text-2xl font-extrabold mt-1.5 tabular-nums">${Utils.minsToText(timeMetrics.busyMins)}</div>
                        <div class="text-[11px] mt-1 tabular-nums" style="color: var(--success);">Окна: ${Utils.minsToText(timeMetrics.confirmedFreeMins)} • Не распр: ${Utils.minsToText(timeMetrics.unallocatedMins)}</div>
                    </div>

                    <div class="card rounded-2xl p-4">
                        <div class="flex items-center justify-between text-xs" style="color: var(--text-sub);">
                            <span>Выполнение задач</span>
                            <i data-lucide="check-circle" class="w-4 h-4" style="color: var(--success);"></i>
                        </div>
                        <div class="text-xl sm:text-2xl font-extrabold mt-1.5 tabular-nums">${completionPct}%</div>
                        <div class="text-[11px] mt-1" style="color: var(--text-muted);">${completedCount} из ${taskEvents.length} дел на сегодня</div>
                    </div>

                    <div class="card rounded-2xl p-4">
                        <div class="flex items-center justify-between text-xs" style="color: var(--text-sub);">
                            <span>Доходы / Расходы (мес)</span>
                            <i data-lucide="trending-up" class="w-4 h-4" style="color: var(--warning);"></i>
                        </div>
                        <div class="text-sm sm:text-base font-bold mt-1.5 tabular-nums" style="color: var(--success);">+${Utils.formatMoney(monthInc)}</div>
                        <div class="text-xs font-semibold tabular-nums" style="color: var(--danger);">-${Utils.formatMoney(monthExp)}</div>
                    </div>
                `;

                // Render Customizable Widgets
                const container = document.getElementById('dashboardWidgetsContainer');
                container.innerHTML = Store.state.dashboardWidgets
                    .filter(w => w.visible)
                    .map(w => this.renderWidgetCard(w, todayEvents, timeMetrics))
                    .join('');
            },

            renderWidgetCard(widget, todayEvents, timeMetrics) {
                if (widget.id === 'w_today_tasks') {
                    return `
                    <div class="${widget.span} card rounded-2xl p-5 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-base">Задачи и расписание на сегодня</h3>
                            <button onclick="UI.openEventModal(null, '${Utils.todayISO()}')" class="btn-primary px-2.5 py-1 rounded-lg text-xs font-semibold">+ Добавить</button>
                        </div>
                        <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                            ${todayEvents.length === 0 ? `<div class="text-xs py-6 text-center" style="color: var(--text-muted);">На сегодня событий пока нет</div>` : todayEvents.map(ev => {
                                const cat = Store.getCategory(ev.categoryId);
                                const color = ev.useCustomColor ? ev.customColor : cat.color;
                                const isDone = ev.status === 'completed';
                                return `
                                <div class="elevated p-3 rounded-xl flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <button onclick="ScheduleView.toggleEventStatus('${ev.id}')" class="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition"
                                                style="border-color: ${color}; background-color: ${isDone ? color : 'transparent'};">
                                            ${isDone ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}
                                        </button>
                                        <div class="min-w-0">
                                            <div class="text-xs sm:text-sm font-semibold truncate ${isDone ? 'line-through opacity-60' : ''}">${Utils.escapeHTML(ev.title)}</div>
                                            <div class="text-[11px] flex items-center gap-2 tabular-nums" style="color: var(--text-sub);">
                                                <span>${ev.start} – ${ev.end}</span>
                                                <span class="px-1.5 py-0.2 rounded" style="background-color: color-mix(in srgb, ${color} 18%, transparent); color: ${color};">${Utils.escapeHTML(cat.name)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onclick="UI.openEventModal('${ev.id}')" class="p-1.5 rounded-lg hover:opacity-75" style="color: var(--text-muted);">
                                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                }

                if (widget.id === 'w_time_balance') {
                    const busyPct = Math.round((timeMetrics.busyMins / 1440) * 100);
                    const freePct = Math.round((timeMetrics.confirmedFreeMins / 1440) * 100);
                    const unallocPct = Math.max(0, 100 - busyPct - freePct);
                    return `
                    <div class="${widget.span} card rounded-2xl p-5 flex flex-col justify-between space-y-4">
                        <div>
                            <h3 class="font-bold text-base">Распределение 24 часов сегодня</h3>
                            <p class="text-xs mt-0.5" style="color: var(--text-muted);">Незапланированные часы отделены от подтверждённых свободных окон</p>
                        </div>

                        <!-- Stacked Progress Bar -->
                        <div class="w-full h-4 rounded-full overflow-hidden flex" style="background-color: var(--bg-elevated);">
                            <div style="width:${busyPct}%; background-color: var(--accent);" title="Занято"></div>
                            <div style="width:${freePct}%; background-color: var(--success);" title="Подтверждённое свободное"></div>
                            <div style="width:${unallocPct}%; background-color: var(--border);" title="Нераспределённое время"></div>
                        </div>

                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--accent);"></span>Занято делами</span>
                                <span class="font-bold tabular-nums">${Utils.minsToText(timeMetrics.busyMins)} (${busyPct}%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--success);"></span>Подтверждённое свободное</span>
                                <span class="font-bold tabular-nums" style="color: var(--success);">${Utils.minsToText(timeMetrics.confirmedFreeMins)} (${freePct}%)</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--text-muted);"></span>Нераспределённое время</span>
                                <span class="font-bold tabular-nums" style="color: var(--text-sub);">${Utils.minsToText(timeMetrics.unallocatedMins)} (${unallocPct}%)</span>
                            </div>
                        </div>
                    </div>`;
                }

                if (widget.id === 'w_goals') {
                    return `
                    <div class="${widget.span} card rounded-2xl p-5 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-base">Активные финансовые цели</h3>
                            <button onclick="App.navigate('finance')" class="text-xs font-semibold" style="color: var(--accent);">Все цели →</button>
                        </div>
                        <div class="space-y-3">
                            ${Store.state.goals.slice(0, 3).map(g => {
                                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                                return `
                                <div class="elevated p-3 rounded-xl space-y-1.5">
                                    <div class="flex justify-between text-xs font-semibold">
                                        <span>${Utils.escapeHTML(g.title)}</span>
                                        <span class="tabular-nums">${pct}%</span>
                                    </div>
                                    <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: var(--bg-card);">
                                        <div class="h-full rounded-full" style="width:${pct}%; background-color:${g.color};"></div>
                                    </div>
                                    <div class="flex justify-between text-[11px] tabular-nums" style="color: var(--text-muted);">
                                        <span>${Utils.formatMoney(g.current)} из ${Utils.formatMoney(g.target)}</span>
                                        <span>До ${Utils.formatDateRU(g.deadline)}</span>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                }

                if (widget.id === 'w_upcoming') {
                    const future = Store.state.events
                        .filter(e => e.date >= Utils.todayISO() && e.status === 'planned')
                        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
                        .slice(0, 4);
                    return `
                    <div class="${widget.span} card rounded-2xl p-5 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-base">Ближайшие запланированные события</h3>
                            <button onclick="App.navigate('schedule')" class="text-xs font-semibold" style="color: var(--accent);">Календарь →</button>
                        </div>
                        <div class="space-y-2">
                            ${future.map(ev => {
                                const cat = Store.getCategory(ev.categoryId);
                                return `
                                <div class="elevated p-2.5 rounded-xl flex items-center justify-between text-xs">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <span class="w-2 h-2 rounded-full shrink-0" style="background:${cat.color};"></span>
                                        <span class="font-semibold truncate">${Utils.escapeHTML(ev.title)}</span>
                                    </div>
                                    <span class="tabular-nums shrink-0 ml-2" style="color: var(--text-sub);">${Utils.formatDateRU(ev.date)} • ${ev.start}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                }
                return '';
            }
        };

