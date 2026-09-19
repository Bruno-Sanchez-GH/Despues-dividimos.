import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import createExpense from "../service/expenses.create.service.js";
import createContributions from "../service/expenses.contributions.service.js";

async function create(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const activityId = Number(req.params.activityId);

    if (!userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }
    try{
        if (req.body && Object.hasOwn(req.body, "aportes")) {
            const expenses = await createContributions(activityId, userId, req.body);
            return res.status(201).json({ message: "Aportes guardados correctamente", newExpenses: expenses.map((e) => ({ ...e, monto: e.monto.toFixed(2) })) });
        }
        const { concepto, monto, pagadorId } = req.body ?? {};
        const newExpense = await createExpense(activityId, userId, concepto, monto, pagadorId);
        return res.status(201).json({
            message: "Gasto creado correctamente",
            newExpense: {
                ...newExpense,
                monto: newExpense.monto.toFixed(2)
            }
        });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        });
    }
}
export default create;
