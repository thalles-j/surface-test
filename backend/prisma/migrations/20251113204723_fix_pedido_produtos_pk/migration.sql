/*
  Warnings:

  - The primary key for the `pedido_produtos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[nome_produto]` on the table `produtos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."pedido_produtos" DROP CONSTRAINT "pedido_produtos_pkey",
ADD COLUMN     "id_item" SERIAL NOT NULL,
ADD CONSTRAINT "pedido_produtos_pkey" PRIMARY KEY ("id_item");

-- CreateIndex
CREATE INDEX "pedido_produtos_id_pedido_idx" ON "public"."pedido_produtos"("id_pedido");

-- CreateIndex
CREATE INDEX "pedido_produtos_id_produto_idx" ON "public"."pedido_produtos"("id_produto");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_nome_produto_key" ON "public"."produtos"("nome_produto");
