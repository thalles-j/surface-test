-- AlterTable: add principal column to enderecos
ALTER TABLE "enderecos" ADD COLUMN "principal" BOOLEAN NOT NULL DEFAULT false;

-- Set the first address of each user as principal
UPDATE "enderecos" e
SET principal = true
FROM (
  SELECT MIN(id_endereco) as id_endereco
  FROM "enderecos"
  GROUP BY id_usuario
) first_addr
WHERE e.id_endereco = first_addr.id_endereco;