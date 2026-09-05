/*
  Warnings:

  - A unique constraint covering the columns `[invitacionId]` on the table `membresia` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "membresia_invitacionId_key" ON "membresia"("invitacionId");
