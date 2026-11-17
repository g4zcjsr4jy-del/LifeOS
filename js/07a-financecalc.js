/* LIFE.OS submodule: FinanceCalc */
window.FinanceCalc = {
            render() {
                const mode = document.getElementById('finCalcMode').value;
                const body = document.getElementById('finCalcBody');

                if (mode === 'goal') {
                    body.innerHTML = `
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Нужная сумма</label><input id="fcGoalSum" type="number" value="500000" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Срок (месяцев)</label><input id="fcGoalMonths" type="number" value="6" min="1" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                        </div>
                        <div id="fcOutput" class="elevated p-3.5 rounded-xl text-xs space-y-1 tabular-nums"></div>
                    `;
                } else if (mode === 'hourly') {
                    body.innerHTML = `
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Ставка за час</label><input id="fcRate" type="number" value="4500" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Часов в неделю</label><input id="fcHours" type="number" value="20" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                        </div>
                        <div id="fcOutput" class="elevated p-3.5 rounded-xl text-xs space-y-1 tabular-nums"></div>
                    `;
                } else if (mode === 'afford') {
                    body.innerHTML = `
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Цена покупки</label><input id="fcPrice" type="number" value="180000" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Ваша ставка/час</label><input id="fcUserRate" type="number" value="4500" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                        </div>
                        <div id="fcOutput" class="elevated p-3.5 rounded-xl text-xs space-y-1 tabular-nums"></div>
                    `;
                } else {
                    body.innerHTML = `
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Базовая сумма</label><input id="fcBase" type="number" value="100000" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                            <div><label class="text-[11px]" style="color:var(--text-sub)">Процент (%)</label><input id="fcPct" type="number" value="15" oninput="FinanceCalc.compute()" class="input-field w-full px-3 py-1.5 rounded-xl text-xs tabular-nums"></div>
                        </div>
                        <div id="fcOutput" class="elevated p-3.5 rounded-xl text-xs space-y-1 tabular-nums"></div>
                    `;
                }
                this.compute();
            },

            compute() {
                const mode = document.getElementById('finCalcMode').value;
                const out = document.getElementById('fcOutput');
                if (mode === 'goal') {
                    const sum = Number(document.getElementById('fcGoalSum').value) || 0;
                    const m = Math.max(1, Number(document.getElementById('fcGoalMonths').value) || 1);
                    out.innerHTML = `
                        <div class="flex justify-between"><span>Откладывать в месяц:</span><strong style="color:var(--accent)">${Utils.formatMoney(sum / m)}</strong></div>
                        <div class="flex justify-between"><span>Откладывать в неделю:</span><strong>${Utils.formatMoney(sum / (m * 4.33))}</strong></div>
                        <div class="flex justify-between"><span>Откладывать в день:</span><strong>${Utils.formatMoney(sum / (m * 30))}</strong></div>
                    `;
                } else if (mode === 'hourly') {
                    const r = Number(document.getElementById('fcRate').value) || 0;
                    const h = Number(document.getElementById('fcHours').value) || 0;
                    out.innerHTML = `
                        <div class="flex justify-between"><span>Заработок в неделю:</span><strong>${Utils.formatMoney(r * h)}</strong></div>
                        <div class="flex justify-between"><span>Заработок в месяц:</span><strong style="color:var(--success)">${Utils.formatMoney(r * h * 4.33)}</strong></div>
                        <div class="flex justify-between"><span>Заработок в год:</span><strong>${Utils.formatMoney(r * h * 52)}</strong></div>
                    `;
                } else if (mode === 'afford') {
                    const p = Number(document.getElementById('fcPrice').value) || 0;
                    const r = Math.max(1, Number(document.getElementById('fcUserRate').value) || 1);
                    const { netWorth } = Store.computeNetWorth();
                    const pctCap = netWorth > 0 ? ((p / netWorth) * 100).toFixed(1) : 100;
                    out.innerHTML = `
                        <div class="flex justify-between"><span>Эквивалент в часах работы:</span><strong style="color:var(--warning)">${(p / r).toFixed(1)} ч</strong></div>
                        <div class="flex justify-between"><span>Доля от вашего капитала:</span><strong>${pctCap}%</strong></div>
                    `;
                } else {
                    const b = Number(document.getElementById('fcBase').value) || 0;
                    const pct = Number(document.getElementById('fcPct').value) || 0;
                    const delta = b * (pct / 100);
                    out.innerHTML = `
                        <div class="flex justify-between"><span>${pct}% от суммы:</span><strong>${Utils.formatMoney(delta)}</strong></div>
                        <div class="flex justify-between"><span>Сумма + ${pct}%:</span><strong style="color:var(--success)">${Utils.formatMoney(b + delta)}</strong></div>
                        <div class="flex justify-between"><span>Сумма - ${pct}%:</span><strong style="color:var(--danger)">${Utils.formatMoney(b - delta)}</strong></div>
                    `;
                }
            }
        }

