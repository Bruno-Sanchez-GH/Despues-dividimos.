-- AlterTable
ALTER TABLE "actividad" ADD COLUMN "startAt" TIMESTAMP(3);

-- Las actividades V2 conservan su fecha de creacion como inicio.
-- Prisma guarda createdAt como TIMESTAMP en UTC.
UPDATE "actividad" SET "startAt" = "createdAt";

ALTER TABLE "actividad" ALTER COLUMN "startAt" SET NOT NULL;
