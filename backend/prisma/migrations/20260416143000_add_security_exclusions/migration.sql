CREATE TABLE "exclusoes_seguranca" (
    "id_exclusao" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "escopo_ml" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exclusoes_seguranca_pkey" PRIMARY KEY ("id_exclusao")
);

CREATE UNIQUE INDEX "exclusoes_seguranca_tipo_valor_key" ON "exclusoes_seguranca"("tipo", "valor");
CREATE INDEX "exclusoes_seguranca_tipo_ativo_idx" ON "exclusoes_seguranca"("tipo", "ativo");
