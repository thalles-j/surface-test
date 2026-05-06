import React from "react";
import { Youtube, ExternalLink, Instagram } from 'lucide-react';
import styles from './style.module.css';

export default function About() {
  return (
    <main className={`${styles.page} ${styles.fadeInSection}`}>
      <div className="px-6 md:px-16 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <p className={styles.tagline}>3 amigos, 1 ideia.</p>
        <h1 className={styles.heroManifesto}>
          Sobre Nós – <br />Surface.
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
        <h3 className={`${styles.valuesHeading} text-center text-gray-400 mb-16`}>Nossos Valores</h3>
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
          <p className="text-xs font-black uppercase tracking-[0.2em] max-w-2xl mx-auto leading-relaxed border border-black p-8 hover:bg-black hover:text-white transition-colors duration-500">
            Na Surface, você encontra mais que roupas: encontra uma marca feita para quem quer se vestir bem, sem abrir mão do estilo e da autenticidade.
          </p>
        </div>
      </div>
      {/* SEÇÃO INSTAGRAM PRINCIPAL / SURFACE OFFICIAL */}
<div className="bg-black text-white py-32 border-b border-zinc-900">
  <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col items-center">
    
    {/* HEADER SECTION */}
    <div className="flex flex-col items-center text-center space-y-8 mb-20 max-w-3xl">
      <Instagram size={40} className="text-white" />
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
        @surface__official
      </h2>
      <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
        O catálogo oficial. A estética purista. Acompanhe os lançamentos definitivos, os conceitos de design e a visão ininterrupta da marca.
      </p>
      
      <a 
        href="https://instagram.com/surface__official" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] border border-white py-4 px-10 hover:bg-white hover:text-black transition-colors duration-500"
      >
        Siga a Visão
      </a>
    </div>

    {/* FEED GRID - 2 POSTS MAIORES (4:3) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
      
      {/* POST 1 */}
      <div className="aspect-[4/5] bg-zinc-950 flex items-center justify-center border border-zinc-900 relative overflow-hidden">
        <iframe
          src="https://www.instagram.com/p/DXMk6h2Gu6e/embed"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          scrolling="no"
          allowTransparency={true}
          allow="encrypted-media"
          title="Surface Official Post 1"
        ></iframe>
      </div>

      {/* POST 2 */}
      <div className="aspect-[4/5] bg-zinc-950 flex items-center justify-center border border-zinc-900 relative overflow-hidden">
        <iframe
          src="https://www.instagram.com/p/DXHYjDEjA9-/embed" 
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          scrolling="no"
          allowTransparency={true}
          allow="encrypted-media"
          title="Surface Official Post 2"
        ></iframe>
      </div>

    </div>
  </div>
</div>
{/* FIM SEÇÃO INSTAGRAM PRINCIPAL */}

     {/* SEÇÃO LIFESTYLE / BASTIDORES */}
<div className="px-6 md:px-16 py-24 max-w-7xl mx-auto">
  <div className="bg-black text-white p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 border border-zinc-900">
    
    {/* TEXTO */}
    <div className="space-y-6 text-center lg:text-left w-full lg:w-2/5">
      <div className="flex items-center justify-center lg:justify-start gap-3">
        <Instagram size={28} />
        <h3 className="text-2xl font-black uppercase tracking-tighter italic">@createbysurface</h3>
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
        O lado cru da marca. Acompanhe nosso lifestyle, o dia a dia nos bastidores da produção e spoilers exclusivos dos próximos drops. Tudo aquilo que não tem filtro vai direto pra lá.
      </p>
      <a 
        href="https://instagram.com/createbysurface" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] border-b border-white pb-1 hover:text-gray-300 transition-colors w-fit mx-auto lg:mx-0"
      >
        Acessar os Bastidores
      </a>
    </div>

    {/* VÍDEOS (Travados em 9:16 para Reels e sem hover) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-3/5">
      
      {/* LIFESTYLE - REELS 1 */}
      <div className="aspect-[9/16] bg-zinc-950 flex items-center justify-center border border-zinc-900 relative overflow-hidden">
        <iframe
          src="https://www.instagram.com/reel/DV7KywnD2Fg/embed"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          scrolling="no"
          allowTransparency={true}
          allow="encrypted-media"
          title="Lifestyle Reels"
        ></iframe>
      </div>

      {/* SPOILER - REELS 2 */}
      <div className="aspect-[9/16] bg-zinc-950 flex items-center justify-center border border-zinc-900 relative overflow-hidden">
        <iframe
          src="https://www.instagram.com/reel/DXhSOH0R3mj/embed"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          scrolling="no"
          allowTransparency={true}
          allow="encrypted-media"
          title="Spoiler Reels"
        ></iframe>
      </div>
      
    </div>
  </div>
</div>
{/* FIM SEÇÃO LIFESTYLE */}
    </main>
  );
}