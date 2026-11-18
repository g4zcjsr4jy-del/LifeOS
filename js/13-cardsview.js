/* LIFE.OS module 13: CardsView (Anki-style Spaced Repetition) */
window.CardsView = {
    activeDeckId: null,
    studyDeckId: null,
    studyQueue: [],
    isFlipped: false,

    render() {
        const root = document.getElementById('cardsRootContainer');
        if (!root) return;
        if (!Store.state.flashcardDecks) Store.state.flashcardDecks = [];

        if (this.studyDeckId) {
            this.renderStudySession(root);
            return;
        }
        if (this.activeDeckId) {
            this.renderDeckDetail(root);
            return;
        }
        this.renderDeckList(root);
    },

    renderDeckList(root) {
        const today = Utils.todayISO();
        const decks = Store.state.flashcardDecks;

        root.innerHTML = `
            <div class="card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 class="font-bold text-base sm:text-lg">Карточки для учёбы (Anki-режим)</h2>
                    <p class="text-xs" style="color: var(--text-muted);">Интервальное повторение терминов, билетов и слов</p>
                </div>
                <button onclick="CardsView.createDeck()" class="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <i data-lucide="plus" class="w-4 h-4"></i> Новая колода
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                ${decks.length === 0 ? `<div class="card rounded-2xl p-8 text-center col-span-full text-sm" style="color: var(--text-muted);">Пока нет ни одной колоды. Нажмите «Новая колода».</div>` : decks.map(deck => {
                    const dueCount = deck.cards.filter(c => !c.dueDate || c.dueDate <= today).length;
                    return `
                    <div class="card rounded-2xl p-5 flex flex-col justify-between space-y-4">
                        <div class="space-y-1.5">
                            <div class="flex items-start justify-between gap-2">
                                <h3 class="font-bold text-base">${Utils.escapeHTML(deck.title)}</h3>
                                <span class="text-xs px-2 py-0.5 rounded-lg font-bold tabular-nums shrink-0"
                                      style="background: ${dueCount > 0 ? 'var(--accent-soft)' : 'var(--bg-elevated)'}; color: ${dueCount > 0 ? 'var(--accent)' : 'var(--text-muted)'};">
                                    К повтору: ${dueCount}
                                </span>
                            </div>
                            <p class="text-xs" style="color: var(--text-sub);">${Utils.escapeHTML(deck.description || 'Всего карточек: ' + deck.cards.length)}</p>
                        </div>

                        <div class="flex items-center gap-2 pt-2 border-t" style="border-color: var(--border);">
                            <button onclick="CardsView.startStudy('${deck.id}')" class="btn-primary flex-1 py-2.5 rounded-xl text-xs font-semibold">
                                Учить (${dueCount > 0 ? dueCount : deck.cards.length})
                            </button>
                            <button onclick="CardsView.openDeck('${deck.id}')" class="elevated px-3 py-2.5 rounded-xl text-xs font-semibold">
                                Карточки (${deck.cards.length})
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
    },

    createDeck() {
        const title = prompt('Название колоды (например: Высшая математика / English B2):');
        if (!title || !title.trim()) return;
        Store.state.flashcardDecks.push({
            id: 'deck_' + Date.now(),
            title: title.trim().slice(0, 100),
            description: '',
            cards: []
        });
        Store.commit();
        UI.toast('Колода создана');
    },

    openDeck(deckId) {
        this.activeDeckId = deckId;
        this.render();
    },

    renderDeckDetail(root) {
        const deck = Store.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (!deck) { this.activeDeckId = null; return this.render(); }

        root.innerHTML = `
            <div class="card rounded-2xl p-4 sm:p-5 space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                        <button onclick="CardsView.activeDeckId=null; CardsView.render();" class="elevated p-2 rounded-xl">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        </button>
                        <div>
                            <h2 class="font-bold text-base sm:text-lg">${Utils.escapeHTML(deck.title)}</h2>
                            <p class="text-xs" style="color: var(--text-muted);">Карточек в колоде: ${deck.cards.length}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="CardsView.deleteDeck('${deck.id}')" class="px-3 py-2 rounded-xl text-xs font-semibold" style="background: var(--danger-soft); color: var(--danger);">Удалить колоду</button>
                        <button onclick="CardsView.startStudy('${deck.id}')" class="btn-primary px-4 py-2 rounded-xl text-xs font-semibold">Учить</button>
                    </div>
                </div>

                <!-- Quick Add Card Form -->
                <form onsubmit="CardsView.addCard(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t" style="border-color: var(--border);">
                    <input type="text" id="fcFrontInput" required placeholder="Вопрос / Слово (лицевая сторона)" class="input-field sm:col-span-5 px-3 py-2.5 rounded-xl text-sm">
                    <input type="text" id="fcBackInput" required placeholder="Ответ / Перевод (обратная сторона)" class="input-field sm:col-span-5 px-3 py-2.5 rounded-xl text-sm">
                    <button type="submit" class="btn-primary sm:col-span-2 py-2.5 rounded-xl text-xs font-semibold">+ Добавить</button>
                </form>

                <!-- Bulk Import -->
                <details class="elevated rounded-xl p-3 text-xs">
                    <summary class="cursor-pointer font-semibold" style="color: var(--accent);">Массовое добавление списком (Вопрос - Ответ)</summary>
                    <div class="mt-2.5 space-y-2">
                        <textarea id="fcBulkText" rows="4" placeholder="Apple - Яблоко&#10;Derivative - Производная" class="input-field w-full p-2.5 rounded-xl text-xs font-mono"></textarea>
                        <button type="button" onclick="CardsView.importBulkCards()" class="btn-primary px-3 py-2 rounded-xl text-xs font-semibold">Импортировать строки</button>
                    </div>
                </details>
            </div>

            <div class="space-y-2 mt-4">
                ${deck.cards.map(c => `
                    <div class="card rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0 text-xs sm:text-sm">
                            <div class="font-semibold break-words">${Utils.escapeHTML(c.front)}</div>
                            <div class="break-words" style="color: var(--text-sub);">${Utils.escapeHTML(c.back)}</div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-[11px] tabular-nums hidden sm:inline" style="color: var(--text-muted);">Повтор: ${Utils.formatDateRU(c.dueDate)}</span>
                            <button onclick="CardsView.deleteCard('${c.id}')" class="p-2 rounded-lg" style="color: var(--danger);"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        window.lucide?.createIcons?.();
    },

    addCard(e) {
        e.preventDefault();
        const deck = Store.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (!deck) return;
        const front = document.getElementById('fcFrontInput').value.trim();
        const back = document.getElementById('fcBackInput').value.trim();
        if (!front || !back) return;
        deck.cards.push({ id: 'card_' + Date.now(), front, back, interval: 0, reps: 0, ease: 2.5, dueDate: Utils.todayISO() });
        Store.commit();
        UI.toast('Карточка добавлена');
    },

    importBulkCards() {
        const deck = Store.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        const raw = document.getElementById('fcBulkText')?.value || '';
        if (!deck || !raw.trim()) return;
        let count = 0;
        raw.split(/\r?\n/).forEach((line, idx) => {
            const parts = line.split(/\s[-–—:]\s|\t/);
            if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
                deck.cards.push({
                    id: `card_${Date.now()}_${idx}`,
                    front: parts[0].trim(),
                    back: parts.slice(1).join(' - ').trim(),
                    interval: 0, reps: 0, ease: 2.5, dueDate: Utils.todayISO()
                });
                count++;
            }
        });
        if (count > 0) {
            Store.commit();
            UI.toast(`Добавлено карточек: ${count}`);
        } else {
            UI.toast('Формат: Вопрос - Ответ');
        }
    },

    deleteCard(cardId) {
        const deck = Store.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (!deck) return;
        deck.cards = deck.cards.filter(c => c.id !== cardId);
        Store.commit();
    },

    deleteDeck(deckId) {
        Store.state.flashcardDecks = Store.state.flashcardDecks.filter(d => d.id !== deckId);
        this.activeDeckId = null;
        Store.commit();
        UI.toast('Колода удалена');
    },

    startStudy(deckId) {
        const deck = Store.state.flashcardDecks.find(d => d.id === deckId);
        if (!deck || deck.cards.length === 0) {
            UI.toast('Сначала добавьте карточки в колоду');
            this.openDeck(deckId);
            return;
        }
        const today = Utils.todayISO();
        const due = deck.cards.filter(c => !c.dueDate || c.dueDate <= today);
        this.studyQueue = (due.length > 0 ? due : deck.cards).map(c => c.id);
        this.studyDeckId = deckId;
        this.isFlipped = false;
        this.render();
    },

    renderStudySession(root) {
        const deck = Store.state.flashcardDecks.find(d => d.id === this.studyDeckId);
        if (!deck || this.studyQueue.length === 0) {
            this.studyDeckId = null;
            UI.toast('Сессия повторения завершена!');
            return this.render();
        }
        const card = deck.cards.find(c => c.id === this.studyQueue[0]);
        if (!card) { this.studyQueue.shift(); return this.render(); }

        root.innerHTML = `
            <div class="max-w-lg mx-auto space-y-4">
                <div class="flex items-center justify-between">
                    <button onclick="CardsView.studyDeckId=null; CardsView.render();" class="elevated px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                        <i data-lucide="x" class="w-4 h-4"></i> Завершить
                    </button>
                    <span class="text-xs font-bold tabular-nums" style="color: var(--text-sub);">Осталось: ${this.studyQueue.length}</span>
                </div>

                <!-- Flashcard -->
                <div onclick="CardsView.isFlipped = !CardsView.isFlipped; CardsView.render();"
                     class="card rounded-3xl p-6 sm:p-8 min-h-[280px] flex flex-col justify-between items-center text-center cursor-pointer select-none shadow-xl">
                    <span class="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-lg"
                          style="background: var(--bg-elevated); color: var(--text-muted);">
                        ${this.isFlipped ? 'Ответ' : 'Вопрос (нажмите, чтобы перевернуть)'}
                    </span>

                    <div class="my-auto py-6 text-lg sm:text-2xl font-bold leading-snug break-words w-full">
                        ${Utils.escapeHTML(this.isFlipped ? card.back : card.front)}
                    </div>

                    <span class="text-xs" style="color: var(--text-muted);">
                        ${this.isFlipped ? 'Оцените, насколько легко вспомнили:' : 'Нажмите на карточку'}
                    </span>
                </div>

                ${!this.isFlipped ? `
                    <button onclick="CardsView.isFlipped=true; CardsView.render();" class="btn-primary w-full py-3.5 rounded-2xl text-sm font-bold">
                        Показать ответ
                    </button>
                ` : `
                    <div class="grid grid-cols-4 gap-2">
                        <button onclick="CardsView.rateCard(1)" class="py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-0.5" style="background: var(--danger-soft); color: var(--danger);">
                            <span>Снова</span><span class="text-[10px] opacity-80">сейчас</span>
                        </button>
                        <button onclick="CardsView.rateCard(2)" class="py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-0.5" style="background: var(--warning-soft); color: var(--warning);">
                            <span>Трудно</span><span class="text-[10px] opacity-80">1 дн</span>
                        </button>
                        <button onclick="CardsView.rateCard(3)" class="py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-0.5" style="background: var(--accent-soft); color: var(--accent);">
                            <span>Хорошо</span><span class="text-[10px] opacity-80">${Math.max(1, card.interval || 1)} дн</span>
                        </button>
                        <button onclick="CardsView.rateCard(4)" class="py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-0.5" style="background: var(--success-soft); color: var(--success);">
                            <span>Легко</span><span class="text-[10px] opacity-80">${Math.max(3, Math.round((card.interval || 1) * 2.5))} дн</span>
                        </button>
                    </div>
                `}
            </div>
        `;
        window.lucide?.createIcons?.();
    },

    rateCard(grade) {
        const deck = Store.state.flashcardDecks.find(d => d.id === this.studyDeckId);
        const cardId = this.studyQueue.shift();
        const card = deck?.cards.find(c => c.id === cardId);
        if (!card) return;

        if (grade === 1) {
            card.reps = 0;
            card.interval = 0;
            card.dueDate = Utils.todayISO();
            this.studyQueue.push(card.id); // вернуть в текущую сессию
        } else {
            const nextInterval = grade === 2 ? 1 : (card.reps === 0 ? 1 : card.reps === 1 ? 3 : Math.round(card.interval * (grade === 4 ? 2.6 : 2.0)));
            card.reps += 1;
            card.interval = nextInterval;
            card.dueDate = Utils.addDaysISO(Utils.todayISO(), nextInterval);
        }

        this.isFlipped = false;
        StorageAdapter.save(Store.state);
        this.render();
    }
};

