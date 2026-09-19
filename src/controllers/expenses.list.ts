import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import listExpenses from "../service/expenses.list.service.js";

async function list(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const activityId = Number(req.params.activityId);

    if (!userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }
    try{
        const expenses = await listExpenses(activityId, userId);
        return res.status(200).json({
            message: "Gastos obtenidos correctamente",
            expenses: expenses.map((expense) => ({
                ...expense,
                monto: expense.monto.toFixed(2)
            }))
        });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        });
    }
}
export default list;
