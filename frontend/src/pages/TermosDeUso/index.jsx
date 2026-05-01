import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';

export default function TermosUso() {
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
        
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-10">Termos de <br/>Uso.</h1>

        <div className="space-y-12">
          <div>
            <h2 className="policy-heading">Termos e Condições Gerais</h2>
            <p className="policy-text">
              A utilização deste site está condicionada à aceitação e ao cumprimento das regras de utilização aqui descritas. Estas regras têm como objetivo garantir uma experiência segura, justa e agradável para todos os usuários. Ao navegar e utilizar nossos serviços, você automaticamente concorda em respeitar e aderir a estas diretrizes. Caso não concorde com qualquer parte destes termos, recomendamos que não utilize este site.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Política de Privacidade</h2>
            <p className="policy-text">
              Priorizamos a privacidade e a segurança durante todo o processo de navegação e compra pelo site. Todos os dados cadastrados (nome, endereço, CPF) nunca serão comercializados ou trocados. Utilizamos cookies e informações de sua navegação com o objetivo de traçar um perfil do público que visita o site e podermos aperfeiçoar nossos serviços, produtos e conteúdos, conforme a Lei Geral de Proteção de Dados.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Política de Pagamentos</h2>
            <p className="policy-text">
              A <span className="text-black font-black">Surface®</span> oferece opções seguras para o seu pagamento:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="policy-text">• <span className="text-black font-black">WHATSAPP:</span> Pagamento à vista com confirmação via atendimento.</li>
            </ul>
            <p className="policy-text mt-4">
              O envio dos produtos é realizado somente após a confirmação do pagamento. Em casos de suspeita de fraude, a Surface® poderá cancelar o pedido e reembolsar o valor pago.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Propriedade Intelectual</h2>
            <p className="policy-text">
              Todo o conteúdo presente no site, incluindo textos, imagens, gráficos, logotipos e software, é de propriedade exclusiva da Surface ou de seus licenciadores. É proibida a reprodução, distribuição ou qualquer outra utilização indevida sem a devida autorização prévia e por escrito. Nos reservamos o direito de tomar todas as medidas legais para proteger nossos direitos.
            </p>
          </div>

          <div>
            <h2 className="policy-heading">Disposições Gerais</h2>
            <p className="policy-text">
              Estas regras constituem o acordo completo entre você e o site. Se você tiver alguma dúvida sobre estas regras de utilização, entre em contato conosco através do e-mail <span className="text-black font-black">atendimento@surface.co</span>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
