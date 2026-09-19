export type User = { id: number; nombre: string; email?: string };
export type Group = { id: number; nombre: string; createdAt: string; miembros?: User[]; _count?: { membresias: number } };
export type Activity = { id: number; nombre: string; grupoId: number; startAt: string; createdAt: string; participantes: { usuario: User }[]; grupo?: Group; creador?: User };
export type Expense = { id: number; actividadId: number; concepto: string; monto: string; pagador: User; createdAt: string };
export type Balance = { total: string; cantidadGastos: number; participantes: { usuario: User; pagado: string; corresponde: string; balance: string }[]; transferencias: { de: User; hacia: User; monto: string }[] };
export type Invitation = { id: number; grupo: Group; Invitador: User; createdAt: string };
