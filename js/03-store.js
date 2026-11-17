/* LIFE.OS module 3: Store */
window.Store = {
            state: StorageAdapter.load(),
            commit() {
                StorageAdapter.save(this.state);
                App.refreshAll();
            },
            getCategory(id) {
                return this.state.categories.find(c => c.id === id) || { id: 'default', name: 'Other', color: '#6366f1' };
            },
            getExpandedEventsForDate(isoDate) {
                const [y, m, d] = isoDate.split('-').map(Number);
                const targetDt = new Date(y, m - 1, d);
                const dow = targetDt.getDay(); // 0=Sun, 6=Sat

                return this.state.events.filter(ev => {
                    if (ev.date === isoDate) return true;
                    if (ev.date > isoDate) return false;
                    if (ev.repeat === 'daily') return true;
                    if (ev.repeat === 'weekdays') return dow >= 1 && dow <= 5;
                    if (ev.repeat === 'weekly') {
                        const [ey, em, ed] = ev.date.split('-').map(Number);
                        return new Date(ey, em - 1, ed).getDay() === dow;
                    }
                    return false;
                });
            },
            detectConflictsForDate(isoDate) {
                const list = this.getExpandedEventsForDate(isoDate)
                    .slice()
                    .sort((a, b) => Utils.timeToMins(a.start) - Utils.timeToMins(b.start));
                const conflictIds = new Set();
                for (let i = 0; i < list.length; i++) {
                    for (let j = i + 1; j < list.length; j++) {
                        if (Utils.timeToMins(list[j].start) < Utils.timeToMins(list[i].end)) {
                            conflictIds.add(list[i].id);
                            conflictIds.add(list[j].id);
                        }
                    }
                }
                return conflictIds;
            },
            computeDayTimeMetrics(isoDate) {
                const evs = this.getExpandedEventsForDate(isoDate);
                const unionMinutes = (items) => {
                    const intervals = items.map(ev => ({ start: Utils.timeToMins(ev.start), end: Utils.timeToMins(ev.end) }))
                        .filter(x => x.end > x.start).sort((x, y) => x.start - y.start);
                    let total = 0, start = null, end = null;
                    for (const item of intervals) {
                        if (start === null) { start = item.start; end = item.end; }
                        else if (item.start <= end) end = Math.max(end, item.end);
                        else { total += end - start; start = item.start; end = item.end; }
                    }
                    return total + (start === null ? 0 : end - start);
                };
                const busyEvents = evs.filter(ev => ev.slotType !== 'free');
                const freeEvents = evs.filter(ev => ev.slotType === 'free');
                const busyMins = unionMinutes(busyEvents);
                const confirmedFreeMins = unionMinutes(freeEvents);
                const plannedMins = busyMins;
                const completedMins = unionMinutes(busyEvents.filter(ev => ev.status === 'completed'));
                const dayIncome = evs.reduce((sum, ev) => sum + Utils.eventIncome(ev), 0);
                const unallocatedMins = Math.max(0, 1440 - Math.min(1440, busyMins + confirmedFreeMins));
                return { busyMins, confirmedFreeMins, unallocatedMins, plannedMins, completedMins, dayIncome, totalEvents: evs.length };
            },
            computeNetWorth() {
                let assets = 0;
                let debts = 0;
                this.state.accounts.forEach(acc => {
                    const bal = Number(acc.balance) || 0;
                    if (acc.type === 'debt') debts += bal;
                    else assets += bal;
                });
                return { assets, debts, netWorth: assets - debts };
            }
        };

