/* LIFE.OS module 6: ExcelView */
window.ExcelView = {
            anchorDate: Utils.todayISO(),
            span: 7,
            zoom: 3,
            filterCat: 'all',

            ZOOM_CFG: {
                1: { label: '60%', rowH: 26, colW: 105 },
                2: { label: '80%', rowH: 36, colW: 130 },
                3: { label: '100%', rowH: 48, colW: 155 },
                4: { label: '130%', rowH: 64, colW: 185 },
                5: { label: '165%', rowH: 84, colW: 220 }
            },

            setSpan(s) { this.span = s; this.render(); },
            setZoom(z) { this.zoom = Number(z); this.render(); },
            shiftDate(dir) { this.anchorDate = Utils.addDaysISO(this.anchorDate, dir * this.span); this.render(); },
            setFilterCat(catId) { this.filterCat = catId; this.render(); },

            getDates() {
                if (this.span === 7) {
                    const [y, m, d] = this.anchorDate.split('-').map(Number);
                    const dow = new Date(y, m - 1, d).getDay();
                    const mon = Utils.addDaysISO(this.anchorDate, dow === 0 ? -6 : 1 - dow);
                    return [0, 1, 2, 3, 4, 5, 6].map(i => Utils.addDaysISO(mon, i));
                }
                return Array.from({ length: this.span }, (_, i) => Utils.addDaysISO(this.anchorDate, i));
            },

            render() {
                document.querySelectorAll('.excel-span-btn').forEach(b => {
                    const active = Number(b.dataset.excelSpan) === this.span;
                    b.style.backgroundColor = active ? 'var(--accent)' : 'transparent';
                    b.style.color = active ? '#fff' : 'var(--text-sub)';
                });

                const zCfg = this.ZOOM_CFG[this.zoom];
                document.getElementById('excelZoomText').textContent = zCfg.label;

                const dates = this.getDates();
                document.getElementById('excelDateRangeLabel').textContent =
                    dates.length === 1 ? Utils.formatDateRU(dates[0]) : `${Utils.formatDateRU(dates[0])} — ${Utils.formatDateRU(dates[dates.length - 1])}`;

                // Category Filter Bar
                const schedCats = Store.state.categories.filter(c => c.type === 'schedule');
                document.getElementById('excelCategoryFilterBar').innerHTML = `
                    <button onclick="ExcelView.setFilterCat('all')" class="px-2.5 py-1 rounded-lg font-semibold shrink-0"
                        style="background:${this.filterCat === 'all' ? 'var(--accent)' : 'var(--bg-elevated)'}; color:${this.filterCat === 'all' ? '#fff' : 'var(--text-sub)'};">Все категории</button>
                    ${schedCats.map(c => `
                        <button onclick="ExcelView.setFilterCat('${c.id}')" class="px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 shrink-0 border"
                            style="border-color:${this.filterCat === c.id ? c.color : 'var(--border)'}; background:${this.filterCat === c.id ? 'var(--accent-soft)' : 'var(--bg-elevated)'};">
                            <span class="w-2 h-2 rounded-full" style="background:${c.color}"></span>${Utils.escapeHTML(c.name)}
                        </button>
                    `).join('')}
                `;

                const timeColW = 60;
                const totalW = timeColW + dates.length * zCfg.colW;
                const canvas = document.getElementById('excelMatrixCanvas');
                canvas.style.width = `max(100%, ${totalW}px)`;

                canvas.innerHTML = `
                    <div class="sticky top-0 z-20 flex border-b text-xs font-bold" style="background: var(--bg-elevated); border-color: var(--border);">
                        <div class="sticky left-0 z-30 shrink-0 py-2.5 text-center border-r" style="width:${timeColW}px; background: var(--bg-elevated); border-color: var(--border); color: var(--text-muted);">Час</div>
                        <div class="flex-1 grid" style="grid-template-columns: repeat(${dates.length}, minmax(${zCfg.colW}px, 1fr));">
                            ${dates.map(d => `
                                <div class="py-2.5 px-2 text-center border-r last:border-r-0" style="border-color: var(--border);">
                                    ${Utils.getDayNameRU(d)} • ${Utils.formatDateRU(d)}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex relative" style="height: ${24 * zCfg.rowH}px;">
                        <div class="sticky left-0 z-10 shrink-0 border-r" style="width:${timeColW}px; background: var(--bg-card); border-color: var(--border);">
                            ${Array.from({ length: 24 }).map((_, h) => `
                                <div class="border-b text-[11px] text-center pt-1 tabular-nums" style="height:${zCfg.rowH}px; border-color: var(--grid-line); color: var(--text-muted);">
                                    ${String(h).padStart(2, '0')}:00
                                </div>
                            `).join('')}
                        </div>

                        <div class="flex-1 grid" style="grid-template-columns: repeat(${dates.length}, minmax(${zCfg.colW}px, 1fr));">
                            ${dates.map(d => {
                                let evs = Store.getExpandedEventsForDate(d);
                                if (this.filterCat !== 'all') evs = evs.filter(e => e.categoryId === this.filterCat);
                                return `
                                <div class="relative border-r last:border-r-0" style="border-color: var(--border);">
                                    ${Array.from({ length: 24 }).map((_, h) => `
                                        <div onclick="UI.openEventModal(null, '${d}', '${String(h).padStart(2, '0')}:00')"
                                             class="border-b hover:bg-white/[0.04] cursor-pointer"
                                             style="height:${zCfg.rowH}px; border-color: var(--grid-line);"></div>
                                    `).join('')}

                                    ${evs.map(ev => {
                                        const top = (Utils.timeToMins(ev.start) / 60) * zCfg.rowH;
                                        const height = Math.max(18, (Utils.eventDurationMins(ev) / 60) * zCfg.rowH);
                                        const cat = Store.getCategory(ev.categoryId);
                                        const color = ev.useCustomColor ? ev.customColor : cat.color;
                                        return `
                                        <div onclick="event.stopPropagation(); UI.openEventModal('${ev.id}')"
                                             class="absolute left-1 right-1 rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden text-[11px] flex flex-col justify-between shadow-xs"
                                             style="top:${top + 1}px; height:${height - 2}px; background: color-mix(in srgb, ${color} 26%, var(--bg-card)); border-left: 3px solid ${color};">
                                            <div class="font-semibold truncate">${Utils.escapeHTML(ev.title)}</div>
                                            ${height >= 32 ? `<div class="text-[10px] opacity-80 tabular-nums truncate">${ev.start}-${ev.end} (${Utils.escapeHTML(cat.name)})</div>` : ''}
                                        </div>`;
                                    }).join('')}
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        };

