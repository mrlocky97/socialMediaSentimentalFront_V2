# PROPOSED ARCHIVE LIST

Este archivo contiene una lista propuesta de archivos/carpetas que recomiendo archivar (mover a `src/app/archived/`) para reducir duplicación y acelerar la demo.

---

Objetivo: conservar un conjunto mínimo y funcional para la demo (login, dashboard, listado/creación/detalle de campañas, widgets esenciales). Archivar no elimina: solo mueve a `src/app/archived/` para revisión y recuperación rápida.

Propuesta (rutas relativas al repo):

- src/app/features/campaign-management/campaign-wizard/campaign-wizard.component.ts
  - Razon: duplicado funcional con `features/campaign-wizard` y `campaign-wizard-simple`. Mantener `features/campaign-wizard-simple` para flujo rápido.

- src/app/features/campaign-management/campaign-detail/campaign-detail.component.ts
  - Razon: duplicación con `features/campaigns/campaign-detail`.

- src/app/features/campaign-management/campaign-list/campaign-list.component.ts
  - Razon: duplicación con `features/campaigns/campaign-list`.

- src/app/features/campaign-wizard/campaign-wizard.component.ts
  - Razon: variante completa vs `campaign-wizard-simple`. Mantener la variante simple para demo rápida.

- src/app/features/scraping-monitor/scraping-monitor-simple.component.ts
  - Razon: mantener una sola variante `scraping-monitor.component.ts`.

- src/app/shared/components/solid-data-table/campaign-table-example.component.ts
  - Razon: ejemplo; no necesario en demo.

- src/app/shared/components/solid-data-table/examples/enhanced-table-example.component.ts
  - Razon: ejemplo; archivar.

- src/app/shared/components/solid-data-table/solid-data-table.component.ts
  - Razon: si la app usa ampliamente RxJS, preferir `solid-data-table-rxjs.component.ts` como única implementación y archivar la variante no-rxjs.

---

Siguiente paso propuesto:
- Confírmame si autorizas mover estos archivos a `src/app/archived/` y los moveré con commits separados (seguro y reversible).

Notas:
- No voy a modificar código todavía — sólo prepararé el staging (rama + archivo de propuesta). Después, al mover, actualizaré imports automáticamente y haré pruebas rápidas.
- Si prefieres conservar alguna ruta de la lista, indícamelo y la excluyo del movimiento.

Fecha: 20-08-2025
