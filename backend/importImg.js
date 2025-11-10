import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const pasta = "./uploads"; // pasta onde estão suas imagens

async function main() {
    const arquivos = fs.readdirSync(pasta);

    for (const arquivo of arquivos) {
        const nomeArquivo = arquivo.toLowerCase();

        let produtoNome = null;

        // Define a qual produto a imagem pertence
        if (nomeArquivo.includes("offwhite")) {
            produtoNome = "T-Shirt DROP 0 SURFACE - OFF WHITE";
        } else if (nomeArquivo.includes("black")) {
            produtoNome = "T-Shirt DROP 0 SURFACE - BLACK";
        }

        if (!produtoNome) {
            console.log(`Não foi possível identificar produto para: ${arquivo}`);
            continue;
        }

        // Procura o produto pelo nome exato
        const produto = await prisma.produtos.findUnique({
            where: { nome_produto: produtoNome },
        });

        if (produto) {
            await prisma.fotos_produtos.create({
                data: {
                    url: `/uploads/${arquivo}`, // caminho relativo que você vai usar no front
                    id_produto: produto.id_produto,
                },
            });
            console.log(`Imagem ${arquivo} vinculada ao produto ${produto.nome_produto}`);
        } else {
            console.log(`Produto não encontrado para: ${produtoNome}`);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
