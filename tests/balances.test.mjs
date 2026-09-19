import test from "node:test";
import assert from "node:assert/strict";
import calculate from "../dist/service/balances.calculate.js";
import { Prisma } from "../dist/generated/prisma/client.js";
import { quickSplit } from "../frontend/src/utils/quickSplit.ts";
import { validateContributions } from "../dist/service/expenses.validate.js";
import { contributionsSummary } from "../frontend/src/utils/contributions.ts";

const users = [1, 2, 3].map((id) => ({ id, nombre: "Persona " + id }));
const activity = (ids, expenses = []) => ({ participantes: ids.map((id) => ({ usuario: users.find((u) => u.id === id) })), gastos: expenses.map(([pagadorId, monto]) => ({ pagadorId, monto: new Prisma.Decimal(monto) })) });
const cents = (value) => BigInt(value.replace(".", ""));
test("cuenta de 4000: aportes de 3000 y 1000, el segundo devuelve 1000 al primero", () => {
    const input = { concepto: "Cena", monto: "4000", aportes: [{ pagadorId: 1, monto: "3000" }, { pagadorId: 2, monto: "1000" }] };
    const expenses = validateContributions(input);
    const result = calculate([{ participantes: activity([1, 2]).participantes, gastos: expenses }]);
    assert.deepEqual(result.participantes.map((p) => [p.pagado, p.corresponde, p.balance]), [["3000.00", "2000.00", "1000.00"], ["1000.00", "2000.00", "-1000.00"]]);
    assert.deepEqual(result.transferencias.map((t) => [t.de.id, t.hacia.id, t.monto]), [[2, 1, "1000.00"]]);
    invariants(result);
});
test("aportes: sumas exactas, duplicados y datos incompletos", () => {
    const valid = { concepto: "Cuenta", monto: "0.30", aportes: [{ pagadorId: 1, monto: "0.10" }, { pagadorId: 2, monto: "0.20" }] };
    assert.equal(validateContributions(valid).length, 2);
    for (const input of [ { ...valid, monto: "0.31" }, { ...valid, monto: "0.29" }, { ...valid, pagadorId: 1 }, { ...valid, aportes: [valid.aportes[0]] }, { ...valid, aportes: [valid.aportes[0], valid.aportes[0]] }, { ...valid, aportes: null }, { ...valid, aportes: [valid.aportes[0], null] }, { ...valid, aportes: [valid.aportes[0], { pagadorId: 2, monto: "-0.20" }] } ]) assert.throws(() => validateContributions(input));
    assert.equal(contributionsSummary("0.30", valid.aportes).complete, true);
    assert.equal(contributionsSummary("0.31", valid.aportes).difference, "0.01");
    assert.equal(contributionsSummary("0.29", valid.aportes).difference, "-0.01");
    assert.equal(contributionsSummary("1", [{ pagadorId: 1, monto: "1" }, { pagadorId: 2, monto: "0" }]).complete, false);
});
test("pizza: otro puso 4000, cada uno asume 2000", () => {
    const result = calculate([activity([1, 2], [[2, "4000.00"]])]);
    assert.deepEqual(result.participantes.map((p) => [p.pagado, p.corresponde, p.balance]), [["0.00", "2000.00", "-2000.00"], ["4000.00", "2000.00", "2000.00"]]);
    assert.deepEqual(result.transferencias.map((t) => [t.de.id, t.hacia.id, t.monto]), [[1, 2, "2000.00"]]);
});
test("todos pagan distinto y todos quedan a mano cuando sus aportes coinciden", () => {
    const distinct = calculate([activity([1, 2, 3], [[1, "10.01"], [2, "20.02"], [3, "30.03"]])]);
    invariants(distinct);
    const equal = calculate([activity([1, 2, 3], [[1, "10.00"], [2, "10.00"], [3, "10.00"]])]);
    assert.deepEqual(equal.transferencias, []);
    assert.ok(equal.participantes.every((p) => p.balance === "0.00"));
});
test("pago rápido coincide con el motor persistido y conserva centavos", () => {
    for (const value of ["0.01", "0.02", "100", "48000", "999999999999.99"]) {
        for (const count of [1, 2, 3, 7, 100]) {
            const shares = quickSplit(value, count);
            const people = Array.from({ length: count }, (_, i) => ({ usuario: { id: i + 1, nombre: `Persona ${i}` } }));
            const result = calculate([{ participantes: people, gastos: [{ monto: new Prisma.Decimal(value), pagadorId: 1 }] }]);
            assert.deepEqual(shares, result.participantes.map((p) => p.corresponde));
        }
    }
    for (const [value, count] of [["0", 2], ["-1", 2], ["1.999", 2], ["1", 0], ["1", 101], ["1", 1.5]]) assert.throws(() => quickSplit(value, count));
});
function invariants(result) {
    const total = cents(result.total);
    assert.equal(result.participantes.reduce((n, p) => n + cents(p.pagado), 0n), total);
    assert.equal(result.participantes.reduce((n, p) => n + cents(p.corresponde), 0n), total);
    assert.equal(result.participantes.reduce((n, p) => n + cents(p.balance), 0n), 0n);
    const remaining = new Map(result.participantes.map((p) => [p.usuario.id, cents(p.balance)]));
    for (const t of result.transferencias) {
        assert.ok(cents(t.monto) > 0n);
        assert.notEqual(t.de.id, t.hacia.id);
        remaining.set(t.de.id, remaining.get(t.de.id) + cents(t.monto));
        remaining.set(t.hacia.id, remaining.get(t.hacia.id) - cents(t.monto));
    }
    assert.ok([...remaining.values()].every((n) => n === 0n));
    assert.ok(result.transferencias.length <= Math.max(0, result.participantes.length - 1));
}
test("Prisma Decimal instalado conserva decimales y serializa como string", () => {
    const value = new Prisma.Decimal("0.1").plus("0.2");
    assert.equal(value.toFixed(2), "0.30");
    assert.equal(typeof JSON.parse(JSON.stringify(value)), "string");
    assert.equal(new Prisma.Decimal("999999999999.99").toFixed(2), "999999999999.99");
});
test("actividad sin gastos y grupo vacio", () => {
    for (const result of [calculate([]), calculate([], users), calculate([activity([1, 2, 3])])]) {
        assert.equal(result.total, "0.00"); assert.equal(result.cantidadGastos, 0); invariants(result);
    }
});
test("division exacta y participante que pago cero", () => {
    const result = calculate([activity([1, 2, 3], [[1, "30.00"]])]);
    assert.deepEqual(result.participantes.map((p) => p.balance), ["20.00", "-10.00", "-10.00"]);
    invariants(result);
});
test("centavos restantes por ID ascendente, sin depender del orden de entrada", () => {
    const result = calculate([activity([3, 1, 2], [[1, "100.00"]])]);
    assert.deepEqual(result.participantes.map((p) => p.corresponde), ["33.34", "33.33", "33.33"]);
    assert.deepEqual(result, calculate([activity([1, 2, 3], [[1, "100.00"]])]));
    invariants(result);
});
test("un centavo repartido entre tres participantes", () => {
    const result = calculate([activity([1, 2, 3], [[3, "0.01"]])]);
    assert.deepEqual(result.participantes.map((p) => p.corresponde), ["0.01", "0.00", "0.00"]);
    invariants(result);
});
test("varios gastos, varios pagadores y limites NUMERIC(14,2)", () => {
    for (const expenses of [[[1, "30000.00"], [2, "10000.00"]], [[1, "0.10"], [2, "0.20"]], [[1, "999999999999.99"], [2, "999999999999.99"], [3, "999999999999.99"]]]) {
        invariants(calculate([activity([1, 2, 3], expenses)]));
    }
});
test("el agregado de grupo respeta la participacion por actividad", () => {
    const result = calculate([activity([1, 2], [[1, "100.00"]]), activity([2, 3], [[3, "60.00"]])], users);
    assert.deepEqual(result.participantes.map((p) => p.corresponde), ["50.00", "80.00", "30.00"]);
    assert.deepEqual(result.participantes.map((p) => p.balance), ["50.00", "-80.00", "30.00"]);
    invariants(result);
});
test("no hay perdida de precision al sumar miles de importes maximos", () => {
    const result = calculate([activity([1, 2, 3], Array.from({ length: 10000 }, () => [1, "999999999999.99"]))]);
    assert.equal(result.total, "9999999999999900.00"); invariants(result);
});
test("500 repartos deterministas conservan dinero y cancelan todos los balances", () => {
    let seed = 41;
    for (let i = 0; i < 500; i++) {
        seed = (seed * 16807) % 2147483647;
        const expenses = Array.from({ length: seed % 20 }, (_, j) => {
            const amount = BigInt((seed + j * 17) % 99999999 + 1);
            return [j % 3 + 1, `${amount / 100n}.${(amount % 100n).toString().padStart(2, "0")}`];
        });
        const input = [activity([1, 2, 3], expenses)];
        const result = calculate(input);
        invariants(result);
        assert.deepEqual(result, calculate(input));
    }
});
test("datos incoherentes no producen balances silenciosamente incorrectos", () => {
    assert.throws(() => calculate([activity([], [[1, "1.00"]])]));
    assert.throws(() => calculate([activity([1], [[2, "1.00"]])]));
});
