/* LIFE.OS module: DataExport */
        window.DataExport = {
            exportJSON() {
                const blob = new Blob([JSON.stringify(Store.state, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                const url = URL.createObjectURL(blob);
                a.href = url;
                a.download = `LIFE_OS_Backup_${Utils.todayISO()}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                UI.toast('Резервная копия JSON скачана');
            },
            importJSON(e) {
                const file = e.target.files[0];
                if (!file) return;
                if (!/\.json$/i.test(file.name) && file.type !== 'application/json') { UI.toast('Выберите JSON-файл резервной копии'); e.target.value = ''; return; }
                if (file.size > 5 * 1024 * 1024) { UI.toast('Файл больше 5 МБ'); e.target.value = ''; return; }
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        Store.state = StorageAdapter.normalizeData(data);
                        Store.commit();
                        UI.toast('Данные успешно восстановлены');
                    } catch (error) {
                        console.error('Import error:', error);
                        UI.toast('Ошибка: резервная копия повреждена или имеет неверную структуру');
                    } finally {
                        e.target.value = '';
                    }
                };
                reader.readAsText(file);
            },
            exportXLSX() {
                if (typeof XLSX === 'undefined') {
                    UI.toast('Библиотека XLSX загружается...');
                    return;
                }
                const wb = XLSX.utils.book_new();
                const scheduleRows = Store.state.events.map(ev => ({
                    Дата: ev.date,
                    Начало: ev.start,
                    Конец: ev.end,
                    Название: ev.title,
                    Категория: Store.getCategory(ev.categoryId).name,
                    Тип_Слота: ev.slotType === 'free' ? 'Свободное окно' : 'Занято',
                    Статус: ev.status,
                    Доход: Utils.eventIncome(ev),
                    Описание: ev.desc || ''
                }));
                const financeRows = Store.state.transactions.map(tx => ({
                    Дата: tx.date,
                    Тип: tx.type === 'income' ? 'Доход' : 'Расход',
                    Категория: Store.getCategory(tx.categoryId).name,
                    Сумма: tx.amount,
                    Описание: tx.desc
                }));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scheduleRows), 'Расписание');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(financeRows), 'Финансы');
                XLSX.writeFile(wb, `LIFE_OS_Report_${Utils.todayISO()}.xlsx`);
                UI.toast('Файл Excel (.xlsx) экспортирован');
            },
            exportCSV() {
                const csvCell = value => {
                    let text = String(value ?? '');
                    if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
                    return `"${text.replace(/"/g, '""')}"`;
                };
                const header = ['Date','Start','End','Title','Category','Status','Income'].map(csvCell).join(',');
                const rows = Store.state.events.map(ev => [ev.date, ev.start, ev.end, ev.title, Store.getCategory(ev.categoryId).name, ev.status, Utils.eventIncome(ev)].map(csvCell).join(','));
                const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
                const a = document.createElement('a');
                const url = URL.createObjectURL(blob);
                a.href = url;
                a.download = `LIFE_OS_Schedule_${Utils.todayISO()}.csv`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                UI.toast('CSV файл скачан');
            }
        };

