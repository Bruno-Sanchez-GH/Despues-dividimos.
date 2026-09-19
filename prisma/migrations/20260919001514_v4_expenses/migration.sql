-- CreateTable
CREATE TABLE "gasto" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "pagadorId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gasto_actividadId_idx" ON "gasto"("actividadId");

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_pagadorId_fkey" FOREIGN KEY ("pagadorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
