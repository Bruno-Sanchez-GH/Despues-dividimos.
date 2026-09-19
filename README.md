# Después Dividimos

Aplicación para organizar grupos, actividades y gastos compartidos. El backend calcula divisiones igualitarias por actividad y balances agregados del grupo. El frontend consume la API real.

## Estado actual y contexto para revisión

Este documento describe la implementación existente de **V5**, incluida la carga de aportes de varias personas en una misma operación. Sirve como contexto para revisar el proyecto sin asumir que hay que reconstruirlo desde cero. El código del repositorio es la fuente de verdad.

- Backend y frontend implementados y probados localmente; publicación en internet pendiente.
- Última verificación realizada: **15 pruebas matemáticas y 49 comprobaciones de navegador aprobadas**, más compilación TypeScript y build de producción.
- Prisma validado y generado; cinco migraciones aplicadas. V5 no agregó tablas ni modificó el schema de V4.
- No hay datos ficticios de producto: nombres, grupos, actividades y gastos provienen del usuario o de la API.

| Versión | Funcionalidad incorporada |
|---|---|
| V1 | Usuarios, registro/login, JWT, grupos, membresías e invitaciones |
| V2 | Actividades y participantes elegidos dentro de cada grupo |
| V3 | Fechas reales de inicio, actividades inmediatas/programadas, próximas e historial |
| V4 | Gastos con concepto, monto Decimal y pagador participante |
| V5 | Balances, transferencias sugeridas, frontend, Viaje/Plan/Pago rápido, preview y aportes múltiples |

## Producto final

La app distingue quién puso la plata de cuánto debe asumir cada persona. Todos los gastos de una actividad se reparten en partes iguales entre sus participantes.

- **Viaje:** crea un grupo, invita personas y organiza actividades por día usando sus fechas reales. Cada actividad puede tener participantes diferentes; el balance del viaje agrega sus resultados.
- **Plan:** acceso directo a una actividad corta: elegir un grupo existente, nombre, personas y ahora/fecha. Se abre directamente el resumen y los gastos. Si todavía no hay un grupo, primero se reúnen las personas mediante invitaciones.
- **Pago rápido:** calcula localmente entre 1 y 100 personas sin escribir en la base. Puede terminarse ahí o guardarse como plan: se elige un grupo, exactamente esa cantidad de participantes reales y quién pagó. La actividad, sus participantes y el gasto inicial se guardan en una única escritura atómica.

Viaje y Plan son recorridos de interfaz sobre Grupo → Actividad → Gasto, no tipos persistentes ni motores distintos. No se inventan cuentas invitadas ni participantes anónimos. El viaje usa las fechas de sus actividades; no hay fechas de viaje ficticias. Una cuenta rápida necesita identificar personas reales antes de guardarse; los centavos se asignan entonces según sus IDs.

## Quién paga y cuánto le corresponde

**Aportar dinero no equivale a asumir ese importe del gasto.** El costo se divide en partes iguales entre los participantes de la actividad; después se compara esa parte con lo que puso cada uno.

Ejemplo ilustrativo: una cena de **$4.000** compartida únicamente entre Bruno y Mili.

| Persona | Puso | Le corresponde | Balance |
|---|---:|---:|---:|
| Bruno | $3.000 | $2.000 | +$1.000: debe recibir |
| Mili | $1.000 | $2.000 | −$1.000: debe devolver |

**Resultado: Mili le debe $1.000 a Bruno.** Estos nombres son solamente ejemplos, no datos cargados en la app.

En **Nuevo gasto → Varias personas**, el usuario ingresa el total y cuánto puso cada participante. La interfaz indica cuánto falta o sobra, impide guardar hasta que la suma coincida y muestra las transferencias sugeridas antes de guardar. Se puede registrar dinero aportado por otra persona; quien carga el registro no tiene por qué ser quien pagó.

Un participante que no puso dinero puede dejar su aporte vacío o en cero y sigue formando parte del reparto. Los aportes enviados a la API son únicamente los positivos. Si participa una tercera persona, también asume su parte aunque no haya aportado: el ejemplo anterior de $2.000 por persona aplica solo a dos participantes.

Todos los aportes se guardan juntos o ninguno. Internamente se crea un registro de gasto por aporte, conservando concepto y pagador. **No se crea además otro gasto por el total**: en el ejemplo se guardan $3.000 y $1.000, que suman $4.000. Por eso `cantidadGastos` cuenta registros/aportes, no necesariamente cuentas o tickets distintos.

La opción **Una persona** mantiene el flujo de un solo pagador. **Pago rápido** conserva su selector de un pagador; la carga de varios aportes está disponible en **Nuevo gasto**, dentro de una actividad.

## Requisitos

- Node.js 24 y npm.
- PostgreSQL accesible mediante `DATABASE_URL`.
- Para la prueba de navegador: Chrome/Edge instalado o Chromium de Playwright.

## Instalación y ejecución local

Desde la raíz:

```sh
npm ci
npm --prefix frontend ci
```

Copiar `.env.example` a `.env` y completar la conexión a PostgreSQL y un `JWT_SECRET` aleatorio. No compartir ni versionar `.env`.

```sh
npm run prisma:validate
npm run prisma:migrate
npm run prisma:generate
npm run build
npm start
```

El backend escucha en `PORT` (4000 por defecto).

En otra terminal:

```sh
npm --prefix frontend run dev
```

Vite muestra la URL del frontend. Su proxy envía `/api` al backend. Si el backend usa otro puerto, configurar `API_PROXY_TARGET` en el entorno de Vite.

Variables del frontend, documentadas en `frontend/.env.example`:

- `VITE_API_URL`: base de la API; por defecto `/api/v1`. No contiene secretos.
- `API_PROXY_TARGET`: destino del proxy de desarrollo, por defecto `http://127.0.0.1:4000`. Es una variable del proceso de Vite, no del navegador.

La API admite opcionalmente `FRONTEND_ORIGIN` para un frontend alojado en otro origen. Debe ser un origen exacto, sin ruta ni barra final. El despliegue en el mismo origen no necesita CORS.

## Build y despliegue

```sh
npm --prefix frontend run build
npm run build
npm start
```

Express sirve `frontend/dist` y resuelve las rutas directas del frontend. Las rutas desconocidas bajo `/api` mantienen respuesta JSON 404. Construir ambos proyectos en el entorno de despliegue; configurar PostgreSQL, `DATABASE_URL`, `JWT_SECRET`, `PORT` y HTTPS. Aplicar las migraciones versionadas con `npm run prisma:migrate`; no usar reset. Regenerar Prisma Client en la plataforma de destino.

Si el frontend se despliega por separado, configurar `VITE_API_URL` antes de compilar, `FRONTEND_ORIGIN` en el backend y fallback de rutas a `index.html` en el alojamiento del frontend.

No se realizó publicación automática. No hay seeds ni datos de demostración ocultos: el usuario crea sus grupos y actividades.

## Arquitectura

Backend existente: Express → authMiddleware → controller → service → Prisma → PostgreSQL. V5 agrega funciones de cálculo, consultas y controllers siguiendo ese flujo. No crea tablas de balances ni cambia el schema.

Frontend en `frontend/src`:

- `pages/`: bienvenida, registro/login, Home, grupos, Plan, Pago rápido, invitaciones, actividades, gastos y perfil.
- `components/`: elementos comunes, layout y presentación de balances/transferencias.
- `hooks/`: sesión, carga de recursos, bloqueo inmediato de doble envío y confirmación de descarte de formularios.
- `services/api.ts`: cliente HTTP centralizado.
- `types.ts` y `utils/`: contratos, presentación de dinero/fechas, cálculo local de Pago rápido y suma exacta de aportes todavía no guardados.

Stack instalado: React 19.3, TypeScript 7, Vite 8.3, Tailwind CSS 4.3, React Router 7.18 y Lucide React 1.47. Las versiones exactas están en `frontend/package-lock.json`.

Backend: Node.js 24, Express 5.2, Prisma 7.10 con adaptador PostgreSQL, bcrypt y jsonwebtoken. Modelos existentes: `usuario`, `grupo`, `membresia`, `invitacion`, `actividad`, `participante` y `gasto`. No hay tablas de balances, transferencias realizadas ni pago rápido.

## Funcionalidades V1–V5

- Registro y login con bcrypt/JWT; sesión persistente, logout y rutas protegidas.
- Crear/listar grupos, invitar por email a una cuenta existente, aceptar/rechazar invitaciones.
- Crear actividades con una selección explícita de participantes.
- Inicio inmediato o fecha local programada, enviada como ISO/UTC; próximas e historial.
- Crear/listar gastos, con concepto y monto decimal; un pagador o varios aportes guardados atómicamente.
- Vista previa del reparto y transferencias calculada por el backend, sin persistir el borrador.
- Balances por actividad y por grupo; transferencias sugeridas, no pagos efectuados.
- Diseño mobile-first con superficies verdes/crema, geometría CSS y movimiento reducido según preferencias.

El resultado principal se presenta en tarjetas destacadas: quién le debe a quién, importe grande y texto personalizado (“Te tienen que devolver” / “Vos tenés que devolver”). Aparece en la actividad, el balance, la vista previa y después de guardar; el detalle contable queda debajo. La confirmación consulta el balance actualizado del servidor.

Las cargas reales usan un punto con pulso suave y skeletons con un brillo discreto, sin esperas artificiales. Los fondos verdes incluyen círculos y líneas con desplazamientos de 3–5 px y ciclos independientes de 28–36 segundos. Las animaciones se desactivan con `prefers-reduced-motion`.

El JWT se conserva en localStorage para mantener el contrato actual de autenticación Bearer. La sesión vence conforme al backend (una hora); ante 401 se elimina el token y se solicita login. No se guarda la contraseña. El último pagador se recuerda por usuario y actividad y se valida contra los participantes actuales. Las invitaciones se consultan dentro de la app: no se envían emails.

## API agregada o ampliada en V5

Todos requieren Bearer JWT.

| Método | Ruta bajo /api/v1 | Uso |
|---|---|---|
| GET | /activities | Hasta 12 planes/actividades recientes de los grupos del usuario |
| GET | /activities/:activityId/balance | Balance de una actividad |
| POST | /activities/:activityId/expenses/preview | Vista previa autorizada, sin escribir |
| GET | /groups/:groupId/balance | Agregado de las actividades del grupo |
| GET | /auth/me | Perfil propio: id, nombre y email |
| GET | /groups/:groupId | Grupo y miembros: id/nombre |
| GET | /invitations | Invitaciones pendientes del usuario |
| POST | /groups/:groupId/invitations | Invitar por email: `{ "email": "persona@example.com" }` |
| POST | /groups/:groupId/activities | Contrato ampliado con gasto inicial opcional para guardar Pago rápido |
| POST | /activities/:activityId/expenses | Contrato ampliado con aportes de varias personas |

POST /groups/:groupId/activities conserva el body existente y admite opcionalmente initialExpense: { concepto, monto, pagadorId }. Valida que el pagador esté entre los participantes y guarda todo con una escritura anidada. Sin ese campo, su comportamiento anterior se mantiene.

Los endpoints V1–V4 se conservan. Consultar balances requiere membresía del grupo. La identidad nunca proviene del body ni de query parameters. Los endpoints auxiliares permiten usar las capacidades existentes desde la interfaz sin exponer un listado global de usuarios.

El frontend mantiene los códigos del backend: éxito 200/201, errores de validación/autorización de dominio 400 y JWT ausente/inválido 401. El cliente también contempla 403, 404 y errores de red.

## Contrato y cálculo monetario

Los gastos mantienen Prisma Decimal / PostgreSQL NUMERIC(14,2). El body de gasto usa un string: `"24000.00"`. La interfaz acepta punto o coma como separador decimal, no separadores de miles. Las respuestas y todos los importes del balance son strings con dos decimales.

Los endpoints de balance devuelven:

```json
{
  "message": "Balance obtenido correctamente",
  "balance": {
    "total": "100.00",
    "cantidadGastos": 1,
    "participantes": [
      { "usuario": { "id": 1, "nombre": "Persona A" }, "pagado": "100.00", "corresponde": "50.00", "balance": "50.00" },
      { "usuario": { "id": 2, "nombre": "Persona B" }, "pagado": "0.00", "corresponde": "50.00", "balance": "-50.00" }
    ],
    "transferencias": [
      { "de": { "id": 2, "nombre": "Persona B" }, "hacia": { "id": 1, "nombre": "Persona A" }, "monto": "50.00" }
    ]
  }
}
```

1. Cada Decimal de gasto se convierte a centavos BigInt mediante su string exacto de dos decimales. No se usa Number, Float ni parseFloat para dinero.
2. Se suma el total de cada actividad y se divide por su cantidad de participantes con división entera.
3. El resto se distribuye de a un centavo entre participantes ordenados por ID ascendente. Por ejemplo, 100.00 / 3 asigna 33.34, 33.33 y 33.33.
4. Balance = pagado − corresponde. Positivo significa cobrar; negativo, pagar.
5. El grupo suma los resultados ya repartidos de cada actividad. No divide todos sus gastos entre todos sus miembros.
6. Deudores y acreedores se ordenan por ID. Se transfiere el menor saldo pendiente de ambos y se avanza cuando uno queda en cero. Conserva dinero, termina y produce como máximo N−1 transferencias entre N personas con saldo no nulo. No pretende optimización global.

POST /activities/:activityId/expenses también acepta { concepto, monto, aportes: [{ pagadorId, monto }] } en lugar de pagadorId. Requiere al menos dos aportes positivos, personas diferentes y participantes de la actividad; valida la suma en centavos. Responde { message, newExpenses } con importes string. Cada aporte conserva el concepto y su pagador.

Ejemplo de body para varios aportes; los IDs deben reemplazarse por participantes reales de la actividad:

```json
{
  "concepto": "Cena",
  "monto": "4000.00",
  "aportes": [
    { "pagadorId": 1, "monto": "3000.00" },
    { "pagadorId": 2, "monto": "1000.00" }
  ]
}
```

El formato original para un pagador sigue vigente:

```json
{
  "concepto": "Cena",
  "monto": "4000.00",
  "pagadorId": 1
}
```

No se deben enviar `pagadorId` y `aportes` juntos. La validación rechaza personas repetidas, aportes inválidos, pagadores ajenos a la actividad o una suma diferente del total. El guardado múltiple usa `createManyAndReturn` en una única operación de inserción; no necesita nuevas migraciones. El formato de un pagador devuelve `newExpense`; el de varios devuelve `newExpenses`.

La vista previa acepta el mismo formato de aportes múltiples o { concepto, monto, pagadorId } y devuelve { preview: { current, draft, next, shares } }. current y next son balances de toda la actividad; draft es el gasto aislado; shares muestra cuánto aumenta la correspondencia de cada persona al sumar ese gasto. Esta diferencia es necesaria porque los centavos se distribuyen sobre el total de la actividad. Nada se guarda en este endpoint.

Los balances se derivan de los gastos guardados y no registran transferencias realizadas. El frontend presenta los balances del servidor y conserva strings decimales para el formateo. Solo calcula localmente la cuenta transitoria de Pago rápido y la suma de los aportes del formulario, usando centavos BigInt; no reemplaza el balance persistido por cálculos propios.

## Verificación

```sh
npm test
npm run test:e2e
```

`npm test` compila y usa el runner integrado de Node: 15 pruebas, incluyendo 500 escenarios deterministas de conservación, centavos restantes, importes máximos y agregación por participación.

`npm run test:e2e` compila ambos proyectos y usa Playwright con Chrome/Edge local. En otro sistema, instalar Chromium con `cd frontend && npx playwright install chromium` o establecer `BROWSER_EXECUTABLE`.

La prueba e2e levanta el frontend de producción y los handlers reales con Prisma/PostgreSQL dentro de una transacción de verificación. Cubre registro/login/logout, grupos, invitación/aceptación/rechazo, actividades, fechas, gastos, otros pagadores, balances, permisos, refresh, errores de red y tamaños de 360, 390, 430, 768, 1024, 1366 y 1440px. También verifica pago rápido, guardar como plan, preview sin escritura, errores sin perder formulario, descarte accesible, conexión lenta y doble envío. Revierte todos sus datos al terminar y compara huellas de las tablas anteriores. Como en cualquier rollback PostgreSQL, las secuencias pueden avanzar; no se resetean. Ejecutarla sobre una base de desarrollo sin escrituras simultáneas.

No se agregaron reglas de lint: TypeScript estricto y los builds forman parte de la verificación.

La revisión final pasó 15 pruebas matemáticas y 49 comprobaciones e2e. El detalle de auditoría y archivos está en [V5-REVISION.md](V5-REVISION.md).

Las pruebas incluyen explícitamente el total de $4.000 con aportes de $3.000 y $1.000, su transferencia de $1.000, avisos de faltantes/sobrantes, rechazo de aportes inválidos sin escrituras parciales y guardado real desde el navegador. Las cifras anteriores corresponden a la última ejecución de pruebas; una edición del README no implica ejecutarlas nuevamente.

## Alcance y límites

No hay pagos reales, categorías persistentes, notificaciones, fotos, multi-moneda, porcentajes, edición/eliminación de gastos ni datos de producto hardcodeados. El listado de gastos permanece dentro de su actividad; el balance de grupo reúne todo el viaje.

Las pantallas de referencia se reconstruyen como componentes: no se usan imágenes de fondo. Los botones muestran únicamente acciones disponibles.

La revisión final corrigió dos escrituras parciales de V1: grupo + membresía e invitación aceptada + membresía ahora usan escrituras anidadas atómicas. No requiere migraciones ni cambia datos existentes.

Nuevo gasto permite elegir Una persona o Varias personas. En el segundo caso se ingresa el total y cuánto puso cada participante: los aportes deben sumar exactamente ese total. El backend guarda todos los aportes atómicamente como registros de gasto individuales, sin duplicar el total ni cambiar el schema. Las sugerencias de transferencias no registran pagos. El pago rápido es transitorio y no se sincroniza entre dispositivos hasta guardarlo.

Antes de un despliegue público sostenido quedan como trabajo operativo la configuración HTTPS, alojamiento, variables y base de datos; recuperación de cuenta y límites de peticiones no forman parte de V5.

El bloqueo de doble clic evita envíos simultáneos desde el formulario. No existe una clave de idempotencia del servidor que deduplique un reintento después de perder la respuesta de red. No se implementaron OCR, IA, chat, mapas ni reparto por consumo individual. Repartir el costo en partes iguales y permitir aportes diferentes son capacidades distintas: la app admite lo segundo sin cambiar lo primero.
