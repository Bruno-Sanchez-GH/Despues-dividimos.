# Revisión final de V5

## A. Auditoría inicial

Se revisaron estructura, schema, cinco migraciones, rutas/controllers/services, middleware, frontend y pruebas existentes antes de modificar. El recorrido inicial de navegador pasó 30 comprobaciones usando la API real y PostgreSQL.

| Estado inicial | Hallazgo |
|---|---|
| Funciona | Registro/login, grupos, invitaciones, actividades, fechas, gastos, Decimal, balances y transferencias |
| Funciona pero UX deficiente | Formulario sin reparto previo; desktop con formulario angosto; actividad sin resumen inmediato |
| No existe | Home con tres entradas, pago rápido local, acceso directo a crear plan, protección de descarte |
| Incompleto | Explicación de pagador frente a correspondencia y onboarding contextual |
| Roto bajo prueba de estrés | Dos envíos en el mismo tick podían crear dos gastos; corregido con bloqueo síncrono |
| Riesgo de integridad | Crear grupo y aceptar invitación escribían membresía por separado; ahora son escrituras anidadas atómicas |

## B. Producto

- Viaje: grupo con personas, actividades agrupadas por sus días reales y balance acumulado por participación.
- Plan: elegir un grupo, nombre, personas y ahora/fecha; abrir directamente actividad, gastos y resumen.
- Pago rápido: cuenta local sin persistencia; guardar opcionalmente en un grupo con participantes reales. Actividad, participantes y gasto inicial se crean juntos.

Los tres recorridos comparten Grupo → Actividad → Gasto. No hay nuevos tipos persistentes, tablas paralelas ni usuarios anónimos. Para un primer plan persistido hay que reunir las personas con las invitaciones existentes. Las fechas corresponden a actividades, no a un campo de viaje inexistente.

## C. Backend

- Nuevos en esta revisión: GET /api/v1/activities y POST /api/v1/activities/:activityId/expenses/preview.
- POST /api/v1/groups/:groupId/activities admite initialExpense opcional; el contrato anterior permanece compatible.
- GET /api/v1/groups agrega la cantidad real de miembros para Home.
- La vista previa comparte calculateBalances y devuelve current, draft, next y shares. shares es el incremento de correspondencia sobre el total de la actividad; no reparte centavos aisladamente por gasto.
- Validación monetaria compartida entre guardar, importar y previsualizar: Prisma Decimal, strings HTTP, centavos BigInt, sin Float.
- Balances derivados, resto por ID ascendente y transferencias deterministas. Las transferencias son sugerencias.
- JWT y membresía requeridos; pagador participante. Actividades recientes solo de grupos del usuario.
- Sin modificaciones de schema, sin migraciones nuevas, sin editar migraciones históricas.

## D. Frontend

Home, Plan, Pago rápido y selector global de acción; acceso a grupos y planes recientes reales. Navegación Inicio / Grupos / Dividir / Invitaciones / Perfil. Se conservan registro/login, perfil y gestión real de invitaciones.

Nuevo gasto explica monto, concepto, quién puso la plata, quiénes comparten y cuánto suma a cada uno. Presenta vista previa del servidor, recuerda pagador y conserva datos ante errores. Actividad muestra total y correspondencia inmediatamente; balance muestra pagado, corresponde, saldo y sugerencias.

Mobile usa una columna con reparto antes de guardar. Desktop usa navegación discreta, formulario y resumen lateral. Stack: React 19.3, TypeScript 7, Vite 8.3, Tailwind 4.3 y React Router 7.18.

## E. UX/UI

Textos contextuales, estados vacíos con acciones útiles, skeletons de lista/balance/formulario, errores inline y confirmación de descarte mediante dialog nativo. Bloqueo de envíos con ref inmediato más estado visual; no depende del siguiente render.

Fondos geométricos CSS, animación lenta y prefers-reduced-motion. Labels, foco visible, targets táctiles y signos/textos junto al color. Corregidos nombres accesibles de selects y espaciado de ayudas. No se añadieron fondos raster ni botones ficticios.

## F. Pruebas y resultados

- npm test: 15 pruebas aprobadas, incluyendo 500 escenarios deterministas de conservación y comparación del pago rápido con el motor persistido.
- npm run test:e2e: 49 comprobaciones aprobadas sobre frontend compilado, handlers reales y PostgreSQL.
- Caso pizza: otra persona paga 4000; correspondencia 2000 por persona; transferencia sugerida de 2000.
- Montos distintos, participante sin pagos, centavos, límites Decimal, actividad vacía, saldos cero, subconjuntos por actividad y agregación.
- Carga de pagos propios y ajenos desde distintas cuentas; rechazo de pagador no participante, montos inválidos y usuario externo.
- Vista previa sin escrituras; plan inválido sin registros parciales; pago rápido guardado; formulario preservado ante error; conexión lenta; doble clic produce una sola solicitud.
- Registro/login/logout, invitación/aceptación/rechazo, programación, próximas/historial, refresh, URL directa, sesión vencida y reintento de red.
- Sin errores JavaScript no capturados ni respuestas 5xx inesperadas en el recorrido.
- Sin overflow en 360, 390, 430, 768, 1024, 1366 y 1440 px; capturas inspeccionadas, incluido modal y composición desktop.
- Prisma validate y generate correctos; cinco migraciones aplicadas. TypeScript backend/frontend y production build correctos. No existe configuración de lint.
- Pruebas revertidas en transacción; las huellas de los registros anteriores coincidieron. Las secuencias PostgreSQL pueden avanzar durante una prueba revertida.

Windows bloqueó subprocesos de Node/Vite/Prisma con EPERM dentro del sandbox; las verificaciones necesarias se repitieron con ejecución autorizada. Los avisos experimentales de VM y de concurrencia de pg pertenecen al arnés transaccional de pruebas; no son errores JavaScript de la interfaz.

## G. Límites y deploy

Nuevo gasto admite varios pagadores en una misma operación. Cada aporte se persiste como un gasto individual, todos juntos mediante un INSERT atómico; el total no se guarda por segunda vez. Pago rápido es transitorio hasta guardarlo; no crea personas sin cuenta ni reemplaza las invitaciones. Viaje y Plan no son tipos persistentes. La protección de doble clic no es una clave de idempotencia de servidor para reintentos tras una respuesta perdida.

Fuera de alcance: pagos reales o marcar transferencias pagadas, OCR/IA, multi-moneda, mapas, chat/social, presupuestos, reservas y repartos personalizados. No se publicó automáticamente. Para desplegar: hosting, PostgreSQL, variables y HTTPS según README; recuperación de cuenta y límites de peticiones quedan fuera de V5.

## H. Git

Rama: feature/v5-balances-frontend. Todo queda como cambios locales para revisión. No se ejecutó git add, commit, push ni merge. .env, node_modules, dist y Prisma generado permanecen ignorados. Diff sin errores de whitespace.

El inventario siguiente incluye toda V5 todavía no versionada, tanto implementación previa como revisión final.

### Archivos nuevos

- README.md
- V5-REVISION.md
- frontend/.env.example
- frontend/index.html
- frontend/package-lock.json
- frontend/package.json
- frontend/public/favicon.svg
- frontend/src/App.tsx
- frontend/src/components/BalancePanel.tsx
- frontend/src/components/Layout.tsx
- frontend/src/components/UI.tsx
- frontend/src/hooks/useAuth.tsx
- frontend/src/hooks/useResource.ts
- frontend/src/hooks/useSubmission.ts
- frontend/src/hooks/useUnsavedChanges.tsx
- frontend/src/main.tsx
- frontend/src/pages/Account.tsx
- frontend/src/pages/Activities.tsx
- frontend/src/pages/Auth.tsx
- frontend/src/pages/Expenses.tsx
- frontend/src/pages/Groups.tsx
- frontend/src/pages/Home.tsx
- frontend/src/pages/Plan.tsx
- frontend/src/pages/Quick.tsx
- frontend/src/services/api.ts
- frontend/src/styles.css
- frontend/src/types.ts
- frontend/src/utils/format.ts
- frontend/src/utils/quickSplit.ts
- frontend/tsconfig.json
- frontend/vite.config.ts
- src/controllers/activities.balance.ts
- src/controllers/activities.recent.ts
- src/controllers/auth.me.ts
- src/controllers/expenses.preview.ts
- src/controllers/groups.balance.ts
- src/controllers/groups.detail.ts
- src/controllers/invitations.email.ts
- src/controllers/invitations.list.ts
- src/service/activities.balance.service.ts
- src/service/activities.recent.service.ts
- src/service/auth.me.service.ts
- src/service/balances.calculate.ts
- src/service/expenses.preview.service.ts
- src/service/expenses.validate.ts
- src/service/groups.balance.service.ts
- src/service/groups.detail.service.ts
- src/service/invitations.email.service.ts
- src/service/invitations.list.service.ts
- tests/balances.test.mjs
- tests/e2e.mjs

### Archivos modificados

- .env.example
- .gitignore
- package.json
- src/app.ts
- src/controllers/activities.create.ts
- src/routes/activities.routes.ts
- src/routes/auth.routes.ts
- src/routes/groups.routes.ts
- src/routes/invitations.routes.ts
- src/service/activities.create.service.ts
- src/service/expenses.create.service.ts
- src/service/groups.create.service.ts
- src/service/groups.list.service.ts
- src/service/invitations.accept.service.ts

## Ajuste solicitado: varios aportes en una cuenta

Nuevo gasto incluye Una persona / Varias personas, campos de aporte por participante, suma visible, aviso de cuánto falta o sobra y vista previa de las transferencias. El reparto sigue siendo igualitario: quien aporta más recibe la diferencia y quien aporta menos la devuelve.

Caso verificado matemáticamente: total 4000, aportes 3000 y 1000, correspondencia 2000 cada uno, transferencia de 1000 del segundo al primero. Se rechazan sumas incorrectas, pagadores repetidos, montos inválidos y personas externas sin escrituras parciales.

Archivos añadidos en este ajuste: src/service/expenses.contributions.service.ts y frontend/src/utils/contributions.ts. Se actualizaron validación, controller de gastos, preview, formulario, estilos, documentación y pruebas. Pago rápido mantiene su selector de un pagador; la carga múltiple se hace desde Nuevo gasto en una actividad.

## Último ajuste visual: prioridad a las devoluciones

SettlementSummary presenta primero quién le debe cuánto a quién, con importe grande, dirección y texto personalizado. Se reutiliza en actividad, balance, preview y confirmación de guardado. La confirmación recupera el balance actual desde la API. Pago rápido destaca el monto a devolver con una superficie de contraste.

LoadingLabel agrega un punto con pulso suave a cargas y acciones; los skeletons tienen un brillo lento. Círculos y líneas CSS flotan entre 3 y 5 px con ciclos independientes de 28 a 36 segundos. Se respeta prefers-reduced-motion y no se agregaron dependencias ni esperas simuladas.
