import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
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

        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">Política de <br/>Privacidade.</h1>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-12 italic">Última atualização: 11 de dezembro de 2025</p>

        <div className="space-y-12">
          <div>
            <p className="policy-text">
              A <span className="text-black font-black">SURFACE</span> é responsável por esta loja e site, incluindo todas as informações, conteúdos, funcionalidades, ferramentas, produtos e serviços relacionados, com o objetivo de oferecer a você, cliente, uma experiência de compra personalizada (os “Serviços”).
            </p>
            <p className="policy-text mt-4">
              A <span className="text-black font-black">SURFACE</span> é desenvolvida com tecnologia da Shopify, que nos permite disponibilizar os Serviços para você. Esta Política de privacidade descreve como coletamos, usamos e compartilhamos suas informações pessoais quando você visita, utiliza ou realiza uma compra ou outra transação por meio dos Serviços, ou ainda quando se comunica conosco de qualquer outra forma.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Informações pessoais que coletamos</h2>
            <p className="policy-text">
              Podemos coletar ou processar as seguintes categorias de informações pessoais:
            </p>
            <ul className="mt-6 space-y-6">
              <li className="policy-text">
                <span className="text-black font-black block mb-1">Informações de contato:</span> Incluindo seu nome, endereço, endereço de faturamento, endereço de entrega, telefone e e-mail.
              </li>
              <li className="policy-text">
                <span className="text-black font-black block mb-1">Informações financeiras:</span> Incluindo números de cartão de crédito, informações de contas financeiras e transações.
              </li>
              <li className="policy-text">
                <span className="text-black font-black block mb-1">Informações da conta:</span> Incluindo nome de usuário, senha, perguntas de segurança e preferências.
              </li>
              <li className="policy-text">
                <span className="text-black font-black block mb-1">Informações de dispositivo:</span> Incluindo informações sobre dispositivo, navegador, rede, endereço de IP e identificadores únicos.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="policy-heading">Como usamos suas informações</h2>
            <div className="space-y-6">
              <p className="policy-text">
                <span className="text-black font-black block mb-1">Fornecer e Personalizar os Serviços:</span> Usamos seus dados para processar pagamentos, pedidos, gerenciar sua conta e facilitar trocas.
              </p>
              <p className="policy-text">
                <span className="text-black font-black block mb-1">Marketing e Publicidade:</span> Envio de comunicações promocionais e exibição de anúncios online baseados no seu comportamento de compra.
              </p>
              <p className="policy-text">
                <span className="text-black font-black block mb-1">Segurança e Prevenção contra Fraudes:</span> Autenticação de conta e monitoramento de possíveis atividades mal-intencionadas.
              </p>
            </div>
          </div>

          <div>
            <h2 className="policy-heading">Como compartilhamos informações</h2>
            <p className="policy-text">
              Compartilhamos informações com a <span className="text-black font-black">Shopify</span> e outros parceiros (TI, pagamentos, frete) para viabilizar os Serviços. Seus dados também podem ser compartilhados por razões jurídicas para cumprir a legislação aplicável.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Seus Direitos e Escolhas</h2>
            <p className="policy-text">
              Dependendo da sua localização, você pode ter o direito de solicitar acesso, exclusão ou correção das informações pessoais que mantemos. Você pode exercer esses direitos entrando em contato conosco via <span className="text-black font-black">atendimento@surface.co</span>.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Segurança e Retenção</h2>
            <p className="policy-text">
              Embora adotemos medidas de segurança adequadas para proteger suas informações pessoais, nenhum sistema é completamente infalível. Recomendamos que você evite enviar informações sensíveis por meios não seguros. Retemos suas informações enquanto for necessário para fornecer os Serviços ou cumprir obrigações legais.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
