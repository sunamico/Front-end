// =================================================================
// Допоміжні функції та регулярні вирази (як у лаб. роб. №5)
// =================================================================
const $ = (selector) => document.querySelector(selector);
const fmt = (n) => Number(n).toLocaleString('uk-UA') + ' ₴';
const STEP = 50; // мінімальний крок ставки

const RULES = {
    name: /^[А-ЯІЇЄҐA-Z][А-ЯІЇЄҐA-Zа-яіїєґ'’a-z-]{1,24}( [А-ЯІЇЄҐA-Z][А-ЯІЇЄҐA-Zа-яіїєґ'’a-z-]{1,24})?$/,
    email: /^[\w.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,
    phone: /^\+380\d{9}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
    title: /^.{3,40}$/,
    money: /^[1-9]\d{0,8}$/
};

// Створення елемента (як у лаб. роб. №4: createElement)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// =================================================================
// Стан застосунку
// =================================================================
const state = {
    lots: [],
    mode: 'server',      // 'server' (є Node-сервер) або 'static' (GitHub Pages)
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    favs: new Set(JSON.parse(localStorage.getItem('favs') || '[]')),
    search: '', category: 'all', sort: 'default', onlyFavs: false
};

const cardsEl = $('#cards');
const toastEl = $('#toast');

function toast(message, type) {
    toastEl.textContent = message;
    toastEl.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { toastEl.className = 'toast'; }, 3200);
}

// =================================================================
// Мобільне меню
// =================================================================
const toggle = $('#nav-toggle');
const menu = $('#menu');

toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
});
menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    });
});

// =================================================================
// Робота із сервером: fetch + promise + JSON (як у лаб. роб. №6)
// =================================================================
function loadLots() {
    return fetch('api/auctions')
        .then((response) => {
            if (!response.ok) throw new Error('API недоступне');
            return response.json();
        })
        .then((lots) => { state.mode = 'server'; return lots; })
        .catch(() => fetch('data/auctions.json')       // запасний варіант для GitHub Pages
            .then((response) => response.json())
            .then((lots) => {
                state.mode = 'static';
                const now = Date.now();
                lots.forEach((lot) => { lot.endsAt = now + lot.endsInMinutes * 60000; });
                return lots;
            }));
}

// У демо-режимі (без сервера) зміни виконуються лише в браузері
function localApi(path, body) {
    const bid = path.match(/^auctions\/(\d+)\/bid$/);
    if (bid) {
        const lot = state.lots.find((l) => l.id === Number(bid[1]));
        if (Date.now() > lot.endsAt) throw new Error('Торги за цим лотом завершено');
        if (body.amount < lot.price + STEP) throw new Error('Мінімальна ставка: ' + fmt(lot.price + STEP));
        lot.price = body.amount;
        lot.bids += 1;
        lot.lastBidder = state.user.name;
        return lot;
    }
    if (path === 'auctions') {
        return { id: Date.now(), bids: 0, seller: state.user.name, endsInMinutes: body.minutes,
                 endsAt: Date.now() + body.minutes * 60000, ...body };
    }
    return { token: 'local', name: body.name || body.email.split('@')[0], email: body.email };
}

function request(path, method, body) {
    if (state.mode === 'static') {
        return new Promise((resolve) => resolve(localApi(path, body)));
    }
    const headers = { 'Content-Type': 'application/json' };
    if (state.user) headers.Authorization = 'Bearer ' + state.user.token;
    return fetch('api/' + path, { method, headers, body: JSON.stringify(body) })
        .then((response) => response.json().then((data) => {
            if (!response.ok) {
                const error = new Error(data.error || 'Помилка запиту');
                error.status = response.status;
                throw error;
            }
            return data;
        }));
}

// =================================================================
// Відображення: пошук, категорії, сортування, обрані
// =================================================================
function visibleLots() {
    const query = state.search.trim().toLowerCase();
    const list = state.lots.filter((lot) =>
        (state.category === 'all' || lot.category === state.category) &&
        (!state.onlyFavs || state.favs.has(lot.id)) &&
        lot.name.toLowerCase().includes(query));
    const sorters = {
        ending: (a, b) => a.endsAt - b.endsAt,
        'price-asc': (a, b) => a.price - b.price,
        'price-desc': (a, b) => b.price - a.price,
        bids: (a, b) => b.bids - a.bids
    };
    if (sorters[state.sort]) list.sort(sorters[state.sort]);
    return list;
}

function createCard(lot) {
    const isFav = state.favs.has(lot.id);
    const card = el('article', 'card');
    card.dataset.id = lot.id;

    const fav = el('button', 'fav' + (isFav ? ' on' : ''), '♥');
    fav.type = 'button';
    fav.setAttribute('aria-label', 'Додати в обрані');
    fav.setAttribute('aria-pressed', isFav);

    const meta = el('p', 'meta');
    meta.append(el('span', '', lot.category), el('span', 'bids', 'Ставок: ' + lot.bids));

    const timer = el('p', 'timer');
    timer.dataset.end = lot.endsAt;

    const button = el('button', 'bid-btn', 'Зробити ставку');
    button.type = 'button';

    card.append(el('span', 'price', fmt(lot.price)), fav, el('div', 'pic', lot.emoji), el('h3', '', lot.name), meta);
    if (lot.lastBidder) card.append(el('p', 'last', 'Остання ставка: ' + lot.lastBidder));
    card.append(timer, button);
    return card;
}

function renderChips() {
    const chips = $('#chips');
    const categories = ['all', ...new Set(state.lots.map((lot) => lot.category))];
    chips.replaceChildren(...categories.map((cat) => {
        const chip = el('button', 'chip' + (state.category === cat ? ' active' : ''), cat === 'all' ? 'Усі' : cat);
        chip.type = 'button';
        chip.dataset.cat = cat;
        return chip;
    }));
    const fav = el('button', 'chip' + (state.onlyFavs ? ' active' : ''), '♥ Обрані');
    fav.type = 'button';
    fav.dataset.cat = 'favs';
    chips.append(fav);
}

function render() {
    const lots = visibleLots();
    cardsEl.replaceChildren(...(lots.length ? lots.map(createCard) : [el('p', 'empty', 'Лотів за вашим запитом не знайдено.')]));
    $('#mode').textContent = state.mode === 'server'
        ? '● Підключено до сервера: ставки та лоти зберігаються у базі.'
        : '● Демо-режим без сервера: зміни зберігаються лише у вашому браузері.';
    tick();
}

$('#search').addEventListener('input', (e) => { state.search = e.target.value; render(); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

$('#chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    if (chip.dataset.cat === 'favs') state.onlyFavs = !state.onlyFavs;
    else state.category = chip.dataset.cat;
    renderChips();
    render();
});

// Делегування подій для карток: обране та ставка
cardsEl.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const lot = state.lots.find((l) => l.id === Number(card.dataset.id));
    if (e.target.closest('.fav')) {
        if (state.favs.has(lot.id)) state.favs.delete(lot.id); else state.favs.add(lot.id);
        localStorage.setItem('favs', JSON.stringify([...state.favs]));
        render();
    } else if (e.target.closest('.bid-btn')) {
        openBid(lot);
    }
});

// =================================================================
// Таймер зворотного відліку
// =================================================================
function formatLeft(ms) {
    const s = Math.floor(ms / 1000);
    return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60]
        .map((n) => String(n).padStart(2, '0')).join(':');
}

function tick() {
    const now = Date.now();
    document.querySelectorAll('.timer').forEach((timer) => {
        const left = Number(timer.dataset.end) - now;
        const card = timer.closest('.card');
        if (left <= 0) {
            timer.textContent = 'Торги завершено';
            card.classList.add('ended');
            card.querySelector('.bid-btn').disabled = true;
        } else {
            timer.textContent = '⏱ ' + formatLeft(left);
        }
    });
}
setInterval(tick, 1000);

// =================================================================
// Діалоги та перевірка форм регулярними виразами
// =================================================================
function validate(form) {
    let ok = true;
    form.querySelectorAll('[data-rule]').forEach((input) => {
        const field = input.closest('.field');
        if (field.hidden) return;
        const valid = RULES[input.dataset.rule].test(input.value.trim());
        field.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
    });
    return ok;
}

function openDialog(dialog) {
    const form = dialog.querySelector('form');
    form.reset();
    form.querySelectorAll('.invalid').forEach((f) => f.classList.remove('invalid'));
    form.querySelector('.form-error').textContent = '';
    dialog.showModal();
}

document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
});

function handleError(error, errorEl) {
    if (error.status === 401 && state.user) {   // сесія сервера завершилась
        setUser(null);
        toast('Сесія завершилась, увійдіть знову', 'error');
        openAuth('login');
    } else {
        errorEl.textContent = error.message;
    }
}

// ----- Реєстрація та вхід -----
const authDialog = $('#auth-dialog');
const authForm = $('#auth-form');
let authMode = 'register';

function setAuthMode(mode) {
    authMode = mode;
    $('#auth-title').textContent = mode === 'register' ? 'Реєстрація' : 'Вхід';
    authForm.querySelectorAll('.reg').forEach((f) => { f.hidden = mode !== 'register'; });
    $('#auth-switch').textContent = mode === 'register' ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Зареєструватися';
}

function openAuth(mode) {
    openDialog(authDialog);
    setAuthMode(mode);
}

function setUser(user) {
    state.user = user;
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
    $('#auth-btn').textContent = user ? 'Вийти (' + user.name.split(' ')[0] + ')' : 'Увійти / Реєстрація';
    $('#hero-register').textContent = user ? 'Виставити лот' : 'Зареєструватися';
}

function requireAuth() {
    if (state.user) return true;
    toast('Спершу увійдіть або зареєструйтеся', 'error');
    openAuth('login');
    return false;
}

$('#auth-switch').addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode(authMode === 'register' ? 'login' : 'register');
});
$('#auth-btn').addEventListener('click', () => {
    if (state.user) { setUser(null); toast('Ви вийшли з акаунта'); } else openAuth('register');
});
// Головна кнопка: гостю пропонує реєстрацію, а користувачу в акаунті — виставити лот
$('#hero-register').addEventListener('click', () => {
    if (state.user) openDialog(sellDialog); else openAuth('register');
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(authForm)) return;
    request(authMode, 'POST', Object.fromEntries(new FormData(authForm)))
        .then((user) => {
            setUser(user);
            authDialog.close();
            toast('Вітаємо, ' + user.name + '!');
        })
        .catch((error) => handleError(error, $('#auth-error')));
});

// ----- Ставка -----
const bidDialog = $('#bid-dialog');
const bidForm = $('#bid-form');
let currentLot = null;

function openBid(lot) {
    if (!requireAuth()) return;
    currentLot = lot;
    openDialog(bidDialog);
    $('#bid-title').textContent = lot.name;
    $('#bid-info').textContent = 'Поточна ціна: ' + fmt(lot.price);
    $('#bid-hint').textContent = 'Мінімальна ставка: ' + fmt(lot.price + STEP);
    bidForm.amount.value = lot.price + STEP;
}

bidForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(bidForm.amount.value);
    if (!validate(bidForm) || amount < currentLot.price + STEP) {
        bidForm.amount.closest('.field').classList.add('invalid');
        return;
    }
    request('auctions/' + currentLot.id + '/bid', 'POST', { amount })
        .then((updated) => {
            Object.assign(currentLot, updated);
            bidDialog.close();
            render();
            toast('Ставку ' + fmt(amount) + ' прийнято!');
        })
        .catch((error) => handleError(error, $('#bid-error')));
});

// ----- Додавання лота -----
const sellDialog = $('#sell-dialog');
const sellForm = $('#sell-form');

$('#sell-link').addEventListener('click', () => { if (requireAuth()) openDialog(sellDialog); });

sellForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(sellForm)) return;
    const data = Object.fromEntries(new FormData(sellForm));
    data.price = Number(data.price);
    data.minutes = Number(data.minutes);
    request('auctions', 'POST', data)
        .then((lot) => {
            state.lots.push(lot);
            sellDialog.close();
            renderChips();
            render();
            toast('Лот «' + lot.name + '» виставлено на торги');
        })
        .catch((error) => handleError(error, $('#sell-error')));
});

// =================================================================
// Запуск
// =================================================================
setUser(state.user);

loadLots()
    .then((lots) => { state.lots = lots; renderChips(); render(); })
    .catch(() => {
        cardsEl.replaceChildren(el('p', 'empty', 'Не вдалося завантажити лоти. Запустіть сервер командою node server.js.'));
    });

// Раз на 10 секунд оновлюємо лоти з сервера (ставки інших користувачів)
setInterval(() => {
    if (state.mode !== 'server' || document.querySelector('dialog[open]')) return;
    loadLots().then((lots) => { if (state.mode === 'server') { state.lots = lots; render(); } });
}, 10000);