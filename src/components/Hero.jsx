import React from "react";

export default function Hero() {
  return (
    <section
      className="w-full h-screen bg-cover bg-center flex items-start justify-center"
      style={{ backgroundImage: "url('https://picsum.photos/1920/1080')" }}
    >
      <div className="text-center mt-[25vh]">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          Bem-vindo à nossa Loja
        </h1>
        <p className="text-white text-lg mt-4 drop-shadow">
          Onde estilo e exclusividade se encontram.
        </p>
      </div>
    </section>
  );
}
