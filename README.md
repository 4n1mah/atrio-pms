# Atrio PMS Academia

Simulador educativo de un sistema de gestión hotelera (PMS) para aprender a operar la recepción de un hotel: reservas, check-in, folios, housekeeping, grupos y auditoría nocturna. Incluye tutoriales en vivo, casos prácticos con evaluación automática, guías, glosario y evaluación final.

Reproduce flujos de trabajo y vocabulario habituales en PMS empresariales como OPERA. Es un proyecto no oficial, con datos ficticios, y no está afiliado a Oracle.

## Qué incluye

**Sistema**
- Look To Book: disponibilidad por tipo y tarifa, restricciones, garantías (6PM, CC, DEP, CO), upgrades con tipo a cobrar (RTC).
- Gestión de reservas: edición, cancelación con número, no-show, reactivación, alertas y traces.
- Recepción: llegadas, asignación de habitación, check-in, walk-in, huéspedes en casa, room move, salidas.
- Facturación: folio con ventanas, códigos de transacción, pagos, ajustes, routing, City Ledger, factura.
- Housekeeping: estados CL/DI/IP/PU, fuera de orden (OOO) y fuera de servicio (OOS).
- Room Diary, bloques de grupo con pickup, informes (ocupación, ADR, RevPAR) y auditoría nocturna en 5 pasos.

**Academia**
- 8 tutoriales en vivo que resaltan dónde tocar y avanzan cuando el alumno hace la acción correcta.
- 8 casos prácticos evaluados automáticamente.
- 11 guías, glosario de 55 términos y evaluación de 15 preguntas.

## Usarlo

No necesita instalación ni servidor de base de datos. Es HTML, CSS y JavaScript sin dependencias.

- **En tu computadora:** abre `index.html` en el navegador.
- **GitHub Pages:** sube esta carpeta a un repositorio, en *Settings › Pages* elige *Source: GitHub Actions* y haz push a `main`. El flujo `.github/workflows/pages.yml` publica el sitio.
- **Netlify / Vercel:** arrastra la carpeta a Netlify Drop o impórtala como sitio estático.

Cada persona tiene su propio hotel de práctica guardado en su navegador (`localStorage`). El botón *Restablecer hotel* vuelve a los datos iniciales sin borrar el progreso de la academia.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura, estilos y arranque |
| `core.js` | Configuración del hotel, datos de ejemplo y reglas de negocio |
| `views.js` | Pantallas, formularios y acciones |
| `content.js` | Guías, glosario y preguntas |
| `academy.js` | Tutoriales en vivo, casos prácticos y vista de la academia |
