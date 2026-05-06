import axios from 'axios';
import prisma from '../database/prisma.js';

const CEP_ORIGEM = '27330000';

// Prazos estimados por região (dias úteis)
const REGIONAL_DAYS = {
  RJ: '2-3', SP: '2-3', MG: '3-4', ES: '3-4',
  PR: '4-5', SC: '4-5', RS: '4-5',
  DF: '4-5', GO: '4-5', MT: '5-7', MS: '5-7',
  BA: '5-7', SE: '6-8', AL: '6-8', PE: '6-8', PB: '6-8',
  RN: '7-9', CE: '7-9', PI: '7-9', MA: '7-9',
  PA: '7-10', AP: '8-11', AM: '10-15', RR: '10-15',
  AC: '10-15', RO: '8-11', TO: '7-10',
};

async function getAddressFromCep(cep) {
  const cleanCep = String(cep).replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const { data } = await axios.get(
      `https://viacep.com.br/ws/${cleanCep}/json/`,
      { timeout: 5000 }
    );
    if (data.erro) return null;
    return {
      estado: data.uf,
      cidade: data.localidade,
      bairro: data.bairro,
      logradouro: data.logradouro,
    };
  } catch {
    return null;
  }
}

/**
 * Calcula frete com base no CEP de destino.
 * Usa ViaCEP para validar o endereço e aplica frete fixo configurado no admin.
 *
 * @param {string} cepDestino
 * @param {number} subtotalAfterDiscount
 * @returns {Promise<{frete:number, prazo:string, tipo:string, endereco:{estado:string, cidade:string}|null}>}
 */
export async function calculateShipping(cepDestino, subtotalAfterDiscount = 0) {
  const settings = await prisma.configuracoes_loja.findFirst();

  const freteGratisAcima = settings?.frete_gratis_acima
    ? Number(settings.frete_gratis_acima)
    : null;

  if (freteGratisAcima && subtotalAfterDiscount >= freteGratisAcima) {
    return {
      frete: 0,
      prazo: '3-5 dias úteis',
      tipo: 'Grátis',
      endereco: null,
    };
  }

  const address = await getAddressFromCep(cepDestino);

  // Frete fixo do admin ou fallback
  const freteFixo = settings?.frete ? Number(settings.frete) : 20.0;

  if (!address) {
    return {
      frete: freteFixo,
      prazo: '5-10 dias úteis',
      tipo: 'Padrão',
      endereco: null,
    };
  }

  const prazo = REGIONAL_DAYS[address.estado] ?? '5-10';

  return {
    frete: freteFixo,
    prazo: `${prazo} dias úteis`,
    tipo: 'Padrão',
    endereco: {
      estado: address.estado,
      cidade: address.cidade,
      bairro: address.bairro,
      logradouro: address.logradouro,
    },
  };
}
