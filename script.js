/* Policultiva — aplicativo (React). Os dados ficam no localStorage do navegador. */
/* Mantém a classe "dark" do Tailwind em sincronia com o tema do aparelho. */
(function () {
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    var r = document.documentElement, t = r.getAttribute('data-theme');
    r.classList.toggle('dark', t === 'dark' || (t !== 'light' && mq.matches));
  }
  apply();
  mq.addEventListener('change', apply);
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

"use strict";
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const cn = (...a) => a.filter(Boolean).join(' ');
/* ---------- datas (sem deslocar o dia por fuso) ---------- */
const fmtDate = (iso) => {
    if (!iso)
        return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
};
const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const offsetISO = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const brl = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* ---------- armazenamento local (localStorage, com reserva em memória) ---------- */
const KEY = 'policultiva:v1';
const EMPTY = { profile: null, fields: [], crops: [], transactions: [], devices: [] };
const mem = {};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
function loadData() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw)
            return { ...EMPTY, ...JSON.parse(raw) };
    }
    catch (e) { /* sem acesso ao armazenamento */ }
    return mem.data ? { ...mem.data } : { ...EMPTY };
}
function saveData(d) {
    mem.data = d;
    try {
        localStorage.setItem(KEY, JSON.stringify(d));
    }
    catch (e) { /* ignora */ }
}
/* ---------- ícones ---------- */
const ICONS = {
    Leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    Sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    Droplets: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    Wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    Wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
    Sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    Settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>',
    ArrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    Trash2: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    AlertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    CheckCircle2: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    MapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    Ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    CalendarDays: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    TrendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    TrendingDown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    Gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    Battery: '<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/>',
    Power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
    Radio: '<circle cx="12" cy="12" r="2"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.48"/><path d="M16.24 7.76a6 6 0 0 1 0 8.48"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    Info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    Layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    Loader2: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    RefreshCw: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    Scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    Waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    User: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    LayoutDashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
};
function Icon({ name, className = 'w-4 h-4' }) {
    return (React.createElement("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", dangerouslySetInnerHTML: { __html: ICONS[name] || '' } }));
}
const mkIcon = (n) => (p) => React.createElement(Icon, { name: n, ...p });
const { Leaf, Sprout, Droplets, Wallet, Wifi, Sparkles, Settings, ArrowLeft, Trash2, Plus, AlertTriangle, CheckCircle2, MapPin, Ruler, CalendarDays, TrendingUp, TrendingDown, Gauge, Battery, Power, Radio, Info, X, Layers, Loader2, RefreshCw, Scissors, Waves, User, LayoutDashboard, } = Object.fromEntries(Object.keys(ICONS).map((n) => [n, mkIcon(n)]));
/* ---------- componentes de interface ---------- */
const BTN = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
};
const BTN_SIZE = { default: 'h-10 px-4 py-2', sm: 'h-9 px-3', lg: 'h-11 px-6 text-base', icon: 'h-10 w-10' };
function Button({ variant = 'default', size = 'default', className, ...p }) {
    return (React.createElement("button", { className: cn('inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50', BTN[variant], BTN_SIZE[size], className), ...p }));
}
const Card = ({ className, ...p }) => React.createElement("div", { className: cn('rounded-lg border bg-card text-card-foreground shadow-sm', className), ...p });
const CardContent = ({ className, ...p }) => React.createElement("div", { className: cn('p-6', className), ...p });
const Badge = ({ className, ...p }) => React.createElement("span", { className: cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', className), ...p });
const Input = ({ className, ...p }) => (React.createElement("input", { className: cn('flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50', className), ...p }));
const Label = ({ className, ...p }) => React.createElement("label", { className: cn('text-sm font-medium leading-none mb-1.5 block', className), ...p });
function Select({ value, onValueChange, options, placeholder, id }) {
    return (React.createElement("select", { id: id, value: value !== null && value !== void 0 ? value : '', onChange: (e) => onValueChange(e.target.value), className: "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" },
        placeholder !== undefined && React.createElement("option", { value: "" }, placeholder),
        options.map((o) => React.createElement("option", { key: o.value, value: o.value }, o.label))));
}
const Progress = ({ value, className }) => (React.createElement("div", { className: cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className), role: "progressbar", "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": 100 },
    React.createElement("div", { className: "h-full bg-primary transition-all", style: { width: `${Math.min(100, Math.max(0, value || 0))}%` } })));
function Dialog({ open, onClose, title, description, wide, children }) {
    useEffect(() => {
        if (!open)
            return undefined;
        const k = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [open, onClose]);
    if (!open)
        return null;
    return (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60", onMouseDown: (e) => { if (e.target === e.currentTarget)
            onClose(); }, role: "dialog", "aria-modal": "true", "aria-label": title },
        React.createElement("div", { className: cn('relative w-full max-h-[90vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg', wide ? 'max-w-lg' : 'max-w-md') },
            React.createElement("button", { "aria-label": "Fechar", className: "absolute right-4 top-4 opacity-70 hover:opacity-100", onClick: onClose },
                React.createElement(X, { className: "w-4 h-4" })),
            React.createElement("h2", { className: "text-lg font-semibold font-heading pr-6" }, title),
            description && React.createElement("p", { className: "text-sm text-muted-foreground mt-1.5" }, description),
            React.createElement("div", { className: "mt-4" }, children))));
}
/* ---------- regras: solo, umidade, consórcios ---------- */
const SOIL_LABELS = { arenoso: 'Arenoso', argiloso: 'Argiloso', siltoso: 'Siltoso', franco: 'Franco', organico: 'Orgânico' };
const SOIL_WATER_NOTES = {
    arenoso: 'Solo arenoso drena rápido e segura pouca água: regue com mais frequência e em menor volume.',
    argiloso: 'Solo argiloso retém muita água e drena devagar: cuidado com encharcamento e regue menos vezes.',
    siltoso: 'Solo siltoso retém bem a umidade, mas pode compactar: evite excesso de água.',
    franco: 'Solo franco tem boa retenção e drenagem — é o equilíbrio ideal para a maioria das culturas.',
    organico: 'Solo orgânico retém bastante umidade e nutrientes: monitore para não ficar encharcado.',
};
const CLIMATE_LABELS = { tropical: 'Tropical (quente o ano todo)', semitropical: 'Semitropical', temperado: 'Temperado', seco: 'Seco / semiárido', umido: 'Úmido / chuvoso' };
const humidityStatus = (c) => {
    const h = Number(c.humidity), min = Number(c.min_humidity), max = Number(c.max_humidity);
    return h < min ? 'baixa' : h > max ? 'alta' : 'ideal';
};
const targetHumidity = (c) => Math.round((Number(c.min_humidity) + Number(c.max_humidity)) / 2);
const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const CROP_ALIASES = {
    milho: ['milho', 'milho verde', 'milho pipoca'],
    feijao: ['feijão', 'feijao', 'feijao de corda', 'feijao carioquinha', 'feijão de corda', 'feijão carioquinha'],
    mandioca: ['mandioca', 'macaxeira', 'aipim', 'mandioca de mesa'],
    abobora: ['abóbora', 'abobora', 'jerimum', 'abobrinha', 'moranga'],
    melancia: ['melancia', 'melao', 'melão', 'melancia de água'],
    couve: ['couve', 'couve manteiga', 'couve portuguesa'],
    soja: ['soja', 'soja transgenica'],
    tomate: ['tomate', 'tomate de mesa', 'tomate italiano'],
    cenoura: ['cenoura'], cebola: ['cebola', 'cebola roxa'], alho: ['alho', 'alho roxo'],
    alface: ['alface', 'alface crespa', 'alface americana'],
    manjericao: ['manjericão', 'manjericao', 'manjerona'],
    batata: ['batata', 'batata inglesa', 'batata doce'],
    beterraba: ['beterraba'], ervilha: ['ervilha', 'ervilha torta', 'ervilha de comer'],
    cafe: ['café', 'cafe', 'cafeeiro'], banana: ['banana', 'bananeira'],
};
const ALIAS_TO_CANON = {};
Object.entries(CROP_ALIASES).forEach(([k, list]) => {
    ALIAS_TO_CANON[normalize(k)] = k;
    list.forEach((a) => { ALIAS_TO_CANON[normalize(a)] = k; });
});
const canon = (n) => ALIAS_TO_CANON[normalize(n)] || null;
const COMPAT = {
    milho: { good: ['feijao', 'abobora', 'mandioca', 'melancia', 'soja', 'ervilha'], bad: [] },
    feijao: { good: ['milho', 'mandioca', 'abobora', 'couve', 'ervilha'], bad: ['cebola', 'alho'] },
    mandioca: { good: ['milho', 'feijao', 'abobora', 'banana', 'cafe'], bad: [] },
    abobora: { good: ['milho', 'feijao', 'mandioca'], bad: [] },
    melancia: { good: ['milho'], bad: [] },
    couve: { good: ['feijao', 'ervilha'], bad: [] },
    soja: { good: ['milho'], bad: [] },
    tomate: { good: ['manjericao', 'cenoura', 'alface'], bad: ['batata'] },
    cenoura: { good: ['cebola', 'alface', 'tomate'], bad: [] },
    cebola: { good: ['cenoura', 'alface'], bad: ['feijao', 'ervilha'] },
    alho: { good: ['cenoura', 'tomate'], bad: ['feijao', 'ervilha'] },
    alface: { good: ['cenoura', 'cebola', 'manjericao'], bad: [] },
    manjericao: { good: ['tomate', 'alface'], bad: [] },
    batata: { good: [], bad: ['tomate'] },
    beterraba: { good: ['alface'], bad: [] },
    ervilha: { good: ['milho', 'couve', 'feijao'], bad: ['cebola', 'alho'] },
    cafe: { good: ['mandioca', 'banana'], bad: [] },
    banana: { good: ['mandioca', 'cafe'], bad: [] },
};
const CROP_LABELS = {
    milho: 'Milho', feijao: 'Feijão', mandioca: 'Mandioca', abobora: 'Abóbora', melancia: 'Melancia', couve: 'Couve',
    soja: 'Soja', tomate: 'Tomate', cenoura: 'Cenoura', cebola: 'Cebola', alho: 'Alho', alface: 'Alface',
    manjericao: 'Manjericão', batata: 'Batata', beterraba: 'Beterraba', ervilha: 'Ervilha', cafe: 'Café', banana: 'Banana',
};
function analyzeCompanions(names) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const u = [...new Set(names.map(canon).filter(Boolean))];
    const good = [], bad = [];
    for (let i = 0; i < u.length; i++)
        for (let j = i + 1; j < u.length; j++) {
            const a = u[i], b = u[j];
            if (((_b = (_a = COMPAT[a]) === null || _a === void 0 ? void 0 : _a.good) === null || _b === void 0 ? void 0 : _b.includes(b)) || ((_d = (_c = COMPAT[b]) === null || _c === void 0 ? void 0 : _c.good) === null || _d === void 0 ? void 0 : _d.includes(a)))
                good.push([a, b]);
            if (((_f = (_e = COMPAT[a]) === null || _e === void 0 ? void 0 : _e.bad) === null || _f === void 0 ? void 0 : _f.includes(b)) || ((_h = (_g = COMPAT[b]) === null || _g === void 0 ? void 0 : _g.bad) === null || _h === void 0 ? void 0 : _h.includes(a)))
                bad.push([a, b]);
        }
    return { good, bad };
}
function suggestCompanions(names) {
    const u = [...new Set(names.map(canon).filter(Boolean))];
    const s = new Set();
    u.forEach((c) => { var _a, _b; return (_b = (_a = COMPAT[c]) === null || _a === void 0 ? void 0 : _a.good) === null || _b === void 0 ? void 0 : _b.forEach((g) => { if (!u.includes(g))
        s.add(g); }); });
    return [...s];
}
/* ---------- ESP32 (HTTP na rede local) ---------- */
async function espRequest(url, options, ms = 5000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { ...options, signal: ctrl.signal });
        if (!res.ok)
            throw new Error(`O dispositivo respondeu com erro ${res.status}`);
        return res;
    }
    catch (e) {
        if (e.name === 'AbortError')
            throw new Error('Tempo esgotado: o ESP32 não respondeu.');
        if (e instanceof TypeError)
            throw new Error('Não foi possível alcançar o ESP32. Confira o IP e se está na mesma rede, acessando o site por HTTP.');
        throw e;
    }
    finally {
        clearTimeout(t);
    }
}
const espBase = (ip) => `http://${String(ip).trim().replace(/^https?:\/\//, '')}`;
const getStatus = async (ip) => (await espRequest(`${espBase(ip)}/status`)).json();
async function setOutputState(ip, on) {
    const res = await espRequest(`${espBase(ip)}/relay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: !!on, relay: on ? 1 : 0 }),
    });
    try {
        return await res.json();
    }
    catch (e) {
        return null;
    }
}
/* ---------- previsão do tempo → recomendações ---------- */
const fmtDay = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
};
async function geocode(city, state) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=pt&country_code=BR`);
    if (!res.ok)
        throw new Error('geocoding');
    const list = (await res.json()).results || [];
    if (!list.length)
        throw new Error('Cidade não encontrada');
    const st = String(state || '').toLowerCase();
    return list.find((r) => st && String(r.admin1 || '').toLowerCase().includes(st)) || list[0];
}
async function fetchForecast(lat, lon) {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&timezone=auto`);
    if (!res.ok)
        throw new Error('forecast');
    const d = (await res.json()).daily;
    return d.time.map((t, i) => { var _a, _b, _c; return ({ date: t, tmax: d.temperature_2m_max[i], tmin: d.temperature_2m_min[i], rain: (_a = d.precipitation_sum[i]) !== null && _a !== void 0 ? _a : 0, prob: (_b = d.precipitation_probability_max[i]) !== null && _b !== void 0 ? _b : 0, wind: (_c = d.wind_speed_10m_max[i]) !== null && _c !== void 0 ? _c : 0 }); });
}
const bestOf = (days, score) => days.reduce((a, b) => (score(b, days) > score(a, days) ? b : a));
function buildRecommendations(days, placeLabel, crops) {
    const totalRain = days.reduce((s, d) => s + d.rain, 0);
    const rainyDays = days.filter((d) => d.rain >= 1).length;
    const avgMax = days.reduce((s, d) => s + d.tmax, 0) / days.length;
    const weather_summary = `Próximos 7 dias em ${placeLabel}: máximas médias de ${avgMax.toFixed(0)}°C, ${rainyDays} dia(s) com chuva e ${totalRain.toFixed(0)} mm no total.`;
    const dry = crops.filter((c) => Number(c.humidity) < Number(c.min_humidity));
    const wet = crops.filter((c) => Number(c.humidity) > Number(c.max_humidity));
    const plant = bestOf(days, (d, all) => {
        const next = all[all.indexOf(d) + 1];
        const bonus = next && next.rain >= 2 && next.rain <= 15 ? 3 : 0;
        return -Math.abs(d.tmax - 26) - d.rain * 0.8 - d.wind / 10 + bonus;
    });
    const weed = bestOf(days, (d) => -d.rain * 2 - d.prob / 20 - d.wind / 10);
    const waterDay = days.find((d) => d.rain < 2 && d.prob < 40) || bestOf(days, (d) => -d.rain - d.prob / 10);
    const rainSoon = days.slice(0, 2).some((d) => d.rain >= 8);
    const heavy = bestOf(days, (d) => d.rain);
    const drainDay = heavy.rain >= 10 ? days[Math.max(0, days.indexOf(heavy) - 1)] : null;
    const names = (l) => l.map((c) => c.name).join(', ');
    return {
        weather_summary,
        recommendations: [
            { action: 'plantar', best_day: fmtDay(plant.date),
                reason: `Temperatura em torno de ${plant.tmax.toFixed(0)}°C, ${plant.rain.toFixed(1)} mm previstos e vento de até ${plant.wind.toFixed(0)} km/h — condição favorável para o pegamento das mudas e sementes.`,
                tips: 'Plante no fim da tarde para reduzir o estresse hídrico e regue logo em seguida se o solo estiver seco.' },
            { action: 'cultivar', best_day: fmtDay(weed.date),
                reason: `Dia mais seco da semana (${weed.rain.toFixed(1)} mm, ${weed.prob}% de chance de chuva) e vento fraco: o solo trabalha bem e o mato cortado seca rápido.`,
                tips: 'Capine com o solo levemente úmido, nunca encharcado, para não compactar.' },
            { action: 'regar', best_day: rainSoon && !dry.length ? 'Aguarde a chuva' : fmtDay(waterDay.date),
                reason: rainSoon && !dry.length
                    ? 'Há chuva forte prevista para os próximos dias e nenhuma cultura está seca: não gaste água à toa.'
                    : `${dry.length ? `${names(dry)} com umidade abaixo do ideal. ` : ''}Dia sem chuva relevante (${waterDay.rain.toFixed(1)} mm) e máxima de ${waterDay.tmax.toFixed(0)}°C.`,
                tips: 'Regue cedo (antes das 9h) ou ao entardecer para perder menos água por evaporação.' },
            { action: 'drenar', best_day: drainDay ? fmtDay(drainDay.date) : 'Sem necessidade agora',
                reason: drainDay
                    ? `Chuva forte de ${heavy.rain.toFixed(0)} mm prevista para ${fmtDay(heavy.date)}. Abra os drenos antes para evitar encharcamento${wet.length ? ` — ${names(wet)} já está(ão) com umidade acima do ideal` : ''}.`
                    : `Nenhuma chuva forte prevista (máximo de ${heavy.rain.toFixed(0)} mm em um dia).${wet.length ? ` Mesmo assim, ${names(wet)} está(ão) com umidade alta: drene hoje.` : ''}`,
                tips: 'Limpe valas e canais antes da chuva; em solo argiloso, comece a drenar com mais antecedência.' },
        ],
    };
}
async function getRecommendations({ farmProfile, crops }) {
    const place = await geocode(farmProfile.city, farmProfile.state);
    const days = await fetchForecast(place.latitude, place.longitude);
    return buildRecommendations(days, `${place.name}${place.admin1 ? ' - ' + place.admin1 : ''}`, crops);
}
// Previsão de exemplo, usada só quando a internet não está disponível (marcada como exemplo na tela).
function sampleRecommendations(farmProfile, crops) {
    const pat = [[29, 0, 5], [30, 0, 10], [28, 3, 40], [26, 14, 85], [25, 6, 70], [27, 0, 20], [29, 0, 5]];
    const days = pat.map(([tmax, rain, prob], i) => ({ date: offsetISO(i), tmax, tmin: tmax - 10, rain, prob, wind: 8 + (i % 3) * 3 }));
    return buildRecommendations(days, `${farmProfile.city} - ${farmProfile.state}`, crops);
}
/* ================= Cultura / Irrigação ================= */
const BAR_COLOR = { baixa: 'bg-amber-500', alta: 'bg-blue-500', ideal: 'bg-emerald-500' };
const STATUS = {
    baixa: { label: 'Umidade baixa', badge: 'text-amber-700 bg-amber-100', icon: AlertTriangle, action: 'Irrigar agora' },
    alta: { label: 'Umidade alta', badge: 'text-blue-700 bg-blue-100', icon: Droplets, action: 'Drenar agora' },
    ideal: { label: 'Tudo certo', badge: 'text-emerald-700 bg-emerald-100', icon: CheckCircle2, action: null },
};
function CropCard({ crop, field, onResolve, onUpdateHumidity, onDelete }) {
    var _a;
    const [localH, setLocalH] = useState(Number((_a = crop.humidity) !== null && _a !== void 0 ? _a : 0));
    useEffect(() => { var _a; setLocalH(Number((_a = crop.humidity) !== null && _a !== void 0 ? _a : 0)); }, [crop.humidity]);
    const status = humidityStatus({ ...crop, humidity: localH });
    const s = STATUS[status];
    const StatusIcon = s.icon;
    const pct = Math.min(100, Math.max(0, localH));
    const auto = (field === null || field === void 0 ? void 0 : field.irrigation_mode) === 'automatico';
    const commit = () => { var _a; if (localH !== Number((_a = crop.humidity) !== null && _a !== void 0 ? _a : 0))
        onUpdateHumidity(crop, localH); };
    return (React.createElement(Card, { className: "overflow-hidden" },
        React.createElement("div", { className: `h-1.5 ${BAR_COLOR[status]}` }),
        React.createElement(CardContent, { className: "p-4 space-y-4" },
            React.createElement("div", { className: "flex items-start justify-between gap-2" },
                React.createElement("div", { className: "flex items-center gap-2 min-w-0" },
                    React.createElement("div", { className: "w-9 h-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center" },
                        React.createElement(Sprout, { className: "w-5 h-5 text-primary" })),
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("h3", { className: "font-bold leading-tight truncate" }, crop.name),
                        React.createElement("p", { className: "text-sm text-muted-foreground truncate" }, crop.variety || 'Sem variedade'))),
                React.createElement(Badge, { className: s.badge },
                    React.createElement(StatusIcon, { className: "w-3 h-3 mr-1" }),
                    s.label)),
            React.createElement("div", { className: "flex items-end justify-between gap-2" },
                React.createElement("div", null,
                    React.createElement("p", { className: "text-sm text-muted-foreground" }, "Umidade do solo"),
                    React.createElement("p", { className: "text-3xl font-bold leading-none tabular-nums" },
                        localH,
                        React.createElement("span", { className: "text-base font-medium" }, "%"))),
                React.createElement("div", { className: "text-right text-sm text-muted-foreground tabular-nums" },
                    React.createElement("p", null,
                        "Ideal: ",
                        crop.min_humidity,
                        "% a ",
                        crop.max_humidity,
                        "%"),
                    React.createElement("p", null,
                        "Alvo: ",
                        targetHumidity(crop),
                        "%"))),
            React.createElement("div", { className: "h-3 rounded-full bg-muted overflow-hidden" },
                React.createElement("div", { className: `h-full rounded-full ${BAR_COLOR[status]}`, style: { width: `${pct}%` } })),
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("span", { className: "text-sm text-muted-foreground" }, "Medir:"),
                React.createElement("input", { type: "range", min: 0, max: 100, value: localH, onChange: (e) => setLocalH(Number(e.target.value)), onPointerUp: commit, onKeyUp: commit, className: "flex-1", "aria-label": "Medir umidade do solo" })),
            status !== 'ideal' && (React.createElement("div", { className: "flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2" },
                React.createElement("span", { className: "text-sm text-muted-foreground" }, auto ? 'Modo automático' : s.action),
                React.createElement("button", { onClick: () => onResolve(crop), className: "inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90" },
                    status === 'baixa' ? React.createElement(Droplets, { className: "w-4 h-4" }) : React.createElement(AlertTriangle, { className: "w-4 h-4" }),
                    "Resolver"))),
            React.createElement("div", { className: "flex items-center justify-between text-sm text-muted-foreground pt-1 border-t" },
                React.createElement("span", null,
                    "Talh\u00E3o: ",
                    (field === null || field === void 0 ? void 0 : field.name) || '—'),
                React.createElement("button", { onClick: () => onDelete(crop), className: "inline-flex items-center gap-1 text-destructive hover:underline" },
                    React.createElement(Trash2, { className: "w-3 h-3" }),
                    " Tirar")))));
}
function IrrigationPanel({ crops, fields, onResolve, onUpdateHumidity, onDelete, onAddCrop }) {
    const alerts = crops.filter((c) => humidityStatus(c) !== 'ideal');
    const fieldOf = (c) => fields.find((f) => f.id === c.field_id);
    return (React.createElement("div", { className: "space-y-4" },
        React.createElement("div", { className: "flex items-center justify-between gap-3 flex-wrap" },
            React.createElement("div", { className: "flex items-center gap-2" },
                alerts.length > 0 ? React.createElement(AlertTriangle, { className: "w-5 h-5 text-amber-500" }) : React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }),
                React.createElement("span", { className: "font-medium" }, alerts.length > 0 ? `${alerts.length} cultura(s) com umidade fora da faixa ideal` : 'Todas as culturas com umidade ideal')),
            React.createElement(Button, { size: "sm", onClick: onAddCrop },
                React.createElement(Plus, { className: "w-4 h-4 mr-1" }),
                " Nova cultura")),
        crops.length === 0 ? (React.createElement(Card, null,
            React.createElement(CardContent, { className: "p-8 text-center text-muted-foreground" },
                React.createElement(Droplets, { className: "w-10 h-10 mx-auto mb-3 opacity-40" }),
                "Nenhuma cultura cadastrada. Adicione culturas aos talh\u00F5es para automatizar a irriga\u00E7\u00E3o."))) : (React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" }, crops.map((c) => React.createElement(CropCard, { key: c.id, crop: c, field: fieldOf(c), onResolve: onResolve, onUpdateHumidity: onUpdateHumidity, onDelete: onDelete }))))));
}
/* ================= Culturas ================= */
const STATUS_BADGE = { ideal: 'text-emerald-700 bg-emerald-100', baixa: 'text-amber-700 bg-amber-100', alta: 'text-blue-700 bg-blue-100' };
const STATUS_LABEL = { ideal: 'Tudo certo', baixa: 'Seco', alta: 'Molhado demais' };
function CropsPanel({ crops, fields, onAddCrop, onDelete }) {
    const grouped = fields.map((f) => ({ field: f, list: crops.filter((c) => c.field_id === f.id) }));
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "flex items-center justify-between gap-3 flex-wrap" },
            React.createElement("p", { className: "text-sm text-muted-foreground" }, "Veja o que est\u00E1 plantado em cada talh\u00E3o."),
            React.createElement(Button, { size: "lg", onClick: onAddCrop },
                React.createElement(Plus, { className: "w-5 h-5 mr-2" }),
                " Plantar cultura")),
        crops.length === 0 ? (React.createElement(Card, null,
            React.createElement(CardContent, { className: "p-10 text-center text-muted-foreground" },
                React.createElement(Sprout, { className: "w-12 h-12 mx-auto mb-3 opacity-40" }),
                React.createElement("p", { className: "font-medium" }, "Nenhuma cultura plantada ainda."),
                React.createElement("p", { className: "text-sm" }, "Toque em \u201CPlantar cultura\u201D para come\u00E7ar.")))) : grouped.map(({ field, list }) => {
            const { good, bad } = analyzeCompanions(list.map((c) => c.name));
            return (React.createElement("div", { key: field.id, className: "space-y-3" },
                React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                    React.createElement(MapPin, { className: "w-4 h-4 text-primary" }),
                    React.createElement("h2", { className: "font-semibold font-heading" }, field.name),
                    React.createElement("span", { className: "text-sm text-muted-foreground" },
                        "\u00B7 ",
                        SOIL_LABELS[field.soil_type],
                        " \u00B7 ",
                        field.region)),
                (good.length > 0 || bad.length > 0) && (React.createElement("div", { className: "flex flex-wrap items-center gap-2 text-sm" },
                    good.map(([a, b], i) => (React.createElement("span", { key: `g${i}`, className: "inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 rounded-full px-2.5 py-1" },
                        React.createElement(Leaf, { className: "w-3.5 h-3.5" }),
                        " Cons\u00F3rcio: ",
                        CROP_LABELS[a],
                        " + ",
                        CROP_LABELS[b]))),
                    bad.map(([a, b], i) => (React.createElement("span", { key: `b${i}`, className: "inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full px-2.5 py-1" },
                        React.createElement(AlertTriangle, { className: "w-3.5 h-3.5" }),
                        " Evite: ",
                        CROP_LABELS[a],
                        " + ",
                        CROP_LABELS[b]))))),
                React.createElement("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" },
                    list.length === 0 && React.createElement("p", { className: "text-sm text-muted-foreground" }, "Sem culturas neste talh\u00E3o."),
                    list.map((c) => {
                        const st = humidityStatus(c);
                        return (React.createElement(Card, { key: c.id },
                            React.createElement(CardContent, { className: "p-4 space-y-3" },
                                React.createElement("div", { className: "flex items-start justify-between gap-2" },
                                    React.createElement("div", { className: "flex items-center gap-2 min-w-0" },
                                        React.createElement("div", { className: "w-9 h-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center" },
                                            React.createElement(Sprout, { className: "w-5 h-5 text-primary" })),
                                        React.createElement("div", { className: "min-w-0" },
                                            React.createElement("h3", { className: "font-bold leading-tight truncate" }, c.name),
                                            React.createElement("p", { className: "text-sm text-muted-foreground truncate" }, c.variety || 'Sem variedade'))),
                                    React.createElement(Badge, { className: STATUS_BADGE[st] }, STATUS_LABEL[st])),
                                React.createElement("div", { className: "flex items-center gap-2 text-sm text-muted-foreground" },
                                    React.createElement(Ruler, { className: "w-4 h-4" }),
                                    " ",
                                    c.planted_area_hectares,
                                    " ha"),
                                c.planted_date && (React.createElement("div", { className: "flex items-center gap-2 text-sm text-muted-foreground" },
                                    React.createElement(CalendarDays, { className: "w-4 h-4 shrink-0" }),
                                    React.createElement("span", null,
                                        fmtDate(c.planted_date),
                                        c.expected_harvest_date ? ` → colheita ${fmtDate(c.expected_harvest_date)}` : ''))),
                                React.createElement("div", { className: "flex justify-end border-t pt-2" },
                                    React.createElement("button", { onClick: () => onDelete(c), className: "inline-flex items-center gap-1 text-sm text-destructive hover:underline" },
                                        React.createElement(Trash2, { className: "w-4 h-4" }),
                                        " Remover")))));
                    }))));
        })));
}
/* ================= Dispositivos ================= */
const DEVICE_TYPES = { sensor: 'Sensor de Umidade', irrigator: 'Regador', drainer: 'Drenador' };
const TYPE_META = {
    sensor: { icon: Gauge, color: 'text-blue-600', label: 'Sensor de Umidade' },
    irrigator: { icon: Droplets, color: 'text-sky-600', label: 'Regador' },
    drainer: { icon: Radio, color: 'text-amber-600', label: 'Drenador' },
};
function DeviceCard({ device, field, onReading, onToggle, onDelete }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const meta = TYPE_META[device.type] || TYPE_META.sensor;
    const DevIcon = meta.icon;
    const handleConnect = async () => {
        setError(null);
        setBusy(true);
        try {
            const status = await getStatus(device.ip_address);
            const updates = { connected: true };
            if (device.type === 'sensor' && status.moisture != null)
                updates.moisture = status.moisture;
            if (status.battery != null)
                updates.battery = status.battery;
            if (device.type !== 'sensor' && status.relay != null)
                updates.is_on = !!status.relay;
            await onReading(device, updates);
        }
        catch (e) {
            setError(e.message || 'Falha ao conectar ao ESP32');
        }
        finally {
            setBusy(false);
        }
    };
    const handleToggle = async () => {
        setError(null);
        setBusy(true);
        try {
            await setOutputState(device.ip_address, !device.is_on);
            await onToggle(device, !device.is_on);
        }
        catch (e) {
            setError(e.message || 'Falha no comando');
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement(Card, { className: device.connected ? 'ring-2 ring-sky-400' : '' },
        React.createElement(CardContent, { className: "p-4 space-y-3" },
            React.createElement("div", { className: "flex items-start justify-between gap-2" },
                React.createElement("div", { className: "flex items-center gap-2 min-w-0" },
                    React.createElement("div", { className: "w-10 h-10 shrink-0 rounded-xl bg-muted flex items-center justify-center" },
                        React.createElement(DevIcon, { className: `w-5 h-5 ${meta.color}` })),
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("p", { className: "font-semibold leading-tight truncate" }, device.name),
                        React.createElement("p", { className: "text-sm text-muted-foreground truncate" },
                            meta.label,
                            field ? ` · ${field.name}` : ''),
                        React.createElement("p", { className: "text-sm text-muted-foreground/70" }, device.ip_address))),
                React.createElement(Button, { variant: "ghost", size: "icon", className: "h-11 w-11 shrink-0", "aria-label": "Remover dispositivo", onClick: () => onDelete(device) },
                    React.createElement(Trash2, { className: "w-5 h-5 text-muted-foreground" }))),
            device.connected
                ? React.createElement("div", { className: "flex items-center gap-1.5 text-sm font-medium text-sky-600" },
                    React.createElement(Wifi, { className: "w-3.5 h-3.5" }),
                    " Conectado")
                : React.createElement("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground" },
                    React.createElement(Wifi, { className: "w-3.5 h-3.5" }),
                    " Desconectado"),
            device.type === 'sensor' && device.moisture != null && (React.createElement("div", { className: "space-y-1" },
                React.createElement("div", { className: "flex items-center justify-between text-sm" },
                    React.createElement("span", { className: "flex items-center gap-1 text-muted-foreground" },
                        React.createElement(Droplets, { className: "w-3 h-3" }),
                        " Umidade"),
                    React.createElement("span", { className: "font-medium tabular-nums" },
                        device.moisture,
                        "%")),
                React.createElement(Progress, { value: device.moisture }))),
            device.battery != null && (React.createElement("div", { className: "flex items-center justify-between text-sm" },
                React.createElement("span", { className: "flex items-center gap-1 text-muted-foreground" },
                    React.createElement(Battery, { className: "w-3 h-3" }),
                    " Bateria"),
                React.createElement("span", { className: "font-medium tabular-nums" },
                    device.battery,
                    "%"))),
            device.type !== 'sensor' && (React.createElement("div", { className: "flex items-center justify-between text-sm" },
                React.createElement("span", { className: "text-muted-foreground" }, "Estado"),
                React.createElement("span", { className: `font-medium ${device.is_on ? 'text-emerald-600' : 'text-muted-foreground'}` }, device.is_on ? 'Ligado' : 'Desligado'))),
            error && React.createElement("p", { className: "text-sm text-red-500" }, error),
            React.createElement("div", { className: "flex gap-2 pt-1" },
                device.connected
                    ? React.createElement(Button, { size: "sm", variant: "outline", onClick: () => onReading(device, { connected: false }), disabled: busy, className: "flex-1" },
                        React.createElement(Wifi, { className: "w-4 h-4 mr-1" }),
                        " Desconectar")
                    : React.createElement(Button, { size: "sm", onClick: handleConnect, disabled: busy, className: "flex-1" },
                        React.createElement(Wifi, { className: "w-4 h-4 mr-1" }),
                        busy ? 'Conectando…' : 'Conectar'),
                device.type !== 'sensor' && (React.createElement(Button, { size: "sm", variant: device.is_on ? 'destructive' : 'default', onClick: handleToggle, disabled: busy || !device.connected, className: "flex-1" },
                    React.createElement(Power, { className: "w-4 h-4 mr-1" }),
                    device.is_on ? 'Desligar' : 'Ligar'))))));
}
function DeviceDialog({ open, onClose, onSave, fields }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('sensor');
    const [ip, setIp] = useState('');
    const [fieldId, setFieldId] = useState('');
    useEffect(() => { if (open) {
        setName('');
        setType('sensor');
        setIp('');
        setFieldId('');
    } }, [open]);
    const submit = () => {
        if (!name.trim() || !ip.trim())
            return;
        onSave({ name: name.trim(), type, ip_address: ip.trim(), field_id: fieldId || undefined, connected: false, is_on: false });
        onClose();
    };
    return (React.createElement(Dialog, { open: open, onClose: onClose, title: "Registrar Dispositivo" },
        React.createElement("div", { className: "space-y-4" },
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "dv-name" }, "Nome do dispositivo"),
                React.createElement(Input, { id: "dv-name", value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: Sensor Talh\u00E3o A" })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "dv-type" }, "Tipo"),
                React.createElement(Select, { id: "dv-type", value: type, onValueChange: setType, options: Object.entries(DEVICE_TYPES).map(([value, label]) => ({ value, label })) })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "dv-ip" }, "IP do ESP32 (rede local)"),
                React.createElement(Input, { id: "dv-ip", value: ip, onChange: (e) => setIp(e.target.value), placeholder: "Ex: 192.168.1.50" })),
            fields.length > 0 && (React.createElement("div", null,
                React.createElement(Label, { htmlFor: "dv-field" }, "Talh\u00E3o (opcional)"),
                React.createElement(Select, { id: "dv-field", value: fieldId, onValueChange: setFieldId, placeholder: "Sem talh\u00E3o", options: fields.map((f) => ({ value: f.id, label: f.name })) }))),
            React.createElement("div", { className: "flex flex-col-reverse sm:flex-row sm:justify-end gap-2" },
                React.createElement(Button, { variant: "outline", onClick: onClose }, "Cancelar"),
                React.createElement(Button, { onClick: submit, disabled: !name.trim() || !ip.trim() }, "Registrar")))));
}
function WiFiPanel({ devices, fields, onAdd, onReading, onToggle, onDelete }) {
    const [addOpen, setAddOpen] = useState(false);
    const fieldOf = (d) => fields.find((f) => f.id === d.field_id);
    return (React.createElement("div", { className: "space-y-4" },
        React.createElement(Card, { className: "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40" },
            React.createElement(CardContent, { className: "p-3 flex items-start gap-2 text-sm text-sky-800 dark:text-sky-200" },
                React.createElement(Info, { className: "w-4 h-4 shrink-0 mt-0.5" }),
                React.createElement("div", { className: "space-y-1.5 min-w-0" },
                    React.createElement("p", null,
                        "Conecte placas ",
                        React.createElement("strong", null, "ESP32"),
                        " na sua rede Wi-Fi e cadastre o IP local de cada uma."),
                    React.createElement("p", null,
                        "O firmware do ESP32 deve expor: ",
                        React.createElement("code", { className: "bg-sky-100 dark:bg-sky-900/60 px-1 rounded" }, "GET /status"),
                        " (retorna ",
                        React.createElement("em", null, "moisture"),
                        ", ",
                        React.createElement("em", null, "battery"),
                        " e ",
                        React.createElement("em", null, "relay"),
                        ") e ",
                        React.createElement("code", { className: "bg-sky-100 dark:bg-sky-900/60 px-1 rounded" }, "POST /relay"),
                        " (liga/desliga o rel\u00E9)."),
                    React.createElement("p", null, "Use o app nativo ou acesse pela rede local em HTTP \u2014 navegadores bloqueiam requisi\u00E7\u00F5es HTTP a partir de p\u00E1ginas HTTPS.")))),
        React.createElement("div", { className: "flex items-center justify-between gap-3 flex-wrap" },
            React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement(Wifi, { className: "w-5 h-5 text-sky-600" }),
                React.createElement("span", { className: "font-medium" }, "Dispositivos do Solo"),
                React.createElement("span", { className: "text-sm text-muted-foreground" },
                    "(",
                    devices.length,
                    ")")),
            React.createElement(Button, { size: "sm", onClick: () => setAddOpen(true) },
                React.createElement(Plus, { className: "w-4 h-4 mr-1" }),
                " Conectar dispositivos")),
        devices.length === 0 ? (React.createElement(Card, null,
            React.createElement(CardContent, { className: "p-8 text-center text-muted-foreground" },
                React.createElement(Wifi, { className: "w-10 h-10 mx-auto mb-3 opacity-40" }),
                "Nenhum dispositivo registrado. Adicione sensores de umidade, regadores e drenadores para conectar via Wi-Fi."))) : (React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" }, devices.map((d) => React.createElement(DeviceCard, { key: d.id, device: d, field: fieldOf(d), onReading: onReading, onToggle: onToggle, onDelete: onDelete })))),
        React.createElement(DeviceDialog, { open: addOpen, onClose: () => setAddOpen(false), onSave: onAdd, fields: fields })));
}
/* ================= Financeiro ================= */
const FIN_CATS = [
    { key: 'equipamento', label: 'Equipamento' },
    { key: 'mao_de_obra', label: 'Mão de obra' },
    { key: 'fruto', label: 'Fruto' },
    { key: 'outros', label: 'Outros' },
];
const catKey = (c) => {
    const n = normalize(c);
    if (!n)
        return 'outros';
    if (n.includes('equip'))
        return 'equipamento';
    if (n.includes('mao') && n.includes('obra'))
        return 'mao_de_obra';
    if (n.includes('fruto'))
        return 'fruto';
    return 'outros';
};
// Registros antigos com categoria livre (ex.: "Vendas") continuam aparecendo com o texto original.
const catLabel = (c) => {
    const k = catKey(c);
    if (k === 'outros' && c && normalize(c) !== 'outros')
        return c;
    return FIN_CATS.find((x) => x.key === k).label;
};
function Chip({ active, onClick, children }) {
    return (React.createElement("button", { type: "button", "aria-pressed": active, onClick: onClick, className: cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent') }, children));
}
function FinancePanel({ transactions, crops, onAdd, onDelete }) {
    const blank = () => ({ description: '', type: 'despesa', category: 'equipamento', amount: '', date: todayISO(), crop_id: '' });
    const [form, setForm] = useState(blank);
    const [fType, setFType] = useState('todos');
    const [fCat, setFCat] = useState('todas');
    const [fText, setFText] = useState('');
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const submit = (e) => {
        e.preventDefault();
        if (!form.description || !form.amount)
            return;
        onAdd({ ...form, amount: Number(form.amount), crop_id: form.crop_id || undefined });
        setForm((f) => ({ ...blank(), type: f.type, category: f.category }));
    };
    const sum = (list, t) => list.filter((x) => x.type === t).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const receitas = sum(transactions, 'receita'), despesas = sum(transactions, 'despesa'), saldo = receitas - despesas;
    const cropName = (id) => { var _a; return (_a = crops.find((c) => c.id === id)) === null || _a === void 0 ? void 0 : _a.name; };
    const q = normalize(fText);
    const shown = transactions.filter((t) => (fType === 'todos' || t.type === fType) &&
        (fCat === 'todas' || catKey(t.category) === fCat) &&
        (!q || normalize(t.description).includes(q)));
    const shownSaldo = sum(shown, 'receita') - sum(shown, 'despesa');
    const filtering = fType !== 'todos' || fCat !== 'todas' || q;
    const clearFilters = () => { setFType('todos'); setFCat('todas'); setFText(''); };
    const isGasto = form.type === 'despesa';
    return (React.createElement("div", { className: "grid gap-6 lg:grid-cols-3" },
        React.createElement("div", { className: "space-y-4 lg:col-span-1 min-w-0" },
            React.createElement("div", { className: "grid grid-cols-3 gap-3" },
                React.createElement(Card, null,
                    React.createElement(CardContent, { className: "p-3 min-w-0" },
                        React.createElement(TrendingUp, { className: "w-4 h-4 text-emerald-600 mb-1" }),
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Receitas"),
                        React.createElement("p", { className: "font-semibold text-emerald-600 text-sm tabular-nums break-words" }, brl(receitas)))),
                React.createElement(Card, null,
                    React.createElement(CardContent, { className: "p-3 min-w-0" },
                        React.createElement(TrendingDown, { className: "w-4 h-4 text-destructive mb-1" }),
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Despesas"),
                        React.createElement("p", { className: "font-semibold text-destructive text-sm tabular-nums break-words" }, brl(despesas)))),
                React.createElement(Card, null,
                    React.createElement(CardContent, { className: "p-3 min-w-0" },
                        React.createElement(Wallet, { className: "w-4 h-4 text-primary mb-1" }),
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Saldo"),
                        React.createElement("p", { className: `font-semibold text-sm tabular-nums break-words ${saldo >= 0 ? 'text-emerald-600' : 'text-destructive'}` }, brl(saldo))))),
            React.createElement(Card, null,
                React.createElement(CardContent, { className: "p-4" },
                    React.createElement("h3", { className: "font-semibold font-heading mb-3" }, "Registrar movimenta\u00E7\u00E3o"),
                    React.createElement("form", { onSubmit: submit, className: "space-y-4" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium mb-1.5" }, "O que voc\u00EA vai fazer?"),
                            React.createElement("div", { role: "radiogroup", "aria-label": "Gastar ou lucrar", className: "grid grid-cols-2 gap-2" },
                                React.createElement("button", { type: "button", role: "radio", "aria-checked": isGasto, onClick: () => set('type', 'despesa'), className: cn('rounded-lg border px-3 py-2.5 text-left transition-colors', isGasto ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-background hover:bg-accent') },
                                    React.createElement("span", { className: "flex items-center gap-1.5 text-sm font-semibold" },
                                        React.createElement(TrendingDown, { className: "w-4 h-4" }),
                                        " Gastar"),
                                    React.createElement("span", { className: "block text-xs opacity-90" }, "Despesa: dinheiro que sai")),
                                React.createElement("button", { type: "button", role: "radio", "aria-checked": !isGasto, onClick: () => set('type', 'receita'), className: cn('rounded-lg border px-3 py-2.5 text-left transition-colors', !isGasto ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background hover:bg-accent') },
                                    React.createElement("span", { className: "flex items-center gap-1.5 text-sm font-semibold" },
                                        React.createElement(TrendingUp, { className: "w-4 h-4" }),
                                        " Lucrar"),
                                    React.createElement("span", { className: "block text-xs opacity-90" }, "Receita: dinheiro que entra")))),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium mb-1.5" }, isGasto ? 'Gasto com' : 'Lucro com'),
                            React.createElement("div", { role: "radiogroup", "aria-label": "Categoria", className: "flex flex-wrap gap-2" }, FIN_CATS.map((c) => React.createElement(Chip, { key: c.key, active: form.category === c.key, onClick: () => set('category', c.key) }, c.label)))),
                        React.createElement("div", null,
                            React.createElement(Label, { htmlFor: "fn-desc" }, "Descri\u00E7\u00E3o"),
                            React.createElement(Input, { id: "fn-desc", value: form.description, onChange: (e) => set('description', e.target.value), placeholder: isGasto ? 'Ex: Compra de enxada' : 'Ex: Venda de tomate', required: true })),
                        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fn-amount" }, "Valor (R$)"),
                                React.createElement(Input, { id: "fn-amount", type: "number", step: "0.01", min: "0", value: form.amount, onChange: (e) => set('amount', e.target.value), required: true })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fn-date" }, "Data"),
                                React.createElement(Input, { id: "fn-date", type: "date", value: form.date, onChange: (e) => set('date', e.target.value), required: true }))),
                        React.createElement("div", null,
                            React.createElement(Label, { htmlFor: "fn-crop" }, "Cultura (opcional)"),
                            React.createElement(Select, { id: "fn-crop", value: form.crop_id, onValueChange: (v) => set('crop_id', v), placeholder: "Nenhuma", options: crops.map((c) => ({ value: c.id, label: c.name })) })),
                        React.createElement(Button, { type: "submit", className: "w-full" }, isGasto ? 'Registrar gasto' : 'Registrar lucro'))))),
        React.createElement(Card, { className: "lg:col-span-2 min-w-0" },
            React.createElement(CardContent, { className: "p-4 space-y-4" },
                React.createElement("h3", { className: "font-semibold font-heading" }, "Extrato"),
                React.createElement("div", { className: "space-y-3" },
                    React.createElement("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": "Filtrar por tipo" },
                        React.createElement(Chip, { active: fType === 'todos', onClick: () => setFType('todos') }, "Tudo"),
                        React.createElement(Chip, { active: fType === 'receita', onClick: () => setFType('receita') }, "Lucros"),
                        React.createElement(Chip, { active: fType === 'despesa', onClick: () => setFType('despesa') }, "Gastos")),
                    React.createElement("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": "Filtrar por categoria" },
                        React.createElement(Chip, { active: fCat === 'todas', onClick: () => setFCat('todas') }, "Todas as categorias"),
                        FIN_CATS.map((c) => React.createElement(Chip, { key: c.key, active: fCat === c.key, onClick: () => setFCat(c.key) }, c.label))),
                    React.createElement(Input, { id: "fn-q", value: fText, onChange: (e) => setFText(e.target.value), placeholder: "Buscar pela descri\u00E7\u00E3o", "aria-label": "Buscar pela descri\u00E7\u00E3o" })),
                filtering && (React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap rounded-lg bg-muted px-3 py-2 text-sm" },
                    React.createElement("span", null,
                        shown.length,
                        " movimenta\u00E7\u00E3o(\u00F5es) \u00B7 saldo do filtro: ",
                        React.createElement("strong", { className: cn('tabular-nums', shownSaldo >= 0 ? 'text-emerald-600' : 'text-destructive') }, brl(shownSaldo))),
                    React.createElement("button", { type: "button", onClick: clearFilters, className: "font-semibold text-primary hover:underline" }, "Limpar filtros"))),
                transactions.length === 0 ? (React.createElement("p", { className: "text-sm text-muted-foreground py-6 text-center" }, "Nenhuma movimenta\u00E7\u00E3o registrada.")) : shown.length === 0 ? (React.createElement("p", { className: "text-sm text-muted-foreground py-6 text-center" }, "Nenhuma movimenta\u00E7\u00E3o com esses filtros.")) : (React.createElement("ul", { className: "divide-y" }, shown.map((t) => (React.createElement("li", { key: t.id, className: "flex items-center justify-between gap-3 py-2" },
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("p", { className: "text-sm font-medium truncate" }, t.description),
                        React.createElement("p", { className: "text-sm text-muted-foreground" },
                            fmtDate(t.date),
                            " \u00B7 ",
                            catLabel(t.category),
                            " ",
                            cropName(t.crop_id) ? `· ${cropName(t.crop_id)}` : '')),
                    React.createElement("div", { className: "flex items-center gap-3 shrink-0" },
                        React.createElement("span", { className: `font-semibold tabular-nums ${t.type === 'receita' ? 'text-emerald-600' : 'text-destructive'}` },
                            t.type === 'receita' ? '+' : '-',
                            " ",
                            brl(t.amount)),
                        React.createElement("button", { onClick: () => onDelete(t.id), "aria-label": "Remover movimenta\u00E7\u00E3o", className: "p-2 -mr-2 text-muted-foreground hover:text-destructive" },
                            React.createElement(Trash2, { className: "w-5 h-5" }))))))))))));
}
/* ================= Visão geral ================= */
function OverviewPanel({ fields, crops, transactions, onAddField, onAddCrop }) {
    const sum = (k, arr) => arr.reduce((s, x) => s + (Number(x[k]) || 0), 0);
    const totalArea = sum('area_hectares', fields);
    const totalWater = sum('water_available_liters', fields);
    const alerts = crops.filter((c) => humidityStatus(c) !== 'ideal').length;
    const receitas = sum('amount', transactions.filter((t) => t.type === 'receita'));
    const despesas = sum('amount', transactions.filter((t) => t.type === 'despesa'));
    const saldo = receitas - despesas;
    const stats = [
        { label: 'Área total', value: `${totalArea.toFixed(1)} ha`, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Água disponível', value: `${(totalWater / 1000).toFixed(1)}k L`, icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Culturas ativas', value: crops.length, icon: Sprout, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Alertas de umidade', value: alerts, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Saldo financeiro', value: brl(saldo), icon: Wallet, color: saldo >= 0 ? 'text-emerald-600' : 'text-destructive', bg: saldo >= 0 ? 'bg-emerald-100' : 'bg-red-100' },
    ];
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "grid gap-3 grid-cols-2 lg:grid-cols-5" }, stats.map((s) => {
            const SI = s.icon;
            return (React.createElement(Card, { key: s.label, className: "shadow-soft" },
                React.createElement(CardContent, { className: "p-4 min-w-0" },
                    React.createElement("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg}` },
                        React.createElement(SI, { className: `w-5 h-5 ${s.color}` })),
                    React.createElement("p", { className: "text-sm text-muted-foreground" }, s.label),
                    React.createElement("p", { className: "text-lg font-bold tabular-nums break-words" }, s.value))));
        })),
        React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" },
            React.createElement("h2", { className: "text-lg font-semibold font-heading" }, "Talh\u00F5es e culturas"),
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(Button, { size: "lg", variant: "outline", onClick: onAddCrop },
                    React.createElement(Plus, { className: "w-5 h-5 mr-2" }),
                    " Cultura"),
                React.createElement(Button, { size: "lg", onClick: onAddField },
                    React.createElement(Plus, { className: "w-5 h-5 mr-2" }),
                    " Talh\u00E3o"))),
        fields.length === 0 ? (React.createElement(Card, null,
            React.createElement(CardContent, { className: "p-8 text-center text-muted-foreground" },
                React.createElement(MapPin, { className: "w-10 h-10 mx-auto mb-3 opacity-40" }),
                "Nenhum talh\u00E3o cadastrado. Comece registrando a sua primeira \u00E1rea."))) : (React.createElement("div", { className: "grid gap-4 md:grid-cols-2" }, fields.map((f) => {
            const fc = crops.filter((c) => c.field_id === f.id);
            return (React.createElement(Card, { key: f.id, className: "shadow-soft" },
                React.createElement(CardContent, { className: "p-4 space-y-2" },
                    React.createElement("div", { className: "flex items-center justify-between gap-2" },
                        React.createElement("h3", { className: "font-semibold" }, f.name),
                        React.createElement("span", { className: "text-sm text-muted-foreground" }, f.region)),
                    React.createElement("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" },
                        React.createElement("span", null,
                            f.area_hectares,
                            " ha"),
                        React.createElement("span", null,
                            "Solo: ",
                            SOIL_LABELS[f.soil_type]),
                        React.createElement("span", null,
                            "\u00C1gua: ",
                            (Number(f.water_available_liters) / 1000).toFixed(1),
                            "k L"),
                        React.createElement("span", null,
                            "Irriga\u00E7\u00E3o: ",
                            f.irrigation_mode === 'automatico' ? 'Automática' : 'Manual')),
                    React.createElement("div", { className: "flex flex-wrap gap-2 pt-1" },
                        fc.length === 0 && React.createElement("span", { className: "text-sm text-muted-foreground" }, "Sem culturas neste talh\u00E3o."),
                        fc.map((c) => (React.createElement("span", { key: c.id, className: `text-sm px-2 py-0.5 rounded-full ${humidityStatus(c) === 'ideal' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}` },
                            c.name,
                            " \u00B7 ",
                            c.humidity,
                            "%")))))));
        })))));
}
/* ================= Recomendações ================= */
const ACTION_META = {
    plantar: { label: 'Plantar', icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    cultivar: { label: 'Cultivar / Capinar', icon: Scissors, color: 'text-amber-600', bg: 'bg-amber-100' },
    regar: { label: 'Regar', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-100' },
    drenar: { label: 'Drenar água', icon: Waves, color: 'text-indigo-600', bg: 'bg-indigo-100' },
};
function RecommendationsPanel({ farmProfile, crops }) {
    var _a;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sample, setSample] = useState(false);
    const fetchRecs = useCallback(async () => {
        setLoading(true);
        setError('');
        setSample(false);
        try {
            setData(await getRecommendations({ farmProfile, crops }));
        }
        catch (e) {
            setError((e === null || e === void 0 ? void 0 : e.message) === 'Cidade não encontrada'
                ? 'Não encontrei a cidade do seu cadastro para buscar a previsão.'
                : 'Não consegui buscar a previsão agora. Verifique a internet e tente novamente.');
        }
        finally {
            setLoading(false);
        }
    }, [farmProfile, crops]);
    const showSample = () => { setError(''); setSample(true); setData(sampleRecommendations(farmProfile, crops)); };
    const { good, bad } = analyzeCompanions(crops.map((c) => c.name));
    const suggestions = suggestCompanions(crops.map((c) => c.name));
    return (React.createElement("div", { className: "space-y-5" },
        React.createElement(Card, { className: "bg-gradient-to-r from-emerald-600 to-green-500 text-white border-0 shadow-soft" },
            React.createElement(CardContent, { className: "p-5 flex flex-wrap items-center justify-between gap-3" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("div", { className: "w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center ring-1 ring-white/30" },
                        React.createElement(Sparkles, { className: "w-6 h-6" })),
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-lg font-bold font-heading" }, "Recomenda\u00E7\u00F5es inteligentes"),
                        React.createElement("p", { className: "text-sm text-emerald-50/90" }, "O melhor dia para plantar, cultivar, regar e drenar"))),
                React.createElement(Button, { variant: "secondary", onClick: fetchRecs, disabled: loading },
                    loading ? React.createElement(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : React.createElement(RefreshCw, { className: "w-4 h-4 mr-2" }),
                    data && !sample ? 'Atualizar' : 'Gerar recomendações'))),
        crops.length > 0 && (good.length > 0 || bad.length > 0 || suggestions.length > 0) && (React.createElement(Card, { className: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 shadow-soft" },
            React.createElement(CardContent, { className: "p-5 space-y-4" },
                React.createElement("div", { className: "flex items-center gap-2 text-emerald-700 dark:text-emerald-400" },
                    React.createElement(Leaf, { className: "w-5 h-5" }),
                    React.createElement("h3", { className: "font-semibold font-heading" }, "Cons\u00F3rcios \u2014 o que d\u00E1 certo plantar junto")),
                good.length > 0 && (React.createElement("div", { className: "space-y-1.5" },
                    React.createElement("p", { className: "text-sm font-medium text-emerald-800 dark:text-emerald-200" }, "\u2713 Combina\u00E7\u00F5es favor\u00E1veis nas suas culturas"),
                    React.createElement("div", { className: "flex flex-wrap gap-2" }, good.map(([a, b], i) => React.createElement("span", { key: i, className: "inline-flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-full px-3 py-1" },
                        CROP_LABELS[a],
                        " + ",
                        CROP_LABELS[b]))))),
                suggestions.length > 0 && (React.createElement("div", { className: "space-y-1.5" },
                    React.createElement("p", { className: "text-sm font-medium text-emerald-800 dark:text-emerald-200" }, "Considere plantar junto ao que voc\u00EA j\u00E1 tem"),
                    React.createElement("div", { className: "flex flex-wrap gap-2" }, suggestions.map((s) => React.createElement("span", { key: s, className: "inline-flex items-center gap-1 text-sm bg-white dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1" }, CROP_LABELS[s]))))),
                bad.length > 0 && (React.createElement("div", { className: "space-y-1.5" },
                    React.createElement("p", { className: "text-sm font-medium text-amber-800 dark:text-amber-200" }, "\u26A0 Evite plantar essas juntas"),
                    React.createElement("div", { className: "flex flex-wrap gap-2" }, bad.map(([a, b], i) => React.createElement("span", { key: i, className: "inline-flex items-center gap-1 text-sm bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full px-3 py-1" },
                        CROP_LABELS[a],
                        " + ",
                        CROP_LABELS[b])))))))),
        error && (React.createElement("div", { className: "text-center space-y-2" },
            React.createElement("p", { className: "text-sm text-destructive" }, error),
            React.createElement(Button, { size: "sm", variant: "outline", onClick: showSample }, "Ver previs\u00E3o de exemplo"))),
        loading && !data && React.createElement(Card, null,
            React.createElement(CardContent, { className: "p-10 text-center text-muted-foreground" },
                React.createElement(Loader2, { className: "w-8 h-8 mx-auto mb-3 animate-spin text-primary" }),
                "Analisando a previs\u00E3o do tempo e suas culturas...")),
        data && (React.createElement(React.Fragment, null,
            sample && React.createElement("p", { className: "text-sm text-center rounded-lg bg-amber-100 text-amber-800 px-3 py-2" }, "Previs\u00E3o de exemplo, n\u00E3o \u00E9 a previs\u00E3o real da sua cidade. Use \u201CGerar recomenda\u00E7\u00F5es\u201D com internet para ver a real."),
            data.weather_summary && (React.createElement(Card, { className: "shadow-soft" },
                React.createElement(CardContent, { className: "p-4 flex items-start gap-3" },
                    React.createElement(CalendarDays, { className: "w-5 h-5 text-primary mt-0.5 shrink-0" }),
                    React.createElement("p", { className: "text-sm text-muted-foreground" }, data.weather_summary)))),
            React.createElement("div", { className: "grid gap-4 md:grid-cols-2" }, (_a = data.recommendations) === null || _a === void 0 ? void 0 : _a.map((r, i) => {
                const meta = ACTION_META[r.action] || ACTION_META.regar;
                const MI = meta.icon;
                return (React.createElement(Card, { key: i, className: "shadow-soft" },
                    React.createElement(CardContent, { className: "p-5" },
                        React.createElement("div", { className: "flex items-center gap-3 mb-3" },
                            React.createElement("div", { className: `w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${meta.bg}` },
                                React.createElement(MI, { className: `w-6 h-6 ${meta.color}` })),
                            React.createElement("div", { className: "min-w-0" },
                                React.createElement("p", { className: "text-sm text-muted-foreground" }, meta.label),
                                React.createElement("p", { className: "font-bold text-base capitalize" }, r.best_day))),
                        React.createElement("p", { className: "text-sm mb-2" }, r.reason),
                        r.tips && React.createElement("p", { className: "text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5" },
                            "Dica: ",
                            r.tips))));
            })))),
        !loading && !data && !error && (React.createElement(Card, null,
            React.createElement(CardContent, { className: "p-10 text-center text-muted-foreground" },
                React.createElement(Sparkles, { className: "w-10 h-10 mx-auto mb-3 opacity-40" }),
                "Clique em \"Gerar recomenda\u00E7\u00F5es\" para receber o melhor dia de cada atividade, baseado na previs\u00E3o do tempo da sua regi\u00E3o.")))));
}
/* ================= Diálogos: talhão e cultura ================= */
const emptyField = { name: '', area_hectares: '', region: '', soil_type: 'franco', water_source: '', water_available_liters: '', irrigation_mode: 'automatico' };
function FieldDialog({ open, onClose, onSave }) {
    const [form, setForm] = useState(emptyField);
    useEffect(() => { if (open)
        setForm(emptyField); }, [open]);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const submit = (e) => {
        e.preventDefault();
        onSave({ ...form, area_hectares: Number(form.area_hectares), water_available_liters: Number(form.water_available_liters) });
        onClose();
    };
    return (React.createElement(Dialog, { open: open, onClose: onClose, title: "Novo talh\u00E3o", wide: true },
        React.createElement("form", { onSubmit: submit, className: "space-y-3" },
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "fd-name" }, "Nome do talh\u00E3o"),
                React.createElement(Input, { id: "fd-name", value: form.name, onChange: (e) => set('name', e.target.value), placeholder: "Ex: S\u00EDtio Norte", required: true })),
            React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                React.createElement("div", null,
                    React.createElement(Label, { htmlFor: "fd-area" }, "\u00C1rea (ha)"),
                    React.createElement(Input, { id: "fd-area", type: "number", step: "0.01", min: "0", value: form.area_hectares, onChange: (e) => set('area_hectares', e.target.value), required: true })),
                React.createElement("div", null,
                    React.createElement(Label, { htmlFor: "fd-region" }, "Regi\u00E3o"),
                    React.createElement(Input, { id: "fd-region", value: form.region, onChange: (e) => set('region', e.target.value), placeholder: "Ex: Cerrado", required: true }))),
            React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                React.createElement("div", null,
                    React.createElement(Label, { htmlFor: "fd-soil" }, "Tipo de solo"),
                    React.createElement(Select, { id: "fd-soil", value: form.soil_type, onValueChange: (v) => set('soil_type', v), options: Object.entries(SOIL_LABELS).map(([value, label]) => ({ value, label })) })),
                React.createElement("div", null,
                    React.createElement(Label, { htmlFor: "fd-irr" }, "Irriga\u00E7\u00E3o"),
                    React.createElement(Select, { id: "fd-irr", value: form.irrigation_mode, onValueChange: (v) => set('irrigation_mode', v), options: [{ value: 'automatico', label: 'Automática' }, { value: 'manual', label: 'Manual' }] }))),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "fd-src" }, "Fonte de \u00E1gua"),
                React.createElement(Input, { id: "fd-src", value: form.water_source, onChange: (e) => set('water_source', e.target.value), placeholder: "Ex: Po\u00E7o artesiano", required: true })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "fd-liters" }, "\u00C1gua dispon\u00EDvel (litros)"),
                React.createElement(Input, { id: "fd-liters", type: "number", min: "0", value: form.water_available_liters, onChange: (e) => set('water_available_liters', e.target.value), required: true })),
            React.createElement("p", { className: "text-sm text-muted-foreground" }, SOIL_WATER_NOTES[form.soil_type]),
            React.createElement("div", { className: "flex sm:justify-end" },
                React.createElement(Button, { type: "submit", className: "w-full sm:w-auto" }, "Salvar talh\u00E3o")))));
}
const emptyCrop = { field_id: '', name: '', variety: '', planted_area_hectares: '', min_humidity: '', max_humidity: '', humidity: '', planted_date: '', expected_harvest_date: '' };
function CropDialog({ open, onClose, onSave, fields }) {
    const [form, setForm] = useState(emptyCrop);
    useEffect(() => { var _a; if (open)
        setForm({ ...emptyCrop, field_id: ((_a = fields[0]) === null || _a === void 0 ? void 0 : _a.id) || '' }); }, [open, fields]);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const submit = (e) => {
        e.preventDefault();
        onSave({ ...form, status: 'ativa', planted_area_hectares: Number(form.planted_area_hectares), min_humidity: Number(form.min_humidity), max_humidity: Number(form.max_humidity), humidity: Number(form.humidity) });
        onClose();
    };
    return (React.createElement(Dialog, { open: open, onClose: onClose, title: "Nova cultura", wide: true }, fields.length === 0 ? (React.createElement("p", { className: "text-sm text-muted-foreground" }, "Cadastre um talh\u00E3o antes de adicionar culturas.")) : (React.createElement("form", { onSubmit: submit, className: "space-y-3" },
        React.createElement("div", null,
            React.createElement(Label, { htmlFor: "cr-field" }, "Talh\u00E3o"),
            React.createElement(Select, { id: "cr-field", value: form.field_id, onValueChange: (v) => set('field_id', v), options: fields.map((f) => ({ value: f.id, label: f.name })) })),
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-name" }, "Cultura"),
                React.createElement(Input, { id: "cr-name", value: form.name, onChange: (e) => set('name', e.target.value), placeholder: "Ex: Milho", required: true })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-var" }, "Variedade"),
                React.createElement(Input, { id: "cr-var", value: form.variety, onChange: (e) => set('variety', e.target.value), placeholder: "Ex: H\u00EDbrido X" }))),
        React.createElement("div", { className: "grid grid-cols-3 gap-3" },
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-area" }, "\u00C1rea (ha)"),
                React.createElement(Input, { id: "cr-area", type: "number", step: "0.01", min: "0", value: form.planted_area_hectares, onChange: (e) => set('planted_area_hectares', e.target.value), required: true })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-min" }, "Umid. m\u00EDn %"),
                React.createElement(Input, { id: "cr-min", type: "number", min: "0", max: "100", value: form.min_humidity, onChange: (e) => set('min_humidity', e.target.value), required: true })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-max" }, "Umid. m\u00E1x %"),
                React.createElement(Input, { id: "cr-max", type: "number", min: "0", max: "100", value: form.max_humidity, onChange: (e) => set('max_humidity', e.target.value), required: true }))),
        React.createElement("div", null,
            React.createElement(Label, { htmlFor: "cr-hum" }, "Umidade atual do solo (%)"),
            React.createElement(Input, { id: "cr-hum", type: "number", min: "0", max: "100", value: form.humidity, onChange: (e) => set('humidity', e.target.value), required: true })),
        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-pd" }, "Plantio"),
                React.createElement(Input, { id: "cr-pd", type: "date", value: form.planted_date, onChange: (e) => set('planted_date', e.target.value) })),
            React.createElement("div", null,
                React.createElement(Label, { htmlFor: "cr-hd" }, "Colheita prevista"),
                React.createElement(Input, { id: "cr-hd", type: "date", value: form.expected_harvest_date, onChange: (e) => set('expected_harvest_date', e.target.value) }))),
        React.createElement("div", { className: "flex sm:justify-end" },
            React.createElement(Button, { type: "submit", className: "w-full sm:w-auto" }, "Salvar cultura"))))));
}
/* ================= Cadastro da fazenda ================= */
function FarmOnboarding({ onComplete, onDemo }) {
    const [data, setData] = useState({ farmer_name: '', farm_name: '', city: '', state: '', climate: 'tropical', soil_type: 'franco', water_source: '', area_hectares: '', experience_years: '', main_crops: '', land_registration_document: '' });
    const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
    const submit = (e) => {
        e.preventDefault();
        onComplete({ ...data, area_hectares: Number(data.area_hectares) || 0, experience_years: data.experience_years ? Number(data.experience_years) : undefined });
    };
    const Section = ({ icon: SI, children }) => React.createElement("div", { className: "flex items-center gap-2 text-emerald-700 dark:text-emerald-400 pt-2" },
        React.createElement(SI, { className: "w-5 h-5" }),
        React.createElement("h2", { className: "font-semibold font-heading" }, children));
    return (React.createElement("div", { className: "min-h-screen bg-gradient-to-b from-emerald-50 via-background to-muted/30 dark:from-emerald-950/40 dark:via-background dark:to-muted/20 flex items-center justify-center py-6 gutter" },
        React.createElement("div", { className: "w-full max-w-2xl" },
            React.createElement("div", { className: "text-center mb-6" },
                React.createElement("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto mb-4 shadow-soft ring-1 ring-emerald-200 dark:ring-emerald-800" },
                    React.createElement(Leaf, { className: "w-8 h-8" })),
                React.createElement("h1", { className: "text-3xl font-extrabold tracking-tight font-heading" }, "Bem-vindo \u00E0 Policultiva"),
                React.createElement("p", { className: "text-muted-foreground mt-1" }, "Primeiro, conte um pouco sobre voc\u00EA e sua terra. Assim podemos dar os melhores conselhos."),
                React.createElement(Button, { variant: "outline", className: "mt-4", onClick: onDemo },
                    React.createElement(Sparkles, { className: "w-4 h-4 mr-2" }),
                    " Explorar com dados de exemplo")),
            React.createElement(Card, { className: "shadow-soft" },
                React.createElement(CardContent, { className: "p-6" },
                    React.createElement("form", { onSubmit: submit, className: "space-y-5" },
                        React.createElement(Section, { icon: User }, "Sobre voc\u00EA"),
                        React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-name" }, "Seu nome"),
                                React.createElement(Input, { id: "fo-name", required: true, value: data.farmer_name, onChange: (e) => set('farmer_name', e.target.value), placeholder: "Ex: Jo\u00E3o Silva" })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-farm" }, "Nome da fazenda/s\u00EDtio"),
                                React.createElement(Input, { id: "fo-farm", required: true, value: data.farm_name, onChange: (e) => set('farm_name', e.target.value), placeholder: "Ex: S\u00EDtio Boa Vista" })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-exp" }, "Anos de experi\u00EAncia"),
                                React.createElement(Input, { id: "fo-exp", type: "number", min: "0", value: data.experience_years, onChange: (e) => set('experience_years', e.target.value), placeholder: "Ex: 10" })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-crops" }, "O que costuma plantar"),
                                React.createElement(Input, { id: "fo-crops", value: data.main_crops, onChange: (e) => set('main_crops', e.target.value), placeholder: "Ex: milho, feij\u00E3o, mandioca" }))),
                        React.createElement(Section, { icon: MapPin }, "Onde fica sua terra"),
                        React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-city" }, "Cidade"),
                                React.createElement(Input, { id: "fo-city", required: true, value: data.city, onChange: (e) => set('city', e.target.value), placeholder: "Ex: Patroc\u00EDnio" })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-state" }, "Estado"),
                                React.createElement(Input, { id: "fo-state", required: true, value: data.state, onChange: (e) => set('state', e.target.value), placeholder: "Ex: Minas Gerais" })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-climate" }, "Clima da regi\u00E3o"),
                                React.createElement(Select, { id: "fo-climate", value: data.climate, onValueChange: (v) => set('climate', v), options: Object.entries(CLIMATE_LABELS).map(([value, label]) => ({ value, label })) })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-soil" }, "Tipo de solo"),
                                React.createElement(Select, { id: "fo-soil", value: data.soil_type, onValueChange: (v) => set('soil_type', v), options: Object.entries(SOIL_LABELS).map(([value, label]) => ({ value, label })) }))),
                        React.createElement("div", null,
                            React.createElement(Label, { htmlFor: "fo-doc" }, "Documento de registro da terra"),
                            React.createElement(Input, { id: "fo-doc", value: data.land_registration_document, onChange: (e) => set('land_registration_document', e.target.value), placeholder: "Ex: Matr\u00EDcula n\u00BA 1234 / CCIR" })),
                        React.createElement(Section, { icon: Sprout }, "Tamanho e \u00E1gua"),
                        React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-area" }, "\u00C1rea total (hectares)"),
                                React.createElement(Input, { id: "fo-area", type: "number", step: "0.1", min: "0", required: true, value: data.area_hectares, onChange: (e) => set('area_hectares', e.target.value), placeholder: "Ex: 5" })),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "fo-water" }, "De onde vem a \u00E1gua"),
                                React.createElement(Input, { id: "fo-water", value: data.water_source, onChange: (e) => set('water_source', e.target.value), placeholder: "Ex: Po\u00E7o, rio, represa" }))),
                        React.createElement(Button, { type: "submit", size: "lg", className: "w-full text-base" }, "Come\u00E7ar a usar")))))));
}
/* ================= Configurações ================= */
function SettingsPage({ farm, onBack, onClear }) {
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => { if (!done)
        return undefined; const t = setTimeout(onClear, 1200); return () => clearTimeout(t); }, [done, onClear]);
    const Row = ({ label, children, span }) => React.createElement("p", { className: span ? 'sm:col-span-2' : '' },
        React.createElement("span", { className: "text-muted-foreground" },
            label,
            ": "),
        children || '—');
    if (done) {
        return (React.createElement("div", { className: "min-h-screen flex items-center justify-center p-6 bg-muted/30" },
            React.createElement("div", { className: "text-center space-y-3 max-w-sm" },
                React.createElement(CheckCircle2, { className: "w-12 h-12 mx-auto text-emerald-600" }),
                React.createElement("h2", { className: "text-lg font-semibold font-heading" }, "Dados apagados"),
                React.createElement("p", { className: "text-sm text-muted-foreground" }, "Todos os dados foram apagados deste aparelho. Reiniciando\u2026"),
                React.createElement(Loader2, { className: "w-5 h-5 mx-auto animate-spin text-muted-foreground" }))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-gradient-to-b from-emerald-50/70 via-background to-muted/30 dark:from-emerald-950/40 dark:via-background dark:to-muted/20" },
        React.createElement("header", { className: "bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-soft sticky z-10", style: { top: 'env(safe-area-inset-top, 0px)' } },
            React.createElement("div", { className: "max-w-6xl mx-auto gutter py-4 flex items-center gap-3" },
                React.createElement("button", { onClick: onBack, "aria-label": "Voltar", className: "w-11 h-11 shrink-0 rounded-2xl bg-white/20 flex items-center justify-center ring-1 ring-white/30 hover:bg-white/30" },
                    React.createElement(ArrowLeft, { className: "w-5 h-5" })),
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("h1", { className: "text-xl font-extrabold leading-tight font-heading" }, "Configura\u00E7\u00F5es"),
                    React.createElement("p", { className: "text-sm text-emerald-50/90" }, "Dados da fazenda e privacidade")))),
        React.createElement("main", { className: "max-w-2xl mx-auto gutter py-6 space-y-6" },
            React.createElement(Card, { className: "shadow-soft" },
                React.createElement(CardContent, { className: "p-5 space-y-3" },
                    React.createElement("div", { className: "flex items-center gap-2 text-emerald-700 dark:text-emerald-400" },
                        React.createElement(Leaf, { className: "w-5 h-5" }),
                        React.createElement("h2", { className: "font-semibold font-heading" }, "Dados da fazenda")),
                    React.createElement("div", { className: "space-y-2 text-sm" },
                        React.createElement("p", { className: "text-base font-semibold" }, farm.farm_name || '—'),
                        React.createElement("div", { className: "grid sm:grid-cols-2 gap-x-4 gap-y-1.5" },
                            React.createElement(Row, { label: "Propriet\u00E1rio" }, farm.farmer_name),
                            React.createElement(Row, { label: "Documento da terra" }, farm.land_registration_document),
                            React.createElement(Row, { label: "Cidade" }, farm.city),
                            React.createElement(Row, { label: "Estado" }, farm.state),
                            React.createElement(Row, { label: "\u00C1rea" }, farm.area_hectares != null ? `${farm.area_hectares} ha` : ''),
                            React.createElement(Row, { label: "Experi\u00EAncia" }, farm.experience_years != null ? `${farm.experience_years} anos` : ''),
                            React.createElement(Row, { label: "Solo" }, SOIL_LABELS[farm.soil_type] || farm.soil_type),
                            React.createElement(Row, { label: "Clima" }, CLIMATE_LABELS[farm.climate] || farm.climate),
                            React.createElement(Row, { label: "Fonte de \u00E1gua" }, farm.water_source),
                            React.createElement(Row, { label: "Culturas", span: true }, farm.main_crops))))),
            React.createElement(Card, { className: "border-destructive/30 shadow-soft" },
                React.createElement(CardContent, { className: "p-5 space-y-4" },
                    React.createElement("div", { className: "flex items-center gap-2 text-destructive" },
                        React.createElement(AlertTriangle, { className: "w-5 h-5" }),
                        React.createElement("h2", { className: "font-semibold font-heading" }, "Apagar dados")),
                    React.createElement("p", { className: "text-sm text-muted-foreground" }, "Esta a\u00E7\u00E3o apaga permanentemente todos os dados do Policultiva neste aparelho \u2014 talh\u00F5es, culturas, dispositivos, movimenta\u00E7\u00F5es financeiras e perfil da fazenda. N\u00E3o \u00E9 poss\u00EDvel desfazer."),
                    React.createElement(Button, { variant: "destructive", onClick: () => { setConfirmText(''); setOpen(true); } },
                        React.createElement(Trash2, { className: "w-4 h-4 mr-2" }),
                        " Apagar meus dados")))),
        React.createElement(Dialog, { open: open, onClose: () => setOpen(false), title: "Confirmar exclus\u00E3o dos dados", description: "Todos os talh\u00F5es, culturas, dispositivos, transa\u00E7\u00F5es e o perfil da fazenda ser\u00E3o apagados permanentemente. Digite APAGAR para confirmar." },
            React.createElement("div", { className: "space-y-4" },
                React.createElement("div", null,
                    React.createElement(Label, { htmlFor: "st-confirm" }, "Confirma\u00E7\u00E3o"),
                    React.createElement(Input, { id: "st-confirm", value: confirmText, onChange: (e) => setConfirmText(e.target.value), placeholder: "APAGAR", autoFocus: true })),
                React.createElement("div", { className: "flex flex-col-reverse sm:flex-row sm:justify-end gap-2" },
                    React.createElement(Button, { variant: "outline", onClick: () => setOpen(false) }, "Cancelar"),
                    React.createElement(Button, { variant: "destructive", disabled: confirmText !== 'APAGAR', onClick: () => { setOpen(false); setDone(true); } }, "Apagar tudo"))))));
}
/* ================= Dados de exemplo ================= */
function demoData() {
    const f1 = { id: uid(), name: 'Talhão Norte', area_hectares: 2.5, region: 'Cerrado Mineiro', soil_type: 'franco', water_source: 'Poço artesiano', water_available_liters: 20000, irrigation_mode: 'automatico' };
    const f2 = { id: uid(), name: 'Talhão Sul', area_hectares: 1.8, region: 'Várzea', soil_type: 'argiloso', water_source: 'Represa', water_available_liters: 12000, irrigation_mode: 'manual' };
    const crop = (field, name, variety, area, min, max, hum, pd, hd) => ({ id: uid(), field_id: field.id, name, variety, planted_area_hectares: area, min_humidity: min, max_humidity: max, humidity: hum, planted_date: offsetISO(pd), expected_harvest_date: offsetISO(hd), status: 'ativa' });
    const crops = [
        crop(f1, 'Milho', 'Híbrido (exemplo)', 1.5, 60, 80, 48, -40, 80),
        crop(f1, 'Feijão', 'Carioca (exemplo)', 0.6, 60, 80, 70, -25, 55),
        crop(f1, 'Abóbora', 'Moranga (exemplo)', 0.4, 60, 80, 72, -30, 70),
        crop(f2, 'Tomate', 'Italiano (exemplo)', 0.8, 60, 75, 88, -20, 60),
        crop(f2, 'Manjericão', '', 0.2, 55, 75, 65, -15, 40),
    ];
    const tx = (description, type, category, amount, d) => ({ id: uid(), description, type, category, amount, date: offsetISO(d) });
    return {
        profile: { id: uid(), demo: true, farmer_name: 'João Silva (exemplo)', farm_name: 'Sítio Boa Vista', city: 'Patrocínio', state: 'Minas Gerais', climate: 'tropical', soil_type: 'franco', water_source: 'Poço artesiano', area_hectares: 4.3, experience_years: 10, main_crops: 'milho, feijão, tomate', land_registration_document: '' },
        fields: [f1, f2], crops,
        transactions: [
            tx('Venda de feijão', 'receita', 'fruto', 960, -3),
            tx('Venda de tomate', 'receita', 'fruto', 1850, -6),
            tx('Compra de bomba d\'água', 'despesa', 'equipamento', 1350, -30),
            tx('Diária da colheita', 'despesa', 'mao_de_obra', 540, -5),
            tx('Sementes de milho', 'despesa', 'outros', 420, -42),
            tx('Adubo orgânico', 'despesa', 'outros', 680, -18),
        ],
        devices: [
            { id: uid(), name: 'Sensor Talhão Norte', type: 'sensor', ip_address: '192.168.1.50', field_id: f1.id, moisture: 48, battery: 82, connected: false, is_on: false },
            { id: uid(), name: 'Regador Talhão Sul', type: 'irrigator', ip_address: '192.168.1.51', field_id: f2.id, battery: 100, connected: false, is_on: false },
        ],
    };
}
/* ================= Aplicativo ================= */
const TABS = [
    { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'recommendations', label: 'Recomendações', icon: Sparkles },
    { id: 'irrigation', label: 'Irrigação', icon: Droplets },
    { id: 'devices', label: 'Dispositivos', icon: Wifi },
    { id: 'finance', label: 'Financeiro', icon: Wallet },
    { id: 'crops', label: 'Culturas', icon: Sprout },
];
const routeFromHash = () => {
    try {
        const h = window.location.hash.replace('#', '');
        return [...TABS.map((t) => t.id), 'settings'].includes(h) ? h : 'overview';
    }
    catch (e) {
        return 'overview';
    }
};
function App() {
    const [data, setData] = useState(loadData);
    const [route, setRoute] = useState(routeFromHash);
    const [fieldOpen, setFieldOpen] = useState(false);
    const [cropOpen, setCropOpen] = useState(false);
    useEffect(() => { saveData(data); }, [data]);
    const go = (r) => { setRoute(r); try {
        window.location.hash = r === 'overview' ? '' : r;
    }
    catch (e) { /* ignora */ } window.scrollTo(0, 0); };
    const add = (k, row) => setData((d) => ({ ...d, [k]: [...d[k], { ...row, id: uid(), created_date: new Date().toISOString() }] }));
    const patch = (k, id, p) => setData((d) => ({ ...d, [k]: d[k].map((r) => (r.id === id ? { ...r, ...p } : r)) }));
    const remove = (k, id) => setData((d) => ({ ...d, [k]: d[k].filter((r) => r.id !== id) }));
    const clearAll = useCallback(() => { setData({ ...EMPTY }); setRoute('overview'); }, []);
    if (!data.profile) {
        return React.createElement(FarmOnboarding, { onComplete: (p) => setData((d) => ({ ...d, profile: { ...p, id: uid() } })), onDemo: () => setData(demoData()) });
    }
    const p = data.profile;
    if (route === 'settings')
        return React.createElement(SettingsPage, { farm: p, onBack: () => go('overview'), onClear: clearAll });
    let view;
    if (route === 'recommendations')
        view = React.createElement(RecommendationsPanel, { farmProfile: p, crops: data.crops });
    else if (route === 'irrigation')
        view = React.createElement(IrrigationPanel, { crops: data.crops, fields: data.fields, onResolve: (c) => patch('crops', c.id, { humidity: targetHumidity(c) }), onUpdateHumidity: (c, h) => patch('crops', c.id, { humidity: h }), onDelete: (c) => remove('crops', c.id), onAddCrop: () => setCropOpen(true) });
    else if (route === 'devices')
        view = React.createElement(WiFiPanel, { devices: data.devices, fields: data.fields, onAdd: (d) => add('devices', d), onReading: (d, u) => patch('devices', d.id, { ...u, last_reading_date: new Date().toISOString() }), onToggle: (d, on) => patch('devices', d.id, { is_on: on }), onDelete: (d) => remove('devices', d.id) });
    else if (route === 'finance')
        view = React.createElement(FinancePanel, { transactions: [...data.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date))), crops: data.crops, onAdd: (t) => add('transactions', t), onDelete: (id) => remove('transactions', id) });
    else if (route === 'crops')
        view = React.createElement(CropsPanel, { crops: data.crops, fields: data.fields, onAddCrop: () => setCropOpen(true), onDelete: (c) => remove('crops', c.id) });
    else
        view = React.createElement(OverviewPanel, { fields: data.fields, crops: data.crops, transactions: data.transactions, onAddField: () => setFieldOpen(true), onAddCrop: () => setCropOpen(true) });
    return (React.createElement("div", { className: "min-h-screen bg-muted/30" },
        React.createElement("header", { className: "bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-soft" },
            React.createElement("div", { className: "max-w-6xl mx-auto gutter py-4 flex items-center gap-3" },
                React.createElement("div", { className: "w-10 h-10 shrink-0 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center" },
                    React.createElement(Leaf, { className: "w-6 h-6" })),
                React.createElement("div", { className: "min-w-0 flex-1" },
                    React.createElement("h1", { className: "text-lg font-extrabold leading-tight truncate font-heading" }, p.farm_name),
                    React.createElement("p", { className: "text-sm text-emerald-50/90 truncate" },
                        p.farmer_name,
                        " \u00B7 ",
                        p.city,
                        " - ",
                        p.state)),
                p.demo && React.createElement("span", { className: "hidden sm:inline-flex text-xs font-semibold bg-white/20 rounded-full px-2.5 py-1 ring-1 ring-white/30" }, "Dados de exemplo"),
                React.createElement("button", { onClick: () => go('settings'), "aria-label": "Configura\u00E7\u00F5es", className: "w-11 h-11 shrink-0 rounded-2xl bg-white/20 flex items-center justify-center ring-1 ring-white/30 hover:bg-white/30" },
                    React.createElement(Settings, { className: "w-5 h-5" }))),
            React.createElement("nav", { className: "max-w-6xl mx-auto px-2 flex gap-1 scroll-x", "aria-label": "Se\u00E7\u00F5es" }, TABS.map((t) => {
                const TI = t.icon;
                const active = route === t.id;
                return (React.createElement("button", { key: t.id, onClick: () => go(t.id), "aria-current": active ? 'page' : undefined, className: `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${active ? 'bg-background text-foreground' : 'text-emerald-50 hover:bg-white/10'}` },
                    React.createElement(TI, { className: "w-4 h-4" }),
                    " ",
                    t.label));
            }))),
        React.createElement("main", { className: "max-w-6xl mx-auto gutter py-4 pb-12" },
            p.demo && React.createElement("p", { className: "sm:hidden text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3" }, "Dados de exemplo \u2014 apague em Configura\u00E7\u00F5es."),
            view),
        React.createElement(FieldDialog, { open: fieldOpen, onClose: () => setFieldOpen(false), onSave: (f) => add('fields', f) }),
        React.createElement(CropDialog, { open: cropOpen, onClose: () => setCropOpen(false), onSave: (c) => add('crops', c), fields: data.fields })));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));
