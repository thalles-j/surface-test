UPDATE "enderecos" SET "bairro" = 'Não informado' WHERE "bairro" IS NULL;
ALTER TABLE "enderecos" ALTER COLUMN "bairro" SET NOT NULL;
