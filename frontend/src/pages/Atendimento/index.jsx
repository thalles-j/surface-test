import React, { useState } from "react";
import { Info, Truck, RotateCcw, ShieldCheck, Mail, ArrowRight, MessageCircle, ChevronDown, ExternalLink } from 'lucide-react';
import styles from './style.module.css';

const AccordionItem = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.accordionItem}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.accordionButton}>
        <span className={styles.accordionTitle}>{title}</span>
        <ChevronDown size={16} className={isOpen ? styles.rotate : ''} />
      </button>
      {isOpen && (
        <div className={styles.accordionContent}>{content}</div>
      )}
    </div>
  );
};

export default function Atendimento() {
  return (
    <main className={`${styles.page} ${styles.fadeInSection}`}>
      <div className="px-6 md:px-16 pt-20 pb-20 border-b border-gray-50">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">Atendimento ao <br/>Cliente.</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Como podemos ajudar a sua experiência?</p>
      </div>

      <div className="px-6 md:px-16 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-12">
          <div>
            <h3 className="text-brand-nav tracking-widest mb-8 flex items-center gap-2"><Info size={16} /> Perguntas Frequentes</h3>
            <div className="space-y-2">
              <AccordionItem title="Qual o prazo de entrega?" content="O prazo varia de acordo com a sua região. Geralmente entre 5 a 12 dias úteis." />
              <AccordionItem title="Como funciona a troca de Drops?" content="Drops limitados podem não ter reposição imediata para troca de tamanho." />
              <AccordionItem title="Quais as formas de pagamento?" content="Aceitamos PIX, Cartão de Crédito e Boleto Bancário." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Truck, label: 'Rastreio' },
              { icon: RotateCcw, label: 'Devoluções' },
              { icon: ShieldCheck, label: 'Garantia' }
            ].map((item, i) => (
              <div key={i} className="p-6 border border-gray-100 rounded-sm hover:border-black transition-colors cursor-pointer group">
                <item.icon className="mb-4 group-hover:scale-110 transition-transform" size={20} />
                <h5 className="text-[10px] font-black uppercase tracking-widest">{item.label}</h5>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Acompanhe a Surface</h3>
            <div className="flex flex-wrap gap-4">
              {['Instagram', 'YouTube'].map((social, i) => (
                <a key={i} href="#" className="flex-1 min-w-[140px] p-4 bg-zinc-50 border border-transparent hover:border-black transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    {social === 'Instagram' ? <svg className="w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="14" /></svg>}
                    <span className="text-[10px] font-black uppercase">{social}</span>
                  </div>
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-gray-50 p-8 md:p-12 rounded-sm space-y-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">Envie uma <br/>mensagem</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Seu Nome</label>
                <input type="text" className={styles.surfaceInput} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Seu E-mail</label>
                <input type="email" className={styles.surfaceInput} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Mensagem</label>
                <textarea className={`${styles.surfaceInput} h-32 resize-none`}></textarea>
              </div>
              <button className="w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-xl">
                Enviar agora <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="pt-8 border-t border-gray-200 flex flex-col gap-4">
              <a href="#" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest nav-link">
                <MessageCircle size={18} /> WhatsApp Direct
              </a>
              <a href="mailto:support@surface.co" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest nav-link">
                <Mail size={18} /> support@surface.co
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
