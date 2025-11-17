// createAdmin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const plainPassword = '12345678';

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  try {
    const adminUser = await prisma.usuarios.upsert({
      where: { email: email },
      update: {
        id_role: 1,
        senha: hashedPassword,
      },
      create: {
        nome: 'Administrador',
        email: email,
        senha: hashedPassword,
        telefone: '00000000000',
        id_role: 1,
      },
    });

    console.log('Usuário admin criado/atualizado com sucesso:');
    console.log(adminUser);
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
