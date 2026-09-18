-- CreateTable
CREATE TABLE "actividad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "creadorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participante" (
    "usuarioId" INTEGER NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participante_pkey" PRIMARY KEY ("usuarioId","actividadId")
);

-- CreateIndex
CREATE INDEX "actividad_grupoId_idx" ON "actividad"("grupoId");

-- CreateIndex
CREATE INDEX "participante_actividadId_idx" ON "participante"("actividadId");

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participante" ADD CONSTRAINT "participante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participante" ADD CONSTRAINT "participante_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
