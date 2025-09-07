import React from "react";


export default function Hero() {
  return (
    <section
  className="bg-color-black  w-full h-screen bg-cover bg-center flex items-start justify-center"
  style={{ backgroundImage: "url(/img/background2000.png)" }} // caminho direto
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
