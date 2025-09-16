/*
  Warnings:

  - You are about to alter the column `preco_unitario` on the `pedido_produtos` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `pedidos` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `preco` on the `produtos` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "public"."pedido_produtos" ALTER COLUMN "preco_unitario" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."pedidos" ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."produtos" ALTER COLUMN "preco" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "public"."fotos_produtos" (
    "id_foto" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "descricao" VARCHAR(255),

    CONSTRAINT "fotos_produtos_pkey" PRIMARY KEY ("id_foto")
);

-- CreateIndex
CREATE INDEX "fotos_produtos_id_produto_idx" ON "public"."fotos_produtos"("id_produto");

-- AddForeignKey
ALTER TABLE "public"."fotos_produtos" ADD CONSTRAINT "fotos_produtos_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "public"."produtos"("id_produto") ON DELETE RESTRICT ON UPDATE CASCADE;
