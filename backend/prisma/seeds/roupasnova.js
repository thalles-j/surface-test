import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const produtosData = [
    {
      nome_produto: "Favela e Uzi",
      descricao: "Camiseta com estampa Favela e Uzi",
      preco: 149.90,
      id_categoria: 1,
      tipo: "camiseta",
      destaque: true,
      tags: "street,urban,favela",
      fotos: {
        create: [
          { url: "uploads/1766196297062-favela_e_uzi_back.png" },
          { url: "uploads/1766196297066-favela_e_uzi_front.png" },
        ],
      },
    },
    {
      nome_produto: "Macaco com Airmax",
      descricao: "Camiseta com estampa Macaco e tênis Airmax",
      preco: 159.90,
      id_categoria: 1,
      tipo: "camiseta",
      destaque: false,
      tags: "street,fun",
      fotos: {
        create: [
          { url: "uploads/t-shirt_macaco_com_airmax_back.png" },
          { url: "uploads/t-shirt_macaco_com_airmax_front.png" },
        ],
      },
    },
    {
      nome_produto: "Volta Para Mim",
      descricao: "Camiseta com estampa Volta Para Mim",
      preco: 299.90,
      id_categoria: 1,
      tipo: "camiseta",
      destaque: true,
      tags: "romance,street",
      fotos: {
        create: [
          { url: "uploads/VOLTA_PARA_MIM_COSTAS.png" },
          { url: "uploads/VOLTA_PARA_MIM_FRENTE.png" },
        ],
      },
    },
  ];

  for (const produto of produtosData) {
    await prisma.produtos.create({
      data: produto,
    });
  }

  console.log("Seed finalizado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });