import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';

export default function TrocasDevolucoes() {
  const navigate = useNavigate();

  return (
    <main className={`${styles.page} ${styles.fadeInSection}`}>
      <section className="max-w-4xl mx-auto px-6 py-20">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-12 hover:opacity-50 transition-opacity"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-10">Trocas e <br/>Devoluções.</h1>

        <div className="space-y-8">
          <p className="policy-text">
            Com o objetivo de garantir a sua total satisfação, a <span className="text-black font-black">Surface®</span> adota uma Política de Trocas, Devoluções e Reembolsos em conformidade com o Código de Defesa do Consumidor.
          </p>
          
          <p className="policy-text">
            Nosso compromisso é oferecer um atendimento rápido e eficiente, sempre buscando soluções que atendam às suas necessidades. Para solicitações de trocas, devoluções ou reembolsos <a href="/atendimento" className="text-black underline">clique aqui</a>. Para mais informações entre em contato pelo e-mail: <span className="text-black font-black">atendimento@surface.co</span>.
          </p>

          <div>
            <h2 className="policy-heading">Entrega</h2>
            <p className="policy-text">
              A política de entrega estabelece um compromisso sólido com a satisfação de nossos clientes. Nosso prazo padrão de entrega é de 5 (cinco) dias úteis a partir da confirmação do pedido. Essa política foi criada para garantir que os produtos que você selecionou cheguem de forma rápida e confiável.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Trocas</h2>
            <ul className="space-y-4 list-none">
              {[
                "O prazo para solicitar a troca é de até 7 (sete) dias corridos após o recebimento da mercadoria. As trocas são por conta do cliente, desde a primeira solicitação.",
                "As trocas estão sujeitas à disponibilidade de produtos em nosso site. Em caso de diferença de valores, o pagamento da diferença é de responsabilidade do cliente.",
                "O produto deve estar em perfeito estado, sem sinais de uso ou lavagem, com a etiqueta original intacta e fixada à peça.",
                "Produtos comprados em promoção não poderão ser trocados, exceto em casos de defeito."
              ].map((txt, i) => (
                <li key={i} className="policy-text flex gap-4">
                  <span className="text-black">•</span> {txt}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="policy-heading">Devoluções</h2>
            <div className="space-y-4">
              <p className="policy-text">
                <span className="text-black font-black">Por arrependimento:</span> O cliente pode solicitar a devolução em até 7 (sete) dias corridos após o recebimento do pedido. É possível optar pelo reembolso ou pela troca por outro produto.
              </p>
              <p className="policy-text">
                <span className="text-black font-black">Por defeito:</span> Solicitações podem ser feitas em até 10 (dez) dias corridos após o recebimento. Após análise do produto, se o defeito for confirmado e não houver possibilidade de reparo, o cliente poderá trocá-lo por outro igual ou escolher outro modelo.
              </p>
            </div>
          </div>

          <div>
            <h2 className="policy-heading">Reembolso</h2>
            <p className="policy-text mb-4">
              O reembolso pode ser solicitado em até 7 (sete) dias corridos após o recebimento. O valor será restituído em até 10 (dez) dias úteis após a aprovação da análise.
            </p>
            <div className="bg-gray-50 p-6 space-y-2">
              <p className="policy-text text-[10px]"><span className="text-black font-black">PIX:</span> Crédito em até 24 horas.</p>
              <p className="policy-text text-[10px]"><span className="text-black font-black">CARTÃO DE CRÉDITO:</span> Em até 2 faturas, conforme prazos da operadora.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
