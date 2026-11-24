'use strict';
/* =========================================================
   Atrio PMS — vistas, modales y acciones de la interfaz
   ========================================================= */
const VIEWS = {}, MODALS = {}, A = {};

function freshLtb() {
  return {
    stage: 'search', arr: BD(), nights: '1', adults: '1', children: '0', blockId: '', walkin: false, sel: null,
    guest: { q: '', results: null, profileId: '', isNew: false, title: '', first: '', last: '', email: '', phone: '', country: 'DO', vip: '', idType: 'Cédula', idNo: '' },
    det: { g: 'CC', pay: 'VA', card: '', exp: '', company: '', ta: '', market: '', source: 'PHN', specials: [], comments: '', alert: '', upgrade: '', room: '' },
    resId: null,
  };
}
function initUI() {
  ui = {
    view: 'home', param: null, menu: null, modal: null, m: {}, ltb: freshLtb(),
    search: { q: '', status: 'ACTIVE', arr: '' }, arrivals: { q: '', all: false }, inhouse: { q: '' }, deps: { q: '' },
    hk: { filter: '', floor: '', type: '' }, diary: { start: '' }, profiles: { q: '', type: '' }, na: { step: 0, reports: false },
    report: 'manager', acad: { tab: 'path' }, bill: { sel: [] }, quiz: null, guide: null, billq: '',
  };
}

/* ---------- piezas ---------- */
function chip(t, cls, title) { return `<span class="chip ${cls || ''}"${title ? ` title="${esc(title)}"` : ''}>${esc(t)}</span>`; }
const STATUS_CLS = { 'DUE IN': 'info', RESERVED: 'neutral', 'IN HOUSE': 'good', 'DUE OUT': 'warn', 'CHECKED OUT': 'muted', CANCELLED: 'bad', 'NO SHOW': 'bad' };
function stChip(r) { const s = resStatus(r); return chip(s, STATUS_CLS[s], STATUS_ES[s]); }
const HK_CLS = { CL: 'good', DI: 'bad', IP: 'info', PU: 'warn', OOO: 'violet', OOS: 'muted' };
function hkChip(rm) { const s = hkShown(rm); return chip(s, HK_CLS[s], HKS[s]); }
function vipChip(pid) { const p = profile(pid); return p && p.vip ? chip(p.vip, 'vip', VIPS[p.vip]) : ''; }
function btn(label, act, data = {}, cls = '', extra = '') {
  const ds = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  return `<button type="button" class="btn ${cls}" data-act="${act}"${ds} ${extra}>${label}</button>`;
}
function pageHead(title, en, sub, actions = '') {
  return `<div class="ph"><div class="ph-t"><div class="eyebrow">${esc(en)}</div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="ph-act">${actions}</div></div>`;
}
function fld(label, path, o = {}) {
  const v = getPath(ui, path) ?? ''; const id = 'f-' + path.replace(/\W/g, '-');
  let ctl;
  if (o.options) ctl = `<select id="${id}" data-bind="${path}"${o.rr ? ' data-rr' : ''}${o.dis ? ' disabled' : ''}>${Object.entries(o.options).map(([k, t]) => `<option value="${esc(k)}"${String(v) === String(k) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  else if (o.type === 'textarea') ctl = `<textarea id="${id}" data-bind="${path}" rows="${o.rows || 2}" placeholder="${esc(o.ph || '')}">${esc(v)}</textarea>`;
  else ctl = `<input id="${id}" data-bind="${path}" type="${o.type || 'text'}" value="${esc(v)}"${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''}${o.step ? ` step="${o.step}"` : ''}${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.rr ? ' data-rr' : ''}${o.enter ? ` data-enter="${o.enter}"` : ''}${o.dis ? ' disabled' : ''} autocomplete="off">`;
  return `<label class="fld ${o.cls || ''}" for="${id}"${o.tut ? ` data-tut="${o.tut}"` : ''}><span>${esc(label)}</span>${ctl}${o.help ? `<small>${o.help}</small>` : ''}</label>`;
}
function checks(path, opts) {
  const cur = getPath(ui, path) || [];
  return `<div class="checks">${Object.entries(opts).map(([k, t]) => `<label class="ck"><input type="checkbox" data-bindarr="${path}" value="${esc(k)}"${cur.includes(k) ? ' checked' : ''}> <b>${esc(k)}</b> ${esc(t)}</label>`).join('')}</div>`;
}
const opt = (obj, blank) => blank !== undefined ? Object.assign({ '': blank }, obj) : obj;
const companies = () => Object.fromEntries(state.profiles.filter(p => p.type === 'COM').map(p => [p.id, p.name + (p.ar ? ' · AR ' + p.ar : '')]));
const agents = () => Object.fromEntries(state.profiles.filter(p => p.type === 'TA').map(p => [p.id, p.name + ' · IATA ' + p.iata]));
const rtOpts = () => Object.fromEntries(CFG.roomTypes.map(t => [t.code, `${t.code} · ${t.name}`]));
const payOpts = () => Object.fromEntries(Object.entries(PAY).map(([k, v]) => [k, `${k} · ${v.name}`]));
function empty(t) { return `<div class="empty">${t}</div>`; }
function resLink(r, txt) { return `<a href="#" class="lnk" data-act="openRes" data-id="${r.id}">${esc(txt ?? r.conf)}</a>`; }
function guestCell(r) { return `<div class="gcell"><a href="#" class="lnk strong" data-act="openRes" data-id="${r.id}">${esc(pname(r.profileId))}</a> ${vipChip(r.profileId)}${r.alerts?.length ? chip('ALERTA', 'warn', r.alerts.map(a => a.text).join(' | ')) : ''}${r.traces?.some(t => !t.done) ? chip('TRACE', 'info', 'Tiene traces pendientes') : ''}</div>`; }

/* ---------- Encabezado y menú ---------- */
const MENU = [
  { id: 'bookings', label: 'Reservas', en: 'Bookings', items: [['ltb', 'Look To Book · Nueva reserva'], ['search', 'Gestionar reservas'], ['blocks', 'Bloques de grupo'], ['diary', 'Room Diary (disponibilidad)']] },
  { id: 'frontdesk', label: 'Recepción', en: 'Front Desk', items: [['arrivals', 'Llegadas · Arrivals'], ['inhouse', 'En casa · In House'], ['departures', 'Salidas · Departures'], ['walkin', 'Walk-in']] },
  { id: 'client', label: 'Clientes', en: 'Client Relations', items: [['profiles', 'Perfiles (Profiles)']] },
  { id: 'inventory', label: 'Inventario', en: 'Inventory', items: [['hk', 'Housekeeping · Estado de habitaciones'], ['diary', 'Room Diary']] },
  { id: 'financials', label: 'Finanzas', en: 'Financials', items: [['billing', 'Facturación · Billing'], ['audit', 'Auditoría nocturna · End of Day'], ['reports', 'Informes · Reports']] },
  { id: 'admin', label: 'Configuración', en: 'Admin', items: [['config', 'Tarifas, tipos y códigos'], ['reset', 'Restablecer hotel de práctica']] },
];
function renderTop() {
  $('#topbar').innerHTML = `<div class="tb-in">
    <a href="#" class="brand" data-act="go" data-v="home" data-tut="brand"><span class="mark" aria-hidden="true"></span><span>Atrio<b>PMS</b></span></a>
    <div class="prop"><span class="pc">${CFG.property.code}</span><span class="pn">${CFG.property.name}</span></div>
    <div class="bdate" data-tut="bdate" title="Fecha de negocio: avanza solo con la auditoría nocturna"><span>Fecha de negocio</span><b>${fd(BD())}</b><em>${dow(BD())}</em></div>
    <label class="qs" for="qs"><span class="sr">Buscar reserva</span><input id="qs" data-bind="search.q" data-enter="quickSearch" placeholder="Buscar huésped o conf. ↵" value="${esc(ui.search.q)}"></label>
    <div class="user"><span class="av">TR</span><span>${state.user}</span></div>
  </div>`;
  $('#menubar').innerHTML = `<div class="mb-in">${MENU.map(m => `<div class="menu ${ui.menu === m.id ? 'open' : ''}">
      <button type="button" class="mbtn ${m.items.some(i => i[0] === ui.view) ? 'cur' : ''}" data-act="menu" data-m="${m.id}" data-tut="menu-${m.id}" aria-expanded="${ui.menu === m.id}">${m.label}<small>${m.en}</small></button>
      ${ui.menu === m.id ? `<div class="drop">${m.items.map(([v, t]) => `<button type="button" class="ditem" data-act="go" data-v="${v}" data-tut="nav-${v}">${esc(t)}</button>`).join('')}</div>` : ''}
    </div>`).join('')}
    <button type="button" class="mbtn acad ${ui.view === 'academy' || ui.view === 'guide' ? 'cur' : ''}" data-act="go" data-v="academy" data-tut="menu-academy">Academia<small>Aprende</small></button>
  </div>`;
}

/* ---------- Inicio ---------- */
VIEWS.home = () => {
  const arrP = pendingArrivals(), arrT = state.reservations.filter(r => r.arr === BD() && ['RESERVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(r.status));
  const ih = state.reservations.filter(r => r.status === 'CHECKED_IN'); const depP = pendingDepartures();
  const s = dayStats(BD()); const vc = state.rooms.filter(x => x.fo === 'VAC' && ['CL', 'IP'].includes(hkShown(x))).length;
  const vd = state.rooms.filter(x => x.fo === 'VAC' && hkShown(x) === 'DI').length;
  const occTonight = state.reservations.filter(r => isActive(r) && r.arr <= BD() && BD() < r.dep).length;
  const avl = s.avl; const pct = avl ? Math.round(occTonight / avl * 100) : 0;
  const done = Object.keys(prog.tuts).length + Object.keys(prog.cases).length; const total = TUTS.length + CASES.length;
  return pageHead('Espacio de recepción', 'Front Desk Workspace', `${CFG.property.name} · ${CFG.property.city} · ${state.rooms.length} habitaciones`, btn('Nueva reserva', 'go', { v: 'ltb' }, 'pri') + btn('Walk-in', 'go', { v: 'walkin' }))
    + `<div class="kpis">
      <button class="kpi" data-act="go" data-v="arrivals"><span>Llegadas pendientes</span><b>${arrP.length}<small>/ ${arrT.length}</small></b><em>Arrivals</em></button>
      <button class="kpi" data-act="go" data-v="inhouse"><span>Huéspedes en casa</span><b>${ih.length}</b><em>In House</em></button>
      <button class="kpi" data-act="go" data-v="departures"><span>Salidas pendientes</span><b>${depP.length}</b><em>Due Out</em></button>
      <div class="kpi"><span>Ocupación proyectada</span><b>${pct}%</b><em>${occTonight} de ${avl} disponibles</em></div>
      <button class="kpi" data-act="go" data-v="hk"><span>Vacías listas</span><b>${vc}</b><em>${vd} sucias · ${s.ooo} OOO</em></button>
    </div>
    <div class="grid2">
      <section class="panel"><div class="ptitle"><h2>Llegadas de hoy</h2>${btn('Ver todas', 'go', { v: 'arrivals' }, 'sm ghost')}</div>
        ${arrP.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Huésped</th><th>Tipo</th><th>Hab.</th><th>Noches</th><th>Estado</th></tr></thead><tbody>${arrP.map(r => `<tr><td>${guestCell(r)}</td><td>${r.roomType}</td><td class="mono">${r.room || '—'}</td><td class="num">${diffDays(r.arr, r.dep)}</td><td>${stChip(r)}</td></tr>`).join('')}</tbody></table></div>` : empty('No quedan llegadas pendientes.')}
      </section>
      <section class="panel"><div class="ptitle"><h2>Salidas de hoy</h2>${btn('Ver todas', 'go', { v: 'departures' }, 'sm ghost')}</div>
        ${depP.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Hab.</th><th>Huésped</th><th class="num">Saldo</th></tr></thead><tbody>${depP.map(r => `<tr><td class="mono">${r.room}</td><td>${guestCell(r)}</td><td class="num mono">${money(balance(r))}</td></tr>`).join('')}</tbody></table></div>` : empty('No quedan salidas pendientes.')}
      </section>
    </div>
    <section class="panel acad-cta"><div><div class="eyebrow">Academia</div><h2>Aprende operando el hotel</h2><p>Tutoriales guiados paso a paso sobre este mismo sistema, casos prácticos con evaluación automática, guías por módulo y glosario. Llevas ${done} de ${total} actividades completadas.</p></div>
      <div class="row">${btn('Abrir Academia', 'go', { v: 'academy' }, 'pri')}${btn('Iniciar primer tutorial', 'tutStart', { id: TUTS[0].id })}</div></section>`;
};

/* ---------- Look To Book ---------- */
VIEWS.walkin = () => { ui.view = 'ltb'; const L = freshLtb(); L.walkin = true; L.det.source = 'WLK'; L.det.market = 'LEIS'; ui.ltb = L; return VIEWS.ltb(); };
function ltbRates(L) {
  const b = L.blockId ? block(L.blockId) : null;
  if (b) return [{ code: 'GRP', name: `Tarifa de grupo ${b.code}`, p: Object.fromEntries(CFG.roomTypes.map(t => [t.code, b.rate])) }];
  return CFG.rates;
}
function ltbGrid(L) {
  const arr = L.arr, dep = addDays(arr, +L.nights || 1); const pax = (+L.adults || 0) + (+L.children || 0); const b = L.blockId ? block(L.blockId) : null;
  return CFG.roomTypes.map(t => {
    const av = b ? minAvail(t.code, arr, dep, { blockId: b.id }) : minAvail(t.code, arr, dep);
    const cells = ltbRates(L).map(rt => {
      let why = '';
      if (b && !b.rooms[t.code]) why = 'No incluido en el bloque';
      else if (av <= 0) why = 'Sin disponibilidad';
      else if (pax > t.max) why = `Máx. ${t.max} personas`;
      else if (rt.minLead && diffDays(BD(), arr) < rt.minLead) why = `Cerrada: requiere ${rt.minLead} días de antelación`;
      else if (rt.needsCompany && !L.det.company) why = 'Requiere perfil de empresa';
      else if (rt.restricted) why = 'Restringida: aprobación de gerencia';
      return { rate: rt.code, price: rt.p[t.code], why };
    });
    return { t, av, cells };
  });
}
VIEWS.ltb = () => {
  const L = ui.ltb; const stages = ['search', 'results', 'guest', 'details', 'done']; const si = stages.indexOf(L.stage);
  const names = ['Búsqueda', 'Disponibilidad y tarifa', 'Huésped', 'Detalles y garantía', 'Confirmación'];
  const b = L.blockId ? block(L.blockId) : null; const dep = addDays(L.arr, +L.nights || 1);
  let h = pageHead(L.walkin ? 'Walk-in' : 'Look To Book', L.walkin ? 'Front Desk › Walk In' : 'Bookings › Look To Book',
    L.walkin ? 'Huésped sin reserva que llega hoy: se crea la reserva y se registra en un solo flujo.' : 'Busca disponibilidad, elige tipo de habitación y tarifa, vincula el perfil y confirma.',
    L.stage !== 'search' && L.stage !== 'done' ? btn('Empezar de nuevo', 'ltbReset', {}, 'ghost') : '');
  h += `<ol class="stepper">${names.map((n, i) => `<li class="${i < si ? 'done' : i === si ? 'cur' : ''}"><span>${i + 1}</span>${n}</li>`).join('')}</ol>`;
  if (b) h += `<div class="note info">Reservando dentro del bloque <b>${esc(b.code)} · ${esc(b.name)}</b> (${fd(b.arr)} – ${fd(b.dep)}, tarifa ${money(b.rate)}). La disponibilidad mostrada es la del bloque.</div>`;
  if (L.stage === 'search') {
    h += `<section class="panel" data-tut="ltb-form"><div class="form g4">
      ${fld('Llegada', 'ltb.arr', { type: 'date', min: BD(), dis: L.walkin })}
      ${fld('Noches', 'ltb.nights', { type: 'number', min: 1, max: 30 })}
      ${fld('Adultos', 'ltb.adults', { type: 'number', min: 1, max: 6 })}
      ${fld('Niños', 'ltb.children', { type: 'number', min: 0, max: 4 })}
      ${b ? '' : fld('Empresa (opcional)', 'ltb.det.company', { options: opt(companies(), '— Ninguna —'), help: 'Activa tarifas negociadas (CORP).' })}
      ${b ? '' : fld('Agencia (opcional)', 'ltb.det.ta', { options: opt(agents(), '— Ninguna —') })}
      </div><div class="row end">${btn('Buscar disponibilidad', 'ltbSearch', {}, 'pri', 'data-tut="ltb-search"')}</div></section>`;
  }
  const summary = () => `<div class="sumbar"><div><span>Estancia</span><b>${fd(L.arr)} → ${fd(dep)}</b> · ${L.nights} noche(s)</div><div><span>Personas</span><b>${L.adults} ad. ${+L.children ? '+ ' + L.children + ' niños' : ''}</b></div>${L.sel ? `<div><span>Selección</span><b>${L.sel.type} · ${L.sel.rate}</b> · ${money(L.sel.price)}/noche</div><div><span>Total estancia (con impuestos)</span><b>${money(L.sel.price * (+L.nights) * 1.28)}</b></div>` : ''}${L.guest.profileId ? `<div><span>Huésped</span><b>${esc(pfull(L.guest.profileId))}</b></div>` : ''}</div>`;
  if (L.stage === 'results') {
    const grid = ltbGrid(L); const rates = ltbRates(L);
    h += summary() + `<section class="panel"><div class="ptitle"><h2>Disponibilidad por tipo y tarifa</h2>${btn('Modificar búsqueda', 'ltbBack', { s: 'search' }, 'sm ghost')}</div>
      <p class="hint">Precio por noche antes de impuestos (ITBIS 18% + servicio 10%). Las celdas grises muestran por qué la tarifa no se puede vender.</p>
      <div class="tw"><table class="tbl rates"><thead><tr><th>Tipo de habitación</th><th class="num">Disp.</th>${rates.map(r => `<th title="${esc(r.desc || '')}"><span class="mono">${r.code}</span><small>${esc(r.name)}</small></th>`).join('')}</tr></thead><tbody>
      ${grid.map(row => `<tr><td><b class="mono">${row.t.code}</b> ${esc(row.t.name)}<small class="sub">${row.t.beds} · máx. ${row.t.max} · ${row.t.sqm} m²</small></td><td class="num"><span class="avail ${row.av <= 0 ? 'zero' : row.av <= 2 ? 'low' : ''}">${row.av}</span></td>
        ${row.cells.map(c => c.why ? `<td class="rc off" title="${esc(c.why)}"><span>${money(c.price)}</span><small>${esc(c.why)}</small></td>` : `<td class="rc"><button type="button" class="ratebtn" data-act="ltbPick" data-type="${row.t.code}" data-rate="${c.rate}" data-price="${c.price}" data-tut="cell-${row.t.code}-${c.rate}"><b>${money(c.price)}</b><small>${money(c.price * (+L.nights))} total</small></button></td>`).join('')}</tr>`).join('')}
      </tbody></table></div></section>`;
  }
  if (L.stage === 'guest') {
    const G = L.guest;
    h += summary() + `<section class="panel"><div class="ptitle"><h2>Perfil del huésped</h2>${btn('Volver a tarifas', 'ltbBack', { s: 'results' }, 'sm ghost')}</div>
      <p class="hint">Busca siempre antes de crear: evitar perfiles duplicados conserva el historial y las preferencias del huésped.</p>
      <div class="row">${fld('Buscar por apellido, nombre, correo o teléfono', 'ltb.guest.q', { tut: 'ltb-guest-q', enter: 'ltbFindGuest', cls: 'grow' })}${btn('Buscar', 'ltbFindGuest', {}, 'pri')}${btn('Nuevo perfil', 'ltbNewGuest')}</div>
      ${G.results ? (G.results.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Nombre</th><th>País</th><th>Correo</th><th>VIP</th><th>Estancias</th><th></th></tr></thead><tbody>${G.results.map(id => { const p = profile(id); const st = state.reservations.filter(r => r.profileId === id && r.status === 'CHECKED_OUT').length; return `<tr><td><b>${esc(pname(id))}</b></td><td>${p.country}</td><td>${esc(p.email)}</td><td>${vipChip(id)}</td><td class="num">${st}</td><td>${btn('Seleccionar', 'ltbSelGuest', { id }, 'sm pri', `data-tut="guest-${id}"`)}</td></tr>`; }).join('')}</tbody></table></div>` : empty('Sin coincidencias. Crea un perfil nuevo.')) : ''}
      ${G.isNew ? `<div class="subpanel"><h3>Nuevo perfil individual</h3><div class="form g4">
        ${fld('Tratamiento', 'ltb.guest.title', { options: { '': '—', 'Sr.': 'Sr.', 'Sra.': 'Sra.', 'Srta.': 'Srta.', 'Dr.': 'Dr.', 'Dra.': 'Dra.', 'Mr.': 'Mr.', 'Ms.': 'Ms.' } })}
        ${fld('Nombre *', 'ltb.guest.first')}${fld('Apellido *', 'ltb.guest.last')}${fld('País', 'ltb.guest.country', { options: COUNTRIES })}
        ${fld('Correo', 'ltb.guest.email', { type: 'email' })}${fld('Teléfono', 'ltb.guest.phone')}${fld('Documento', 'ltb.guest.idType', { options: { 'Cédula': 'Cédula', 'Pasaporte': 'Pasaporte', 'Licencia': 'Licencia' } })}${fld('N.º de documento', 'ltb.guest.idNo')}
        </div><div class="row end">${btn('Crear perfil y continuar', 'ltbCreateGuest', {}, 'pri')}</div></div>` : ''}
    </section>`;
  }
  if (L.stage === 'details') {
    const D = L.det; const t = D.upgrade || L.sel.type;
    const free = L.walkin ? state.rooms.filter(x => x.type === t && x.fo === 'VAC' && !x.oos && ['CL', 'IP'].includes(hkShown(x)) && roomFree(x.no, L.arr, dep)) : [];
    h += summary() + `<section class="panel" data-tut="ltb-details"><div class="ptitle"><h2>Garantía, pago y detalles</h2>${btn('Cambiar huésped', 'ltbBack', { s: 'guest' }, 'sm ghost')}</div>
      <div class="form g4">
        ${fld('Tipo de garantía', 'ltb.det.g', { options: L.walkin ? { CC: GUAR.CC, DEP: GUAR.DEP } : GUAR, rr: 1 })}
        ${fld('Método de pago', 'ltb.det.pay', { options: payOpts(), rr: 1 })}
        ${PAY[D.pay]?.card ? fld('Número de tarjeta', 'ltb.det.card', { ph: '4111 1111 1111 1111', tut: 'ltb-card' }) + fld('Vence (MM/AA)', 'ltb.det.exp', { ph: '08/28' }) : ''}
        ${fld('Empresa', 'ltb.det.company', { options: opt(companies(), '— Ninguna —') })}
        ${fld('Agencia de viajes', 'ltb.det.ta', { options: opt(agents(), '— Ninguna —') })}
        ${fld('Código de mercado', 'ltb.det.market', { options: opt(MARKETS, 'Según tarifa') })}
        ${fld('Código de origen', 'ltb.det.source', { options: SOURCES })}
        ${L.blockId ? '' : fld('Upgrade: tipo físico (opcional)', 'ltb.det.upgrade', { options: opt(rtOpts(), `Sin upgrade (${L.sel.type})`), rr: 1, help: 'Se cobra la tarifa del tipo elegido (RTC) y se asigna otro tipo.' })}
        ${L.walkin ? fld('Habitación (vacía y limpia)', 'ltb.det.room', { options: opt(Object.fromEntries(free.map(x => [x.no, `${x.no} · ${HKS[hkShown(x)]} · ${x.feat}`])), free.length ? '— Elige —' : 'No hay habitaciones listas de este tipo'), tut: 'ltb-room' }) : ''}
      </div>
      <h3 class="h3">Solicitudes especiales (Specials)</h3>${checks('ltb.det.specials', SPECIALS)}
      <div class="form g2">${fld('Comentarios de la reserva', 'ltb.det.comments', { type: 'textarea' })}${fld('Alerta al check-in (opcional)', 'ltb.det.alert', { type: 'textarea', ph: 'Ej.: entregar paquete de bienvenida' })}</div>
      <div class="note">${D.g === '6PM' ? 'Una reserva 6PM sin garantía se libera si el huésped no llega antes de las 18:00 y no genera cargo de no-show.' : D.g === 'CO' ? 'Garantía de empresa: requiere elegir la empresa. Con pago Direct Bill, habitación e impuestos se enrutan automáticamente a la ventana 2 de la empresa.' : 'Garantizada: si el huésped no llega, la auditoría puede cobrar una noche de no-show.'} Cancelación de la tarifa <b>${L.sel.rate}</b>: ${esc(rateDef(L.sel.rate)?.cancel || 'según contrato de grupo')}.</div>
      <div class="row end">${btn(L.walkin ? 'Crear reserva y hacer check-in' : 'Confirmar reserva', 'ltbConfirm', {}, 'pri', 'data-tut="ltb-confirm"')}</div></section>`;
  }
  if (L.stage === 'done') {
    const r = resById(L.resId);
    h += `<section class="panel done" data-tut="ltb-conf"><div class="eyebrow">${r.status === 'CHECKED_IN' ? 'Check-in completado' : 'Reserva confirmada'}</div>
      <h2>Confirmación <span class="mono big">${r.conf}</span></h2>
      <p>${esc(pfull(r.profileId))} · ${roomTypeName(r.roomType)}${r.rtc !== r.roomType ? ` (cobra ${r.rtc})` : ''} · ${fd(r.arr)} → ${fd(r.dep)} · ${r.rate} ${money(r.amount)}/noche${r.room ? ` · Habitación <b>${r.room}</b>` : ''}</p>
      <p class="hint">Da siempre el número de confirmación al huésped. Es la forma más rápida de encontrar la reserva.</p>
      <div class="row">${btn('Ver reserva', 'openRes', { id: r.id }, 'pri')}${btn('Nueva reserva', 'ltbReset')}${r.status === 'CHECKED_IN' ? btn('Abrir folio', 'openBill', { id: r.id }) : ''}</div></section>`;
  }
  return h;
};
A.ltbReset = () => { const w = ui.ltb.walkin; ui.ltb = freshLtb(); if (w) { ui.ltb.walkin = true; ui.ltb.det.source = 'WLK'; } };
A.ltbBack = d => { ui.ltb.stage = d.s; };
A.ltbSearch = () => {
  const L = ui.ltb;
  if (!L.arr || L.arr < BD()) fail(`La llegada no puede ser anterior a la fecha de negocio (${fd(BD())}).`);
  if (!(+L.nights >= 1 && +L.nights <= 30)) fail('Las noches deben estar entre 1 y 30.');
  if (!(+L.adults >= 1)) fail('Debe haber al menos 1 adulto.');
  if (L.walkin && L.arr !== BD()) L.arr = BD();
  if (L.blockId) { const b = block(L.blockId); if (L.arr < b.arr || addDays(L.arr, +L.nights) > b.dep) fail(`Las fechas deben estar dentro del bloque (${fd(b.arr)} – ${fd(b.dep)}).`); }
  L.stage = 'results';
};
A.ltbPick = d => { const L = ui.ltb; L.sel = { type: d.type, rate: d.rate, price: +d.price }; L.stage = L.guest.profileId ? 'details' : 'guest'; };
A.ltbFindGuest = () => {
  const G = ui.ltb.guest; const q = G.q.trim().toLowerCase(); if (q.length < 2) fail('Escribe al menos 2 letras.');
  G.results = state.profiles.filter(p => p.type === 'IND' && [p.first, p.last, p.first + ' ' + p.last, p.email, p.phone].some(x => (x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q.normalize('NFD').replace(/[̀-ͯ]/g, '')))).map(p => p.id);
  G.searched = true;
};
A.ltbSelGuest = d => { const L = ui.ltb; L.guest.profileId = d.id; const p = profile(d.id); if (p.companyId && !L.det.company) L.det.company = p.companyId; L.stage = 'details'; };
A.ltbNewGuest = () => { const G = ui.ltb.guest; G.isNew = true; if (G.q && !G.last) G.last = G.q.charAt(0).toUpperCase() + G.q.slice(1); };
A.ltbCreateGuest = () => {
  const G = ui.ltb.guest; if (!G.first.trim() || !G.last.trim()) fail('Nombre y apellido son obligatorios.');
  const p = newProfile({ title: G.title, first: G.first.trim(), last: G.last.trim(), email: G.email, phone: G.phone, country: G.country, idType: G.idType, idNo: G.idNo });
  log(`Perfil creado: ${pname(p.id)}`); G.profileId = p.id; G.isNew = false; ui.ltb.stage = 'details';
};
A.ltbConfirm = () => {
  const L = ui.ltb, D = L.det, dep = addDays(L.arr, +L.nights); const t = D.upgrade || L.sel.type;
  if (!L.guest.profileId) fail('Falta el perfil del huésped.');
  if (D.g === 'CC' && !PAY[D.pay]?.card) fail('La garantía CC requiere un método de pago con tarjeta (VA, MC o AX).');
  if (PAY[D.pay]?.card && D.card.replace(/\D/g, '').length < 13) fail('Escribe un número de tarjeta válido (13 a 16 dígitos).');
  if (D.g === 'CO' && !D.company) fail('La garantía por empresa requiere elegir la empresa.');
  if (D.pay === 'DB' && !(D.company && profile(D.company).ar)) fail('Direct Bill requiere una empresa con cuenta AR (City Ledger).');
  if (rateDef(L.sel.rate)?.needsCompany && !D.company) fail('La tarifa CORP requiere vincular la empresa.');
  if (D.upgrade && D.upgrade !== L.sel.type && minAvail(D.upgrade, L.arr, dep) < 1) fail(`No hay disponibilidad de ${D.upgrade} para el upgrade.`);
  const av = L.blockId ? minAvail(t, L.arr, dep, { blockId: L.blockId }) : minAvail(t, L.arr, dep);
  if (av < 1) fail('Ya no hay disponibilidad para esta selección. Vuelve a buscar.');
  if (L.walkin) { if (!D.room) fail('Elige la habitación para el walk-in.'); }
  const r = mkRes({
    p: L.guest.profileId, arr: L.arr, dep, type: t, rtc: L.sel.type, rate: L.blockId ? undefined : L.sel.rate, blockId: L.blockId || null,
    adults: +L.adults, children: +L.children, g: D.g, pay: D.pay, card: PAY[D.pay]?.card ? cardMask(D.card) : '', exp: D.exp,
    company: D.company || null, ta: D.ta || null, market: D.market || undefined, source: D.source, specials: [...D.specials], comments: D.comments,
    alerts: D.alert ? [{ area: 'CI', text: D.alert }] : [],
  });
  if (D.pay === 'DB') { r.routing = [{ codes: ['1000', '1010', '1020'], window: 2 }]; r.windows[2] = { payee: D.company }; }
  log(`Reserva creada conf. ${r.conf}: ${pname(r.profileId)} ${r.roomType} ${r.rate} ${fd(r.arr)}–${fd(r.dep)}`, r);
  if (L.walkin) { try { DO.assignRoom(r, D.room); DO.checkIn(r); } catch (e) { r.status = 'CANCELLED'; r.cancelNo = String(++state.seq.cxl); r.cxlDate = BD(); r.cxlReason = 'Walk-in no completado'; throw e; } }
  L.resId = r.id; L.stage = 'done'; toast(L.walkin ? `Walk-in registrado en la ${r.room}` : `Reserva ${r.conf} confirmada`, 'good');
};

/* ---------- Gestionar reservas ---------- */
VIEWS.search = () => {
  const S = ui.search; const q = S.q.trim().toLowerCase();
  let list = state.reservations.filter(r => {
    if (q && !(pname(r.profileId).toLowerCase().includes(q) || r.conf.includes(q) || (r.room || '').includes(q) || (r.cancelNo || '').includes(q))) return false;
    if (S.arr && r.arr !== S.arr) return false;
    if (S.status === 'ACTIVE') return isActive(r);
    if (S.status && S.status !== 'ALL') return r.status === S.status;
    return true;
  }).sort((a, b) => a.arr.localeCompare(b.arr));
  return pageHead('Gestionar reservas', 'Bookings › Manage Reservation', 'Busca por nombre, confirmación, habitación o número de cancelación.', btn('Nueva reserva', 'go', { v: 'ltb' }, 'pri'))
    + `<section class="panel"><div class="form g4">${fld('Nombre, conf., hab. o cancelación', 'search.q', { enter: 'noop' })}${fld('Estado', 'search.status', { options: { ACTIVE: 'Activas (reservadas y en casa)', RESERVED: 'RESERVED', CHECKED_IN: 'CHECKED IN', CHECKED_OUT: 'CHECKED OUT', CANCELLED: 'CANCELLED', NO_SHOW: 'NO SHOW', ALL: 'Todas' }, rr: 1 })}${fld('Fecha de llegada', 'search.arr', { type: 'date', rr: 1 })}<div class="fld"><span>&nbsp;</span>${btn('Buscar', 'noop', {}, 'pri')}</div></div></section>
    <section class="panel"><div class="ptitle"><h2>${list.length} resultado(s)</h2></div>${list.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Conf.</th><th>Huésped</th><th>Llegada</th><th>Salida</th><th>Tipo</th><th>Hab.</th><th>Tarifa</th><th>Estado</th></tr></thead><tbody>
    ${list.map(r => `<tr class="click" data-act="openRes" data-id="${r.id}"><td class="mono">${r.conf}</td><td>${guestCell(r)}</td><td>${fd(r.arr)}</td><td>${fd(r.dep)}</td><td>${r.roomType}</td><td class="mono">${r.room || '—'}</td><td>${r.rate}</td><td>${stChip(r)}</td></tr>`).join('')}
    </tbody></table></div>` : empty('No hay reservas con esos criterios.')}</section>`;
};
A.noop = () => {};
A.quickSearch = () => { ui.search.status = 'ALL'; ui.view = 'search'; };

/* ---------- Detalle de reserva ---------- */
VIEWS.resv = () => {
  const r = resById(ui.param); if (!r) return empty('Reserva no encontrada.');
  const p = profile(r.profileId); const st = r.status; const n = diffDays(r.arr, r.dep);
  const acts = [];
  if (st === 'RESERVED') { acts.push(btn('Editar', 'mOpen', { k: 'edit', id: r.id })); acts.push(btn(r.room ? 'Cambiar hab.' : 'Asignar hab.', 'mOpen', { k: 'assign', id: r.id }, '', 'data-tut="res-assign"')); if (r.arr === BD()) acts.push(btn('Check In', 'mOpen', { k: 'checkin', id: r.id }, 'pri', 'data-tut="res-checkin"')); acts.push(btn('Cancelar', 'mOpen', { k: 'cancel', id: r.id }, 'danger')); }
  if (st === 'CHECKED_IN') { acts.push(btn('Folio / Billing', 'openBill', { id: r.id }, 'pri')); acts.push(btn('Editar', 'mOpen', { k: 'edit', id: r.id })); acts.push(btn('Room Move', 'mOpen', { k: 'move', id: r.id })); }
  if (['CANCELLED', 'NO_SHOW'].includes(st)) acts.push(btn('Reactivar (Reinstate)', 'reinstate', { id: r.id }));
  if (st === 'CHECKED_OUT') acts.push(btn('Ver folio', 'mOpen', { k: 'invoice', id: r.id }));
  if (r.folio.length && st !== 'CHECKED_OUT' && st !== 'CHECKED_IN') acts.push(btn('Folio', 'openBill', { id: r.id }));
  const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  return pageHead(pfull(r.profileId), `Reserva ${r.conf}`, `${stChip(r)} ${vipChip(r.profileId)} ${r.blockId ? chip('BLOQUE ' + block(r.blockId).code, 'neutral') : ''}`, acts.join(''))
    + `${r.alerts.length && st === 'RESERVED' ? `<div class="note warn"><b>Alertas de check-in:</b> ${r.alerts.map(a => esc(a.text)).join(' · ')}</div>` : ''}
    <div class="grid3">
      <section class="panel"><h2>Estancia</h2>${kv('Llegada', `${fd(r.arr)} <small>${dow(r.arr)}</small>`)}${kv('Salida', `${fd(r.dep)} <small>${dow(r.dep)}</small>`)}${kv('Noches', n)}${kv('Personas', `${r.adults} ad. / ${r.children} niños`)}${kv('Tipo de habitación', `${r.roomType} · ${roomTypeName(r.roomType)}`)}${kv('Tipo a cobrar (RTC)', r.rtc)}${kv('Habitación', r.room ? `<span class="mono">${r.room}</span> ${hkChip(room(r.room))}` : '<em>Sin asignar</em>')}</section>
      <section class="panel"><h2>Tarifa y pago</h2>${kv('Código de tarifa', `${r.rate} <small>${esc(r.rate === 'GRP' ? 'Grupo' : rateDef(r.rate)?.name || '')}</small>`)}${kv('Monto por noche', money(r.amount) + (r.fixed ? ' <small>(fijada manualmente)</small>' : ''))}${kv('Total estimado c/imp.', money(nightTotal(r) * n))}${kv('Garantía', esc(GUAR[r.guarantee]))}${kv('Pago', `${r.pay ? esc(PAY[r.pay].name) : '<em>Sin método</em>'} ${esc(r.card)}`)}${kv('Saldo del folio', `<span class="mono">${money(balance(r))}</span>`)}${kv('Mercado / Origen', `${r.market} / ${r.source}`)}</section>
      <section class="panel"><h2>Perfiles vinculados</h2>${kv('Huésped', `<a href="#" class="lnk" data-act="openProfile" data-id="${p.id}">${esc(pname(p.id))}</a>`)}${kv('País / idioma', `${esc(COUNTRIES[p.country] || p.country)} / ${p.lang}`)}${kv('Contacto', `${esc(p.email)}<br>${esc(p.phone)}`)}${kv('Empresa', r.companyId ? `<a href="#" class="lnk" data-act="openProfile" data-id="${r.companyId}">${esc(pname(r.companyId))}</a>` : '—')}${kv('Agencia', r.taId ? esc(pname(r.taId)) : '—')}${p.notes ? `<div class="note small">${esc(p.notes)}</div>` : ''}</section>
    </div>
    <div class="grid3">
      <section class="panel"><div class="ptitle"><h2>Specials y comentarios</h2>${st !== 'CHECKED_OUT' ? btn('Editar', 'mOpen', { k: 'edit', id: r.id }, 'sm ghost') : ''}</div>${r.specials.length ? `<div class="tags">${r.specials.map(s => chip(s + ' · ' + SPECIALS[s], 'neutral')).join('')}</div>` : '<p class="hint">Sin solicitudes especiales.</p>'}${r.comments ? `<p>${esc(r.comments)}</p>` : ''}${r.cancelNo ? `<div class="note bad">Cancelación <b class="mono">${r.cancelNo}</b> del ${fd(r.cxlDate)}: ${esc(r.cxlReason)}</div>` : ''}</section>
      <section class="panel"><div class="ptitle"><h2>Alertas</h2>${btn('Añadir', 'mOpen', { k: 'alert', id: r.id }, 'sm ghost')}</div>${r.alerts.length ? r.alerts.map((a, i) => `<div class="li"><span>${chip(a.area === 'CI' ? 'CHECK-IN' : 'CHECK-OUT', 'warn')} ${esc(a.text)}</span>${btn('Quitar', 'delAlert', { id: r.id, i }, 'sm ghost')}</div>`).join('') : '<p class="hint">Las alertas aparecen como ventana emergente al hacer check-in o check-out.</p>'}</section>
      <section class="panel"><div class="ptitle"><h2>Traces</h2>${btn('Añadir', 'mOpen', { k: 'trace', id: r.id }, 'sm ghost', 'data-tut="res-trace"')}</div>${r.traces.length ? r.traces.map((t, i) => `<div class="li ${t.done ? 'done' : ''}"><span>${chip(t.dept, 'info', DEPTS[t.dept])} <b>${fd(t.date)}</b> ${esc(t.text)}</span>${t.done ? chip('Resuelto', 'good') : btn('Resolver', 'resolveTrace', { id: r.id, i }, 'sm ghost')}</div>`).join('') : '<p class="hint">Los traces son tareas para un departamento en una fecha (p. ej. HK: cuna para el día de llegada).</p>'}</section>
    </div>
    <section class="panel"><h2>Historial de cambios</h2>${r.history.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>Acción</th></tr></thead><tbody>${r.history.map(e => `<tr><td>${fd(e.d)}</td><td class="mono">${e.t}</td><td>${e.u}</td><td>${esc(e.txt)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">Sin cambios registrados.</p>'}</section>`;
};
A.openRes = d => { ui.view = 'resv'; ui.param = d.id; ui.modal = null; };
A.reinstate = d => { DO.reinstate(resById(d.id)); toast('Reserva reactivada', 'good'); };
A.delAlert = d => { const r = resById(d.id); r.alerts.splice(+d.i, 1); log('Alerta eliminada', r); };
A.resolveTrace = d => { const r = resById(d.id); r.traces[+d.i].done = true; log(`Trace ${r.traces[+d.i].dept} resuelto`, r); };

/* ---------- Llegadas / En casa / Salidas ---------- */
VIEWS.arrivals = () => {
  const S = ui.arrivals; const q = S.q.toLowerCase();
  const list = state.reservations.filter(r => r.arr === BD() && (r.status === 'RESERVED' || (S.all && ['CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW', 'CANCELLED'].includes(r.status))) && (!q || pname(r.profileId).toLowerCase().includes(q) || r.conf.includes(q)))
    .sort((a, b) => (profile(b.profileId).vip || '').localeCompare(profile(a.profileId).vip || '') || pname(a.profileId).localeCompare(pname(b.profileId)));
  return pageHead('Llegadas', 'Front Desk › Arrivals', `Llegadas del ${fd(BD())}. Asigna habitación y registra el check-in. Las VIP aparecen primero.`, btn('Walk-in', 'go', { v: 'walkin' }))
    + `<section class="panel"><div class="row">${fld('Buscar', 'arrivals.q', { enter: 'noop', cls: 'grow' })}<label class="ck inline"><input type="checkbox" data-bind="arrivals.all" data-rr${S.all ? ' checked' : ''}> Incluir ya registrados / no-show</label></div>
    ${list.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Conf.</th><th>Huésped</th><th>Tipo</th><th>Hab.</th><th>Estado hab.</th><th>Tarifa</th><th class="num">Noches</th><th>Garantía</th><th>Specials</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map(r => { const rm = r.room ? room(r.room) : null; return `<tr data-tut="arr-row-${r.id}"><td class="mono">${resLink(r)}</td><td>${guestCell(r)}</td><td>${r.roomType}${r.rtc !== r.roomType ? `<small class="sub">RTC ${r.rtc}</small>` : ''}</td><td class="mono">${r.room || '—'}</td><td>${rm ? hkChip(rm) : ''}</td><td>${r.rate}</td><td class="num">${diffDays(r.arr, r.dep)}</td><td>${r.guarantee}</td><td>${r.specials.join(' ')}</td><td>${stChip(r)}</td>
      <td class="acts">${r.status === 'RESERVED' ? btn(r.room ? 'Cambiar' : 'Asignar', 'mOpen', { k: 'assign', id: r.id }, 'sm', `data-tut="assign-${r.id}"`) + btn('Check In', 'mOpen', { k: 'checkin', id: r.id }, 'sm pri', `data-tut="ci-${r.id}"`) : ''}</td></tr>`; }).join('')}
    </tbody></table></div>` : empty('No hay llegadas pendientes para hoy.')}</section>`;
};
VIEWS.inhouse = () => {
  const q = ui.inhouse.q.toLowerCase();
  const list = state.reservations.filter(r => r.status === 'CHECKED_IN' && (!q || pname(r.profileId).toLowerCase().includes(q) || r.room.includes(q))).sort((a, b) => a.room.localeCompare(b.room));
  return pageHead('Huéspedes en casa', 'Front Desk › In House', `${list.length} habitaciones ocupadas. Desde aquí abres el folio, cambias de habitación o extiendes la estancia.`)
    + `<section class="panel"><div class="row">${fld('Buscar nombre o habitación', 'inhouse.q', { enter: 'noop', cls: 'grow' })}</div>
    ${list.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Hab.</th><th>Huésped</th><th>Llegada</th><th>Salida</th><th>Tarifa</th><th class="num">Por noche</th><th class="num">Saldo</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map(r => `<tr><td class="mono b">${r.room}</td><td>${guestCell(r)}</td><td>${fd(r.arr)}</td><td>${fd(r.dep)}</td><td>${r.rate}</td><td class="num mono">${money(r.amount)}</td><td class="num mono">${money(balance(r))}</td><td>${stChip(r)}</td><td class="acts">${btn('Folio', 'openBill', { id: r.id }, 'sm pri', `data-tut="ih-folio-${r.id}"`)}${btn('Ver', 'openRes', { id: r.id }, 'sm')}</td></tr>`).join('')}
    </tbody></table></div>` : empty('No hay huéspedes en casa.')}</section>`;
};
VIEWS.departures = () => {
  const q = ui.deps.q.toLowerCase();
  const list = state.reservations.filter(r => ((r.status === 'CHECKED_IN' && r.dep <= BD()) || (r.status === 'CHECKED_OUT' && r.coDate === BD())) && (!q || pname(r.profileId).toLowerCase().includes(q) || r.room.includes(q))).sort((a, b) => a.status.localeCompare(b.status) || a.room.localeCompare(b.room));
  return pageHead('Salidas', 'Front Desk › Departures', 'Huéspedes con salida hoy (Due Out) y los que ya salieron. Para salir, cada ventana del folio debe quedar en $0.00.')
    + `<section class="panel"><div class="row">${fld('Buscar', 'deps.q', { enter: 'noop', cls: 'grow' })}</div>
    ${list.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Hab.</th><th>Huésped</th><th>Llegada</th><th>Salida</th><th>Pago</th><th class="num">Saldo</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map(r => `<tr data-tut="dep-row-${r.id}"><td class="mono b">${r.room}</td><td>${guestCell(r)}</td><td>${fd(r.arr)}</td><td>${fd(r.dep)}</td><td>${r.pay}</td><td class="num mono">${money(balance(r))}</td><td>${stChip(r)}</td><td class="acts">${r.status === 'CHECKED_IN' ? btn('Check Out', 'openBill', { id: r.id }, 'sm pri', `data-tut="co-${r.id}"`) : btn('Ver folio', 'mOpen', { k: 'invoice', id: r.id }, 'sm')}</td></tr>`).join('')}
    </tbody></table></div>` : empty('No hay salidas para hoy.')}
    <p class="hint">¿Huésped que se va antes de su fecha de salida? Ábrelo desde En casa, liquida el folio y haz el check-out: el sistema lo registra como salida anticipada.</p></section>`;
};

/* ---------- Facturación ---------- */
VIEWS.billing = () => {
  if (ui.param && resById(ui.param) && ui.billFor === ui.param) return billingFolio(resById(ui.param));
  const q = ui.billq.toLowerCase();
  const list = state.reservations.filter(r => (r.status === 'CHECKED_IN' || (r.status === 'RESERVED' && r.folio.length)) && (!q || pname(r.profileId).toLowerCase().includes(q) || (r.room || '').includes(q)));
  return pageHead('Facturación', 'Financials › Billing', 'Elige un huésped en casa para abrir su folio. También aparecen reservas futuras con depósitos.')
    + `<section class="panel"><div class="row">${fld('Buscar nombre o habitación', 'billq', { enter: 'noop', cls: 'grow' })}</div><div class="tw"><table class="tbl"><thead><tr><th>Hab.</th><th>Huésped</th><th>Estado</th><th class="num">Saldo</th><th></th></tr></thead><tbody>
    ${list.map(r => `<tr><td class="mono">${r.room || '—'}</td><td>${guestCell(r)}</td><td>${stChip(r)}</td><td class="num mono">${money(balance(r))}</td><td>${btn('Abrir folio', 'openBill', { id: r.id }, 'sm pri')}</td></tr>`).join('')}</tbody></table></div></section>`;
};
A.openBill = d => { ui.view = 'billing'; ui.param = d.id; ui.billFor = d.id; ui.bill.sel = []; ui.modal = null; };
function billingFolio(r) {
  const ws = windowsUsed(r); const bal = balance(r);
  const st = r.status;
  const acts = st === 'CHECKED_IN' || st === 'RESERVED' ? [btn('Postear cargo', 'mOpen', { k: 'post', id: r.id }, '', 'data-tut="bill-post"'), btn('Pago', 'mOpen', { k: 'pay', id: r.id }, '', 'data-tut="bill-pay"'), btn('Ajuste', 'mOpen', { k: 'adjust', id: r.id }, '', 'data-tut="bill-adjust"'), btn('Routing', 'mOpen', { k: 'routing', id: r.id }, '', 'data-tut="bill-routing"'), btn('Transferir marcados', 'mOpen', { k: 'transfer', id: r.id }, '', 'data-tut="bill-transfer"')] : [];
  if (st === 'CHECKED_IN') acts.push(btn('Check Out', 'mOpen', { k: 'checkout', id: r.id }, 'pri', 'data-tut="bill-checkout"'));
  if (st === 'CHECKED_OUT') acts.push(btn('Ver factura', 'mOpen', { k: 'invoice', id: r.id }, 'pri'));
  return pageHead(`Folio · ${pfull(r.profileId)}`, `Financials › Billing · Conf. ${r.conf}`, `Hab. <b class="mono">${r.room || '—'}</b> · ${fd(r.arr)} → ${fd(r.dep)} · ${r.rate} ${money(r.amount)} · ${stChip(r)} · Saldo total <b class="mono">${money(bal)}</b>`, btn('Ver reserva', 'openRes', { id: r.id }, 'ghost'))
    + `<div class="toolbar">${acts.join('')}</div>
    ${r.routing.length ? `<div class="note info"><b>Routing activo:</b> ${r.routing.map(rt => `${rt.codes.join(', ')} → ventana ${rt.window} (${esc(pname(r.windows[rt.window]?.payee))})`).join(' · ')}</div>` : ''}
    <div class="windows">${ws.map(w => { const items = r.folio.filter(p => p.window === w); const b = balance(r, w); return `<section class="panel win" data-tut="win-${w}"><div class="ptitle"><h2>Ventana ${w}</h2><span class="payee">Pagador: <b>${esc(pname(r.windows[w]?.payee || r.profileId))}</b></span></div>
      ${items.length ? `<div class="tw"><table class="tbl compact folio"><thead><tr><th></th><th>Fecha</th><th>Código</th><th>Descripción</th><th class="num">Cargo</th><th class="num">Crédito</th></tr></thead><tbody>
      ${items.map(p => `<tr><td><input type="checkbox" aria-label="Marcar" data-bindarr="bill.sel" value="${p.id}"${ui.bill.sel.includes(String(p.id)) ? ' checked' : ''}></td><td>${fd(p.date)}</td><td class="mono">${p.code}</td><td>${esc(p.desc)}${p.ref ? `<small class="sub">${esc(p.ref)}</small>` : ''}</td><td class="num mono">${p.amount > 0 ? money(p.amount) : ''}</td><td class="num mono">${p.amount < 0 ? money(-p.amount) : ''}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="hint">Ventana vacía.</p>'}
      <div class="wbal ${Math.abs(b) < 0.005 ? 'zero' : b < 0 ? 'credit' : ''}"><span>Saldo ventana ${w}</span><b class="mono">${money(b)}</b></div></section>`; }).join('')}</div>`;
}
A.openInvoice = d => { ui.modal = { k: 'invoice', id: d.id }; };

/* ---------- Room Diary ---------- */
VIEWS.diary = () => {
  const start = ui.diary.start || BD(); const days = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  const rows = state.rooms.map(rm => {
    let cells = ''; let i = 0;
    while (i < days.length) {
      const d = days[i];
      const r = state.reservations.find(x => x.room === rm.no && ['RESERVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(x.status) && x.arr <= d && d < x.dep);
      if (r) { let span = 1; while (i + span < days.length && days[i + span] < r.dep) span++; cells += `<td colspan="${span}" class="seg"><button type="button" class="bar st-${r.status}" data-act="openRes" data-id="${r.id}" title="${esc(pname(r.profileId))} · ${r.conf} · ${fd(r.arr)}–${fd(r.dep)}">${esc(pname(r.profileId))}</button></td>`; i += span; continue; }
      if (isOOO(rm, d)) { let span = 1; while (i + span < days.length && isOOO(rm, days[i + span])) span++; cells += `<td colspan="${span}" class="seg"><span class="bar ooo" title="${esc(rm.ooo.reason)}">OOO · ${esc(rm.ooo.reason)}</span></td>`; i += span; continue; }
      cells += `<td class="${d === BD() ? 'today' : ''}"></td>`; i++;
    }
    return `<tr><th class="rmh"><span class="mono">${rm.no}</span> <small>${rm.type}</small> ${hkChip(rm)}</th>${cells}</tr>`;
  }).join('');
  const availRows = CFG.roomTypes.map(t => `<tr class="avr"><th>${t.code} disponibles</th>${days.map(d => { const a = avail(t.code, d); return `<td class="num ${a <= 0 ? 'neg' : a <= 2 ? 'low' : ''}">${a}</td>`; }).join('')}</tr>`).join('');
  const unassigned = state.reservations.filter(r => r.status === 'RESERVED' && !r.room && r.arr < days[13] && r.dep > start).sort((a, b) => a.arr.localeCompare(b.arr));
  return pageHead('Room Diary', 'Bookings › Room Diary', 'Habitaciones (filas) por noche (columnas). Toca una barra para abrir la reserva.', btn('◀ 7 días', 'diaryNav', { n: -7 }, 'ghost') + btn('Hoy', 'diaryNav', { n: 0 }, 'ghost') + btn('7 días ▶', 'diaryNav', { n: 7 }, 'ghost'))
    + `<div class="legend">${chip('RESERVED', 'info')}${chip('IN HOUSE', 'good')}${chip('CHECKED OUT', 'muted')}${chip('OOO', 'violet')}</div>
    <section class="panel"><div class="tw diary"><table class="dtbl"><thead><tr><th>Habitación</th>${days.map(d => `<th class="${d === BD() ? 'today' : ''}"><small>${dow(d)}</small>${d.slice(8)}/${d.slice(5, 7)}</th>`).join('')}</tr></thead><tbody>${availRows}${rows}</tbody></table></div></section>
    <section class="panel"><h2>Reservas sin habitación asignada (${unassigned.length})</h2>${unassigned.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Conf.</th><th>Huésped</th><th>Llegada</th><th>Salida</th><th>Tipo</th><th></th></tr></thead><tbody>${unassigned.map(r => `<tr><td class="mono">${resLink(r)}</td><td>${guestCell(r)}</td><td>${fd(r.arr)}</td><td>${fd(r.dep)}</td><td>${r.roomType}</td><td>${btn('Asignar', 'mOpen', { k: 'assign', id: r.id }, 'sm')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">Todas las reservas del periodo tienen habitación.</p>'}</section>`;
};
A.diaryNav = d => { ui.diary.start = +d.n === 0 ? BD() : addDays(ui.diary.start || BD(), +d.n); };

/* ---------- Housekeeping ---------- */
VIEWS.hk = () => {
  const H = ui.hk; const cnt = s => state.rooms.filter(x => hkShown(x) === s).length;
  const list = state.rooms.filter(x => (!H.filter || (H.filter === 'VAC' ? x.fo === 'VAC' : H.filter === 'OCC' ? x.fo === 'OCC' : hkShown(x) === H.filter)) && (!H.floor || String(x.floor) === H.floor) && (!H.type || x.type === H.type));
  const fchip = (k, label, n) => `<button type="button" class="fchip ${H.filter === k ? 'on' : ''}" data-act="hkFilter" data-f="${k}" data-tut="hkf-${k || 'ALL'}">${label}<b>${n}</b></button>`;
  return pageHead('Housekeeping', 'Inventory › Housekeeping', 'Estado de limpieza (HK) y estado de recepción (FO) de cada habitación. Toca una habitación para cambiar su estado.')
    + `<div class="fchips">${fchip('', 'Todas', state.rooms.length)}${fchip('CL', 'Limpias', cnt('CL'))}${fchip('DI', 'Sucias', cnt('DI'))}${fchip('IP', 'Inspeccionadas', cnt('IP'))}${fchip('PU', 'Pickup', cnt('PU'))}${fchip('OOO', 'OOO', cnt('OOO'))}${fchip('OOS', 'OOS', cnt('OOS'))}${fchip('VAC', 'Vacías', state.rooms.filter(x => x.fo === 'VAC').length)}${fchip('OCC', 'Ocupadas', state.rooms.filter(x => x.fo === 'OCC').length)}</div>
    <div class="row">${fld('Piso', 'hk.floor', { options: { '': 'Todos', 1: 'Piso 1', 2: 'Piso 2', 3: 'Piso 3', 4: 'Piso 4' }, rr: 1 })}${fld('Tipo', 'hk.type', { options: opt(rtOpts(), 'Todos'), rr: 1 })}</div>
    <div class="hkgrid">${list.map(rm => { const s = hkShown(rm); const occ = occupant(rm.no); const arr = state.reservations.find(r => r.status === 'RESERVED' && r.room === rm.no && r.arr === BD()); return `<button type="button" class="hkt hk-${s}" data-act="mOpen" data-k="hkroom" data-id="${rm.no}" data-tut="hk-${rm.no}">
      <span class="hkn mono">${rm.no}</span><span class="hkty">${rm.type}</span><span class="hks">${s} · ${rm.fo}</span>
      <span class="hkg">${occ ? esc(pname(occ.profileId)) + (occ.dep <= BD() ? ' · <b>SALE HOY</b>' : '') : arr ? 'Llegada: ' + esc(pname(arr.profileId)) : rm.ooo && s === 'OOO' ? esc(rm.ooo.reason) : rm.oos ? esc(rm.oos.reason) : '&nbsp;'}</span></button>`; }).join('')}</div>
    <p class="hint">Regla: recepción solo puede hacer check-in en habitaciones <b>vacías</b> y <b>Limpias (CL)</b> o <b>Inspeccionadas (IP)</b>. En la auditoría nocturna, las habitaciones ocupadas pasan a Sucias (DI) para el servicio del día siguiente.</p>`;
};
A.hkFilter = d => { ui.hk.filter = d.f; };

/* ---------- Perfiles ---------- */
VIEWS.profiles = () => {
  const P = ui.profiles; const q = P.q.toLowerCase();
  const list = state.profiles.filter(p => (!P.type || p.type === P.type) && (!q || [pname(p.id), p.email, p.phone, p.ar, p.iata].some(x => (x || '').toLowerCase().includes(q))));
  const T = { IND: 'Individual', COM: 'Empresa', TA: 'Agencia' };
  return pageHead('Perfiles', 'Client Relations › Profiles', 'Huéspedes, empresas y agencias. El perfil guarda datos, preferencias e historial de estancias.', btn('Nuevo perfil', 'mOpen', { k: 'profile', id: '' }, 'pri'))
    + `<section class="panel"><div class="form g4">${fld('Buscar', 'profiles.q', { enter: 'noop' })}${fld('Tipo', 'profiles.type', { options: { '': 'Todos', IND: 'Individual', COM: 'Empresa', TA: 'Agencia de viajes' }, rr: 1 })}</div>
    <div class="tw"><table class="tbl"><thead><tr><th>Nombre</th><th>Tipo</th><th>País</th><th>Correo</th><th>VIP</th><th>AR / IATA</th><th class="num">Estancias</th></tr></thead><tbody>
    ${list.map(p => `<tr class="click" data-act="openProfile" data-id="${p.id}"><td><b>${esc(pname(p.id))}</b></td><td>${T[p.type]}</td><td>${p.country || ''}</td><td>${esc(p.email)}</td><td>${vipChip(p.id)}</td><td class="mono">${p.ar || p.iata || ''}</td><td class="num">${state.reservations.filter(r => (r.profileId === p.id || r.companyId === p.id || r.taId === p.id) && r.status === 'CHECKED_OUT').length}</td></tr>`).join('')}
    </tbody></table></div></section>`;
};
VIEWS.profile = () => {
  const p = profile(ui.param); if (!p) return empty('Perfil no encontrado.');
  const rs = state.reservations.filter(r => r.profileId === p.id || r.companyId === p.id || r.taId === p.id).sort((a, b) => b.arr.localeCompare(a.arr));
  const stays = rs.filter(r => r.status === 'CHECKED_OUT'); const nights = stays.reduce((a, r) => a + diffDays(r.arr, r.dep), 0); const rev = stays.reduce((a, r) => a + r.folio.filter(x => x.code === '1000' || x.code === '1099').reduce((s, x) => s + x.amount, 0), 0);
  const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v || '—'}</b></div>`;
  return pageHead(pfull(p.id), `Perfil ${p.type === 'IND' ? 'individual' : p.type === 'COM' ? 'de empresa' : 'de agencia'} · ${p.id}`, vipChip(p.id), btn('Editar', 'mOpen', { k: 'profile', id: p.id }) + (p.type === 'IND' ? btn('Nueva reserva', 'ltbFor', { id: p.id }, 'pri') : ''))
    + `<div class="grid3"><section class="panel"><h2>Datos</h2>${p.type === 'IND' ? kv('Nombre', esc(`${p.title} ${p.first} ${p.last}`)) + kv('Documento', esc(`${p.idType} ${p.idNo}`)) + kv('Empresa', p.companyId ? esc(pname(p.companyId)) : '') : kv('Contacto', esc(p.contact)) + kv(p.type === 'COM' ? 'Cuenta AR' : 'IATA', `<span class="mono">${p.ar || p.iata}</span>`)}${kv('País / idioma', esc(`${COUNTRIES[p.country] || ''} / ${p.lang}`))}${kv('Correo', esc(p.email))}${kv('Teléfono', esc(p.phone))}</section>
    <section class="panel"><h2>Estadísticas</h2>${kv('Estancias', stays.length)}${kv('Noches', nights)}${kv('Ingreso de habitación', money(rev))}${kv('Perfil creado', fd(p.created))}</section>
    <section class="panel"><h2>Preferencias y notas</h2>${p.notes ? `<p>${esc(p.notes)}</p>` : '<p class="hint">Sin notas. Registra aquí preferencias (almohada, piso, alergias…).</p>'}</section></div>
    <section class="panel"><h2>Historial de reservas</h2>${rs.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Conf.</th><th>Huésped</th><th>Llegada</th><th>Salida</th><th>Hab.</th><th>Tarifa</th><th>Estado</th></tr></thead><tbody>${rs.map(r => `<tr class="click" data-act="openRes" data-id="${r.id}"><td class="mono">${r.conf}</td><td>${esc(pname(r.profileId))}</td><td>${fd(r.arr)}</td><td>${fd(r.dep)}</td><td class="mono">${r.room || '—'}</td><td>${r.rate}</td><td>${stChip(r)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">Sin reservas.</p>'}</section>`;
};
A.openProfile = d => { ui.view = 'profile'; ui.param = d.id; ui.modal = null; };
A.ltbFor = d => { ui.ltb = freshLtb(); ui.ltb.guest.profileId = d.id; const p = profile(d.id); if (p.companyId) ui.ltb.det.company = p.companyId; ui.view = 'ltb'; };

/* ---------- Bloques ---------- */
VIEWS.blocks = () => {
  const ST = { TEN: 'TEN · Tentativo', DEF: 'DEF · Definitivo', CXL: 'CXL · Cancelado' };
  return pageHead('Bloques de grupo', 'Bookings › Blocks', 'Un bloque reserva un inventario de habitaciones para un grupo. Solo los bloques definitivos (DEF) descuentan disponibilidad. Los huéspedes del grupo se “recogen” (pick up) del bloque.', btn('Nuevo bloque', 'mOpen', { k: 'block', id: '' }, 'pri', 'data-tut="block-new"'))
    + `<section class="panel">${state.blocks.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Código</th><th>Nombre</th><th>Llegada</th><th>Salida</th><th>Estado</th><th>Tarifa</th><th>Asignadas / noche</th><th>Pickup</th><th>Cut-off</th><th></th></tr></thead><tbody>
    ${state.blocks.map(b => { const alloc = Object.values(b.rooms).reduce((a, n) => a + n, 0); const pk = state.reservations.filter(r => r.blockId === b.id && isActive(r)).length; return `<tr><td class="mono b">${esc(b.code)}</td><td>${esc(b.name)}</td><td>${fd(b.arr)}</td><td>${fd(b.dep)}</td><td>${chip(b.status, b.status === 'DEF' ? 'good' : b.status === 'TEN' ? 'warn' : 'bad', ST[b.status])}</td><td class="mono">${money(b.rate)}</td><td>${Object.entries(b.rooms).filter(([, n]) => n).map(([t, n]) => `${n} ${t}`).join(', ')}</td><td><div class="pbar"><i style="width:${alloc ? Math.min(100, pk / alloc * 100) : 0}%"></i></div><small>${pk} de ${alloc}</small></td><td>${fd(b.cutoff)}</td>
      <td class="acts">${b.status !== 'CXL' ? btn('Reservar en bloque', 'blockPick', { id: b.id }, 'sm pri', `data-tut="block-pick-${b.id}"`) : ''}${b.status === 'TEN' ? btn('Hacer DEF', 'blockStatus', { id: b.id, s: 'DEF' }, 'sm', `data-tut="block-def-${b.id}"`) : ''}${b.status !== 'CXL' ? btn('Cancelar', 'blockStatus', { id: b.id, s: 'CXL' }, 'sm ghost') : ''}</td></tr>`; }).join('')}
    </tbody></table></div>` : empty('No hay bloques.')}</section>
    <section class="panel"><h2>Rooming list</h2>${state.blocks.map(b => { const rs = state.reservations.filter(r => r.blockId === b.id); return `<h3 class="h3">${esc(b.code)} · ${esc(b.name)}</h3>${rs.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Conf.</th><th>Huésped</th><th>Tipo</th><th>Llegada</th><th>Salida</th><th>Estado</th></tr></thead><tbody>${rs.map(r => `<tr class="click" data-act="openRes" data-id="${r.id}"><td class="mono">${r.conf}</td><td>${esc(pname(r.profileId))}</td><td>${r.roomType}</td><td>${fd(r.arr)}</td><td>${fd(r.dep)}</td><td>${stChip(r)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">Aún sin pickup.</p>'}`; }).join('')}</section>`;
};
A.blockPick = d => { const b = block(d.id); if (b.status === 'TEN') fail('El bloque es tentativo (TEN): pásalo a definitivo (DEF) antes de recoger reservas.'); ui.ltb = freshLtb(); Object.assign(ui.ltb, { blockId: b.id, arr: b.arr < BD() ? BD() : b.arr, nights: String(diffDays(b.arr < BD() ? BD() : b.arr, b.dep)) }); ui.ltb.det.g = 'CC'; ui.ltb.det.market = 'GRP'; if (b.companyId) ui.ltb.det.company = b.companyId; ui.view = 'ltb'; };
A.blockStatus = d => {
  const b = block(d.id);
  if (d.s === 'DEF' && b.status !== 'DEF') {
    for (const [t, n] of Object.entries(b.rooms)) for (const day of nightsOf(b.arr, b.dep)) {
      const free = physical(t, day) - sold(t, day) - blockRemaining(t, day);
      if (free < n - blockPicked(b, t, day)) fail(`Solo quedan ${Math.max(0, free)} ${t} el ${fd(day)}. Reduce el bloque o cambia las fechas para hacerlo definitivo.`);
    }
  }
  if (d.s === 'CXL' && state.reservations.some(r => r.blockId === b.id && isActive(r))) fail('El bloque tiene reservas activas. Cancélalas o muévelas antes de cancelar el bloque.');
  b.status = d.s; log(`Bloque ${b.code} → ${d.s}`); toast(`Bloque ${b.code}: ${d.s}`, 'good');
};

/* ---------- Auditoría nocturna ---------- */
VIEWS.audit = () => {
  const N = ui.na; const pa = pendingArrivals(), pd = pendingDepartures(), up = unposted();
  const steps = [
    { t: 'Llegadas pendientes', ok: !pa.length }, { t: 'Salidas pendientes', ok: !pd.length },
    { t: 'Posteo de habitación e impuestos', ok: !up.length && !pd.length }, { t: 'Informes de cierre', ok: N.reports }, { t: 'Cerrar día', ok: false },
  ];
  const s = dayStats(BD());
  let body = '';
  if (N.step === 0) body = `<p>Toda llegada de hoy debe quedar registrada, cancelada o marcada como No-Show. Las reservas <b>6PM</b> no generan cargo; las garantizadas (CC, DEP, CO) cargan una noche más impuestos.</p>${pa.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Conf.</th><th>Huésped</th><th>Tipo</th><th>Garantía</th><th></th></tr></thead><tbody>${pa.map(r => `<tr><td class="mono">${resLink(r)}</td><td>${guestCell(r)}</td><td>${r.roomType}</td><td>${chip(r.guarantee, r.guarantee === '6PM' ? 'warn' : 'info', GUAR[r.guarantee])}</td><td class="acts">${btn('Ir a check-in', 'openRes', { id: r.id }, 'sm')}${btn('No-Show', 'mOpen', { k: 'noshow', id: r.id }, 'sm', `data-tut="ns-${r.id}"`)}${btn('Cancelar', 'mOpen', { k: 'cancel', id: r.id }, 'sm ghost')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="note good">Sin llegadas pendientes.</div>'}`;
  if (N.step === 1) body = `<p>Los huéspedes con salida hoy que siguen en casa deben hacer check-out o extender la estancia.</p>${pd.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Hab.</th><th>Huésped</th><th class="num">Saldo</th><th></th></tr></thead><tbody>${pd.map(r => `<tr><td class="mono">${r.room}</td><td>${guestCell(r)}</td><td class="num mono">${money(balance(r))}</td><td class="acts">${btn('Folio / Check Out', 'openBill', { id: r.id }, 'sm pri')}${btn('Extender 1 noche', 'extend', { id: r.id }, 'sm', `data-tut="ext-${r.id}"`)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="note good">Sin salidas pendientes.</div>'}`;
  if (N.step === 2) body = `<p>El sistema postea la tarifa de cada habitación ocupada esta noche, más ITBIS (18%) y cargo por servicio (10%). Las tarifas con paquete separan el desayuno en el código 2030.</p>${pd.length ? '<div class="note warn">Resuelve primero las salidas pendientes.</div>' : up.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Hab.</th><th>Huésped</th><th>Tarifa</th><th class="num">Habitación</th><th class="num">Con impuestos</th></tr></thead><tbody>${up.map(r => `<tr><td class="mono">${r.room}</td><td>${esc(pname(r.profileId))}</td><td>${r.rate}</td><td class="num mono">${money(r.amount)}</td><td class="num mono">${money(nightTotal(r))}</td></tr>`).join('')}</tbody></table></div><div class="row end">${btn(`Postear ${up.length} habitaciones`, 'naPost', {}, 'pri', 'data-tut="na-post"')}</div>` : '<div class="note good">Habitación e impuestos posteados para esta noche.</div>'}`;
  if (N.step === 3) body = `<p>Revisa y archiva los informes del día antes de cerrar.</p>${managerReport(s)}<div class="row end">${N.reports ? chip('Informes archivados', 'good') : btn('Generar y archivar informes', 'naReports', {}, 'pri', 'data-tut="na-reports"')}</div>`;
  if (N.step === 4) body = `<p>Al cerrar: la fecha de negocio pasa a <b>${fd(addDays(BD(), 1))}</b>, las habitaciones ocupadas quedan Sucias y vencen los OOO terminados. No se puede deshacer.</p><ul class="checklist">${steps.slice(0, 4).map(x => `<li class="${x.ok ? 'ok' : ''}">${x.ok ? '✓' : '•'} ${x.t}</li>`).join('')}</ul><div class="row end">${btn('Cerrar día y avanzar fecha', 'mOpen', { k: 'closeday', id: '' }, 'pri', `data-tut="na-close" ${steps.slice(0, 4).every(x => x.ok) ? '' : 'disabled'}`)}</div>`;
  return pageHead('Auditoría nocturna', 'Financials › End of Day', `Cierre del día de negocio ${fd(BD())}. Resuelve cada paso en orden.`)
    + `<div class="audit"><ol class="nasteps">${steps.map((x, i) => `<li><button type="button" class="${N.step === i ? 'cur' : ''} ${x.ok ? 'ok' : ''}" data-act="naStep" data-i="${i}" data-tut="na-step-${i}"><span>${x.ok ? '✓' : i + 1}</span>${x.t}</button></li>`).join('')}</ol>
    <section class="panel">${body}</section></div>`;
};
A.naStep = d => { ui.na.step = +d.i; };
A.naPost = () => { const n = postAllRooms(); toast(`${n} habitaciones posteadas`, 'good'); ui.na.step = 3; };
A.naReports = () => { ui.na.reports = true; log(`Informes de cierre generados para ${fd(BD())}`); ui.na.step = 4; };
A.extend = d => { DO.extend(resById(d.id)); toast('Estancia extendida una noche', 'good'); };

/* ---------- Informes ---------- */
function managerReport(s) {
  const row = (k, v, cls = '') => `<tr class="${cls}"><td>${k}</td><td class="num mono">${v}</td></tr>`;
  return `<div class="grid2"><div class="tw"><table class="tbl compact rep"><thead><tr><th colspan="2">Estadísticas de habitaciones · ${fd(s.date)}</th></tr></thead><tbody>
    ${row('Habitaciones totales', s.total)}${row('Fuera de orden (OOO)', s.ooo)}${row('Habitaciones disponibles', s.avl)}${row('Habitaciones ocupadas', s.occ)}${row('Cortesías', s.comp)}${row('Ocupación %', s.occPct.toFixed(1) + '%', 'em')}${row('Huéspedes en casa', s.guests)}${row('Llegadas', s.arrivals)}${row('Salidas', s.departures)}${row('No-Shows', s.noShows)}${row('Cancelaciones del día', s.cxl)}
    </tbody></table></div><div class="tw"><table class="tbl compact rep"><thead><tr><th colspan="2">Ingresos del día</th></tr></thead><tbody>
    ${row('Ingreso de habitaciones', money(s.roomRev))}${row('ADR (tarifa promedio)', money(s.adr), 'em')}${row('RevPAR', money(s.revpar), 'em')}${row('Alimentos y bebidas', money(s.fb))}${row('Otros ingresos', money(s.other))}${row('No-Show', money(s.noshowRev))}${row('Impuestos y servicio', money(s.tax))}${row('Total ingresos', money(s.roomRev + s.fb + s.other + s.noshowRev), 'em')}${row('Pagos recibidos', money(-s.pay))}
    </tbody></table></div></div>`;
}
const REPORTS = {
  manager: ['Informe gerencial (Manager Report)', () => managerReport(dayStats(BD())) + `<p class="hint">Datos del día de negocio en curso. El ingreso de habitación de hoy aparece después del posteo de la auditoría.</p>`],
  arrivals: ['Llegadas del día', () => repTable(state.reservations.filter(r => r.arr === BD() && r.status !== 'CANCELLED'), ['conf', 'name', 'type', 'room', 'rate', 'nights', 'status'])],
  inhouse: ['Huéspedes en casa', () => repTable(state.reservations.filter(r => r.status === 'CHECKED_IN'), ['room', 'name', 'arr', 'dep', 'rate', 'bal', 'status'])],
  departures: ['Salidas del día', () => repTable(state.reservations.filter(r => (r.status === 'CHECKED_IN' && r.dep <= BD()) || r.coDate === BD()), ['room', 'name', 'arr', 'dep', 'bal', 'status'])],
  hk: ['Estado de habitaciones (HK)', () => `<div class="tw"><table class="tbl compact"><thead><tr><th>Hab.</th><th>Tipo</th><th>HK</th><th>FO</th><th>Huésped</th><th>Nota</th></tr></thead><tbody>${state.rooms.map(rm => { const o = occupant(rm.no); return `<tr><td class="mono">${rm.no}</td><td>${rm.type}</td><td>${hkChip(rm)}</td><td>${rm.fo}</td><td>${o ? esc(pname(o.profileId)) : ''}</td><td>${esc(rm.ooo?.reason || rm.oos?.reason || '')}</td></tr>`; }).join('')}</tbody></table></div>`],
  trial: ['Balance por código de transacción', () => { const posts = state.reservations.flatMap(r => r.folio.filter(p => p.date === BD())); const by = {}; posts.forEach(p => { by[p.code] = (by[p.code] || 0) + p.amount; }); const codes = Object.keys(by).sort(); return codes.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Código</th><th>Descripción</th><th>Grupo</th><th class="num">Neto del día</th></tr></thead><tbody>${codes.map(c => `<tr><td class="mono">${c}</td><td>${trxName(c)}</td><td>${TRXMAP[c].grp}</td><td class="num mono">${money(by[c])}</td></tr>`).join('')}<tr class="em"><td colspan="3">Neto (cargos – pagos)</td><td class="num mono">${money(Object.values(by).reduce((a, n) => a + n, 0))}</td></tr></tbody></table></div>` : empty('Aún no hay transacciones con fecha de hoy.'); }],
  cashier: ['Cajero: pagos del día', () => { const posts = state.reservations.flatMap(r => r.folio.filter(p => p.date === BD() && p.code.startsWith('9')).map(p => ({ p, r }))); return posts.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Hora</th><th>Código</th><th>Huésped</th><th>Descripción</th><th class="num">Monto</th></tr></thead><tbody>${posts.map(({ p, r }) => `<tr><td class="mono">${p.t}</td><td class="mono">${p.code}</td><td>${esc(pname(r.profileId))}</td><td>${esc(p.desc)}</td><td class="num mono">${money(-p.amount)}</td></tr>`).join('')}</tbody></table></div>` : empty('Sin pagos registrados hoy.'); }],
  forecast: ['Pronóstico de ocupación (14 días)', () => { const days = Array.from({ length: 14 }, (_, i) => addDays(BD(), i)); return `<div class="tw"><table class="tbl compact"><thead><tr><th>Fecha</th>${CFG.roomTypes.map(t => `<th class="num">${t.code} disp.</th>`).join('')}<th class="num">Ocupadas</th><th class="num">Ocup. %</th><th>&nbsp;</th></tr></thead><tbody>${days.map(d => { const tot = state.rooms.filter(x => !isOOO(x, d)).length; const oc = state.reservations.filter(r => isActive(r) && r.arr <= d && d < r.dep).length + CFG.roomTypes.reduce((a, t) => a + blockRemaining(t.code, d), 0); const pc = tot ? oc / tot * 100 : 0; return `<tr><td>${dow(d)} ${fd(d)}</td>${CFG.roomTypes.map(t => `<td class="num">${avail(t.code, d)}</td>`).join('')}<td class="num">${oc}</td><td class="num">${pc.toFixed(0)}%</td><td><div class="pbar"><i style="width:${Math.min(100, pc)}%"></i></div></td></tr>`; }).join('')}</tbody></table></div><p class="hint">Ocupadas incluye las habitaciones aún no recogidas de bloques definitivos.</p>`; }],
  history: ['Historial de auditorías', () => state.audits.length ? `<div class="tw"><table class="tbl compact"><thead><tr><th>Fecha</th><th class="num">Ocup.</th><th class="num">Ocup. %</th><th class="num">ADR</th><th class="num">RevPAR</th><th class="num">Hab.</th><th class="num">A&B</th><th class="num">Otros</th></tr></thead><tbody>${state.audits.map(s => `<tr><td>${fd(s.date)}</td><td class="num">${s.occ}</td><td class="num">${s.occPct.toFixed(1)}%</td><td class="num mono">${money(s.adr)}</td><td class="num mono">${money(s.revpar)}</td><td class="num mono">${money(s.roomRev)}</td><td class="num mono">${money(s.fb)}</td><td class="num mono">${money(s.other)}</td></tr>`).join('')}</tbody></table></div>` : empty('Aún no se ha cerrado ningún día. Ejecuta la auditoría nocturna.')],
  log: ['Registro de actividad del usuario', () => `<div class="tw"><table class="tbl compact"><thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>Acción</th></tr></thead><tbody>${state.log.slice(0, 150).map(e => `<tr><td>${fd(e.d)}</td><td class="mono">${e.t}</td><td>${e.u}</td><td>${esc(e.txt)}</td></tr>`).join('')}</tbody></table></div>`],
};
function repTable(list, cols) {
  const H = { conf: 'Conf.', name: 'Huésped', type: 'Tipo', room: 'Hab.', rate: 'Tarifa', nights: 'Noches', status: 'Estado', arr: 'Llegada', dep: 'Salida', bal: 'Saldo' };
  const V = { conf: r => `<span class="mono">${r.conf}</span>`, name: r => esc(pname(r.profileId)), type: r => r.roomType, room: r => `<span class="mono">${r.room || '—'}</span>`, rate: r => r.rate, nights: r => diffDays(r.arr, r.dep), status: r => stChip(r), arr: r => fd(r.arr), dep: r => fd(r.dep), bal: r => `<span class="mono">${money(balance(r))}</span>` };
  return list.length ? `<div class="tw"><table class="tbl compact"><thead><tr>${cols.map(c => `<th>${H[c]}</th>`).join('')}</tr></thead><tbody>${list.map(r => `<tr class="click" data-act="openRes" data-id="${r.id}">${cols.map(c => `<td>${V[c](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">${list.length} registro(s).</p>` : empty('Sin registros.');
}
VIEWS.reports = () => pageHead('Informes', 'Financials › Reports', `Fecha de negocio ${fd(BD())}.`)
  + `<div class="split"><nav class="side">${Object.entries(REPORTS).map(([k, [t]]) => `<button type="button" class="${ui.report === k ? 'on' : ''}" data-act="report" data-r="${k}">${t}</button>`).join('')}</nav><section class="panel grow"><h2>${REPORTS[ui.report][0]}</h2>${REPORTS[ui.report][1]()}</section></div>`;
A.report = d => { ui.report = d.r; };

/* ---------- Configuración ---------- */
VIEWS.config = () => pageHead('Configuración', 'Admin › Configuration', 'Referencia de solo lectura con los códigos de este hotel de práctica.')
  + `<section class="panel"><h2>Tipos de habitación</h2><div class="tw"><table class="tbl compact"><thead><tr><th>Código</th><th>Nombre</th><th>Camas</th><th>m²</th><th class="num">Máx.</th><th class="num">Habitaciones</th></tr></thead><tbody>${CFG.roomTypes.map(t => `<tr><td class="mono b">${t.code}</td><td>${t.name}</td><td>${t.beds}</td><td>${t.sqm}</td><td class="num">${t.max}</td><td>${state.rooms.filter(x => x.type === t.code).map(x => x.no).join(', ')}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><h2>Códigos de tarifa (USD por noche, antes de impuestos)</h2><div class="tw"><table class="tbl compact"><thead><tr><th>Código</th><th>Nombre</th>${CFG.roomTypes.map(t => `<th class="num">${t.code}</th>`).join('')}<th>Mercado</th><th>Cancelación</th><th>Notas</th></tr></thead><tbody>${CFG.rates.map(r => `<tr><td class="mono b">${r.code}</td><td>${r.name}</td>${CFG.roomTypes.map(t => `<td class="num mono">${money(r.p[t.code])}</td>`).join('')}<td>${r.market}</td><td>${esc(r.cancel)}</td><td>${esc(r.desc)}</td></tr>`).join('')}</tbody></table></div></section>
  <div class="grid2"><section class="panel"><h2>Códigos de transacción</h2><div class="tw"><table class="tbl compact"><thead><tr><th>Código</th><th>Descripción</th><th>Grupo</th></tr></thead><tbody>${TRX.map(t => `<tr><td class="mono">${t.code}</td><td>${t.name}</td><td>${t.grp}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><h2>Otros códigos</h2><h3 class="h3">Garantías</h3>${Object.values(GUAR).map(x => `<div>${esc(x)}</div>`).join('')}<h3 class="h3">Mercados</h3>${Object.values(MARKETS).map(x => `<div>${esc(x)}</div>`).join('')}<h3 class="h3">Orígenes</h3>${Object.values(SOURCES).map(x => `<div>${esc(x)}</div>`).join('')}<h3 class="h3">Departamentos (traces)</h3>${Object.values(DEPTS).map(x => `<div>${esc(x)}</div>`).join('')}<h3 class="h3">Impuestos</h3><div>ITBIS 18% (1010) + Cargo por servicio 10% (1020) sobre la tarifa de habitación.</div></section></div>`;
VIEWS.reset = () => { ui.view = 'config'; ui.modal = { k: 'reset' }; return VIEWS.config(); };

/* =========================================================
   MODALES
   ========================================================= */
A.mOpen = d => { openModal(d.k, d.id); };
function openModal(k, id, extra) {
  ui.menu = null; ui.m = {}; ui.modal = { k, id, ...(extra || {}) };
  const r = id ? resById(id) : null;
  if (k === 'post') Object.assign(ui.m, { code: '2000', amount: '', qty: '1', ref: '', window: '' });
  if (k === 'pay') { const w = windowsUsed(r).find(w => balance(r, w) > 0) || 1; Object.assign(ui.m, { window: String(w), method: r.pay && r.pay !== 'DB' ? r.pay : (r.windows[w]?.payee !== r.profileId ? 'DB' : 'CA'), amount: String(Math.max(0, balance(r, w)).toFixed(2)), ref: '' }); }
  if (k === 'adjust') Object.assign(ui.m, { code: '1099', amount: '', reason: '', window: '1' });
  if (k === 'routing') Object.assign(ui.m, { codes: ['1000', '1010', '1020'], window: '2', payee: r.companyId || r.profileId });
  if (k === 'transfer') Object.assign(ui.m, { window: '2' });
  if (k === 'cancel') Object.assign(ui.m, { reason: '' });
  if (k === 'alert') Object.assign(ui.m, { area: 'CI', text: '' });
  if (k === 'trace') Object.assign(ui.m, { dept: 'HK', date: r.arr > BD() ? r.arr : BD(), text: '' });
  if (k === 'move') Object.assign(ui.m, { room: '', reason: '' });
  if (k === 'checkin') Object.assign(ui.m, { idNo: profile(r.profileId).idNo || '' });
  if (k === 'edit') Object.assign(ui.m, { arr: r.arr, nights: String(diffDays(r.arr, r.dep)), adults: String(r.adults), children: String(r.children), roomType: r.roomType, rtc: r.rtc, rate: r.rate, amount: String(r.amount), g: r.guarantee, pay: r.pay, card: '', market: r.market, source: r.source, specials: [...r.specials], comments: r.comments });
  if (k === 'hkroom') { const rm = room(id); Object.assign(ui.m, { from: BD(), to: addDays(BD(), 2), reason: rm.ooo?.reason || '' }); }
  if (k === 'profile') { const p = id ? profile(id) : null; Object.assign(ui.m, p ? clone(p) : { type: 'IND', title: '', first: '', last: '', name: '', email: '', phone: '', country: 'DO', lang: 'ES', vip: '', idType: 'Cédula', idNo: '', notes: '', ar: '', iata: '', contact: '', companyId: '' }); }
  if (k === 'block') Object.assign(ui.m, { code: '', name: '', companyId: '', arr: addDays(BD(), 10), nights: '3', STD: '0', DLX: '0', JRS: '0', STE: '0', rate: '150', status: 'TEN', cutoff: addDays(BD(), 3) });
}
function closeModal() { ui.modal = null; ui.m = {}; }
A.closeModal = () => closeModal();
function mfld(label, key, o) { return fld(label, 'm.' + key, o); }

MODALS.assign = r => {
  const others = ui.m.others; const types = others ? CFG.roomTypes.map(t => t.code) : [r.roomType];
  const rooms = state.rooms.filter(x => types.includes(x.type));
  return {
    title: `Asignar habitación · ${pname(r.profileId)}`, wide: true,
    body: `<p class="hint">${fd(r.arr)} → ${fd(r.dep)} · Tipo reservado <b>${r.roomType}</b>. Para hoy, elige una habitación vacía y Limpia o Inspeccionada si el huésped hará check-in ya.</p>
    <label class="ck inline"><input type="checkbox" data-bind="m.others" data-rr${others ? ' checked' : ''}> Mostrar otros tipos (upgrade)</label>
    <div class="tw"><table class="tbl compact"><thead><tr><th>Hab.</th><th>Tipo</th><th>HK</th><th>FO</th><th>Características</th><th>Para la estancia</th><th></th></tr></thead><tbody>
    ${rooms.map(x => { const free = roomFree(x.no, r.arr, r.dep, r.id); const ready = x.fo === 'VAC' && ['CL', 'IP'].includes(hkShown(x)) && !x.oos; return `<tr class="${free ? '' : 'dim'}"><td class="mono b">${x.no}</td><td>${x.type}</td><td>${hkChip(x)}</td><td>${x.fo}</td><td>${esc(x.feat)}</td><td>${free ? (r.arr === BD() ? (ready ? chip('Lista', 'good') : chip('Libre, no lista', 'warn')) : chip('Libre', 'good')) : chip('No disponible', 'bad')}</td><td>${free ? btn(r.room === x.no ? 'Asignada' : 'Asignar', 'doAssign', { id: r.id, no: x.no }, 'sm ' + (ready ? 'pri' : ''), `data-tut="asg-${x.no}"`) : ''}</td></tr>`; }).join('')}
    </tbody></table></div>`,
    foot: (r.room ? btn('Liberar habitación', 'doUnassign', { id: r.id }, 'ghost') : '') + btn('Cerrar', 'closeModal'),
  };
};
A.doAssign = d => { const r = resById(d.id); const rm = room(d.no); if (rm.type !== r.roomType) { r.roomType = rm.type; log(`Upgrade a ${rm.type} (cobra ${r.rtc})`, r); } DO.assignRoom(r, d.no); toast(`Habitación ${d.no} asignada`, 'good'); closeModal(); };
A.doUnassign = d => { DO.unassign(resById(d.id)); closeModal(); };

MODALS.checkin = r => {
  const rm = r.room ? room(r.room) : null; const p = profile(r.profileId);
  return {
    title: `Check In · ${pfull(r.profileId)}`,
    body: `${r.alerts.length ? `<div class="note warn"><b>Alerta:</b> ${r.alerts.map(a => esc(a.text)).join('<br>')}</div>` : ''}
    <div class="kvgrid"><div class="kv"><span>Confirmación</span><b class="mono">${r.conf}</b></div><div class="kv"><span>Estancia</span><b>${fd(r.arr)} → ${fd(r.dep)} (${diffDays(r.arr, r.dep)} n.)</b></div>
    <div class="kv"><span>Habitación</span><b>${rm ? `<span class="mono">${rm.no}</span> ${hkChip(rm)} ${rm.fo}` : '<em>Sin asignar</em>'}</b></div><div class="kv"><span>Tarifa</span><b>${r.rate} · ${money(r.amount)}/noche</b></div>
    <div class="kv"><span>Pago</span><b>${r.pay ? PAY[r.pay].name + ' ' + esc(r.card) : '<em>Sin método de pago</em>'}</b></div><div class="kv"><span>Specials</span><b>${r.specials.join(', ') || '—'}</b></div></div>
    ${!rm ? `<div class="note bad">Asigna una habitación antes de registrar.</div>` : ''}
    ${!r.pay ? `<div class="note warn">Esta reserva no tiene método de pago (6PM). Edita la reserva para capturarlo antes del check-in.</div>` : ''}
    <div class="form g2">${mfld('Documento verificado (' + esc(p.idType || 'ID') + ')', 'idNo')}</div>`,
    foot: btn('Cancelar', 'closeModal') + (!rm ? btn('Asignar habitación', 'mOpen', { k: 'assign', id: r.id }) : '') + (!r.pay ? btn('Editar reserva', 'mOpen', { k: 'edit', id: r.id }) : '') + btn('Confirmar check-in', 'doCheckIn', { id: r.id }, 'pri', 'data-tut="ci-confirm"'),
  };
};
A.doCheckIn = d => { const r = resById(d.id); if (!ui.m.idNo?.trim()) fail('Verifica y escribe el número de documento del huésped.'); profile(r.profileId).idNo = ui.m.idNo.trim(); DO.checkIn(r); closeModal(); toast(`${pname(r.profileId)} registrado en la ${r.room}. Entrega las llaves.`, 'good'); };

MODALS.post = r => ({
  title: 'Postear cargo', body: `<div class="form g2">${mfld('Código de transacción', 'code', { options: Object.fromEntries(TRX.filter(t => t.kind === 'rev').map(t => [t.code, `${t.code} · ${t.name}`])), tut: 'post-code' })}${mfld('Monto unitario (USD)', 'amount', { type: 'number', step: '0.01', min: 0, tut: 'post-amount' })}${mfld('Cantidad', 'qty', { type: 'number', min: 1 })}${mfld('Referencia / cheque', 'ref', { ph: 'Ej.: Cheque 4471' })}${mfld('Ventana', 'window', { options: { '': 'Según routing', 1: 'Ventana 1', 2: 'Ventana 2', 3: 'Ventana 3' } })}</div><p class="hint">Si hay routing para el código, el cargo va directo a la ventana del pagador.</p>`,
  foot: btn('Cancelar', 'closeModal') + btn('Postear', 'doPost', { id: r.id }, 'pri', 'data-tut="post-ok"'),
});
A.doPost = d => { const r = resById(d.id); const m = ui.m; const amt = r2((+m.amount) * (+m.qty || 1)); if (!(amt > 0)) fail('Escribe un monto mayor que cero.'); if (r.status !== 'CHECKED_IN' && r.status !== 'RESERVED') fail('El folio está cerrado.'); const p = post(r, m.code, amt, { ref: m.ref, window: m.window ? +m.window : undefined, desc: trxName(m.code) + (+m.qty > 1 ? ` ×${m.qty}` : '') }); log(`Cargo ${m.code} ${money(amt)} → ventana ${p.window}`, r); closeModal(); toast(`Cargo ${m.code} ${money(amt)} posteado en ventana ${p.window}`, 'good'); };

MODALS.pay = r => ({
  title: 'Registrar pago', body: `<div class="form g2">${mfld('Ventana', 'window', { options: Object.fromEntries(windowsUsed(r).map(w => [w, `Ventana ${w} · saldo ${money(balance(r, w))} · ${pname(r.windows[w]?.payee || r.profileId)}`])), rr: 1 })}${mfld('Método de pago', 'method', { options: payOpts(), tut: 'pay-method' })}${mfld('Monto (USD)', 'amount', { type: 'number', step: '0.01', min: 0, tut: 'pay-amount' })}${mfld('Referencia / autorización', 'ref', { ph: 'Opcional' })}</div>
  <p class="hint">Saldo de la ventana ${ui.m.window}: <b class="mono">${money(balance(r, ui.m.window))}</b>. ${btn('Usar saldo', 'payFill', { id: r.id }, 'sm ghost')} Direct Bill solo es válido si el pagador de la ventana es una empresa con cuenta AR.</p>`,
  foot: btn('Cancelar', 'closeModal') + btn('Registrar pago', 'doPay', { id: r.id }, 'pri', 'data-tut="pay-ok"'),
});
A.payFill = d => { ui.m.amount = String(Math.max(0, balance(resById(d.id), ui.m.window)).toFixed(2)); };
A.doPay = d => { const r = resById(d.id); const w = +ui.m.window; payment(r, w, ui.m.method, ui.m.amount, ui.m.ref); closeModal(); toast(`Pago registrado. Saldo de la ventana ${w}: ${money(balance(r, w))}`, 'good'); };

MODALS.adjust = r => ({
  title: 'Ajuste (corrección de cargo)', body: `<p class="hint">Un ajuste resta un monto a un ingreso ya posteado en una fecha anterior o corrige una cortesía. Siempre requiere motivo: queda en el historial y en el balance del día.</p><div class="form g2">${mfld('Código de ajuste', 'code', { options: { 1099: '1099 · Ajuste de habitación', 2099: '2099 · Ajuste A&B' } })}${mfld('Monto a descontar (USD)', 'amount', { type: 'number', step: '0.01', min: 0, tut: 'adj-amount' })}${mfld('Ventana', 'window', { options: Object.fromEntries(windowsUsed(r).map(w => [w, 'Ventana ' + w])) })}${mfld('Motivo *', 'reason', { tut: 'adj-reason' })}</div>`,
  foot: btn('Cancelar', 'closeModal') + btn('Aplicar ajuste', 'doAdjust', { id: r.id }, 'pri'),
});
A.doAdjust = d => { const r = resById(d.id); DO.adjust(r, ui.m.code, ui.m.amount, ui.m.reason.trim(), +ui.m.window); closeModal(); toast('Ajuste aplicado', 'good'); };

MODALS.routing = r => ({
  title: 'Routing de ventanas', body: `<p class="hint">El routing envía automáticamente ciertos códigos a otra ventana del folio, con su propio pagador. Ejemplo típico: la empresa paga habitación e impuestos; el huésped, los extras.</p>
  <h3 class="h3">Códigos a enrutar</h3><div class="checks">${TRX.filter(t => t.kind !== 'pay' && t.kind !== 'adj').map(t => `<label class="ck"><input type="checkbox" data-bindarr="m.codes" value="${t.code}"${ui.m.codes.includes(t.code) ? ' checked' : ''}> <b>${t.code}</b> ${t.name}</label>`).join('')}</div>
  <div class="form g2">${mfld('Ventana destino', 'window', { options: { 2: 'Ventana 2', 3: 'Ventana 3', 1: 'Ventana 1' } })}${mfld('Pagador de la ventana', 'payee', { options: Object.assign({ [r.profileId]: 'Huésped: ' + pname(r.profileId) }, r.companyId ? { [r.companyId]: 'Empresa: ' + pname(r.companyId) } : {}, r.taId ? { [r.taId]: 'Agencia: ' + pname(r.taId) } : {}), tut: 'route-payee' })}</div>
  ${!r.companyId ? '<div class="note warn">Esta reserva no tiene empresa vinculada. Edítala para vincular una si la empresa pagará.</div>' : ''}
  <label class="ck inline"><input type="checkbox" data-bind="m.move"${ui.m.move ? ' checked' : ''}> Mover también los cargos ya posteados de esos códigos</label>
  ${r.routing.length ? `<h3 class="h3">Routing actual</h3>${r.routing.map(rt => `<div>${rt.codes.join(', ')} → ventana ${rt.window}</div>`).join('')}${btn('Eliminar routing', 'clearRouting', { id: r.id }, 'sm ghost')}` : ''}`,
  foot: btn('Cancelar', 'closeModal') + btn('Guardar routing', 'doRouting', { id: r.id }, 'pri', 'data-tut="route-ok"'),
});
A.doRouting = d => { const r = resById(d.id); DO.setRouting(r, [...ui.m.codes], +ui.m.window, ui.m.payee); if (ui.m.move) { const ids = r.folio.filter(p => ui.m.codes.includes(p.code)).map(p => p.id); if (ids.length) DO.transfer(r, ids, +ui.m.window); } closeModal(); toast('Routing guardado', 'good'); };
A.clearRouting = d => { const r = resById(d.id); r.routing = []; log('Routing eliminado', r); closeModal(); };

MODALS.transfer = r => {
  const n = ui.bill.sel.length;
  return { title: 'Transferir transacciones', body: n ? `<p>${n} transacción(es) marcada(s) en el folio.</p><div class="form g2">${mfld('Ventana destino', 'window', { options: { 1: 'Ventana 1', 2: 'Ventana 2', 3: 'Ventana 3' } })}</div>` : '<div class="note warn">Primero marca las casillas de las transacciones en el folio y luego pulsa Transferir.</div>', foot: btn('Cerrar', 'closeModal') + (n ? btn('Transferir', 'doTransfer', { id: r.id }, 'pri') : '') };
};
A.doTransfer = d => { const r = resById(d.id); if (+ui.m.window > 1 && !r.windows[ui.m.window]) r.windows[ui.m.window] = { payee: r.profileId }; DO.transfer(r, ui.bill.sel.map(Number), +ui.m.window); ui.bill.sel = []; closeModal(); toast('Transferencia hecha', 'good'); };

MODALS.checkout = r => {
  const ws = windowsUsed(r); const pending = ws.filter(w => Math.abs(balance(r, w)) > 0.004); const early = r.dep > BD();
  return {
    title: `Check Out · ${pfull(r.profileId)}`,
    body: `${r.alerts.filter(a => a.area === 'CO').map(a => `<div class="note warn">${esc(a.text)}</div>`).join('')}${early ? `<div class="note warn">Salida anticipada: la salida era el ${fd(r.dep)}. Se actualizará al ${fd(BD())} y se liberará el inventario.</div>` : ''}
    <table class="tbl compact"><thead><tr><th>Ventana</th><th>Pagador</th><th class="num">Saldo</th></tr></thead><tbody>${ws.map(w => `<tr><td>${w}</td><td>${esc(pname(r.windows[w]?.payee || r.profileId))}</td><td class="num mono">${money(balance(r, w))}</td></tr>`).join('')}</tbody></table>
    ${pending.length ? `<div class="note bad">Saldo pendiente en ventana ${pending.join(', ')}. Registra el pago antes de salir.</div>` : '<div class="note good">Todas las ventanas están en $0.00.</div>'}`,
    foot: btn('Cancelar', 'closeModal') + (pending.length ? btn('Registrar pago', 'mOpen', { k: 'pay', id: r.id }) : btn('Confirmar check-out', 'doCheckOut', { id: r.id }, 'pri', 'data-tut="co-confirm"')),
  };
};
A.doCheckOut = d => { const r = resById(d.id); DO.checkOut(r); toast(`Check-out de ${pname(r.profileId)}. La ${r.room} queda Vacía y Sucia.`, 'good'); ui.modal = { k: 'invoice', id: r.id }; };

MODALS.invoice = r => ({
  title: `Factura · Folio ${r.folioNo ? '#' + r.folioNo : '(abierto)'}`, wide: true,
  body: windowsUsed(r).map(w => { const items = r.folio.filter(p => p.window === w); const payee = profile(r.windows[w]?.payee || r.profileId); return `<div class="invoice"><div class="inv-h"><div><b>${CFG.property.name}</b><br><small>${CFG.property.city} · RNC 1-01-00000-0</small></div><div class="right"><b>Ventana ${w}</b><br><small>Conf. ${r.conf} · Hab. ${r.room}</small></div></div>
    <p><b>${esc(pfull(payee.id))}</b>${payee.ar ? ` · Cuenta AR ${payee.ar}` : ''}<br><small>Llegada ${fd(r.arr)} · Salida ${fd(r.coDate || r.dep)}</small></p>
    <table class="tbl compact"><thead><tr><th>Fecha</th><th>Descripción</th><th class="num">Cargos</th><th class="num">Créditos</th></tr></thead><tbody>${items.map(p => `<tr><td>${fd(p.date)}</td><td>${esc(p.desc)}</td><td class="num mono">${p.amount > 0 ? money(p.amount) : ''}</td><td class="num mono">${p.amount < 0 ? money(-p.amount) : ''}</td></tr>`).join('')}
    <tr class="em"><td colspan="2">Saldo</td><td colspan="2" class="num mono">${money(balance(r, w))}</td></tr></tbody></table></div>`; }).join(''),
  foot: btn('Cerrar', 'closeModal'),
});

MODALS.cancel = r => ({ title: `Cancelar reserva ${r.conf}`, body: `<p>${esc(pfull(r.profileId))} · ${fd(r.arr)} → ${fd(r.dep)} · ${r.rate}</p><div class="note">Política de la tarifa: ${esc(rateDef(r.rate)?.cancel || 'según contrato de grupo')}.</div><div class="form">${mfld('Motivo de cancelación *', 'reason', { ph: 'Ej.: el huésped cambió sus planes' })}</div>`, foot: btn('Volver', 'closeModal') + btn('Cancelar reserva', 'doCancel', { id: r.id }, 'danger') });
A.doCancel = d => { const r = resById(d.id); DO.cancel(r, ui.m.reason.trim()); closeModal(); toast(`Cancelada. N.º de cancelación ${r.cancelNo}`, 'good'); };
MODALS.noshow = r => ({ title: `Marcar No-Show · ${pname(r.profileId)}`, body: `<p>Garantía: <b>${esc(GUAR[r.guarantee])}</b>.</p>${['CC', 'DEP', 'CO'].includes(r.guarantee) && r.amount > 0 ? `<div class="note warn">Reserva garantizada: se cargará ${money(nightTotal(r))} (1 noche + impuestos) con código 7000.</div>` : '<div class="note">Reserva sin garantía: se libera sin cargo.</div>'}`, foot: btn('Volver', 'closeModal') + btn('Marcar No-Show', 'doNoShow', { id: r.id }, 'danger', 'data-tut="ns-ok"') });
A.doNoShow = d => { DO.noShow(resById(d.id)); closeModal(); toast('Marcada como No-Show', 'good'); };
MODALS.alert = r => ({ title: 'Nueva alerta', body: `<div class="form g2">${mfld('Se muestra al', 'area', { options: { CI: 'Check-in', CO: 'Check-out' } })}${mfld('Texto *', 'text')}</div>`, foot: btn('Cancelar', 'closeModal') + btn('Guardar', 'doAlert', { id: r.id }, 'pri') });
A.doAlert = d => { const r = resById(d.id); if (!ui.m.text.trim()) fail('Escribe el texto de la alerta.'); r.alerts.push({ area: ui.m.area, text: ui.m.text.trim() }); log('Alerta añadida: ' + ui.m.text, r); closeModal(); };
MODALS.trace = r => ({ title: 'Nuevo trace', body: `<p class="hint">Un trace es una tarea con fecha para un departamento. Aparece en el listado del departamento ese día.</p><div class="form g2">${mfld('Departamento', 'dept', { options: DEPTS, tut: 'trace-dept' })}${mfld('Fecha', 'date', { type: 'date', min: BD() })}${mfld('Texto *', 'text', { cls: 'span2', tut: 'trace-text' })}</div>`, foot: btn('Cancelar', 'closeModal') + btn('Guardar trace', 'doTrace', { id: r.id }, 'pri', 'data-tut="trace-ok"') });
A.doTrace = d => { const r = resById(d.id); if (!ui.m.text.trim()) fail('Escribe el texto del trace.'); r.traces.push({ dept: ui.m.dept, date: ui.m.date, text: ui.m.text.trim(), done: false }); log(`Trace ${ui.m.dept}: ${ui.m.text}`, r); closeModal(); toast('Trace creado', 'good'); };
MODALS.move = r => {
  const free = state.rooms.filter(x => x.no !== r.room && x.fo === 'VAC' && !x.oos && ['CL', 'IP'].includes(hkShown(x)) && roomFree(x.no, BD(), r.dep, r.id));
  return { title: `Room Move · ${pname(r.profileId)} (hab. ${r.room})`, body: `<p class="hint">Cambia al huésped de habitación sin hacer check-out. La habitación anterior queda Vacía y Sucia.</p><div class="form g2">${mfld('Nueva habitación', 'room', { options: opt(Object.fromEntries(free.map(x => [x.no, `${x.no} · ${x.type} · ${HKS[hkShown(x)]}`])), '— Elige —'), tut: 'move-room' })}${mfld('Motivo *', 'reason', { tut: 'move-reason' })}</div>`, foot: btn('Cancelar', 'closeModal') + btn('Mover huésped', 'doMove', { id: r.id }, 'pri', 'data-tut="move-ok"') };
};
A.doMove = d => { const r = resById(d.id); DO.roomMove(r, ui.m.room, ui.m.reason.trim()); closeModal(); toast(`Huésped movido a la ${r.room}`, 'good'); };

MODALS.edit = r => {
  const ci = r.status === 'CHECKED_IN';
  return {
    title: `Editar reserva ${r.conf}`, wide: true,
    body: `<div class="form g4">${mfld('Llegada', 'arr', { type: 'date', dis: ci, min: BD() })}${mfld('Noches', 'nights', { type: 'number', min: 1 })}${mfld('Adultos', 'adults', { type: 'number', min: 1 })}${mfld('Niños', 'children', { type: 'number', min: 0 })}
      ${mfld('Tipo de habitación', 'roomType', { options: rtOpts(), dis: ci })}${mfld('Tipo a cobrar (RTC)', 'rtc', { options: rtOpts() })}${r.rate === 'GRP' ? '' : mfld('Tarifa', 'rate', { options: Object.fromEntries(CFG.rates.map(x => [x.code, x.code + ' · ' + x.name])) })}${mfld('Monto por noche', 'amount', { type: 'number', step: '0.01', help: 'Cambiarlo a mano marca la tarifa como fija.' })}
      ${mfld('Garantía', 'g', { options: GUAR })}${mfld('Método de pago', 'pay', { options: opt(payOpts(), '— Sin método —'), rr: 1 })}${PAY[ui.m.pay]?.card ? mfld('Nueva tarjeta (opcional)', 'card', { ph: r.card || '4111 1111 1111 1111', tut: 'edit-card' }) : ''}${mfld('Mercado', 'market', { options: MARKETS })}${mfld('Origen', 'source', { options: SOURCES })}</div>
      <h3 class="h3">Specials</h3>${checks('m.specials', SPECIALS)}<div class="form">${mfld('Comentarios', 'comments', { type: 'textarea' })}</div>`,
    foot: btn('Cancelar', 'closeModal') + btn('Guardar cambios', 'doEdit', { id: r.id }, 'pri', 'data-tut="edit-ok"'),
  };
};
A.doEdit = d => {
  const r = resById(d.id); const m = ui.m; const ci = r.status === 'CHECKED_IN';
  const arr = ci ? r.arr : m.arr; const dep = addDays(arr, +m.nights);
  if (!ci && arr < BD()) fail('La llegada no puede ser anterior a la fecha de negocio.');
  if (dep <= BD() && ci) fail('La salida debe ser posterior a hoy.');
  const type = ci ? r.roomType : m.roomType; const pax = +m.adults + +m.children; const T = CFG.roomTypes.find(t => t.code === type);
  if (pax > T.max) fail(`El tipo ${type} admite máximo ${T.max} personas.`);
  const changed = arr !== r.arr || dep !== r.dep || type !== r.roomType;
  if (changed) {
    const newNights = nightsOf(arr, dep).filter(day => !(r.arr <= day && day < r.dep && type === r.roomType));
    for (const day of newNights) if (avail(type, day, { excludeId: r.id }) < 1) fail(`No hay disponibilidad de ${type} el ${fd(day)}.`);
    if (r.room && (!roomFree(r.room, arr, dep, r.id) || room(r.room).type !== type)) { if (ci) fail(`La habitación ${r.room} no está libre para las nuevas fechas. Haz un Room Move.`); log(`Habitación ${r.room} liberada por cambio de fechas/tipo`, r); r.room = ''; }
  }
  if (PAY[m.pay]?.card && m.card && m.card.replace(/\D/g, '').length < 13) fail('Número de tarjeta inválido.');
  if (PAY[m.pay]?.card && !m.card && !r.card) fail('Escribe el número de tarjeta.');
  if (m.g === 'CC' && !PAY[m.pay]?.card) fail('La garantía CC requiere tarjeta.');
  const rateChanged = m.rate !== r.rate || m.rtc !== r.rtc; const amtManual = +m.amount !== r.amount;
  const old = `${fd(r.arr)}–${fd(r.dep)} ${r.roomType} ${r.rate} ${money(r.amount)}`;
  Object.assign(r, { arr, dep, adults: +m.adults, children: +m.children, roomType: type, rtc: m.rtc, guarantee: m.g, pay: m.pay, market: m.market, source: m.source, specials: [...m.specials], comments: m.comments });
  if (r.rate !== 'GRP') r.rate = m.rate;
  if (amtManual) { r.amount = r2(+m.amount); r.fixed = true; } else if (rateChanged) { r.amount = rateAmount(r.rate, r.rtc, r.blockId); r.fixed = false; }
  if (m.card) r.card = cardMask(m.card);
  if (!PAY[m.pay]?.card) r.card = '';
  log(`Reserva modificada (antes: ${old}; ahora: ${fd(r.arr)}–${fd(r.dep)} ${r.roomType} ${r.rate} ${money(r.amount)})`, r);
  closeModal(); toast('Reserva actualizada', 'good');
};

MODALS.hkroom = (_, no) => {
  const rm = room(no); const s = hkShown(rm); const occ = occupant(no);
  return {
    title: `Habitación ${no} · ${roomTypeName(rm.type)}`,
    body: `<p>${hkChip(rm)} · FO: <b>${rm.fo === 'OCC' ? 'Ocupada' : 'Vacía'}</b> · ${esc(rm.feat)}${occ ? ` · ${esc(pname(occ.profileId))} hasta ${fd(occ.dep)}` : ''}</p>
    ${s === 'OOO' || s === 'OOS' ? `<div class="note">${s}: ${esc((rm.ooo || rm.oos).reason)}${rm.ooo ? ` · ${fd(rm.ooo.from)} → ${fd(rm.ooo.to)}` : ''}</div><div class="row">${btn('Devolver a servicio', 'hkReturn', { no }, 'pri', 'data-tut="hk-return"')}</div>` : `
    <h3 class="h3">Estado de limpieza</h3><div class="row">${['DI', 'PU', 'CL', 'IP'].map(k => btn(HKS[k], 'hkSet', { no, s: k }, rm.hk === k ? 'pri' : '', `data-tut="hkset-${k}"`)).join('')}</div>
    <h3 class="h3">Fuera de orden (OOO): se quita del inventario vendible</h3><div class="form g3">${mfld('Desde', 'from', { type: 'date', min: BD() })}${mfld('Hasta (regresa)', 'to', { type: 'date', min: BD() })}${mfld('Motivo *', 'reason', { tut: 'ooo-reason' })}</div>
    <div class="row">${btn('Poner fuera de orden', 'hkOOO', { no }, 'danger', 'data-tut="ooo-ok"')}${btn('Fuera de servicio (OOS)', 'hkSet', { no, s: 'OOS' }, 'ghost')}</div><p class="hint">OOS: la habitación sigue en inventario pero no se asigna (detalle menor, p. ej. pintura).</p>`}`,
    foot: btn('Cerrar', 'closeModal'),
  };
};
A.hkSet = d => { if (d.s === 'OOS') { const rm = room(d.no); if (rm.fo === 'OCC') fail('La habitación está ocupada.'); rm.oos = { reason: ui.m.reason || 'Detalle menor', from: BD() }; log(`Hab. ${d.no} → OOS`); } else DO.setHK(d.no, d.s); closeModal(); toast(`Habitación ${d.no}: ${HKS[d.s]}`, 'good'); };
A.hkOOO = d => { DO.setOOO(d.no, ui.m.from, ui.m.to, ui.m.reason.trim()); closeModal(); toast(`Habitación ${d.no} fuera de orden`, 'good'); };
A.hkReturn = d => { DO.returnService(d.no); closeModal(); toast(`Habitación ${d.no} de vuelta en servicio (Sucia)`, 'good'); };

MODALS.profile = (_, id) => {
  const t = ui.m.type;
  return {
    title: id ? 'Editar perfil' : 'Nuevo perfil', wide: true,
    body: `<div class="form g4">${id ? '' : mfld('Tipo', 'type', { options: { IND: 'Individual', COM: 'Empresa', TA: 'Agencia de viajes' }, rr: 1 })}
    ${t === 'IND' ? mfld('Tratamiento', 'title') + mfld('Nombre *', 'first') + mfld('Apellido *', 'last') + mfld('VIP', 'vip', { options: VIPS }) + mfld('Documento', 'idType', { options: { 'Cédula': 'Cédula', 'Pasaporte': 'Pasaporte', 'Licencia': 'Licencia' } }) + mfld('N.º documento', 'idNo') + mfld('Empresa', 'companyId', { options: opt(companies(), '— Ninguna —') }) : mfld('Nombre de la entidad *', 'name') + mfld('Contacto', 'contact') + (t === 'COM' ? mfld('Cuenta AR (City Ledger)', 'ar') : mfld('Código IATA', 'iata'))}
    ${mfld('Correo', 'email', { type: 'email' })}${mfld('Teléfono', 'phone')}${mfld('País', 'country', { options: COUNTRIES })}${mfld('Idioma', 'lang', { options: { ES: 'Español', EN: 'Inglés', FR: 'Francés', IT: 'Italiano', DE: 'Alemán', JA: 'Japonés' } })}</div>
    <div class="form">${mfld('Preferencias y notas', 'notes', { type: 'textarea' })}</div>`,
    foot: btn('Cancelar', 'closeModal') + btn('Guardar perfil', 'doProfile', { id: id || '' }, 'pri'),
  };
};
A.doProfile = d => {
  const m = ui.m;
  if (m.type === 'IND' && (!m.first?.trim() || !m.last?.trim())) fail('Nombre y apellido son obligatorios.');
  if (m.type !== 'IND' && !m.name?.trim()) fail('Escribe el nombre de la entidad.');
  if (m.type === 'IND') { const dup = state.profiles.find(p => p.id !== d.id && p.type === 'IND' && p.first.toLowerCase() === m.first.trim().toLowerCase() && p.last.toLowerCase() === m.last.trim().toLowerCase()); if (dup && !m.dupOk) { m.dupOk = true; fail(`Ya existe un perfil ${pname(dup.id)}. Si es otra persona, pulsa Guardar de nuevo.`); } }
  const data = { ...m }; delete data.dupOk; ['first', 'last', 'name'].forEach(k => { if (data[k]) data[k] = data[k].trim(); });
  if (!data.companyId) data.companyId = null;
  let p; if (d.id) { p = profile(d.id); Object.assign(p, data); log(`Perfil actualizado: ${pname(p.id)}`); } else { p = newProfile(data); log(`Perfil creado: ${pname(p.id)}`); }
  closeModal(); ui.view = 'profile'; ui.param = p.id; toast('Perfil guardado', 'good');
};

MODALS.block = () => ({
  title: 'Nuevo bloque de grupo', wide: true,
  body: `<div class="form g4">${mfld('Código *', 'code', { ph: 'Ej.: BODAMR', tut: 'blk-code' })}${mfld('Nombre del grupo *', 'name', { cls: 'span2' })}${mfld('Empresa', 'companyId', { options: opt(companies(), '— Ninguna —') })}
  ${mfld('Llegada', 'arr', { type: 'date', min: BD(), tut: 'blk-arr' })}${mfld('Noches', 'nights', { type: 'number', min: 1 })}${mfld('Tarifa de grupo (USD)', 'rate', { type: 'number', min: 0 })}${mfld('Fecha de corte (cut-off)', 'cutoff', { type: 'date', min: BD() })}</div>
  <h3 class="h3">Habitaciones por noche</h3><div class="form g4" data-tut="blk-rooms">${CFG.roomTypes.map(t => mfld(`${t.code} · ${t.name}`, t.code, { type: 'number', min: 0 })).join('')}</div>
  <div class="form g2">${mfld('Estado inicial', 'status', { options: { TEN: 'TEN · Tentativo (no descuenta inventario)', DEF: 'DEF · Definitivo (descuenta inventario)' } })}</div>
  <p class="hint">Fecha de corte: después de esa fecha, las habitaciones no recogidas vuelven al inventario general (en la práctica se revisa en el informe de bloques).</p>`,
  foot: btn('Cancelar', 'closeModal') + btn('Crear bloque', 'doBlock', {}, 'pri', 'data-tut="blk-ok"'),
});
A.doBlock = () => {
  const m = ui.m; const code = m.code.trim().toUpperCase();
  if (!code || !m.name.trim()) fail('Código y nombre son obligatorios.');
  if (state.blocks.some(b => b.code === code)) fail('Ya existe un bloque con ese código.');
  const rooms = {}; CFG.roomTypes.forEach(t => { if (+m[t.code] > 0) rooms[t.code] = +m[t.code]; });
  if (!Object.keys(rooms).length) fail('Indica cuántas habitaciones por tipo.');
  if (m.arr < BD()) fail('La llegada no puede ser en el pasado.');
  const b = { id: 'B' + (++state.seq.block), code, name: m.name.trim(), companyId: m.companyId || null, arr: m.arr, dep: addDays(m.arr, +m.nights), rooms, rate: +m.rate, status: 'TEN', cutoff: m.cutoff, created: BD() };
  state.blocks.push(b); log(`Bloque ${code} creado (${Object.entries(rooms).map(([t, n]) => n + ' ' + t).join(', ')})`);
  if (m.status === 'DEF') A.blockStatus({ id: b.id, s: 'DEF' });
  closeModal(); toast(`Bloque ${code} creado`, 'good');
};
MODALS.closeday = () => ({ title: 'Cerrar el día de negocio', body: `<p>Vas a cerrar el <b>${fd(BD())}</b>. La nueva fecha de negocio será <b>${fd(addDays(BD(), 1))}</b>. ¿Continuar?</p>`, foot: btn('Volver', 'closeModal') + btn('Cerrar día', 'doCloseDay', {}, 'pri', 'data-tut="na-close-ok"') });
A.doCloseDay = () => { const old = BD(); closeDay(); closeModal(); toast(`Día ${fd(old)} cerrado. Nueva fecha de negocio: ${fd(BD())}`, 'good'); ui.view = 'reports'; ui.report = 'history'; };
MODALS.reset = () => ({ title: 'Restablecer hotel de práctica', body: '<p>Se borran todas tus reservas, perfiles y cambios, y el hotel vuelve al 24-NOV-26 con los datos de ejemplo. Tu progreso en la Academia se conserva.</p>', foot: btn('Volver', 'closeModal') + btn('Restablecer', 'doReset', {}, 'danger') });
A.doReset = () => { seed(); const p = prog; initUI(); prog = p; tut = null; activeCase = null; toast('Hotel restablecido', 'good'); };

/* ---------- Navegación general ---------- */
A.menu = d => { ui.menu = ui.menu === d.m ? null : d.m; };
A.go = d => { ui.menu = null; ui.modal = null; if (d.v === 'ltb') ui.ltb = freshLtb(); if (d.v === 'billing') { ui.param = null; ui.billFor = null; } ui.view = d.v; ui.param = d.id || (d.v === 'billing' ? null : ui.param); window.scrollTo(0, 0); };

/* ---------- Render ---------- */
function toast(msg, kind) {
  const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.setAttribute('role', 'status'); el.textContent = msg;
  $('#toast-root').appendChild(el); setTimeout(() => el.classList.add('out'), 3800); setTimeout(() => el.remove(), 4300);
}
function render() {
  renderTop();
  const v = VIEWS[ui.view] || VIEWS.home;
  $('#view').innerHTML = v();
  const mr = $('#modal-root');
  if (ui.modal && MODALS[ui.modal.k]) {
    const r = ui.modal.id ? resById(ui.modal.id) : null;
    const md = MODALS[ui.modal.k](r, ui.modal.id);
    mr.innerHTML = `<div class="overlay"><div class="modal ${md.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(md.title)}"><div class="mh"><h2>${esc(md.title)}</h2><button type="button" class="x" data-act="closeModal" aria-label="Cerrar">×</button></div><div class="mb">${md.body}</div><div class="mf">${md.foot}</div></div></div>`;
  } else mr.innerHTML = '';
  if (typeof renderCoach === 'function') renderCoach();
  save();
}
