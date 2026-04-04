import React from "react";
import { Youtube, ExternalLink } from 'lucide-react';
import styles from './style.module.css';

export default function About() {
  return (
    <main className={`${styles.page} ${styles.fadeInSection}`}>
      <div className="px-6 md:px-16 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <p className={styles.tagline}>3 amigos, 1 ideia.</p>
        <h1 className={styles.heroManifesto}>
          Sobre Nós – <br/>Surface.
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left mt-20">
          <div className="space-y-6">
            <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
              Fundada em Volta Redonda, a Surface nasceu de 3 amigos e 1 ideia. Tudo começou quando percebemos que, para se vestir bem, era preciso gastar demais. O streetwear foi tomado pelo capitalismo: peças simples sendo vendidas por preços absurdos.
            </p>
            <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
              A história era sempre a mesma — você quer montar um fit maneiro, mas só a camiseta já custa uma fortuna. Foi dessa indignação que nasceu a Surface: para mostrar que estilo não precisa custar caro.
            </p>
          </div>

          <div className="space-y-6 text-gray-400">
            <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
              Pra gente, ser autêntico vai muito além da etiqueta. Nossa proposta é clara: roupas de qualidade, com design original e preço acessível. Acreditamos que a moda é muito mais do que vestir.
            </p>
            <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
              Queremos estar ao seu lado, valorizando sua autenticidade, respeitando seu bolso e mostrando que cada detalhe importa. Na Surface, você encontra uma marca feita para quem busca se vestir bem.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.videoPlaceholder}>
        <span className={styles.videoGhost}>3 FRIENDS 1 IDEA</span>
        <div className={styles.videoOverlay}>
          <div className={styles.videoPlay}>
            <Youtube size={48} strokeWidth={1} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ver Nossa História</span>
          </div>
        </div>
      </div>

      <div className={`${styles.valuesSection} px-6 md:px-16 py-32 border-t border-gray-100 max-w-7xl mx-auto`}>
        <h3 className={`${styles.valuesHeading} text-center text-gray-400`}>Nossos Valores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { n: '01', t: 'Qualidade', d: 'Qualidade em cada peça produzida, garantindo durabilidade e conforto em todos os drops.' },
            { n: '02', t: 'Criatividade', d: 'Originalidade no design para quem quer se destacar sem depender de tendências passageiras.' },
            { n: '03', t: 'Respeito', d: 'Proximidade com nossos clientes, respeitando o seu bolso e sua necessidade de expressão.' }
          ].map((val, i) => (
            <div key={i} className="space-y-4 text-center md:text-left">
               <h4 className="text-xl font-black uppercase tracking-tighter italic">{val.n}. {val.t}</h4>
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{val.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] max-w-2xl mx-auto leading-relaxed border border-black p-8">
            Na Surface, você encontra mais que roupas: encontra uma marca feita para quem quer se vestir bem, sem abrir mão do estilo e da autenticidade.
          </p>
        </div>
      </div>
    </main>
  );
}
