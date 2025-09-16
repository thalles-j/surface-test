-- CreateTable
CREATE TABLE "public"."roles" (
    "id_role" SERIAL NOT NULL,
    "nome_role" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_role" INTEGER NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."enderecos" (
    "id_endereco" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nome_categoria" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "public"."produtos" (
    "id_produto" SERIAL NOT NULL,
    "nome_produto" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(65,30) NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id_produto")
);

-- CreateTable
CREATE TABLE "public"."pedidos" (
    "id_pedido" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "public"."pedido_produtos" (
    "id_pedido" INTEGER NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "pedido_produtos_pkey" PRIMARY KEY ("id_pedido","id_produto")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "public"."roles"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enderecos" ADD CONSTRAINT "enderecos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos" ADD CONSTRAINT "produtos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedidos" ADD CONSTRAINT "pedidos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_produtos" ADD CONSTRAINT "pedido_produtos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido_produtos" ADD CONSTRAINT "pedido_produtos_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "public"."produtos"("id_produto") ON DELETE RESTRICT ON UPDATE CASCADE;
