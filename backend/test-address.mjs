import { updateMeController } from './src/controllers/profileController.js';
import prisma from './src/database/prisma.js';
import bcrypt from 'bcryptjs';

async function test() {
  // Cria usuário de teste
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
  }

  console.log('Usuario ID:', user.id_usuario);

  // Mock req/res/next
  const req = {
    user: { id: user.id_usuario },
    body: {
      nome: 'Teste Endereco Atualizado',
      telefone: '24988888888',
      enderecos: [
        {
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: 'Apto 1',
          bairro: 'Centro',
          cidade: 'Volta Redonda',
          estado: 'RJ',
          cep: '27200-000',
        },
        {
          logradouro: 'Av Brasil',
          numero: '456',
          complemento: '',
          bairro: 'Vila Santa Cecilia',
          cidade: 'Volta Redonda',
          estado: 'RJ',
          cep: '27260-000',
        },
      ],
    },
  };

  const res = {
    statusCode: 200,
    json(data) {
      console.log('RES JSON:', JSON.stringify(data, null, 2));
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
  };

  const next = (err) => {
    console.error('NEXT ERROR:', err?.message || err);
  };

  await updateMeController(req, res, next);

  // Verifica se endereços foram salvos
  const userWithAddr = await prisma.usuarios.findUnique({
    where: { id_usuario: user.id_usuario },
    include: { enderecos: true },
  });

  console.log('\nEnderecos salvos:', userWithAddr.enderecos.length);
  userWithAddr.enderecos.forEach((e, i) => {
    console.log(`  [${i + 1}] ${e.logradouro}, ${e.numero} — ${e.cidade}/${e.estado} (CEP: ${e.cep})`);
  });

  // Testa GET /conta light
  const { getMeController } = await import('./src/controllers/profileController.js');
  const reqLight = { user: { id: user.id_usuario }, query: { light: 'true' } };
  const resLight = {
    json(data) {
      console.log('\nGET /conta?light=true:');
      console.log(JSON.stringify(data, null, 2));
    },
  };
  await getMeController(reqLight, resLight, next);

  await prisma.$disconnect();
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
