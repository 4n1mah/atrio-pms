'use strict';
/* =========================================================
   Atrio PMS — núcleo: utilidades, configuración, datos y reglas
   ========================================================= */
const LS_KEY = 'atrio-pms-state-v1';
const LS_PROG = 'atrio-pms-progress-v1';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function addDays(d, n) { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }
const MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
function fd(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}-${MES[+m - 1]}-${y.slice(2)}`; }
function dow(d) { return DOW[new Date(d + 'T12:00:00Z').getUTCDay()]; }
function r2(n) { return Math.round((+n + Number.EPSILON) * 100) / 100; }
function money(n) { n = r2(n || 0); return (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function clock() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
class UserError extends Error {}
function fail(msg) { throw new UserError(msg); }

/* ---------- Configuración de la propiedad ---------- */
const CFG = {
  property: { code: 'BRISA', name: 'Hotel Brisa Colonial', city: 'Santo Domingo, R.D.', currency: 'USD' },
  tax: { itbis: 0.18, svc: 0.10 },
  roomTypes: [
    { code: 'STD', name: 'Estándar Queen', max: 2, beds: '1 Queen', sqm: 24 },
    { code: 'DLX', name: 'Deluxe King Vista Mar', max: 3, beds: '1 King', sqm: 32 },
    { code: 'JRS', name: 'Junior Suite', max: 4, beds: '1 King + sofá cama', sqm: 45 },
    { code: 'STE', name: 'Suite Colonial', max: 4, beds: '1 King + sala', sqm: 70 },
  ],
  rates: [
    { code: 'BAR', name: 'Best Available Rate', desc: 'Tarifa pública flexible.', p: { STD: 129, DLX: 169, JRS: 229, STE: 319 }, pkg: 0, market: 'LEIS', cancel: 'Sin cargo hasta 24 h antes de la llegada' },
    { code: 'BARBB', name: 'BAR + Desayuno', desc: 'Incluye paquete BKFT (desayuno buffet, $35 por noche).', p: { STD: 164, DLX: 204, JRS: 264, STE: 354 }, pkg: 35, market: 'LEIS', cancel: 'Sin cargo hasta 24 h antes' },
    { code: 'ADV14', name: 'Compra anticipada', desc: 'Prepago no reembolsable. Se vende con 14 días o más de antelación.', p: { STD: 109, DLX: 144, JRS: 195, STE: 271 }, pkg: 0, market: 'LEIS', cancel: 'No reembolsable', minLead: 14 },
    { code: 'CORP', name: 'Corporativa negociada', desc: 'Solo con perfil de empresa con contrato.', p: { STD: 115, DLX: 149, JRS: 205, STE: 289 }, pkg: 0, market: 'CORP', cancel: 'Sin cargo hasta las 18:00 del día de llegada', needsCompany: true },
    { code: 'RACK', name: 'Tarifa Rack', desc: 'Tarifa máxima publicada.', p: { STD: 159, DLX: 199, JRS: 269, STE: 379 }, pkg: 0, market: 'LEIS', cancel: 'Sin cargo hasta 24 h antes' },
    { code: 'COMP', name: 'Cortesía', desc: 'Sin cargo. Requiere aprobación de gerencia (restringida).', p: { STD: 0, DLX: 0, JRS: 0, STE: 0 }, pkg: 0, market: 'COMP', cancel: '—', restricted: true },
  ],
};
const TRX = [
  { code: '1000', name: 'Habitación', grp: 'Habitaciones', kind: 'rev' },
  { code: '1010', name: 'ITBIS 18%', grp: 'Impuestos', kind: 'tax' },
  { code: '1020', name: 'Cargo por servicio 10%', grp: 'Impuestos', kind: 'tax' },
  { code: '1099', name: 'Ajuste de habitación', grp: 'Ajustes', kind: 'adj' },
  { code: '2000', name: 'Restaurante La Muralla', grp: 'Alimentos y bebidas', kind: 'rev' },
  { code: '2010', name: 'Bar Atarazana', grp: 'Alimentos y bebidas', kind: 'rev' },
  { code: '2020', name: 'Room Service', grp: 'Alimentos y bebidas', kind: 'rev' },
  { code: '2030', name: 'Desayuno (paquete)', grp: 'Alimentos y bebidas', kind: 'rev' },
  { code: '2099', name: 'Ajuste A&B', grp: 'Ajustes', kind: 'adj' },
  { code: '3000', name: 'Minibar', grp: 'Otros ingresos', kind: 'rev' },
  { code: '4000', name: 'Lavandería', grp: 'Otros ingresos', kind: 'rev' },
  { code: '5000', name: 'Spa', grp: 'Otros ingresos', kind: 'rev' },
  { code: '6000', name: 'Traslado aeropuerto', grp: 'Otros ingresos', kind: 'rev' },
  { code: '6100', name: 'Misceláneos', grp: 'Otros ingresos', kind: 'rev' },
  { code: '7000', name: 'Cargo No-Show', grp: 'Habitaciones', kind: 'rev' },
  { code: '9000', name: 'Efectivo', grp: 'Pagos', kind: 'pay' },
  { code: '9004', name: 'Visa', grp: 'Pagos', kind: 'pay' },
  { code: '9005', name: 'Mastercard', grp: 'Pagos', kind: 'pay' },
  { code: '9006', name: 'American Express', grp: 'Pagos', kind: 'pay' },
  { code: '9100', name: 'City Ledger (Direct Bill)', grp: 'Pagos', kind: 'pay' },
];
const TRXMAP = Object.fromEntries(TRX.map(t => [t.code, t]));
const PAY = {
  CA: { name: 'Efectivo', trx: '9000' }, VA: { name: 'Visa', trx: '9004', card: 1 }, MC: { name: 'Mastercard', trx: '9005', card: 1 },
  AX: { name: 'American Express', trx: '9006', card: 1 }, DB: { name: 'Direct Bill (City Ledger)', trx: '9100', ar: 1 },
};
const GUAR = { '6PM': '6PM · Hold sin garantía', CC: 'CC · Garantizada con tarjeta', DEP: 'DEP · Depósito recibido', CO: 'CO · Garantizada por empresa' };
const MARKETS = { LEIS: 'LEIS · Ocio', CORP: 'CORP · Corporativo', GRP: 'GRP · Grupos', OTA: 'OTA · Agencias online', GOV: 'GOV · Gobierno', COMP: 'COMP · Cortesía' };
const SOURCES = { PHN: 'PHN · Teléfono', WEB: 'WEB · Web propia', EML: 'EML · Correo', OTA: 'OTA · Booking/Expedia', GDS: 'GDS · Sistema global', TA: 'TA · Agencia de viajes', WLK: 'WLK · Walk-in' };
const SPECIALS = { NS: 'No fumar', HF: 'Piso alto', LF: 'Piso bajo', CR: 'Cuna', EC: 'Early check-in', LC: 'Late check-out', HM: 'Luna de miel / aniversario', QT: 'Habitación tranquila', AD: 'Habitaciones contiguas' };
const DEPTS = { FO: 'FO · Recepción', HK: 'HK · Ama de llaves', ENG: 'ENG · Mantenimiento', CON: 'CON · Conserjería', FB: 'FB · Alimentos y bebidas', RES: 'RES · Reservas' };
const VIPS = { '': 'Sin VIP', V1: 'V1 · Gold', V2: 'V2 · Platinum', V3: 'V3 · Ejecutivo / Celebridad' };
const HKS = { CL: 'Limpia (Clean)', DI: 'Sucia (Dirty)', IP: 'Inspeccionada (Inspected)', PU: 'Pickup (repaso)', OOO: 'Fuera de orden (OOO)', OOS: 'Fuera de servicio (OOS)' };
const COUNTRIES = { DO: 'República Dominicana', US: 'Estados Unidos', CA: 'Canadá', ES: 'España', FR: 'Francia', IT: 'Italia', DE: 'Alemania', GB: 'Reino Unido', JP: 'Japón', CO: 'Colombia', MX: 'México', PR: 'Puerto Rico', VE: 'Venezuela', AR: 'Argentina' };
const roomTypeName = c => (CFG.roomTypes.find(t => t.code === c) || {}).name || c;
const rateDef = c => CFG.rates.find(r => r.code === c);
const trxName = c => (TRXMAP[c] || {}).name || c;

/* ---------- Estado ---------- */
let state, ui, prog;
const BD = () => state.businessDate;
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); localStorage.setItem(LS_PROG, JSON.stringify(prog)); } catch (e) { /* sin almacenamiento */ } }
function loadAll() {
  try { const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (s && s.v === 1) state = s; } catch (e) { /* */ }
  try { prog = JSON.parse(localStorage.getItem(LS_PROG) || 'null'); } catch (e) { /* */ }
  if (!state) seed();
  if (!prog) prog = { tuts: {}, cases: {}, guides: {}, quiz: null };
}
const profile = id => state.profiles.find(p => p.id === id);
const resById = id => state.reservations.find(r => r.id === id);
const room = no => state.rooms.find(r => r.no === no);
const block = id => state.blocks.find(b => b.id === id);
function pname(id) { const p = profile(id); if (!p) return '—'; return p.type === 'IND' ? `${p.last}, ${p.first}` : p.name; }
function pfull(id) { const p = profile(id); if (!p) return '—'; return p.type === 'IND' ? `${p.title ? p.title + ' ' : ''}${p.first} ${p.last}` : p.name; }
function log(txt, r) {
  const e = { d: BD(), t: clock(), u: state.user, txt };
  state.log.unshift(e); if (state.log.length > 400) state.log.length = 400;
  if (r) r.history.unshift(e);
}

function newProfile(o) {
  const id = 'P' + (++state.seq.prof);
  const p = Object.assign({ id, type: 'IND', title: '', first: '', last: '', name: '', email: '', phone: '', country: 'DO', lang: 'ES', vip: '', companyId: null, idType: '', idNo: '', notes: '', ar: '', iata: '', contact: '', created: state.businessDate }, o);
  state.profiles.push(p); return p;
}
function rateAmount(rate, type, blockId) {
  if (blockId) { const b = block(blockId); return b ? b.rate : 0; }
  const d = rateDef(rate); return d ? d.p[type] : 0;
}
function cardMask(no) { const s = String(no || '').replace(/\D/g, ''); return s.length >= 4 ? '•••• ' + s.slice(-4) : ''; }

function mkRes(o) {
  const rate = o.blockId ? 'GRP' : (o.rate || 'BAR');
  const r = {
    id: 'R' + (++state.seq.res), conf: String(++state.seq.conf), profileId: o.p, companyId: o.company || null, taId: o.ta || null,
    arr: o.arr, dep: o.dep || addDays(o.arr, o.n || 1), adults: o.adults || 1, children: o.children || 0,
    roomType: o.type, rtc: o.rtc || o.type, room: o.room || '', rate, amount: o.amount ?? rateAmount(rate, o.rtc || o.type, o.blockId),
    status: o.status || 'RESERVED', guarantee: o.g || 'CC', pay: o.pay ?? 'VA', card: o.card ?? (PAY[o.pay ?? 'VA']?.card ? cardMask('4111' + o.p.replace(/\D/g, '').padStart(4, '7')) : ''), exp: o.exp || '08/28',
    market: o.market || (o.blockId ? 'GRP' : rateDef(rate)?.market) || 'LEIS', source: o.source || 'PHN', specials: o.specials || [], comments: o.comments || '',
    alerts: o.alerts || [], traces: o.traces || [], folio: [], routing: o.routing || [], windows: { 1: { payee: o.p } },
    blockId: o.blockId || null, posted: [], history: [], created: o.created || state.businessDate, cancelNo: null, ciDate: null, coDate: null, cxlDate: null, folioNo: null,
  };
  state.reservations.push(r); return r;
}

/* ---------- Folio ---------- */
function routeWindow(r, code) { for (const rt of r.routing || []) if (rt.codes.includes(code)) return rt.window; return 1; }
function post(r, code, amount, o = {}) {
  if (!TRXMAP[code]) fail('Código de transacción inválido: ' + code);
  const w = o.window || routeWindow(r, code);
  const p = { id: ++state.seq.post, date: o.date || BD(), code, desc: o.desc || trxName(code), amount: r2(amount), window: +w, ref: o.ref || '', user: state.user, t: clock() };
  r.folio.push(p); return p;
}
function balance(r, w) { return r2(r.folio.filter(p => w == null || p.window === +w).reduce((a, p) => a + p.amount, 0)); }
function windowsUsed(r) { const s = new Set([1, ...r.folio.map(p => p.window), ...Object.keys(r.windows || {}).map(Number)]); return [...s].sort(); }
function nightTotal(r) { return r2(r.amount * (1 + CFG.tax.itbis + CFG.tax.svc)); }
function postNight(r, date) {
  if (r.posted.includes(date)) return;
  const amt = r.amount; const pkg = (rateDef(r.rate)?.pkg) || 0;
  if (amt > 0) {
    post(r, '1000', amt - pkg, { date, desc: `Habitación ${r.room} · ${r.rate}` });
    if (pkg) post(r, '2030', pkg, { date, desc: 'Paquete BKFT (desayuno)' });
    post(r, '1010', amt * CFG.tax.itbis, { date });
    post(r, '1020', amt * CFG.tax.svc, { date });
  }
  r.posted.push(date);
}
function payment(r, w, method, amount, ref) {
  const pm = PAY[method]; if (!pm) fail('Elige un método de pago.');
  amount = r2(+amount); if (!(amount > 0)) fail('El monto del pago debe ser mayor que cero.');
  if (pm.ar) {
    const payee = profile(r.windows?.[w]?.payee);
    if (!payee || !payee.ar) fail(`La ventana ${w} no tiene un pagador con cuenta AR. Para Direct Bill, define la empresa como pagador de la ventana (Routing).`);
  }
  if (pm.card && !r.card && !ref) fail('No hay tarjeta registrada en la reserva. Captura la tarjeta en la reserva o escribe la referencia.');
  const desc = pm.name + (pm.card ? ' ' + (r.card || ref) : '') + (pm.ar ? ' · AR ' + profile(r.windows[w].payee).ar : '');
  const p = post(r, pm.trx, -amount, { window: w, desc, ref });
  log(`Pago ${pm.name} ${money(amount)} en ventana ${w} (conf. ${r.conf})`, r); return p;
}

/* ---------- Disponibilidad ---------- */
const ACTIVE = ['RESERVED', 'CHECKED_IN'];
const isActive = r => ACTIVE.includes(r.status);
function isOOO(rm, d) { return !!(rm.ooo && rm.ooo.from <= d && d < rm.ooo.to); }
function nightsOf(arr, dep) { const a = []; for (let d = arr; d < dep; d = addDays(d, 1)) a.push(d); return a; }
function blockPicked(b, type, d) { return state.reservations.filter(r => r.blockId === b.id && isActive(r) && r.roomType === type && r.arr <= d && d < r.dep).length; }
function blockRemaining(type, d, onlyBlock) {
  return state.blocks.filter(b => b.status === 'DEF' && b.arr <= d && d < b.dep && (!onlyBlock || b.id === onlyBlock))
    .reduce((a, b) => a + Math.max(0, (b.rooms[type] || 0) - blockPicked(b, type, d)), 0);
}
function sold(type, d, excludeId) { return state.reservations.filter(r => isActive(r) && r.id !== excludeId && r.roomType === type && r.arr <= d && d < r.dep).length; }
function physical(type, d) { return state.rooms.filter(x => x.type === type && !isOOO(x, d)).length; }
function avail(type, d, o = {}) {
  let a = physical(type, d) - sold(type, d, o.excludeId) - blockRemaining(type, d);
  if (o.blockId) a = blockRemaining(type, d, o.blockId);
  return a;
}
function minAvail(type, arr, dep, o) { return Math.min(...nightsOf(arr, dep).map(d => avail(type, d, o))); }
function roomFree(no, arr, dep, excludeId) {
  const rm = room(no); if (!rm) return false;
  if (nightsOf(arr, dep).some(d => isOOO(rm, d))) return false;
  return !state.reservations.some(r => r.id !== excludeId && isActive(r) && r.room === no && r.arr < dep && arr < r.dep);
}
function hkShown(rm) { if (isOOO(rm, BD())) return 'OOO'; if (rm.oos) return 'OOS'; return rm.hk; }
function occupant(no) { return state.reservations.find(r => r.status === 'CHECKED_IN' && r.room === no); }

/* ---------- Estados de reserva ---------- */
function resStatus(r) {
  if (r.status === 'RESERVED') return r.arr <= BD() ? 'DUE IN' : 'RESERVED';
  if (r.status === 'CHECKED_IN') return r.dep <= BD() ? 'DUE OUT' : 'IN HOUSE';
  return { CHECKED_OUT: 'CHECKED OUT', CANCELLED: 'CANCELLED', NO_SHOW: 'NO SHOW' }[r.status];
}
const STATUS_ES = { 'DUE IN': 'Llega hoy', RESERVED: 'Reservada', 'IN HOUSE': 'En casa', 'DUE OUT': 'Sale hoy', 'CHECKED OUT': 'Salió', CANCELLED: 'Cancelada', 'NO SHOW': 'No se presentó' };

/* ---------- Operaciones ---------- */
const DO = {
  assignRoom(r, no, force) {
    if (!isActive(r)) fail('Solo se asignan habitaciones a reservas activas.');
    const rm = room(no); if (!rm) fail('La habitación no existe.');
    if (rm.type !== r.roomType && !force) fail(`La habitación ${no} es ${rm.type} y la reserva es ${r.roomType}. Cambia el tipo de habitación de la reserva para hacer un upgrade.`);
    if (!roomFree(no, r.arr, r.dep, r.id)) fail(`La habitación ${no} no está libre para ${fd(r.arr)} – ${fd(r.dep)} (ocupada, asignada a otra reserva o fuera de orden).`);
    const old = r.room; r.room = no; log(`Habitación ${old ? old + ' → ' : ''}${no} asignada (conf. ${r.conf})`, r);
  },
  unassign(r) { if (r.status !== 'RESERVED') fail('Solo se puede liberar la habitación antes del check-in.'); log(`Habitación ${r.room} liberada (conf. ${r.conf})`, r); r.room = ''; },
  checkIn(r) {
    if (r.status !== 'RESERVED') fail('La reserva no está en estado RESERVED.');
    if (r.arr !== BD()) fail(`La llegada es el ${fd(r.arr)}. Solo se registra el check-in en la fecha de llegada (fecha de negocio ${fd(BD())}).`);
    if (!r.room) fail('Asigna una habitación antes del check-in.');
    const rm = room(r.room);
    if (isOOO(rm, BD())) fail(`La habitación ${rm.no} está fuera de orden (OOO).`);
    if (rm.oos) fail(`La habitación ${rm.no} está fuera de servicio (OOS). Elige otra.`);
    if (rm.fo === 'OCC') fail(`La habitación ${rm.no} sigue ocupada por otro huésped.`);
    if (!['CL', 'IP'].includes(rm.hk)) fail(`La habitación ${rm.no} está ${HKS[rm.hk]}. Solo se hace check-in en habitaciones Limpias o Inspeccionadas.`);
    if (!r.pay) fail('Falta el método de pago. Edita la reserva y captura cómo pagará el huésped.');
    if (PAY[r.pay]?.card && !r.card) fail('El método de pago es tarjeta pero no hay número de tarjeta.');
    r.status = 'CHECKED_IN'; r.ciDate = BD(); r.ciTime = clock(); rm.fo = 'OCC';
    log(`Check-in ${pname(r.profileId)} en hab. ${rm.no} (conf. ${r.conf})`, r);
  },
  checkOut(r) {
    if (r.status !== 'CHECKED_IN') fail('Solo se puede hacer check-out de huéspedes en casa.');
    for (const w of windowsUsed(r)) { const b = balance(r, w); if (Math.abs(b) > 0.004) fail(`La ventana ${w} tiene saldo de ${money(b)}. Liquida cada ventana a $0.00 antes del check-out.`); }
    if (r.dep > BD()) { log(`Salida anticipada: salida original ${fd(r.dep)} (conf. ${r.conf})`, r); r.dep = BD(); }
    r.status = 'CHECKED_OUT'; r.coDate = BD(); r.coTime = clock(); r.folioNo = ++state.seq.folio;
    const rm = room(r.room); if (rm) { rm.fo = 'VAC'; rm.hk = 'DI'; }
    log(`Check-out ${pname(r.profileId)} hab. ${r.room}, folio #${r.folioNo} (conf. ${r.conf})`, r);
  },
  cancel(r, reason) {
    if (r.status !== 'RESERVED') fail('Solo se cancelan reservas que aún no han llegado.');
    if (!reason) fail('Escribe el motivo de la cancelación.');
    r.status = 'CANCELLED'; r.cancelNo = String(++state.seq.cxl); r.cxlDate = BD(); r.cxlReason = reason; r.room = '';
    log(`Reserva cancelada. N.º de cancelación ${r.cancelNo}. Motivo: ${reason}`, r);
  },
  reinstate(r) {
    if (!['CANCELLED', 'NO_SHOW'].includes(r.status)) fail('Solo se reactivan reservas canceladas o no-show.');
    if (r.dep <= BD()) fail('Las fechas ya pasaron. Crea una reserva nueva.');
    if (r.arr < BD()) { r.arr = BD(); }
    if (minAvail(r.roomType, r.arr, r.dep, { excludeId: r.id }) < 1) fail('No hay disponibilidad para reactivar en esas fechas.');
    r.status = 'RESERVED'; log(`Reserva reactivada (reinstate) (conf. ${r.conf})`, r);
  },
  noShow(r) {
    if (r.status !== 'RESERVED' || r.arr > BD()) fail('Solo las llegadas pendientes de hoy pueden pasar a No-Show.');
    r.status = 'NO_SHOW'; r.room = '';
    if (['CC', 'DEP', 'CO'].includes(r.guarantee) && r.amount > 0) {
      post(r, '7000', nightTotal(r), { desc: 'Cargo No-Show (1 noche + impuestos)' });
      log(`No-Show garantizado: cargo de ${money(nightTotal(r))} (conf. ${r.conf})`, r);
    } else log(`No-Show sin garantía, sin cargo (conf. ${r.conf})`, r);
  },
  roomMove(r, no, reason) {
    if (r.status !== 'CHECKED_IN') fail('El cambio de habitación (Room Move) es para huéspedes en casa.');
    const rm = room(no); if (!rm) fail('Elige la nueva habitación.');
    if (no === r.room) fail('Es la misma habitación.');
    if (!reason) fail('Escribe el motivo del cambio.');
    if (!roomFree(no, BD(), r.dep, r.id)) fail(`La habitación ${no} no está libre hasta ${fd(r.dep)}.`);
    if (rm.fo === 'OCC' || rm.oos || !['CL', 'IP'].includes(rm.hk)) fail(`La habitación ${no} debe estar vacía y Limpia o Inspeccionada.`);
    const old = room(r.room); old.fo = 'VAC'; old.hk = 'DI';
    rm.fo = 'OCC'; if (rm.type !== r.roomType) r.roomType = rm.type;
    log(`Room Move ${old.no} → ${no}. Motivo: ${reason}`, r); r.room = no;
  },
  extend(r, n = 1) {
    const nd = addDays(r.dep, n);
    if (r.room && !roomFree(r.room, r.dep, nd, r.id)) fail(`La habitación ${r.room} está comprometida para ${fd(r.dep)}. Haz un Room Move o asigna otra.`);
    if (minAvail(r.roomType, r.dep, nd, { excludeId: r.id }) < 0) fail('No hay disponibilidad para extender.');
    log(`Estancia extendida: salida ${fd(r.dep)} → ${fd(nd)}`, r); r.dep = nd;
  },
  setHK(no, st) {
    const rm = room(no);
    if (st === 'OOS') { rm.oos = { reason: 'Fuera de servicio', from: BD() }; log(`Hab. ${no} → OOS`); return; }
    if (isOOO(rm, BD())) fail(`La habitación ${no} está fuera de orden. Devuélvela a servicio primero.`);
    rm.hk = st; rm.oos = null; log(`Hab. ${no} → ${HKS[st]}`);
  },
  setOOO(no, from, to, reason) {
    const rm = room(no);
    if (!reason) fail('El motivo es obligatorio para fuera de orden.');
    if (!(from && to && to > from)) fail('La fecha "hasta" debe ser posterior a "desde".');
    if (from < BD()) fail('No se puede poner fuera de orden en fechas pasadas.');
    if (rm.fo === 'OCC' && from <= BD()) fail(`La habitación ${no} está ocupada. Haz un Room Move del huésped primero.`);
    const clash = state.reservations.find(r => isActive(r) && r.room === no && r.arr < to && from < r.dep && !(r.status === 'CHECKED_IN' && r.dep <= from));
    if (clash) fail(`La reserva ${clash.conf} (${pname(clash.profileId)}) tiene asignada la ${no} en esas fechas. Libérala o reasígnala primero.`);
    rm.ooo = { from, to, reason }; rm.oos = null; log(`Hab. ${no} fuera de orden ${fd(from)}–${fd(to)}: ${reason}`);
  },
  returnService(no) { const rm = room(no); rm.ooo = null; rm.oos = null; rm.hk = 'DI'; log(`Hab. ${no} devuelta a servicio (queda Sucia para limpieza)`); },
  adjust(r, code, amount, reason, w) {
    if (!reason) fail('Todo ajuste requiere un motivo.');
    amount = r2(+amount); if (!(amount > 0)) fail('Escribe el monto a descontar (positivo).');
    const p = post(r, code, -amount, { desc: `${trxName(code)}: ${reason}`, window: w });
    log(`Ajuste ${code} ${money(-amount)}: ${reason}`, r); return p;
  },
  transfer(r, ids, w) { let n = 0; for (const p of r.folio) if (ids.includes(p.id)) { p.window = +w; n++; } if (!n) fail('Marca al menos una transacción para transferir.'); log(`${n} transacción(es) transferidas a ventana ${w}`, r); },
  setRouting(r, codes, w, payee) {
    if (!codes.length) fail('Elige al menos un código de transacción para el routing.');
    r.routing = (r.routing || []).filter(rt => rt.window !== +w).map(rt => ({ ...rt, codes: rt.codes.filter(c => !codes.includes(c)) })).filter(rt => rt.codes.length);
    r.routing.push({ codes, window: +w });
    r.windows[w] = { payee: payee || r.profileId };
    log(`Routing: ${codes.join(', ')} → ventana ${w} (pagador ${pname(payee || r.profileId)})`, r);
  },
};

/* ---------- Auditoría nocturna ---------- */
function pendingArrivals() { return state.reservations.filter(r => r.status === 'RESERVED' && r.arr <= BD()); }
function pendingDepartures() { return state.reservations.filter(r => r.status === 'CHECKED_IN' && r.dep <= BD()); }
function unposted() { return state.reservations.filter(r => r.status === 'CHECKED_IN' && r.dep > BD() && !r.posted.includes(BD())); }
function postAllRooms() { const list = unposted(); list.forEach(r => postNight(r, BD())); log(`Auditoría: posteo de habitación e impuestos a ${list.length} habitaciones`); return list.length; }
function dayStats(d) {
  const all = state.reservations; const posts = all.flatMap(r => r.folio.filter(p => p.date === d));
  const sum = f => r2(posts.filter(f).reduce((a, p) => a + p.amount, 0));
  const total = state.rooms.length; const ooo = state.rooms.filter(x => isOOO(x, d)).length;
  const occ = all.filter(r => (r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT') && r.arr <= d && d < r.dep && r.ciDate);
  const comp = occ.filter(r => r.amount === 0).length;
  const roomRev = sum(p => p.code === '1000' || p.code === '1099');
  const avl = total - ooo;
  return {
    date: d, total, ooo, avl, occ: occ.length, comp, occPct: avl ? occ.length / avl * 100 : 0,
    roomRev, adr: occ.length - comp ? roomRev / (occ.length - comp) : 0, revpar: avl ? roomRev / avl : 0,
    fb: sum(p => p.code.startsWith('20')), other: sum(p => /^[3-6]/.test(p.code)), noshowRev: sum(p => p.code === '7000'),
    tax: sum(p => p.code === '1010' || p.code === '1020'), pay: sum(p => p.code.startsWith('9')),
    arrivals: all.filter(r => r.ciDate === d).length, departures: all.filter(r => r.coDate === d).length,
    noShows: all.filter(r => r.status === 'NO_SHOW' && r.arr === d).length, cxl: all.filter(r => r.cxlDate === d).length,
    guests: occ.reduce((a, r) => a + r.adults + r.children, 0),
  };
}
function closeDay() {
  if (pendingArrivals().length) fail('Quedan llegadas pendientes. Resuélvelas en el paso 1.');
  if (pendingDepartures().length) fail('Quedan salidas pendientes. Resuélvelas en el paso 2.');
  if (unposted().length) fail('Falta postear habitación e impuestos (paso 3).');
  if (!ui.na.reports) fail('Genera los informes de cierre (paso 4).');
  const s = dayStats(BD()); state.audits.unshift(s);
  const old = BD(); state.businessDate = addDays(old, 1);
  for (const rm of state.rooms) {
    if (rm.fo === 'OCC') rm.hk = 'DI';
    if (rm.ooo && rm.ooo.to <= BD()) { rm.ooo = null; rm.hk = 'DI'; }
  }
  log(`Cierre del día ${fd(old)}. Nueva fecha de negocio ${fd(BD())}`);
  ui.na = { step: 0, reports: false };
}

/* ---------- Datos de práctica ---------- */
function seed() {
  const D = '2026-11-24';
  state = { v: 1, businessDate: D, user: 'TRAINEE', seq: { conf: 2614500, prof: 0, post: 0, block: 0, cxl: 880100, res: 0, folio: 5000 }, rooms: [], profiles: [], reservations: [], blocks: [], audits: [], log: [] };
  const addRoom = (no, type, floor, feat, hk) => state.rooms.push({ no, type, floor, feat, hk: hk || 'CL', fo: 'VAC', ooo: null, oos: null });
  const hk1 = { 101: 'CL', 102: 'DI', 103: 'DI', 104: 'IP', 105: 'CL', 106: 'CL', 107: 'CL', 108: 'DI', 109: 'CL', 110: 'CL', 201: 'DI', 202: 'CL', 203: 'DI', 204: 'CL', 205: 'IP', 206: 'CL', 207: 'DI', 208: 'DI', 209: 'CL', 210: 'CL', 301: 'CL', 302: 'DI', 303: 'CL', 304: 'IP', 305: 'DI', 306: 'CL', 307: 'DI', 308: 'CL', 401: 'DI', 402: 'CL', 403: 'DI', 404: 'IP', 405: 'DI', 406: 'CL' };
  for (let i = 1; i <= 10; i++) addRoom(String(100 + i), 'STD', 1, i % 2 ? 'Vista calle El Conde' : 'Vista patio interior', hk1[100 + i]);
  for (let i = 1; i <= 10; i++) addRoom(String(200 + i), 'STD', 2, i % 2 ? 'Vista calle El Conde' : 'Vista patio interior', hk1[200 + i]);
  for (let i = 1; i <= 8; i++) addRoom(String(300 + i), 'DLX', 3, 'Vista mar, balcón', hk1[300 + i]);
  for (let i = 1; i <= 4; i++) addRoom(String(400 + i), 'JRS', 4, 'Vista mar, sala', hk1[400 + i]);
  addRoom('405', 'STE', 4, 'Terraza privada', hk1[405]); addRoom('406', 'STE', 4, 'Terraza y jacuzzi', hk1[406]);
  room('208').ooo = { from: addDays(D, -1), to: addDays(D, 2), reason: 'Fuga en el baño – plomería' };
  room('209').oos = { reason: 'Retoque de pintura', from: D };

  const P = o => newProfile(Object.assign({ created: '2025-03-02' }, o)).id;
  const C1 = P({ type: 'COM', name: 'Grupo Ramos Corp', ar: '10045', contact: 'Mariela Ramos', email: 'reservas@gruporamos.example', phone: '+1 809 555 0110', notes: 'Contrato 2026: tarifa CORP. La empresa paga habitación e impuestos por Direct Bill; extras a cuenta del huésped.' });
  const C2 = P({ type: 'COM', name: 'Banco Antillano', ar: '10046', contact: 'Depto. de Viajes', email: 'viajes@bancoantillano.example', phone: '+1 809 555 0177', notes: 'Paga habitación e impuestos. Extras a cuenta del huésped.' });
  const T1 = P({ type: 'TA', name: 'Caribe Tours Agencia', iata: '12345678', contact: 'Operaciones', email: 'ops@caribetours.example', phone: '+1 809 555 0199', notes: 'Comisión 10% sobre habitación.' });
  const g = (title, first, last, country, more) => P(Object.assign({ title, first, last, country, email: `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@mail.example', phone: '+1 809 555 ' + (1200 + state.seq.prof) }, more || {}));
  const carlos = g('Sr.', 'Carlos', 'Pérez', 'DO', { idType: 'Cédula', idNo: '001-1234567-8' });
  const ana = g('Sra.', 'Ana', 'Torres', 'ES', { idType: 'Pasaporte', idNo: 'PAE482190' });
  const john = g('Mr.', 'John', 'Smith', 'US', { companyId: C1, lang: 'EN', idType: 'Pasaporte', idNo: '584221907' });
  const marie = g('Mme.', 'Marie', 'Dubois', 'FR', { lang: 'FR', idType: 'Pasaporte', idNo: '19FR88421' });
  const kenji = g('Mr.', 'Kenji', 'Watanabe', 'JP', { vip: 'V1', lang: 'EN', notes: 'Prefiere habitación tranquila y té verde en la habitación.', idType: 'Pasaporte', idNo: 'TZ1182990' });
  const luis = g('Sr.', 'Luis', 'Fernández', 'DO', { idType: 'Cédula', idNo: '402-2233445-1' });
  const laura = g('Sra.', 'Laura', 'Méndez', 'DO', { idType: 'Cédula', idNo: '031-0099881-2' });
  const roberto = g('Sr.', 'Roberto', 'Almonte', 'DO', { vip: 'V2', notes: 'Huésped frecuente. Prefiere piso alto y agua sin gas. Cumpleaños: 12-dic.', idType: 'Cédula', idNo: '001-7788990-3' });
  const patricia = g('Sra.', 'Patricia', 'Rodríguez', 'DO', { idType: 'Cédula', idNo: '223-0011223-4' });
  const sophie = g('Ms.', 'Sophie', 'Martin', 'CA', { lang: 'EN', idType: 'Pasaporte', idNo: 'GA772134' });
  const pedro = g('Sr.', 'Pedro', 'Gómez', 'DO', { companyId: C1, idType: 'Cédula', idNo: '001-4455667-0' });
  const emily = g('Ms.', 'Emily', 'Johnson', 'US', { lang: 'EN' });
  g('Sr.', 'Andrés', 'Castillo', 'CO');
  g('Sig.ra', 'Valentina', 'Rossi', 'IT', { lang: 'IT', notes: 'Viaja por turismo. Pide recomendaciones de restaurantes.' });
  g('Sr.', 'Miguel', 'Santana', 'DO');
  const hans = g('Hr.', 'Hans', 'Becker', 'DE', { lang: 'DE' });
  const felipe = g('Dr.', 'Felipe', 'Ortega', 'DO');
  const carmen = g('Dra.', 'Carmen', 'Liz', 'DO');

  // En casa
  const ih = [
    mkRes({ p: carlos, arr: addDays(D, -2), n: 2, type: 'STD', room: '102', rate: 'BAR', status: 'CHECKED_IN', pay: 'VA', source: 'WEB', created: addDays(D, -20) }),
    mkRes({ p: ana, arr: addDays(D, -1), n: 3, type: 'DLX', room: '301', rate: 'BARBB', status: 'CHECKED_IN', pay: 'MC', adults: 2, specials: ['HM'], comments: 'Aniversario de bodas. Decoración aprobada.', created: addDays(D, -35) }),
    mkRes({ p: john, arr: addDays(D, -3), n: 3, type: 'JRS', room: '401', rate: 'CORP', status: 'CHECKED_IN', company: C1, g: 'CO', pay: 'DB', market: 'CORP', routing: [{ codes: ['1000', '1010', '1020'], window: 2 }], created: addDays(D, -12) }),
    mkRes({ p: marie, arr: addDays(D, -1), n: 4, type: 'STD', room: '105', rate: 'BAR', status: 'CHECKED_IN', pay: 'VA', source: 'OTA', market: 'OTA', created: addDays(D, -9) }),
    mkRes({ p: kenji, arr: addDays(D, -2), n: 3, type: 'STE', room: '405', rate: 'RACK', status: 'CHECKED_IN', pay: 'AX', specials: ['HF', 'QT'], created: addDays(D, -40) }),
    mkRes({ p: luis, arr: addDays(D, -1), n: 2, type: 'STD', room: '201', rate: 'BAR', status: 'CHECKED_IN', pay: 'CA', g: 'DEP', card: '', created: addDays(D, -3) }),
  ];
  ih[2].windows[2] = { payee: C1 };
  for (const r of ih) { r.ciDate = r.arr; r.ciTime = '15:10'; room(r.room).fo = 'OCC'; for (const d of nightsOf(r.arr, D)) postNight(r, d); }
  post(ih[0], '2000', 62.40, { date: addDays(D, -1), ref: 'Cheque 4471' });
  post(ih[1], '2010', 28.00, { date: addDays(D, -1), ref: 'Cheque 5512' });
  post(ih[2], '3000', 14.00, { date: addDays(D, -1) });
  post(ih[4], '5000', 140.00, { date: addDays(D, -1), ref: 'Masaje 60 min' });
  post(ih[5], '9000', -400, { date: addDays(D, -1), window: 1, desc: 'Efectivo · depósito al check-in' });
  room('301').hk = 'CL'; room('105').hk = 'CL';

  // Llegadas de hoy
  mkRes({ p: laura, arr: D, n: 2, type: 'STD', rate: 'BAR', pay: 'VA', source: 'WEB', created: addDays(D, -6) });
  mkRes({ p: roberto, arr: D, n: 3, type: 'DLX', rate: 'BAR', pay: 'AX', specials: ['HF'], comments: 'Llega 10:30 en vuelo AA 1234.', alerts: [{ area: 'CI', text: 'VIP V2: entregar carta de bienvenida del gerente y amenidad de frutas.' }], created: addDays(D, -15) });
  mkRes({ p: patricia, arr: D, n: 4, type: 'JRS', rate: 'BARBB', g: '6PM', pay: '', card: '', adults: 2, children: 2, specials: ['CR'], comments: 'Familia con 2 niños (5 y 8 años).', created: addDays(D, -2) });
  const s = mkRes({ p: sophie, arr: D, n: 1, type: 'STD', room: '107', rate: 'ADV14', g: 'DEP', pay: 'VA', source: 'WEB', created: addDays(D, -30) });
  post(s, '9004', -nightTotal(s), { date: addDays(D, -30), window: 1, desc: 'Visa ' + s.card + ' · prepago ADV14' });
  const pg = mkRes({ p: pedro, arr: D, n: 2, type: 'DLX', rate: 'CORP', company: C1, g: 'CO', pay: 'DB', card: '', market: 'CORP', routing: [{ codes: ['1000', '1010', '1020'], window: 2 }], created: addDays(D, -4) });
  pg.windows[2] = { payee: C1 };

  // Futuras
  mkRes({ p: emily, arr: addDays(D, 1), n: 2, type: 'DLX', rate: 'BAR', pay: 'MC', created: addDays(D, -8) });
  mkRes({ p: hans, arr: addDays(D, 2), n: 4, type: 'JRS', rate: 'BAR', ta: T1, source: 'TA', pay: 'VA', created: addDays(D, -25) });
  mkRes({ p: carlos, arr: addDays(D, 21), n: 2, type: 'STD', rate: 'ADV14', g: 'DEP', pay: 'VA', source: 'WEB' });

  // Historial
  const h1 = mkRes({ p: emily, arr: addDays(D, -40), n: 3, type: 'STD', room: '106', rate: 'BAR', pay: 'MC', status: 'CHECKED_OUT' });
  const h2 = mkRes({ p: roberto, arr: addDays(D, -75), n: 2, type: 'DLX', room: '306', rate: 'BAR', pay: 'AX', status: 'CHECKED_OUT' });
  for (const r of [h1, h2]) { r.ciDate = r.arr; r.coDate = r.dep; r.folioNo = ++state.seq.folio; for (const d of nightsOf(r.arr, r.dep)) postNight(r, d); payment(r, 1, r.pay, balance(r, 1)); }
  state.reservations.find(r => r.status === 'CANCELLED');
  const cx = mkRes({ p: hans, arr: addDays(D, 5), n: 2, type: 'STD', rate: 'BAR', pay: 'VA' }); cx.status = 'CANCELLED'; cx.cancelNo = String(++state.seq.cxl); cx.cxlDate = addDays(D, -1); cx.cxlReason = 'Cambio de planes';

  // Bloque
  const b = { id: 'B' + (++state.seq.block), code: 'CONGMED', name: 'Congreso Médico del Caribe', companyId: C2, arr: addDays(D, 3), dep: addDays(D, 6), rooms: { STD: 6, DLX: 2 }, rate: 119, status: 'DEF', cutoff: addDays(D, 1), contact: 'Comité organizador', created: addDays(D, -60) };
  state.blocks.push(b);
  mkRes({ p: felipe, arr: b.arr, dep: b.dep, type: 'STD', blockId: b.id, g: 'CO', pay: 'VA', company: C2, created: addDays(D, -10) });
  mkRes({ p: carmen, arr: b.arr, dep: b.dep, type: 'STD', blockId: b.id, g: 'CO', pay: 'MC', company: C2, created: addDays(D, -9) });

  state.log = []; log('Hotel de práctica inicializado');
}
