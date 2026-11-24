'use strict';
/* =========================================================
   Atrio PMS — Academia: tutoriales en vivo, casos prácticos, vistas
   ========================================================= */
let tut = null;        // { id, i, ctx, scrolled }
let activeCase = null; // { id, ctx, hint }
const V = v => ui.view === v;
const M = k => ui.modal?.k === k;
const findProfile = (first, last) => state.profiles.find(p => p.type === 'IND' && p.first === first && p.last === last);
const ensureProfile = (o) => (findProfile(o.first, o.last) || newProfile(o)).id;
const companyByName = n => state.profiles.find(p => p.type === 'COM' && p.name === n)?.id;
const ready = no => { const rm = room(no); return rm && rm.fo === 'VAC' && !rm.oos && ['CL', 'IP'].includes(hkShown(rm)); };
function nav(menu, view, label) {
  return { t: `Abre el menú <b>${MENU.find(m => m.id === menu).label}</b> y elige <b>${label}</b>.`, target: () => ui.menu === menu ? `[data-tut="nav-${view}"]` : `[data-tut="menu-${menu}"]`, check: () => V(view) };
}
function freeVacant(type, arr, dep) { return state.rooms.find(x => x.type === type && x.fo === 'VAC' && !x.oos && !isOOO(x, BD()) && roomFree(x.no, arr, dep)); }
function makeInHouse(pid, type, nightsBefore, nightsAfter, extra = {}) {
  const rmx = freeVacant(type, addDays(BD(), -nightsBefore), addDays(BD(), nightsAfter)); if (!rmx) return null;
  const r = mkRes(Object.assign({ p: pid, arr: addDays(BD(), -nightsBefore), dep: addDays(BD(), nightsAfter), type, room: rmx.no, rate: 'BAR', status: 'CHECKED_IN', pay: 'VA' }, extra));
  r.ciDate = r.arr; r.ciTime = '15:00'; rmx.fo = 'OCC'; rmx.hk = 'DI';
  for (const d of nightsOf(r.arr, BD())) postNight(r, d);
  return r;
}

/* ---------- Tutoriales ---------- */
const TUTS = [
  {
    id: 't-tour', title: 'Recorrido por el sistema', mins: 4, mod: 'Fundamentos', desc: 'Menús, fecha de negocio, llegadas, housekeeping y Room Diary.',
    setup() { return {}; },
    steps: [
      { t: 'Bienvenido a <b>Atrio PMS</b>. Este tutorial se hace sobre el sistema real: tú haces cada clic y yo verifico. Arriba está el hotel y la <b>fecha de negocio</b>: es el día con el que trabaja el sistema, no el del reloj.', target: '[data-tut="bdate"]' },
      nav('frontdesk', 'arrivals', 'Llegadas'),
      { t: 'Estas son las <b>llegadas de hoy</b>. Fíjate en la columna <i>Estado hab.</i> (¿está lista la habitación?) y <i>Garantía</i> (¿qué pasa si no llega?). Los VIP aparecen primero.', target: '#view .tbl' },
      nav('inventory', 'hk', 'Housekeeping'),
      { t: 'Cada tarjeta es una habitación con su estado de limpieza (CL, DI, IP…) y de recepción (VAC/OCC). Los filtros de arriba cuentan cuántas hay de cada tipo.', target: '.fchips' },
      nav('bookings', 'diary', 'Room Diary'),
      { t: 'El <b>Room Diary</b> cruza habitaciones y noches. Las filas superiores dicen cuántas habitaciones quedan por tipo cada noche.', target: '.diary' },
      { t: 'Vuelve al inicio tocando el logo <b>AtrioPMS</b>.', target: '[data-tut="brand"]', check: () => V('home') },
      { t: 'Listo. Desde el inicio ves el resumen del día. La <b>Academia</b> tiene el resto de tutoriales, los casos prácticos y las guías.', target: '[data-tut="menu-academy"]' },
    ],
  },
  {
    id: 't-res', title: 'Crear una reserva', mins: 6, mod: 'Reservas', desc: 'Look To Book completo: búsqueda, tarifa, perfil, garantía y confirmación.',
    setup() { return { rossi: ensureProfile({ title: 'Sig.ra', first: 'Valentina', last: 'Rossi', country: 'IT', lang: 'IT' }) }; },
    steps: [
      { t: 'Valentina Rossi llama: quiere una habitación <b>Deluxe</b> para <b>2 personas</b>, <b>2 noches</b> desde hoy, tarifa flexible. Vamos a reservarla.' },
      nav('bookings', 'ltb', 'Look To Book'),
      { t: 'Deja la llegada en hoy. Escribe <b>2</b> en <i>Noches</i> y <b>2</b> en <i>Adultos</i>.', target: '[data-tut="ltb-form"]', check: () => V('ltb') && +ui.ltb.nights === 2 && +ui.ltb.adults === 2 },
      { t: 'Pulsa <b>Buscar disponibilidad</b>.', target: '[data-tut="ltb-search"]', check: () => ui.ltb.stage !== 'search' },
      { t: 'Cada fila es un tipo de habitación y cada columna un código de tarifa. Las celdas grises dicen por qué no se pueden vender (ADV14 está cerrada porque faltan menos de 14 días; CORP exige empresa).', target: '.tbl.rates' },
      { t: 'Elige la celda <b>DLX × BAR</b>.', target: '[data-tut="cell-DLX-BAR"]', check: () => ui.ltb.sel?.type === 'DLX' && ui.ltb.sel?.rate === 'BAR' },
      { t: 'Busca primero si ya existe el perfil: escribe <b>rossi</b> y pulsa <b>Buscar</b>.', target: '[data-tut="ltb-guest-q"]', check: c => ui.ltb.guest.results?.includes(c.rossi) || ui.ltb.guest.profileId === c.rossi },
      { t: 'Existe. Pulsa <b>Seleccionar</b> en Valentina Rossi.', target: c => `[data-tut="guest-${c.rossi}"]`, check: c => ui.ltb.guest.profileId === c.rossi },
      { t: 'Garantía <b>CC</b>, método <b>VA · Visa</b>, tarjeta <b>4111 1111 1111 1111</b>. Si quieres, marca el special <b>NS</b> (no fumar).', target: '[data-tut="ltb-details"]', check: () => ui.ltb.det.g === 'CC' && !!PAY[ui.ltb.det.pay]?.card && ui.ltb.det.card.replace(/\D/g, '').length >= 13 },
      { t: 'Pulsa <b>Confirmar reserva</b>.', target: '[data-tut="ltb-confirm"]', check: c => ui.ltb.stage === 'done' && resById(ui.ltb.resId)?.profileId === c.rossi },
      { t: 'Reserva creada. El <b>número de confirmación</b> es lo que das al huésped. Como llega hoy, ya aparece en Llegadas.', target: '[data-tut="ltb-conf"]' },
    ],
  },
  {
    id: 't-ci', title: 'Asignar habitación y check-in', mins: 5, mod: 'Recepción', desc: 'Del listado de llegadas a la entrega de llaves, respetando el estado de la habitación.',
    setup() {
      let r = state.reservations.find(x => x.status === 'RESERVED' && x.arr === BD() && pname(x.profileId) === 'Méndez, Laura');
      if (!r) r = mkRes({ p: ensureProfile({ title: 'Sra.', first: 'Laura', last: 'Méndez', idType: 'Cédula', idNo: '031-0099881-2' }), arr: BD(), n: 2, type: 'STD', rate: 'BAR', pay: 'VA', source: 'WEB' });
      if (r.room) r.room = '';
      if (!state.rooms.some(x => x.type === 'STD' && ready(x.no) && roomFree(x.no, r.arr, r.dep))) { const x = freeVacant('STD', r.arr, r.dep); if (x) x.hk = 'CL'; }
      return { id: r.id };
    },
    steps: [
      { t: 'Laura Méndez acaba de llegar. Tiene reserva STD para 2 noches. Vamos a registrarla.' },
      nav('frontdesk', 'arrivals', 'Llegadas'),
      { t: 'En la fila de <b>Laura Méndez</b> pulsa <b>Asignar</b>.', target: c => `[data-tut="assign-${c.id}"]`, check: c => M('assign') || !!resById(c.id).room },
      { t: 'Elige una habitación con la etiqueta verde <b>Lista</b> (vacía y Limpia o Inspeccionada) y pulsa <b>Asignar</b>. Las “Libre, no lista” están sucias: no admiten check-in.', target: '.modal', check: c => { const r = resById(c.id); return !!r.room && ready(r.room); }, hint: 'Si asignaste una sucia, pulsa Cambiar y elige una Lista.' },
      { t: 'Ahora pulsa <b>Check In</b> en su fila.', target: c => `[data-tut="ci-${c.id}"]`, check: c => M('checkin') || resById(c.id).status === 'CHECKED_IN' },
      { t: 'Revisa los datos, verifica el documento (ya viene del perfil) y pulsa <b>Confirmar check-in</b>.', target: '[data-tut="ci-confirm"]', check: c => resById(c.id).status === 'CHECKED_IN' },
      { t: 'Hecho. La habitación pasó a <b>Ocupada (OCC)</b> y la reserva a <b>IN HOUSE</b>. Ya no aparece en Llegadas pendientes.' },
    ],
  },
  {
    id: 't-folio', title: 'Cargos y pagos en el folio', mins: 5, mod: 'Caja', desc: 'Postear un consumo del restaurante y registrar un pago con tarjeta.',
    setup() {
      let r = state.reservations.find(x => x.status === 'CHECKED_IN' && pname(x.profileId) === 'Torres, Ana');
      if (!r) r = state.reservations.find(x => x.status === 'CHECKED_IN' && x.dep > BD() && windowsUsed(x).length === 1) || makeInHouse(ensureProfile({ title: 'Sra.', first: 'Ana', last: 'Torres', country: 'ES' }), 'DLX', 1, 2, { pay: 'MC' });
      return { id: r.id, p0: state.seq.post, name: pname(r.profileId) };
    },
    steps: [
      { t: c => `<b>${esc(c.name)}</b> cenó en el restaurante y firmó el cheque a su habitación: $48.50. Además quiere abonar su cuenta ahora.` },
      nav('frontdesk', 'inhouse', 'En casa'),
      { t: c => `Pulsa <b>Folio</b> en la fila de ${esc(c.name)}.`, target: c => `[data-tut="ih-folio-${c.id}"]`, check: c => V('billing') && ui.param === c.id },
      { t: 'Este es el folio. Cada línea tiene fecha, código y monto. Los cargos de habitación de las noches anteriores los posteó la auditoría.', target: '.windows' },
      { t: 'Pulsa <b>Postear cargo</b>.', target: '[data-tut="bill-post"]', check: c => M('post') || resById(c.id).folio.some(p => p.id > c.p0 && p.code === '2000') },
      { t: 'Código <b>2000 · Restaurante</b>, monto <b>48.50</b>, referencia <b>Cheque 6020</b>. Pulsa <b>Postear</b>.', target: '.modal', check: c => resById(c.id).folio.some(p => p.id > c.p0 && p.code === '2000' && Math.abs(p.amount - 48.5) < 0.01) },
      { t: 'Ahora pulsa <b>Pago</b>.', target: '[data-tut="bill-pay"]', check: c => M('pay') || resById(c.id).folio.some(p => p.id > c.p0 && p.code.startsWith('9')) },
      { t: 'Deja la ventana 1, el método de su tarjeta y el monto del saldo (botón <b>Usar saldo</b>). Pulsa <b>Registrar pago</b>.', target: '.modal', check: c => { const r = resById(c.id); return r.folio.some(p => p.id > c.p0 && p.code.startsWith('9')) && Math.abs(balance(r, 1)) < 0.005; } },
      { t: 'La ventana 1 quedó en <b>$0.00</b>. Esta noche la auditoría posteará la siguiente noche de habitación y el saldo volverá a subir: es normal.' },
    ],
  },
  {
    id: 't-co', title: 'Check-out', mins: 4, mod: 'Caja', desc: 'Liquidar el folio y dar salida a un huésped.',
    setup() {
      let r = state.reservations.find(x => x.status === 'CHECKED_IN' && x.dep === BD() && pname(x.profileId) === 'Pérez, Carlos');
      if (!r) r = state.reservations.find(x => x.status === 'CHECKED_IN' && x.dep === BD() && windowsUsed(x).length === 1) || makeInHouse(ensureProfile({ title: 'Sr.', first: 'Carlos', last: 'Pérez' }), 'STD', 2, 0);
      if (!r.folio.some(p => p.amount > 0)) post(r, '3000', 9, { desc: 'Minibar' });
      return { id: r.id, name: pname(r.profileId) };
    },
    steps: [
      { t: c => `<b>${esc(c.name)}</b> baja a recepción con su maleta. Sale hoy.` },
      nav('frontdesk', 'departures', 'Salidas'),
      { t: c => `Pulsa <b>Check Out</b> en la fila de ${esc(c.name)}.`, target: c => `[data-tut="co-${c.id}"]`, check: c => V('billing') && ui.param === c.id },
      { t: 'Revisa con el huésped los cargos. Para salir, cada ventana debe quedar en $0.00. Pulsa <b>Pago</b>.', target: '[data-tut="bill-pay"]', check: c => M('pay') || Math.abs(balance(resById(c.id))) < 0.005 },
      { t: 'Cobra el saldo completo con su tarjeta y pulsa <b>Registrar pago</b>.', target: '.modal', check: c => windowsUsed(resById(c.id)).every(w => Math.abs(balance(resById(c.id), w)) < 0.005) },
      { t: 'Saldo en cero. Pulsa <b>Check Out</b>.', target: '[data-tut="bill-checkout"]', check: c => M('checkout') || resById(c.id).status === 'CHECKED_OUT' },
      { t: 'Pulsa <b>Confirmar check-out</b>.', target: '[data-tut="co-confirm"]', check: c => resById(c.id).status === 'CHECKED_OUT' },
      { t: 'Esta es la factura de cada ventana. La habitación quedó <b>Vacía y Sucia</b>: ama de llaves ya la ve en su tablero.', target: '.modal' },
    ],
  },
  {
    id: 't-hk', title: 'Housekeeping y fuera de orden', mins: 4, mod: 'Housekeeping', desc: 'Cambiar estados de limpieza y sacar una habitación del inventario.',
    setup() {
      const r110 = room('110'); r110.ooo = null; r110.oos = null;
      state.reservations.filter(r => r.status === 'RESERVED' && r.room === '110').forEach(r => { r.room = ''; });
      if (r110.fo === 'OCC') { const o = occupant('110'); if (o) { const alt = freeVacant('STD', BD(), o.dep); if (alt) { o.room = alt.no; alt.fo = 'OCC'; } } r110.fo = 'VAC'; }
      r110.hk = 'CL';
      let dirty = state.rooms.filter(x => x.fo === 'VAC' && hkShown(x) === 'DI').map(x => x.no);
      if (!dirty.length) { const x = state.rooms.find(y => y.fo === 'VAC' && !y.ooo && !y.oos && y.no !== '110'); x.hk = 'DI'; dirty = [x.no]; }
      return { dirty };
    },
    steps: [
      nav('inventory', 'hk', 'Housekeeping'),
      { t: 'Filtra las habitaciones <b>Sucias</b>.', target: '[data-tut="hkf-DI"]', check: () => ui.hk.filter === 'DI' },
      { t: c => `La camarera terminó la <b>${c.dirty[0]}</b> y la supervisora la revisó. Tócala.`, target: c => `[data-tut="hk-${c.dirty[0]}"]`, check: c => (M('hkroom') && ui.modal.id === c.dirty[0]) || room(c.dirty[0]).hk === 'IP' },
      { t: 'Pulsa <b>Inspeccionada (Inspected)</b>.', target: '[data-tut="hkset-IP"]', check: c => ['IP', 'CL'].includes(room(c.dirty[0]).hk) },
      { t: 'Ahora quita el filtro: pulsa <b>Todas</b>.', target: '[data-tut="hkf-ALL"]', check: () => ui.hk.filter === '' },
      { t: 'Mantenimiento avisa que el aire de la <b>110</b> no enfría y tardarán 2 días. Toca la 110.', target: '[data-tut="hk-110"]', check: () => (M('hkroom') && ui.modal.id === '110') || !!room('110').ooo },
      { t: 'Deja las fechas propuestas, escribe el motivo <b>Aire acondicionado no enfría</b> y pulsa <b>Poner fuera de orden</b>.', target: '.modal', check: () => !!room('110').ooo },
      { t: 'La 110 sale del inventario vendible: la disponibilidad STD bajó en 1 para esas noches (puedes verlo en el Room Diary). Cuando mantenimiento termine, se usa <b>Devolver a servicio</b> y queda Sucia para limpiarla.' },
    ],
  },
  {
    id: 't-na', title: 'Auditoría nocturna', mins: 8, mod: 'Cierre', desc: 'Resolver pendientes, postear habitaciones, informes y cambio de fecha.',
    setup() { return { d0: BD() }; },
    steps: [
      { t: 'Son las 11:58 p. m. Eres el auditor nocturno. Vamos a cerrar el día.' },
      nav('financials', 'audit', 'Auditoría nocturna'),
      { t: 'Paso 1: para cada llegada pendiente decide. Si el huésped no llegó, pulsa <b>No-Show</b> (las 6PM salen sin cargo; las garantizadas cobran una noche). Si llegó, haz su check-in.', target: '.audit .panel', check: () => !pendingArrivals().length, hint: 'Tip: abre el paso 2 cuando la lista quede vacía.' },
      { t: 'Abre el <b>paso 2 · Salidas pendientes</b>.', target: '[data-tut="na-step-1"]', check: () => ui.na.step >= 1 || (!pendingDepartures().length && ui.na.step > 1) },
      { t: 'Cada huésped que sale hoy y sigue en casa: haz su check-out (cobra y sal) o pulsa <b>Extender 1 noche</b> si se queda.', target: '.audit .panel', check: () => !pendingDepartures().length },
      { t: 'Abre el <b>paso 3</b> y pulsa <b>Postear</b>.', target: () => ui.na.step === 2 ? '[data-tut="na-post"]' : '[data-tut="na-step-2"]', check: () => !unposted().length && !pendingDepartures().length },
      { t: 'En el paso 4 revisa el informe gerencial: ocupación, ADR y RevPAR. Pulsa <b>Generar y archivar informes</b>.', target: () => ui.na.step === 3 ? '[data-tut="na-reports"]' : '[data-tut="na-step-3"]', check: () => ui.na.reports },
      { t: 'Paso 5: pulsa <b>Cerrar día y avanzar fecha</b> y confirma.', target: () => M('closeday') ? '[data-tut="na-close-ok"]' : '[data-tut="na-close"]', check: c => BD() !== c.d0 },
      { t: 'Día cerrado. Mira la nueva fecha de negocio arriba. En <b>Informes › Historial de auditorías</b> queda el resumen del día.', target: '[data-tut="bdate"]' },
    ],
  },
  {
    id: 't-blk', title: 'Bloque de grupo y pickup', mins: 6, mod: 'Grupos', desc: 'Crear un bloque, hacerlo definitivo y recoger una reserva.',
    setup() { return { b0: state.seq.block }; },
    steps: [
      { t: 'Una pareja reserva habitaciones para los invitados de su boda: 4 Deluxe durante 3 noches, dentro de 10 días, a $150.' },
      nav('bookings', 'blocks', 'Bloques de grupo'),
      { t: 'Pulsa <b>Nuevo bloque</b>.', target: '[data-tut="block-new"]', check: c => M('block') || state.seq.block > c.b0 },
      { t: 'Código <b>BODA</b> (o el que quieras), nombre del grupo, deja la llegada propuesta y 3 noches, <b>4</b> en DLX, tarifa <b>150</b>, estado TEN. Pulsa <b>Crear bloque</b>.', target: '.modal', check: c => state.seq.block > c.b0 },
      { t: 'El bloque está <b>TEN</b> (tentativo): no descuenta inventario. La pareja firmó el contrato: pulsa <b>Hacer DEF</b>.', target: c => `[data-tut="block-def-B${c.b0 + 1}"]`, check: c => block('B' + (c.b0 + 1))?.status === 'DEF' },
      { t: 'Llegó el primer nombre de la rooming list. Pulsa <b>Reservar en bloque</b>.', target: c => `[data-tut="block-pick-B${c.b0 + 1}"]`, check: c => V('ltb') && ui.ltb.blockId === 'B' + (c.b0 + 1) },
      { t: 'Pulsa Buscar, elige <b>DLX × GRP</b>, busca o crea el huésped y confirma con su tarjeta.', target: '#view', check: c => state.reservations.some(r => r.blockId === 'B' + (c.b0 + 1) && isActive(r)) },
      { t: 'Primer pickup hecho. Vuelve a <b>Bloques</b> para ver la barra de pickup y la rooming list.', target: '[data-tut="menu-bookings"]' },
    ],
  },
];

/* ---------- Casos prácticos ---------- */
const CASES = [
  {
    id: 'c-vip', title: 'Llegada VIP temprana', level: 'Intermedio', mins: 8,
    story: 'Son las 10:30 a. m. y llega el <b>Sr. Roberto Almonte</b>, huésped VIP Platinum (V2), con reserva Deluxe. Política del hotel: los VIP solo entran a habitaciones <b>inspeccionadas</b>, y conserjería debe recibir la orden de la amenidad de bienvenida. Todas las Deluxe vacías están sucias.',
    setup() {
      let r = state.reservations.find(x => x.status === 'RESERVED' && x.arr === BD() && pname(x.profileId) === 'Almonte, Roberto');
      if (!r) r = mkRes({ p: ensureProfile({ title: 'Sr.', first: 'Roberto', last: 'Almonte', vip: 'V2' }), arr: BD(), n: 3, type: 'DLX', rate: 'BAR', pay: 'AX', alerts: [{ area: 'CI', text: 'VIP V2: carta de bienvenida y amenidad.' }] });
      r.room = ''; state.rooms.filter(x => x.type === 'DLX' && x.fo === 'VAC' && !isOOO(x, BD())).forEach(x => { x.hk = 'DI'; });
      return { id: r.id };
    },
    goals: [
      { t: 'Una Deluxe vacía queda Inspeccionada (simula la revisión de la supervisora en Housekeeping)', check: () => state.rooms.some(x => x.type === 'DLX' && x.hk === 'IP') },
      { t: 'La reserva tiene asignada una Deluxe inspeccionada', check: c => { const r = resById(c.id); return !!r.room && room(r.room).type === 'DLX' && room(r.room).hk === 'IP'; } },
      { t: 'Hay un trace para Conserjería (CON) o Ama de llaves (HK) con la amenidad', check: c => resById(c.id).traces.some(t => ['CON', 'HK'].includes(t.dept)) },
      { t: 'El Sr. Almonte queda registrado (IN HOUSE)', check: c => resById(c.id).status === 'CHECKED_IN' },
    ],
    hint: 'Housekeeping › toca una DLX sucia › Inspeccionada. Luego Llegadas › Asignar. En la reserva, Traces › Añadir (CON). Por último, Check In.',
  },
  {
    id: 'c-split', title: 'Cuenta dividida con empresa', level: 'Avanzado', mins: 10,
    story: 'La <b>Sra. Gabriela Núñez</b>, del <b>Banco Antillano</b>, sale hoy. El contrato dice: el banco paga <b>habitación e impuestos</b> por Direct Bill y la huésped paga sus <b>extras</b> con su tarjeta. Al hacer el check-in nadie configuró el routing y todo está en la ventana 1.',
    setup() {
      const bank = companyByName('Banco Antillano');
      const pid = ensureProfile({ title: 'Sra.', first: 'Gabriela', last: 'Núñez', companyId: bank, idType: 'Cédula', idNo: '001-5566778-9' });
      const r = makeInHouse(pid, 'STD', 2, 0, { company: bank, pay: 'VA', card: '•••• 1881', market: 'CORP' });
      if (!r) return { err: true };
      post(r, '3000', 18, { date: addDays(BD(), -1), desc: 'Minibar' }); post(r, '2000', 40.5, { ref: 'Cheque 6107' });
      return { id: r.id, bank };
    },
    goals: [
      { t: 'Routing de 1000, 1010 y 1020 a una ventana cuyo pagador es Banco Antillano', check: c => { const r = resById(c.id); return r.routing.some(rt => ['1000', '1010', '1020'].every(x => rt.codes.includes(x)) && r.windows[rt.window]?.payee === c.bank); } },
      { t: 'Todos los cargos de habitación e impuestos están en la ventana del banco', check: c => { const r = resById(c.id); const rt = r.routing.find(x => x.codes.includes('1000')); return !!rt && r.folio.filter(p => ['1000', '1010', '1020'].includes(p.code)).every(p => p.window === rt.window); } },
      { t: 'La ventana del banco se liquida a City Ledger (9100)', check: c => { const r = resById(c.id); const rt = r.routing.find(x => x.codes.includes('1000')); return !!rt && r.folio.some(p => p.code === '9100' && p.window === rt.window) && Math.abs(balance(r, rt.window)) < 0.005; } },
      { t: 'La huésped paga sus extras de la ventana 1 con tarjeta', check: c => { const r = resById(c.id); return r.folio.some(p => ['9004', '9005', '9006'].includes(p.code) && p.window === 1) && Math.abs(balance(r, 1)) < 0.005; } },
      { t: 'Check-out realizado', check: c => resById(c.id).status === 'CHECKED_OUT' },
    ],
    hint: 'En el folio: Routing › marca 1000/1010/1020 › ventana 2 › pagador Banco Antillano › marca “Mover también los cargos ya posteados”. Luego Pago en ventana 2 con DB y en ventana 1 con VA.',
  },
  {
    id: 'c-ns', title: 'No-shows en la auditoría', level: 'Intermedio', mins: 10,
    story: 'Es casi medianoche. Dos huéspedes no llegaron: <b>Andrés Castillo</b> (reserva <b>6PM</b>, sin tarjeta) y <b>Miguel Santana</b> (garantizada con <b>tarjeta</b>). Aplica la política correcta a cada uno y cierra el día. Resuelve también cualquier otra llegada o salida pendiente.',
    setup() {
      const a = mkRes({ p: ensureProfile({ title: 'Sr.', first: 'Andrés', last: 'Castillo', country: 'CO' }), arr: BD(), n: 2, type: 'STD', rate: 'BAR', g: '6PM', pay: '', card: '', source: 'PHN' });
      const b = mkRes({ p: ensureProfile({ title: 'Sr.', first: 'Miguel', last: 'Santana' }), arr: BD(), n: 1, type: 'STD', rate: 'BAR', g: 'CC', pay: 'VA', source: 'WEB' });
      return { a: a.id, b: b.id, d0: BD() };
    },
    goals: [
      { t: 'Castillo (6PM) marcado No-Show sin cargo', check: c => resById(c.a).status === 'NO_SHOW' && !resById(c.a).folio.some(p => p.code === '7000') },
      { t: 'Santana (garantizada) marcado No-Show con cargo de una noche', check: c => resById(c.b).status === 'NO_SHOW' && resById(c.b).folio.some(p => p.code === '7000') },
      { t: 'Día cerrado: la fecha de negocio avanzó', check: c => BD() > c.d0 },
    ],
    hint: 'Finanzas › Auditoría nocturna. En el paso 1 usa No-Show para ambos. Luego completa los pasos 2 a 5.',
  },
  {
    id: 'c-upg', title: 'Sin disponibilidad: upgrade', level: 'Intermedio', mins: 7,
    story: c => `El <b>Sr. Daniel Reyes</b> llama: quiere una <b>Estándar</b> para el <b>${fd(c.d)}</b>, 2 noches, tarifa BAR. Un congreso ocupó todas las Estándar. Para no perder la venta, gerencia autoriza darle una <b>Deluxe cobrando la tarifa BAR de Estándar</b>.`,
    setup() {
      const d = addDays(BD(), 7); const dep = addDays(d, 2);
      const need = Math.max(0, minAvail('STD', d, dep));
      if (need > 0) { state.blocks.push({ id: 'B' + (++state.seq.block), code: 'EXPOTUR' + state.seq.block, name: 'Feria de Turismo', companyId: null, arr: d, dep, rooms: { STD: need }, rate: 110, status: 'DEF', cutoff: addDays(BD(), 3), created: BD() }); }
      return { d, pid: ensureProfile({ title: 'Sr.', first: 'Daniel', last: 'Reyes', country: 'PR' }) };
    },
    goals: [
      { t: 'Reserva activa para Daniel Reyes con llegada en la fecha pedida y 2 noches', check: c => state.reservations.some(r => r.profileId === c.pid && isActive(r) && r.arr === c.d && diffDays(r.arr, r.dep) === 2) },
      { t: 'Tipo de habitación: DLX', check: c => state.reservations.some(r => r.profileId === c.pid && isActive(r) && r.arr === c.d && r.roomType === 'DLX') },
      { t: 'Tipo a cobrar (RTC) STD con tarifa BAR a $129.00', check: c => state.reservations.some(r => r.profileId === c.pid && isActive(r) && r.arr === c.d && r.rtc === 'STD' && r.rate === 'BAR' && Math.abs(r.amount - 129) < 0.01) },
    ],
    hint: 'En Look To Book verás STD sin disponibilidad. Reserva DLX × BAR y después, en la reserva, Editar › Tipo a cobrar (RTC) = STD. El monto se recalcula a $129.',
  },
  {
    id: 'c-early', title: 'Salida anticipada con queja', level: 'Intermedio', mins: 7,
    story: 'La <b>Sra. Marie Dubois</b> baja molesta: el ruido de la calle no la dejó dormir y decide irse <b>hoy</b>, antes de su fecha. El gerente aprueba una compensación de <b>$50</b> sobre la habitación. Registra el problema para mantenimiento, ajusta, cobra y dale salida.',
    setup() {
      let r = state.reservations.find(x => x.status === 'CHECKED_IN' && pname(x.profileId) === 'Dubois, Marie' && x.dep > BD());
      if (!r) r = makeInHouse(ensureProfile({ title: 'Mme.', first: 'Marie', last: 'Dubois', country: 'FR' }), 'STD', 1, 3);
      if (!r.folio.some(p => p.code === '1000')) postNight(r, addDays(BD(), -1));
      return { id: r.id, p0: state.seq.post, dep0: r.dep };
    },
    goals: [
      { t: 'Trace para Mantenimiento (ENG) por el ruido en la habitación', check: c => resById(c.id).traces.some(t => t.dept === 'ENG') },
      { t: 'Ajuste 1099 de $50.00 con motivo', check: c => resById(c.id).folio.some(p => p.id > c.p0 && p.code === '1099' && Math.abs(p.amount + 50) < 0.01) },
      { t: 'Folio en $0.00', check: c => Math.abs(balance(resById(c.id))) < 0.005 },
      { t: 'Check-out hoy como salida anticipada', check: c => { const r = resById(c.id); return r.status === 'CHECKED_OUT' && r.coDate === BD() && c.dep0 > BD(); } },
    ],
    hint: 'En la reserva: Traces › ENG. En el folio: Ajuste (1099, 50, motivo), Pago por el saldo, Check Out.',
  },
  {
    id: 'c-walk', title: 'Walk-in que paga en efectivo', level: 'Básico', mins: 6,
    story: 'Llega el <b>Sr. Tomás Herrera</b> sin reserva. Quiere una <b>Estándar</b> por <b>1 noche</b> y pagará en <b>efectivo</b>. Política: los walk-in en efectivo pagan la noche completa con impuestos por adelantado.',
    setup() { if (!state.rooms.some(x => x.type === 'STD' && ready(x.no) && roomFree(x.no, BD(), addDays(BD(), 1)))) { const x = freeVacant('STD', BD(), addDays(BD(), 1)); if (x) x.hk = 'CL'; } return {}; },
    goals: [
      { t: 'Perfil creado para Tomás Herrera', check: () => state.profiles.some(p => p.type === 'IND' && /^tom[aá]s$/i.test(p.first) && /^herrera$/i.test(p.last)) },
      { t: 'Reserva con origen WLK y huésped en casa', check: () => state.reservations.some(r => /herrera/i.test(pname(r.profileId)) && r.source === 'WLK' && r.status === 'CHECKED_IN') },
      { t: 'Pago en efectivo (9000) de al menos una noche con impuestos', check: () => state.reservations.some(r => /herrera/i.test(pname(r.profileId)) && r.source === 'WLK' && -r.folio.filter(p => p.code === '9000').reduce((a, p) => a + p.amount, 0) >= nightTotal(r) - 0.01) },
    ],
    hint: 'Recepción › Walk-in. Crea el perfil, garantía DEP, pago CA, elige habitación. Luego en el folio: Pago › CA › $165.12.',
  },
  {
    id: 'c-grp', title: 'Boda: bloque y rooming list', level: 'Avanzado', mins: 10,
    story: 'Ventas cerró una boda: <b>5 Deluxe</b> por <b>3 noches</b> a <b>$150</b>, con contrato firmado. Ya llegaron los dos primeros nombres de la rooming list.',
    setup() { return { b0: state.seq.block }; },
    goals: [
      { t: 'Bloque nuevo con al menos 5 DLX por 3 noches', check: c => state.blocks.some(b => +b.id.slice(1) > c.b0 && (b.rooms.DLX || 0) >= 5 && diffDays(b.arr, b.dep) === 3) },
      { t: 'El bloque está en estado DEF', check: c => state.blocks.some(b => +b.id.slice(1) > c.b0 && (b.rooms.DLX || 0) >= 5 && b.status === 'DEF') },
      { t: 'Dos reservas recogidas (pickup) del bloque', check: c => state.blocks.some(b => +b.id.slice(1) > c.b0 && state.reservations.filter(r => r.blockId === b.id && isActive(r)).length >= 2) },
    ],
    hint: 'Reservas › Bloques › Nuevo bloque (DLX 5, 3 noches, 150). Hacer DEF. Reservar en bloque dos veces con huéspedes distintos.',
  },
  {
    id: 'c-move', title: 'Avería: cambio de habitación', level: 'Intermedio', mins: 6,
    story: 'El <b>Sr. Kenji Watanabe</b> (VIP Gold) llama desde la Suite 405: el aire acondicionado dejó de funcionar. Mantenimiento dice que la reparación lleva <b>3 días</b>. Muévelo a la otra suite, saca la 405 de inventario y avisa a mantenimiento.',
    setup() {
      let r = state.reservations.find(x => x.status === 'CHECKED_IN' && pname(x.profileId) === 'Watanabe, Kenji');
      const s5 = room('405'), s6 = room('406');
      if (!r || r.room !== '405') {
        if (s5.fo === 'OCC') { const o = occupant('405'); if (o) o.status = 'CHECKED_OUT'; }
        r = mkRes({ p: ensureProfile({ title: 'Mr.', first: 'Kenji', last: 'Watanabe', vip: 'V1', country: 'JP' }), arr: addDays(BD(), -1), dep: addDays(BD(), 2), type: 'STE', room: '405', rate: 'RACK', status: 'CHECKED_IN', pay: 'AX' });
        r.ciDate = r.arr; s5.fo = 'OCC'; postNight(r, addDays(BD(), -1));
      }
      s5.ooo = null; s6.ooo = null; s6.oos = null; s6.hk = 'CL';
      if (s6.fo === 'OCC') { const o = occupant('406'); if (o) { o.status = 'CHECKED_OUT'; o.coDate = BD(); } s6.fo = 'VAC'; }
      state.reservations.filter(x => x.status === 'RESERVED' && x.room === '406').forEach(x => { x.room = ''; });
      return { id: r.id };
    },
    goals: [
      { t: 'Room Move del huésped a otra suite (STE)', check: c => { const r = resById(c.id); return r.status === 'CHECKED_IN' && r.room !== '405' && room(r.room).type === 'STE'; } },
      { t: 'La 405 queda fuera de orden (OOO)', check: () => !!room('405').ooo },
      { t: 'Trace para Mantenimiento (ENG) sobre el aire acondicionado', check: c => resById(c.id).traces.some(t => t.dept === 'ENG') },
    ],
    hint: 'En la reserva del huésped: Room Move a la 406. Luego Housekeeping › 405 › Poner fuera de orden. Por último Traces › ENG.',
  },
];

/* ---------- Motor de tutoriales y casos ---------- */
A.tutStart = d => {
  const T = TUTS.find(x => x.id === d.id); activeCase = null;
  ui.modal = null; ui.menu = null;
  const ctx = T.setup() || {};
  tut = { id: T.id, i: 0, ctx, scrolled: -1, min: false };
  log(`Tutorial iniciado: ${T.title}`); ui.view = d.stay ? ui.view : 'home'; window.scrollTo(0, 0);
};
A.tutNext = () => { if (!tut) return; const T = TUTS.find(x => x.id === tut.id); tut.i++; if (tut.i >= T.steps.length) finishTut(); };
A.tutPrev = () => { if (tut && tut.i > 0) tut.i--; };
A.tutExit = () => { tut = null; clearHl(); };
A.tutMin = () => { if (tut) tut.min = !tut.min; if (activeCase) activeCase.min = !activeCase.min; };
function finishTut() { const T = TUTS.find(x => x.id === tut.id); prog.tuts[T.id] = true; tut = null; clearHl(); save(); toast(`Tutorial completado: ${T.title}`, 'good'); }
A.caseStart = d => {
  const C = CASES.find(x => x.id === d.id); tut = null; ui.modal = null;
  const ctx = C.setup() || {};
  if (ctx.err) fail('No hay habitaciones libres para preparar este caso. Restablece el hotel en Configuración.');
  activeCase = { id: C.id, ctx, hint: false, min: false }; log(`Caso iniciado: ${C.title}`); ui.view = 'home'; window.scrollTo(0, 0);
};
A.caseHint = () => { if (activeCase) activeCase.hint = !activeCase.hint; };
A.caseExit = () => { activeCase = null; };
A.caseFinish = () => {
  const C = CASES.find(x => x.id === activeCase.id); const ok = C.goals.filter(g => { try { return g.check(activeCase.ctx); } catch (e) { return false; } }).length;
  const score = Math.round(ok / C.goals.length * 100); prog.cases[C.id] = Math.max(prog.cases[C.id] || 0, score);
  activeCase = null; save(); toast(`Caso “${C.title}”: ${score}% (${ok}/${C.goals.length} objetivos)`, score === 100 ? 'good' : 'warn');
};
function clearHl() { $$('.tut-hl').forEach(e => e.classList.remove('tut-hl')); }
const val = (x, c) => typeof x === 'function' ? x(c) : x;
function renderCoach() {
  const root = $('#coach-root');
  drawCoach(root);
  const c = root.querySelector('.coach'); const top = !!(c && ui.modal);
  if (c) c.classList.toggle('top', top);
  document.body.classList.toggle('coaching', !!c);
  document.documentElement.style.setProperty('--coach-h', top ? c.offsetHeight + 'px' : '0px');
}
function drawCoach(root) {
  if (tut) {
    const T = TUTS.find(x => x.id === tut.id); const s = T.steps[tut.i]; const n = T.steps.length;
    root.innerHTML = `<aside class="coach ${tut.min ? 'min' : ''}" aria-live="polite"><div class="ch"><span class="eyebrow">Tutorial en vivo · ${tut.i + 1}/${n}</span><b>${esc(T.title)}</b><button type="button" class="x" data-act="tutMin" aria-label="Minimizar">${tut.min ? '▴' : '▾'}</button></div>
      ${tut.min ? '' : `<div class="cprog"><i style="width:${(tut.i) / n * 100}%"></i></div><div class="cb">${val(s.t, tut.ctx)}${s.hint ? `<p class="hint">${s.hint}</p>` : ''}</div>
      <div class="cf">${btn('Salir', 'tutExit', {}, 'sm ghost')}${tut.i > 0 ? btn('Atrás', 'tutPrev', {}, 'sm ghost') : ''}<span class="grow"></span>${s.check ? `<span class="wait">Esperando tu acción…</span>${btn('Saltar', 'tutNext', {}, 'sm ghost')}` : btn(tut.i === n - 1 ? 'Terminar' : 'Siguiente', 'tutNext', {}, 'sm pri')}</div>`}</aside>`;
    applyHl();
  } else if (activeCase) {
    const C = CASES.find(x => x.id === activeCase.id); const c = activeCase.ctx;
    const res = C.goals.map(g => { try { return !!g.check(c); } catch (e) { return false; } });
    root.innerHTML = `<aside class="coach case ${activeCase.min ? 'min' : ''}"><div class="ch"><span class="eyebrow">Caso práctico · ${res.filter(Boolean).length}/${res.length}</span><b>${esc(C.title)}</b><button type="button" class="x" data-act="tutMin" aria-label="Minimizar">${activeCase.min ? '▴' : '▾'}</button></div>
      ${activeCase.min ? '' : `<div class="cb"><p>${val(C.story, c)}</p><ul class="goals">${C.goals.map((g, i) => `<li class="${res[i] ? 'ok' : ''}"><span>${res[i] ? '✓' : ''}</span>${esc(g.t)}</li>`).join('')}</ul>${activeCase.hint ? `<div class="note info small">${esc(C.hint)}</div>` : ''}</div>
      <div class="cf">${btn('Abandonar', 'caseExit', {}, 'sm ghost')}${btn(activeCase.hint ? 'Ocultar pista' : 'Ver pista', 'caseHint', {}, 'sm ghost')}<span class="grow"></span>${btn('Terminar y evaluar', 'caseFinish', {}, 'sm pri')}</div>`}</aside>`;
    clearHl();
  } else { root.innerHTML = ''; clearHl(); }
}
function applyHl() {
  if (!tut) return; const T = TUTS.find(x => x.id === tut.id); const s = T.steps[tut.i];
  const sel = val(s.target, tut.ctx); const el = sel ? $(sel) : null;
  $$('.tut-hl').forEach(e => { if (e !== el) e.classList.remove('tut-hl'); });
  if (el) { el.classList.add('tut-hl'); if (tut.scrolled !== tut.i) {
    tut.scrolled = tut.i; const r = el.getBoundingClientRect(); const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (el.closest('.overlay')) { if (!el.classList.contains('modal')) el.scrollIntoView({ block: 'nearest', behavior: smooth }); }
    else if (r.top < 60 || r.bottom > innerHeight - 180) el.scrollIntoView({ block: 'center', behavior: smooth });
  } }
}
let lastCaseSig = '';
function tick() {
  if (tut) {
    const T = TUTS.find(x => x.id === tut.id); const s = T.steps[tut.i];
    let ok = false; try { ok = s.check && s.check(tut.ctx); } catch (e) { ok = false; }
    if (ok) { tut.i++; if (tut.i >= T.steps.length) finishTut(); renderCoach(); } else applyHl();
  } else if (activeCase && !activeCase.min) {
    const C = CASES.find(x => x.id === activeCase.id); const sig = C.goals.map(g => { try { return g.check(activeCase.ctx) ? 1 : 0; } catch (e) { return 0; } }).join('');
    if (sig !== lastCaseSig) { lastCaseSig = sig; renderCoach(); }
  }
}

/* ---------- Vista Academia ---------- */
const PATH = [
  { t: 'Fundamentos', items: [['guide', 'g-intro'], ['tut', 't-tour'], ['guide', 'g-map']] },
  { t: 'Reservas y perfiles', items: [['guide', 'g-res'], ['guide', 'g-prof'], ['tut', 't-res'], ['guide', 'g-inv'], ['case', 'c-upg']] },
  { t: 'Recepción', items: [['guide', 'g-ci'], ['tut', 't-ci'], ['case', 'c-walk'], ['case', 'c-vip']] },
  { t: 'Caja y salidas', items: [['guide', 'g-bill'], ['tut', 't-folio'], ['guide', 'g-co'], ['tut', 't-co'], ['case', 'c-early'], ['case', 'c-split']] },
  { t: 'Housekeeping', items: [['guide', 'g-hk'], ['tut', 't-hk'], ['case', 'c-move']] },
  { t: 'Grupos', items: [['guide', 'g-grp'], ['tut', 't-blk'], ['case', 'c-grp']] },
  { t: 'Cierre del día', items: [['guide', 'g-na'], ['tut', 't-na'], ['case', 'c-ns']] },
];
function itemDone(kind, id) { return kind === 'tut' ? !!prog.tuts[id] : kind === 'case' ? prog.cases[id] === 100 : !!prog.guides[id]; }
function itemCard(kind, id) {
  if (kind === 'guide') { const g = GUIDES.find(x => x.id === id); return `<button type="button" class="litem ${itemDone(kind, id) ? 'ok' : ''}" data-act="openGuide" data-id="${id}"><span class="lk">Guía</span><b>${esc(g.title)}</b><small>${g.mins} min de lectura</small></button>`; }
  if (kind === 'tut') { const t = TUTS.find(x => x.id === id); return `<button type="button" class="litem tut ${itemDone(kind, id) ? 'ok' : ''}" data-act="tutStart" data-id="${id}"><span class="lk">Tutorial en vivo</span><b>${esc(t.title)}</b><small>${t.mins} min · ${esc(t.desc)}</small></button>`; }
  const c = CASES.find(x => x.id === id); const sc = prog.cases[id];
  return `<button type="button" class="litem case ${itemDone(kind, id) ? 'ok' : ''}" data-act="caseStart" data-id="${id}"><span class="lk">Caso · ${c.level}</span><b>${esc(c.title)}</b><small>${c.mins} min${sc != null ? ` · mejor nota ${sc}%` : ''}</small></button>`;
}
VIEWS.academy = () => {
  const tab = ui.acad.tab; const all = PATH.flatMap(p => p.items); const done = all.filter(([k, id]) => itemDone(k, id)).length;
  const tabs = [['path', 'Ruta de aprendizaje'], ['tuts', 'Tutoriales en vivo'], ['cases', 'Casos prácticos'], ['guides', 'Guías'], ['gloss', 'Glosario'], ['quiz', 'Evaluación']];
  let body = '';
  if (tab === 'path') body = `<p class="lead">Sigue los niveles en orden. Cada uno combina una guía corta, un tutorial que haces sobre el sistema con ayuda paso a paso, y un caso práctico que resuelves solo y el sistema evalúa.</p>${PATH.map((lv, i) => { const d = lv.items.filter(([k, id]) => itemDone(k, id)).length; return `<section class="level"><div class="lvh"><span class="lvn">Nivel ${i + 1}</span><h2>${lv.t}</h2><span class="lvp">${d}/${lv.items.length}</span></div><div class="litems">${lv.items.map(([k, id]) => itemCard(k, id)).join('')}</div></section>`; }).join('')}
    <section class="level"><div class="lvh"><span class="lvn">Final</span><h2>Evaluación de conocimientos</h2><span class="lvp">${prog.quiz != null ? prog.quiz + '%' : '—'}</span></div><div class="litems"><button type="button" class="litem" data-act="acadTab" data-t="quiz"><span class="lk">Evaluación</span><b>${QUIZ.length} preguntas</b><small>Con explicación de cada respuesta</small></button></div></section>`;
  if (tab === 'tuts') body = `<p class="lead">Un tutorial en vivo te guía sobre el sistema real: resalta en amarillo dónde tocar y avanza solo cuando haces la acción correcta. Prepara los datos que necesita antes de empezar.</p><div class="litems wide">${TUTS.map(t => itemCard('tut', t.id)).join('')}</div>`;
  if (tab === 'cases') body = `<p class="lead">Un caso plantea una situación real de recepción. No hay resaltados: decides tú qué hacer. Los objetivos se marcan solos cuando el sistema detecta que los cumpliste. Pulsa <b>Terminar y evaluar</b> para guardar tu nota.</p><div class="litems wide">${CASES.map(c => itemCard('case', c.id)).join('')}</div>`;
  if (tab === 'guides') body = `<div class="litems wide">${GUIDES.map(g => itemCard('guide', g.id)).join('')}</div>`;
  if (tab === 'gloss') { const q = (ui.acad.gq || '').toLowerCase(); const list = GLOSSARY.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q)); body = `<div class="row">${fld('Buscar término', 'acad.gq', { enter: 'noop', cls: 'grow' })}${btn('Filtrar', 'noop')}</div><dl class="gloss">${list.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`; }
  if (tab === 'quiz') body = quizView();
  return pageHead('Academia', 'Atrio PMS · Aprende a operar un PMS hotelero', `Progreso de la ruta: <b>${done} de ${all.length}</b> actividades · Tutoriales ${Object.keys(prog.tuts).length}/${TUTS.length} · Casos al 100% ${Object.values(prog.cases).filter(x => x === 100).length}/${CASES.length}`, btn('Restablecer hotel', 'go', { v: 'reset' }, 'ghost'))
    + `<div class="pbar big"><i style="width:${done / all.length * 100}%"></i></div><nav class="tabs">${tabs.map(([k, t]) => `<button type="button" class="${tab === k ? 'on' : ''}" data-act="acadTab" data-t="${k}">${t}</button>`).join('')}</nav>${body}`;
};
A.acadTab = d => { ui.view = 'academy'; ui.acad.tab = d.t; };
A.openGuide = d => { ui.view = 'guide'; ui.guide = d.id; prog.guides[d.id] = true; window.scrollTo(0, 0); };
VIEWS.guide = () => {
  const i = GUIDES.findIndex(g => g.id === ui.guide); const g = GUIDES[i]; if (!g) return empty('Guía no encontrada.');
  const rel = PATH.find(p => p.items.some(([, id]) => id === g.id)); const next = GUIDES[i + 1];
  const related = rel ? rel.items.filter(([k]) => k !== 'guide') : [];
  return pageHead(g.title, `Guía · ${g.mod} · ${g.mins} min`, '', btn('← Academia', 'acadTab', { t: 'guides' }, 'ghost'))
    + `<article class="panel guide">${g.html}</article>${related.length ? `<section class="panel"><h2>Practica lo que acabas de leer</h2><div class="litems">${related.map(([k, id]) => itemCard(k, id)).join('')}</div></section>` : ''}
    <div class="row end">${next ? btn(`Siguiente guía: ${esc(next.title)} →`, 'openGuide', { id: next.id }, 'pri') : ''}</div>`;
};
function quizView() {
  const Q = ui.quiz;
  if (!Q) return `<section class="panel"><h2>Evaluación de conocimientos</h2><p>${QUIZ.length} preguntas sobre reservas, recepción, caja, housekeeping y auditoría. Después de cada respuesta verás la explicación.</p>${prog.quiz != null ? `<p>Tu mejor resultado: <b>${prog.quiz}%</b></p>` : ''}${btn('Comenzar evaluación', 'quizStart', {}, 'pri')}</section>`;
  if (Q.i >= QUIZ.length) { const ok = Q.ans.filter((a, i) => a === QUIZ[i].a).length; const pct = Math.round(ok / QUIZ.length * 100); return `<section class="panel"><h2>Resultado: ${pct}%</h2><p>${ok} de ${QUIZ.length} correctas. ${pct >= 80 ? 'Dominas los conceptos operativos básicos.' : 'Repasa las guías de los temas que fallaste y vuelve a intentarlo.'}</p><ol class="qreview">${QUIZ.map((q, i) => `<li class="${Q.ans[i] === q.a ? 'ok' : 'bad'}"><b>${esc(q.q)}</b><br>${esc(q.o[q.a])}. <span class="hint">${esc(q.e)}</span></li>`).join('')}</ol>${btn('Repetir', 'quizStart', {}, 'pri')}</section>`; }
  const q = QUIZ[Q.i]; const a = Q.ans[Q.i];
  return `<section class="panel quiz"><div class="eyebrow">Pregunta ${Q.i + 1} de ${QUIZ.length}</div><h2>${esc(q.q)}</h2><div class="qopts">${q.o.map((o, j) => `<button type="button" class="qopt ${a != null ? (j === q.a ? 'right' : j === a ? 'wrong' : '') : ''}" data-act="quizAns" data-j="${j}" ${a != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
    ${a != null ? `<div class="note ${a === q.a ? 'good' : 'bad'}">${a === q.a ? 'Correcto.' : 'Incorrecto.'} ${esc(q.e)}</div><div class="row end">${btn(Q.i === QUIZ.length - 1 ? 'Ver resultado' : 'Siguiente', 'quizNext', {}, 'pri')}</div>` : ''}</section>`;
}
A.quizStart = () => { ui.quiz = { i: 0, ans: [] }; };
A.quizAns = d => { ui.quiz.ans[ui.quiz.i] = +d.j; };
A.quizNext = () => { ui.quiz.i++; if (ui.quiz.i >= QUIZ.length) { const pct = Math.round(ui.quiz.ans.filter((a, i) => a === QUIZ[i].a).length / QUIZ.length * 100); prog.quiz = Math.max(prog.quiz || 0, pct); } };
