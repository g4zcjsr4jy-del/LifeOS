/* LIFE.OS module 5: ScheduleView */
window.ScheduleView = {
            mode: 'text', // 'text' | 'day' | '3days' | 'week' | 'month'
            anchorDate: Utils.todayISO(),
            draggedEventId: null,

            setMode(m) {
                this.mode = m;
                this.render();
            },
            shiftDate(dir) {
                const step = (this.mode === 'day' || this.mode === 'text') ? 1 : this.mode === '3days' ? 3 : this.mode === 'week' ? 7 : 30;
                this.anchorDate = Utils.addDaysISO(this.anchorDate, dir * step);
                this.render();
            },
            goToday() {
                this.anchorDate = Utils.todayISO();
                this.render();
            },
            getVisibleDates() {
                if (this.mode === 'day' || this.mode === 'text') return [this.anchorDate];
                if (this.mode === '3days') return [0, 1, 2].map(i => Utils.addDaysISO(this.anchorDate, i));
                if (this.mode === 'week') {
                    const [y, m, d] = this.anchorDate.split('-').map(Number);
                    const dt = new Date(y, m - 1, d);
                    const day = dt.getDay();
                    const diffToMon = day === 0 ? -6 : 1 - day;
                    const mon = Utils.addDaysISO(this.anchorDate, diffToMon);
                    return [0, 1, 2, 3, 4, 5, 6].map(i => Utils.addDaysISO(mon, i));
                }
                // Month mode: 35-day grid starting Monday of first week
                const [y, m] = this.anchorDate.split('-').map(Number);
                const firstOfMonth = new Date(y, m - 1, 1);
                const dow = firstOfMonth.getDay();
                const startOffset = dow === 0 ? -6 : 1 - dow;
                const startIso = Utils.addDaysISO(`${y}-${String(m).padStart(2, '0')}-01`, startOffset);
                return Array.from({ length: 35 }, (_, i) => Utils.addDaysISO(startIso, i));
            },

            render() {
                document.querySelectorAll('.cal-mode-btn').forEach(btn => {
                    const active = btn.dataset.calMode === this.mode;
                    btn.style.backgroundColor = active ? 'var(--accent)' : 'transparent';
                    btn.style.color = active ? '#fff' : 'var(--text-sub)';
                });

                const dates = this.getVisibleDates();
                const label = dates.length === 1
                    ? `${Utils.formatDateRU(dates[0])} (${Utils.getDayNameRU(dates[0])})`
                    : `${Utils.formatDateRU(dates[0])} — ${Utils.formatDateRU(dates[dates.length - 1])}`;
                document.getElementById('calendarCurrentRangeLabel').textContent = label;

                // Aggregate Metrics & Conflicts across visible dates
                let totalBusy = 0, totalFree = 0, totalUnalloc = 0, totalCompleted = 0, totalIncome = 0;
                let anyConflictDate = null;

                dates.forEach(d => {
                    const m = Store.computeDayTimeMetrics(d);
                    totalBusy += m.busyMins;
                    totalFree += m.confirmedFreeMins;
                    totalUnalloc += m.unallocatedMins;
                    totalCompleted += m.completedMins;
                    totalIncome += m.dayIncome;
                    if (Store.detectConflictsForDate(d).size > 0 && !anyConflictDate) anyConflictDate = d;
                });

                const banner = document.getElementById('scheduleConflictBanner');
                if (anyConflictDate) {
                    banner.classList.remove('hidden');
                    document.getElementById('scheduleConflictText').textContent = `Внимание: обнаружено пересечение событий (${Utils.formatDateRU(anyConflictDate)})!`;
                    this._conflictDate = anyConflictDate;
                } else {
                    banner.classList.add('hidden');
                }

                document.getElementById('scheduleTimeSummaryBar').innerHTML = `
                    <div><span style="color:var(--text-muted)">Занято:</span> <strong class="tabular-nums">${Utils.minsToText(totalBusy)}</strong></div>
                    <div><span style="color:var(--text-muted)">Свободно (подтв.):</span> <strong class="tabular-nums" style="color:var(--success)">${Utils.minsToText(totalFree)}</strong></div>
                    <div><span style="color:var(--text-muted)">Нераспределено:</span> <strong class="tabular-nums">${Utils.minsToText(totalUnalloc)}</strong></div>
                    <div><span style="color:var(--text-muted)">Факт / План:</span> <strong class="tabular-nums">${Utils.minsToText(totalCompleted)} / ${Utils.minsToText(totalBusy)}</strong></div>
                    <div><span style="color:var(--text-muted)">Доход периода:</span> <strong class="tabular-nums" style="color:var(--success)">${Utils.formatMoney(totalIncome)}</strong></div>
                `;

                const surface = document.getElementById('calendarRenderSurface');
                if (this.mode === 'text') {
                    this.renderTextSchedule(surface, dates[0]);
                } else if (this.mode === 'month') {
                    this.renderMonthGrid(surface, dates);
                } else {
                    this.renderTimeColumnsGrid(surface, dates);
                }

                this.renderCategoryBreakdown(dates);
                window.lucide?.createIcons?.();
            },

            renderTextSchedule(surface, dateIso) {
                const evs = Store.getExpandedEventsForDate(dateIso)
                    .slice()
                    .sort((a, b) => Utils.timeToMins(a.start) - Utils.timeToMins(b.start));
                const conflicts = Store.detectConflictsForDate(dateIso);

                surface.innerHTML = `
                    <div class="p-4 sm:p-5 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style="border-color: var(--border);">
                            <div>
                                <h3 class="font-bold text-sm sm:text-base">Расписание на ${Utils.formatDateRU(dateIso)} (${Utils.getDayNameRU(dateIso)})</h3>
                                <p class="text-xs" style="color: var(--text-muted);">Читаемый список по времени • Нажмите на строку для редактирования или удалите кнопкой справа</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="ScheduleView.copyDayAsText('${dateIso}')" class="elevated px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:opacity-85">
                                    <i data-lucide="copy" class="w-3.5 h-3.5" style="color: var(--accent);"></i>
                                    <span>Скопировать текстом</span>
                                </button>
                                <button type="button" onclick="UI.openEventModal(null, '${dateIso}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1">
                                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                    <span>Добавить</span>
                                </button>
                            </div>
                        </div>

                        ${evs.length === 0 ? `
                            <div class="py-10 text-center space-y-3">
                                <p class="text-sm" style="color: var(--text-muted);">На этот день пока нет записей.</p>
                                <button type="button" onclick="ScheduleView.openBatchModal()" class="btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5">
                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                    <span>Вставить расписание списком</span>
                                </button>
                            </div>
                        ` : `
                            <div class="divide-y" style="border-color: var(--border);">
                                ${evs.map(ev => {
                                    const cat = Store.getCategory(ev.categoryId);
                                    const color = ev.useCustomColor ? ev.customColor : cat.color;
                                    const isDone = ev.status === 'completed';
                                    const isConflict = conflicts.has(ev.id);
                                    return `
                                    <div class="py-3 px-2 flex items-center justify-between gap-3 rounded-xl hover:bg-white/[0.03] transition">
                                        <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1 cursor-pointer" onclick="UI.openEventModal('${ev.id}')">
                                            <button type="button" onclick="event.stopPropagation(); ScheduleView.toggleEventStatus('${ev.id}')"
                                                    class="mt-0.5 sm:mt-0 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition"
                                                    style="border-color: ${color}; background-color: ${isDone ? color : 'transparent'};" title="Отметить выполнение">
                                                ${isDone ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}
                                            </button>

                                            <div class="font-mono text-xs sm:text-sm font-bold tabular-nums shrink-0 px-2 py-1 rounded-lg"
                                                 style="background: color-mix(in srgb, ${color} 16%, var(--bg-elevated)); color: ${isConflict ? 'var(--danger)' : 'var(--text-main)'};">
                                                ${ev.start} – ${ev.end}
                                            </div>

                                            <div class="min-w-0 flex-1">
                                                <div class="text-sm font-semibold ${isDone ? 'line-through opacity-60' : ''}">
                                                    ${Utils.escapeHTML(ev.title)}
                                                    ${isConflict ? '<span class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-semibold" style="background: var(--danger-soft); color: var(--danger);">Пересечение</span>' : ''}
                                                </div>
                                                <div class="text-xs flex flex-wrap items-center gap-2 mt-0.5" style="color: var(--text-sub);">
                                                    <span class="inline-flex items-center gap-1">
                                                        <span class="w-2 h-2 rounded-full" style="background:${color};"></span>
                                                        ${Utils.escapeHTML(cat.name)}
                                                    </span>
                                                    ${ev.hasIncome ? `<span style="color: var(--success);">• +${Utils.formatMoney(Utils.eventIncome(ev))}</span>` : ''}
                                                    ${ev.desc ? `<span class="truncate max-w-xs" style="color: var(--text-muted);">• ${Utils.escapeHTML(ev.desc)}</span>` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-1 shrink-0">
                                            <button type="button" onclick="UI.openEventModal('${ev.id}')" class="p-2 rounded-lg hover:bg-white/10 transition" style="color: var(--text-sub);" title="Редактировать">
                                                <i data-lucide="pencil" class="w-4 h-4"></i>
                                            </button>
                                            <button type="button" onclick="ScheduleView.deleteEventById('${ev.id}')" class="p-2 rounded-lg hover:bg-red-500/15 transition" style="color: var(--danger);" title="Удалить">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        `}
                    </div>
                `;
            },

            copyDayAsText(dateIso) {
                const evs = Store.getExpandedEventsForDate(dateIso)
                    .slice()
                    .sort((a, b) => Utils.timeToMins(a.start) - Utils.timeToMins(b.start));
                if (!evs.length) {
                    UI.toast('На этот день нет событий');
                    return;
                }
                const header = `Расписание на ${Utils.formatDateRU(dateIso)} (${Utils.getDayNameRU(dateIso)}):`;
                const lines = evs.map(ev => `${ev.start}-${ev.end} ${ev.title}`);
                const text = [header, ...lines].join('\n');
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(() => UI.toast('Расписание скопировано в буфер'));
                } else {
                    UI.toast('Не удалось скопировать автоматически');
                }
            },

            openBatchModal() {
                const dateInput = document.getElementById('batchDateInput');
                const catSelect = document.getElementById('batchCategorySelect');
                if (dateInput) dateInput.value = this.anchorDate || Utils.todayISO();
                if (catSelect) {
                    catSelect.innerHTML = Store.state.categories
                        .filter(c => c.type === 'schedule')
                        .map(c => `<option value="${c.id}">${Utils.escapeHTML(c.name)}</option>`).join('');
                }
                UI.openModal('textScheduleModal');
            },

            importBatchText() {
                const dateVal = document.getElementById('batchDateInput').value;
                const rawText = document.getElementById('batchTextarea').value;
                const catId = document.getElementById('batchCategorySelect')?.value
                    || Store.state.categories.find(c => c.type === 'schedule')?.id
                    || 'cat_edu';

                if (!dateVal) {
                    UI.toast('Выберите дату для расписания');
                    return;
                }
                if (!rawText.trim()) {
                    UI.toast('Введите строки расписания');
                    return;
                }

                // Поддерживает форматы:
                // 09:00-10:30 Название
                // 9:00 - 10:30 Название
                // 09:00–10:30 — Название
                const lineRegex = /^(\d{1,2}[:.]\d{2})\s*[-–—~]+\s*(\d{1,2}[:.]\d{2})\s*[-–—:]?\s*(.+)$/;
                const lines = rawText.split(/\r?\n/);
                let addedCount = 0;

                lines.forEach((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    const match = trimmed.match(lineRegex);
                    if (match) {
                        const [, rawStart, rawEnd, rawTitle] = match;
                        const normalizeTime = t => {
                            const [h, m] = t.replace('.', ':').split(':');
                            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        };
                        const start = normalizeTime(rawStart);
                        const end = normalizeTime(rawEnd);
                        if (Utils.timeToMins(end) <= Utils.timeToMins(start)) return;

                        Store.state.events.push({
                            id: `ev_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
                            title: rawTitle.trim().slice(0, 120),
                            date: dateVal,
                            start,
                            end,
                            categoryId: catId,
                            slotType: 'busy',
                            priority: 'medium',
                            status: 'planned',
                            repeat: 'none',
                            useCustomColor: false,
                            customColor: '#6366f1',
                            reminder: false,
                            hasIncome: false,
                            incomeType: 'fixed',
                            incomeValue: 0,
                            desc: ''
                        });
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    this.anchorDate = dateVal;
                    Store.commit();
                    UI.closeModal('textScheduleModal');
                    document.getElementById('batchTextarea').value = '';
                    UI.toast(`Добавлено событий: ${addedCount}`);
                } else {
                    UI.toast('Не распознано ни одной строки. Пример: 09:00-10:30 Пара');
                }
            },

            jumpToConflict() {
                if (this._conflictDate) {
                    this.anchorDate = this._conflictDate;
                    this.mode = 'text';
                    this.render();
                }
            },

            renderMonthGrid(surface, dates) {
                surface.innerHTML = `
                    <div class="grid grid-cols-7 border-b text-xs font-semibold text-center py-2" style="background: var(--bg-elevated); border-color: var(--border); color: var(--text-sub);">
                        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
                    </div>
                    <div class="grid grid-cols-7">
                        ${dates.map(d => {
                            const evs = Store.getExpandedEventsForDate(d);
                            const isToday = d === Utils.todayISO();
                            return `
                            <div onclick="UI.openEventModal(null, '${d}')" class="min-h-[105px] p-1.5 border-r border-b cursor-pointer hover:bg-white/[0.03] transition space-y-1"
                                 style="border-color: var(--border); background: ${isToday ? 'var(--accent-soft)' : 'transparent'};">
                                <div class="text-xs font-bold tabular-nums flex justify-between">
                                    <span style="color: ${isToday ? 'var(--accent)' : 'var(--text-sub)'};">${d.slice(8)}</span>
                                    ${evs.length ? `<span class="text-[10px]" style="color:var(--text-muted)">${evs.length}</span>` : ''}
                                </div>
                                ${evs.slice(0, 3).map(ev => {
                                    const cat = Store.getCategory(ev.categoryId);
                                    return `<div onclick="event.stopPropagation(); UI.openEventModal('${ev.id}')" class="text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                                        style="background: color-mix(in srgb, ${cat.color} 25%, var(--bg-card)); border-left: 2px solid ${cat.color};">
                                        ${ev.start} ${Utils.escapeHTML(ev.title)}
                                    </div>`;
                                }).join('')}
                            </div>`;
                        }).join('')}
                    </div>
                `;
            },

            renderTimeColumnsGrid(surface, dates) {
                const hourH = 48;
                const colCount = dates.length;
                surface.innerHTML = `
                    <div style="min-width: ${colCount === 7 ? '760px' : '100%'};">
                        <!-- Sticky Header -->
                        <div class="sticky top-0 z-10 flex border-b text-xs font-semibold" style="background: var(--bg-elevated); border-color: var(--border);">
                            <div class="w-14 shrink-0 py-2.5 text-center border-r" style="border-color: var(--border); color: var(--text-muted);">Время</div>
                            <div class="flex-1 grid" style="grid-template-columns: repeat(${colCount}, minmax(0, 1fr));">
                                ${dates.map(d => {
                                    const isToday = d === Utils.todayISO();
                                    return `<div class="py-2.5 px-2 text-center border-r last:border-r-0" style="border-color: var(--border); color: ${isToday ? 'var(--accent)' : 'var(--text-main)'};">
                                        ${Utils.getDayNameRU(d)}, ${d.slice(8)}.${d.slice(5, 7)}
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Body -->
                        <div class="flex relative" style="height: ${24 * hourH}px;">
                            <div class="w-14 shrink-0 border-r select-none" style="border-color: var(--border); background: var(--bg-card);">
                                ${Array.from({ length: 24 }).map((_, h) => `
                                    <div class="border-b text-[10px] text-center pt-1 tabular-nums" style="height:${hourH}px; border-color: var(--grid-line); color: var(--text-muted);">
                                        ${String(h).padStart(2, '0')}:00
                                    </div>
                                `).join('')}
                            </div>

                            <div class="flex-1 grid" style="grid-template-columns: repeat(${colCount}, minmax(0, 1fr));">
                                ${dates.map(d => {
                                    const evs = Store.getExpandedEventsForDate(d);
                                    const conflicts = Store.detectConflictsForDate(d);
                                    return `
                                    <div class="relative border-r last:border-r-0" style="border-color: var(--border);">
                                        ${Array.from({ length: 24 }).map((_, h) => `
                                            <div onclick="UI.openEventModal(null, '${d}', '${String(h).padStart(2, '0')}:00')"
                                                 ondragover="event.preventDefault(); this.classList.add('drag-over-cell')"
                                                 ondragleave="this.classList.remove('drag-over-cell')"
                                                 ondrop="this.classList.remove('drag-over-cell'); ScheduleView.handleDrop(event, '${d}', ${h})"
                                                 class="border-b hover:bg-white/[0.03] cursor-pointer transition-colors"
                                                 style="height:${hourH}px; border-color: var(--grid-line);"></div>
                                        `).join('')}

                                        ${evs.map(ev => {
                                            const startM = Utils.timeToMins(ev.start);
                                            const durM = Utils.eventDurationMins(ev);
                                            const top = (startM / 60) * hourH;
                                            const height = Math.max(20, (durM / 60) * hourH);
                                            const cat = Store.getCategory(ev.categoryId);
                                            const color = ev.useCustomColor ? ev.customColor : cat.color;
                                            const isConflict = conflicts.has(ev.id);

                                            return `
                                            <div draggable="true"
                                                 ondragstart="ScheduleView.draggedEventId='${ev.id}'"
                                                 onclick="event.stopPropagation(); UI.openEventModal('${ev.id}')"
                                                 class="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden shadow-xs flex flex-col justify-between transition hover:z-10"
                                                 style="top:${top + 1}px; height:${height - 2}px; background: color-mix(in srgb, ${color} 22%, var(--bg-card)); border-left: 3px solid ${isConflict ? 'var(--danger)' : color}; outline: ${isConflict ? '1px solid var(--danger)' : 'none'};">
                                                <div class="flex items-center justify-between gap-1 text-[11px] font-semibold leading-tight">
                                                    <span class="truncate ${ev.status === 'completed' ? 'line-through opacity-70' : ''}">${Utils.escapeHTML(ev.title)}</span>
                                                    ${ev.hasIncome ? `<span class="text-[9px] px-1 rounded shrink-0" style="background:var(--success-soft); color:var(--success);">₸</span>` : ''}
                                                </div>
                                                ${height >= 34 ? `<div class="text-[10px] tabular-nums opacity-80 truncate" style="color:var(--text-sub)">${ev.start}–${ev.end} • ${Utils.escapeHTML(cat.name)}</div>` : ''}
                                            </div>`;
                                        }).join('')}
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            },

            handleDrop(e, targetDate, targetHour) {
                e.preventDefault();
                if (!this.draggedEventId) return;
                const ev = Store.state.events.find(item => item.id === this.draggedEventId);
                if (!ev) return;
                const dur = Utils.eventDurationMins(ev);
                const newStartM = targetHour * 60;
                const newEndM = Math.min(1439, newStartM + dur);
                ev.date = targetDate;
                ev.start = `${String(Math.floor(newStartM / 60)).padStart(2, '0')}:${String(newStartM % 60).padStart(2, '0')}`;
                ev.end = `${String(Math.floor(newEndM / 60)).padStart(2, '0')}:${String(newEndM % 60).padStart(2, '0')}`;
                this.draggedEventId = null;
                Store.commit();
                UI.toast('Событие перенесено');
            },

            renderCategoryBreakdown(dates) {
                const minsByCat = {};
                let totalRangeMins = dates.length * 1440;
                let unallocTotal = 0;

                dates.forEach(d => {
                    const m = Store.computeDayTimeMetrics(d);
                    unallocTotal += m.unallocatedMins;
                    Store.getExpandedEventsForDate(d).forEach(ev => {
                        minsByCat[ev.categoryId] = (minsByCat[ev.categoryId] || 0) + Utils.eventDurationMins(ev);
                    });
                });

                const rows = Store.state.categories
                    .filter(c => c.type === 'schedule')
                    .map(c => ({ name: c.name, color: c.color, mins: minsByCat[c.id] || 0 }));
                rows.push({ name: 'Нераспределённое время', color: '#6b7280', mins: unallocTotal });

                document.getElementById('scheduleCategoryBreakdown').innerHTML = rows.map(r => {
                    const pct = totalRangeMins > 0 ? ((r.mins / totalRangeMins) * 100).toFixed(1) : 0;
                    return `
                    <div class="space-y-1 text-xs">
                        <div class="flex justify-between">
                            <span class="flex items-center gap-2 font-medium"><span class="w-2.5 h-2.5 rounded-full" style="background:${r.color}"></span>${r.name}</span>
                            <span class="tabular-nums font-semibold">${Utils.minsToText(r.mins)} (${pct}%)</span>
                        </div>
                        <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--bg-elevated);">
                            <div class="h-full rounded-full" style="width:${pct}%; background:${r.color};"></div>
                        </div>
                    </div>`;
                }).join('');
            },

            toggleEventStatus(id) {
                const ev = Store.state.events.find(e => e.id === id);
                if (!ev) return;
                ev.status = ev.status === 'completed' ? 'planned' : 'completed';
                Store.commit();
                UI.toast(ev.status === 'completed' ? 'Задача выполнена!' : 'Статус: Запланировано');
            },

            saveEvent(e) {
                e.preventDefault();
                const id = document.getElementById('evId').value;
                const start = document.getElementById('evStart').value;
                let end = document.getElementById('evEnd').value;
                if (Utils.timeToMins(end) <= Utils.timeToMins(start)) {
                    UI.toast('Время окончания должно быть позже времени начала');
                    return;
                }
                const title = document.getElementById('evTitle').value.trim();
                const date = document.getElementById('evDate').value;
                if (!title || !date) { UI.toast('Заполните название и дату события'); return; }

                const payload = {
                    id: id || 'ev_' + Date.now(),
                    title: title.slice(0, 120),
                    date,
                    start,
                    end,
                    categoryId: document.getElementById('evCategory').value,
                    slotType: document.getElementById('evSlotType').value,
                    priority: document.getElementById('evPriority').value,
                    status: document.getElementById('evStatus').value,
                    repeat: document.getElementById('evRepeat').value,
                    useCustomColor: document.getElementById('evUseCustomColor').checked,
                    customColor: document.getElementById('evCustomColor').value,
                    reminder: document.getElementById('evReminder').checked,
                    hasIncome: document.getElementById('evHasIncome').checked,
                    incomeType: document.getElementById('evIncomeType').value,
                    incomeValue: Number(document.getElementById('evIncomeValue').value) || 0,
                    desc: document.getElementById('evDesc').value.trim().slice(0, 1000)
                };

                if (id) {
                    const idx = Store.state.events.findIndex(item => item.id === id);
                    if (idx !== -1) Store.state.events[idx] = payload;
                } else {
                    Store.state.events.push(payload);
                }

                UI.closeModal('eventModal');
                Store.commit();
                UI.toast('Событие сохранено');
            },

            deleteEventById(id) {
                if (!id) return;
                const before = Store.state.events.length;
                Store.state.events = Store.state.events.filter(e => String(e.id) !== String(id));
                if (Store.state.events.length < before) {
                    Store.commit();
                    UI.toast('Событие удалено');
                }
            },

            deleteCurrentEvent() {
                const id = document.getElementById('evId')?.value;
                if (!id) {
                    UI.toast('Не удалось определить событие для удаления');
                    return;
                }
                Store.state.events = Store.state.events.filter(e => String(e.id) !== String(id));
                UI.closeModal('eventModal');
                Store.commit();
                UI.toast('Событие удалено');
            }
        };
