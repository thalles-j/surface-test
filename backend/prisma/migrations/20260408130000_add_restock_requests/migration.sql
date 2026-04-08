-- CreateTable
CREATE TABLE "public"."restock_requests" (
    "id" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "variacao" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restock_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restock_requests_id_produto_variacao_email_key"
ON "public"."restock_requests"("id_produto", "variacao", "email");

-- CreateIndex
CREATE INDEX "restock_requests_id_produto_idx" ON "public"."restock_requests"("id_produto");

-- CreateIndex
CREATE INDEX "restock_requests_created_at_idx" ON "public"."restock_requests"("created_at");

-- AddForeignKey
ALTER TABLE "public"."restock_requests"
ADD CONSTRAINT "restock_requests_id_produto_fkey"
FOREIGN KEY ("id_produto")
REFERENCES "public"."produtos"("id_produto")
ON DELETE CASCADE
ON UPDATE CASCADE;
