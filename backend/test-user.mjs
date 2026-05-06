import prisma from './src/database/prisma.js';
import bcrypt from 'bcryptjs';

async function test() {
  // Cria usuário de teste se não existir
  let user = await prisma.usuarios.findUnique({ where: { email: 'teste_endereco@surface.com' } });
  if (!user) {
    const hashed = await bcrypt.hash('teste123', 10);
    user = await prisma.usuarios.create({
      data: {
        nome: 'Teste Endereco',
        email: 'teste_endereco@surface.com',
        senha: hashed,
        telefone: '24999999999',
        id_role: 2,
      },
    });
    console.log('Usuario criado:', user.id_usuario);
  } else {
    console.log('Usuario existente:', user.id_usuario);
  }

  // Testa login
  const isValid = await bcrypt.compare('teste123', user.senha);
  console.log('Senha valida:', isValid);

  await prisma.$disconnect();
}

test().catch(console.error);
