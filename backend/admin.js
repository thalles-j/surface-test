import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÕES ---
const API_URL = 'http://localhost:5000/api';

// Use as credenciais do seu Admin (que tem role: 1)
const ADMIN_EMAIL = 'admin@admin.com'; 
const ADMIN_PASS = '12345678';        

// Arquivos de imagem (Devem estar na pasta 'backend' junto com este script)
const FILE_FRONT = 'uploads/macaco_com_airmax_front.png'; 
const FILE_BACK = 'uploads/macaco_com_airmax_front.png';

// Configuração de diretórios do Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedProduct() {
  try {
    console.log('🚀 [1/3] Iniciando autenticação do Admin...');

    // 1. LOGIN (Apenas para pegar a permissão)
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      senha: ADMIN_PASS
    });

    const token = loginRes.data.token;
    console.log('✅ Admin autenticado. Token de permissão recebido.');

    // Cabeçalho com o Token (Crachá de Admin)
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. UPLOAD DE IMAGENS
    console.log('📸 [2/3] Enviando imagens para o servidor...');
    
    const pathFront = path.join(__dirname, FILE_FRONT);
    const pathBack = path.join(__dirname, FILE_BACK);

    // Verifica se as imagens existem antes de tentar enviar
    if (!fs.existsSync(pathFront) || !fs.existsSync(pathBack)) {
      throw new Error(`❌ ERRO: Coloque as imagens "${FILE_FRONT}" e "${FILE_BACK}" dentro da pasta backend!`);
    }

    const form = new FormData();
    form.append('photos', fs.createReadStream(pathFront));
    form.append('photos', fs.createReadStream(pathBack));

    const uploadRes = await axios.post(`${API_URL}/upload`, form, {
      headers: {
        ...authHeaders.headers,
        ...form.getHeaders() // Headers específicos para envio de arquivo
      }
    });

    const uploadedPhotos = uploadRes.data; 
    console.log('✅ Imagens salvas no servidor:', uploadedPhotos);

    // 3. CRIAR O PRODUTO (CATÁLOGO)
    console.log('👕 [3/3] Cadastrando produto no catálogo...');

    const novoProduto = {
      nome_produto: "T-Shirt Macaco Airmax Ed. Limitada",
      descricao: "Camiseta exclusiva da coleção Street Wild. Estampa de alta qualidade.",
      preco: 149.90,
      id_categoria: 1, // ID da categoria "Camisetas" no seu banco
      tipo: "Camiseta",
      
      // Variações de estoque (Inventário)
      variacoes_estoque: [
        { tamanho: "P",  sku: "AIRMAX-MKEY-P",  estoque: 10, preco: 149.90 },
        { tamanho: "M",  sku: "AIRMAX-MKEY-M",  estoque: 25, preco: 149.90 },
        { tamanho: "G",  sku: "AIRMAX-MKEY-G",  estoque: 15, preco: 149.90 },
        { tamanho: "GG", sku: "AIRMAX-MKEY-GG", estoque: 5,  preco: 149.90 }
      ],

      // Vincula as fotos que subimos ao produto
      fotos: uploadedPhotos
    };

    // Envia para a rota de PRODUTOS (Isso não gera pedido, apenas item de loja)
    const productRes = await axios.post(`${API_URL}/products`, novoProduto, authHeaders);

    console.log('🎉 SUCESSO! Produto disponível na loja.');
    console.log('🆔 ID do Produto:', productRes.data.id_produto || productRes.data.id);

  } catch (error) {
    console.error('❌ Falha no processo:');
    if (error.response) {
      console.error(`Erro ${error.response.status}:`, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

seedProduct();