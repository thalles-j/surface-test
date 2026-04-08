-- AlterTable
ALTER TABLE "public"."pedidos"
ALTER COLUMN "id_usuario" DROP NOT NULL,
ADD COLUMN "cliente_nome" TEXT,
ADD COLUMN "cliente_email" TEXT,
ADD COLUMN "venda_presencial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "endereco_entrega" JSONB;

-- AlterTable
ALTER TABLE "public"."restock_requests"
ADD COLUMN "id_usuario" INTEGER;

-- DropIndex
DROP INDEX IF EXISTS "restock_requests_id_produto_variacao_email_key";

-- CreateIndex
CREATE INDEX "restock_requests_id_usuario_idx" ON "public"."restock_requests"("id_usuario");

-- AddForeignKey
ALTER TABLE "public"."restock_requests"
ADD CONSTRAINT "restock_requests_id_usuario_fkey"
FOREIGN KEY ("id_usuario")
REFERENCES "public"."usuarios"("id_usuario")
ON DELETE SET NULL
ON UPDATE CASCADE;
