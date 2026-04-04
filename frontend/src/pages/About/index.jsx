import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Sobre Nós</h1>
      <p className="mb-4">
        A Surface Store nasceu do desejo de oferecer produtos autorais com
        atenção ao design, qualidade e atendimento dedicado. Trabalhamos com
        coleções pensadas para quem busca estilo e conforto.
      </p>
      <p className="mb-4">
        Nossa equipe seleciona cuidadosamente cada produto e está sempre
        disponível para ajudar. Se quiser conhecer nossas coleções, visite a
        loja ou entre em contato.
      </p>
      <Link to="/" className="text-primary underline">Voltar à Home</Link>
    </div>
  );
}
