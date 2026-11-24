'use strict';
/* =========================================================
   Atrio PMS — contenido de la Academia: guías, glosario, evaluación
   ========================================================= */
const GUIDES = [
  { id: 'g-intro', mod: 'Fundamentos', mins: 6, title: 'Qué es un PMS y cómo se organiza', html: `
<p>Un <b>PMS</b> (Property Management System) es el sistema central de un hotel. Todo lo que le pasa a un huésped queda en él: la reserva, la habitación, los cargos, los pagos y el historial. Los PMS de clase empresarial como OPERA organizan el trabajo en módulos que corresponden a los departamentos del hotel.</p>
<h3>Los módulos y quién los usa</h3>
<table class="tbl compact"><thead><tr><th>Módulo</th><th>En inglés</th><th>Lo usa</th><th>Para</th></tr></thead><tbody>
<tr><td>Reservas</td><td>Bookings</td><td>Reservas, ventas</td><td>Crear, modificar y cancelar reservas; bloques de grupo; disponibilidad</td></tr>
<tr><td>Recepción</td><td>Front Desk</td><td>Recepcionistas</td><td>Llegadas, check-in, huéspedes en casa, salidas, walk-ins</td></tr>
<tr><td>Clientes</td><td>Client Relations</td><td>Todos</td><td>Perfiles de huéspedes, empresas y agencias</td></tr>
<tr><td>Inventario</td><td>Inventory / Rooms Management</td><td>Ama de llaves</td><td>Estado de limpieza, fuera de orden, Room Diary</td></tr>
<tr><td>Finanzas</td><td>Financials / Cashiering</td><td>Caja, auditor nocturno</td><td>Folios, pagos, ajustes, auditoría nocturna, informes</td></tr>
</tbody></table>
<h3>El ciclo de vida de una reserva</h3>
<div class="flow"><span class="chip neutral">RESERVED</span><i>llega el día</i><span class="chip info">DUE IN</span><i>check-in</i><span class="chip good">IN HOUSE</span><i>día de salida</i><span class="chip warn">DUE OUT</span><i>check-out</i><span class="chip muted">CHECKED OUT</span></div>
<p class="hint">Desvíos: una reserva puede pasar a <span class="chip bad">CANCELLED</span> antes de llegar, o a <span class="chip bad">NO SHOW</span> si el huésped no llega el día previsto.</p>
<p>Los estados se escriben en inglés en casi todos los PMS. Apréndelos así: es lo que verás en cualquier hotel.</p>
<h3>Fecha de negocio frente a fecha real</h3>
<p>El PMS no usa el reloj de la computadora para decidir qué día es. Usa la <b>fecha de negocio</b> (business date), que solo avanza cuando el auditor nocturno cierra el día. Si son las 2:00 a. m. del 25 y no se ha hecho la auditoría, para el sistema sigue siendo el 24. Por eso los cargos de habitación de la noche del 24 llevan fecha 24 aunque se posteen de madrugada.</p>
<div class="note info">En este simulador la fecha de negocio aparece arriba, junto al nombre del hotel. Empieza el 24-NOV-26 y avanza cuando cierras el día en <b>Finanzas › Auditoría nocturna</b>.</div>` },

  { id: 'g-res', mod: 'Reservas', mins: 9, title: 'Crear y gestionar reservas', html: `
<p>La pantalla <b>Look To Book</b> es el punto de partida de toda reserva. Sigue el orden en que un agente atiende una llamada: fechas y personas, disponibilidad y precio, quién es el huésped, y cómo garantiza.</p>
<h3>Paso a paso</h3>
<ol><li><b>Búsqueda.</b> Llegada, noches, adultos y niños. Si el huésped viene por una empresa o agencia, vincúlala aquí para que aparezcan sus tarifas negociadas.</li>
<li><b>Disponibilidad.</b> La tabla cruza tipos de habitación con códigos de tarifa. La columna <i>Disp.</i> es la disponibilidad mínima entre todas las noches: si un solo día está lleno, no se puede vender esa estancia completa.</li>
<li><b>Perfil.</b> Busca siempre antes de crear. Un perfil duplicado parte el historial del huésped en dos.</li>
<li><b>Garantía y pago.</b> Define qué pasa si el huésped no llega.</li>
<li><b>Confirmación.</b> Dale el número al huésped y repite fechas, tipo, tarifa y política de cancelación.</li></ol>
<h3>Códigos de tarifa de este hotel</h3>
<table class="tbl compact"><thead><tr><th>Código</th><th>Uso</th><th>Restricción</th></tr></thead><tbody>
<tr><td class="mono">BAR</td><td>Tarifa pública del día</td><td>Ninguna</td></tr><tr><td class="mono">BARBB</td><td>BAR con desayuno</td><td>El desayuno se postea aparte (código 2030)</td></tr>
<tr><td class="mono">ADV14</td><td>Compra anticipada</td><td>Cerrada si faltan menos de 14 días</td></tr><tr><td class="mono">CORP</td><td>Empresas con contrato</td><td>Requiere perfil de empresa</td></tr>
<tr><td class="mono">RACK</td><td>Tarifa máxima publicada</td><td>Ninguna</td></tr><tr><td class="mono">COMP</td><td>Cortesía</td><td>Solo gerencia</td></tr></tbody></table>
<h3>Tipos de garantía</h3>
<ul><li><b>6PM</b>: sin garantía. Si no llega, no se cobra.</li><li><b>CC</b>: garantizada con tarjeta. Si no llega, se cobra una noche (no-show).</li><li><b>DEP</b>: el huésped pagó un depósito o prepago.</li><li><b>CO</b>: la empresa garantiza.</li></ul>
<h3>Mercado y origen</h3>
<p>El <b>código de mercado</b> dice qué tipo de cliente es (ocio, corporativo, grupo). El <b>código de origen</b> dice por dónde llegó la reserva (teléfono, web, OTA, walk-in). Gerencia los usa para medir de dónde viene el negocio, así que no los dejes al azar.</p>
<h3>Upgrade y RTC</h3>
<p>Cuando das una habitación mejor sin cobrar la diferencia, la reserva tiene dos tipos: el <b>tipo de habitación</b> (lo que el huésped ocupa) y el <b>tipo a cobrar</b> o <b>RTC</b> (Room Type to Charge), lo que se le factura. Ejemplo: tipo DLX, RTC STD: duerme en Deluxe y paga Estándar.</p>
<h3>Specials, alertas y traces</h3>
<ul><li><b>Specials</b>: preferencias del huésped (no fumar, piso alto, cuna). Ayudan a elegir la habitación.</li><li><b>Alertas</b>: aparecen en pantalla al hacer check-in o check-out. Úsalas para lo que el recepcionista debe decir o entregar en ese momento.</li><li><b>Traces</b>: tareas con fecha para un departamento. Ejemplo: HK, día de llegada, “poner cuna”.</li></ul>
<h3>Cancelar, no-show y reactivar</h3>
<p>Al cancelar, el sistema genera un <b>número de cancelación</b> que debes dar al huésped como comprobante. Una reserva cancelada o no-show se puede reactivar (<i>Reinstate</i>) si aún hay disponibilidad.</p>` },

  { id: 'g-prof', mod: 'Clientes', mins: 5, title: 'Perfiles de huéspedes, empresas y agencias', html: `
<p>Cada reserva está vinculada al menos a un <b>perfil individual</b>. También puede vincularse a un perfil de <b>empresa</b> (quien paga o tiene contrato) y de <b>agencia de viajes</b> (quien cobra comisión).</p>
<h3>Qué guarda un perfil</h3><ul><li>Datos de contacto y documento de identidad.</li><li>Nivel <b>VIP</b>: cambia el trato (bienvenida, inspección de la habitación, amenidades).</li><li>Preferencias y notas: almohada, piso, alergias, cumpleaños.</li><li>Historial: estancias, noches e ingresos.</li></ul>
<h3>Empresas y City Ledger</h3><p>Una empresa con <b>cuenta AR</b> (Accounts Receivable) puede pagar por <b>Direct Bill</b>: el cargo no lo paga el huésped en recepción, se transfiere a la cuenta de la empresa (City Ledger) y contabilidad le factura después.</p>
<h3>Buenas prácticas</h3><ul><li>Busca por apellido, correo y teléfono antes de crear un perfil nuevo.</li><li>No escribas datos de tarjetas en las notas.</li><li>Actualiza las preferencias cuando el huésped las mencione. La próxima estancia empieza mejor.</li></ul>` },

  { id: 'g-ci', mod: 'Recepción', mins: 8, title: 'Llegadas y check-in', html: `
<h3>Antes de que llegue el huésped</h3><p>Por la mañana se revisa la lista de <b>Llegadas</b> y se <b>preasignan</b> habitaciones, empezando por VIP y por quienes tienen specials. Así ama de llaves sabe qué habitaciones limpiar primero.</p>
<h3>La regla de oro del check-in</h3><div class="note info">Solo se registra un huésped en una habitación <b>vacía (VAC)</b> y <b>Limpia (CL)</b> o <b>Inspeccionada (IP)</b>. Si la habitación está Sucia, el sistema no deja hacer check-in.</div>
<h3>Paso a paso</h3><ol><li>Busca la reserva (por nombre o confirmación).</li><li>Asigna una habitación lista, respetando tipo y specials.</li><li>Lee las <b>alertas</b> que aparecen.</li><li>Verifica el documento de identidad.</li><li>Confirma el método de pago. Una reserva 6PM sin tarjeta necesita que captures el pago antes.</li><li>Confirma el check-in y entrega las llaves.</li></ol>
<h3>Walk-in</h3><p>Un <b>walk-in</b> es un huésped que llega sin reserva. Se crea la reserva con origen <span class="mono">WLK</span> y se hace el check-in en el mismo flujo. Por política suele pedirse pago por adelantado o una tarjeta en garantía.</p>
<h3>Llegada temprana</h3><p>Si la habitación aún no está lista: guarda el equipaje, registra un trace a HK para priorizar la limpieza y avisa al huésped cuando esté inspeccionada.</p>` },

  { id: 'g-bill', mod: 'Caja', mins: 10, title: 'Folio, ventanas, cargos y pagos', html: `
<p>El <b>folio</b> es la cuenta del huésped. Cada línea es una transacción con fecha, código, descripción y monto. Los cargos suman; los pagos restan.</p>
<h3>Códigos de transacción</h3><p>Cada cargo usa un código que indica a qué departamento pertenece el ingreso. Aquí: 1000 habitación, 1010 ITBIS, 1020 servicio, 2000–2030 alimentos y bebidas, 3000 minibar, 4000 lavandería, 5000 spa, 9000–9100 pagos. Elegir el código correcto es lo que permite que el informe de ingresos cuadre.</p>
<h3>Ventanas</h3><p>Un folio puede dividirse en hasta varias <b>ventanas</b>, cada una con su propio pagador. Lo típico:</p><ul><li><b>Ventana 1</b>: extras del huésped (restaurante, minibar), los paga él.</li><li><b>Ventana 2</b>: habitación e impuestos, los paga la empresa por Direct Bill.</li></ul>
<h3>Routing</h3><p>El <b>routing</b> automatiza la división: “todos los cargos 1000, 1010 y 1020 de esta reserva van a la ventana 2”. Se configura una vez y la auditoría postea cada noche directo en la ventana correcta. Si ya había cargos posteados, transfiérelos.</p>
<h3>Pagos</h3><ul><li>Efectivo (9000), tarjetas (9004 Visa, 9005 Mastercard, 9006 Amex).</li><li><b>City Ledger</b> (9100): solo si el pagador de la ventana es una empresa con cuenta AR. El saldo se mueve a cuentas por cobrar.</li><li>Un pago antes de tener cargos deja la ventana con saldo negativo (crédito). Es normal en depósitos y walk-ins.</li></ul>
<h3>Ajuste o corrección</h3><p>Un <b>ajuste</b> (1099, 2099) resta un ingreso ya posteado, por ejemplo una compensación por una queja. Siempre lleva motivo y queda en el informe del día. No borres cargos: ajústalos. Así queda rastro de auditoría.</p>
<h3>Impuestos en República Dominicana</h3><p>Sobre la tarifa de habitación se cobra ITBIS 18% y la propina legal o cargo por servicio de 10%. Una noche BAR STD de $129.00 queda en $129.00 + $23.22 + $12.90 = <b>$165.12</b>.</p>` },

  { id: 'g-co', mod: 'Caja', mins: 5, title: 'Salidas y check-out', html: `
<ol><li>Abre el folio del huésped desde Salidas o En casa.</li><li>Revisa con él los cargos de cada ventana. Si reclama algo justificado, aplica un ajuste con motivo.</li><li>Registra el pago de cada ventana hasta dejarla en <b>$0.00</b>.</li><li>Confirma el check-out y entrega la factura.</li></ol>
<div class="note info">Al salir, la habitación pasa a <b>Vacía y Sucia</b>: ama de llaves la ve en su lista para limpiarla.</div>
<h3>Salida anticipada</h3><p>Si el huésped se va antes de su fecha, el check-out cambia la salida a hoy y libera las noches restantes para la venta. Revisa la política de la tarifa: algunas cobran penalidad.</p>
<h3>Late check-out</h3><p>Si el huésped pide quedarse más tarde, regístralo como special (LC) o alerta y avisa a ama de llaves. Si debe quedarse otra noche, <b>extiende</b> la estancia; no hagas una reserva nueva.</p>` },

  { id: 'g-hk', mod: 'Housekeeping', mins: 7, title: 'Estados de habitación y ama de llaves', html: `
<p>Cada habitación tiene dos estados independientes:</p><ul><li><b>Estado de recepción (FO)</b>: Vacía (VAC) u Ocupada (OCC). Lo cambia el check-in y el check-out.</li><li><b>Estado de limpieza (HK)</b>: lo cambia ama de llaves.</li></ul>
<table class="tbl compact"><thead><tr><th>Código</th><th>Estado</th><th>Significado</th></tr></thead><tbody>
<tr><td>CL</td><td>Limpia (Clean)</td><td>Lista. Se puede hacer check-in.</td></tr><tr><td>DI</td><td>Sucia (Dirty)</td><td>Necesita limpieza.</td></tr>
<tr><td>IP</td><td>Inspeccionada (Inspected)</td><td>Limpia y revisada por un supervisor. Recomendada para VIP.</td></tr><tr><td>PU</td><td>Pickup</td><td>Repaso ligero (estaba limpia pero se usó poco).</td></tr>
<tr><td>OOO</td><td>Fuera de orden</td><td>Avería seria. <b>Sale del inventario vendible</b> entre dos fechas.</td></tr><tr><td>OOS</td><td>Fuera de servicio</td><td>Detalle menor. Sigue en inventario pero no se asigna.</td></tr></tbody></table>
<h3>OOO frente a OOS</h3><p>La diferencia importa para las cifras: una habitación OOO no cuenta como disponible y no baja la ocupación; una OOS sí cuenta. Usa OOO solo para problemas que impiden vender la habitación (plomería, aire acondicionado, remodelación).</p>
<h3>Lo que hace la auditoría</h3><p>Al cerrar el día, todas las habitaciones ocupadas pasan a <b>Sucias</b> para que reciban servicio al día siguiente, y las OOO cuyo periodo terminó vuelven a servicio como Sucias.</p>
<h3>Discrepancias</h3><p>En hoteles reales, ama de llaves reporta lo que ve físicamente. Si recepción dice Ocupada pero la habitación está vacía y sin equipaje, es un posible <i>skip</i> (se fue sin pagar). Si recepción dice Vacía pero hay alguien, es un <i>sleep</i>. Ambos se investigan de inmediato.</p>` },

  { id: 'g-inv', mod: 'Reservas', mins: 5, title: 'Disponibilidad y Room Diary', html: `
<p>La disponibilidad de un tipo de habitación en una noche se calcula así:</p>
<div class="formula">Disponibles = habitaciones físicas − fuera de orden − reservas activas − habitaciones de bloques DEF aún no recogidas</div>
<p>El <b>Room Diary</b> muestra cada habitación por fila y cada noche por columna. Sirve para ver huecos, mover reservas y detectar habitaciones sin asignar. Arriba de todo verás la disponibilidad por tipo y noche; en rojo, las noches llenas.</p>
<h3>Overbooking</h3><p>Algunos hoteles venden por encima del 100% esperando cancelaciones y no-shows. Este simulador no lo permite, así que puedes practicar cómo resolver una noche llena: ofreciendo otro tipo con upgrade, otras fechas o una tarifa distinta.</p>` },

  { id: 'g-grp', mod: 'Grupos', mins: 6, title: 'Bloques de grupo', html: `
<p>Un <b>bloque</b> aparta habitaciones para un grupo (boda, congreso, equipo deportivo) antes de saber los nombres de los huéspedes.</p>
<h3>Estados</h3><ul><li><b>TEN</b> (tentativo): en negociación. No descuenta inventario.</li><li><b>DEF</b> (definitivo): contrato firmado. Las habitaciones salen del inventario general.</li><li><b>CXL</b>: cancelado.</li></ul>
<h3>Pickup y rooming list</h3><p>Cuando el organizador envía los nombres, cada huésped se <b>recoge</b> del bloque: se crea su reserva dentro del bloque, con la tarifa de grupo. El porcentaje recogido se llama <b>pickup</b>. La lista de huéspedes es la <b>rooming list</b>.</p>
<h3>Fecha de corte</h3><p>El <b>cut-off</b> es la fecha límite para enviar nombres. Después, lo no recogido vuelve a la venta general. Vigilarlo evita tener habitaciones bloqueadas que nadie va a usar.</p>` },

  { id: 'g-na', mod: 'Cierre', mins: 9, title: 'Auditoría nocturna y KPIs', html: `
<p>La <b>auditoría nocturna</b> (End of Day o Night Audit) cierra el día de negocio. La ejecuta el auditor de madrugada y sigue siempre el mismo orden.</p>
<ol><li><b>Llegadas pendientes</b>: cada una se registra, se cancela o se marca No-Show. Una 6PM no genera cargo; una garantizada cobra una noche más impuestos.</li><li><b>Salidas pendientes</b>: check-out o extensión de estancia.</li><li><b>Posteo de habitación e impuestos</b>: se carga la noche a cada huésped en casa.</li><li><b>Informes</b>: se genera y archiva el paquete del día.</li><li><b>Cambio de fecha</b>: la fecha de negocio avanza un día.</li></ol>
<h3>Los tres indicadores clave</h3>
<div class="formula">Ocupación % = habitaciones ocupadas ÷ habitaciones disponibles × 100</div>
<div class="formula">ADR (tarifa promedio) = ingreso de habitaciones ÷ habitaciones ocupadas pagadas</div>
<div class="formula">RevPAR = ingreso de habitaciones ÷ habitaciones disponibles</div>
<p><b>Ejemplo:</b> 33 habitaciones disponibles (34 menos 1 OOO), 20 ocupadas y $3,000 de ingreso de habitación. Ocupación = 60.6%; ADR = $150.00; RevPAR = $90.91. El RevPAR combina precio y ocupación, por eso es el indicador favorito de los gerentes.</p>
<div class="note warn">Las cortesías (COMP) cuentan como ocupadas pero no entran en el ADR, porque no pagan tarifa.</div>` },

  { id: 'g-map', mod: 'Fundamentos', mins: 6, title: 'De este simulador a OPERA real', html: `
<p>Atrio PMS es un simulador de práctica <b>no oficial</b> y no está afiliado a Oracle. Reproduce los flujos, estados, reglas y vocabulario que usan los PMS empresariales como OPERA, para que puedas practicar sin riesgo. No copia su interfaz ni su marca.</p>
<h3>Cómo se corresponde lo que practicas</h3>
<table class="tbl compact"><thead><tr><th>Aquí</th><th>Término que verás en OPERA</th></tr></thead><tbody>
<tr><td>Look To Book</td><td>Look To Book Sales Screen</td></tr><tr><td>Gestionar reservas</td><td>Manage Reservation / Reservation Search</td></tr>
<tr><td>Llegadas, En casa, Salidas</td><td>Arrivals, In House Guests, Departures</td></tr><tr><td>Folio, ventanas, routing</td><td>Billing, Folio Windows, Routing Instructions</td></tr>
<tr><td>Ajuste</td><td>Adjustment / Post Adjustment</td></tr><tr><td>Room Move</td><td>Room Move</td></tr><tr><td>Housekeeping</td><td>Housekeeping Board / Room Status</td></tr>
<tr><td>Fuera de orden / servicio</td><td>Out of Order / Out of Service</td></tr><tr><td>Bloques, pickup, cut-off</td><td>Blocks, Pickup, Cutoff Date</td></tr><tr><td>Auditoría nocturna</td><td>End of Day</td></tr>
<tr><td>Traces, alertas</td><td>Traces, Alerts</td></tr><tr><td>Tipo a cobrar (RTC)</td><td>Room Type to Charge</td></tr></tbody></table>
<h3>Lo que en un hotel real es más complejo</h3><ul><li>Autorización de tarjetas en línea y tokenización.</li><li>Libro de depósitos y cuentas por cobrar (AR) completos.</li><li>Paquetes, estrategias de tarifa y restricciones por día.</li><li>Apertura y cierre de cajero por turno.</li><li>Interfaces: llaves, central telefónica, puntos de venta, channel manager.</li><li>Permisos por usuario: muchas acciones (ajustes, cortesías, overbooking) requieren un rol de supervisor.</li></ul>
<p>Los nombres exactos de menús y pantallas cambian entre versiones (OPERA V5 y OPERA Cloud) y según la configuración de cada hotel. Lo que se transfiere es el razonamiento: si dominas aquí el ciclo reserva → check-in → folio → check-out → auditoría, te adaptarás rápido a la pantalla real.</p>` },
];

const GLOSSARY = [
  ['ADR', 'Average Daily Rate. Ingreso de habitaciones dividido entre habitaciones ocupadas pagadas.'],
  ['Alerta (Alert)', 'Mensaje que aparece al hacer check-in o check-out de una reserva.'],
  ['AR (Accounts Receivable)', 'Cuentas por cobrar. Una empresa con cuenta AR puede pagar por Direct Bill.'],
  ['BAR', 'Best Available Rate. Tarifa pública del día.'],
  ['Bloque (Block)', 'Inventario apartado para un grupo, con tarifa y fechas propias.'],
  ['Business date', 'Fecha de negocio. Avanza solo con la auditoría nocturna.'],
  ['Cancellation number', 'Número de cancelación que se entrega al huésped como comprobante.'],
  ['Check-in', 'Registro del huésped en la habitación. Cambia el estado a IN HOUSE y la habitación a OCC.'],
  ['Check-out', 'Salida del huésped. Requiere saldo cero en todas las ventanas.'],
  ['City Ledger', 'Cuenta donde se trasladan los saldos que pagarán empresas por Direct Bill.'],
  ['Clean (CL)', 'Habitación limpia, lista para check-in.'],
  ['Comp', 'Cortesía. Habitación sin cargo.'],
  ['Confirmation number', 'Número único de la reserva.'],
  ['Cut-off date', 'Fecha límite para recoger habitaciones de un bloque.'],
  ['Dirty (DI)', 'Habitación sucia. No admite check-in.'],
  ['Direct Bill', 'Forma de pago en que la empresa recibe la factura después.'],
  ['Due In', 'Reserva que llega en la fecha de negocio actual y aún no ha hecho check-in.'],
  ['Due Out', 'Huésped en casa cuya salida es hoy.'],
  ['Early departure', 'Salida anterior a la fecha reservada.'],
  ['End of Day / Night Audit', 'Auditoría nocturna: cierre del día de negocio.'],
  ['Extend stay', 'Extender la estancia de un huésped en casa.'],
  ['FO status', 'Estado de recepción de la habitación: Vacía (VAC) u Ocupada (OCC).'],
  ['Folio', 'Cuenta del huésped con todos sus cargos y pagos.'],
  ['Garantía (Guarantee)', 'Compromiso de pago si el huésped no llega: 6PM, CC, DEP, CO.'],
  ['In House', 'Huésped registrado que está alojado.'],
  ['Inspected (IP)', 'Habitación limpia y revisada por un supervisor.'],
  ['Look To Book', 'Pantalla para consultar disponibilidad y crear reservas.'],
  ['Market code', 'Código de mercado: tipo de cliente (ocio, corporativo, grupo).'],
  ['No-Show', 'Huésped con reserva que no llegó. Si estaba garantizada, se cobra una noche.'],
  ['OOO (Out of Order)', 'Habitación fuera de orden: sale del inventario vendible.'],
  ['OOS (Out of Service)', 'Fuera de servicio: sigue en inventario, pero no se asigna.'],
  ['Overbooking', 'Vender más habitaciones de las disponibles esperando cancelaciones.'],
  ['Package', 'Servicio incluido en la tarifa (p. ej. desayuno), que se postea en su propio código.'],
  ['Pickup', 'Habitaciones recogidas de un bloque. También: estado HK de repaso ligero.'],
  ['Posting', 'Cada transacción registrada en un folio.'],
  ['Profile', 'Perfil de huésped, empresa o agencia.'],
  ['Rack rate', 'Tarifa máxima publicada.'],
  ['Rate code', 'Código de tarifa con sus precios y reglas.'],
  ['Reinstate', 'Reactivar una reserva cancelada o no-show.'],
  ['RevPAR', 'Revenue Per Available Room. Ingreso de habitaciones entre habitaciones disponibles.'],
  ['Room Diary', 'Vista de habitaciones por noche con las reservas asignadas.'],
  ['Room Move', 'Cambio de habitación de un huésped en casa.'],
  ['Rooming list', 'Lista de nombres de los huéspedes de un grupo.'],
  ['Routing', 'Regla que envía ciertos códigos de transacción a otra ventana del folio.'],
  ['RTC (Room Type to Charge)', 'Tipo de habitación que se cobra, distinto del que se ocupa en un upgrade.'],
  ['Skip / Sleep', 'Discrepancias: huésped que se fue sin pagar / habitación ocupada que figura vacía.'],
  ['Source code', 'Código de origen: canal por el que llegó la reserva.'],
  ['Specials', 'Preferencias y solicitudes del huésped.'],
  ['Stayover', 'Huésped que sigue alojado y no sale hoy.'],
  ['Trace', 'Tarea con fecha asignada a un departamento.'],
  ['Transaction code', 'Código que clasifica cargos y pagos por departamento.'],
  ['Upgrade', 'Dar un tipo de habitación superior al reservado.'],
  ['Walk-in', 'Huésped que llega sin reserva.'],
  ['Window (ventana)', 'División del folio con su propio pagador.'],
];

const QUIZ = [
  { q: 'Son las 2:15 a. m. del 25 de noviembre y aún no se ha hecho la auditoría. ¿Qué fecha de negocio muestra el PMS?', o: ['25 de noviembre', '24 de noviembre', 'Depende de la zona horaria del servidor'], a: 1, e: 'La fecha de negocio solo avanza al cerrar el día con la auditoría nocturna.' },
  { q: 'Una habitación está Vacía y Sucia (VAC/DI). ¿Puedes hacer check-in?', o: ['Sí, si el huésped tiene prisa', 'No, debe estar Limpia o Inspeccionada', 'Sí, si es VIP'], a: 1, e: 'El check-in exige una habitación vacía y Limpia (CL) o Inspeccionada (IP).' },
  { q: 'Un huésped con reserva 6PM no llega. ¿Qué ocurre en la auditoría al marcarlo No-Show?', o: ['Se cobra una noche', 'Se cobra el total de la estancia', 'No se cobra nada'], a: 2, e: '6PM es una reserva sin garantía: se libera sin cargo.' },
  { q: '¿Qué diferencia hay entre OOO y OOS?', o: ['Ninguna, son sinónimos', 'OOO sale del inventario vendible; OOS sigue en inventario pero no se asigna', 'OOS sale del inventario; OOO no'], a: 1, e: 'Fuera de orden (OOO) reduce las habitaciones disponibles; fuera de servicio (OOS) no.' },
  { q: 'La empresa paga habitación e impuestos y el huésped paga sus extras. ¿Qué configuras?', o: ['Dos reservas', 'Routing de 1000/1010/1020 a una ventana con la empresa como pagador', 'Un ajuste por el valor de la habitación'], a: 1, e: 'El routing envía automáticamente esos códigos a la ventana de la empresa.' },
  { q: '34 habitaciones, 1 OOO, 22 ocupadas, $3,300 de ingreso de habitación. ¿Cuál es el ADR?', o: ['$97.06', '$150.00', '$100.00'], a: 1, e: 'ADR = 3,300 ÷ 22 = $150.00.' },
  { q: 'Con los mismos datos, ¿cuál es el RevPAR?', o: ['$100.00', '$97.06', '$150.00'], a: 0, e: 'RevPAR = 3,300 ÷ 33 disponibles = $100.00.' },
  { q: 'Un huésped reclama un cargo de minibar de anoche que no consumió. ¿Qué haces?', o: ['Borro la línea del folio', 'Aplico un ajuste con motivo', 'Le pido que lo pague y luego lo reembolso'], a: 1, e: 'Los cargos no se borran: se ajustan con motivo para que quede rastro.' },
  { q: 'Das una Deluxe a un huésped que reservó Estándar sin cobrarle la diferencia. ¿Cómo queda la reserva?', o: ['Tipo DLX, RTC STD', 'Tipo STD, RTC DLX', 'Tipo DLX, RTC DLX con ajuste'], a: 0, e: 'Ocupa DLX (tipo de habitación) y paga STD (tipo a cobrar).' },
  { q: '¿Qué estado de bloque descuenta inventario de la venta general?', o: ['TEN', 'DEF', 'Ambos'], a: 1, e: 'Solo los bloques definitivos (DEF) reservan el inventario.' },
  { q: 'Un huésped en casa quiere quedarse una noche más. ¿Qué haces?', o: ['Creo una reserva nueva', 'Extiendo la estancia (cambio la fecha de salida)', 'Hago check-out y check-in de nuevo'], a: 1, e: 'Se extiende la misma reserva; así el folio y el historial siguen juntos.' },
  { q: '¿Para qué sirve un trace?', o: ['Para mostrar un mensaje al hacer check-in', 'Para asignar una tarea con fecha a un departamento', 'Para rastrear pagos con tarjeta'], a: 1, e: 'El trace es una tarea con fecha para un departamento; la alerta es el mensaje emergente.' },
  { q: 'Intentas pagar con Direct Bill (City Ledger) y el sistema lo rechaza. ¿Causa probable?', o: ['El huésped no tiene correo', 'El pagador de esa ventana no es una empresa con cuenta AR', 'La tarjeta venció'], a: 1, e: 'City Ledger exige que el pagador de la ventana tenga cuenta AR.' },
  { q: 'Una noche BAR STD cuesta $129.00. ¿Cuánto paga el huésped por noche con ITBIS (18%) y servicio (10%)?', o: ['$152.22', '$165.12', '$141.90'], a: 1, e: '129 + 23.22 + 12.90 = $165.12.' },
  { q: '¿Qué hace la auditoría con las habitaciones ocupadas al cerrar el día?', o: ['Las deja como están', 'Las pasa a Sucias para el servicio del día siguiente', 'Las pasa a Inspeccionadas'], a: 1, e: 'Todas las ocupadas quedan Sucias para que ama de llaves las atienda.' },
];
