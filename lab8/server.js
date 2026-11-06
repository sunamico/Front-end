// Простий сервер на Node.js без зовнішніх залежностей.
// Запуск: node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const SEED_FILE = path.join(__dirname, 'data', 'auctions.json');
const STEP = 50; // мінімальний крок ставки, грн

// Дозволені статичні файли (db.json з паролями не віддається)
const STATIC = {
    '/': 'index.html', '/index.html': 'index.html',
    '/style.css': 'style.css', '/script.js': 'script.js',
    '/data/auctions.json': 'data/auctions.json'
};
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

// Ті самі регулярні вирази, що й у браузері
const RULES = {
    name: /^[А-ЯІЇЄҐA-Z][А-ЯІЇЄҐA-Zа-яіїєґ'’a-z-]{1,24}( [А-ЯІЇЄҐA-Z][А-ЯІЇЄҐA-Zа-яіїєґ'’a-z-]{1,24})?$/,
    email: /^[\w.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,
    phone: /^\+380\d{9}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
    title: /^.{3,40}$/
};
const CATEGORIES = ['Електроніка', 'Одяг', 'Взуття', 'Аксесуари', 'Інше'];
const EMOJIS = ['🎧', '📷', '🎸', '📚', '🚲', '🎮', '⌚', '👜'];
const DURATIONS = [30, 60, 180, 720];

// ===== «База даних» у JSON-файлі =====
function loadDb() {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { lots: JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')), users: [] };
}
function saveDb() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

const db = loadDb();
// Нові терміни торгів при кожному запуску сервера
db.lots.forEach(lot => {
    if (!lot.endsAt || lot.endsAt < Date.now()) lot.endsAt = Date.now() + lot.endsInMinutes * 60000;
});
saveDb();

const sessions = new Map(); // token -> email

function startSession(user) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user.email);
    return { token, name: user.name, email: user.email };
}
function currentUser(req) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    return db.users.find(u => u.email === sessions.get(token));
}
function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 32).toString('hex');
}

// ===== Допоміжні функції HTTP =====
function send(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 1e5) { req.destroy(); reject(new Error('Занадто великий запит')); }
        });
        req.on('end', () => {
            try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(new Error('Некоректний JSON')); }
        });
    });
}

// ===== API =====
async function handleApi(req, res, pathname) {
    if (req.method === 'GET' && pathname === '/api/auctions') return send(res, 200, db.lots);
    if (req.method !== 'POST') return send(res, 404, { error: 'Не знайдено' });

    const body = await readBody(req);

    if (pathname === '/api/register') {
        const ok = ['name', 'email', 'phone', 'password'].every(k => RULES[k].test(String(body[k] || '')));
        if (!ok) return send(res, 400, { error: 'Перевірте правильність введених даних' });
        const email = body.email.toLowerCase();
        if (db.users.some(u => u.email === email)) return send(res, 409, { error: 'Такий e-mail уже зареєстровано' });
        const salt = crypto.randomBytes(16).toString('hex');
        const user = { name: body.name, email, phone: body.phone, salt, hash: hashPassword(body.password, salt) };
        db.users.push(user);
        saveDb();
        return send(res, 201, startSession(user));
    }

    if (pathname === '/api/login') {
        const user = db.users.find(u => u.email === String(body.email || '').toLowerCase());
        const valid = user && crypto.timingSafeEqual(
            Buffer.from(hashPassword(String(body.password || ''), user.salt), 'hex'), Buffer.from(user.hash, 'hex'));
        if (!valid) return send(res, 401, { error: 'Невірний e-mail або пароль' });
        return send(res, 200, startSession(user));
    }

    const user = currentUser(req);
    if (!user) return send(res, 401, { error: 'Потрібно увійти' });

    const bidMatch = pathname.match(/^\/api\/auctions\/(\d+)\/bid$/);
    if (bidMatch) {
        const lot = db.lots.find(l => l.id === Number(bidMatch[1]));
        if (!lot) return send(res, 404, { error: 'Лот не знайдено' });
        if (Date.now() > lot.endsAt) return send(res, 400, { error: 'Торги за цим лотом завершено' });
        const amount = Number(body.amount);
        if (!Number.isInteger(amount) || amount < lot.price + STEP) {
            return send(res, 400, { error: 'Мінімальна ставка: ' + (lot.price + STEP) + ' ₴' });
        }
        lot.price = amount;
        lot.bids += 1;
        lot.lastBidder = user.name;
        saveDb();
        return send(res, 200, lot);
    }

    if (pathname === '/api/auctions') {
        const price = Number(body.price);
        const valid = RULES.title.test(String(body.name || '')) && CATEGORIES.includes(body.category) &&
            EMOJIS.includes(body.emoji) && Number.isInteger(price) && price > 0 && price <= 1e8 &&
            DURATIONS.includes(Number(body.minutes));
        if (!valid) return send(res, 400, { error: 'Перевірте дані лота' });
        const lot = {
            id: Math.max(0, ...db.lots.map(l => l.id)) + 1, name: body.name, category: body.category,
            emoji: body.emoji, price, bids: 0, seller: user.name,
            endsInMinutes: Number(body.minutes), endsAt: Date.now() + Number(body.minutes) * 60000
        };
        db.lots.push(lot);
        saveDb();
        return send(res, 201, lot);
    }

    send(res, 404, { error: 'Не знайдено' });
}

// ===== Сервер =====
http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    try {
        if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
        const file = STATIC[pathname];
        if (!file) return send(res, 404, { error: 'Не знайдено' });
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] + '; charset=utf-8' });
        fs.createReadStream(path.join(__dirname, file)).pipe(res);
    } catch (err) {
        send(res, 400, { error: err.message });
    }
}).listen(PORT, () => console.log('Сервер запущено: http://localhost:' + PORT));
