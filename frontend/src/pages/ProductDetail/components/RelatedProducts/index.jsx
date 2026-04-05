import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './style.module.css';
import { resolveImageUrl, handleImgError } from '../../../../utils/resolveImageUrl';

// Card com hover para trocar para a segunda imagem (mesmo comportamento da página Shop)
function RelatedProductCard({ produto, createSlug }) {
  const [isHovered, setIsHovered] = useState(false);

  // Ordena as fotos para que a "front" seja a primeira
  const sortedFotos = produto.fotos ? [...produto.fotos].sort((a, b) => {
      const isFrontA = /front\.[a-zA-Z0-9]+$/i.test(a.descricao || "") || /front\.[a-zA-Z0-9]+$/i.test(a.url || "") || (a.descricao || "").toLowerCase().includes('front') || (a.url || "").toLowerCase().includes('front');
      const isFrontB = /front\.[a-zA-Z0-9]+$/i.test(b.descricao || "") || /front\.[a-zA-Z0-9]+$/i.test(b.url || "") || (b.descricao || "").toLowerCase().includes('front') || (b.url || "").toLowerCase().includes('front');
      
      if (isFrontA && !isFrontB) return -1;
      if (!isFrontA && isFrontB) return 1;
      return 0;
  }) : [];

  const fotoPrincipal = sortedFotos?.[0]?.url
    ? resolveImageUrl(sortedFotos[0].url)
    : null;
  const fotoSecundaria = sortedFotos?.[1]?.url
    ? resolveImageUrl(sortedFotos[1].url)
    : null;

  const imagemAtual = isHovered && fotoSecundaria ? fotoSecundaria : fotoPrincipal;

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/produto/${createSlug(produto.nome_produto)}`}
        onClick={() => window.scrollTo(0, 0)}
      >
        {imagemAtual ? (
          <img
            src={imagemAtual}
            alt={produto.nome_produto}
            className={styles.produtoImage}
            style={{ transition: 'opacity 0.2s ease-in-out' }}
            onError={handleImgError}
          />
        ) : (
          <div className={styles.produtoPlaceholder}>Sem imagem</div>
        )}

        <div className={styles.produtoInfo}>
          <span className={styles.produtoTag}>
            {produto.id_categoria === 1
              ? 'Exclusivo'
              : produto.id_categoria === 2
              ? 'Times'
              : 'Geral'}
          </span>
          <h3 className={styles.produtoNome}>{produto.nome_produto}</h3>
          <p className={styles.produtoPreco}>
            R$ {parseFloat(produto.preco).toFixed(2)}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function RelatedProducts({ products, baseUrl, createSlug }) {
  if (products.length === 0) return null;

  return (
    <section className={styles.relatedSection}>
      <h2>VOCÊ TAMBÉM PODE GOSTAR</h2>
      <div className={styles.relatedGrid}>
        {products.map((p) => (
          <RelatedProductCard
            key={p.id_produto}
            produto={p}
            baseUrl={baseUrl}
            createSlug={createSlug}
          />
        ))}
      </div>
    </section>
  );
}
