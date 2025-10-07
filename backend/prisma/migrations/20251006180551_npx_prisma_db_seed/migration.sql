/*
  Warnings:

  - You are about to drop the column `estoque` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the `VariacaoProduto` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sku_variacao` to the `pedido_produtos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."VariacaoProduto" DROP CONSTRAINT "VariacaoProduto_id_produto_fkey";

-- AlterTable
ALTER TABLE "pedido_produtos" ADD COLUMN     "sku_variacao" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "produtos" DROP COLUMN "estoque",
ADD COLUMN     "variacoes_estoque" JSONB;

-- DropTable
DROP TABLE "public"."VariacaoProduto";
