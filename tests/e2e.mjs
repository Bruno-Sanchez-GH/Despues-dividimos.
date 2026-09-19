import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile, access } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { chromium, expect } from "../frontend/node_modules/@playwright/test/index.mjs";
import prisma from "../dist/prisma.js";

let checks = 0;
const pass = (label) => { checks++; console.log("PASS " + label); };
async function snapshot(client) {
    const data = {};
    for (const name of ["usuario", "grupo", "membresia", "invitacion", "actividad", "participante", "gasto"]) {
        const rows = await client[name].findMany();
        data[name] = { count: rows.length, hash: createHash("sha256").update(JSON.stringify(rows.map((r) => JSON.stringify(r)).sort())).digest("hex") };
    }
    return data;
}
async function loadApp(client) {
    const cache = new Map();
    async function load(url) {
        if (cache.has(url)) return cache.get(url);
        let mod;
        if (url.endsWith("/dist/prisma.js")) mod = new vm.SyntheticModule(["default"], function() { this.setExport("default", client); }, { identifier: url });
        else if (url.startsWith("file:") && !url.includes("/dist/generated/")) mod = new vm.SourceTextModule(await readFile(new URL(url), "utf8"), { identifier: url, initializeImportMeta(meta) { meta.url = url; } });
        else {
            const actual = await import(url);
            mod = new vm.SyntheticModule(Object.keys(actual), function() { for (const key of Object.keys(actual)) this.setExport(key, actual[key]); }, { identifier: url });
        }
        cache.set(url, mod);
        if (mod instanceof vm.SourceTextModule) await mod.link((name, parent) => load(name.startsWith(".") ? new URL(name, parent.identifier).href : name));
        return mod;
    }
    const mod = await load(pathToFileURL(resolve("dist/app.js")).href);
    await mod.evaluate();
    return mod.namespace.default;
}
async function browserExecutable() {
    const paths = [process.env.BROWSER_EXECUTABLE, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"];
    for (const path of paths.filter(Boolean)) { try { await access(path); return path; } catch {} }
    return undefined;
}
const before = await snapshot(prisma);
const rollback = new Error("ROLLBACK_V5_TEST");
let browser;
try {
    browser = await chromium.launch({ headless: true, executablePath: await browserExecutable() });
    try {
        await prisma.$transaction(async (tx) => {
            const app = await loadApp(tx);
            const server = app.listen(0, "127.0.0.1");
            await new Promise((r) => server.once("listening", r));
            const base = "http://127.0.0.1:" + server.address().port;
            const javascriptErrors = [];
            const unexpectedResponses = [];
            const contexts = [];
            async function makePage() {
                const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
                contexts.push(context);
                const page = await context.newPage();
                page.setDefaultTimeout(12000);
                page.on("dialog", (dialog) => dialog.accept());
                page.on("pageerror", (error) => javascriptErrors.push(error.message));
                page.on("response", (response) => { if (response.status() >= 500) unexpectedResponses.push(response.url()); });
                return page;
            }
            async function fits(page, label) {
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), label + " horizontal overflow");
                pass(label);
            }
            async function shot(page, name) {
                if (process.env.V5_SCREENSHOTS === "1") { const path = join(tmpdir(), "dd-v5-" + name + ".png"); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path, fullPage: true }); console.log("SCREENSHOT " + path); }
            }
            async function register(page, name, email) {
                await page.goto(base + "/");
                await page.getByRole("link", { name: "Crear cuenta", exact: true }).click();
                await page.getByLabel("Tu nombre").fill(name);
                await page.getByLabel("Email", { exact: true }).fill(email);
                await page.getByLabel("Contraseña", { exact: true }).fill("v5-temporary-test-password");
                await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
                await expect(page.getByRole("heading", { name: "¿Qué hacemos?", exact: true })).toBeVisible();
                pass("registro, login automatico y ruta protegida: " + name);
            }
            try {
                const a = await makePage(), b = await makePage(), c = await makePage();
                const stamp = Date.now();
                const emails = ["ana", "bea", "ciro"].map((n) => n + "-v5-" + stamp + "@example.invalid");
                await a.goto(base + "/");
                await shot(a, "welcome-mobile"); await fits(a, "bienvenida mobile");
                await register(a, "Ana Prueba", emails[0]); await register(b, "Bea Prueba", emails[1]); await register(c, "Ciro Prueba", emails[2]);
                await expect(a.getByText("Todavía no compartiste ningún gasto.")).toBeVisible();
                await a.getByRole("link", { name: /Organizar un viaje/ }).click();
                await a.getByLabel("Nombre del grupo").fill("Escapada compartida");
                await a.getByRole("button", { name: "Crear viaje", exact: true }).click();
                await expect(a.getByRole("heading", { name: "Escapada compartida", exact: true })).toBeVisible();
                const groupUrl = a.url().split("?")[0]; const groupId = Number(new URL(groupUrl).pathname.split("/").pop());
                pass("crear grupo");
                async function invite(email) {
                    await a.goto(groupUrl + "/invite");
                    await a.getByLabel("Email de la persona").fill(email);
                    await a.getByRole("button", { name: "Enviar invitación" }).click();
                    await expect(a.getByRole("status").filter({ hasText: "Invitación enviada" })).toBeVisible();
                }
                await invite(emails[1]);
                await b.goto(base + "/invitations");
                await b.getByRole("button", { name: "Aceptar", exact: true }).click();
                await expect(b.getByRole("status").filter({ hasText: "Ya sos parte" })).toBeVisible();
                pass("invitacion por email y aceptacion");
                await invite(emails[2]);
                await c.goto(base + "/invitations");
                await c.getByRole("button", { name: "Rechazar", exact: true }).click();
                await expect(c.getByRole("status").filter({ hasText: "rechazada" })).toBeVisible();
                pass("rechazo de invitacion");
                await invite(emails[2]); await c.reload();
                await c.getByRole("button", { name: "Aceptar", exact: true }).click();
                await expect(c.getByRole("status").filter({ hasText: "Ya sos parte" })).toBeVisible();
                await a.goto(groupUrl + "/activities/new");
                await a.getByLabel("¿Cuál es el plan?").fill("Cena frente al mar");
                await a.getByLabel("Bea Prueba", { exact: true }).check();
                await a.getByLabel("Ciro Prueba", { exact: true }).check();
                await a.getByRole("button", { name: "Crear actividad", exact: true }).click();
                await expect(a.getByRole("heading", { name: "Cena frente al mar", exact: true })).toBeVisible();
                const activityUrl = a.url(); const activityId = Number(new URL(activityUrl).pathname.split("/").pop());
                pass("crear actividad inmediata con tres participantes");
                await a.getByRole("button", { name: "Balance de la actividad" }).click();
                await expect(a.getByRole("heading", { name: "Todos están a mano." })).toBeVisible();
                pass("balance sin gastos");
                async function expense(amount, concept, payer) {
                    await a.goto(activityUrl + "/expenses/new");
                    await a.getByLabel("Monto", { exact: true }).fill(amount);
                    await a.getByLabel("Concepto", { exact: true }).fill(concept);
                    await a.getByRole("radio", { name: payer, exact: false }).check();
                    await a.getByRole("button", { name: "Guardar gasto" }).click();
                    await expect(a.getByRole("heading", { name: "¡Listo!" })).toBeVisible();
                }
                await expense("100,00", "Cena", "Ana Prueba");
                await a.getByRole("button", { name: "Agregar otro" }).click();
                await expect(a.getByLabel("Monto", { exact: true })).toHaveValue("");
                await a.getByLabel("Monto", { exact: true }).fill("0");
                await a.getByLabel("Concepto", { exact: true }).fill("Prueba inválida");
                await a.getByRole("button", { name: "Guardar gasto" }).click();
                await expect(a.getByRole("alert")).toContainText("mayor a cero");
                pass("feedback de exito, agregar otro y validacion de monto");
                await expense("0,01", "Agua", "Bea Prueba");
                await a.goto(activityUrl + "/expenses/new");
                await expect(a.getByRole("radio", { name: /Bea Prueba/ })).toBeChecked();
                await shot(a, "expense-mobile");
                pass("ultimo pagador recordado por actividad y usuario");
                await a.goto(activityUrl);
                await expect(a.getByRole("heading", { name: "Cena", exact: true })).toBeVisible();
                await expect(a.getByRole("heading", { name: "Agua", exact: true })).toBeVisible();
                await a.getByRole("button", { name: "Balance de la actividad" }).click();
                await expect(a.getByText("TOTAL GASTADO", { exact: true })).toBeVisible();
                await expect(a.getByText("$ 100,01", { exact: true }).first()).toBeVisible();
                await expect(a.getByRole("heading", { name: "Para quedar a mano" })).toBeVisible();
                await fits(a, "balance a 390px"); await shot(a, "balance-mobile");
                for (const width of [360, 430, 768, 1024, 1366, 1440]) {
                    await a.setViewportSize({ width, height: 900 }); await fits(a, "balance a " + width + "px");
                }
                await shot(a, "balance-desktop");
                await a.emulateMedia({ reducedMotion: "reduce" });
                assert.equal(await a.locator(".geometry i").first().evaluate((el) => getComputedStyle(el).animationName), "none");
                pass("prefers-reduced-motion");
                await a.setViewportSize({ width: 390, height: 844 });
                await a.goto(groupUrl + "/activities/new");
                await a.getByLabel("¿Cuál es el plan?").fill("Excursión programada");
                await a.getByLabel("Bea Prueba", { exact: true }).check();
                await a.getByRole("checkbox", { name: /Programar fecha/ }).check();
                const date = new Date(Date.now() + 86400000);
                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                await a.getByLabel("Fecha y hora local").fill(localDate);
                await a.getByRole("button", { name: "Crear actividad", exact: true }).click();
                await expect(a.getByRole("heading", { name: "Excursión programada", exact: true })).toBeVisible();
                const secondActivity = a.url();
                await a.goto(groupUrl);
                await a.getByRole("button", { name: "Próximas", exact: true }).click();
                await expect(a.getByRole("link").filter({ hasText: "Excursión programada" })).toBeVisible();
                await a.getByRole("button", { name: "Historial", exact: true }).click();
                await expect(a.getByRole("link").filter({ hasText: "Cena frente al mar" })).toBeVisible();
                pass("fecha local a UTC, proximas e historial");
                await a.goto(secondActivity + "/expenses/new");
                await a.getByLabel("Monto", { exact: true }).fill("10");
                await a.getByLabel("Concepto", { exact: true }).fill("Entradas");
                await a.getByRole("button", { name: "Guardar gasto" }).click();
                await expect(a.getByRole("heading", { name: "¡Listo!" })).toBeVisible();
                await a.goto(groupUrl + "?tab=balance");
                await expect(a.getByText("$ 110,01", { exact: true }).first()).toBeVisible();
                pass("balance agregado de grupo");
                const token = await a.evaluate(() => localStorage.getItem("dd.session"));
                const get = async (path, tokenValue = token) => {
                    const response = await fetch(base + "/api/v1" + path, { headers: tokenValue ? { Authorization: "Bearer " + tokenValue } : {} });
                    return { status: response.status, body: await response.json() };
                };
                const activityBalance = (await get("/activities/" + activityId + "/balance")).body.balance;
                assert.equal(activityBalance.total, "100.01");
                assert.equal(activityBalance.cantidadGastos, 2);
                assert.deepEqual(activityBalance.participantes.map((p) => p.corresponde), ["33.34", "33.34", "33.33"]);
                const groupBalance = (await get("/groups/" + groupId + "/balance")).body.balance;
                assert.deepEqual(groupBalance.participantes.map((p) => p.corresponde), ["38.34", "38.34", "33.33"]);
                assert.ok(!JSON.stringify(groupBalance).includes("passwordHash"));
                assert.ok(!JSON.stringify(groupBalance).includes("email"));
                pass("contratos JSON reales y division solo entre participantes de cada actividad");
                const outside = await makePage(); await register(outside, "Otra Persona", "externo-v5-" + stamp + "@example.invalid");
                const outsideToken = await outside.evaluate(() => localStorage.getItem("dd.session"));
                for (const path of ["/activities/" + activityId + "/balance", "/groups/" + groupId + "/balance"]) {
                    assert.equal((await get(path, null)).status, 401);
                    assert.equal((await get(path, "invalid")).status, 401);
                    assert.equal((await get(path, outsideToken)).status, 400);
                }
                for (const path of ["/activities/2147483647/balance", "/groups/2147483647/balance", "/activities/abc/balance", "/groups/0/balance"]) assert.equal((await get(path)).status, 400);
                pass("autorizacion, JWT invalido/ausente, IDs y recursos inexistentes");
                await a.reload(); await expect(a.getByText("$ 110,01", { exact: true }).first()).toBeVisible();
                pass("refresh y ruta directa mantienen sesion y contexto");
                const send = async (path, body, auth = token) => {
                    const response = await fetch(base + "/api/v1" + path, { method: "POST", headers: { Authorization: "Bearer " + auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });
                    return { status: response.status, body: await response.json() };
                };
                const people = activityBalance.participantes.map((p) => p.usuario.id);
                const countBefore = await tx.gasto.count();
                const preview = await send(`/activities/${activityId}/expenses/preview`, { concepto: "Cuenta", monto: "0.01", pagadorId: people[1] });
                assert.equal(preview.status, 200);
                assert.equal(preview.body.preview.next.total, "100.02");
                assert.deepEqual(preview.body.preview.shares.map((p) => p.corresponde), ["0.00", "0.00", "0.01"]);
                assert.equal(await tx.gasto.count(), countBefore);
                for (const monto of ["0", "-1", "abc", "1.001", 24]) assert.equal((await send(`/activities/${activityId}/expenses`, { concepto: "Inválido", monto, pagadorId: people[0] })).status, 400);
                assert.equal((await send(`/activities/${activityId}/expenses/preview`, { concepto: "Cuenta", monto: "1", pagadorId: people[0] }, outsideToken)).status, 400);
                const numActivities = await tx.actividad.count();
                assert.equal((await send(`/groups/${groupId}/activities`, { nombre: "No guardar", participantes: [people[0]], initialExpense: { concepto: "Inválido", monto: "10", pagadorId: people[1] } })).status, 400);
                assert.equal(await tx.actividad.count(), numActivities);
                pass("preview exacto sin escritura, montos inválidos y plan inválido sin persistencia parcial");

                await a.goto(base + "/quick");
                await a.getByLabel("¿Cuánto fue?", { exact: true }).fill("4000");
                await a.getByLabel("Otra persona", { exact: true }).check();
                await a.getByRole("button", { name: "Dividir", exact: true }).click();
                await expect(a.getByText("Le tienen que devolver", { exact: true })).toBeVisible();
                await expect(a.getByText("$ 2.000,00", { exact: true }).first()).toBeVisible();
                assert.equal(await tx.gasto.count(), countBefore);
                await shot(a, "quick-result");
                await a.getByRole("link", { name: "Guardar como plan" }).click();
                await a.getByLabel("¿Con quién compartís?", { exact: true }).selectOption(String(groupId));
                await a.getByLabel("Nombre del plan").fill("Pizza compartida");
                await a.getByLabel("Bea Prueba", { exact: true }).check();
                await a.getByLabel("¿Quién puso la plata?").selectOption(String(people[1]));
                await a.getByRole("button", { name: "Guardar plan y gasto" }).click();
                await expect(a.getByRole("heading", { name: "Pizza compartida", exact: true })).toBeVisible();
                const pizzaId = Number(new URL(a.url()).pathname.split("/").pop());
                const pizza = (await get(`/activities/${pizzaId}/balance`)).body.balance;
                assert.deepEqual(pizza.participantes.map((p) => p.balance), ["-2000.00", "2000.00"]);
                assert.equal(pizza.transferencias[0].monto, "2000.00");
                assert.equal(await tx.gasto.count(), countBefore + 1);
                pass("pago rápido por otra persona, guardado atómico como plan y caso pizza completo");
                assert.equal((await send(`/activities/${pizzaId}/expenses`, { concepto: "No participa", monto: "10", pagadorId: people[2] })).status, 400);
                const bToken = await b.evaluate(() => localStorage.getItem("dd.session"));
                assert.equal((await send(`/activities/${pizzaId}/expenses`, { concepto: "Bebida", monto: "10", pagadorId: people[1] }, bToken)).status, 201);
                assert.equal((await send(`/activities/${pizzaId}/expenses`, { concepto: "Postre", monto: "10", pagadorId: people[0] })).status, 201);
                pass("distintas cuentas cargan sus pagos y backend rechaza pagador no participante");

                await a.goto(base + "/plans/new?group=" + groupId);
                await a.getByLabel("Nombre del plan").fill("Plan de una tarde");
                await a.getByLabel("Bea Prueba", { exact: true }).check();
                await a.getByRole("button", { name: "Crear plan", exact: true }).click();
                await expect(a.getByRole("heading", { name: "Plan de una tarde", exact: true })).toBeVisible();
                await expect(a.getByText("$ 0,00 por persona", { exact: true })).toBeVisible();
                pass("crear plan directo, personas reales y resumen vivo vacío");

                await a.goto(activityUrl + "/expenses/new");
                await a.getByLabel("Monto", { exact: true }).fill("4000");
                await a.getByLabel("Concepto", { exact: true }).fill("Cuenta nueva");
                await a.getByRole("radio", { name: /Yo · Ana/ }).check();
                await expect(a.getByText("$ 4.100,01", { exact: true })).toBeVisible();
                for (const width of [360, 390, 430, 768, 1024, 1366, 1440]) {
                    await a.setViewportSize({ width, height: 900 }); await fits(a, "nuevo gasto a " + width + "px"); await shot(a, "expense-" + width);
                }
                await a.getByRole("link", { name: "Inicio", exact: true }).click();
                await expect(a.getByRole("dialog")).toBeVisible();
                await shot(a, "discard-dialog");
                await a.getByRole("button", { name: "Seguir editando" }).click();
                await expect(a.getByLabel("Monto", { exact: true })).toHaveValue("4000");
                await a.getByRole("link", { name: "Inicio", exact: true }).click();
                await a.getByRole("button", { name: "Descartar y salir" }).click();
                await expect(a.getByRole("heading", { name: "¿Qué hacemos?" })).toBeVisible();
                await shot(a, "home-desktop");
                await a.setViewportSize({ width: 390, height: 844 }); await shot(a, "home-mobile");
                pass("preview antes de guardar, modal accesible y protección del formulario");

                await a.goto(activityUrl + "/expenses/new");
                await a.getByLabel("Monto", { exact: true }).fill("1");
                await a.getByLabel("Concepto", { exact: true }).fill("Reintento");
                await a.route("**/api/v1/activities/*/expenses", (route) => route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "No pudimos guardar el gasto." }) }));
                await a.getByRole("button", { name: "Guardar gasto", exact: true }).click();
                await expect(a.getByRole("alert")).toContainText("Tu información sigue acá");
                await expect(a.getByLabel("Monto", { exact: true })).toHaveValue("1");
                await a.unroute("**/api/v1/activities/*/expenses");
                let releaseSave; let saves = 0;
                const saved = new Promise((resolve) => { releaseSave = resolve; });
                await a.route("**/api/v1/activities/*/expenses", async (route) => { saves++; await saved; await route.continue(); });
                await a.getByRole("button", { name: "Guardar gasto", exact: true }).evaluate((button) => { button.click(); button.click(); });
                await expect(a.getByRole("button", { name: "Guardando…", exact: true })).toBeDisabled();
                releaseSave();
                await expect(a.getByRole("heading", { name: "¡Listo!" })).toBeVisible();
                assert.equal(saves, 1);
                await a.unroute("**/api/v1/activities/*/expenses");
                pass("error backend conserva formulario, conexión lenta y doble envío bloqueado");
                const shared = await send(`/groups/${groupId}/activities`, { nombre: "Cena con aportes", participantes: [people[0], people[1]] });
                assert.equal(shared.status, 201);
                const sharedId = shared.body.newActivity.id;
                const expensesBefore = await tx.gasto.count();
                const payload = { concepto: "Cena", monto: "4000", aportes: [{ pagadorId: people[0], monto: "3000" }, { pagadorId: people[1], monto: "1000" }] };
                for (const invalid of [{ ...payload, monto: "5000" }, { ...payload, aportes: [payload.aportes[0], { pagadorId: people[2], monto: "1000" }] }, { ...payload, aportes: [payload.aportes[0], payload.aportes[0]] }, { ...payload, aportes: [payload.aportes[0], { pagadorId: people[1], monto: "-1000" }] }]) assert.equal((await send(`/activities/${sharedId}/expenses`, invalid)).status, 400);
                assert.equal((await send(`/activities/${sharedId}/expenses`, payload, outsideToken)).status, 400);
                assert.equal(await tx.gasto.count(), expensesBefore);
                pass("aportes inválidos o no autorizados no guardan registros parciales");
                await a.goto(base + `/activities/${sharedId}/expenses/new`);
                await a.getByLabel("Monto", { exact: true }).fill("4000");
                await a.getByLabel("Concepto", { exact: true }).fill("Cena");
                await a.getByRole("button", { name: "Varias personas", exact: true }).click();
                await a.getByLabel("Aporte de Ana Prueba", { exact: true }).fill("3000");
                await a.getByLabel("Aporte de Bea Prueba", { exact: true }).fill("500");
                await expect(a.getByRole("button", { name: "Guardar gasto", exact: true })).toBeDisabled();
                await expect(a.getByText("Faltan $ 500,00 por asignar.", { exact: true })).toBeVisible();
                await a.getByLabel("Aporte de Bea Prueba", { exact: true }).fill("1500");
                await expect(a.getByText("Sobran $ 500,00. Revisá los aportes.", { exact: true })).toBeVisible();
                await a.getByLabel("Aporte de Bea Prueba", { exact: true }).fill("1000");
                await expect(a.locator(".settlement-explanation:visible")).toHaveText("Bea Prueba le debe a Ana Prueba");
                await expect(a.locator(".settlement-amount:visible")).toHaveText("$ 1.000,00");
                for (const width of [360, 1440]) { await a.setViewportSize({ width, height: 900 }); await fits(a, "aportes a " + width + "px"); await shot(a, "contributions-" + width); }
                await a.getByRole("button", { name: "Guardar gasto", exact: true }).click();
                await expect(a.getByRole("heading", { name: "¡Listo!" })).toBeVisible();
                const contributed = (await get(`/activities/${sharedId}/balance`)).body.balance;
                assert.equal(contributed.total, "4000.00");
                assert.deepEqual(contributed.participantes.map((p) => [p.pagado, p.corresponde, p.balance]), [["3000.00", "2000.00", "1000.00"], ["1000.00", "2000.00", "-1000.00"]]);
                assert.deepEqual(contributed.transferencias.map((t) => [t.de.id, t.hacia.id, t.monto]), [[people[1], people[0], "1000.00"]]);
                assert.equal(await tx.gasto.count(), expensesBefore + 2);
                await expect(a.locator(".success-screen .settlement-amount")).toHaveText("$ 1.000,00");
                await shot(a, "settlement-success");
                await a.getByRole("link", { name: "Ver cómo quedan las cuentas" }).click();
                await expect(a.locator(".transfer-list")).toContainText("$ 1.000,00");
                await shot(a, "settlement-result");
                pass("varios aportes suman 4000 una sola vez y el balance devuelve 1000 a quien puso 3000");
                await a.goto(base + "/groups");
                await a.route("**/api/v1/groups", (route) => route.abort());
                await a.reload(); await expect(a.getByRole("alert")).toContainText("No pudimos conectar");
                await a.unroute("**/api/v1/groups");
                await a.getByRole("button", { name: "Reintentar", exact: true }).click();
                await expect(a.getByRole("heading", { name: "Escapada compartida", exact: true })).toBeVisible();
                pass("estado de error de red y reintento");
                await shot(a, "groups-mobile"); await fits(a, "mis grupos mobile");
                await a.setViewportSize({ width: 1440, height: 960 }); await shot(a, "groups-desktop"); await fits(a, "mis grupos desktop");
                await a.goto(base + "/profile"); await a.getByRole("button", { name: "Cerrar sesión" }).click();
                await expect(a.getByRole("heading", { name: "Qué bueno verte." })).toBeVisible();
                assert.equal(await a.evaluate(() => localStorage.getItem("dd.session")), null);
                await a.getByLabel("Email", { exact: true }).fill(emails[0]); await a.getByLabel("Contraseña", { exact: true }).fill("v5-temporary-test-password");
                await a.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
                await expect(a.getByRole("heading", { name: /¿Qué hacemos|Mi perfil/ })).toBeVisible();
                pass("logout y nuevo login");
                await a.evaluate(() => localStorage.setItem("dd.session", "invalid"));
                await a.goto(base + "/groups");
                await expect(a.getByRole("heading", { name: "Qué bueno verte." })).toBeVisible();
                pass("sesion expirada redirige a login");
                assert.deepEqual(javascriptErrors, []);
                assert.deepEqual(unexpectedResponses, []);
                pass("sin errores JavaScript ni respuestas 5xx");
            } catch (error) {
                console.error("Browser errors:", javascriptErrors);
                for (const context of contexts.slice(0, 1)) for (const page of context.pages()) {
                    console.error("Failure URL:", page.url());
                    console.error((await page.locator("body").innerText()).slice(0, 2500));
                    await shot(page, "failure");
                }
                throw error;
            } finally {
                for (const context of contexts) await context.close();
                await new Promise((r) => server.close(r));
            }
            throw rollback;
        }, { timeout: 480000, maxWait: 10000 });
    } catch (error) { if (error !== rollback) throw error; }
    assert.deepEqual(await snapshot(prisma), before);
    pass("rollback completo: datos anteriores intactos, sin registros de prueba");
    console.log("TOTAL E2E PASS: " + checks);
} finally {
    await browser?.close();
    await prisma.$disconnect();
}
