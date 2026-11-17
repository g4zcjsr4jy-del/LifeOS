/* LIFE.OS module 8: AnalyticsView */
window.AnalyticsView = {
            range: 'week',
            charts: {},

            setRange(r) {
                this.range = r;
                this.render();
            },

            render() {
                document.querySelectorAll('.an-range-btn').forEach(b => {
                    const active = b.dataset.anRange === this.range;
                    b.style.backgroundColor = active ? 'var(--accent)' : 'transparent';
                    b.style.color = active ? '#fff' : 'var(--text-sub)';
                });

                const today = Utils.todayISO();
                const daysCount = this.range === 'week' ? 7 : this.range === 'month' ? 30 : 60;
                const dates = Array.from({ length: daysCount }, (_, i) => Utils.addDaysISO(today, i - (daysCount - 1)));

                let totalPlanned = 0, totalCompleted = 0, totalInc = 0, totalExp = 0;
                const catMins = {};
                const expByCat = {};

                dates.forEach(d => {
                    const m = Store.computeDayTimeMetrics(d);
                    totalPlanned += m.plannedMins;
                    totalCompleted += m.completedMins;
                    Store.getExpandedEventsForDate(d).forEach(ev => {
                        catMins[ev.categoryId] = (catMins[ev.categoryId] || 0) + Utils.eventDurationMins(ev);
                    });
                });

                const minDate = dates[0];
                Store.state.transactions.forEach(tx => {
                    if (this.range === 'all' || tx.date >= minDate) {
                        if (tx.type === 'income') totalInc += Number(tx.amount);
                        else {
                            totalExp += Number(tx.amount);
                            expByCat[tx.categoryId] = (expByCat[tx.categoryId] || 0) + Number(tx.amount);
                        }
                    }
                });

                document.getElementById('analyticsKpiStrip').innerHTML = `
                    <div class="card rounded-2xl p-4"><div class="text-xs" style="color:var(--text-sub)">Продуктивных часов (Факт)</div><div class="text-xl font-extrabold mt-1 tabular-nums">${(totalCompleted / 60).toFixed(1)} ч</div></div>
                    <div class="card rounded-2xl p-4"><div class="text-xs" style="color:var(--text-sub)">Среднее в день</div><div class="text-xl font-extrabold mt-1 tabular-nums">${((totalPlanned / daysCount) / 60).toFixed(1)} ч/день</div></div>
                    <div class="card rounded-2xl p-4"><div class="text-xs" style="color:var(--text-sub)">Доходы за период</div><div class="text-xl font-extrabold mt-1 tabular-nums" style="color:var(--success)">${Utils.formatMoney(totalInc)}</div></div>
                    <div class="card rounded-2xl p-4"><div class="text-xs" style="color:var(--text-sub)">Расходы за период</div><div class="text-xl font-extrabold mt-1 tabular-nums" style="color:var(--danger)">${Utils.formatMoney(totalExp)}</div></div>
                `;

                this.drawCharts(dates.slice(-7), catMins, expByCat, totalInc, totalExp);
            },

            drawCharts(last7Dates, catMins, expByCat, totalInc, totalExp) {
                Object.values(this.charts).forEach(ch => ch && ch.destroy());
                if (typeof window.Chart === 'undefined') { UI.toast('Графики недоступны: не удалось загрузить Chart.js'); return; }
                const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-sub').trim() || '#9ca3af';

                // 1. Time Categories Doughnut
                const schedCats = Store.state.categories.filter(c => c.type === 'schedule');
                this.charts.timeCat = new Chart(document.getElementById('chartTimeCategories'), {
                    type: 'doughnut',
                    data: {
                        labels: schedCats.map(c => c.name),
                        datasets: [{
                            data: schedCats.map(c => Number(((catMins[c.id] || 0) / 60).toFixed(1))),
                            backgroundColor: schedCats.map(c => c.color),
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor, font: { size: 11 } } } } }
                });

                // 2. Planned vs Actual Bar
                this.charts.planAct = new Chart(document.getElementById('chartPlannedVsActual'), {
                    type: 'bar',
                    data: {
                        labels: last7Dates.map(d => `${Utils.getDayNameRU(d)} ${d.slice(8)}`),
                        datasets: [
                            {
                                label: 'План (ч)',
                                data: last7Dates.map(d => Number((Store.computeDayTimeMetrics(d).plannedMins / 60).toFixed(1))),
                                backgroundColor: '#6366f1',
                                borderRadius: 6
                            },
                            {
                                label: 'Выполнено (ч)',
                                data: last7Dates.map(d => Number((Store.computeDayTimeMetrics(d).completedMins / 60).toFixed(1))),
                                backgroundColor: '#10b981',
                                borderRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: textColor } },
                            y: { ticks: { color: textColor } }
                        },
                        plugins: { legend: { labels: { color: textColor } } }
                    }
                });

                // 3. Income vs Expense Bar
                this.charts.incExp = new Chart(document.getElementById('chartIncomeExpense'), {
                    type: 'bar',
                    data: {
                        labels: ['Доходы', 'Расходы', 'Чистый поток'],
                        datasets: [{
                            label: Store.state.settings.currency,
                            data: [totalInc, totalExp, Math.max(0, totalInc - totalExp)],
                            backgroundColor: ['#10b981', '#ef4444', '#6366f1'],
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } },
                        plugins: { legend: { display: false } }
                    }
                });

                // 4. Expense Breakdown Pie
                const expCats = Store.state.categories.filter(c => c.type === 'expense');
                this.charts.expPie = new Chart(document.getElementById('chartExpenseBreakdown'), {
                    type: 'pie',
                    data: {
                        labels: expCats.map(c => c.name),
                        datasets: [{
                            data: expCats.map(c => expByCat[c.id] || 0),
                            backgroundColor: expCats.map(c => c.color),
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor, font: { size: 11 } } } } }
                });
            }
        };

