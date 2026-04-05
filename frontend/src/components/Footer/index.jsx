import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram } from 'lucide-react';
import logoWhite from '../../assets/logotipoWhite.png';

export default function Footer() {
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const termsRef = useRef(null);

    useEffect(() => {
        function handleDocClick(e) {
            if (!termsRef.current) return;
            if (isTermsOpen && !termsRef.current.contains(e.target)) setIsTermsOpen(false);
        }
        function handleEsc(e) {
            if (e.key === 'Escape') setIsTermsOpen(false);
        }
        document.addEventListener('mousedown', handleDocClick);
        document.addEventListener('touchstart', handleDocClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleDocClick);
            document.removeEventListener('touchstart', handleDocClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isTermsOpen]);

    return (
        <footer className="bg-black text-white px-6 md:px-16 py-20 ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 max-w-7xl mx-auto">

                {/* Newsletter Section */}
                <div className="space-y-10">
                    <div className="flex flex-col gap-2">
                        <ul className="flex flex-col gap-2">
                            <li>
                                <Link to="/atendimento" className="text-[11px] font-black uppercase tracking-widest hover:opacity-50 transition-opacity">
                                    Atendimento
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <p className="text-[13px] font-black uppercase tracking-[0.2em]">Newsletter</p>
                        <form className="relative flex items-center border-b border-white/20 pb-3 focus-within:border-white transition-colors group">
                            <input
                                type="email"
                                placeholder="E-mail"
                                required
                                className="bg-transparent w-full text-xs outline-none uppercase font-black placeholder:text-white/20"
                            />
                            <button type="submit" className="group-hover:translate-x-1 transition-transform" aria-label="enviar">
                                <ArrowRight size={22} strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Logo + Social Section */}
                <div className="flex flex-col items-center justify-center space-y-10">
                    <div className="cursor-pointer group">
                        <a href="/">
                            <img src={logoWhite} alt="logotipo branca" className="w-20 h-auto" />
                        </a>
                    </div>
                    <div className="flex gap-10">
                        <a href="https://www.instagram.com/surface__official/" target="_blank" rel="noreferrer" className="hover:opacity-50 transition-all hover:-translate-y-1">
                            <Instagram size={22} strokeWidth={2} />
                        </a>
                        <a href="https://x.com/surface__gang" target="_blank" rel="noreferrer" className="hover:opacity-50 transition-all hover:-translate-y-1">
                            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-current">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Atendimento / Address Section */}
                <div className="text-[11px] font-bold space-y-8 uppercase tracking-[0.15em] md:text-right leading-relaxed">
                    <div className="space-y-1">
                        <p>Rua Zé Fulasca, 009</p>
                        <p>Volta Redonda - RJ</p>
                        <p className="font-black text-[13px] mt-2 mb-1">SURFACE STORE</p>
                        <p>27208-097</p>
                    </div>
                    <div className="space-y-1">
                        <p className="opacity-40 italic lowercase font-normal">Horário de Atendimento</p>
                        <p>Terça - Sábado</p>
                        <p>11h - 20h</p>
                    </div>
                </div>
            </div>

            {/* Footer Bottom - Com Menu Popover de Termos */}
            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 relative">

                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 text-center md:text-left leading-relaxed">
                    Surface © 2026 - Todos os direitos reservados.
                </div>

                {/* TRIGGER PARA TERMOS E POLÍTICAS */}
                <div className="relative group" ref={termsRef}>
                    {/* Popover Menu (Exatamente como na imagem) */}
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-64 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 transition-all duration-300 origin-bottom ${isTermsOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                        <ul className="flex flex-col gap-5 text-left">
                            {[
                                { label: 'Política de Privacidade', to: '/privacidade' },
                                { label: 'Trocas e Devoluções', to: '/trocas-devolucoes' },
                                { label: 'Contato', to: '/atendimento' },
                                { label: 'Termos de Uso', to: '/termos-de-uso' }
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link to={item.to} onClick={() => setIsTermsOpen(false)} className="text-[11px] font-black uppercase tracking-tight text-black hover:opacity-40 transition-opacity">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => setIsTermsOpen(!isTermsOpen)}
                        className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors hover:text-white ${isTermsOpen ? 'text-white' : 'text-white/40'}`}>
                        Termos e Políticas
                    </button>
                </div>

                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                    Volta Redonda - RJ.
                </div>
            </div>
        </footer>
    );
}
